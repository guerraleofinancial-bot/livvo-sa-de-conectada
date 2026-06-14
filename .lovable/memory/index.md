# Project Memory

## Core
Livvo = marketplace de saúde **presencial** (consultas/exames/procedimentos, médica + odontológica + estética facial). NUNCA telemedicina.
Mensagem-chave: "Encontre, agende e pague consultas, exames e procedimentos em um só lugar."
Duas fontes de receita: comissão sobre agendamentos + venda de visibilidade (anúncios patrocinados).
Pagamentos via PaymentProvider (Mock hoje, Pagar.me preparado). Toda lógica financeira no servidor.
Nomenclatura híbrida: "Parceiro" em institucional/comercial; "Profissional" só em área logada PF e schema.
Páginas institucionais públicas: usar <MarketingShell />. Nunca duplicar nav/footer.
Stack: TanStack Start + Lovable Cloud.
Design: Healthtech Refinado, mobile-first, paleta primary azul + health verde + sponsored âmbar.

## Memories
- [Ads & destaque](mem://features/ads) — Ordenação patrocinado/regional/categoria/orgânico, kinds de plano, tracking de eventos
- [Pagamentos](mem://features/payments) — PaymentProvider (Mock/Pagar.me), split server-side, webhook em /api/public/payments/webhook, fluxo financeiro
- [Onboarding profissional](mem://features/onboarding-pro) — Steps, uploads, documentos, BusinessHoursGrid
- [Nomenclatura](mem://preferences/nomenclatura) — Paciente/Parceiro/Administrador, regras híbridas, serviços
- [MarketingShell](mem://preferences/marketing-shell) — Nav + footer compartilhados das páginas públicas
- [CRM e Notificações](mem://features/crm) — Funil de pacientes, notas privadas/clínica, prefs de canais, automações (24h, review, retenção 90d), trigger crm_appointment_sync
- [Orçamentos](mem://features/quotes) — Módulo de quotes+items, status, triggers que sincronizam CRM e notificações, RPC crm_dashboard, novos enums (crm_status/company_role/notification_event/patient_origin)
