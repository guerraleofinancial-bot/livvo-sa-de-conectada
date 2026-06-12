# Livvo Ads — Patrocínio e Destaque

Nova fonte de receita: venda de visibilidade. Mantém o stack atual (TanStack Start + Lovable Cloud + Healthtech Refinado), pagamentos seguem mockados (prep para Paddle real depois).

## 1. Banco de dados (1 migration)

Novas tabelas em `public`:

- **featured_plans** — catálogo de planos vendáveis. Campos: `code` (slug único), `name`, `kind` (enum `premium`, `regional`, `category`, `perfil_premium`), `price_cents`, `duration_days`, `description`, `perks` (JSONB: galeria ampliada, vídeo, etc.), `active`.
- **featured_subscriptions** — contratação ativa por prestador/empresa. Campos: `plan_id`, `professional_id` (nullable), `company_id` (nullable, XOR com professional_id), `status` (`ativo`, `pausado`, `expirado`, `cancelado`), `starts_at`, `ends_at`, `amount_paid_cents`, `auto_renew`, `payment_ref`.
- **featured_regions** — escopos regionais de uma assinatura (N:1 com subscription). Campos: `subscription_id`, `state`, `city` (nullable = estado inteiro), `district` (nullable).
- **featured_categories** — escopos por categoria. Campos: `subscription_id`, `specialty_id` (nullable), `company_type` (nullable: `clinica`, `laboratorio`, `estetica`, …).
- **ad_impressions** — métricas leves. Campos: `subscription_id`, `professional_id`/`company_id`, `kind` (`impression`, `click`, `booking`), `viewer_id` (nullable), `context` (JSONB: query, city, specialty), `occurred_at`. Particionável depois.
- **profiles_premium_assets** — extensão de perfil para quem tem `perfil_premium`. Campos: `professional_id`/`company_id`, `video_url`, `extra_photos` (TEXT[]), `highlight_cta_text`.

Alterações:
- `professionals` e `companies`: ganham `is_premium` BOOL gerado por trigger a partir de subscription ativa do tipo `perfil_premium` (ou view materializada simples — usaremos view).

Funções SQL:
- `active_featured(_target_kind, _target_id)` → set de subscriptions ativas (now() entre starts_at e ends_at, status=ativo).
- `search_providers_ranked(_state, _city, _specialty_slug, _q, _limit)` → retorna profissionais ordenados em 4 grupos (premium, regional, categoria, orgânico) com `rank_group` + tie-breakers (rating, distância se passar lat/lng, conversion_rate calculado das impressions).
- `ads_revenue_summary(_from, _to)` → receita de anúncios no período.

RLS + GRANTs em tudo. Plans: leitura `authenticated`. Subscriptions: leitura pelo dono ou admin; insert via server function (service role). Impressions: insert por server function, leitura pelo dono/admin.

Seed: 4 `featured_plans` (Premium Search R$ 299/30d, Regional R$ 149/30d, Categoria R$ 199/30d, Perfil Premium R$ 99/30d) + 2 assinaturas demo na seed atual para o ranking aparecer já.

## 2. Server functions

Arquivo novo `src/lib/livvo/ads.functions.ts`:
- `listFeaturedPlans()` — público (autenticado).
- `subscribeToPlan({ planId, targetType, targetId, regions?, categories? })` — valida ownership, cria subscription, debita carteira/marca pago (mock), grava ledger entry `ad_purchase`.
- `cancelSubscription(id)` — soft cancel.
- `myActiveSubscriptions(targetType, targetId)`.
- `trackAdEvent({ subscriptionId, kind, context })` — insert em `ad_impressions`.
- `adsAnalyticsForProvider(targetType, targetId, range)` — impressões/cliques/agendamentos/conversão agregados.
- Admin: `adminListSubscriptions`, `adminUpsertPlan`, `adminAdsRevenueReport` (chama `ads_revenue_summary`).

Atualizar `payment.functions.ts`:
- Quando `createPaidAppointment` resolve um profissional vindo de busca com `featured_subscription_id` no contexto, dispara `trackAdEvent` (`booking`).

Atualizar `admin.functions.ts`:
- `platformRevenueReport(range)` retorna `{ commissions, ads, total }`.

## 3. Busca com ranking patrocinado

Refatorar `app.buscar.tsx`:
- Substitui a query Supabase direta por chamada a `search_providers_ranked` (RPC).
- Renderiza 4 seções visualmente:
  1. **Patrocinado** com selo amarelo "Patrocinado" + borda destaque.
  2. **Em destaque na sua região** (se houver e filtro de cidade casar).
  3. **Em destaque em {categoria}** (se filtro de specialty casar).
  4. **Resultados** (orgânicos).
- Em cada card sponsored, dispara `trackAdEvent('impression')` on mount (debounced/uma vez por sessão+id) e `'click'` no Link.
- Card premium: layout maior, foto destacada, selo Premium azul, CTA "Agendar agora".

## 4. Painel do prestador — Impulsionar Perfil

Nova rota `src/routes/_authenticated/pro.impulsionar.tsx`:
- KPIs do mês: impressões, cliques, agendamentos, taxa de conversão (cliques→agendamentos).
- Lista de assinaturas ativas com data de expiração, botão pausar/cancelar.
- Catálogo de planos disponíveis com CTA "Contratar".
- Modal de contratação: escolhe escopo (regiões/categorias quando aplicável), confirma valor, simula pagamento.
- Adicionar item "Impulsionar" no menu pro (em `pro.tsx` ou nav lateral).

## 5. Painel admin — Anúncios

Aba nova em `admin.tsx` "Anúncios & Receita":
- CRUD de `featured_plans` (nome, tipo, valor, duração, ativo).
- Lista de assinaturas ativas com filtro por tipo/prestador, ação cancelar.
- Card de receita: comissões vs anúncios vs total no período (seletor 7d/30d/90d).
- Top 10 prestadores por gasto em anúncios.

## 6. Perfis Premium

- `app.profissional.$id.tsx` e `app.empresa.$id.tsx`:
  - Se `is_premium`, mostra selo Premium, hero ampliado, galeria extra de `profiles_premium_assets`, embed de vídeo (YouTube/MP4), CTA destacado.
  - Não-premium fica com layout atual.

## 7. UI / Design

- Selo `<Badge variant="sponsored">` amarelo âmbar (token novo `--sponsored`), selo `<Badge variant="premium">` em gradient primary.
- Cards sponsored: borda 1px com `--sponsored` + label superior pequena "Patrocinado".
- Sem mudanças no design system geral.

## 8. Memory

Salvar em `mem://features/ads` a regra de ordenação (4 grupos, tie-breakers) e que ads receita é segunda fonte oficial junto da comissão.

## 9. Fora de escopo agora

- Bidding/leilão de posições (preço fixo por plano por enquanto).
- Segmentação por horário/idade.
- Integração real Paddle (mock continua).
- Limites de impressão por dia (sem caps por ora).

Confirma para eu executar tudo?
