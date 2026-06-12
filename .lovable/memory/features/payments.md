---
name: Camada de pagamentos
description: PaymentProvider (Mock atual, Pagar.me preparado), split server-side, webhook público, fluxo agendado→pago→realizado→liberado→repassado→reembolsado
type: feature
---

- `src/lib/livvo/payment.ts` define a interface `PaymentProvider` (createCharge, confirmPayment, refundPayment, calculateSplit, createPayout, getPaymentStatus, handleWebhook).
- `MockPaymentProvider` é usado no checkout simulado e aceita `simulate: approved|declined|pending`. PIX simulado sempre fica pendente.
- `PagarMePaymentProvider` é esqueleto — não há chaves no código. Secrets futuras (server-only): `PAGARME_API_KEY`, `PAGARME_WEBHOOK_SECRET`. Recipients ficam em `provider_payout_accounts.pagarme_recipient_id` (a criar).
- Fábrica: `getPaymentProvider()` lê `process.env.LIVVO_PAYMENT_PROVIDER` (`mock`|`pagarme`); default `mock`.
- Split é calculado SEMPRE no servidor via `effective_commission_percent` (override pro → empresa → global 15%). Durante a janela `zero_commission_start/end` retorna 0%, mas planos patrocinados continuam pagos normalmente.
- `payments` tem `gateway`, `gateway_transaction_id`, `gateway_payment_id`, `gross_amount`, `commission_amount`, `net_amount`, `recipient_id`, `payout_status`, `refund_status`, `refunded_at`, `webhook_payload`, `payment_method`. `appointments` ganhou `gateway` e `gateway_transaction_id`.
- Webhook público: `src/routes/api/public/payments.webhook.ts` (POST), prefixo `/api/public/*` bypassa auth Lovable; query `?gateway=mock|pagarme` escolhe o provider; persiste payload em `payment_webhook_events` (RLS admin-only).
- Fluxo financeiro mantido: agendado → pago → realizado → liberado_repasse → repassado → reembolsado. Repasse só após `markAppointmentCompleted` (não automático no pagamento).
- Tabela `payment_webhook_events` (admin SELECT via RLS) é o ponto de auditoria; nenhum side-effect roda sem validação de assinatura do provider real.
