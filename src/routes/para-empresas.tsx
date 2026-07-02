import { createFileRoute, Link } from "@tanstack/react-router";
import { Building2, Users, BarChart3, Megaphone, ShieldCheck, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/livvo/marketing-shell";

export const Route = createFileRoute("/para-empresas")({
  head: () => ({
    meta: [
      { title: "Para empresas | Livvo" },
      { name: "description", content: "Clínicas, laboratórios, centros de diagnóstico e empresas de estética: capte pacientes, gerencie agenda e financeiro em um só lugar." },
      { property: "og:title", content: "Livvo para empresas de saúde" },
      { property: "og:description", content: "Captação de pacientes, gestão de agenda, financeiro e marketing para clínicas e laboratórios." },
    ],
  }),
  component: Page,
});

const audience = [
  "Clínicas médicas e odontológicas",
  "Laboratórios de análises clínicas",
  "Centros de diagnóstico por imagem",
  "Empresas de estética e bem-estar",
  "Centros de reabilitação e fisioterapia",
  "Núcleos multidisciplinares",
];

const benefits = [
  { Icon: Users, title: "Captação de pacientes", desc: "Aumente o volume de agendamentos com pacientes da sua região." },
  { Icon: BarChart3, title: "Gestão de agenda", desc: "Uma agenda unificada para todos os profissionais e salas." },
  { Icon: ShieldCheck, title: "Gestão financeira", desc: "Repasses automáticos, relatórios e comprovantes em um só lugar." },
  { Icon: Megaphone, title: "Marketing e visibilidade", desc: "Perfil profissional, avaliações reais e destaques patrocinados." },
  { Icon: Sparkles, title: "Destaque patrocinado", desc: "Apareça primeiro por região, categoria ou cidade." },
  { Icon: Building2, title: "Multi-unidades", desc: "Gerencie várias unidades a partir de um único painel." },
];

function Page() {
  return (
    <MarketingShell>
      <section className="border-b border-border/60 bg-card/40 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            Para empresas de saúde
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            A solução completa para clínicas, laboratórios e centros de diagnóstico.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            Captação de pacientes, agenda integrada, pagamentos e marketing — tudo em uma única plataforma.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup", role: "profissional" }}>
              <Button size="lg" className="rounded-xl">Cadastrar minha empresa</Button>
            </Link>
            <Link to="/planos-e-precos">
              <Button size="lg" variant="outline" className="rounded-xl">
                Planos e preços <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-6xl px-5">
          <div className="mx-auto mb-12 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Feito para empresas de saúde.</h2>
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
        <div className="mx-auto max-w-4xl px-5 text-center">
          <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Atendemos toda a cadeia da saúde presencial.</h2>
          <div className="mt-10 grid gap-3 sm:grid-cols-2">
            {audience.map((a) => (
              <div key={a} className="flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left">
                <span className="grid size-6 shrink-0 place-items-center rounded-full bg-health text-white">✓</span>
                <span className="text-sm font-semibold">{a}</span>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <Link to="/auth" search={{ mode: "signup", role: "profissional" }}>
              <Button size="lg" className="rounded-xl">Quero cadastrar minha empresa</Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
