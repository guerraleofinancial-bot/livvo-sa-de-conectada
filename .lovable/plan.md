
# Plano estrutural Livvo v2 (antes de executar)

Vou incorporar tudo numa única migration grande + ajustes nas server functions e telas já planejadas, mantendo o Healthtech Refinado e o stack atual. Nada de pagamento real (mock continua), mas a arquitetura fica pronta para Stripe Connect e expansão nacional.

## 1. Banco de dados — novas tabelas

- **company_units** — unidades físicas de uma `company`. Campos: `company_id`, `name` (ex.: "Unidade Renascença"), endereço completo (`address_street`, `number`, `district`, `city`, `state`, `zip`, `country`), `lat`, `lng`, `phone`, `business_hours` (JSONB com horário por dia da semana), `active`.
- **resources** — recursos físicos agendáveis. Campos: `unit_id`, `name` ("Sala 2", "Ultrassom GE"), `kind` (enum: `sala`, `equipamento_ultrassom`, `equipamento_tomografia`, `equipamento_laser`, `sala_coleta`, `outro`), `description`, `active`.
- **service_resources** — quais recursos um `service` exige (N:N). Permite "ultrassom abdominal precisa de sala_coleta? não, precisa de ultrassom".
- **unit_professionals** — quais profissionais atendem em cada unidade (N:N) com `default_unit` boolean.
- **resource_blocked_slots** — bloqueios de recurso (manutenção, indisponibilidade).
- **service_packages** — extensão para serviços do tipo `pacote`: `service_id`, `sessions_total`, `validity_days`.
- **package_purchases** + **package_sessions** — compra de pacote por paciente, com saldo de sessões e consumo registrado.
- **coupons** — código, tipo (`percent`/`fixed`), valor, validade, limite de uso, restrição (global, por company, por service), `min_amount`.
- **coupon_redemptions** — uso de cupom por paciente/agendamento.
- **cashback_rules** + **cashback_balances** + **cashback_transactions** — estrutura pronta, sem UI agora.
- **campaigns** — campanha promocional (nome, período, regras JSONB), referenciada por coupons opcionalmente.
- **cancellation_policies** — política reutilizável: `hours_before_full_refund`, `hours_before_partial_refund`, `partial_percent`, `non_refundable_after_confirmation` bool.
- **payout_batches** + **payout_items** — lote de repasse com itens (appointment → valor líquido). Substitui o `payouts` simples atual.
- **provider_payout_accounts** — dados bancários/PIX do prestador (mockado por ora, prep para Stripe Connect).

## 2. Alterações em tabelas existentes

- **companies**: `commission_percent_override` (nullable), `cancellation_policy_id` (nullable), `default_country` `'BR'`.
- **professionals**: `commission_percent_override` (nullable), `cancellation_policy_id` (nullable), `default_unit_id` (nullable).
- **platform_settings**: vira a fonte da comissão global (15%) + política global de cancelamento padrão.
- **services**: `type` enum (`consulta`, `exame`, `procedimento`, `pacote`), `requires_resource_kind` (nullable, dica de UI), `unit_scope` (`any` | `specific`).
- **appointments**:
  - `unit_id` (qual unidade),
  - `resource_id` (qual recurso reservado, nullable se só profissional),
  - `package_purchase_id` (consumo de pacote),
  - `coupon_code` + `discount_amount`,
  - `financial_status` enum substituindo o atual `payment_status`: `agendado`, `pago`, `realizado`, `liberado_repasse`, `repassado`, `reembolsado`.
  - `released_at` (quando virou liberado p/ repasse), `payout_item_id` (quando entrou num lote).
- **reviews**: já tem `status` no plano anterior.

## 3. Geolocalização e busca

- Campos `lat`/`lng` em `company_units` e `professionals` (consultório próprio).
- Função SQL `nearby_units(lat, lng, radius_km)` usando fórmula de haversine (sem precisar de PostGIS; suficiente para MVP nacional).
- Filtros de busca por estado, cidade, bairro e "perto de mim" (browser pede geolocation).
- Tabela `cities` opcional? Não — basta normalizar strings + `state` (UF) em `company_units`. Tabela só atrapalha agora.

## 4. Regras de comissão

Função SQL `effective_commission_percent(_professional uuid, _company uuid)`:
1. Se profissional tem override → usa.
2. Senão se empresa do profissional tem override → usa.
3. Senão `platform_settings.commission_percent`.

`createPaidAppointment` chama essa função.

## 5. Regras de cancelamento

Função SQL `effective_cancellation_policy(_professional, _company)` retorna `cancellation_policies` row (com fallback para uma policy "default" criada pela migration).

`cancelAppointment` aplica a policy: integral, parcial ou zero reembolso, e gera as linhas corretas no ledger.

## 6. Fluxo financeiro novo

Status `appointments.financial_status` muda assim:
- Checkout pago → `pago` (ledger: +bruto e -comissão como hoje, mas **bloqueado para repasse**).
- Prestador marca atendimento como realizado (ou job diário marca após `scheduled_at + duration + 24h`) → `realizado`.
- Após X dias (configurável em `platform_settings.release_after_days`, default 2) → `liberado_repasse`.
- Admin gera **payout_batch** agrupando itens `liberado_repasse` de um prestador → itens viram `repassado`, batch fica `pendente` → admin marca como `pago` (mock) → ledger ganha linha `repasse`.
- Cancelamento dentro da janela em qualquer estado anterior a `repassado` → `reembolsado` + estorno.

Função `wallet_balance` já existe; vou adicionar `wallet_releasable(_provider)` = soma só de `liberado_repasse`.

## 7. Pacotes

- Paciente compra pacote no checkout (tipo `pacote`) → cria `package_purchases` com `sessions_remaining = sessions_total`.
- Ao agendar uma sessão consumindo pacote: `appointment.package_purchase_id` setado, sem novo pagamento, decremento de `sessions_remaining`, ledger não duplica receita.
- Validade respeitada na hora de agendar.

## 8. Cupons

- Aplicado no checkout antes do cálculo de comissão.
- Comissão calculada sobre `gross - discount` (regra padrão; configurável depois).
- `coupon_redemptions` registra uso.

## 9. Server functions impactadas

- `payment.functions.ts`:
  - `createPaidAppointment` ganha `unitId`, `resourceId`, `couponCode`, `packagePurchaseId`; usa novas funções SQL.
  - novo `markAppointmentCompleted` (prestador).
  - novo `releaseCompletedAppointments` (cron-like, chamado pelo admin por enquanto).
- `admin.functions.ts`:
  - `createPayoutBatch(providerId)` agrupando `liberado_repasse`.
  - `markPayoutBatchPaid(batchId)`.
  - CRUD de `cancellation_policies`, `coupons`, `campaigns`.
  - `setPartnerCommission(target, percent)` (professional ou company).
- Novo `units.functions.ts`: CRUD de unidades, recursos, vínculo profissional↔unidade.
- Novo `availability.functions.ts`: `getAvailableSlots(professionalId, serviceId, unitId, date)` cruzando disponibilidade do profissional, bloqueios, agenda existente E disponibilidade do recurso exigido pelo serviço.

## 10. UI (impacto adicional)

- **Paciente**:
  - Seletor de unidade no perfil da empresa/profissional.
  - Filtro "perto de mim" + estado/cidade na busca.
  - Campo cupom no checkout, exibição de desconto e total.
  - "Meus pacotes" no perfil com saldo de sessões.
- **Prestador**:
  - Botão "marcar como realizado" na agenda.
  - Aba "Repasses" mostrando `liberado_repasse`, `em lote`, `pago`.
- **PJ owner**:
  - Painel `/pro/empresa`: unidades (CRUD), recursos (CRUD), equipe (convidar/atribuir a unidades), política de cancelamento e comissão override.
- **Admin**:
  - Aba "Comissões" com override por parceiro.
  - Aba "Cupons & Campanhas" (CRUD básico).
  - Aba "Repasses": fila de prestadores com saldo liberado → gerar lote → marcar pago.
  - Aba "Políticas de cancelamento" (CRUD).

## 11. Demo data atualizado

`seedDemoData` passa a criar:
- 1 clínica multi-unidade (3 unidades: Renascença, Cohama, Calhau), 1 laboratório (1 unidade), 1 estética (2 unidades).
- 6 recursos (2 ultrassons, 1 tomógrafo, 1 laser, 2 salas de coleta).
- 14 serviços incluindo 2 pacotes (10 sessões fisio, 10 laser).
- Profissionais distribuídos entre unidades com overrides de comissão diferentes.
- Cupom `LIVVO10` (10% off) ativo.
- Agendamentos em todos os estados financeiros (pago, realizado, liberado, repassado, reembolsado) + 1 pacote em uso (3/10 sessões consumidas).

## 12. O que NÃO entra ainda (apenas estrutura no banco)

- Tela de cashback (tabelas criadas).
- Tela de campanhas promocionais avançadas além do CRUD básico de cupom.
- Onboarding dedicado de dados bancários reais (campos existem em `provider_payout_accounts`, UI mínima).
- Integração real Stripe Connect / Paddle — confirmado mock.

## 13. Tamanho estimado

1 migration grande (~15 tabelas novas, ~10 colunas adicionadas, 4 funções SQL, RLS+GRANTs em tudo) + ~30 arquivos novos/editados de UI e server functions + seed atualizado.

Confirma para eu executar tudo de uma vez?
