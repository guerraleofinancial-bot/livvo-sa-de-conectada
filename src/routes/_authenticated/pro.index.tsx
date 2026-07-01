import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getCrmDashboard } from "@/lib/livvo/crm.functions";
import { Calendar, Users, Star, Wallet, Clock, FileText, TrendingUp, UserCheck, UserX, AlertTriangle, RefreshCw, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { NewPatientDialog } from "@/components/livvo/new-patient-dialog";
import { ImportPatientsDialog, NewPatientButtons } from "@/components/livvo/import-patients-dialog";
import { ApprovalBanner } from "@/components/livvo/ApprovalBanner";

export const Route = createFileRoute("/_authenticated/pro/")({
  component: ProHome,
});

function ProHome() {
  const { user } = useAuth();
  const dashFn = useServerFn(getCrmDashboard);
  const [openNew, setOpenNew] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  const { data: pro } = useQuery({
    queryKey: ["me-pro", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("professionals").select("*, profiles:profiles!professionals_profile_fkey(full_name), specialties(name)").eq("id", user!.id).maybeSingle()).data,
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

  const { data: today } = useQuery({
    queryKey: ["pro-today", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      const end = new Date(start); end.setDate(end.getDate() + 1);
      const nowIso = new Date().toISOString();
      const back30 = new Date(); back30.setDate(back30.getDate() - 30);
      const [{ data: dayRows }, { data: pendRows }, { data: doneRows }, { data: futureRows }] = await Promise.all([
        supabase.from("appointments").select("status, scheduled_at").eq("professional_id", user!.id).gte("scheduled_at", start.toISOString()).lt("scheduled_at", end.toISOString()),
        supabase.from("appointments").select("id").eq("professional_id", user!.id).in("status", ["agendada", "confirmada"]).lt("scheduled_at", nowIso),
        supabase.from("appointments").select("patient_id").eq("professional_id", user!.id).eq("status", "realizada").gte("scheduled_at", back30.toISOString()),
        supabase.from("appointments").select("patient_id").eq("professional_id", user!.id).in("status", ["agendada", "confirmada"]).gte("scheduled_at", nowIso),
      ]);
      const rows = dayRows ?? [];
      const count = (s: string) => rows.filter((r) => r.status === s).length;
      const awaiting = rows.filter((r) => r.status === "agendada" && new Date(r.scheduled_at) >= new Date()).length;
      const futureIds = new Set((futureRows ?? []).map((r) => r.patient_id).filter(Boolean));
      const returnsIds = new Set((doneRows ?? []).map((r) => r.patient_id).filter((p) => p && !futureIds.has(p)));
      return {
        total: rows.length,
        done: count("realizada"),
        cancelled: count("cancelada"),
        noShow: count("nao_compareceu"),
        pending: (pendRows ?? []).length,
        awaiting,
        returns: returnsIds.size,
      };
    },
  });



  const p = pro as (typeof pro & { profiles: { full_name?: string } | null; specialties: { name?: string } | null }) | null;
  const convRate = Number(dash?.conversion_rate ?? 0);

  return (
    <div className="px-5 pt-10 space-y-6 livvo-fade-in">
      <header>
        <p className="text-xs font-medium text-muted-foreground">Painel profissional</p>
        <h1 className="text-2xl font-bold tracking-tight">Olá, {p?.profiles?.full_name?.split(" ")[0] ?? ""}</h1>
        <p className="text-sm text-muted-foreground">{p?.specialties?.name}</p>
      </header>

      <ApprovalBanner />

      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold">Hoje</h2>
          <Link to="/pro/agenda" className="text-xs font-semibold text-primary">Ver agenda</Link>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { icon: Calendar, label: "Do dia", value: today?.total ?? 0, tone: "primary" as const },
            { icon: CheckCircle2, label: "Feitas", value: today?.done ?? 0, tone: "health" as const },
            { icon: UserX, label: "Faltas", value: today?.noShow ?? 0, tone: "warning" as const },
            { icon: RefreshCw, label: "Cancel.", value: today?.cancelled ?? 0, tone: "primary" as const },
            { icon: AlertTriangle, label: "Pend.", value: today?.pending ?? 0, tone: "warning" as const },
          ].map((s) => {
            const toneCls = s.tone === "health" ? "bg-health-soft text-health"
              : s.tone === "warning" ? "bg-warning-soft text-warning"
              : "bg-primary-soft text-primary";
            return (
              <div key={s.label} className="rounded-2xl bg-card border border-border p-2 flex flex-col items-center text-center">
                <div className={`size-7 rounded-lg grid place-items-center mb-1 ${toneCls}`}>
                  <s.icon className="size-3.5" />
                </div>
                <p className="font-mono text-base font-bold leading-none">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-primary-soft/40 p-4">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="size-4 text-primary" />
          <h2 className="text-sm font-bold">Resumo do dia</h2>
        </div>
        <p className="text-sm text-muted-foreground mb-3">Hoje você possui:</p>
        <ul className="text-sm space-y-1.5">
          <li>• <span className="font-semibold">{today?.total ?? 0}</span> consultas agendadas</li>
          <li>• <span className="font-semibold">{today?.awaiting ?? 0}</span> aguardando confirmação</li>
          <li>• <span className="font-semibold text-warning">{today?.pending ?? 0}</span> pendentes de definição</li>
          <li>• <span className="font-semibold">{today?.returns ?? 0}</span> retornos para agendar</li>
        </ul>
        {(today?.pending ?? 0) > 0 && (
          <Link to="/pro/agenda" className="mt-3 inline-block text-xs font-semibold text-primary">Resolver pendências →</Link>
        )}
      </section>

      <section>


        <div className="flex items-center justify-between mb-3 gap-3 flex-wrap">
          <h2 className="text-sm font-bold">Visão comercial · últimos 30 dias</h2>
          <NewPatientButtons onNew={() => setOpenNew(true)} onImport={() => setOpenImport(true)} />
        </div>
        <NewPatientDialog open={openNew} onOpenChange={setOpenNew} />
        <ImportPatientsDialog open={openImport} onOpenChange={setOpenImport} />
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
