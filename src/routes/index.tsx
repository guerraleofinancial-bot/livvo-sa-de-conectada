import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Search,
  Sparkles,
  CalendarClock,
  CreditCard,
  Stethoscope,
  ShieldCheck,
  BadgeCheck,
  Building2,
  FlaskConical,
  ClipboardList,
  Users,
  Briefcase,
  Star,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  MapPin,
  FileCheck2,
  UserCheck,
  ScanSearch,
  Lock,
  HeartHandshake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/livvo/marketing-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Livvo | Sua saúde conectada em um único lugar" },
      {
        name: "description",
        content:
          "A Livvo conecta pacientes, profissionais, clínicas, laboratórios e centros de diagnóstico em uma plataforma segura para encontrar, agendar e pagar consultas, exames e procedimentos presenciais.",
      },
      { property: "og:title", content: "Livvo | Sua saúde conectada em um único lugar" },
      {
        property: "og:description",
        content:
          "Encontre profissionais verificados, agende atendimentos presenciais e pague com segurança em uma única plataforma.",
      },
      { property: "og:url", content: "https://livvo-conecta-saude.lovable.app/" },
      { property: "og:type", content: "website" },
    ],
    links: [{ rel: "canonical", href: "https://livvo-conecta-saude.lovable.app/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "Livvo Saúde Conectada",
          url: "https://livvo-conecta-saude.lovable.app/",
          description:
            "Plataforma que conecta pacientes, profissionais e empresas da saúde presencial.",
        }),
      },
    ],
  }),
  component: Landing,
});

/* ────────────────── SEÇÃO 3 · Como funciona ────────────────── */
const steps = [
  {
    Icon: Search,
    title: "Encontre",
    desc: "Pesquise profissionais, clínicas, laboratórios ou exames próximos de você.",
  },
  {
    Icon: ScanSearch,
    title: "Escolha",
    desc: "Compare perfis, especialidades, preços e disponibilidade.",
  },
  {
    Icon: CalendarClock,
    title: "Agende",
    desc: "Escolha o melhor horário diretamente pela plataforma.",
  },
  {
    Icon: CreditCard,
    title: "Pague",
    desc: "Realize o pagamento com segurança e acompanhe todas as informações pelo aplicativo.",
  },
  {
    Icon: Stethoscope,
    title: "Realize seu atendimento",
    desc: "Compareça ao atendimento presencial e acompanhe seu histórico na Livvo.",
  },
];

/* ────────────────── SEÇÃO 4 · Quem faz parte ────────────────── */
const audiences = [
  {
    Icon: Stethoscope,
    title: "Profissionais",
    desc: "Especialistas de diversas áreas da saúde.",
    cta: "Ver profissionais",
    to: "/app/buscar/profissionais" as const,
  },
  {
    Icon: Building2,
    title: "Clínicas",
    desc: "Encontre clínicas verificadas perto de você.",
    cta: "Ver clínicas",
    to: "/app/buscar/clinicas" as const,
  },
  {
    Icon: FlaskConical,
    title: "Laboratórios",
    desc: "Pesquise laboratórios parceiros para exames e diagnósticos.",
    cta: "Ver laboratórios",
    to: "/app/buscar/laboratorios" as const,
  },
  {
    Icon: ClipboardList,
    title: "Exames",
    desc: "Encontre rapidamente onde realizar o exame que você precisa.",
    cta: "Ver exames",
    to: "/app/buscar/exames" as const,
  },
];

/* ────────────────── SEÇÃO 5 · Segurança e verificação ────────────────── */
const trustCards = [
  {
    Icon: BadgeCheck,
    title: "Profissionais verificados",
    desc: "Nossa equipe analisa documentos, registros profissionais e informações cadastrais antes da aprovação de cada parceiro.",
  },
  {
    Icon: Lock,
    title: "Pagamento protegido",
    desc: "Todo o processo financeiro acontece dentro da plataforma, oferecendo mais segurança para pacientes e profissionais.",
  },
  {
    Icon: Sparkles,
    title: "Marketplace especializado",
    desc: "Encontre profissionais, clínicas, laboratórios e exames organizados em um único ambiente.",
  },
  {
    Icon: ClipboardList,
    title: "Tudo em um só lugar",
    desc: "Agenda, pagamentos, histórico de atendimentos e comunicação centralizados em uma única plataforma.",
  },
];

const verificationFlow = [
  { Icon: UserCheck, label: "Cadastro" },
  { Icon: FileCheck2, label: "Envio da documentação" },
  { Icon: ScanSearch, label: "Análise da equipe Livvo" },
  { Icon: ShieldCheck, label: "Validação" },
  { Icon: BadgeCheck, label: "Perfil aprovado" },
  { Icon: Sparkles, label: "Selo Parceiro Verificado" },
];

/* ────────────────── SEÇÃO 7 · FAQ ────────────────── */
const faqs = [
  {
    q: "Como faço um agendamento?",
    a: "Escolha o profissional, selecione um horário disponível e confirme seu atendimento diretamente pela plataforma.",
  },
  {
    q: "Como funciona o pagamento?",
    a: "O pagamento é realizado pela Livvo, garantindo mais segurança para todas as partes.",
  },
  {
    q: "Todos os profissionais são verificados?",
    a: "Todos os parceiros aprovados passam por um processo interno de análise documental antes da publicação do perfil.",
  },
  {
    q: "A Livvo realiza atendimentos?",
    a: "Não. A Livvo conecta pacientes e parceiros da área da saúde. O atendimento é realizado diretamente pelo profissional ou empresa escolhidos.",
  },
];

function Landing() {
  return (
    <MarketingShell>
      {/* ══════════════════ SEÇÃO 1 · HERO ══════════════════ */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(173_70%_92%)_0%,transparent_70%)]" />
        <div className="mx-auto grid max-w-6xl gap-12 px-5 pt-14 pb-14 md:pt-20 md:pb-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-16">
          {/* Coluna esquerda: texto */}
          <div className="text-center lg:text-left">
            <span className="inline-flex animate-in fade-in slide-in-from-top-2 items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm duration-500">
              <span className="size-2 rounded-full bg-health animate-pulse" />
              Saúde presencial conectada
            </span>

            <h1 className="mx-auto mt-6 max-w-3xl animate-in fade-in slide-in-from-bottom-2 text-4xl font-bold leading-[1.08] tracking-tight duration-700 md:text-[3.25rem] lg:mx-0">
              Sua saúde conectada em{" "}
              <span className="text-primary">um único lugar</span>.
            </h1>

            <p className="mx-auto mt-5 max-w-2xl animate-in fade-in text-base leading-relaxed text-muted-foreground duration-700 md:text-lg lg:mx-0">
              A Livvo conecta pacientes, profissionais, clínicas, laboratórios e
              centros de diagnóstico em uma plataforma segura para encontrar,
              agendar e pagar consultas, exames e procedimentos presenciais.
            </p>

            <div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-start">
              <a href="#escolha-experiencia">
                <Button size="lg" className="rounded-xl transition-transform hover:-translate-y-0.5">
                  Começar agora
                  <ArrowRight className="ml-1 size-4" />
                </Button>
              </a>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 lg:justify-start">
              <TrustPill Icon={BadgeCheck} label="Parceiros verificados" />
              <TrustPill Icon={Lock} label="Pagamento seguro" />
              <TrustPill Icon={Stethoscope} label="Atendimento presencial" />
            </div>
          </div>

          {/* Coluna direita: mockup do app */}
          <div className="relative flex justify-center lg:justify-end">
            <HeroPhoneMockup />
          </div>
        </div>
      </section>

      {/* ══════════════════ SEÇÃO 2 · ESCOLHA SUA EXPERIÊNCIA ══════════════════ */}
      <section id="escolha-experiencia" className="scroll-mt-20 border-t border-border/60 bg-gradient-to-b from-card/40 to-transparent py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeader
            eyebrow="Escolha sua experiência"
            title="Como você deseja utilizar a Livvo?"
          />

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {/* Paciente */}
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elevated)] transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-2xl" />
              <div className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Users className="size-7" />
              </div>
              <h3 className="mt-6 text-2xl font-bold tracking-tight">Sou paciente</h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Encontre profissionais, clínicas, laboratórios e exames. Agende
                atendimentos com segurança e acompanhe tudo em um único lugar.
              </p>
              <div className="mt-7">
                <Link to="/auth" search={{ mode: "signup", role: "paciente" }}>
                  <Button className="rounded-xl transition-transform hover:-translate-y-0.5">
                    Criar conta como paciente
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </Link>
              </div>
            </div>

            {/* Profissional / Empresa */}
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elevated)] transition-all duration-300 hover:-translate-y-1">
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-health/10 blur-2xl" />
              <div className="grid size-14 place-items-center rounded-2xl bg-health text-white shadow-sm">
                <Briefcase className="size-7" />
              </div>
              <h3 className="mt-6 text-2xl font-bold tracking-tight">
                Sou profissional ou empresa
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Receba novos pacientes, organize sua agenda, administre cobranças
                e fortaleça sua presença digital dentro da Livvo.
              </p>
              <div className="mt-7">
                <Link to="/para-parceiros">
                  <Button className="rounded-xl bg-health text-white transition-transform hover:-translate-y-0.5 hover:bg-health/90">
                    Conhecer área profissional
                    <ArrowRight className="ml-1 size-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════ SEÇÃO 3 · COMO FUNCIONA ══════════════════ */}
      <section className="border-t border-border/60 bg-card/40 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeader
            eyebrow="Passo a passo"
            title="Como funciona a Livvo"
            subtitle="Em poucos passos você encontra o atendimento que procura."
          />

          <ol className="mt-14 grid gap-5 md:grid-cols-3 lg:grid-cols-5">
            {steps.map(({ Icon, title, desc }, i) => (
              <li
                key={title}
                className="group relative rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
              >
                <span className="absolute -top-3 left-6 grid size-7 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground shadow-sm">
                  {i + 1}
                </span>
                <div className="grid size-11 place-items-center rounded-2xl bg-primary-soft text-primary transition-transform group-hover:scale-105">
                  <Icon className="size-5" />
                </div>
                <h3 className="mt-5 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ══════════════════ SEÇÃO 4 · QUEM FAZ PARTE ══════════════════ */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeader
            eyebrow="Quem faz parte da Livvo"
            title="Tudo o que você procura em um único lugar."
          />

          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {audiences.map(({ Icon, title, desc, cta, to }) => (
              <Link
                key={title}
                to={to}
                className="group relative flex flex-col overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="absolute -right-14 -top-14 size-40 rounded-full bg-primary/5 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />
                <div className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm transition-transform group-hover:scale-105">
                  <Icon className="size-7" />
                </div>
                <h3 className="mt-6 text-xl font-bold tracking-tight">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                  {cta}
                  <ChevronRight className="size-4 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ SEÇÃO 5 · SEGURANÇA E VERIFICAÇÃO ══════════════════ */}
      <section className="border-t border-border/60 bg-card/40 py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <SectionHeader
            eyebrow="Segurança e verificação"
            title="Mais segurança para pacientes e parceiros."
            subtitle="Cada parceiro passa por uma análise antes de entrar na Livvo."
          />

          {/* Cards de benefício */}
          <div className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {trustCards.map(({ Icon, title, desc }) => (
              <article
                key={title}
                className="group rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary transition-transform group-hover:scale-105">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {desc}
                </p>
              </article>
            ))}
          </div>

          {/* Fluxo de verificação */}
          <div className="mt-14 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)] md:p-10">
            <p className="text-center text-xs font-semibold uppercase tracking-[0.14em] text-primary">
              Processo de verificação
            </p>
            <ol className="mt-8 grid gap-3 md:grid-cols-6">
              {verificationFlow.map(({ Icon, label }, i) => (
                <li
                  key={label}
                  className="relative flex flex-col items-center text-center"
                >
                  <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary transition-transform hover:scale-105">
                    <Icon className="size-5" />
                  </div>
                  <p className="mt-3 text-xs font-semibold leading-tight">
                    {label}
                  </p>
                  {i < verificationFlow.length - 1 && (
                    <ChevronRight className="absolute -right-2 top-3 hidden size-4 text-muted-foreground/50 md:block" />
                  )}
                </li>
              ))}
            </ol>
          </div>

          <div className="mx-auto mt-8 flex max-w-2xl items-start gap-3 rounded-2xl border border-border bg-primary-soft/40 p-5">
            <BadgeCheck className="mt-0.5 size-5 shrink-0 text-primary" />
            <p className="text-sm leading-relaxed text-foreground">
              O selo Parceiro Verificado significa que aquele profissional ou
              empresa passou pelo processo interno de validação da Livvo.
            </p>
          </div>
        </div>
      </section>

      {/* ══════════════════ SEÇÃO 6 · POR QUE CRIAMOS A LIVVO ══════════════════ */}
      <section className="py-20 md:py-24">
        <div className="mx-auto max-w-4xl px-5">
          <SectionHeader
            eyebrow="Nossa história"
            title="Nascemos para simplificar o acesso à saúde."
            subtitle="A Livvo foi criada para eliminar a burocracia entre pacientes e profissionais de saúde, unindo busca, agendamento, pagamento e histórico em um único lugar, com segurança em cada etapa."
          />

          <div className="mx-auto mt-12 flex max-w-2xl items-start gap-4 rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-card)]">
            <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
              <HeartHandshake className="size-5" />
            </div>
            <p className="text-sm leading-relaxed text-foreground">
              Estamos no início dessa jornada e cada parceiro que entra na
              plataforma passa pelo mesmo processo rigoroso de verificação. É
              assim que construímos confiança desde o primeiro dia.
            </p>
          </div>

          {/* Placeholder para futuras avaliações reais. Ative com showReviews={true}
              e um array real assim que houver atendimentos concluídos. */}
          <ReviewsSection showReviews={false} reviews={[]} />
        </div>
      </section>

      {/* ══════════════════ SEÇÃO 7 · FAQ ══════════════════ */}
      <section className="border-t border-border/60 bg-card/40 py-20 md:py-24">
        <div className="mx-auto max-w-3xl px-5">
          <SectionHeader
            eyebrow="Perguntas frequentes"
            title="Tire suas dúvidas sobre a Livvo."
          />
          <div className="mt-12 divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card shadow-[var(--shadow-card)]">
            {faqs.map((f, i) => (
              <FaqRow key={i} q={f.q} a={f.a} />
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════ SEÇÃO 8 · CHAMADA FINAL ══════════════════ */}
      <section className="relative overflow-hidden py-20 md:py-28">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(50%_60%_at_50%_50%,hsl(173_70%_92%)_0%,transparent_70%)]" />
        <div className="mx-auto max-w-3xl px-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">
            Pronto para começar?
          </h2>
          <div className="mx-auto mt-5 max-w-xl space-y-3 text-base leading-relaxed text-muted-foreground">
            <p>A busca por atendimento de saúde confiável começa aqui.</p>
            <p>
              Faça parte da Livvo e tenha acesso a uma plataforma criada para
              conectar pessoas e facilitar toda a jornada do atendimento
              presencial.
            </p>
          </div>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup", role: "paciente" }}>
              <Button size="lg" className="rounded-xl transition-transform hover:-translate-y-0.5">
                Criar conta
                <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
            <Link to="/auth" search={{ mode: "login", role: "paciente" }}>
              <Button size="lg" variant="outline" className="rounded-xl transition-transform hover:-translate-y-0.5">
                Entrar
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}

/* ────────────────── helpers ────────────────── */

function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="mx-auto max-w-2xl text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary">
        {eyebrow}
      </p>
      <h2 className="mt-3 text-3xl font-bold tracking-tight md:text-4xl">
        {title}
      </h2>
      {subtitle && (
        <p className="mt-4 text-base leading-relaxed text-muted-foreground">
          {subtitle}
        </p>
      )}
    </div>
  );
}

function TrustPill({
  Icon,
  label,
}: {
  Icon: typeof BadgeCheck;
  label: string;
}) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 shadow-sm">
      <Icon className="size-4 text-health" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

function FaqRow({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center gap-3 px-6 py-5 text-left transition-colors hover:bg-muted/40"
      >
        <span className="flex-1 text-[15px] font-semibold">{q}</span>
        <ChevronDown
          className={`size-4 shrink-0 text-muted-foreground transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>
      {open && (
        <p className="animate-in fade-in slide-in-from-top-1 px-6 pb-6 text-sm leading-relaxed text-muted-foreground duration-200">
          {a}
        </p>
      )}
    </div>
  );
}

/* ────────────────── Avaliações (placeholder pronto para o futuro) ────────────────── */

type Review = {
  name: string;
  city: string;
  specialty: string;
  rating: number;
  text: string;
};

function ReviewsSection({
  showReviews,
  reviews,
}: {
  showReviews: boolean;
  reviews: Review[];
}) {
  if (!showReviews || reviews.length === 0) return null;

  return (
    <div className="mt-16">
      <SectionHeader
        eyebrow="Avaliações"
        title="Experiências compartilhadas por pacientes."
        subtitle="Veja o que outros usuários disseram após seus atendimentos."
      />
      <div className="mt-10 grid gap-5 md:grid-cols-3">
        {reviews.map((r) => (
          <figure
            key={r.name + r.text}
            className="flex flex-col rounded-3xl border border-border bg-card p-7 shadow-[var(--shadow-card)] transition-all duration-300 hover:-translate-y-1 hover:shadow-[var(--shadow-elevated)]"
          >
            <div className="flex items-center gap-1 text-primary">
              {Array.from({ length: r.rating }).map((_, i) => (
                <Star key={i} className="size-4 fill-current" />
              ))}
              <span className="ml-2 text-sm font-bold text-foreground">
                {r.rating.toFixed(1)}
              </span>
            </div>
            <blockquote className="mt-4 flex-1 text-[15px] leading-relaxed text-foreground">
              “{r.text}”
            </blockquote>
            <figcaption className="mt-6 border-t border-border/60 pt-4">
              <p className="text-sm font-semibold">{r.name}</p>
              <p className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Stethoscope className="size-3.5" /> {r.specialty}
                </span>
                <span className="text-border">•</span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="size-3.5" /> {r.city}
                </span>
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  );
}

/* ────────────────── Hero · mockup de celular ──────────────────
   Demonstração ilustrativa da interface de busca. Nomes fictícios,
   sem sugerir base de parceiros já cadastrada. */

type SearchResult = {
  name: string;
  detail: string;
  Icon: typeof Stethoscope;
  tone: "primary" | "health";
};

const heroResults: SearchResult[] = [
  { name: "Dra. Camila Rocha", detail: "Dermatologista", Icon: Stethoscope, tone: "primary" },
  { name: "Dr. Rafael Nunes", detail: "Cardiologista", Icon: Stethoscope, tone: "primary" },
  { name: "Clínica Vida Plena", detail: "Check up completo", Icon: Building2, tone: "health" },
  { name: "Laboratório Diagnóstica", detail: "Exames de sangue", Icon: FlaskConical, tone: "health" },
];

function HeroPhoneMockup() {
  return (
    <div className="relative w-full max-w-[320px] animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* halo */}
      <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/20 via-transparent to-health/20 blur-2xl" />

      {/* phone frame */}
      <div className="relative rounded-[2.4rem] border border-border/70 bg-neutral-900 p-2 shadow-[0_30px_60px_-20px_rgba(15,42,60,0.35)]">
        <div className="relative overflow-hidden rounded-[2rem] bg-card">
          {/* notch */}
          <div className="absolute left-1/2 top-2 z-10 h-5 w-24 -translate-x-1/2 rounded-full bg-neutral-900" />

          {/* app content */}
          <div className="pt-9 pb-5">
            {/* top bar */}
            <div className="flex items-center justify-between px-5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  Livvo
                </p>
                <p className="text-sm font-bold">Boa tarde 👋</p>
              </div>
              <div className="grid size-8 place-items-center rounded-full bg-primary-soft text-primary text-xs font-bold">
                C
              </div>
            </div>

            {/* search bar */}
            <div className="mx-5 mt-4 flex items-center gap-2 rounded-2xl border border-border bg-muted/40 px-3 py-2.5">
              <Search className="size-4 text-muted-foreground" />
              <span className="text-[13px] text-muted-foreground">Buscar especialidade ou exame</span>
            </div>

            {/* filter chips */}
            <div className="mt-3 flex gap-1.5 overflow-hidden px-5">
              {["Perto de mim", "Hoje", "Convênio"].map((c) => (
                <span
                  key={c}
                  className="whitespace-nowrap rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-medium text-foreground"
                >
                  {c}
                </span>
              ))}
            </div>

            {/* results list */}
            <ul className="mt-4 space-y-2 px-3">
              {heroResults.map((r) => (
                <li
                  key={r.name}
                  className="flex items-center gap-3 rounded-2xl border border-border/70 bg-card px-3 py-2.5 shadow-[var(--shadow-card)]"
                >
                  <div
                    className={`grid size-10 shrink-0 place-items-center rounded-xl ${
                      r.tone === "primary"
                        ? "bg-primary-soft text-primary"
                        : "bg-health/10 text-health"
                    }`}
                  >
                    <r.Icon className="size-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <p className="truncate text-[13px] font-semibold">{r.name}</p>
                      <BadgeCheck className="size-3.5 shrink-0 text-primary" />
                    </div>
                    <p className="truncate text-[11px] text-muted-foreground">{r.detail}</p>
                  </div>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground/60" />
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* floating verified badge */}
      <div className="absolute -left-3 top-24 hidden rotate-[-6deg] items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-elevated)] md:flex">
        <div className="grid size-8 place-items-center rounded-full bg-primary text-primary-foreground">
          <BadgeCheck className="size-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Parceiro
          </p>
          <p className="text-xs font-bold">Verificado</p>
        </div>
      </div>

      {/* floating payment badge */}
      <div className="absolute -right-4 bottom-16 hidden rotate-[4deg] items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 shadow-[var(--shadow-elevated)] md:flex">
        <div className="grid size-8 place-items-center rounded-full bg-health text-white">
          <Lock className="size-4" />
        </div>
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            Pagamento
          </p>
          <p className="text-xs font-bold">Seguro</p>
        </div>
      </div>
    </div>
  );
}
