// Recomendações determinísticas para o Centro de Crescimento.
// Sem IA — regras claras baseadas nos dados do parceiro.

import type { CompletenessResult } from "./profile-completeness";

export interface GrowthRecommendation {
  id: string;
  title: string;
  description: string;
  priority: "alta" | "media" | "baixa";
  action?: { to: string; label: string };
  category: "perfil" | "divulgacao" | "operacao" | "relacionamento" | "financeiro";
}

export interface GrowthMilestone {
  id: string;
  label: string;
  done: boolean;
  description: string;
}

interface GrowthInputs {
  completeness: CompletenessResult;
  hasBusinessHours: boolean;
  hasServices: boolean;
  hasFirstPatient: boolean;
  hasFirstReview: boolean;
  hasFirstCharge: boolean;
  hasFirstPayout: boolean;
  hasSharedProfile: boolean; // audit_logs contém share
  isVerified: boolean;
  emptySlotsToday: number;
  pendingReturns: number;
  pendingCharges: number;
  totalAppointments: number;
}

export function computeMilestones(input: GrowthInputs): GrowthMilestone[] {
  return [
    { id: "profile", label: "Perfil completo", done: input.completeness.score >= 90,
      description: "Todos os campos essenciais preenchidos." },
    { id: "hours", label: "Agenda configurada", done: input.hasBusinessHours,
      description: "Horários de atendimento definidos." },
    { id: "services", label: "Procedimentos cadastrados", done: input.hasServices,
      description: "Serviços com preço e duração." },
    { id: "first_patient", label: "Primeiro paciente", done: input.hasFirstPatient,
      description: "Você recebeu seu primeiro paciente." },
    { id: "first_review", label: "Primeira avaliação", done: input.hasFirstReview,
      description: "Um paciente avaliou seu atendimento." },
    { id: "first_charge", label: "Primeira cobrança", done: input.hasFirstCharge,
      description: "Você enviou sua primeira cobrança pela Livvo." },
    { id: "first_payout", label: "Primeiro pagamento", done: input.hasFirstPayout,
      description: "Você recebeu o primeiro repasse na carteira." },
    { id: "shared", label: "Perfil compartilhado", done: input.hasSharedProfile,
      description: "Você já divulgou sua página pública." },
    { id: "verified", label: "Parceiro verificado", done: input.isVerified,
      description: "Conselho e documentos aprovados." },
  ];
}

export function computeRecommendations(input: GrowthInputs): GrowthRecommendation[] {
  const recs: GrowthRecommendation[] = [];

  // Perfil incompleto → priorizar itens de maior peso ainda não feitos
  input.completeness.missing
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 2)
    .forEach((m) => {
      recs.push({
        id: `profile-${m.key}`,
        title: m.label,
        description: `${m.hint} (+${m.weight}% no seu perfil)`,
        priority: m.weight >= 10 ? "alta" : "media",
        action: m.action,
        category: "perfil",
      });
    });

  if (!input.hasSharedProfile) {
    recs.push({
      id: "share-profile",
      title: "Compartilhe sua página pública",
      description: "Você ainda não divulgou seu perfil. Um único compartilhamento pode gerar novos agendamentos.",
      priority: "alta",
      action: { to: "/pro/marketing", label: "Abrir Marketing" },
      category: "divulgacao",
    });
  }

  if (input.emptySlotsToday >= 3) {
    recs.push({
      id: "empty-slots",
      title: `Você tem ${input.emptySlotsToday} horários livres hoje`,
      description: "Compartilhe seu link ou envie no WhatsApp para preencher a agenda.",
      priority: "alta",
      action: { to: "/pro/marketing", label: "Divulgar horários" },
      category: "operacao",
    });
  }

  if (input.pendingReturns > 0) {
    recs.push({
      id: "returns",
      title: `${input.pendingReturns} paciente(s) aguardando retorno`,
      description: "Retornos representam a maior fonte de receita recorrente.",
      priority: "media",
      action: { to: "/pro/crm", label: "Abrir CRM" },
      category: "relacionamento",
    });
  }

  if (input.pendingCharges > 0) {
    recs.push({
      id: "charges",
      title: `${input.pendingCharges} cobrança(s) pendente(s)`,
      description: "Envie a cobrança para não perder o recebimento.",
      priority: "media",
      action: { to: "/pro/financeiro", label: "Abrir Financeiro" },
      category: "financeiro",
    });
  }

  if (!input.hasFirstReview && input.totalAppointments >= 1) {
    recs.push({
      id: "first-review",
      title: "Solicite sua primeira avaliação",
      description: "Perfis com avaliações têm 5× mais cliques. Peça ao próximo paciente atendido.",
      priority: "media",
      action: { to: "/pro/crm", label: "Escolher paciente" },
      category: "relacionamento",
    });
  }

  if (!input.hasFirstCharge && input.hasFirstPatient) {
    recs.push({
      id: "first-charge",
      title: "Envie sua primeira cobrança pela Livvo",
      description: "Cobrança digital com repasse automático — sem burocracia.",
      priority: "baixa",
      action: { to: "/pro/financeiro", label: "Nova cobrança" },
      category: "financeiro",
    });
  }

  if (!input.isVerified) {
    recs.push({
      id: "verify",
      title: "Verifique seu conselho profissional",
      description: "O selo Verificado aumenta sua posição no marketplace e a confiança do paciente.",
      priority: "alta",
      action: { to: "/onboarding-pro", label: "Enviar documento" },
      category: "perfil",
    });
  }

  const order = { alta: 0, media: 1, baixa: 2 } as const;
  return recs.sort((a, b) => order[a.priority] - order[b.priority]).slice(0, 6);
}
