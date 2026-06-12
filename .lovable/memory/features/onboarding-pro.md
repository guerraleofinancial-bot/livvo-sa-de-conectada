---
name: Onboarding profissional (wizard)
description: Wizard de 7 etapas para cadastro de profissional, com upload de mídia, KYC, horários semanais e programa de 90 dias de comissão zero.
type: feature
---
Wizard em `src/routes/_authenticated/onboarding-pro.tsx` com 7 etapas: Identidade visual, Identificação, Experiência, Contato, Endereço (autopreenche via ViaCEP), Horários (professional_business_hours), Serviços & Documentos.

Buckets de Storage:
- `provider-media` (privado, path `{userId}/...`) — URLs são signed URLs de 1 ano em campos avatar_url/logo_url/cover_url.
- `provider-documents` (privado) — leitura apenas do dono e admin.

Programa de Comissão Zero: ao admin chamar `approve_professional(id)`, gravamos `zero_commission_start=now()` e `zero_commission_end=now()+90d`. A função `effective_commission_percent` retorna 0 enquanto agora estiver dentro da janela.
