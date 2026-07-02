import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HeartPulse,
  ShieldCheck,
  Stethoscope,
  Building2,
  FlaskConical,
  ArrowRight,
  Users,
  Briefcase,
  Network,
  Sparkles,
  BadgeCheck,
  CalendarClock,
  CreditCard,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/livvo/marketing-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Livvo | O ecossistema da saúde presencial" },
      {
        name: "description",
        content:
          "A Livvo conecta pacientes, profissionais e empresas de saúde em um único ecossistema: busca, agendamento, pagamento, gestão e crescimento.",
      },
      { property: "og:title", content: "Livvo | O ecossistema da saúde presencial" },
      {
        property: "og:description",
        content: "Uma plataforma que conecta pacientes, profissionais e clínicas.",
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
            "Ecossistema da saúde presencial que conecta pacientes, profissionais e empresas.",
        }),
      },
    ],
  }),
  component: Landing,
});

const pillars = [
  {
    Icon: Users,
    title: "Pacientes",
    desc: "Encontram, agendam e pagam atendimentos presenciais com profissionais verificados.",
  },
  {
    Icon: Stethoscope,
    title: "Profissionais",
    desc: "Recebem novos pacientes e gerenciam agenda, CRM, cobranças e financeiro em um só lugar.",
  },
  {
    Icon: Building2,
    title: "Clínicas e laboratórios",
    desc: "Divulgam serviços, integram equipes e centralizam operação em uma vitrine única.",
  },
];

const ecosystem = [
  { Icon: CalendarClock, title: "Agenda inteligente", desc: "Horários em tempo real, confirmações automáticas e lembretes." },
  { Icon: CreditCard, title: "Pagamentos integrados", desc: "Cobrança digital, split e repasse automático para o parceiro." },
  { Icon: BadgeCheck, title: "Verificação documental", desc: "Todo parceiro passa por análise de identidade, conselho e especialidade." },
  { Icon: Sparkles, title: "Centro de crescimento", desc: "Marketing, página pública, kit de divulgação e métricas de conversão." },
];

function Landing() {
  return (
    <MarketingShell>
      {/* Hero neutro */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(173_70%_92%)_0%,transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-5 pt-16 pb-16 md:pt-24 md:pb-24 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
            <span className="size-2 rounded-full bg-health animate-pulse" />
            O ecossistema da saúde presencial
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-bold leading-[1.08] tracking-tight md:text-[3.25rem]">
            Conectando toda a saúde presencial em{" "}
            <span className="text-primary">um único ecossistema</span>.
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted-foreground md:text-lg">
            A Livvo une pacientes, profissionais, clínicas e laboratórios em uma plataforma
            que organiza busca, agendamento, pagamento, gestão e crescimento.
          </p>

          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a href="#como-usar">
              <Button size="lg" className="rounded-xl">
                Como você deseja utilizar? <ArrowRight className="ml-1 size-4" />
              </Button>
            </a>
            <Link to="/como-funciona">
              <Button size="lg" variant="outline" className="rounded-xl">
                Conheça a plataforma
              </Button>
            </Link>
          </div>

          <div className="mt-8 flex flex-wrap justify-center items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-health" /> Ambiente seguro</div>
            <div className="flex items-center gap-2"><BadgeCheck className="size-4 text-health" /> Parceiros verificados</div>
            <div className="flex items-center gap-2"><Stethoscope className="size-4 text-health" /> Apenas presencial</div>
          </div>
        </div>
      </section>

      {/* Pilares do ecossistema */}
      <section className="border-t border-border/60 bg-card/40 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Ecossistema Livvo</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight md:text-4xl">Três públicos, uma plataforma</h2>
            <p className="mt-3 text-muted-foreground">
              Cada agente do cuidado presencial ganha ferramentas próprias, sem misturar experiências.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {pillars.map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* O que a plataforma oferece */}
      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">O que a Livvo oferece</h2>
            <p className="mt-3 text-muted-foreground">
              Infraestrutura completa para o cuidado presencial acontecer sem atritos.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {ecosystem.map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como você deseja usar: bifurcação */}
      <section id="como-usar" className="border-t border-border/60 bg-gradient-to-b from-card/40 to-surface py-20 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
              <Network className="size-3.5" /> Escolha seu caminho
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Como você deseja utilizar a Livvo?</h2>
            <p className="mt-3 text-muted-foreground">
              Cada perfil tem uma experiência dedicada, com cadastro, login e área próprios.
            </p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-2">
            {/* Caminho Paciente */}
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elevated)] transition hover:-translate-y-1">
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-primary/10 blur-2xl" />
              <div className="grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
                <Users className="size-7" />
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-tight">Sou paciente</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Quero encontrar, agendar e pagar consultas, exames e procedimentos presenciais com
                profissionais verificados perto de mim.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {[
                  "Busca por especialidade, cidade e serviço",
                  "Agendamento em tempo real",
                  "Pagamento seguro na plataforma",
                  "Profissionais com documentação verificada",
                ].map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-health text-white text-xs">✓</span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-2">
                <Link to="/para-pacientes">
                  <Button className="rounded-xl">Conhecer área do paciente <ArrowRight className="ml-1 size-4" /></Button>
                </Link>
                <Link to="/auth" search={{ mode: "signup", role: "paciente" }}>
                  <Button variant="outline" className="rounded-xl">Criar conta grátis</Button>
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Já tem conta? <Link to="/auth" search={{ mode: "login", role: "paciente" }} className="font-semibold text-primary hover:underline">Entrar como paciente</Link>
              </p>
            </div>

            {/* Caminho Profissional / Empresa */}
            <div className="group relative overflow-hidden rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elevated)] transition hover:-translate-y-1">
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-health/10 blur-2xl" />
              <div className="grid size-14 place-items-center rounded-2xl bg-health text-white shadow-sm">
                <Briefcase className="size-7" />
              </div>
              <h3 className="mt-5 text-2xl font-bold tracking-tight">Sou profissional ou empresa</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Quero divulgar meus serviços, receber pacientes da minha região e gerenciar toda a
                operação completa em um só lugar: agenda, CRM, cobranças, financeiro e marketing.
              </p>
              <ul className="mt-5 space-y-2 text-sm">
                {[
                  "Marketplace de alta intenção",
                  "Perfil público otimizado e verificado",
                  "CRM, agenda, cobranças e financeiro integrados",
                  "Centro de crescimento e destaques patrocinados",
                ].map((i) => (
                  <li key={i} className="flex items-center gap-2">
                    <span className="grid size-5 shrink-0 place-items-center rounded-full bg-health text-white text-xs">✓</span>
                    <span>{i}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-7 flex flex-wrap gap-2">
                <Link to="/para-parceiros">
                  <Button className="rounded-xl bg-health text-white hover:bg-health/90">
                    Conhecer área do profissional <ArrowRight className="ml-1 size-4" />
                  </Button>
                </Link>
                <Link to="/auth" search={{ mode: "signup", role: "profissional" }}>
                  <Button variant="outline" className="rounded-xl">Cadastrar-se como parceiro</Button>
                </Link>
              </div>
              <p className="mt-3 text-xs text-muted-foreground">
                Já é parceiro? <Link to="/auth" search={{ mode: "login", role: "profissional" }} className="font-semibold text-primary hover:underline">Entrar como profissional</Link>
                {" · "}
                <Link to="/para-empresas" className="font-semibold text-primary hover:underline">Sou empresa/clínica</Link>
              </p>
            </div>
          </div>

          <p className="mx-auto mt-8 max-w-xl text-center text-xs text-muted-foreground">
            Cada área possui cadastro e login independentes. Uma mesma pessoa não pode ser paciente
            e profissional na mesma conta. Isso garante segurança e clareza de identidade.
          </p>
        </div>
      </section>

      {/* Confiança */}
      <section className="border-t border-border/60 py-14">
        <div className="mx-auto max-w-6xl px-5 grid gap-6 md:grid-cols-3 text-center">
          <div>
            <p className="text-3xl font-bold text-primary">100%</p>
            <p className="mt-1 text-sm text-muted-foreground">dos parceiros passam por verificação documental</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary">Presencial</p>
            <p className="mt-1 text-sm text-muted-foreground">Livvo é focada em atendimento presencial. Não fazemos telemedicina.</p>
          </div>
          <div>
            <p className="text-3xl font-bold text-primary flex items-center justify-center gap-1"><FlaskConical className="size-6" /> +</p>
            <p className="mt-1 text-sm text-muted-foreground">Médicos, dentistas, clínicas, laboratórios e centros de imagem</p>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
