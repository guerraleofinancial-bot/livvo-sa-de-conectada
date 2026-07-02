import { createFileRoute, Link } from "@tanstack/react-router";
import {
  Search,
  MapPin,
  CalendarClock,
  CreditCard,
  BadgeCheck,
  ShieldCheck,
  Stethoscope,
  Smile,
  Brain,
  Activity,
  Building2,
  FlaskConical,
  ScanLine,
  Flower2,
  ArrowRight,
  HeartPulse,
  Users,
  Star,
  Clock,
  Lock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/livvo/marketing-shell";

export const Route = createFileRoute("/para-pacientes")({
  head: () => ({
    meta: [
      { title: "Para pacientes — Encontre, agende e pague na Livvo" },
      {
        name: "description",
        content:
          "Encontre profissionais e clínicas verificadas, agende em tempo real e pague com segurança dentro da Livvo.",
      },
      { property: "og:title", content: "Livvo para pacientes" },
      {
        property: "og:description",
        content: "Consultas, exames e procedimentos presenciais com parceiros verificados.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  component: PatientLanding,
});

const categories = [
  { name: "Médicos", Icon: Stethoscope },
  { name: "Dentistas", Icon: Smile },
  { name: "Psicólogos", Icon: Brain },
  { name: "Fisioterapeutas", Icon: Activity },
  { name: "Clínicas", Icon: Building2 },
  { name: "Laboratórios", Icon: FlaskConical },
  { name: "Diagnóstico por Imagem", Icon: ScanLine },
  { name: "Estética e Bem-estar", Icon: Flower2 },
];

const steps = [
  { n: "1", title: "Busque", desc: "Encontre por especialidade, exame ou serviço na sua região." },
  { n: "2", title: "Escolha", desc: "Compare profissionais verificados, preços e horários disponíveis." },
  { n: "3", title: "Agende", desc: "Selecione o melhor horário e confirme em segundos." },
  { n: "4", title: "Pague com segurança", desc: "Pagamento processado dentro da plataforma, com confirmação imediata." },
];

const benefits = [
  { Icon: CalendarClock, title: "Agendamento em tempo real", desc: "Sem trocar mensagens, sem esperar retorno." },
  { Icon: CreditCard, title: "Pagamento seguro", desc: "Cobrança digital com confirmação e recibo." },
  { Icon: BadgeCheck, title: "Parceiros verificados", desc: "Documentação e conselho profissional validados." },
  { Icon: Clock, title: "Histórico organizado", desc: "Todos os seus atendimentos em um só lugar." },
  { Icon: Lock, title: "Privacidade em primeiro lugar", desc: "Seus dados protegidos por padrão LGPD." },
  { Icon: Star, title: "Avaliações reais", desc: "Somente pacientes atendidos podem avaliar." },
];

function PatientLanding() {
  return (
    <MarketingShell>
      {/* Hero paciente */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_50%_0%,hsl(173_70%_92%)_0%,transparent_70%)]" />
        <div className="mx-auto max-w-6xl px-5 pt-14 pb-14 md:pt-20 md:pb-20">
          <div className="grid gap-10 md:grid-cols-2 md:items-center">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
                <Users className="size-3.5" /> Área do paciente
              </span>
              <h1 className="mt-5 text-4xl font-bold leading-[1.08] tracking-tight md:text-5xl">
                Sua saúde presencial, <span className="text-primary">sem burocracia</span>.
              </h1>
              <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
                Encontre profissionais, clínicas e laboratórios verificados perto de você.
                Agende em tempo real e pague com segurança dentro da Livvo.
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
                <div className="flex items-center gap-2"><BadgeCheck className="size-4 text-health" /> Documentação verificada</div>
                <div className="flex items-center gap-2"><Stethoscope className="size-4 text-health" /> Apenas presencial</div>
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link to="/auth" search={{ mode: "signup", role: "paciente" }}>
                  <Button size="lg" className="rounded-xl">Criar conta de paciente</Button>
                </Link>
                <Link to="/auth" search={{ mode: "login", role: "paciente" }}>
                  <Button size="lg" variant="outline" className="rounded-xl">Entrar</Button>
                </Link>
              </div>
            </div>

            {/* Mock device */}
            <div className="relative mx-auto w-full max-w-sm">
              <div className="absolute -inset-6 -z-10 rounded-[3rem] bg-gradient-to-br from-primary/20 via-health/10 to-transparent blur-2xl" />
              <div className="overflow-hidden rounded-[2.5rem] border-8 border-foreground/90 bg-surface shadow-2xl">
                <div className="bg-primary px-6 pt-10 pb-8 text-primary-foreground">
                  <p className="text-xs opacity-80">Próximo atendimento presencial</p>
                  <p className="mt-1 text-lg font-semibold">Sua consulta na Livvo</p>
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

      {/* Categorias */}
      <section className="border-t border-border/60 bg-card/40 py-14">
        <div className="mx-auto max-w-6xl px-5">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">O que você encontra na Livvo</h2>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {categories.map(({ name, Icon }) => (
              <div key={name} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4">
                <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Icon className="size-5" />
                </div>
                <span className="min-w-0 truncate text-sm font-semibold">{name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Como funciona (paciente) */}
      <section className="py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Como funciona</h2>
            <p className="mt-3 text-muted-foreground">Da busca ao atendimento, sem atritos.</p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s) => (
              <div key={s.n} className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="grid size-10 place-items-center rounded-xl bg-primary text-primary-foreground text-sm font-bold">{s.n}</div>
                <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="border-t border-border/60 bg-card/40 py-16 md:py-20">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Por que os pacientes escolhem a Livvo</h2>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-primary py-16 text-primary-foreground">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Comece agora</h2>
          <p className="mx-auto mt-4 max-w-xl opacity-90">
            Crie sua conta gratuita e agende seu primeiro atendimento presencial em minutos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup", role: "paciente" }}>
              <Button size="lg" variant="secondary" className="rounded-xl">Criar conta de paciente</Button>
            </Link>
            <Link to="/auth" search={{ mode: "login", role: "paciente" }}>
              <Button size="lg" variant="outline" className="rounded-xl border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground hover:text-primary">
                Já tenho conta <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
