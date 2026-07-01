// Central de Ajuda Livvo — conteúdo estático.
// Escrito em linguagem simples, sem termos técnicos.

export type HelpCategoryId =
  | "primeiros-passos"
  | "conta"
  | "marketplace"
  | "crm"
  | "agenda"
  | "cobrancas"
  | "financeiro"
  | "perfil"
  | "profissionais"
  | "empresas"
  | "pacientes"
  | "configuracoes"
  | "pagamentos"
  | "seguranca"
  | "faq";

export type HelpAudience = "paciente" | "profissional" | "empresa" | "todos";

export interface HelpArticle {
  slug: string;
  title: string;
  description: string;
  category: HelpCategoryId;
  audience: HelpAudience;
  steps?: string[];
  tips?: string[];
  notes?: string[];
  related?: string[]; // slugs
  keywords?: string[];
}

export interface HelpCategory {
  id: HelpCategoryId;
  title: string;
  description: string;
  icon: string; // lucide name
}

export const helpCategories: HelpCategory[] = [
  { id: "primeiros-passos", title: "Primeiros Passos", description: "Comece por aqui.", icon: "Sparkles" },
  { id: "conta", title: "Conta", description: "Login, senha, e-mail e perfil.", icon: "User" },
  { id: "marketplace", title: "Marketplace", description: "Como aparecer e receber pacientes.", icon: "Search" },
  { id: "crm", title: "CRM", description: "Pacientes, funil e histórico.", icon: "Users" },
  { id: "agenda", title: "Agenda", description: "Horários, bloqueios e status.", icon: "Calendar" },
  { id: "cobrancas", title: "Cobranças", description: "Envie e receba pelo Livvo.", icon: "Receipt" },
  { id: "financeiro", title: "Financeiro", description: "Extrato, repasses e comissão.", icon: "Wallet" },
  { id: "perfil", title: "Perfil", description: "Deixe seu perfil completo.", icon: "IdCard" },
  { id: "profissionais", title: "Profissionais", description: "Guia do profissional.", icon: "Stethoscope" },
  { id: "empresas", title: "Empresas", description: "Equipe e permissões.", icon: "Building2" },
  { id: "pacientes", title: "Pacientes", description: "Guia do paciente.", icon: "HeartPulse" },
  { id: "configuracoes", title: "Configurações", description: "Notificações e preferências.", icon: "Settings" },
  { id: "pagamentos", title: "Pagamentos", description: "PIX, cartão e recebimentos.", icon: "CreditCard" },
  { id: "seguranca", title: "Segurança", description: "Privacidade, LGPD e conta.", icon: "ShieldCheck" },
  { id: "faq", title: "Perguntas Frequentes", description: "Respostas rápidas.", icon: "HelpCircle" },
];

// ---------- Artigos ----------
export const helpArticles: HelpArticle[] = [
  // PRIMEIROS PASSOS
  {
    slug: "como-criar-conta",
    title: "Como criar uma conta",
    description: "Crie sua conta como paciente, profissional ou empresa em menos de 2 minutos.",
    category: "primeiros-passos",
    audience: "todos",
    steps: [
      "Acesse livvo.app e toque em Criar conta.",
      "Escolha o tipo de conta: Paciente, Profissional ou Empresa.",
      "Informe seu nome, e-mail e defina uma senha (ou entre com Google).",
      "Confirme o e-mail (caso solicitado) e faça login.",
    ],
    tips: ["Use um e-mail que você acessa com frequência para receber avisos importantes."],
    related: ["diferenca-perfis", "validar-conselho"],
    keywords: ["cadastro", "criar", "signup", "registrar"],
  },
  {
    slug: "diferenca-perfis",
    title: "Diferença entre Paciente, Profissional e Empresa",
    description: "Entenda qual perfil escolher no cadastro.",
    category: "primeiros-passos",
    audience: "todos",
    notes: [
      "Paciente: busca e agenda consultas, exames e procedimentos.",
      "Profissional (pessoa física): atende pacientes, possui CRM, agenda e cobranças.",
      "Empresa (clínica/laboratório): gerencia equipe, agenda compartilhada e financeiro consolidado.",
    ],
  },
  {
    slug: "validar-conselho",
    title: "Como validar meu conselho profissional",
    description: "Envie os documentos do conselho para verificação e receba o selo verificado.",
    category: "primeiros-passos",
    audience: "profissional",
    steps: [
      "Acesse Perfil > Documentos.",
      "Informe conselho, número e UF.",
      "Envie a foto do documento profissional (CRM, CRO, CREFITO etc.).",
      "Aguarde a análise da equipe Livvo (até 48h úteis).",
    ],
    tips: ["Perfis verificados aparecem melhor no Marketplace."],
    related: ["como-aparecer-marketplace"],
  },
  {
    slug: "cadastrar-clinica",
    title: "Como cadastrar minha clínica",
    description: "Crie uma conta de empresa e monte a equipe.",
    category: "empresas",
    audience: "empresa",
    steps: [
      "Crie a conta escolhendo Empresa.",
      "Complete o CNPJ, endereço e especialidades atendidas.",
      "Adicione profissionais e recepcionistas em Equipe.",
      "Configure a agenda de cada profissional.",
    ],
    related: ["cadastrar-equipe", "permissoes-empresa"],
  },
  {
    slug: "completar-perfil",
    title: "Como completar meu perfil",
    description: "Um perfil completo converte muito mais.",
    category: "perfil",
    audience: "profissional",
    steps: [
      "Adicione foto profissional em alta qualidade.",
      "Preencha bio, formação e especialidades.",
      "Cadastre serviços (consulta, retorno, exames) com preço.",
      "Publique horários de atendimento.",
    ],
    tips: ["Perfis com foto e serviços cadastrados recebem 3x mais agendamentos."],
  },
  {
    slug: "como-aparecer-marketplace",
    title: "Como aparecer no Marketplace",
    description: "Requisitos para o seu perfil ficar visível para pacientes.",
    category: "marketplace",
    audience: "profissional",
    steps: [
      "Complete o perfil (foto, bio, especialidade e endereço).",
      "Valide o conselho profissional.",
      "Cadastre ao menos um serviço com preço.",
      "Configure horários disponíveis.",
    ],
    notes: ["Perfis são publicados após aprovação da equipe."],
  },
  {
    slug: "aumentar-chances",
    title: "Como aumentar minhas chances de receber pacientes",
    description: "Boas práticas que aumentam sua visibilidade.",
    category: "marketplace",
    audience: "profissional",
    tips: [
      "Mantenha a agenda sempre atualizada.",
      "Responda rápido às solicitações.",
      "Peça avaliações aos pacientes atendidos.",
      "Considere o recurso Impulsionar para ganhar destaque.",
    ],
    related: ["destacar-perfil"],
  },

  // MARKETPLACE
  {
    slug: "marketplace-como-funciona",
    title: "Como funciona o Marketplace",
    description: "Pacientes buscam por especialidade, cidade e preço, e agendam direto pela Livvo.",
    category: "marketplace",
    audience: "todos",
    notes: [
      "A busca considera localização, avaliações e disponibilidade.",
      "Perfis patrocinados aparecem no topo com selo âmbar.",
    ],
  },
  {
    slug: "aparecer-nas-buscas",
    title: "Como aparecer nas buscas",
    description: "Quem tem perfil aprovado, com serviços e horários, aparece.",
    category: "marketplace",
    audience: "profissional",
    tips: ["Cadastre pelo menos 3 serviços com preço para ampliar sua exposição."],
  },
  {
    slug: "destacar-perfil",
    title: "Como destacar meu perfil",
    description: "Use o Impulsionar para aparecer no topo das buscas.",
    category: "marketplace",
    audience: "profissional",
    steps: [
      "Acesse Impulsionar no menu.",
      "Escolha o plano de destaque (regional, categoria ou top).",
      "Confirme o pagamento e o destaque começa em minutos.",
    ],
  },
  {
    slug: "editar-perfil",
    title: "Como editar meu perfil",
    description: "Ajuste sua bio, foto e serviços a qualquer momento.",
    category: "perfil",
    audience: "profissional",
    steps: ["Acesse Perfil no menu.", "Toque em Editar.", "Salve as alterações."],
  },
  {
    slug: "alterar-horarios",
    title: "Como alterar meus horários",
    description: "Mantenha sua disponibilidade sempre atualizada.",
    category: "agenda",
    audience: "profissional",
    steps: [
      "Vá em Agenda > Configurar horários.",
      "Selecione os dias e defina blocos de atendimento.",
      "Salve.",
    ],
  },
  {
    slug: "receber-agendamentos",
    title: "Como receber agendamentos",
    description: "Todo agendamento chega por notificação e aparece na Agenda.",
    category: "agenda",
    audience: "profissional",
    notes: ["Confirme dentro de 2h para melhorar sua reputação."],
  },
  {
    slug: "responder-pacientes",
    title: "Como responder pacientes",
    description: "Use o chat da Livvo direto no card do paciente.",
    category: "crm",
    audience: "profissional",
    steps: ["Abra o CRM.", "Toque no paciente.", "Envie mensagem pelo chat ou WhatsApp."],
  },
  {
    slug: "comissao-livvo",
    title: "Como funciona a comissão da Livvo",
    description: "A comissão é cobrada apenas sobre agendamentos efetivamente concluídos.",
    category: "cobrancas",
    audience: "profissional",
    notes: [
      "A comissão é progressiva: quanto mais consultas concluídas, menor o percentual.",
      "O valor líquido é depositado na sua carteira Livvo.",
    ],
  },

  // CRM
  {
    slug: "cadastrar-paciente",
    title: "Como cadastrar paciente",
    description: "Adicione manualmente pacientes ao seu CRM.",
    category: "crm",
    audience: "profissional",
    steps: [
      "Vá em CRM e toque em Novo paciente.",
      "Informe nome, telefone e e-mail.",
      "Salve. O paciente entra na etapa Lead.",
    ],
  },
  {
    slug: "importar-pacientes",
    title: "Como importar pacientes",
    description: "Migre sua base atual em minutos com um arquivo CSV.",
    category: "crm",
    audience: "profissional",
    steps: [
      "Acesse CRM > Importar.",
      "Baixe o modelo de planilha.",
      "Preencha os dados e envie o arquivo.",
    ],
    tips: ["Verifique se os telefones estão no formato correto antes de importar."],
  },
  {
    slug: "editar-paciente",
    title: "Como editar paciente",
    description: "Atualize dados, tags e observações do paciente.",
    category: "crm",
    audience: "profissional",
    steps: ["Abra o paciente no CRM.", "Toque em Editar.", "Salve."],
  },
  {
    slug: "mover-funil",
    title: "Como mover no funil",
    description: "Arraste o paciente entre as etapas Lead, Ativo, Retorno e Perdido.",
    category: "crm",
    audience: "profissional",
    notes: ["A movimentação também acontece automaticamente ao concluir uma consulta."],
  },
  {
    slug: "reagendar-consulta",
    title: "Como reagendar",
    description: "Escolha nova data e hora sem perder o histórico.",
    category: "agenda",
    audience: "todos",
    steps: [
      "Abra a consulta na Agenda ou no CRM.",
      "Toque em Reagendar.",
      "Selecione o novo horário e confirme.",
    ],
  },
  {
    slug: "concluir-atendimento",
    title: "Como concluir atendimento",
    description: "Marque a consulta como realizada para liberar comissão e histórico.",
    category: "agenda",
    audience: "profissional",
    steps: ["Abra a consulta.", "Toque em Realizada.", "Adicione anotações se quiser."],
  },
  {
    slug: "cancelar-consulta",
    title: "Como cancelar",
    description: "Cancele uma consulta e registre o motivo.",
    category: "agenda",
    audience: "todos",
    steps: ["Abra a consulta.", "Toque em Cancelar.", "Informe o motivo e confirme."],
  },
  {
    slug: "registrar-falta",
    title: "Como registrar falta",
    description: "Registre no-show para manter seu histórico organizado.",
    category: "agenda",
    audience: "profissional",
    steps: ["Abra a consulta atrasada.", "Escolha Não compareceu.", "Confirme."],
  },
  {
    slug: "criar-historico",
    title: "Como criar histórico",
    description: "Anotações ficam salvas na timeline do paciente.",
    category: "crm",
    audience: "profissional",
    steps: ["Abra o paciente.", "Vá na aba Histórico.", "Adicione uma nota."],
  },
  {
    slug: "timeline-paciente",
    title: "Como funciona a timeline",
    description: "Mostra tudo o que aconteceu com o paciente em ordem cronológica.",
    category: "crm",
    audience: "profissional",
  },
  {
    slug: "usar-tags",
    title: "Como usar tags",
    description: "Organize pacientes por convênio, origem, tratamento etc.",
    category: "crm",
    audience: "profissional",
    steps: ["Abra o paciente.", "Toque em Adicionar tag.", "Digite ou selecione."],
  },

  // AGENDA
  {
    slug: "criar-horario",
    title: "Criar horário",
    description: "Defina blocos de disponibilidade por dia da semana.",
    category: "agenda",
    audience: "profissional",
    steps: ["Vá em Agenda > Configurar horários.", "Toque em Adicionar bloco.", "Defina início, fim e duração."],
  },
  {
    slug: "bloquear-horario",
    title: "Bloquear horário",
    description: "Bloqueie datas específicas (folga, feriado, congresso).",
    category: "agenda",
    audience: "profissional",
    steps: ["Vá em Agenda.", "Toque em Bloquear.", "Escolha data e motivo."],
  },
  {
    slug: "agenda-diaria",
    title: "Agenda diária",
    description: "Veja todos os atendimentos do dia em ordem cronológica.",
    category: "agenda",
    audience: "profissional",
  },
  {
    slug: "agenda-semanal",
    title: "Agenda semanal",
    description: "Visão de 7 dias para planejar melhor.",
    category: "agenda",
    audience: "profissional",
  },
  {
    slug: "agenda-mensal",
    title: "Agenda mensal",
    description: "Visão macro do mês inteiro.",
    category: "agenda",
    audience: "profissional",
  },
  {
    slug: "status-consulta",
    title: "Status da consulta",
    description: "Entenda cada status: Agendada, Confirmada, Realizada, Cancelada, Não compareceu.",
    category: "agenda",
    audience: "todos",
    notes: [
      "Consultas com data passada e ainda como Agendada aparecem como Pendente de definição.",
      "É preciso definir o desfecho para liberar comissão.",
    ],
  },
  {
    slug: "pendencias",
    title: "Pendências",
    description: "Central com tudo o que precisa da sua atenção.",
    category: "agenda",
    audience: "profissional",
  },
  {
    slug: "alertas-agenda",
    title: "Alertas da agenda",
    description: "Você recebe notificação de novos agendamentos, cancelamentos e retornos a agendar.",
    category: "agenda",
    audience: "profissional",
  },

  // COBRANÇAS
  {
    slug: "criar-cobranca",
    title: "Criar cobrança",
    description: "Envie um link de pagamento para o paciente em segundos.",
    category: "cobrancas",
    audience: "profissional",
    steps: [
      "Abra o paciente ou a consulta.",
      "Toque em Cobrar.",
      "Informe o valor e o serviço.",
      "Envie o link por WhatsApp, e-mail ou SMS.",
    ],
  },
  {
    slug: "enviar-link",
    title: "Enviar link de pagamento",
    description: "Copie e envie o link para o paciente pagar com PIX ou cartão.",
    category: "cobrancas",
    audience: "profissional",
  },
  {
    slug: "pagamento-pix",
    title: "Pagamento por PIX",
    description: "PIX cai na hora e libera a comissão imediatamente.",
    category: "pagamentos",
    audience: "todos",
  },
  {
    slug: "pagamento-cartao",
    title: "Pagamento por cartão",
    description: "Aceita crédito e débito das principais bandeiras.",
    category: "pagamentos",
    audience: "todos",
  },
  {
    slug: "recebimento",
    title: "Recebimento",
    description: "Os valores caem na sua carteira Livvo e podem ser sacados.",
    category: "financeiro",
    audience: "profissional",
  },
  {
    slug: "status-cobranca",
    title: "Status da cobrança",
    description: "Enviada, Visualizada, Paga, Vencida ou Cancelada.",
    category: "cobrancas",
    audience: "profissional",
  },
  {
    slug: "cobranca-vencida",
    title: "Cobrança vencida",
    description: "Reenvie o link ou renegocie com o paciente sem sair da tela.",
    category: "cobrancas",
    audience: "profissional",
  },
  {
    slug: "historico-cobrancas",
    title: "Histórico de cobranças",
    description: "Consulte todas as cobranças por paciente ou período.",
    category: "cobrancas",
    audience: "profissional",
  },

  // FINANCEIRO
  {
    slug: "receita",
    title: "Receita",
    description: "Total recebido no período. Considera apenas consultas concluídas.",
    category: "financeiro",
    audience: "profissional",
  },
  {
    slug: "pagamentos",
    title: "Pagamentos",
    description: "Histórico de todos os pagamentos recebidos.",
    category: "financeiro",
    audience: "profissional",
  },
  {
    slug: "comissoes",
    title: "Comissões",
    description: "Percentual retido pela Livvo sobre cada consulta concluída.",
    category: "financeiro",
    audience: "profissional",
  },
  {
    slug: "repasse",
    title: "Repasse",
    description: "Solicite o saque para sua conta bancária cadastrada.",
    category: "financeiro",
    audience: "profissional",
    steps: ["Vá em Financeiro > Carteira.", "Toque em Sacar.", "Informe o valor e confirme."],
  },
  {
    slug: "fluxo-caixa",
    title: "Fluxo de caixa",
    description: "Entradas e saídas do período em um só lugar.",
    category: "financeiro",
    audience: "profissional",
  },
  {
    slug: "dashboard-financeiro",
    title: "Dashboard financeiro",
    description: "Indicadores de receita, ticket médio, cancelamentos e projeções.",
    category: "financeiro",
    audience: "profissional",
  },
  {
    slug: "extrato",
    title: "Extrato",
    description: "Baixe o extrato em PDF ou CSV para sua contabilidade.",
    category: "financeiro",
    audience: "profissional",
  },

  // PACIENTE
  {
    slug: "buscar-profissionais",
    title: "Como buscar profissionais",
    description: "Busque por especialidade, cidade, avaliação e preço.",
    category: "pacientes",
    audience: "paciente",
    steps: ["Toque em Buscar.", "Filtre por especialidade e localidade.", "Escolha o profissional."],
  },
  {
    slug: "como-agendar",
    title: "Como agendar",
    description: "Escolha data, hora e confirme o pagamento.",
    category: "pacientes",
    audience: "paciente",
  },
  {
    slug: "paciente-cancelar",
    title: "Como cancelar",
    description: "Cancele até 24h antes para ter reembolso integral.",
    category: "pacientes",
    audience: "paciente",
  },
  {
    slug: "paciente-pagar",
    title: "Como pagar",
    description: "Aceitamos PIX e cartão de crédito/débito.",
    category: "pacientes",
    audience: "paciente",
  },
  {
    slug: "paciente-remarcar",
    title: "Como remarcar",
    description: "Escolha nova data direto na tela da consulta.",
    category: "pacientes",
    audience: "paciente",
  },
  {
    slug: "paciente-favoritar",
    title: "Como favoritar",
    description: "Salve profissionais para agendar depois.",
    category: "pacientes",
    audience: "paciente",
  },
  {
    slug: "paciente-avaliar",
    title: "Como avaliar",
    description: "Depois da consulta você pode avaliar o profissional de 1 a 5 estrelas.",
    category: "pacientes",
    audience: "paciente",
  },
  {
    slug: "paciente-historico",
    title: "Histórico do paciente",
    description: "Todas as consultas, receitas e atestados ficam na aba Documentos.",
    category: "pacientes",
    audience: "paciente",
  },

  // EMPRESAS
  {
    slug: "cadastrar-equipe",
    title: "Cadastrar equipe",
    description: "Convide profissionais e recepcionistas por e-mail.",
    category: "empresas",
    audience: "empresa",
    steps: ["Vá em Equipe.", "Toque em Convidar.", "Escolha a função e envie o convite."],
  },
  {
    slug: "adicionar-profissionais",
    title: "Adicionar profissionais",
    description: "Cada profissional tem agenda e perfil próprios dentro da empresa.",
    category: "empresas",
    audience: "empresa",
  },
  {
    slug: "recepcionistas",
    title: "Recepcionistas",
    description: "Recepcionistas podem gerenciar agenda e CRM sem ver o financeiro.",
    category: "empresas",
    audience: "empresa",
  },
  {
    slug: "permissoes-empresa",
    title: "Permissões",
    description: "Owner, Admin, Recepcionista e Profissional têm níveis diferentes.",
    category: "empresas",
    audience: "empresa",
  },
  {
    slug: "agenda-empresa",
    title: "Agenda da empresa",
    description: "Visão consolidada de todos os profissionais.",
    category: "empresas",
    audience: "empresa",
  },
  {
    slug: "financeiro-empresa",
    title: "Financeiro da empresa",
    description: "Receita consolidada e por profissional.",
    category: "empresas",
    audience: "empresa",
  },
  {
    slug: "crm-compartilhado",
    title: "CRM compartilhado",
    description: "Pacientes ficam vinculados à empresa e ao profissional que atendeu.",
    category: "empresas",
    audience: "empresa",
  },

  // SEGURANÇA
  {
    slug: "trocar-senha",
    title: "Trocar senha",
    description: "Altere sua senha a qualquer momento.",
    category: "seguranca",
    audience: "todos",
    steps: ["Perfil > Segurança > Alterar senha.", "Informe a senha atual e a nova.", "Salve."],
  },
  {
    slug: "alterar-email",
    title: "Alterar e-mail",
    description: "Peça a alteração pelo suporte para manter a segurança da conta.",
    category: "seguranca",
    audience: "todos",
  },
  {
    slug: "excluir-conta",
    title: "Excluir conta",
    description: "Sua conta e dados são removidos conforme a LGPD.",
    category: "seguranca",
    audience: "todos",
    notes: ["Faturas e comprovantes fiscais são mantidos pelo prazo legal."],
  },
  {
    slug: "privacidade",
    title: "Privacidade",
    description: "Seus dados são criptografados e nunca vendidos.",
    category: "seguranca",
    audience: "todos",
  },
  {
    slug: "lgpd",
    title: "LGPD",
    description: "Você pode solicitar, corrigir ou apagar seus dados quando quiser.",
    category: "seguranca",
    audience: "todos",
  },
  {
    slug: "documentacao",
    title: "Documentação",
    description: "Envie documentos com câmera ou upload direto pelo app.",
    category: "seguranca",
    audience: "profissional",
  },
  {
    slug: "validacao-profissional",
    title: "Validação profissional",
    description: "Nossa equipe confere manualmente cada conselho.",
    category: "seguranca",
    audience: "profissional",
  },
];

// ---------- FAQ (100 perguntas rápidas) ----------
export interface FaqItem { q: string; a: string; }
export const faqItems: FaqItem[] = [
  { q: "A Livvo é gratuita?", a: "Sim, criar conta e usar as funções básicas é gratuito. Cobramos apenas comissão sobre consultas concluídas." },
  { q: "Existe telemedicina?", a: "Não. A Livvo é 100% para atendimentos presenciais." },
  { q: "Como sei se meu cadastro foi aprovado?", a: "Você recebe notificação e e-mail quando a análise for concluída." },
  { q: "Quanto tempo demora a aprovação?", a: "Normalmente até 48h úteis." },
  { q: "Posso testar antes de ser aprovado?", a: "Sim, no modo demo você conhece todas as telas." },
  { q: "Como recupero minha senha?", a: "Na tela de login toque em Esqueci a senha." },
  { q: "Posso ter mais de um perfil?", a: "Sim, um profissional pode fazer parte de várias empresas." },
  { q: "Como cadastro uma nova especialidade?", a: "Em Perfil > Especialidades adicione as que atende." },
  { q: "Preciso de CNPJ?", a: "Não. Profissionais autônomos usam CPF." },
  { q: "Como funcionam os planos pagos?", a: "Planos oferecem destaque no Marketplace e limites maiores." },
  { q: "Posso mudar de plano?", a: "Sim, quando quiser." },
  { q: "Onde vejo minhas cobranças?", a: "Em Financeiro > Cobranças." },
  { q: "Como cadastro conta bancária?", a: "Financeiro > Dados bancários." },
  { q: "Quanto tempo demora o saque?", a: "Até 1 dia útil via PIX." },
  { q: "Tem taxa para sacar?", a: "Não." },
  { q: "Posso emitir nota fiscal?", a: "Sim, integramos com emissores parceiros." },
  { q: "Como funciona a comissão?", a: "Percentual reduzido conforme sua evolução na plataforma." },
  { q: "A comissão é sobre valor bruto?", a: "É sobre o valor da consulta concluída." },
  { q: "Cancelamentos são cobrados?", a: "Não." },
  { q: "Como confirmo uma consulta?", a: "Notificação chega no app, toque em Confirmar." },
  { q: "Posso confirmar pelo WhatsApp?", a: "Sim, quando ativado nas configurações." },
  { q: "Como aparecer no topo?", a: "Use o Impulsionar." },
  { q: "Impulsionar é mensal?", a: "Você escolhe: 7, 15 ou 30 dias." },
  { q: "Posso pausar o Impulsionar?", a: "Sim, sem perder o valor pago." },
  { q: "Como avaliar um paciente?", a: "Apenas pacientes avaliam profissionais, não o contrário." },
  { q: "Avaliações são anônimas?", a: "O nome aparece; o texto pode ser moderado." },
  { q: "Posso responder avaliações?", a: "Sim, publicamente." },
  { q: "Como bloquear um paciente?", a: "Abra o paciente no CRM > Bloquear." },
  { q: "Como reativar um paciente?", a: "CRM > filtros > Bloqueados > Reativar." },
  { q: "O CRM tem limite de pacientes?", a: "Não." },
  { q: "Posso exportar meu CRM?", a: "Sim, em CRM > Exportar CSV." },
  { q: "Como importo do meu sistema atual?", a: "CRM > Importar > arquivo CSV modelo." },
  { q: "Tem integração com Google Agenda?", a: "Em breve." },
  { q: "Uso no computador?", a: "Sim, o Livvo é web e mobile." },
  { q: "Preciso instalar app?", a: "Não é obrigatório, mas recomendamos a versão instalável (PWA)." },
  { q: "Funciona offline?", a: "Parcialmente: leitura funciona; envios exigem internet." },
  { q: "Como ativar notificações push?", a: "O navegador pede autorização ao abrir a Livvo." },
  { q: "Posso desativar notificações?", a: "Sim, em Configurações > Notificações." },
  { q: "Como reagendo em lote?", a: "Selecione várias consultas na Agenda e escolha Reagendar." },
  { q: "Como bloqueio o dia inteiro?", a: "Agenda > Bloquear > Dia inteiro." },
  { q: "Feriados são bloqueados?", a: "Sim, se você marcar em Configurações > Feriados." },
  { q: "Como configuro duração da consulta?", a: "Cada serviço tem duração própria em Perfil > Serviços." },
  { q: "Posso cobrar em dólar?", a: "Apenas em reais no momento." },
  { q: "Aceita boleto?", a: "Não. Apenas PIX e cartão." },
  { q: "Quantas parcelas no cartão?", a: "Até 6x sem juros." },
  { q: "Como funciona o reembolso?", a: "Depende do prazo: total até 24h antes, parcial após." },
  { q: "Como emito recibo para o paciente?", a: "Automático após pagamento." },
  { q: "Onde vejo meus recibos?", a: "Financeiro > Documentos." },
  { q: "O paciente recebe o recibo por e-mail?", a: "Sim, automaticamente." },
  { q: "Posso enviar atestado?", a: "Sim, em Documentos > Novo atestado." },
  { q: "E receitas médicas?", a: "Sim, digitais ou em PDF." },
  { q: "Assinatura digital?", a: "Integramos com provedores de assinatura." },
  { q: "Tem prontuário eletrônico?", a: "Sim, básico, no CRM > Histórico." },
  { q: "Meus dados são de quem?", a: "Somente seus. Você pode exportar ou apagar quando quiser." },
  { q: "A Livvo compartilha dados?", a: "Nunca vendemos. Compartilhamos apenas o necessário para o serviço." },
  { q: "Como excluir minha conta?", a: "Perfil > Segurança > Excluir conta." },
  { q: "Perco meu histórico ao excluir?", a: "Sim; exporte antes." },
  { q: "Como falar com o suporte?", a: "Toque em Ainda preciso de ajuda no rodapé." },
  { q: "Suporte funciona no fim de semana?", a: "Chat 24/7; humanos em horário comercial." },
  { q: "Tem canal de emergência?", a: "Não. A Livvo não é serviço de emergência médica." },
  { q: "Posso ter agenda para dois consultórios?", a: "Sim, cadastre unidades diferentes." },
  { q: "Como cadastro unidades?", a: "Perfil > Unidades." },
  { q: "Como mudar cidade do perfil?", a: "Perfil > Endereço." },
  { q: "Meu perfil aparece fora da minha cidade?", a: "Depende dos filtros do paciente." },
  { q: "Como aumento minha nota?", a: "Bom atendimento + peça avaliação após consulta." },
  { q: "Nota mínima para aparecer?", a: "Não há; mas notas altas rankeiam melhor." },
  { q: "Como remover uma avaliação injusta?", a: "Reporte via suporte para moderação." },
  { q: "Posso desativar meu perfil temporariamente?", a: "Sim, Perfil > Pausar." },
  { q: "Quando pausado, o paciente vê?", a: "Não. Você some das buscas até reativar." },
  { q: "Consigo agendar retorno automático?", a: "Sim, ao concluir consulta escolha Agendar retorno." },
  { q: "Tem lembrete pro paciente?", a: "Enviamos automaticamente antes da consulta." },
  { q: "Posso personalizar o lembrete?", a: "Sim, em Configurações > Mensagens." },
  { q: "Como convido recepcionista?", a: "Equipe > Convidar > Recepcionista." },
  { q: "Recepcionista vê meu financeiro?", a: "Não." },
  { q: "Quantos usuários por empresa?", a: "Ilimitado." },
  { q: "Tem versão para tablet?", a: "Sim, layout responsivo." },
  { q: "Suporta múltiplos idiomas?", a: "Apenas português no momento." },
  { q: "Como reporto um bug?", a: "Central de Ajuda > Ainda preciso de ajuda." },
  { q: "Onde vejo novidades?", a: "Central de Ajuda > Novidades." },
  { q: "Consigo integração via API?", a: "Em breve para planos empresariais." },
  { q: "Consigo webhook de agendamentos?", a: "Em breve." },
  { q: "Consigo exportar relatórios?", a: "Sim, em Financeiro > Relatórios." },
  { q: "Consigo relatório por profissional?", a: "Sim, empresas veem por profissional." },
  { q: "Como aplico desconto?", a: "Ao criar cobrança, informe o valor com desconto." },
  { q: "Posso oferecer pacote de sessões?", a: "Sim, em Serviços > Pacotes." },
  { q: "Convênios são aceitos?", a: "Marcamos como Particular ou Convênio; o pagamento é combinado." },
  { q: "Como sinalizar 'atende convênio'?", a: "Perfil > Convênios atendidos." },
  { q: "Consigo enviar orçamento?", a: "Sim, em Orçamentos." },
  { q: "Orçamento tem validade?", a: "Sim, você define." },
  { q: "Paciente pode aceitar pelo link?", a: "Sim, e já cai em cobrança." },
  { q: "Posso duplicar um orçamento?", a: "Sim, em Orçamentos > Duplicar." },
  { q: "Como funciona a carteira Livvo?", a: "Guarda os valores recebidos até o saque." },
  { q: "Posso deixar saldo acumular?", a: "Sim, sem custo." },
  { q: "Tem rendimento?", a: "Não." },
  { q: "Posso transferir para outro CPF?", a: "Não. Apenas para conta em seu nome/CNPJ." },
  { q: "Como mudo o nome exibido?", a: "Perfil > Nome público." },
  { q: "Posso usar nome social?", a: "Sim." },
  { q: "Onde subo minha foto?", a: "Perfil > Foto." },
  { q: "Tamanho recomendado da foto?", a: "1000x1000, fundo neutro." },
  { q: "Vídeo de apresentação?", a: "Em breve." },
  { q: "Consigo ver quem viu meu perfil?", a: "Total agregado sim, individual não." },
  { q: "Como reporto perfil suspeito?", a: "Toque nos três pontos > Denunciar." },
];

// ---------- Utilitários ----------
export function getArticle(slug: string) {
  return helpArticles.find((a) => a.slug === slug);
}

export function articlesByCategory(id: HelpCategoryId) {
  return helpArticles.filter((a) => a.category === id);
}

export function searchHelp(query: string): HelpArticle[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return helpArticles.filter((a) => {
    const hay = [a.title, a.description, ...(a.keywords ?? []), ...(a.tips ?? []), ...(a.notes ?? []), ...(a.steps ?? [])]
      .join(" ")
      .toLowerCase();
    return hay.includes(q);
  });
}
