import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { getCrmDashboard } from "@/lib/livvo/crm.functions";
import {
  Calendar, Users, Star, Wallet, Clock, FileText, TrendingUp, TrendingDown,
  UserCheck, UserX, AlertTriangle, RefreshCw, CheckCircle2, ChevronRight,
  CalendarDays, Receipt, Sparkles,
} from "lucide-react";
import { useState, useMemo } from "react";
import { NewPatientDialog } from "@/components/livvo/new-patient-dialog";
import { ImportPatientsDialog, NewPatientButtons } from "@/components/livvo/import-patients-dialog";
import { ApprovalBanner } from "@/components/livvo/ApprovalBanner";

export const Route = createFileRoute("/_authenticated/pro/")({
  component: ProHome,
});

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bom dia";
  if (h < 18) return "Boa tarde";
  return "Boa noite";
}

function ProHome() {
  const { user } = useAuth();
  const dashFn = useServerFn(getCrmDashboard);
  const [openNew, setOpenNew] = useState(false);
  const [openImport, setOpenImport] = useState(false);

  const { data: pro, isLoading: loadingPro } = useQuery({
    queryKey: ["me-pro", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("professionals").select("*, profiles:profiles!professionals_profile_fkey(full_name), specialties(name)").eq("id", user!.id).maybeSingle()).data,
  });

  const { data: dash, isLoading: loadingDash } = useQuery({
    queryKey: ["crm-dashboard", user?.id],
    enabled: !!user,
    queryFn: () => dashFn({ data: { rangeDays: 30 } }),
  });

  const { data: dashPrev } = useQuery({
    queryKey: ["crm-dashboard-prev", user?.id],
    enabled: !!user,
    queryFn: () => dashFn({ data: { rangeDays: 60 } }),
  });

  const { data: nextAppts, isLoading: loadingNext } = useQuery({
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
      const todayStr = start.toISOString().slice(0, 10);
      const back30 = new Date(); back30.setDate(back30.getDate() - 30);
      const [{ data: dayRows }, { data: pendRows }, { data: doneRows }, { data: futureRows }, { data: overdueBills }, { data: paidToday }] = await Promise.all([
        supabase.from("appointments").select("status, scheduled_at").eq("professional_id", user!.id).gte("scheduled_at", start.toISOString()).lt("scheduled_at", end.toISOString()),
        supabase.from("appointments").select("id").eq("professional_id", user!.id).in("status", ["agendada", "confirmada"]).lt("scheduled_at", nowIso),
        supabase.from("appointments").select("patient_id").eq("professional_id", user!.id).eq("status", "realizada").gte("scheduled_at", back30.toISOString()),
        supabase.from("appointments").select("patient_id").eq("professional_id", user!.id).in("status", ["agendada", "confirmada"]).gte("scheduled_at", nowIso),
        supabase.from("payments").select("id").eq("recipient_id", user!.id).in("status", ["enviada", "visualizada", "pendente", "vencida"]).lt("due_date", todayStr),
        supabase.from("payments").select("net_amount, gross_amount").eq("recipient_id", user!.id).eq("status", "pago").gte("paid_at", start.toISOString()).lt("paid_at", end.toISOString()),
      ]);
      const rows = dayRows ?? [];
      const count = (s: string) => rows.filter((r) => r.status === s).length;
      const awaiting = rows.filter((r) => r.status === "agendada" && new Date(r.scheduled_at) >= new Date()).length;
      const futureIds = new Set((futureRows ?? []).map((r) => r.patient_id).filter(Boolean));
      const returnsIds = new Set((doneRows ?? []).map((r) => r.patient_id).filter((p) => p && !futureIds.has(p)));
      const receivedToday = (paidToday ?? []).reduce((sum, r) => sum + Number(r.net_amount ?? r.gross_amount ?? 0), 0);
      return {
        total: rows.length,
        done: count("realizada"),
        cancelled: count("cancelada"),
        noShow: count("nao_compareceu"),
        pending: (pendRows ?? []).length,
        awaiting,
        returns: returnsIds.size,
        overdueBills: (overdueBills ?? []).length,
        receivedToday,
      };
    },
  });

  const p = pro as (typeof pro & { profiles: { full_name?: string } | null; specialties: { name?: string } | null }) | null;
  const convRate = Number(dash?.conversion_rate ?? 0);
  const revenue = Number(dash?.revenue ?? 0);
  const revenuePrev = Math.max(0, Number(dashPrev?.revenue ?? 0) - revenue);
  const revenueDelta = revenuePrev > 0 ? ((revenue - revenuePrev) / revenuePrev) * 100 : null;

  const profileMissing = !p?.specialties?.name;

  const attention = useMemo(() => {
    const items: Array<{ icon: typeof AlertTriangle; label: string; count: number; tone: "warning" | "danger" | "info"; to?: string }> = [];
    if ((today?.pending ?? 0) > 0) items.push({ icon: AlertTriangle, label: "consultas pendentes de definição", count: today!.pending, tone: "warning", to: "/pro/agenda" });
    if ((today?.overdueBills ?? 0) > 0) items.push({ icon: Receipt, label: "cobranças vencidas", count: today!.overdueBills, tone: "danger", to: "/pro/billing" });
    if ((today?.awaiting ?? 0) > 0) items.push({ icon: Clock, label: "aguardando confirmação", count: today!.awaiting, tone: "info", to: "/pro/agenda" });
    if ((today?.returns ?? 0) > 0) items.push({ icon: RefreshCw, label: "retornos pendentes", count: today!.returns, tone: "info", to: "/pro/crm" });
    if (profileMissing) items.push({ icon: UserCheck, label: "perfil incompleto", count: 1, tone: "warning", to: "/pro/perfil" });
    return items;
  }, [today, profileMissing]);

  const firstName = p?.profiles?.full_name?.split(" ")[0] ?? "";
  const dateLabel = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long" });

  return (
    <div className="px-5 pt-10 pb-24 space-y-8 livvo-fade-in">
      {/* HERO — hierarquia principal */}
      <header className="space-y-1">
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground">{dateLabel}</p>
        {loadingPro ? (
          <div className="h-8 w-56 livvo-shimmer rounded-lg" />
        ) : (
          <h1 className="text-[28px] font-bold tracking-tight leading-tight">
            {greeting()}, <span className="text-primary">{firstName || "Doutor(a)"}</span>
          </h1>
        )}
        <p className="text-sm text-muted-foreground">
          {p?.specialties?.name ?? (loadingPro ? "" : "Complete seu perfil profissional")}
        </p>
      </header>

      <ApprovalBanner />

      {/* PRECISA DA SUA ATENÇÃO */}
      {attention.length > 0 && (
        <section className="rounded-2xl border border-warning/30 bg-gradient-to-br from-warning-soft/60 to-warning-soft/20 p-4 livvo-slide-up">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="size-4 text-warning" />
            <h2 className="text-sm font-bold">Precisa da sua atenção</h2>
          </div>
          <ul className="space-y-1.5">
            {attention.map((item) => {
              const toneCls = item.tone === "danger" ? "text-destructive"
                : item.tone === "warning" ? "text-warning"
                : "text-primary";
              const Row = (
                <div className="group flex items-center gap-3 py-2 px-2 -mx-2 rounded-xl hover:bg-background/60 transition-colors cursor-pointer">
                  <item.icon className={`size-4 shrink-0 ${toneCls}`} />
                  <span className="text-sm flex-1">
                    <span className={`font-bold font-mono ${toneCls}`}>{item.count}</span>{" "}
                    <span className="text-foreground/80">{item.label}</span>
                  </span>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              );
              return (
                <li key={item.label}>
                  {item.to ? <Link to={item.to}>{Row}</Link> : Row}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* HOJE — KPIs operacionais */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h2 className="text-base font-bold">Hoje</h2>
            <p className="text-xs text-muted-foreground">Operação do dia</p>
          </div>
          <Link to="/pro/agenda" className="text-xs font-semibold text-primary inline-flex items-center gap-0.5 hover:gap-1 transition-all">
            Ver agenda <ChevronRight className="size-3.5" />
          </Link>
        </div>
        <div className="grid grid-cols-5 gap-2">
          {[
            { icon: CalendarDays, label: "Do dia", value: today?.total ?? 0, tone: "primary" as const },
            { icon: CheckCircle2, label: "Feitas", value: today?.done ?? 0, tone: "health" as const },
            { icon: UserX, label: "Faltas", value: today?.noShow ?? 0, tone: "warning" as const },
            { icon: RefreshCw, label: "Cancel.", value: today?.cancelled ?? 0, tone: "muted" as const },
            { icon: AlertTriangle, label: "Pend.", value: today?.pending ?? 0, tone: "warning" as const },
          ].map((s) => {
            const toneCls = s.tone === "health" ? "bg-health-soft text-health"
              : s.tone === "warning" ? "bg-warning-soft text-warning"
              : s.tone === "muted" ? "bg-muted text-muted-foreground"
              : "bg-primary-soft text-primary";
            return (
              <div key={s.label} className="livvo-card livvo-card-hover p-2.5 flex flex-col items-center text-center">
                <div className={`size-8 rounded-xl grid place-items-center mb-1.5 ${toneCls}`}>
                  <s.icon className="size-3.5" />
                </div>
                <p className="font-mono text-lg font-bold leading-none tabular-nums">{s.value}</p>
                <p className="text-[10px] text-muted-foreground mt-1 truncate w-full">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* RESUMO ASSISTENTE */}
      <section className="livvo-card p-4 bg-gradient-to-br from-primary-soft/40 to-transparent border-primary/10">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="size-4 text-primary" />
          <h2 className="text-sm font-bold">Resumo do dia</h2>
        </div>
        <p className="text-sm leading-relaxed text-foreground/85">
          Hoje você tem <b className="text-primary tabular-nums">{today?.total ?? 0}</b> consultas,
          {" "}<b className="tabular-nums">{today?.awaiting ?? 0}</b> aguardando confirmação
          {(today?.pending ?? 0) > 0 && <> e <b className="text-warning tabular-nums">{today!.pending}</b> pendentes de definição</>}
          . Você recebeu <b className="text-health tabular-nums">R$ {(today?.receivedToday ?? 0).toFixed(0)}</b> e tem
          {" "}<b className="tabular-nums">{today?.returns ?? 0}</b> retornos para agendar.
        </p>
      </section>

      {/* MARKETING SHORTCUT */}
      <Link to="/pro/marketing" className="livvo-card livvo-card-hover p-4 flex items-center gap-3 bg-gradient-to-br from-primary/5 to-transparent border-primary/20">
        <div className="size-10 rounded-xl bg-primary text-primary-foreground grid place-items-center shrink-0">
          <Sparkles className="size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-bold">Centro de Crescimento</p>
          <p className="text-[11px] text-muted-foreground leading-snug">Página pública, kit de divulgação, perfil 100% e recomendações.</p>
        </div>
        <ChevronRight className="size-4 text-primary shrink-0" />
      </Link>

      {/* VISÃO COMERCIAL */}
      <section>
        <div className="flex items-end justify-between mb-3 gap-3 flex-wrap">
          <div>
            <h2 className="text-base font-bold">Visão comercial</h2>
            <p className="text-xs text-muted-foreground">Últimos 30 dias</p>
          </div>
          <NewPatientButtons onNew={() => setOpenNew(true)} onImport={() => setOpenImport(true)} />
        </div>
        <NewPatientDialog open={openNew} onOpenChange={setOpenNew} />
        <ImportPatientsDialog open={openImport} onOpenChange={setOpenImport} />

        {/* Receita destaque */}
        <div className="livvo-card livvo-card-hover p-4 mb-3 bg-gradient-to-br from-health-soft/40 to-transparent">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-muted-foreground">Receita do mês</p>
              <p className="font-mono text-3xl font-bold tabular-nums mt-1">R$ {revenue.toFixed(0)}</p>
              {revenueDelta !== null && (
                <p className={`text-xs mt-1 inline-flex items-center gap-1 ${revenueDelta >= 0 ? "text-health" : "text-destructive"}`}>
                  {revenueDelta >= 0 ? <TrendingUp className="size-3" /> : <TrendingDown className="size-3" />}
                  {revenueDelta >= 0 ? "+" : ""}{revenueDelta.toFixed(0)}% vs mês anterior
                </p>
              )}
            </div>
            <div className="size-12 rounded-2xl bg-health-soft text-health grid place-items-center">
              <Wallet className="size-5" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Users, label: "Leads", value: dash?.leads ?? 0, tone: "primary" },
            { icon: Calendar, label: "Agendamentos", value: dash?.appointments_created ?? 0, tone: "primary" },
            { icon: UserCheck, label: "Atendidos", value: dash?.appointments_done ?? 0, tone: "health" },
            { icon: UserX, label: "Cancelados", value: dash?.cancellations ?? 0, tone: "muted" },
            { icon: FileText, label: "Orçamentos", value: dash?.quotes_sent ?? 0, tone: "primary" },
            { icon: TrendingUp, label: "Conversão", value: `${(convRate * 100).toFixed(0)}%`, tone: "health" },
            { icon: Star, label: "Ticket méd.", value: `R$ ${Number(dash?.avg_ticket ?? 0).toFixed(0)}`, tone: "health" },
            { icon: Wallet, label: "Recebido hoje", value: `R$ ${(today?.receivedToday ?? 0).toFixed(0)}`, tone: "health" },
          ].map((s) => {
            const toneCls = s.tone === "health" ? "bg-health-soft text-health"
              : s.tone === "muted" ? "bg-muted text-muted-foreground"
              : "bg-primary-soft text-primary";
            return (
              <div key={s.label} className="livvo-card livvo-card-hover p-4">
                <div className={`size-9 rounded-xl grid place-items-center mb-3 ${toneCls}`}>
                  <s.icon className="size-4" />
                </div>
                {loadingDash ? (
                  <div className="h-6 w-16 livvo-shimmer rounded" />
                ) : (
                  <p className="font-mono text-xl font-bold tabular-nums">{s.value}</p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="livvo-card livvo-card-hover p-4">
          <p className="text-xs text-muted-foreground">Pacientes ativos</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{dash?.patients_active ?? 0}</p>
        </div>
        <div className="livvo-card livvo-card-hover p-4">
          <p className="text-xs text-muted-foreground">Pacientes inativos</p>
          <p className="text-2xl font-bold mt-1 tabular-nums">{dash?.patients_inactive ?? 0}</p>
        </div>
      </section>

      {/* PRÓXIMOS ATENDIMENTOS */}
      <section>
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <h2 className="text-base font-bold">Próximos atendimentos</h2>
            <p className="text-xs text-muted-foreground">Sua fila mais próxima</p>
          </div>
          <Link to="/pro/agenda" className="text-xs font-semibold text-primary inline-flex items-center gap-0.5 hover:gap-1 transition-all">
            Ver agenda <ChevronRight className="size-3.5" />
          </Link>
        </div>
        <div className="space-y-2">
          {loadingNext && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="livvo-card p-3 flex items-center gap-3">
              <div className="size-12 livvo-shimmer rounded-xl" />
              <div className="flex-1 space-y-2">
                <div className="h-3 w-32 livvo-shimmer rounded" />
                <div className="h-2.5 w-20 livvo-shimmer rounded" />
              </div>
            </div>
          ))}
          {(nextAppts ?? []).map((row) => {
            const a = row as typeof row & { profiles: { full_name?: string } | null };
            const d = new Date(a.scheduled_at);
            return (
              <Link key={a.id} to="/app/chat/$id" params={{ id: a.id }} className="block">
                <div className="livvo-card livvo-card-hover flex items-center gap-3 p-3 group">
                  <div className="size-12 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase leading-tight">{d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}</p>
                      <p className="text-base font-bold leading-none">{d.getDate()}</p>
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{a.profiles?.full_name ?? "Paciente"}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="size-3" /> {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })} · {a.duration_minutes}min
                    </p>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>
              </Link>
            );
          })}
          {!loadingNext && nextAppts && nextAppts.length === 0 && (
            <div className="livvo-card border-dashed p-8 text-center space-y-3">
              <div className="size-12 mx-auto rounded-2xl bg-primary-soft text-primary grid place-items-center">
                <CalendarDays className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nenhum atendimento agendado</p>
                <p className="text-xs text-muted-foreground mt-1">Aproveite para revisar sua agenda ou cadastrar novos pacientes.</p>
              </div>
              <Link to="/pro/agenda" className="inline-flex items-center gap-1 text-xs font-semibold text-primary">
                Abrir agenda <ChevronRight className="size-3.5" />
              </Link>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
