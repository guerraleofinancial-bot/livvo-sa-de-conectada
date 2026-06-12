import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Sparkles, Wallet, Calendar, BadgeCheck, TrendingUp, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/livvo/marketing-shell";

export const Route = createFileRoute("/para-parceiros")({
  head: () => ({
    meta: [
      { title: "Para parceiros — Livvo" },
      { name: "description", content: "Receba pacientes da sua região todos os dias. 90 dias sem comissão, agenda online, pagamentos integrados e destaque patrocinado." },
      { property: "og:title", content: "Seja parceiro Livvo" },
      { property: "og:description", content: "Atraia novos pacientes com agenda online, pagamento integrado e destaque patrocinado." },
    ],
  }),
  component: Page,
});

const benefits = [
  { Icon: BadgeCheck, title: "Cadastro verificado", desc: "Perfil aprovado pela equipe Livvo, gerando confiança imediata." },
  { Icon: Calendar, title: "Agenda online integrada", desc: "Pacientes agendam direto. Você controla horários e bloqueios." },
  { Icon: Wallet, title: "Pagamento e repasse automáticos", desc: "Receba direto na sua conta, com relatórios em tempo real." },
  { Icon: Sparkles, title: "Destaque patrocinado", desc: "Apareça primeiro nas buscas e categorias da sua especialidade." },
  { Icon: TrendingUp, title: "90 dias sem comissão", desc: "Receba 100% nos primeiros 90 dias após a aprovação." },
  { Icon: CheckCircle2, title: "Suporte humano", desc: "Time dedicado para ajudar você a vender mais." },
];

function Page() {
  return (
    <MarketingShell>
      <section className="border-b border-border/60 bg-card/40 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="inline-flex rounded-full bg-health-soft px-3 py-1 text-xs font-semibold text-health">
            Para parceiros Livvo
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Receba pacientes da sua região <span className="text-primary">todos os dias.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Médicos, dentistas, psicólogos, fisioterapeutas, esteticistas e demais profissionais da saúde:
            cadastre-se grátis e comece a atender em minutos.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup", role: "profissional" }}>
              <Button size="lg" className="rounded-xl">Quero ser parceiro</Button>
            </Link>
            <Link to="/planos-e-precos">
              <Button size="lg" variant="outline" className="rounded-xl">
                Ver planos e preços <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Tudo que você precisa em um só lugar.</h2>
            <p className="mt-3 text-muted-foreground">Do primeiro agendamento ao repasse na sua conta.</p>
          </div>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

      <section className="border-t border-border/60 bg-card/40 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-5">
          <h2 className="text-center text-3xl font-bold tracking-tight md:text-4xl">Como começar</h2>
          <ol className="mt-10 space-y-4">
            {[
              { t: "Crie sua conta gratuita", d: "Escolha 'Sou parceiro' no cadastro." },
              { t: "Complete seu perfil profissional", d: "Foto, registro, especialidades, documentos e localização." },
              { t: "Cadastre seus serviços", d: "Consultas, exames, procedimentos e pacotes — com valores claros." },
              { t: "Configure sua agenda", d: "Horários disponíveis e regras de atendimento." },
              { t: "Comece a receber pacientes", d: "Os primeiros 90 dias são sem comissão." },
            ].map((s, i) => (
              <li key={s.t} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-bold">
                  {i + 1}
                </div>
                <div>
                  <p className="font-semibold">{s.t}</p>
                  <p className="text-sm text-muted-foreground">{s.d}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="mt-10 text-center">
            <Link to="/auth" search={{ mode: "signup", role: "profissional" }}>
              <Button size="lg" className="rounded-xl">Criar conta de parceiro</Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
