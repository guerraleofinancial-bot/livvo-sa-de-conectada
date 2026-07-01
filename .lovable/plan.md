# Premium Experience Sprint — Livvo V2

Elevar a Livvo ao padrão Stripe/Linear/Airbnb sem tocar em regra de negócio, banco ou APIs. Toda a evolução acontece em componentes, tokens e composição de telas. Reaproveita 100% do que já foi implementado (ProfessionalCard, CompanyCard, livvo-* utilities, VerifiedBadge, share-menu, favorite-button, help-hint, etc.).

## Critério mestre por tela (checklist Livvo V2)
Antes de considerar qualquer tela concluída ela precisa responder **SIM** para:
1. Comunica valor em ≤ 10s?
2. Transmite confiança (verificação, segurança, prova social)?
3. Hierarquia clara (o que é primeiro, o que clicar)?
4. Sensação de tecnologia e cuidado (spacing, tipografia, sombras)?
5. Marketplace vivo (sinais reais de movimento)?

## Onda 1 — Design System unificado (Fases 6, 7, 8, 12, 13)
Alicerce que sustenta todas as telas seguintes. Sem essa base as fases visuais dispersam.

- Refinar `src/styles.css`: escala tipográfica (`livvo-display`, `livvo-h1..h3`, `livvo-body`, `livvo-caption`), escala de radius, escala de shadows já iniciada, `livvo-focus-ring` global, transição padrão `livvo-motion`.
- Criar `src/components/livvo/ui/` com primitivas compartilhadas:
  - `SectionHeader` (eyebrow + título + trailing) — hoje duplicado em várias telas
  - `LivvoBadge` (variants: verified, premium, sponsored, top, fast, new, hot)
  - `StatChip`, `EmptyState`, `SkeletonBlock`, `KpiTile`, `SplitCta`
  - `PageHeader` (hero unificado com variants: gradient, primary, health, neutral)
- Padronizar botões shadcn com nova variante `premium` (gradient sutil + shadow-glow no focus).
- Padronizar `Input`, `Select`, `Dropdown`, `Dialog`, `Sheet` com radius/shadow/tipografia consistentes.
- Auditar e substituir usos ad-hoc de `bg-primary text-primary-foreground` que replicam hero por `PageHeader`.

## Onda 2 — Home do Paciente (Fase 1, 9, 10)
Transformar `_authenticated/app.index.tsx` em uma home de marketplace com blocos bem definidos, reutilizando queries que já existem:

```text
[Hero de busca + saudação + notificações]
[Chip rail de especialidades]
[Próxima consulta] (quando existir)
[Profissionais em destaque]    ← rank premium/sponsored
[Mais bem avaliados]           ← reuso da query atual
[Atendem hoje]                 ← deriva de professional_availability real
[Clínicas em destaque]         ← rail companies (aprovadas)
[Laboratórios]                 ← filtro type=laboratorio
[Novidades / Recém cadastrados] ← ORDER BY created_at DESC
[Avaliações recentes]          ← reviews.status='publicada' LIMIT 5
[Selos de confiança]           ← “Parceiros verificados”, “Pagamento seguro”, “Dados protegidos”
```

Cada bloco usa `SectionHeader` + rail horizontal (`ProfessionalCard` compact) ou grid. Skeletons por bloco, empty states elegantes.

## Onda 3 — Busca Premium (Fase 2)
`_authenticated/app.buscar.tsx` já foi elevado; agora agrega os filtros novos como camada UI sobre o RPC atual (sem mudar RPC):
- Bar de filtros colapsável (Sheet no mobile, sidebar sticky no desktop).
- Chips: Especialidade, Cidade, UF, Convênio, Faixa de preço, Nota mínima, Verificados, Atendem hoje, Distância (quando geo existir), Ordenação (Recomendado/Preço/Nota/Novos).
- Filtros que dependem apenas de dados já retornados (nota, verificados, preço) aplicam-se client-side; UF/cidade/especialidade continuam via parâmetros do RPC.
- View toggle (lista / grid) e contador vivo de resultados.
- Empty state ilustrativo com sugestões (“Ampliar cidade”, “Remover convênio”).

## Onda 4 — Cards Premium (Fase 3)
`ProfessionalCard` já entregue; ampliar catálogo de badges e ações:
- Badges: `Verified`, `Premium`, `Sponsored`, `TopRated` (nota ≥ 4.8 & count ≥ 20), `FastResponder` (quando existir métrica), `New` (created_at < 30 dias), `HotToday` (agenda hoje).
- Ação rápida no card: Favoritar + Compartilhar (menu já existente) sem navegar.
- Variante `grid` (2 colunas desktop) além de `featured`/`compact`.
- Skeletons já entregues; adicionar `Empty` específico do card list.

## Onda 5 — Landing Profissional (Fase 4)
`app.profissional.$id.tsx` vira uma landing:
- Banner (cover) + avatar sobreposto + selos.
- Seções em navegação sticky (Sobre / Experiência / Procedimentos / Convênios / Valores / Galeria / Avaliações / Horários / Localização).
- Mapa (embed leve via `<iframe>` do OpenStreetMap; sem novo pacote).
- CTA sticky com Agendar + WhatsApp + Compartilhar + QR (reaproveita `share-menu`).
- Barra “Perfil 100%” só para o dono (já existe em marketing) — no público, mostrar “Última atualização em …”.
- Só renderiza seções cujos dados existem; sem inventar campos.

## Onda 6 — Landing Empresa (Fase 5)
`app.empresa.$id.tsx`:
- Hero cover + logo + selo Empresa Aprovada.
- Blocos: Equipe (professionals do owner), Especialidades atendidas, Serviços, Galeria, Horários, Localização, Contato.
- CTAs: Agendar, WhatsApp, Compartilhar.

## Onda 7 — Microinterações & Performance (Fases 6, 11, 12)
- Padronizar `livvo-fade-in`, `livvo-slide-up`, hover-scale sutil, ripple no `Button` premium.
- Skeletons em todas as queries iniciais (home, busca, perfis, agenda pro).
- Lazy load de imagens (`loading="lazy"` + `decoding="async"`) — já parcialmente aplicado.
- Reduzir CLS: reservar altura em cards e hero.
- Rev responsividade em ≥ 4 breakpoints (sm, md, lg, xl) para: home paciente, busca, perfil pro, perfil empresa, dashboard pro, CRM, agenda.

## Onda 8 — Confiança & Marketplace vivo (Fases 9, 10, 14)
- Rodapé de confiança global (paciente): “Parceiros verificados pelo conselho · Pagamento seguro · Dados protegidos pela LGPD”.
- Indicadores derivados de dados reais:
  - “Atende hoje” — cruzamento com `professional_availability` do dia.
  - “Responde rápido” — só se existir métrica (`avg_response_minutes`); caso contrário, não exibir.
  - “Novo parceiro” — created_at < 30d.
  - “Mais procurado” — mais views/agendamentos (usa métricas já registradas em `ad_impressions`/`appointments`).
- Nenhum badge/estatística falso.

## Onda 9 — Polimento final (Fase 13)
Passe de QA visual: espaçamento, alinhamento, tipografia, ícones, cores, sombras. Corrigir inconsistências herdadas do PRO (agenda, CRM, marketing, admin) usando o novo Design System.

## Onda 10 — Aceitação (Fase 14)
Checklist Livvo V2 aplicado tela a tela; captura de screenshots em mobile/desktop; ajustes finais.

## Ordem de execução sugerida
1. Onda 1 (base do DS) — bloqueia todas as outras.
2. Ondas 2 e 3 em paralelo (home + busca) — impacto máximo.
3. Ondas 5 e 6 (landings) — percepção premium por profissional/empresa.
4. Onda 4 (badges/ações do card) — depende do DS finalizado.
5. Ondas 7, 8, 9, 10 — polimento cross-app.

## Regras de execução mantidas
- Sem novas tabelas, RPCs ou colunas: tudo vem de dados existentes.
- Server functions/RLS intactos.
- Reaproveitar componentes já criados (`ProfessionalCard`, `CompanyCard`, `VerifiedBadge`, `share-menu`, `favorite-button`, `HelpHint`, `OnboardingChecklist`).
- Cada tela só é encerrada após passar o checklist Livvo V2.

## Riscos & mitigação
- Escopo grande → entregar por ondas com PRs mentais isolados, sempre navegáveis.
- Regressão em telas PRO/Admin → cada mudança visual global vem acompanhada de smoke via Playwright em rotas críticas.
- Overengineering visual → toda decisão de UI valida contra “aumenta conversão/confiança/velocidade?”.

Ao aprovar este plano começo pela **Onda 1 (Design System unificado)**, que é pré-requisito para todo o resto.
