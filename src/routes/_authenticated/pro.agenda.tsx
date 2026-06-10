import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, Lock, Trash2, Plus } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pro/agenda")({
  component: Agenda,
});

const DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Agenda() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: appts } = useQuery({
    queryKey: ["pro-agenda", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("appointments").select("*, profiles:patient_id(full_name)").eq("professional_id", user!.id).order("scheduled_at")).data ?? [],
  });

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
      const start = new Date(blockDate); const end = new Date(blockDate); end.setHours(23, 59);
      const { error } = await supabase.from("professional_blocked_slots").insert({ professional_id: user!.id, starts_at: start.toISOString(), ends_at: end.toISOString(), reason: blockReason || null });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Bloqueio adicionado"); setBlockDate(""); setBlockReason(""); qc.invalidateQueries({ queryKey: ["my-blocked"] }); },
  });

  return (
    <div className="px-5 pt-10 space-y-6 livvo-fade-in">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Minha agenda</h1>
        <p className="text-sm text-muted-foreground mt-1">Atendimentos, horários e bloqueios</p>
      </header>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Próximos atendimentos</h2>
        <div className="space-y-2">
          {(appts ?? []).slice(0, 10).map((row) => {
            const a = row as typeof row & { profiles: { full_name?: string } | null };
            const d = new Date(a.scheduled_at);
            return (
              <div key={a.id} className="p-3 rounded-2xl bg-card border border-border flex items-center gap-3">
                <Calendar className="size-4 text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{a.profiles?.full_name ?? "Paciente"}</p>
                  <p className="text-xs text-muted-foreground">{d.toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</p>
                </div>
                <span className="px-2 py-0.5 text-[10px] uppercase font-bold rounded-full bg-primary-soft text-primary">{a.status}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Horários disponíveis (semanal)</h2>
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

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Lock className="size-3" /> Bloquear dia inteiro</h2>
        <div className="rounded-2xl bg-card border border-border p-4 space-y-3">
          <Input type="date" value={blockDate} onChange={(e) => setBlockDate(e.target.value)} />
          <Input placeholder="Motivo (opcional)" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
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
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
