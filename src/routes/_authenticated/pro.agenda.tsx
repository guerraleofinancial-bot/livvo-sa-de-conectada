import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Calendar as CalendarIcon, Lock, Trash2, Plus, AlertTriangle } from "lucide-react";
import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppointmentActions, isPending, type ApptForActions } from "@/components/livvo/appointment-actions";
import { AppointmentTimelineDialog } from "@/components/livvo/appointment-timeline";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pro/agenda")({
  component: Agenda,
});


const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

const STATUS_LABEL: Record<string, string> = {
  agendada: "Pendente",
  confirmada: "Confirmado",
  em_andamento: "Em andamento",
  realizada: "Concluído",
  cancelada: "Cancelado",
  nao_compareceu: "Não compareceu",
};

const STATUS_STYLE: Record<string, string> = {
  agendada: "bg-warning-soft text-warning",
  confirmada: "bg-primary-soft text-primary",
  em_andamento: "bg-accent text-accent-foreground",
  realizada: "bg-health-soft text-health",
  cancelada: "bg-destructive/10 text-destructive",
  nao_compareceu: "bg-muted text-muted-foreground",
};

type ApptRow = {
  id: string;
  patient_id: string | null;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  service_id: string | null;
  patient_name: string;
  service_name: string;
};

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x; }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x; }
function sameDay(a: Date, b: Date) { return a.toDateString() === b.toDateString(); }

function Agenda() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: appts } = useQuery({
    queryKey: ["pro-agenda", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<ApptRow[]> => {
      const { data: rows } = await supabase
        .from("appointments")
        .select("id, patient_id, scheduled_at, duration_minutes, status, service_id")
        .eq("professional_id", user!.id)
        .order("scheduled_at");
      const list = rows ?? [];
      const patientIds = Array.from(new Set(list.map((r) => r.patient_id).filter(Boolean) as string[]));
      const serviceIds = Array.from(new Set(list.map((r) => r.service_id).filter(Boolean) as string[]));
      const [{ data: profiles }, { data: contacts }, { data: services }] = await Promise.all([
        patientIds.length ? supabase.from("profiles").select("id, full_name").in("id", patientIds) : Promise.resolve({ data: [] as any[] }),
        patientIds.length ? supabase.from("crm_contacts").select("id, full_name").in("id", patientIds) : Promise.resolve({ data: [] as any[] }),
        serviceIds.length ? supabase.from("services").select("id, name").in("id", serviceIds) : Promise.resolve({ data: [] as any[] }),
      ]);
      const pmap = new Map<string, string>();
      (profiles ?? []).forEach((p: any) => pmap.set(p.id, p.full_name ?? "Paciente"));
      (contacts ?? []).forEach((c: any) => { if (!pmap.has(c.id)) pmap.set(c.id, c.full_name ?? "Paciente"); });
      const smap = new Map<string, string>();
      (services ?? []).forEach((s: any) => smap.set(s.id, s.name));
      return list.map((r) => ({
        ...r,
        patient_name: r.patient_id ? (pmap.get(r.patient_id) ?? "Paciente") : "Paciente",
        service_name: r.service_id ? (smap.get(r.service_id) ?? "Atendimento") : "Atendimento",
      }));
    },
  });

  const now = useMemo(() => new Date(), []);
  const [timelineId, setTimelineId] = useState<string | null>(null);

  const pending = useMemo(
    () => (appts ?? []).filter((a) => isPending(a)),
    [appts]
  );
  const upcoming = useMemo(
    () => (appts ?? []).filter((a) => new Date(a.scheduled_at) >= startOfDay(now) && !["cancelada", "realizada"].includes(a.status)).slice(0, 8),
    [appts, now]
  );


  // Calendar view
  const [view, setView] = useState<"dia" | "semana" | "mes">("dia");
  const [cursor, setCursor] = useState<Date>(startOfDay(now));

  const dayList = useMemo(
    () => (appts ?? []).filter((a) => sameDay(new Date(a.scheduled_at), cursor)).sort((a, b) => a.scheduled_at.localeCompare(b.scheduled_at)),
    [appts, cursor]
  );

  const weekDays = useMemo(() => {
    const start = addDays(cursor, -cursor.getDay());
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const start = addDays(first, -first.getDay());
    return Array.from({ length: 42 }, (_, i) => addDays(start, i));
  }, [cursor]);

  const apptsByDay = useMemo(() => {
    const map = new Map<string, number>();
    (appts ?? []).forEach((a) => {
      const k = startOfDay(new Date(a.scheduled_at)).toDateString();
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return map;
  }, [appts]);

  // Availability config
  const { data: avail } = useQuery({
    queryKey: ["my-avail", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("professional_availability").select("*").eq("professional_id", user!.id).order("day_of_week")).data ?? [],
  });

  const { data: blocked } = useQuery({
    queryKey: ["my-blocked", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("professional_blocked_slots").select("*").eq("professional_id", user!.id).order("starts_at")).data ?? [],
  });

  const [dow, setDow] = useState(1);
  const [start, setStart] = useState("09:00");
  const [end, setEnd] = useState("17:00");

  const addAvail = useMutation({
    mutationFn: async () => { const { error } = await supabase.from("professional_availability").insert({ professional_id: user!.id, day_of_week: dow, start_time: start, end_time: end }); if (error) throw error; },
    onSuccess: () => { toast.success("Horário adicionado"); qc.invalidateQueries({ queryKey: ["my-avail"] }); },
  });

  const removeAvail = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("professional_availability").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-avail"] }),
  });

  const [blockDate, setBlockDate] = useState("");
  const [blockReason, setBlockReason] = useState("");

  const addBlock = useMutation({
    mutationFn: async () => {
      const s = new Date(blockDate); const e = new Date(blockDate); e.setHours(23, 59);
      const { error } = await supabase.from("professional_blocked_slots").insert({ professional_id: user!.id, starts_at: s.toISOString(), ends_at: e.toISOString(), reason: blockReason || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bloqueio adicionado"); setBlockDate(""); setBlockReason(""); qc.invalidateQueries({ queryKey: ["my-blocked"] }); },
  });

  const removeBlock = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("professional_blocked_slots").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["my-blocked"] }),
  });

  const apptForActions = (a: ApptRow): ApptForActions => ({
    id: a.id,
    patient_id: a.patient_id,
    professional_id: user!.id,
    scheduled_at: a.scheduled_at,
    duration_minutes: a.duration_minutes,
    status: a.status,
    service_id: a.service_id,
  });

  const ApptItem = (a: ApptRow) => {
    const d = new Date(a.scheduled_at);
    const overdue = isPending(a);
    return (
      <div key={a.id} className={`p-3 rounded-2xl border flex flex-wrap items-center gap-3 ${overdue ? "bg-warning-soft/40 border-warning/40" : "bg-card border-border"}`}>
        <div className="flex flex-col items-center justify-center w-14 shrink-0">
          <span className="text-[10px] uppercase font-bold text-muted-foreground">{d.toLocaleDateString("pt-BR", { weekday: "short" }).replace(".", "")}</span>
          <span className="text-sm font-bold tabular-nums">{d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold truncate">
            {a.patient_id ? (
              <Link to="/pro/crm/$id" params={{ id: a.patient_id }} className="hover:text-primary">{a.patient_name}</Link>
            ) : a.patient_name}
          </p>
          <p className="text-xs text-muted-foreground truncate">{a.service_name}</p>
          {overdue && (
            <p className="text-[10px] font-bold text-warning mt-0.5 flex items-center gap-1">
              <AlertTriangle className="size-3" /> Pendente de definição
            </p>
          )}
        </div>
        {!overdue && (
          <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${STATUS_STYLE[a.status] ?? "bg-muted text-muted-foreground"}`}>
            {STATUS_LABEL[a.status] ?? a.status}
          </span>
        )}
        <AppointmentActions
          appt={apptForActions(a)}
          onOpenTimeline={() => setTimelineId(a.id)}
          invalidateKeys={["pro-agenda", "pro-next", "crm-dashboard", "pro-pending"]}
        />
      </div>
    );
  };


  return (
    <div className="px-5 pt-10 pb-24 space-y-6 livvo-fade-in">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Minha agenda</h1>
        <p className="text-sm text-muted-foreground mt-1">Atendimentos do dia, calendário e configurações</p>
      </header>

      <Tabs defaultValue={pending.length > 0 ? "pendencias" : "agenda"} className="space-y-6">
        <TabsList className="w-full grid grid-cols-3">
          <TabsTrigger value="pendencias" className="relative">
            Pendências
            {pending.length > 0 && (
              <span className="ml-1.5 px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-warning text-warning-foreground">
                {pending.length}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="agenda">Agenda</TabsTrigger>
          <TabsTrigger value="config">Horários</TabsTrigger>
        </TabsList>

        <TabsContent value="pendencias" className="space-y-4 mt-0">
          <section>
            <h2 className="text-base font-bold tracking-tight flex items-center gap-2">
              <AlertTriangle className="size-4 text-warning" /> Consultas pendentes de definição
            </h2>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Atendimentos passados sem status final. Defina o desfecho para manter o histórico correto.
            </p>
            <div className="space-y-2">
              {pending.length === 0 && (
                <div className="p-6 rounded-2xl bg-card border border-border text-center text-sm text-muted-foreground">
                  Tudo em dia — nenhuma consulta pendente. 🎉
                </div>
              )}
              {pending.map((a) => {
                const d = new Date(a.scheduled_at);
                const days = Math.max(0, Math.floor((now.getTime() - d.getTime()) / 86400000));
                return (
                  <div key={a.id} className="p-3 rounded-2xl bg-warning-soft/40 border border-warning/40 flex items-center gap-3">
                    <div className="flex flex-col items-center justify-center w-14 shrink-0">
                      <span className="text-[10px] uppercase font-bold text-warning">{d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "")}</span>
                      <span className="text-sm font-bold tabular-nums">{d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">
                        {a.patient_id ? (
                          <Link to="/pro/crm/$id" params={{ id: a.patient_id }} className="hover:text-primary">{a.patient_name}</Link>
                        ) : a.patient_name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{a.service_name}</p>
                      <p className="text-[10px] font-bold text-warning mt-0.5">
                        Pendente há {days === 0 ? "hoje" : `${days} dia${days > 1 ? "s" : ""}`}
                      </p>
                    </div>
                    <AppointmentActions
                      appt={apptForActions(a)}
                      onOpenTimeline={() => setTimelineId(a.id)}
                      invalidateKeys={["pro-agenda", "pro-next", "crm-dashboard", "pro-pending"]}
                    />
                  </div>
                );
              })}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="agenda" className="space-y-6 mt-0">
          {/* Seção 1 — Próximos agendamentos */}
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Próximos agendamentos</h2>
            <div className="space-y-2">
              {upcoming.length === 0 && (
                <div className="p-6 rounded-2xl bg-card border border-border text-center text-sm text-muted-foreground">
                  Sem agendamentos futuros.
                </div>
              )}
              {upcoming.map((a) => <ApptItem key={a.id} {...a} />)}
            </div>
          </section>

          {/* Seção 2 — Agenda do dia */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Agenda do dia · {cursor.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" })}
              </h2>
              <div className="flex gap-1">
                <button onClick={() => setCursor(addDays(cursor, -1))} className="px-2 py-1 text-xs rounded-md bg-muted">‹</button>
                <button onClick={() => setCursor(startOfDay(new Date()))} className="px-2 py-1 text-xs rounded-md bg-muted">Hoje</button>
                <button onClick={() => setCursor(addDays(cursor, 1))} className="px-2 py-1 text-xs rounded-md bg-muted">›</button>
              </div>
            </div>
            <div className="space-y-2">
              {dayList.length === 0 && (
                <div className="p-6 rounded-2xl bg-card border border-border text-center text-sm text-muted-foreground">
                  Nenhum atendimento neste dia.
                </div>
              )}
              {dayList.map((a) => <ApptItem key={a.id} {...a} />)}
            </div>
          </section>

          {/* Seção 3 — Calendário */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Calendário</h2>
              <div className="inline-flex rounded-lg bg-muted p-0.5">
                {(["dia", "semana", "mes"] as const).map((v) => (
                  <button key={v} onClick={() => setView(v)} className={`px-3 py-1 text-xs font-semibold rounded-md capitalize ${view === v ? "bg-card shadow-sm" : "text-muted-foreground"}`}>
                    {v === "mes" ? "mês" : v}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-card border border-border p-4">
              {view === "dia" && (
                <div className="text-sm text-muted-foreground">
                  Veja os atendimentos do dia acima. Use ‹ e › para navegar.
                </div>
              )}

              {view === "semana" && (
                <div className="grid grid-cols-7 gap-1">
                  {weekDays.map((d) => {
                    const count = apptsByDay.get(d.toDateString()) ?? 0;
                    const isCursor = sameDay(d, cursor);
                    return (
                      <button key={d.toISOString()} onClick={() => { setCursor(startOfDay(d)); setView("dia"); }}
                        className={`flex flex-col items-center py-2 rounded-lg ${isCursor ? "bg-primary text-primary-foreground" : "bg-muted/40"}`}>
                        <span className="text-[10px] uppercase font-bold">{DAYS[d.getDay()]}</span>
                        <span className="text-sm font-bold tabular-nums">{d.getDate()}</span>
                        {count > 0 && <span className={`mt-1 text-[10px] px-1.5 rounded-full ${isCursor ? "bg-primary-foreground/20" : "bg-primary-soft text-primary"}`}>{count}</span>}
                      </button>
                    );
                  })}
                </div>
              )}

              {view === "mes" && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))} className="px-2 py-1 text-xs rounded-md bg-muted">‹</button>
                    <span className="text-sm font-semibold capitalize">{cursor.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}</span>
                    <button onClick={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))} className="px-2 py-1 text-xs rounded-md bg-muted">›</button>
                  </div>
                  <div className="grid grid-cols-7 gap-1 text-[10px] font-bold text-muted-foreground text-center">
                    {DAYS.map((d) => <div key={d}>{d}</div>)}
                  </div>
                  <div className="grid grid-cols-7 gap-1">
                    {monthDays.map((d) => {
                      const count = apptsByDay.get(d.toDateString()) ?? 0;
                      const inMonth = d.getMonth() === cursor.getMonth();
                      const isCursor = sameDay(d, cursor);
                      return (
                        <button key={d.toISOString()} onClick={() => { setCursor(startOfDay(d)); setView("dia"); }}
                          className={`aspect-square flex flex-col items-center justify-center rounded-md text-xs ${isCursor ? "bg-primary text-primary-foreground" : inMonth ? "bg-muted/30" : "opacity-40"}`}>
                          <span className="tabular-nums">{d.getDate()}</span>
                          {count > 0 && <span className={`size-1.5 rounded-full mt-0.5 ${isCursor ? "bg-primary-foreground" : "bg-primary"}`} />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </section>
        </TabsContent>

        <TabsContent value="config" className="space-y-6 mt-0">
          {/* Seção 4 — Disponibilidade */}
          <section>
            <h2 className="text-base font-bold tracking-tight mb-1">Configurar horários de atendimento</h2>
            <p className="text-xs text-muted-foreground mb-3">Defina os horários semanais em que você atende pacientes.</p>
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <div className="grid grid-cols-7 gap-1">
                {DAYS.map((d, i) => (
                  <button key={i} onClick={() => setDow(i)} className={`py-2 rounded-lg text-xs font-bold ${dow === i ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>{d}</button>
                ))}
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div><Label className="text-xs">Início</Label><Input type="time" value={start} onChange={(e) => setStart(e.target.value)} /></div>
                <div><Label className="text-xs">Fim</Label><Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} /></div>
              </div>
              <Button onClick={() => addAvail.mutate()} className="w-full rounded-xl"><Plus className="size-4 mr-1" /> Adicionar horário</Button>
            </div>

            <div className="space-y-1 mt-3">
              {(avail ?? []).map((a) => (
                <div key={a.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-sm">
                  <span className="font-bold w-10">{DAYS[a.day_of_week]}</span>
                  <span className="flex-1 font-mono text-xs">{a.start_time.slice(0, 5)} – {a.end_time.slice(0, 5)}</span>
                  <button onClick={() => removeAvail.mutate(a.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
          </section>

          {/* Seção 5 — Bloqueios */}
          <section>
            <h2 className="text-base font-bold tracking-tight mb-1 flex items-center gap-2"><Lock className="size-4" /> Bloqueios, férias e ausências</h2>
            <p className="text-xs text-muted-foreground mb-3">Bloqueie dias inteiros para férias, congressos ou folgas.</p>
            <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
              <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
              <Input placeholder="Motivo (férias, congresso, folga...)" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
              <Button onClick={() => addBlock.mutate()} disabled={!blockDate} variant="outline" className="w-full rounded-xl">Adicionar bloqueio</Button>
            </div>
            <div className="space-y-1 mt-3">
              {(blocked ?? []).map((b) => (
                <div key={b.id} className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border text-sm">
                  <Lock className="size-4 text-warning" />
                  <div className="flex-1">
                    <p className="text-xs font-semibold">{new Date(b.starts_at).toLocaleDateString("pt-BR")}</p>
                    {b.reason && <p className="text-[10px] text-muted-foreground">{b.reason}</p>}
                  </div>
                  <button onClick={() => removeBlock.mutate(b.id)} className="text-muted-foreground hover:text-destructive"><Trash2 className="size-4" /></button>
                </div>
              ))}
            </div>
          </section>
        </TabsContent>
      </Tabs>

      <AppointmentTimelineDialog
        appointmentId={timelineId}
        open={!!timelineId}
        onOpenChange={(v) => { if (!v) setTimelineId(null); }}
      />
    </div>
  );
}

