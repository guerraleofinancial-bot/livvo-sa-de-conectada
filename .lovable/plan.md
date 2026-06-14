# Roadmap Livvo — Execução em 5 Ondas

Mantenho identidade visual, navegação, paleta, tipografia e arquitetura atual. Cada onda é entregue como um lote pequeno, revisável e independente. Abaixo, o que já existe, o que falta, e a ordem de execução.

---

## Diagnóstico rápido do que já existe

| Item | Status |
|---|---|
| Separação Paciente x Profissional (roles `paciente`/`profissional`/`admin`, gate em `/pro`) | ✅ Feito |
| Onboarding profissional 7 etapas + upload de documentos | ✅ Feito |
| Tabela `professional_documents` + bucket privado `provider-documents` | ✅ Feito |
| Status (`pendente`/`em_analise`/`aprovado`/`rejeitado`) + `approve_professional` + 90d zero comissão | ✅ Feito |
| Novo paciente + importação CSV/XLSX + CRM Kanban + dashboard CRM + origem | ✅ Feito (Onda 2 majoritariamente pronta) |
| Orçamentos com itens, descontos, total automático | ✅ Feito |
| Destaques patrocinados (premium/regional/categoria) + ordenação ranqueada | ✅ Feito |
| Avaliações verificadas (ligadas a `appointments.status='realizada'`) | ✅ Feito |
| Notificações internas (agendamento, cancelamento, avaliação, retorno, orçamento) | ✅ Feito |

Logo: o trabalho real concentra-se em **Onda 1 (validação documental forte + selo + responsável técnico + papéis)**, **Onda 3 (painel de desempenho de anúncios + Fundadores + comissão progressiva)** e **Onda 5 (resposta pública, denúncia, ranking)**. Ondas 2 e 4 já estão majoritariamente prontas — só faltam ajustes finos.

---

## Onda 1 — Segurança, credibilidade e estrutura

**Lote 1.1 — Validação documental por conselho (alto impacto, baixa complexidade)**
- Migration:
  - Enum `professional_council` (`CRM`,`CRO`,`CRP`,`CRF`,`CRBM`,`COREN`,`CRN`,`CREFITO`,`CREFONO`,`OUTRO`).
  - Em `professionals`: `council`, `council_number`, `council_state` (UF), `council_document_url`, `council_verified_at`, `council_rejection_reason`, `documents_expire_at`.
  - Novo status `documentacao_vencida` no enum existente de status; job diário marca quem passou de `documents_expire_at`.
  - `is_approved_professional` já existe — estender para também exigir `council_verified_at IS NOT NULL`.
- UI:
  - Etapa "Identificação" do onboarding passa a exigir conselho + número + UF + upload (bloqueia avanço).
  - Admin ganha aba "Validação documental" com aprovar/rejeitar (com motivo).
- Gate de acesso (já em `pro.tsx`) passa a bloquear também quando `council_verified_at` for nulo.

**Lote 1.2 — Selo "Parceiro Verificado Livvo"**
- Componente `<VerifiedBadge council number uf />` exibido em:
  - Card do profissional na busca (`search_providers_ranked` já retorna campos suficientes — adicionar `council`, `council_number`, `council_state` no SELECT).
  - Perfil público `app.profissional.$id.tsx` e `app.empresa.$id.tsx`.
- Filtro "Somente parceiros verificados" na busca.

**Lote 1.3 — Responsável Técnico para PJ**
- Migration: em `companies` adicionar `technical_responsible_name`, `technical_responsible_council`, `technical_responsible_number`, `technical_responsible_state`, `technical_responsible_document_url`.
- Obrigatório quando `companies.type` ∈ {clínica, laboratório, diagnóstico, estética}.
- UI: campo na criação/edição de empresa; bloqueia publicação sem RT validado.

**Lote 1.4 — Papéis operacionais**
- `company_members.role` já tem `owner`/`admin`/`recepcionista`. Adicionar `profissional` e criar policies/UI:
  - Owner/Admin: tudo.
  - Recepcionista: agenda, CRM, orçamentos. Sem financeiro, sem impulsionar.
  - Profissional vinculado: só própria agenda + próprios pacientes.
- Tela "Equipe" em `/pro` (convite por email, definir papel).

**Lote 1.5 — Regras de gating finais**
- Bloquear `pro.impulsionar`, contratação Premium e aparição em `search_providers_ranked` para `status<>'aprovado'` OR `council_verified_at IS NULL` OR `documentacao_vencida`.

**Lote 1.6 — Auditoria**
- Gerar relatório `.lovable/audit-livvo.md` mapeando: botões dead, telas vazias, duplicações, textos repetidos, fluxos quebrados. Sem refactor — só lista priorizada.

---

## Onda 2 — Acertos finais no CRM (rápido)
- Controle de duplicidade no import (Ignorar / Atualizar / Mesclar) — hoje só ignora.
- Tela "Ficha do paciente" (`pro.crm.$id.tsx`) ganhar timeline unificada (agendamentos + orçamentos + pagamentos + notas) ordenada por data.
- "Origem dos pacientes" virar enum padronizado (a lista oficial do brief) + permitir edição manual.

## Onda 3 — Crescimento e monetização
- Painel "Meus Destaques" (`pro.impulsionar.tsx`) com KPIs: impressões, cliques, contatos, agendamentos, taxa de conversão (já temos `ad_impressions`; falta agregar).
- Programa Parceiros Fundadores: flag `is_founder` em `professionals`/`companies`. Primeiros 20 → 120d / demais → 90d. Função `effective_commission_percent` já cobre janela; só estender + contador.
- Comissão progressiva por volume (10% / 8% / 5%) com base em `appointments` realizados nos últimos 30 dias — estender `effective_commission_percent`.

## Onda 4 — Automações
- Arquitetura já existe (`automation_jobs`, `notify_user`). Faltam apenas eventos faltantes (retorno pendente já está; revisar reagendamento) e contratos prontos p/ WhatsApp/Email (provider abstrato, sem integração agora).

## Onda 5 — Reputação
- Resposta pública do profissional em `reviews` (campo `reply_text`, `reply_at`).
- Denúncia (`review_reports`) + moderação admin.
- Ranking: estender `search_providers_ranked` com score (rating + completude + conversão) para desempate dentro de cada `rank_group`.

---

## Ordem de execução proposta

1. **Onda 1 — Lote 1.1 + 1.2** (validação documental + selo) — começo agora.
2. Lote 1.3 (RT) + 1.4 (papéis) + 1.5 (gating).
3. Lote 1.6 (relatório de auditoria — entregue como markdown).
4. Onda 3 (monetização) antes da Onda 2 ajustes finais, porque tem impacto direto em faturamento.
5. Onda 5 (reputação).
6. Onda 2 + Onda 4 (ajustes finos restantes).

---

## Confirmação

Posso começar pelos **Lotes 1.1 + 1.2** (migration + UI do onboarding + selo na busca/perfil)? São o passo de maior impacto jurídico e de credibilidade, e desbloqueiam o restante.

Se preferir outra ordem (ex.: começar por Onda 3 para monetizar antes), me diga.
