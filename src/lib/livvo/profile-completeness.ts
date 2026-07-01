// Determinístico. Sem IA. Retorna itens com peso, status e explicação.

export interface CompletenessItem {
  key: string;
  label: string;
  weight: number; // pontos que somam ao total (soma total = 100)
  done: boolean;
  hint: string; // por que importa
  action?: { to: string; label: string };
}

export interface CompletenessResult {
  score: number; // 0..100
  items: CompletenessItem[];
  missing: CompletenessItem[];
  done: CompletenessItem[];
}

type ProLike = {
  avatar_url?: string | null;
  cover_url?: string | null;
  bio?: string | null;
  specialty_id?: string | null;
  secondary_specialties?: string[] | null;
  years_experience?: number | null;
  academic_formation?: string | null;
  consultation_price?: number | null;
  whatsapp?: string | null;
  phone?: string | null;
  instagram?: string | null;
  website?: string | null;
  address_city?: string | null;
  address_state?: string | null;
  address_street?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  council_verified_at?: string | null;
  slug?: string | null;
  languages?: string[] | null;
} | null | undefined;

interface Aggregates {
  servicesCount: number;
  businessHoursCount: number;
  galleryCount: number;
  hasReview: boolean;
}

export function computeProfessionalCompleteness(pro: ProLike, agg: Aggregates): CompletenessResult {
  const items: CompletenessItem[] = [
    {
      key: "avatar",
      label: "Adicionar foto de perfil",
      weight: 10,
      done: !!pro?.avatar_url,
      hint: "Pacientes confiam 3× mais em perfis com foto profissional.",
      action: { to: "/onboarding-pro", label: "Adicionar foto" },
    },
    {
      key: "bio",
      label: "Completar biografia",
      weight: 10,
      done: !!(pro?.bio && pro.bio.length >= 80),
      hint: "Biografias com pelo menos 80 caracteres aumentam a taxa de agendamento.",
      action: { to: "/onboarding-pro", label: "Editar bio" },
    },
    {
      key: "specialty",
      label: "Definir especialidade principal",
      weight: 8,
      done: !!pro?.specialty_id,
      hint: "Sua especialidade é usada para posicionar seu perfil nas buscas.",
      action: { to: "/onboarding-pro", label: "Definir" },
    },
    {
      key: "secondary_specialties",
      label: "Adicionar áreas secundárias",
      weight: 4,
      done: !!(pro?.secondary_specialties && pro.secondary_specialties.length > 0),
      hint: "Aparece em mais buscas quando você lista áreas relacionadas.",
      action: { to: "/onboarding-pro", label: "Adicionar" },
    },
    {
      key: "services",
      label: "Cadastrar procedimentos e valores",
      weight: 15,
      done: agg.servicesCount > 0,
      hint: "Perfis com preços recebem 4× mais agendamentos que sem valor visível.",
      action: { to: "/pro/servicos", label: "Cadastrar serviços" },
    },
    {
      key: "hours",
      label: "Configurar horários de atendimento",
      weight: 12,
      done: agg.businessHoursCount > 0,
      hint: "Sem horários o paciente não consegue agendar direto.",
      action: { to: "/pro/agenda", label: "Configurar horários" },
    },
    {
      key: "cover",
      label: "Adicionar banner de capa",
      weight: 5,
      done: !!pro?.cover_url,
      hint: "Deixa sua landing page com aparência profissional e memorável.",
      action: { to: "/onboarding-pro", label: "Adicionar banner" },
    },
    {
      key: "gallery",
      label: "Adicionar fotos da estrutura",
      weight: 6,
      done: agg.galleryCount >= 3,
      hint: "Galerias com 3+ fotos aumentam o tempo de permanência na página.",
      action: { to: "/pro/servicos", label: "Adicionar fotos" },
    },
    {
      key: "experience",
      label: "Informar anos de experiência",
      weight: 3,
      done: !!(pro?.years_experience && pro.years_experience > 0),
      hint: "Reforça sua autoridade profissional.",
      action: { to: "/onboarding-pro", label: "Editar" },
    },
    {
      key: "formation",
      label: "Adicionar formação acadêmica",
      weight: 4,
      done: !!pro?.academic_formation,
      hint: "Formação visível gera confiança imediata.",
      action: { to: "/onboarding-pro", label: "Adicionar" },
    },
    {
      key: "price",
      label: "Definir valor da consulta",
      weight: 5,
      done: !!(pro?.consultation_price && pro.consultation_price > 0),
      hint: "Perfis com preço claro convertem melhor que 'sob consulta'.",
      action: { to: "/pro/servicos", label: "Definir preço" },
    },
    {
      key: "contact",
      label: "Adicionar WhatsApp e Instagram",
      weight: 4,
      done: !!(pro?.whatsapp || pro?.phone) && !!pro?.instagram,
      hint: "Aumenta os canais de contato direto com pacientes.",
      action: { to: "/onboarding-pro", label: "Adicionar contatos" },
    },
    {
      key: "address",
      label: "Cadastrar endereço completo",
      weight: 6,
      done: !!(pro?.address_street && pro?.address_city && pro?.address_state),
      hint: "Sem endereço seu perfil não aparece em buscas geográficas.",
      action: { to: "/onboarding-pro", label: "Cadastrar endereço" },
    },
    {
      key: "map",
      label: "Confirmar localização no mapa",
      weight: 3,
      done: !!(pro?.latitude && pro?.longitude),
      hint: "Permite calcular distância e destaque em buscas por proximidade.",
      action: { to: "/onboarding-pro", label: "Confirmar" },
    },
    {
      key: "verified",
      label: "Verificar conselho profissional",
      weight: 5,
      done: !!pro?.council_verified_at,
      hint: "Selo Verificado transmite segurança e sobe seu ranking.",
      action: { to: "/onboarding-pro", label: "Enviar documento" },
    },
  ];

  const total = items.reduce((s, i) => s + i.weight, 0);
  const scored = items.reduce((s, i) => s + (i.done ? i.weight : 0), 0);
  const score = Math.min(100, Math.round((scored / total) * 100));

  return {
    score,
    items,
    missing: items.filter((i) => !i.done),
    done: items.filter((i) => i.done),
  };
}
