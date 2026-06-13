import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCrmPatient, updateCrmStatus, addCrmNote, deleteCrmNote } from "@/lib/livvo/crm.functions";
import { ArrowLeft, Calendar, Phone, Mail, Trash2, Lock, Users } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pro/crm/$id")({
  component: PatientDetail,
});

const STATUSES = [
  ["novo_lead","Novo Lead"],["agendado","Agendado"],["confirmada","Confirmado"],
  ["atendido","Atendido"],["cancelado","Cancelado"],["retorno_pendente","Retorno Pendente"],["inativo","Inativo"],
] as const;

function PatientDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getCrmPatient);
  const setStatus = useServerFn(updateCrmStatus);
  const addNote = useServerFn(addCrmNote);
  const delNote = useServerFn(deleteCrmNote);

  const { data, refetch } = useQuery({
    queryKey: ["crm-patient", id],
    queryFn: () => fetchFn({ data: { relationshipId: id } }),
  });

  const [noteText, setNoteText] = useState("");
  const [visibility, setVisibility] = useState<"private" | "clinic">("private");

  const statusMut = useMutation({
    mutationFn: (status: string) => setStatus({ data: { relationshipId: id, status: status as any, override: true } }),
    onSuccess: () => { toast.success("Status atualizado"); refetch(); qc.invalidateQueries({ queryKey: ["crm-patients"] }); },
  });
  const noteMut = useMutation({
    mutationFn: () => addNote({ data: { relationshipId: id, content: noteText, visibility } }),
    onSuccess: () => { setNoteText(""); refetch(); toast.success("Nota adicionada"); },
    onError: (e) => toast.error((e as Error).message),
  });
  const deleteNote = useMutation({
    mutationFn: (noteId: string) => delNote({ data: { noteId } }),
    onSuccess: () => refetch(),
  });

  if (!data) return <div className="p-10 text-center text-sm text-muted-foreground">Carregando…</div>;
  const r = data.relationship as any;
  const p = r.patient ?? {};

  return (
    <div className="px-5 pt-10 space-y-5 livvo-fade-in pb-10">
      <Link to="/pro/crm" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Voltar</Link>

      <header className="flex items-center gap-3">
        <div className="size-16 rounded-full bg-primary-soft text-primary grid place-items-center text-xl font-bold border border-border overflow-hidden">
          {p.avatar_url ? <img src={p.avatar_url} className="size-full object-cover" alt="" /> : (p.full_name ?? "?").charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-xl font-bold truncate">{p.full_name ?? "Paciente"}</h1>
          <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
            {p.phone && <div className="flex items-center gap-1"><Phone className="size-3" /> {p.phone}</div>}
            {p.email && <div className="flex items-center gap-1"><Mail className="size-3" /> {p.email}</div>}
          </div>
        </div>
      </header>

      <section className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-2xl bg-card border border-border p-3">
          <div className="text-lg font-bold">{r.appointments_count}</div>
          <div className="text-[10px] text-muted-foreground uppercase">Atendimentos</div>
        </div>
        <div className="rounded-2xl bg-card border border-border p-3">
          <div className="text-lg font-bold">R$ {Number(r.total_revenue ?? 0).toFixed(0)}</div>
          <div className="text-[10px] text-muted-foreground uppercase">Faturado</div>
        </div>
        <div className="rounded-2xl bg-card border border-border p-3">
          <div className="text-lg font-bold">{r.next_appointment_at ? new Date(r.next_appointment_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }) : "—"}</div>
          <div className="text-[10px] text-muted-foreground uppercase">Próximo</div>
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">Status no funil</h2>
        <div className="flex flex-wrap gap-2">
          {STATUSES.map(([k, label]) => (
            <button key={k} onClick={() => statusMut.mutate(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${r.status === k ? "bg-foreground text-background border-foreground" : "border-border bg-card"}`}>
              {label}
            </button>
          ))}
        </div>
        {r.status_overridden && (
          <p className="text-[11px] text-muted-foreground">
            Sugerido pelo sistema: <strong>{r.status_suggested}</strong>
          </p>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">Histórico de atendimentos</h2>
        <div className="space-y-2">
          {data.appointments.map((a: any) => (
            <div key={a.id} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <Calendar className="size-4 text-muted-foreground" />
              <div className="flex-1 text-sm">
                <div className="font-medium">{new Date(a.scheduled_at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</div>
                <div className="text-xs text-muted-foreground">{a.status} · R$ {Number(a.gross_amount).toFixed(2)}</div>
              </div>
            </div>
          ))}
          {data.appointments.length === 0 && <p className="text-xs text-muted-foreground">Sem atendimentos ainda.</p>}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">Observações internas</h2>
        <p className="text-[11px] text-muted-foreground">Notas comerciais e operacionais. Não substituem prontuário clínico.</p>
        <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
          <Textarea placeholder="Adicionar observação..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} />
          <div className="flex items-center gap-2">
            <button onClick={() => setVisibility("private")} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${visibility === "private" ? "bg-foreground text-background border-foreground" : "border-border"}`}>
              <Lock className="size-3" /> Privada
            </button>
            <button onClick={() => setVisibility("clinic")} className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${visibility === "clinic" ? "bg-foreground text-background border-foreground" : "border-border"}`}>
              <Users className="size-3" /> Equipe da clínica
            </button>
            <Button size="sm" className="ml-auto" disabled={!noteText.trim() || noteMut.isPending} onClick={() => noteMut.mutate()}>Salvar</Button>
          </div>
        </div>
        <div className="space-y-2">
          {data.notes.map((n: any) => (
            <div key={n.id} className="rounded-xl border border-border bg-card p-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground mb-1">
                {n.visibility === "private" ? <><Lock className="size-3" /> Privada</> : <><Users className="size-3" /> Equipe</>}
                <span>· {new Date(n.created_at).toLocaleDateString("pt-BR")}</span>
                <button onClick={() => deleteNote.mutate(n.id)} className="ml-auto text-destructive"><Trash2 className="size-3" /></button>
              </div>
              <p className="text-sm whitespace-pre-wrap">{n.content}</p>
            </div>
          ))}
          {data.notes.length === 0 && <p className="text-xs text-muted-foreground">Nenhuma observação ainda.</p>}
        </div>
      </section>
    </div>
  );
}
