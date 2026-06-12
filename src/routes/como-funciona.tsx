import { createFileRoute, Link } from "@tanstack/react-router";
import { Search, UserCheck, CalendarClock, CreditCard, MapPin, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/livvo/marketing-shell";

export const Route = createFileRoute("/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como funciona — Livvo" },
      { name: "description", content: "Em 5 passos: busque, escolha o parceiro, selecione o horário, pague e compareça ao atendimento presencial." },
      { property: "og:title", content: "Como funciona a Livvo" },
      { property: "og:description", content: "Da busca ao atendimento presencial em 5 passos simples." },
    ],
  }),
  component: Page,
});

const steps = [
  { Icon: Search, title: "Busque o serviço", desc: "Procure por especialidade, exame, procedimento ou parceiro na sua cidade." },
  { Icon: UserCheck, title: "Escolha o parceiro", desc: "Compare perfis verificados, avaliações, serviços e preços." },
  { Icon: CalendarClock, title: "Selecione o horário", desc: "Veja a agenda em tempo real e escolha o melhor dia e hora." },
  { Icon: CreditCard, title: "Pague com segurança", desc: "Pagamento direto na plataforma. Receba a confirmação na hora." },
  { Icon: MapPin, title: "Compareça ao atendimento", desc: "Vá ao local marcado. Tudo presencial, do começo ao fim." },
];

function Page() {
  return (
    <MarketingShell>
      <section className="border-b border-border/60 bg-card/40 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            Como funciona
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Da busca ao atendimento em 5 passos.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A Livvo conecta você aos melhores parceiros de saúde presencial da sua região.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-24">
        <div className="mx-auto max-w-4xl px-5">
          <ol className="space-y-6">
            {steps.map((s, i) => (
              <li key={s.title} className="flex gap-5 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
                <div className="grid size-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary">
                  <s.Icon className="size-6" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-muted-foreground">PASSO {i + 1}</span>
                  </div>
                  <h2 className="mt-1 text-xl font-bold">{s.title}</h2>
                  <p className="mt-1 text-muted-foreground">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>

          <div className="mt-12 flex flex-wrap justify-center gap-3">
            <Link to="/auth" search={{ mode: "signup", role: "paciente" }}>
              <Button size="lg" className="rounded-xl">Buscar atendimento agora</Button>
            </Link>
            <Link to="/para-parceiros">
              <Button size="lg" variant="outline" className="rounded-xl">
                Sou parceiro <ArrowRight className="ml-1 size-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
