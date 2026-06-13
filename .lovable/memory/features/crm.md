---
name: CRM, notificações e automações
description: Módulo de CRM por profissional, central de notificações, preferências de canais e jobs de automação (lembrete 24h, pedido de avaliação, retorno 90d)
type: feature
---

## Tabelas
- `crm_patient_relationships` (UNIQUE professional_id+patient_id): status, status_suggested, status_overridden, status_changed_at/by, last/next_appointment_at, appointments_count, total_revenue.
- `crm_patient_notes`: visibility = `private` (só profissional dono) ou `clinic` (membros owner/admin da empresa). NÃO é prontuário clínico — apenas notas comerciais.
- `notification_preferences`: in_app/email/whatsapp + events_muted[] + whatsapp_phone. Email/WhatsApp começam **desligados** (arquitetura preparada).
- `notifications` (estendida): + `event` (enum) e `metadata` jsonb.
- `automation_jobs`: kind ∈ {reminder_24h, review_request, retention_90d}, status ∈ {queued, sent, failed, cancelled}, run_at.

## Triggers (automático)
- `trg_crm_appt_sync` em appointments: recalcula relationship, dispara notificações (novo agendamento, confirmação, cancelamento, reagendamento) e enfileira jobs (reminder 24h, review 2h após realizada, retention +90d).
- `trg_msg_notify` em messages: notifica destinatário.
- `trg_review_notify` em reviews: notifica profissional.

## Status do paciente
- Sistema sugere via `derive_crm_status`. Profissional pode sobrescrever via RPC `crm_set_status` (marca `status_overridden=true`). UI mostra status sugerido se sobrescrito.

## Drain de automações
- Rota pública `/api/public/automation/run` (POST, header `apikey`=anon) processa jobs queued com run_at<=now, cria notificações in-app.
- Conectar via pg_cron quando quiser ativar (não configurado ainda).

## Canais externos
- Preparado para Resend / SendGrid / WhatsApp Business / Evolution / Z-API. Não integrar agora — apenas adicionar driver no automation.run handler quando preferences.email/whatsapp = true.
