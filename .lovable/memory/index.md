# Project Memory

## Core
Livvo = marketplace de saúde **presencial** (consultas/exames/procedimentos, médica + odontológica + estética facial). NUNCA telemedicina.
Duas fontes de receita: comissão sobre agendamentos + venda de visibilidade (anúncios patrocinados).
Pagamentos via PaymentProvider (Mock hoje, Pagar.me preparado). Toda lógica financeira no servidor.
Stack: TanStack Start + Lovable Cloud.
Design: Healthtech Refinado, mobile-first, paleta primary azul + health verde + sponsored âmbar.

## Memories
- [Ads & destaque](mem://features/ads) — Ordenação patrocinado/regional/categoria/orgânico, kinds de plano, tracking de eventos
- [Pagamentos](mem://features/payments) — PaymentProvider (Mock/Pagar.me), split server-side, webhook em /api/public/payments/webhook, fluxo financeiro
