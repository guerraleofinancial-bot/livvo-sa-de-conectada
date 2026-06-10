import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, Users, Star, Wallet, Clock } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pro/")({
  component: ProHome,
});

function ProHome() {
  const { user } = useAuth();

  const { data: pro } = useQuery({
    queryKey: ["me-pro", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("professionals").select("*, profiles:id(full_name), specialties(name)").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: stats } = useQuery({
    queryKey: ["pro-stats", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const [total, upcoming, done, revenue] = await Promise.all([
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("professional_id", user!.id),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("professional_id", user!.id).in("status", ["agendada", "confirmada"]).gte("scheduled_at", new Date().toISOString()),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("professional_id", user!.id).eq("status", "realizada"),
        supabase.from("appointments").select("price").eq("professional_id", user!.id).eq("status", "realizada"),
      ]);
      const rev = (revenue.data ?? []).reduce((s, a) => s + Number(a.price), 0);
      return { total: total.count ?? 0, upcoming: upcoming.count ?? 0, done: done.count ?? 0, revenue: rev };
    },
  });

  const { data: nextAppts } = useQuery({
    queryKey: ["pro-next", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("appointments").select("*, profiles:patient_id(full_name)").eq("professional_id", user!.id).in("status", ["agendada", "confirmada"]).gte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(5)).data ?? [],
  });

  const p = pro as (typeof pro & { profiles: { full_name?: string } | null; specialties: { name?: string } | null }) | null;

  return (
    <div className="px-5 pt-10 space-y-6 livvo-fade-in">
      <header>
        <p className="text-xs font-medium text-muted-foreground">Painel profissional</p>
        <h1 className="text-2xl font-bold tracking-tight">Olá, {p?.profiles?.full_name?.split(" ")[0] ?? ""}</h1>
        <p className="text-sm text-muted-foreground">{p?.specialties?.name}</p>
        {p && p.status !== "aprovado" && (
          <div className="mt-4 rounded-xl border border-warning/30 bg-warning/10 p-4 text-sm">
            <p className="font-semibold text-warning-foreground">Cadastro {p.status === "pendente" ? "em análise" : p.status}</p>
            <p className="text-xs text-muted-foreground mt-1">Seu perfil só aparecerá para pacientes após aprovação do administrador.</p>
          </div>
        )}
      </header>

      <div className="grid grid-cols-2 gap-3">
        {[
          { icon: Calendar, label: "Próximas", value: stats?.upcoming ?? 0, tone: "primary" },
          { icon: Users, label: "Realizadas", value: stats?.done ?? 0, tone: "health" },
          { icon: Star, label: "Avaliação", value: p ? Number(p.rating_average).toFixed(1) : "—", tone: "primary" },
          { icon: Wallet, label: "Receita", value: `R$ ${(stats?.revenue ?? 0).toFixed(0)}`, tone: "health" },
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-card border border-border p-4">
            <div className={`size-9 rounded-xl grid place-items-center mb-3 ${s.tone === "primary" ? "bg-primary-soft text-primary" : "bg-health-soft text-health"}`}>
              <s.icon className="size-4" />
            </div>
            <p className="font-mono text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Próximos atendimentos</h2>
          <Link to="/pro/agenda" className="text-xs font-semibold text-primary">Ver agenda</Link>
        </div>
        <div className="space-y-2">
          {(nextAppts ?? []).map((row) => {
            const a = row as typeof row & { profiles: { full_name?: string } | null };
            const d = new Date(a.scheduled_at);
            return (
              <div key={a.id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
                <div className="size-12 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
                  <div className="text-center">
                    <p className="text-[10px] font-bold uppercase">{d.toLocaleDateString("pt-BR", { month: "short" })}</p>
                    <p className="text-base font-bold leading-none">{d.getDate()}</p>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{a.profiles?.full_name ?? "Paciente"}</p>
                  <p className="text-xs text-muted-foreground flex items-center gap-1"><Clock className="size-3" /> {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {a.duration_minutes}min</p>
                </div>
                <Link to="/app/chat/$id" params={{ id: a.id }} className="text-xs font-semibold text-primary">Chat</Link>
              </div>
            );
          })}
          {nextAppts && nextAppts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhum atendimento agendado.</div>
          )}
        </div>
      </section>
    </div>
  );
}
