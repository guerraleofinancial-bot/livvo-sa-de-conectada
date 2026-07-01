
# Fase 2 — Evolução do Ecossistema Livvo

Escopo enorme (11 prioridades). Para respeitar a Regra de Ouro (alto impacto + baixa complexidade), não quebrar nada e evoluir de forma incremental, proponho **4 ondas** encadeadas. Cada onda compila, é testável e reaproveita máximo do que já existe (`professionals`, `companies`, `favorites`, `featured_*`, `audit_logs`, `search_providers_ranked`, `admin/*`, help-center, StatusBadge, livvo-card).

Antes de começar quero seu OK na ordem — se preferir outra sequência, ajusto.

---

## Onda A — Perfis Públicos Premium + Compartilhamento (P1 + P3)

Rotas públicas SSR-friendly com SEO, OG, JSON-LD, botões de ação sociais.

- `src/routes/p.$slug.tsx` — perfil público do profissional
  - Loader server-fn público → `professionals + profiles + specialty + business_hours + reviews + featured_subscriptions`
  - Seções: hero (foto/banner/nome/especialidade/`VerifiedBadge`), bio, conselho+UF, idiomas, procedimentos, exames, convênios, horários, mapa (link `https://maps.google.com/?q=lat,lng` sem chave paga), avaliações, galeria (`provider-media`), FAQ, CTA "Agendar" → `/profissional/$id`, favoritar, share
  - `head()`: title, description, og:*, canonical, JSON-LD `Physician`
- `src/routes/e.$slug.tsx` — perfil público da empresa (mesmo padrão, JSON-LD `MedicalBusiness`)
- `src/components/livvo/share-menu.tsx` — WhatsApp / Instagram / Facebook / LinkedIn / e-mail / copiar link / QR (usa `qrcode` já client-side)
- `src/components/livvo/favorite-button.tsx` — toggle contra `favorites` (tabela já existe)
- Slug: campo `slug text unique` em `professionals` e `companies` + migração para gerar retroativamente a partir de `full_name`/`name` (unaccent + kebab). Fallback: aceitar UUID em `p.$slug` para nunca 404.

## Onda B — Busca Inteligente + Favoritos/Recentes (P2 + P4)

- Estender `search_providers_ranked` com params opcionais: `_gender`, `_language`, `_convenio`, `_price_min`, `_price_max`, `_child_friendly`, `_open_now`, `_available_today`, `_available_tomorrow`. Compatibilidade preservada (defaults NULL).
- Nova `search_procedures(_q,_city,_state)` unindo `services` + `specialties`.
- UI: refatorar `src/routes/buscar.tsx` (ou equivalente) com chips de filtro combináveis, ordenação (mais próximo, melhor avaliado, mais agendado).
- `favorites`: adicionar `target_type` enum `professional|company|specialty|patient` (já tem `professional_id/company_id`; só ampliar). Views:
  - Paciente: `/app/favoritos` (tabs Prof/Empresa/Especialidade + Recentes + Mais visitados via `audit_logs` já existente)
  - Profissional: `/pro/favoritos` (pacientes salvos)
  - Empresa: `/empresa/favoritos` (profissionais salvos)

## Onda C — Admin Master + Moderação + Analytics + CMS + Destaques (P5 + P6 + P7 + P8 + P11)

Consolida a área `/admin` reaproveitando `SettingsCenter`, `AuditLogsTab`, `AdminGrowthCharts`.

- **Admin**: novas abas em `SettingsCenter` — Marketplace, Cobranças, Comissões, Assinaturas, Destaques, SEO, CMS, FAQ, Páginas, Integrações, Conselhos, Documentação. Cada aba é lazy component; sem breaking changes nas atuais.
- **Moderação**: tabela nova `moderation_actions (id, target_type, target_id, action enum(approve|reject|request_docs|suspend|block), reason, created_by, created_at)` + `reports (id, reporter_id, target_type, target_id, reason, status, created_at)`. UI em `/admin/moderacao` com filtro por status. Todo action grava em `audit_logs` (já existe).
- **CMS**: tabela `cms_blocks (key text pk, title, body jsonb, updated_at, updated_by)` + hook `useCmsBlock(key)` com fallback ao texto atual hardcoded (não quebra homepage se vazio). Editor rich-text simples (`textarea` + markdown render).
- **Destaques (P7)**: já existe `featured_plans/subscriptions/regions/categories`. Só adicionar UI admin para criar planos e revisar campanhas ativas + slot "Banner Premium" na home usando `is_provider_premium`.
- **Analytics (P8)**: `/pro/analytics` e `/empresa/analytics` agregando `ad_impressions`, `audit_logs` (page_view), `appointments`, `favorites`, `wallet_transactions`, `payments`. Gráficos com Recharts já usado em `AdminGrowthCharts`.

## Onda D — Parceiros Fundadores + Central de Configurações (P9 + P10)

- **Parceiros Fundadores (P9)**: já há `zero_commission_start/end` em `professionals`. Criar:
  - View badge "Fundador" (mostrar quando `zero_commission_end > now()`)
  - Página `/pro/fundador` — benefícios, tempo restante, exposição extra (bump em `search_providers_ranked` opcional com flag)
  - Toggle admin em `/admin/parceiros-fundadores`
- **Central de Configurações (P10)**: nova rota `/pro/configuracoes` (e `/empresa/configuracoes`) organizada em navegação lateral por módulos (Conta, Perfil, Empresa, Equipe, Agenda, CRM, Cobranças, Financeiro, Marketplace, Notificações, Segurança, Integrações, Assinatura, Privacidade). Cada aba é wrapper que **importa telas já existentes** (`pro.agenda config`, `notification_preferences`, `provider_payout_accounts`, etc.) — zero duplicação.

---

## Regras aplicadas em todas as ondas

- Reutilização: `VerifiedBadge`, `StatusBadge`, `livvo-card`, `EmptyState`, `HelpHint`, `SettingsCenter`, `AuditLogsTab`, `search_providers_ranked`, `favorites`, `featured_*`, `audit_logs`.
- Sem alteração de RLS existente; toda nova tabela ganha RLS + GRANTs desde o INSERT.
- Server-fns em `*.functions.ts`; loaders públicos usam client publishable + policies `TO anon` narrow.
- SEO: `head()` por rota leaf com title/desc/og/canonical + JSON-LD.
- Sem novas dependências pesadas (uso `qrcode` só se ainda não estiver instalado; caso não, faço fallback SVG in-house).

## Detalhes técnicos por onda

- **A**: 1 migração (slugs + índice unique), 2 rotas públicas, 3 componentes compartilháveis, ~600 linhas.
- **B**: 1 migração (RPC ampliada), 1 refactor de página, 3 rotas de favoritos, ~500 linhas.
- **C**: 2 migrações (`moderation_actions`, `reports`, `cms_blocks`), extensão do `SettingsCenter`, 2 dashboards analytics, ~1200 linhas.
- **D**: 0 migrações, 2 novas centrais + página fundador, ~400 linhas.

## Fora de escopo desta fase (para não inflar)

- Integrações externas reais (Instagram/Facebook auth, WhatsApp Business API) — usamos apenas share links.
- Pagamento real de destaques — mantém mock atual pronto para Paddle.
- Editor visual drag-and-drop do CMS — entregue como markdown/JSON key-value.

---

**Confirma a ordem A → B → C → D?** Ou prefere começar por outra prioridade (ex.: Admin Master antes dos Perfis Públicos)?
