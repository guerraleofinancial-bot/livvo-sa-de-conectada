import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MarketingShell } from "@/components/livvo/marketing-shell";

export const Route = createFileRoute("/planos-e-precos")({
  head: () => ({
    meta: [
      { title: "Planos e preços | Livvo" },
      { name: "description", content: "Plano gratuito com 90 dias sem comissão, Perfil Premium e destaques patrocinados. Veja todos os planos da Livvo." },
      { property: "og:title", content: "Planos e preços | Livvo" },
      { property: "og:description", content: "Comece grátis com 90 dias sem comissão. Cresça com Perfil Premium e destaques patrocinados." },
    ],
  }),
  component: Page,
});

type Plan = {
  name: string;
  badge?: string;
  price: string;
  priceNote?: string;
  description: string;
  features: string[];
  cta: string;
  highlight?: boolean;
};

const plans: Plan[] = [
  {
    name: "Plano Gratuito",
    badge: "Comece aqui",
    price: "R$ 0",
    priceNote: "para sempre",
    description: "Cadastre-se grátis e atraia seus primeiros pacientes.",
    features: [
      "90 dias sem comissão sobre agendamentos",
      "Perfil padrão verificado",
      "Agenda online integrada",
      "Pagamento e repasse automáticos",
      "Suporte por e-mail",
    ],
    cta: "Criar conta grátis",
  },
  {
    name: "Perfil Premium",
    badge: "Mais escolhido",
    price: "Sob consulta",
    priceNote: "mensalidade",
    description: "Mais visibilidade, mais credibilidade, mais agendamentos.",
    features: [
      "Selo de parceiro Premium",
      "Galeria expandida (fotos e vídeos)",
      "Posicionamento orgânico acima do padrão",
      "Métricas detalhadas de visitas e conversão",
      "Suporte prioritário",
    ],
    cta: "Falar com a Livvo",
    highlight: true,
  },
  {
    name: "Destaques Patrocinados",
    badge: "Para escalar",
    price: "A partir de R$",
    priceNote: "por destaque ativo",
    description: "Apareça primeiro nas buscas e categorias mais procuradas.",
    features: [
      "Destaque Regional: sua cidade ou estado",
      "Destaque por Categoria: sua especialidade",
      "Patrocinado Premium: topo absoluto da busca",
      "Métricas de cliques e agendamentos atribuídos",
      "Pause e reative quando quiser",
    ],
    cta: "Conhecer destaques",
  },
];

function Page() {
  return (
    <MarketingShell>
      <section className="border-b border-border/60 bg-card/40 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-5 text-center">
          <span className="inline-flex rounded-full bg-primary-soft px-3 py-1 text-xs font-semibold text-primary">
            Planos e preços
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight md:text-5xl">
            Comece grátis. Cresça quando quiser.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
            A Livvo combina um plano gratuito com 90 dias sem comissão e opções pagas
            de visibilidade para parceiros que querem escalar.
          </p>
        </div>
      </section>

      <section className="py-16 md:py-20">
        <div className="mx-auto grid max-w-6xl gap-6 px-5 md:grid-cols-3">
          {plans.map((p) => (
            <div
              key={p.name}
              className={`relative flex flex-col rounded-3xl border bg-card p-7 shadow-[var(--shadow-card)] ${
                p.highlight ? "border-primary ring-2 ring-primary/20" : "border-border"
              }`}
            >
              {p.badge && (
                <span
                  className={`absolute -top-3 left-7 inline-flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${
                    p.highlight ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {p.highlight && <Star className="size-3 fill-current" />}
                  {p.badge}
                </span>
              )}
              <h2 className="text-xl font-bold">{p.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{p.description}</p>
              <div className="mt-5">
                <span className="font-mono text-3xl font-bold text-primary">{p.price}</span>
                {p.priceNote && <span className="ml-2 text-xs text-muted-foreground">{p.priceNote}</span>}
              </div>
              <ul className="mt-6 flex-1 space-y-3 text-sm">
                {p.features.map((f) => (
                  <li key={f} className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-health" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
              <Link to="/auth" search={{ mode: "signup", role: "profissional" }} className="mt-7 block">
                <Button className="w-full rounded-xl" variant={p.highlight ? "default" : "outline"}>
                  {p.cta}
                </Button>
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Regras financeiras */}
      <section className="border-t border-border/60 bg-card/40 py-16 md:py-20">
        <div className="mx-auto max-w-4xl px-5">
          <div className="mx-auto mb-10 max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight md:text-4xl">Como funcionam comissão e repasses</h2>
            <p className="mt-3 text-muted-foreground">Transparência total: você sempre sabe quanto recebe.</p>
          </div>
          <div className="grid gap-4">
            {[
              {
                t: "90 dias sem comissão",
                d: "Novos parceiros recebem 100% do valor de cada agendamento durante os primeiros 90 dias após a aprovação do cadastro.",
              },
              {
                t: "Comissão padrão",
                d: "Após o período promocional, a Livvo retém uma comissão por agendamento concluído. O valor atual será confirmado na assinatura do termo de parceria.",
              },
              {
                t: "Repasses automáticos",
                d: "Os valores líquidos são repassados diretamente para a conta bancária cadastrada, conforme calendário de liquidação informado no painel.",
              },
              {
                t: "Destaques patrocinados",
                d: "São cobrados separadamente da comissão e podem ser pausados a qualquer momento no painel de Impulsionar.",
              },
              {
                t: "Reembolsos",
                d: "Cancelamentos e reembolsos seguem a política da plataforma e respeitam o Código de Defesa do Consumidor.",
              },
            ].map((r) => (
              <div key={r.t} className="flex gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary-soft text-primary">
                  <Sparkles className="size-5" />
                </div>
                <div>
                  <p className="font-semibold">{r.t}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{r.d}</p>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-8 text-center text-xs text-muted-foreground">
            Valores promocionais e percentuais podem ser ajustados pela Livvo mediante aviso prévio.
          </p>
          <div className="mt-10 text-center">
            <Link to="/auth" search={{ mode: "signup", role: "profissional" }}>
              <Button size="lg" className="rounded-xl">Quero ser parceiro</Button>
            </Link>
          </div>
        </div>
      </section>
    </MarketingShell>
  );
}
