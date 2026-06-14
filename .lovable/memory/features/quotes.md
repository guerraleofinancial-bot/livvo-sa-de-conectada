---
name: Orçamentos (CRM Onda 1)
description: Módulo de orçamentos vinculado ao CRM — criação pelo parceiro, aprovação pelo paciente, sincroniza status no funil
type: feature
---

## Tabelas
- `quotes`: professional_id ou company_id (CHECK), patient_id, author_id, assigned_user_id, status (`quote_status`), title, notes (público p/ paciente), internal_notes, subtotal/discount/total (auto-calc), valid_until, sent_at/viewed_at/decided_at, decision_reason, converted_appointment_id, share_token.
- `quote_items`: vinculado a `services` (opcional) ou item avulso. Trigger `recompute_quote_totals` recalcula `quotes.subtotal/total` em qualquer mudança; `quote_item_line_total` calcula `total = qty * unit_price` por linha.

## Status (`quote_status`)
rascunho → enviado → visualizado → aprovado | recusado | expirado

## Triggers
- `trg_quotes_status_sync` (BEFORE UPDATE): preenche sent_at/viewed_at/decided_at conforme status muda.
- `trg_quotes_effects` (AFTER): atualiza `crm_patient_relationships.status_suggested` (enviado→orcamento_enviado, visualizado/aprovado→aguardando_decisao) — só substitui status se NÃO sobrescrito; dispara notificações in-app (`quote_sent` p/ paciente; `quote_viewed/approved/rejected` p/ parceiro).

## Permissões
- Paciente: SELECT em seus quotes.
- Profissional dono OU `assigned_user_id` OU staff de empresa (`is_company_staff` = owner/admin/recepcionista) OR admin: gerir.
- `quote_items` segue regra do quote pai.

## CRM enums novos
- `crm_status`: + contato_realizado, orcamento_enviado, aguardando_decisao, fidelizado.
- `company_role`: + recepcionista.
- `notification_event`: + lead_created, quote_sent, quote_viewed, quote_approved, quote_rejected.
- `patient_origin` (novo): busca_organica, anuncio_patrocinado, indicacao, cadastro_direto, importado, perfil_publico, campanha, outros.

## Dashboard comercial
- RPC `crm_dashboard(_pro, _from, _to)` → jsonb com leads, appointments_created/done, cancellations, quotes_sent/approved, revenue, avg_ticket, patients_active/inactive, conversion_rate. Usada em `/pro` (home).

## Onda 2 (não implementado ainda)
- Drag-and-drop no Kanban; calculadora de procedimentos; recuperação automática (90d/cancelados/orçamentos não aprovados); papéis Recepcionista/Profissional com filtragem por assigned; expirar orçamentos via pg_cron; conversão orçamento → agendamento.
