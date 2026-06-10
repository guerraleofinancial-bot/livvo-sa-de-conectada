
## Visão geral
Vou expandir a Livvo existente em uma única rodada para virar marketplace completo com modelo de comissão. Mantenho o stack atual (TanStack Start + Lovable Cloud + Healthtech Refinado). Pagamento em modo simulado (mock checkout) com toda a contabilidade real por trás, pronto para trocar pelo gateway depois.

## 1. Banco de dados (migration única)

Novas tabelas:
- **companies** — clínicas, laboratórios, centros de diagnóstico, estética. Campos: razão social, CNPJ, tipo (clinica/laboratorio/diagnostico/estetica/outros), endereço, telefone, logo, descrição, status de aprovação.
- **company_members** — vínculo profissional ↔ empresa com papel (owner/admin/profissional).
- **services** — catálogo de serviços/exames/procedimentos por profissional ou empresa, com nome, descrição, duração, preço, categoria.
- **categories** — categorias globais (consulta, exame, procedimento, estética) gerenciadas pelo admin.
- **favorites** — pacientes favoritando profissionais ou empresas.
- **wallet_transactions** — ledger imutável: crédito (pagamento recebido), comissão Livvo (débito), repasse ao prestador, reembolso. Saldo derivado por soma.
- **payouts** — solicitações/lotes de repasse aos prestadores.
- **platform_settings** — singleton com `commission_percent` (padrão 15%), prazo de cancelamento, regras de reembolso.
- **support_tickets** + **support_messages** — canal de suporte paciente↔Livvo e prestador↔Livvo.

Alterações:
- `professionals` ganha `company_id` (opcional).
- `appointments` ganha `service_id`, `gross_amount`, `commission_amount`, `net_amount`, `payment_status` (pendente/pago/reembolsado), `payment_method` (mock_card/mock_pix).
- `reviews` ganha `status` (publicada/oculta/denunciada) para moderação.

Triggers/funções:
- Ao confirmar pagamento de uma `appointment`: insere 2 linhas no ledger (crédito bruto + débito comissão) usando `commission_percent` atual.
- Função RPC `wallet_balance(provider_id)` para extrato em tempo real.
- RLS estrito em tudo, com GRANTs corretos.

## 2. Funcionalidades por persona

**Paciente**
- Busca com filtros completos: especialidade, categoria, cidade, faixa de preço, avaliação mínima, disponibilidade na semana, modalidade.
- Resultados mistos (profissionais + clínicas + laboratórios) com cards diferenciados.
- Perfil de clínica/laboratório com lista de serviços e equipe.
- Favoritar / desfavoritar com aba "Favoritos".
- Fluxo de agendamento → escolha de serviço → escolha de horário → **checkout simulado** (cartão fake/PIX fake) → confirmação.
- "Minhas consultas" com status, comprovante PDF-like (HTML imprimível), botão cancelar respeitando prazo.
- Avaliação após consulta realizada com nota 1–5 e comentário.
- Carteira digital: histórico de pagamentos e reembolsos.
- Notificações in-app (já existe tabela; passo a usar de fato).

**Prestador (autônomo ou PJ)**
- Onboarding estendido: escolher se cadastra como autônomo ou vinculado a empresa; se PJ, cria/seleciona a empresa.
- CRUD de serviços (preço, duração, descrição, categoria).
- Agenda já existe — refino bloqueio de horários e visão semanal.
- **Financeiro novo**: dashboard com receita bruta, comissão Livvo retida, líquido a receber, próximos repasses; tabela de transações; export CSV.
- Confirmação manual ou automática de consultas/exames.
- Lista de clientes recorrentes.

**Empresa (PJ) — owner**
- Painel da empresa: equipe (convidar profissionais), serviços da empresa, agenda consolidada, financeiro consolidado.

**Administrador**
- Dashboard com KPIs reais (pacientes, prestadores, GMV, comissão acumulada, agendamentos por status).
- Aprovação de profissionais E de empresas (fila separada).
- Gestão de **categorias** e **especialidades** (CRUD).
- **Comissões**: ajustar `commission_percent` global, ver receita Livvo por período.
- **Financeiro**: lista de transações, lotes de repasse (marcar como pago).
- **Moderação de avaliações**: ocultar/restaurar reviews denunciadas.
- **Suporte**: caixa de tickets, responder, fechar.
- Usuários: suspender/reativar (já existe).

## 3. Pagamento simulado (pronto para trocar)
- Tela de checkout `/_authenticated/app/checkout/$appointmentId` com formulário fake (cartão / PIX simulado / saldo demo).
- Server function `processPayment` que: valida horário disponível, calcula comissão a partir de `platform_settings`, insere `appointment` com status pago, grava ledger, dispara notificação.
- Abstração `paymentProvider` em `src/lib/livvo/payment.ts` com interface única (`charge`, `refund`) — implementação atual é mock; trocar por Stripe Connect no futuro é só nova classe.

## 4. Demo data
Estender `seedDemoData` para também criar: 2 clínicas, 1 laboratório, 1 centro de estética, ~15 serviços variados, 8 agendamentos em estados diferentes (futuros, realizados, cancelados), reviews, transações no ledger e categorias padrão.

## 5. UI
- Mantém Healthtech Refinado.
- Novos componentes: `ServiceCard`, `CompanyCard`, `WalletList`, `CommissionBadge`, `CheckoutForm`, `RatingStars`, `EmptyState` consistentes.
- Bottom nav do paciente ganha aba "Favoritos"; perfil ganha link "Carteira".
- Painel admin/pro vira responsivo com sidebar em desktop e tabs em mobile.

## 6. Notas técnicas
- Todas as queries financeiras passam por server functions com `requireSupabaseAuth` + checagem de papel; ledger jamais escrito do cliente.
- Realtime Supabase em `appointments` para atualizar agenda do prestador ao receber agendamento.
- Validações Zod nos inputs de server function.
- Sem segredos novos necessários (sem Paddle/Stripe agora).

## 7. O que NÃO entra
- Integração real com Paddle/Stripe (explicado acima — fica como próximo passo com Stripe Connect).
- Recuperação de senha via email customizado (uso o fluxo padrão do Lovable Cloud).
- App nativo iOS/Android (a PWA responsiva atende).

## Entregáveis
1 migration grande, ~25 arquivos novos/editados (rotas, componentes, server functions, seed). Após aplicar, basta logar como admin e clicar **"Popular demo"** para ver tudo populado.

Confirma para eu executar?
