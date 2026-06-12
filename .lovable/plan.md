# Onboarding Profissional Premium — Evolução

Manter o fluxo atual em `src/routes/_authenticated/onboarding-pro.tsx`, mas transformá-lo em wizard multi-step com barra de progresso, preview ao vivo e cobertura completa do cadastro de marketplace de saúde.

## 1. Banco de dados (1 migration)

Estender `professionals` com colunas novas (todas nullable para não quebrar perfis atuais):
- `display_name`, `cpf_cnpj`, `secondary_specialties` (UUID[]), `years_experience` (INT), `academic_formation`, `postgrad`, `certifications` (TEXT[]), `languages` (TEXT[]).
- Contato: `whatsapp`, `phone`, `professional_email`, `instagram`, `website`.
- Endereço: `address_zip`, `address_number`, `address_complement`, `address_district`.
- Mídia: `cover_url`, `logo_url` (avatar_url já existe).
- Onboarding: `onboarding_step` (INT 0..7), `onboarding_completed_at`, `zero_commission_start`, `zero_commission_end` (preenchidos no submit final = data aprovação + 90 dias; gravamos start=null/end=null até aprovação, função `approve_professional` calcula).

Nova tabela **professional_documents**:
- `professional_id`, `kind` (enum: `documento_pessoal`, `registro`, `comprovante_endereco`, `documento_empresa`), `file_url`, `status` (`pendente`, `em_analise`, `aprovado`, `rejeitado`), `reviewer_notes`, timestamps.
- RLS: dono lê/insere; admin (has_role admin) lê/atualiza status. GRANTs autenticated + service_role.

Nova tabela **professional_business_hours** (semana padrão; complementa `professional_availability` que é por slot):
- `professional_id`, `weekday` (0..6), `opens_at`, `closes_at`, `lunch_start`, `lunch_end`, `closed` BOOL.
- UNIQUE(professional_id, weekday). RLS dono + leitura pública para perfis aprovados.

Storage bucket público `provider-media` (avatar, logo, cover, fotos de serviço) com policies: insert/update/delete pelo dono via path `{user_id}/...`.

Storage bucket privado `provider-documents` (KYC); apenas dono e admin leem.

Trigger `update_updated_at_column` em professional_documents e business_hours.

## 2. Server functions

Novo arquivo `src/lib/livvo/onboarding-pro.functions.ts`:
- `saveOnboardingStep({ step, patch })` — upsert parcial em `professionals` + atualiza `onboarding_step`. Valida ownership (id = userId).
- `setBusinessHours(hours[])` — replace semana inteira.
- `uploadProviderDocument({ kind, file_url })` — insere doc com status `pendente`.
- `submitOnboarding()` — marca `status='pendente'` e `onboarding_completed_at=now()`. Não ativa zero-commission ainda (só na aprovação).
- `lookupCep(cep)` — proxy server-side para ViaCEP (`https://viacep.com.br/ws/{cep}/json/`), sem chave.

Atualizar `src/lib/livvo/admin.functions.ts`:
- `approveProfessional(id)` — set `status='aprovado'`, `zero_commission_start=now()`, `zero_commission_end=now()+90d`.

Reusar `services.functions.ts` existente para cadastro de serviços (a tabela `services` já existe). Se faltar `upsertService`, adicionar no mesmo arquivo de onboarding.

## 3. Wizard UI

Reescrever `src/routes/_authenticated/onboarding-pro.tsx` como wizard com `<Tabs>` controlados + `<Progress>` no topo. 7 passos:

1. **Identidade visual** — upload avatar, logo (opcional), capa. Preview em card mockando perfil público.
2. **Identificação** — display_name, nome empresa (opcional, se preenche oferece vincular a `companies`), CPF/CNPJ (mask), registro profissional, especialidade principal (select), secundárias (multiselect chips).
3. **Experiência** — bio (textarea), anos exp (number), formação, pós, certificações (input chips), idiomas (chips com presets PT/EN/ES/Libras).
4. **Contato** — whatsapp, telefone, email, instagram, site. Inputs com mask e validação Zod.
5. **Endereço** — CEP com autopreenchimento (debounce 600ms → `lookupCep`), rua, número, complemento, bairro, cidade, UF. Read-only após autopreencher exceto número/complemento.
6. **Horários** — grid 7 linhas (dom-sáb), cada uma com switch "Fechado", time inputs abre/fecha + almoço opcional. Botão "Copiar para todos os dias úteis".
7. **Serviços & Documentos** — Lista de serviços (CRUD inline com modal: nome, categoria enum, descrição, duração min, valor, foto opcional). Mínimo 1 serviço. Lista de uploads de documentos com status badge.

Footer fixo com "Voltar" / "Salvar e continuar" (chama `saveOnboardingStep` a cada avanço — permite retomar). Último passo mostra **card Comissão Zero 90 dias** com explicação, e botão "Enviar para análise" que chama `submitOnboarding`.

Componentes auxiliares novos em `src/components/livvo/onboarding/`:
- `ImageUpload.tsx` — input file → upload em `provider-media` → retorna URL pública. Preview circular/retangular.
- `LivePreviewCard.tsx` — mostra como o perfil aparecerá na busca.
- `BusinessHoursGrid.tsx`.
- `ServiceFormDialog.tsx`.
- `DocumentUploadRow.tsx` — bucket `provider-documents`, status badge.
- `StepProgress.tsx`.

Validação por step com Zod; bloqueia "continuar" se inválido.

## 4. Painel admin — aprovação

Adicionar em `admin.tsx` aba "Profissionais pendentes": lista quem tem `status='pendente'` + documentos com link. Botões Aprovar/Rejeitar; aprovar chama `approveProfessional` (90d zero comissão dispara).

## 5. Out of scope (não vai nessa entrega)

- Não recriar painel Impulsionar (já existe em `pro.impulsionar.tsx`).
- Empresas/clínicas multi-unidade: estrutura já existe (`companies`, `company_units`); não vamos misturar com onboarding individual agora — fica um link "Cadastrar como clínica/laboratório" levando ao fluxo `companies` existente.
- Não vamos refatorar a página pública do profissional para consumir os novos campos nesta entrega (só salvar — exibição segue depois).

## 6. Memória

Salvar `mem://features/onboarding-pro` com: wizard 7 passos, zero-commission 90d disparado na aprovação, buckets `provider-media` (público) e `provider-documents` (privado).

---

Confirma para eu executar? Posso já fatiar em PRs menores se preferir começar só pela migration + wizard de UI sem os uploads/documentos.
