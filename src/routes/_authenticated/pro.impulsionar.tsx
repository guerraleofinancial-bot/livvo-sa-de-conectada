import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Sparkles, Eye, MousePointerClick, CalendarCheck, TrendingUp, Crown, X } from "lucide-react";
import { listFeaturedPlans, subscribeToPlan, myActiveSubscriptions, cancelSubscription, adsAnalyticsForProvider } from "@/lib/livvo/ads.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pro/impulsionar")({
  component: Impulsionar,
});

type Plan = { id: string; code: string; name: string; kind: "premium" | "regional" | "category" | "perfil_premium"; price_cents: number; duration_days: number; description: string | null; perks: string[] };

function Impulsionar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const listPlans = useServerFn(listFeaturedPlans);
  const subscribe = useServerFn(subscribeToPlan);
  const myActive = useServerFn(myActiveSubscriptions);
  const cancel = useServerFn(cancelSubscription);
  const analytics = useServerFn(adsAnalyticsForProvider);

  const target = { targetType: "professional" as const, targetId: user?.id ?? "" };

  const { data: plans } = useQuery({ queryKey: ["ad-plans"], queryFn: () => listPlans() });
  const { data: subs } = useQuery({ queryKey: ["ad-subs", user?.id], enabled: !!user, queryFn: () => myActive({ data: target }) });
  const { data: kpis } = useQuery({ queryKey: ["ad-kpis", user?.id], enabled: !!user, queryFn: () => analytics({ data: { ...target, days: 30 } }) });

  const [pickPlan, setPickPlan] = useState<Plan | null>(null);

  const contract = useMutation({
    mutationFn: async (input: { planId: string; regions?: { state: string; city?: string }[]; categories?: { specialtyId?: string }[] }) =>
      subscribe({ data: { ...target, ...input } }),
    onSuccess: () => { toast.success("Plano ativado!"); qc.invalidateQueries({ queryKey: ["ad-subs"] }); setPickPlan(null); },
    onError: (e) => {
      const msg = (e as Error).message ?? "";
      if (msg.startsWith("ONBOARDING_REQUIRED:")) {
        toast.error(msg.replace("ONBOARDING_REQUIRED:", ""));
        setPickPlan(null);
        navigate({ to: "/onboarding-pro" });
        return;
      }
      toast.error(msg);
    },
  });

  return (
    <div className="px-5 pt-10 pb-8 space-y-6 livvo-fade-in">
      <header>
        <div className="flex items-center gap-2 mb-1">
          <Sparkles className="size-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Impulsionar Perfil</h1>
        </div>
        <p className="text-sm text-muted-foreground">Apareça nas primeiras posições e receba mais agendamentos.</p>
      </header>

      <section className="grid grid-cols-2 gap-2">
        {[
          { icon: Eye, label: "Impressões", value: kpis?.impressions ?? 0 },
          { icon: MousePointerClick, label: "Cliques", value: kpis?.clicks ?? 0 },
          { icon: CalendarCheck, label: "Agendamentos", value: kpis?.bookings ?? 0 },
          { icon: TrendingUp, label: "Conversão", value: `${(kpis?.conversion ?? 0).toFixed(1)}%` },
        ].map((k) => (
          <div key={k.label} className="rounded-2xl bg-card border border-border p-3">
            <k.icon className="size-4 text-primary mb-1" />
            <p className="font-mono text-xl font-bold">{k.value}</p>
            <p className="text-[10px] text-muted-foreground">{k.label} · 30d</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Assinaturas ativas</h2>
        <div className="space-y-2">
          {(subs ?? []).filter((s) => s.status === "ativo").map((s) => {
            const plan = (s as typeof s & { featured_plans: { name: string; kind: string } | null }).featured_plans;
            return (
              <div key={s.id} className="p-3 rounded-2xl bg-card border border-border flex items-center gap-3">
                <Crown className="size-4 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{plan?.name}</p>
                  <p className="text-[10px] text-muted-foreground">Expira em {new Date(s.ends_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <Button size="sm" variant="ghost" onClick={async () => { await cancel({ data: { subscriptionId: s.id } }); toast.success("Cancelado"); qc.invalidateQueries({ queryKey: ["ad-subs"] }); }}>
                  <X className="size-4" />
                </Button>
              </div>
            );
          })}
          {subs && subs.filter((s) => s.status === "ativo").length === 0 && (
            <p className="text-xs text-muted-foreground">Nenhum destaque ativo.</p>
          )}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Planos disponíveis</h2>
        <div className="space-y-3">
          {(plans ?? []).map((p) => (
            <div key={p.id} className="p-4 rounded-2xl bg-card border border-border">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-bold">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{p.description}</p>
                </div>
                <p className="font-mono text-base font-bold whitespace-nowrap">R$ {(p.price_cents / 100).toFixed(0)}</p>
              </div>
              <ul className="mt-2 space-y-0.5">
                {(p.perks as string[]).map((perk) => (
                  <li key={perk} className="text-[11px] text-muted-foreground">• {perk}</li>
                ))}
              </ul>
              <Button size="sm" className="mt-3 w-full" onClick={() => setPickPlan(p as unknown as Plan)}>Contratar {p.duration_days} dias</Button>
            </div>
          ))}
        </div>
      </section>

      {pickPlan && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 p-5" onClick={() => setPickPlan(null)}>
          <div className="bg-card rounded-3xl p-6 w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg">Contratar {pickPlan.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">Valor: <span className="font-mono font-bold">R$ {(pickPlan.price_cents / 100).toFixed(2)}</span> · {pickPlan.duration_days} dias</p>
            <p className="text-xs text-muted-foreground mt-3">Pagamento simulado (em produção: Paddle).</p>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => setPickPlan(null)}>Cancelar</Button>
              <Button className="flex-1" disabled={contract.isPending} onClick={() => contract.mutate({ planId: pickPlan.id })}>
                {contract.isPending ? "..." : "Confirmar"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
