import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCrmPatient, updateCrmStatus, addCrmNote, deleteCrmNote, updateCrmRelationship } from "@/lib/livvo/crm.functions";
import { createQuote } from "@/lib/livvo/quotes.functions";
import { updateCrmContact, createManualAppointment } from "@/lib/livvo/patients.functions";
import { ArrowLeft, Calendar, Phone, Mail, Trash2, Lock, Users, FileText, MapPin, Cake, Plus, MessageSquare, Pencil, CalendarPlus } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pro/crm/$id")({
  component: PatientDetail,
});

const STATUSES = [
  ["novo_lead","Novo Lead"],["contato_realizado","Contato Feito"],
  ["orcamento_enviado","Orçamento Enviado"],["aguardando_decisao","Aguardando"],
  ["agendado","Agendado"],["confirmada","Confirmado"],["atendido","Atendido"],
  ["fidelizado","Fidelizado"],["retorno_pendente","Retorno"],
  ["inativo","Inativo"],["cancelado","Cancelado"],
] as const;

const ORIGINS = [
  ["busca_organica","Busca"],["anuncio_patrocinado","Anúncio"],["indicacao","Indicação"],
  ["cadastro_direto","Cadastro direto"],["importado","Importado"],
  ["perfil_publico","Perfil público"],["campanha","Campanha"],["outros","Outros"],
] as const;

function PatientDetail() {
  const { id } = Route.useParams();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const fetchFn = useServerFn(getCrmPatient);
  const setStatus = useServerFn(updateCrmStatus);
  const updateRel = useServerFn(updateCrmRelationship);
  const addNote = useServerFn(addCrmNote);
  const delNote = useServerFn(deleteCrmNote);
  const newQuote = useServerFn(createQuote);

  const { data, refetch, isLoading, error } = useQuery({
    queryKey: ["crm-patient", id],
    queryFn: () => fetchFn({ data: { relationshipId: id } }),
    retry: false,
  });

  const [noteText, setNoteText] = useState("");
  const [visibility, setVisibility] = useState<"private" | "clinic">("private");
  const [editOpen, setEditOpen] = useState(false);
  const [apptOpen, setApptOpen] = useState(false);

  const editFn = useServerFn(updateCrmContact);
  const apptFn = useServerFn(createManualAppointment);

  const statusMut = useMutation({
    mutationFn: (status: string) => setStatus({ data: { relationshipId: id, status: status as Parameters<typeof setStatus>[0]["data"]["status"], override: true } }),
    onSuccess: () => { toast.success("Status atualizado"); refetch(); qc.invalidateQueries({ queryKey: ["crm-patients"] }); },
  });
  const originMut = useMutation({
    mutationFn: (origin: string) => updateRel({ data: { relationshipId: id, origin: origin as Parameters<typeof updateRel>[0]["data"]["origin"] } }),
    onSuccess: () => { toast.success("Origem atualizada"); refetch(); },
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
  const quoteMut = useMutation({
    mutationFn: () => newQuote({ data: { patient_id: r.patient_id } }),
    onSuccess: (q) => navigate({ to: "/pro/orcamentos/$id", params: { id: q.id } }),
  });

  if (isLoading) return <div className="p-10 text-center text-sm text-muted-foreground">Carregando…</div>;
  if (error || !data) return (
    <div className="px-5 pt-10 space-y-3">
      <Link to="/pro/crm" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Voltar</Link>
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 text-center">
        <p className="text-sm font-medium text-destructive">Não foi possível abrir este paciente.</p>
        <p className="text-xs text-muted-foreground mt-1">{(error as Error | null)?.message ?? "Verifique suas permissões ou tente novamente."}</p>
        <Button size="sm" variant="outline" className="mt-3" onClick={() => refetch()}>Tentar novamente</Button>
      </div>
    </div>
  );
  const r = data.relationship as typeof data.relationship & {
    patient: { full_name?: string; avatar_url?: string; phone?: string; email?: string; city?: string; date_of_birth?: string };
  };
  const p = r.patient ?? {};

  // unified timeline
  type Item = { id: string; kind: "lead" | "appointment" | "quote" | "note"; at: string; title: string; sub?: string; href?: string };
  const items: Item[] = [];
  items.push({ id: "lead", kind: "lead", at: r.first_contact_at, title: "Paciente cadastrado no CRM", sub: ORIGINS.find(([k]) => k === r.origin)?.[1] });
  for (const a of data.appointments) {
    items.push({
      id: `a-${a.id}`, kind: "appointment", at: a.scheduled_at,
      title: `Atendimento ${a.status}`, sub: `R$ ${Number(a.gross_amount).toFixed(2)}`,
    });
  }
  for (const qq of data.quotes) {
    const aq = qq as { id: string; status: string; title: string; total: number; created_at: string; sent_at: string | null };
    items.push({
      id: `q-${aq.id}`, kind: "quote", at: aq.sent_at ?? aq.created_at,
      title: `Orçamento ${aq.status}`, sub: `R$ ${Number(aq.total).toFixed(2)} · ${aq.title}`,
      href: aq.id,
    });
  }
  for (const n of data.notes) {
    items.push({ id: `n-${n.id}`, kind: "note", at: n.created_at, title: "Observação interna", sub: n.content.slice(0, 80) });
  }
  items.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());

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
            {p.city && <div className="flex items-center gap-1"><MapPin className="size-3" /> {p.city}</div>}
            {p.date_of_birth && <div className="flex items-center gap-1"><Cake className="size-3" /> {new Date(p.date_of_birth).toLocaleDateString("pt-BR")}</div>}
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

      <section className="grid grid-cols-2 gap-2 sm:grid-cols-5">
        <Button size="sm" variant="outline" onClick={() => setEditOpen(true)}>
          <Pencil className="size-4 mr-1.5" /> Editar
        </Button>
        <Button size="sm" onClick={() => setApptOpen(true)}>
          <CalendarPlus className="size-4 mr-1.5" /> Agendar
        </Button>
        <Button size="sm" variant="outline" onClick={() => quoteMut.mutate()} disabled={quoteMut.isPending}>
          <FileText className="size-4 mr-1.5" /> Orçamento
        </Button>
        <Button size="sm" variant="outline" onClick={() => document.getElementById("crm-note-input")?.focus()}>
          <MessageSquare className="size-4 mr-1.5" /> Observação
        </Button>
        <Button size="sm" variant="outline" asChild>
          <Link to="/app/mensagens"><Mail className="size-4 mr-1.5" /> Mensagem</Link>
        </Button>
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
        <h2 className="text-sm font-bold">Origem do paciente</h2>
        <div className="flex flex-wrap gap-2">
          {ORIGINS.map(([k, label]) => (
            <button key={k} onClick={() => originMut.mutate(k)}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${r.origin === k ? "bg-primary text-primary-foreground border-primary" : "border-border bg-card"}`}>
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">Orçamentos</h2>
        <div className="space-y-2">
          {data.quotes.map((q) => {
            const qq = q as { id: string; status: string; title: string; total: number; created_at: string; valid_until: string | null };
            return (
              <Link key={qq.id} to="/pro/orcamentos/$id" params={{ id: qq.id }} className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
                <FileText className="size-4 text-primary" />
                <div className="flex-1 text-sm min-w-0">
                  <div className="font-medium truncate">{qq.title}</div>
                  <div className="text-xs text-muted-foreground">{qq.status} · R$ {Number(qq.total).toFixed(2)}</div>
                </div>
              </Link>
            );
          })}
          {data.quotes.length === 0 && (
            <button onClick={() => quoteMut.mutate()} className="w-full rounded-xl border border-dashed border-border p-4 text-xs text-muted-foreground inline-flex items-center justify-center gap-1.5">
              <Plus className="size-3.5" /> Criar primeiro orçamento
            </button>
          )}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">Linha do tempo</h2>
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.id} className="flex gap-3 rounded-xl border border-border bg-card p-3 text-sm">
              <div className="shrink-0 size-8 rounded-lg bg-primary-soft text-primary grid place-items-center">
                {it.kind === "appointment" && <Calendar className="size-4" />}
                {it.kind === "quote" && <FileText className="size-4" />}
                {it.kind === "note" && <MessageSquare className="size-4" />}
                {it.kind === "lead" && <Users className="size-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-medium">{it.title}</div>
                {it.sub && <div className="text-xs text-muted-foreground truncate">{it.sub}</div>}
                <div className="text-[11px] text-muted-foreground mt-0.5">{new Date(it.at).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-sm font-bold">Observações internas</h2>
        <p className="text-[11px] text-muted-foreground">Notas comerciais e operacionais. Não substituem prontuário clínico.</p>
        <div className="rounded-2xl border border-border bg-card p-3 space-y-2">
          <Textarea id="crm-note-input" placeholder="Adicionar observação..." value={noteText} onChange={(e) => setNoteText(e.target.value)} rows={3} />
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
          {data.notes.map((n) => (
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

      <EditContactDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        contactId={r.patient_id}
        initial={p}
        onSaved={() => { refetch(); qc.invalidateQueries({ queryKey: ["crm-patients"] }); }}
        editFn={editFn}
      />
      <ScheduleDialog
        open={apptOpen}
        onOpenChange={setApptOpen}
        patientId={r.patient_id}
        patientName={p.full_name ?? "Paciente"}
        professionalId={r.professional_id}
        onCreated={() => { refetch(); qc.invalidateQueries({ queryKey: ["crm-patients"] }); toast.success("Agendamento criado"); }}
        apptFn={apptFn}
      />
    </div>
  );
}

function EditContactDialog({ open, onOpenChange, contactId, initial, onSaved, editFn }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  contactId: string;
  initial: { full_name?: string; phone?: string; email?: string; city?: string; date_of_birth?: string };
  onSaved: () => void;
  editFn: ReturnType<typeof useServerFn<typeof updateCrmContact>>;
}) {
  const [form, setForm] = useState({
    full_name: "", phone: "", whatsapp: "", email: "", city: "",
    date_of_birth: "", sex: "", insurance: "", notes: "",
  });
  useEffect(() => {
    if (open) {
      setForm({
        full_name: initial.full_name ?? "",
        phone: initial.phone ?? "",
        whatsapp: (initial as { whatsapp?: string }).whatsapp ?? "",
        email: initial.email ?? "",
        city: initial.city ?? "",
        date_of_birth: initial.date_of_birth ? String(initial.date_of_birth).slice(0, 10) : "",
        sex: (initial as { sex?: string }).sex ?? "",
        insurance: (initial as { insurance?: string }).insurance ?? "",
        notes: (initial as { notes?: string }).notes ?? "",
      });
    }
  }, [open, initial]);
  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));
  const mut = useMutation({
    mutationFn: () => editFn({ data: { contactId, ...form } }),
    onSuccess: () => { toast.success("Dados atualizados"); onOpenChange(false); onSaved(); },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao salvar"),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Editar dados do paciente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome*</Label><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Telefone*</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
            <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
          </div>
          <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
            <div><Label>Nascimento</Label><Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Sexo</Label><Input value={form.sex} onChange={(e) => set("sex", e.target.value)} /></div>
            <div><Label>Convênio</Label><Input value={form.insurance} onChange={(e) => set("insurance", e.target.value)} /></div>
          </div>
          <div><Label>Observações</Label><Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !form.full_name.trim() || !form.phone.trim()}>Salvar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ScheduleDialog({ open, onOpenChange, patientId, patientName, professionalId, onCreated, apptFn }: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  patientId: string;
  patientName: string;
  professionalId: string;
  onCreated: () => void;
  apptFn: ReturnType<typeof useServerFn<typeof createManualAppointment>>;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [notes, setNotes] = useState("");
  useEffect(() => {
    if (open) {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      setDate(d.toISOString().slice(0, 10));
      setTime("09:00");
      setDuration(30); setPrice(0); setNotes("");
    }
  }, [open]);
  const mut = useMutation({
    mutationFn: () => {
      const iso = new Date(`${date}T${time}:00`).toISOString();
      return apptFn({ data: {
        patient_id: patientId, professional_id: professionalId,
        scheduled_at: iso, duration_minutes: duration, price, notes: notes || null,
      }});
    },
    onSuccess: () => { onOpenChange(false); onCreated(); },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao agendar"),
  });
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Agendar — {patientName}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Data</Label><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></div>
            <div><Label>Horário</Label><Input type="time" value={time} onChange={(e) => setTime(e.target.value)} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Duração (min)</Label><Input type="number" min={5} max={480} value={duration} onChange={(e) => setDuration(Number(e.target.value))} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" min={0} step="0.01" value={price} onChange={(e) => setPrice(Number(e.target.value))} /></div>
          </div>
          <div><Label>Observações</Label><Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending || !date || !time}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
