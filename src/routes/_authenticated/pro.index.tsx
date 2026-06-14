import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getCrmDashboard } from "@/lib/livvo/crm.functions";
import { Calendar, Users, Star, Wallet, Clock, FileText, TrendingUp, UserCheck, UserX } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pro/")({
  component: ProHome,
});

function ProHome() {
  const { user } = useAuth();
  const dashFn = useServerFn(getCrmDashboard);

  const { data: pro } = useQuery({
    queryKey: ["me-pro", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("professionals").select("*, profiles:id(full_name), specialties(name)").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: dash } = useQuery({
    queryKey: ["crm-dashboard", user?.id],
    enabled: !!user,
    queryFn: () => dashFn({ data: { rangeDays: 30 } }),
  });

  const { data: nextAppts } = useQuery({
    queryKey: ["pro-next", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("appointments").select("*, profiles:patient_id(full_name)").eq("professional_id", user!.id).in("status", ["agendada", "confirmada"]).gte("scheduled_at", new Date().toISOString()).order("scheduled_at").limit(5)).data ?? [],
  });

  const p = pro as (typeof pro & { profiles: { full_name?: string } | null; specialties: { name?: string } | null }) | null;
  const convRate = Number(dash?.conversion_rate ?? 0);

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

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Visão comercial · últimos 30 dias</h2>
          <Link to="/pro/crm" className="text-xs font-semibold text-primary">CRM</Link>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: "Leads", value: dash?.leads ?? 0, tone: "primary" },
            { icon: Calendar, label: "Agendamentos", value: dash?.appointments_created ?? 0, tone: "primary" },
            { icon: UserCheck, label: "Atendidos", value: dash?.appointments_done ?? 0, tone: "health" },
            { icon: UserX, label: "Cancelados", value: dash?.cancellations ?? 0, tone: "primary" },
            { icon: FileText, label: "Orçamentos", value: dash?.quotes_sent ?? 0, tone: "primary" },
            { icon: TrendingUp, label: "Conversão", value: `${(convRate * 100).toFixed(0)}%`, tone: "health" },
            { icon: Wallet, label: "Receita", value: `R$ ${Number(dash?.revenue ?? 0).toFixed(0)}`, tone: "health" },
            { icon: Star, label: "Ticket méd.", value: `R$ ${Number(dash?.avg_ticket ?? 0).toFixed(0)}`, tone: "health" },
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
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">Pacientes ativos</p>
          <p className="text-2xl font-bold mt-1">{dash?.patients_active ?? 0}</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-4">
          <p className="text-xs text-muted-foreground">Pacientes inativos</p>
          <p className="text-2xl font-bold mt-1">{dash?.patients_inactive ?? 0}</p>
        </div>
      </section>

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
