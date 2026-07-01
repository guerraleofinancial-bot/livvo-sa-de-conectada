import { createFileRoute, Link } from "@tanstack/react-router";
import {
  HeartPulse,
  ShieldCheck,
  CalendarClock,
  CreditCard,
  BadgeCheck,
  Stethoscope,
  Smile,
  Brain,
  Activity,
  Building2,
  FlaskConical,
  ScanLine,
  Flower2,
  ArrowRight,
  Search,
  MapPin,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/livvo/marketing-shell";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Livvo — Marketplace de saúde presencial: consultas, exames e procedimentos" },
      {
        name: "description",
        content:
          "Encontre, agende e pague consultas, exames e procedimentos presenciais com parceiros verificados da sua região.",
      },
      { property: "og:title", content: "Livvo — Marketplace de saúde presencial" },
      {
        property: "og:description",
        content: "Encontre, agende e pague consultas, exames e procedimentos em um só lugar.",
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
            "Marketplace de saúde presencial para agendamento de consultas, exames e procedimentos.",
        }),
      },
    ],
  }),
  component: Landing,
});

const categories: { name: string; Icon: typeof Stethoscope }[] = [
  { name: "Médicos", Icon: Stethoscope },
  { name: "Dentistas", Icon: Smile },
  { name: "Psicólogos", Icon: Brain },
  { name: "Fisioterapeutas", Icon: Activity },
  { name: "Clínicas", Icon: Building2 },
  { name: "Laboratórios", Icon: FlaskConical },
  { name: "Diagnóstico por Imagem", Icon: ScanLine },
  { name: "Estética e Bem-estar", Icon: Flower2 },
];

const benefits = [
  { Icon: CalendarClock, title: "Agendamento em tempo real", desc: "Veja horários disponíveis e confirme em segundos." },
  { Icon: CreditCard, title: "Pagamento seguro", desc: "Pague direto na plataforma, sem surpresas." },
  { Icon: BadgeCheck, title: "Profissionais com documentação verificada", desc: "Nossa equipe analisa documentos e registros profissionais antes da aprovação na plataforma." },
  { Icon: Sparkles, title: "Tudo em um só lugar", desc: "Consultas, exames, procedimentos e pacotes." },
];

function Landing() {
  return (
    <MarketingShell>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(215_85%_94%)_0%,transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-16 md:pt-24 md:pb-24">
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div className="livvo-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground shadow-sm">
                <span className="size-2 rounded-full bg-health animate-pulse" />
                Marketplace de saúde presencial
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight md:text-[3.25rem]">
                Encontre, agende e pague{" "}
                <span className="text-primary">consultas, exames e procedimentos</span>{" "}
                em um só lugar.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                A Livvo conecta você a médicos, dentistas, clínicas, laboratórios e centros de diagnóstico
                da sua região — com pagamento seguro e atendimento presencial.
              </p>

              <div className="mt-7 rounded-2xl border border-border bg-card p-2 shadow-[var(--shadow-elevated)]">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                  <label className="flex min-w-0 items-center gap-2 rounded-xl px-3 py-2.5">
                    <Search className="size-4 shrink-0 text-muted-foreground" />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Especialidade, exame ou serviço"
                      aria-label="O que você procura"
                    />
                  </label>
                  <label className="flex min-w-0 items-center gap-2 rounded-xl border-t border-border px-3 py-2.5 sm:border-t-0 sm:border-l">
                    <MapPin className="size-4 shrink-0 text-muted-foreground" />
                    <input
                      className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                      placeholder="Cidade ou bairro"
                      aria-label="Localização"
                    />
                  </label>
                  <Link to="/auth" search={{ mode: "signup", role: "paciente" }} className="contents">
                    <Button size="lg" className="rounded-xl">Buscar</Button>
                  </Link>
                </div>
              </div>

              <div className="mt-5 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <div className="flex items-center gap-2"><ShieldCheck className="size-4 text-health" /> Pagamento seguro</div>
                <div className="flex items-center gap-2"><BadgeCheck className="size-4 text-health" /> Parceiros verificados</div>
                <div className="flex items-center gap-2"><Stethoscope className="size-4 text-health" /> Apenas presencial</div>
              </div>
            </div>

            {/* Mock device */}
            <div className="livvo-slide-up relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/20 via-health/10 to-transparent blur-2xl" />
              <div className="overflow-hidden rounded-[2.5rem] border-8 border-foreground/90 bg-surface shadow-2xl">
                <div className="bg-primary px-6 pt-10 pb-8 text-primary-foreground">
                  <p className="text-xs opacity-80">Próximo atendimento presencial</p>
                  <p className="mt-1 text-lg font-semibold">Sua consulta na Livvo</p>
                  <p className="text-xs opacity-80">Especialista da sua região</p>
                  <div className="mt-5 flex items-center gap-2 rounded-2xl bg-white/15 px-3 py-2 backdrop-blur">
                    <MapPin className="size-4" />
                    <p className="text-xs">Clínica parceira · sua cidade</p>
                  </div>
                </div>

                <div className="space-y-3 p-5">
                  {[
                    { s: "Hemograma completo", p: "R$ 38" },
                    { s: "Limpeza dental", p: "R$ 120" },
                    { s: "Ultrassom abdome", p: "R$ 180" },
                  ].map((s) => (
                    <div key={s.s} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3">
                      <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                        <HeartPulse className="size-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold">{s.s}</p>
                        <p className="text-xs text-muted-foreground">Presencial</p>
                      </div>
                      <span className="shrink-0 text-sm font-bold text-primary">{s.p}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section id="categorias" className="border-t border-border/60 bg-card/40 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold tracking-tight md:text-3xl">O que você pode encontrar na Livvo</h2>
              <p className="mt-2 max-w-xl text-muted-foreground">
                Consultas, exames, procedimentos e pacotes de saúde presenciais.
              </p>
            </div>
            <Link to="/auth" search={{ mode: "signup", role: "paciente" }} className="hidden sm:inline-flex">
              <Button variant="ghost" className="gap-1">Explorar tudo <ArrowRight className="size-4" /></Button>
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {categories.map(({ name, Icon }) => (
              <Link
                key={name}
                to="/auth"
                search={{ mode: "signup", role: "paciente" }}
                className="group flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-elevated)]"
              >
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary transition group-hover:bg-primary group-hover:text-primary-foreground">
                  <Icon className="size-5" />
                </div>
                <span className="min-w-0 truncate text-sm font-semibold">{name}</span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section id="beneficios" className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Por que escolher a Livvo</h2>
            <p className="mt-3 text-muted-foreground">
              Uma experiência simples e segura — do agendamento ao atendimento.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {benefits.map(({ Icon, title, desc }) => (
              <div key={title} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <Icon className="size-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link to="/como-funciona">
              <Button variant="outline" size="lg" className="rounded-xl">
                Veja como funciona <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* For partners — single consolidated block */}
      <section className="border-t border-border/60 bg-card/40 py-16 md:py-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-2 md:items-center">
          <div>
            <span className="inline-flex rounded-full bg-health-soft px-3 py-1 text-xs font-semibold text-health">
              Para parceiros Livvo
            </span>
            <h2 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">
              Receba pacientes da sua região todos os dias.
            </h2>
            <p className="mt-4 text-muted-foreground">
              Médicos, dentistas, psicólogos, clínicas, laboratórios e empresas de estética:
              cadastre-se grátis e comece a atender em minutos.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              {[
                "90 dias sem comissão para novos parceiros",
                "Agenda online integrada ao pagamento",
                "Destaque patrocinado para atrair mais pacientes",
                "Painel financeiro com repasses automáticos",
              ].map((i) => (
                <li key={i} className="flex items-center gap-3">
                  <span className="grid size-5 shrink-0 place-items-center rounded-full bg-health text-white">✓</span>
                  <span className="text-foreground">{i}</span>
                </li>
              ))}
            </ul>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/para-parceiros">
                <Button size="lg" className="rounded-xl">Para parceiros</Button>
              </Link>
              <Link to="/para-empresas">
                <Button size="lg" variant="outline" className="rounded-xl">Para empresas</Button>
              </Link>
            </div>
          </div>

          <div className="rounded-3xl border border-border bg-card p-8 shadow-[var(--shadow-elevated)]">
            <div className="space-y-4">
              {[
                { t: "Cadastro gratuito", d: "Crie seu perfil em minutos." },
                { t: "Sem comissão por 90 dias", d: "Receba 100% nos primeiros agendamentos." },
                { t: "Destaque patrocinado", d: "Apareça primeiro nas buscas." },
                { t: "Repasses automáticos", d: "Receba direto na sua conta." },
              ].map((b) => (
                <div key={b.t} className="flex items-start gap-3 rounded-2xl border border-border bg-surface p-4">
                  <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                    <Sparkles className="size-4" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{b.t}</p>
                    <p className="text-xs text-muted-foreground">{b.d}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/planos-e-precos" className="mt-5 block">
              <Button variant="ghost" className="w-full gap-1">
                Ver planos e preços <ArrowRight className="size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Comece agora pela Livvo.</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">
            Pacientes encontram atendimento perto de casa. Parceiros recebem novos pacientes todos os dias.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup", role: "paciente" }}>
              <Button size="lg" variant="secondary" className="rounded-xl">Sou paciente</Button>
            </Link>
            <Link to="/auth" search={{ mode: "signup", role: "profissional" }}>
              <Button
                size="lg"
                variant="outline"
                className="rounded-xl border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary"
              >
                Sou parceiro
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
