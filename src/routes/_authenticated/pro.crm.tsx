import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getCrmContactDetail, listCrmPatients, updateCrmStatus } from "@/lib/livvo/crm.functions";
import { createQuote } from "@/lib/livvo/quotes.functions";
import { createManualAppointment, updateCrmContact } from "@/lib/livvo/patients.functions";
import { Users, Calendar, ChevronRight, LayoutGrid, List, FileText, CalendarPlus, Phone, Mail, MapPin, Pencil } from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { NewPatientDialog } from "@/components/livvo/new-patient-dialog";
import { ImportPatientsDialog, NewPatientButtons } from "@/components/livvo/import-patients-dialog";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pro/crm")({
  component: CrmPage,
});

type CrmStatus =
  | "novo_lead" | "contato_realizado" | "orcamento_enviado" | "aguardando_decisao"
  | "agendado" | "confirmada" | "atendido" | "fidelizado"
  | "retorno_pendente" | "inativo" | "cancelado";

const STATUS_META: Record<CrmStatus, { label: string; cls: string }> = {
  novo_lead: { label: "Novo Lead", cls: "bg-primary-soft text-primary" },
  contato_realizado: { label: "Contato Feito", cls: "bg-sky-100 text-sky-700" },
  orcamento_enviado: { label: "Orçamento Enviado", cls: "bg-violet-100 text-violet-700" },
  aguardando_decisao: { label: "Aguardando Decisão", cls: "bg-amber-100 text-amber-700" },
  agendado: { label: "Agendado", cls: "bg-blue-100 text-blue-700" },
  confirmada: { label: "Confirmado", cls: "bg-health-soft text-health" },
  atendido: { label: "Atendido", cls: "bg-emerald-100 text-emerald-700" },
  fidelizado: { label: "Fidelizado", cls: "bg-teal-100 text-teal-700" },
  retorno_pendente: { label: "Retorno", cls: "bg-orange-100 text-orange-700" },
  inativo: { label: "Inativo", cls: "bg-muted text-muted-foreground" },
  cancelado: { label: "Cancelado", cls: "bg-destructive/10 text-destructive" },
};

const ORDER: CrmStatus[] = [
  "novo_lead","contato_realizado","orcamento_enviado","aguardando_decisao",
  "agendado","confirmada","atendido","fidelizado","retorno_pendente","inativo","cancelado",
];

const ORIGINS = [
  ["busca_organica","Busca"],["anuncio_patrocinado","Anúncio"],["indicacao","Indicação"],
  ["cadastro_direto","Cadastro direto"],["importado","Importado"],
  ["perfil_publico","Perfil público"],["campanha","Campanha"],["outros","Outros"],
] as const;

type CrmRow = Awaited<ReturnType<typeof listCrmPatients>>[number];
type ContactDetail = Awaited<ReturnType<typeof getCrmContactDetail>>;

function CrmPage() {
  const fetchFn = useServerFn(listCrmPatients);
  const detailFn = useServerFn(getCrmContactDetail);
  const qc = useQueryClient();
  const { data } = useQuery({ queryKey: ["crm-patients"], queryFn: () => fetchFn() });
  const [q, setQ] = useState("");
  const [view, setView] = useState<"list" | "kanban">("list");
  const [filter, setFilter] = useState<CrmStatus | "">("");
  const [openNew, setOpenNew] = useState(false);
  const [openImport, setOpenImport] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["crm-contact-detail", selectedContactId],
    queryFn: () => detailFn({ data: { contactId: selectedContactId! } }),
    enabled: !!selectedContactId,
    retry: false,
  });

  const openContact = (contactId: string, row?: CrmRow) => {
    setSelectedContactId(contactId);
  };

  const rows = useMemo(() => {
    const all = data ?? [];
    return all.filter((r) => {
      const p = (r as { patient?: { full_name?: string } }).patient;
      const matchesQ = !q || (p?.full_name ?? "").toLowerCase().includes(q.toLowerCase());
      const matchesS = !filter || r.status === filter;
      return matchesQ && matchesS;
    });
  }, [data, q, filter]);

  const grouped = useMemo(() => {
    const map: Record<string, typeof rows> = {};
    for (const s of ORDER) map[s] = [];
    rows.forEach((r) => { (map[r.status] ?? map.novo_lead).push(r); });
    return map;
  }, [rows]);

  const counts = useMemo(() => {
    const m: Record<string, number> = {};
    (data ?? []).forEach((r) => { m[r.status] = (m[r.status] ?? 0) + 1; });
    return m;
  }, [data]);

  return (
    <div className="px-5 pt-10 space-y-5 livvo-fade-in">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">CRM de pacientes</h1>
          <p className="text-sm text-muted-foreground mt-1">{data?.length ?? 0} pacientes no seu funil</p>
        </div>
        <Link to="/pro/orcamentos" className="shrink-0 inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold">
          <FileText className="size-3.5" /> Orçamentos
        </Link>
      </header>

      <NewPatientButtons onNew={() => setOpenNew(true)} onImport={() => setOpenImport(true)} />
      <NewPatientDialog open={openNew} onOpenChange={setOpenNew} />
      <ImportPatientsDialog open={openImport} onOpenChange={setOpenImport} />


      <div className="flex items-center gap-2">
        <Input placeholder="Buscar paciente..." value={q} onChange={(e) => setQ(e.target.value)} className="rounded-xl flex-1" />
        <div className="flex rounded-xl border border-border overflow-hidden">
          <button onClick={() => setView("list")} className={`p-2.5 ${view === "list" ? "bg-foreground text-background" : "bg-card"}`} aria-label="Lista">
            <List className="size-4" />
          </button>
          <button onClick={() => setView("kanban")} className={`p-2.5 ${view === "kanban" ? "bg-foreground text-background" : "bg-card"}`} aria-label="Kanban">
            <LayoutGrid className="size-4" />
          </button>
        </div>
      </div>

      {view === "list" && (
        <>
          <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
            <button onClick={() => setFilter("")} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border ${filter === "" ? "bg-foreground text-background border-foreground" : "border-border bg-card"}`}>
              Todos ({data?.length ?? 0})
            </button>
            {ORDER.map((k) => (
              <button key={k} onClick={() => setFilter(k)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border ${filter === k ? "bg-foreground text-background border-foreground" : "border-border bg-card"}`}>
                {STATUS_META[k].label} ({counts[k] ?? 0})
              </button>
            ))}
          </div>

          <div className="space-y-2">
            {rows.map((r) => {
              const p = (r as { patient?: { full_name?: string; avatar_url?: string } }).patient ?? {};
              const contactId = (p as { id?: string }).id ?? r.patient_id;
              const meta = STATUS_META[r.status as CrmStatus] ?? STATUS_META.novo_lead;
              return (
                <button key={r.id} type="button" onClick={() => openContact(contactId, r)}
                  className="relative z-0 w-full text-left flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors cursor-pointer pointer-events-auto">
                  <div className="size-12 rounded-full bg-primary-soft text-primary grid place-items-center font-bold border border-border overflow-hidden shrink-0">
                    {p.avatar_url ? <img src={p.avatar_url} className="size-full object-cover" alt="" /> : (p.full_name ?? "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold truncate">{p.full_name ?? "Paciente"}</p>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${meta.cls}`}>{meta.label}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="size-3" />
                        {r.next_appointment_at ? `Próx: ${new Date(r.next_appointment_at).toLocaleDateString("pt-BR")}` :
                         r.last_appointment_at ? `Últ: ${new Date(r.last_appointment_at).toLocaleDateString("pt-BR")}` : "Sem histórico"}
                      </span>
                      <span>R$ {Number(r.total_revenue ?? 0).toFixed(0)}</span>
                    </div>
                  </div>
                  <ChevronRight className="size-4 text-muted-foreground shrink-0 pointer-events-none" />
                </button>
              );
            })}
            {rows.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-10 text-center">
                <Users className="size-8 mx-auto text-muted-foreground mb-3" />
                <p className="text-sm text-muted-foreground">Nenhum paciente encontrado.</p>
              </div>
            )}
          </div>
        </>
      )}

      {view === "kanban" && (
        <div className="-mx-5 overflow-x-auto pb-4">
          <div className="flex gap-3 px-5 min-w-max">
            {ORDER.map((s) => {
              const meta = STATUS_META[s];
              const cards = grouped[s] ?? [];
              return (
                <div key={s} className="w-64 shrink-0 rounded-2xl bg-muted/40 border border-border p-3">
                  <div className="flex items-center justify-between mb-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${meta.cls}`}>{meta.label}</span>
                    <span className="text-xs text-muted-foreground font-semibold">{cards.length}</span>
                  </div>
                  <div className="space-y-2">
                    {cards.map((r) => {
                      const p = (r as { patient?: { full_name?: string; avatar_url?: string } }).patient ?? {};
                      const contactId = (p as { id?: string }).id ?? r.patient_id;
                      return (
                        <button key={r.id} type="button" onClick={() => openContact(contactId, r)}
                          className="relative z-0 w-full text-left bg-card border border-border rounded-xl p-2.5 hover:border-primary/30 cursor-pointer pointer-events-auto">
                          <div className="flex items-center gap-2">
                            <div className="size-8 rounded-full bg-primary-soft text-primary grid place-items-center text-xs font-bold overflow-hidden">
                              {p.avatar_url ? <img src={p.avatar_url} className="size-full object-cover" alt="" /> : (p.full_name ?? "?").charAt(0)}
                            </div>
                            <p className="text-sm font-semibold truncate flex-1">{p.full_name ?? "Paciente"}</p>
                          </div>
                          {r.next_appointment_at && (
                            <p className="mt-1.5 text-[11px] text-muted-foreground flex items-center gap-1"><Calendar className="size-3" />{new Date(r.next_appointment_at).toLocaleDateString("pt-BR")}</p>
                          )}
                          {Number(r.total_revenue) > 0 && (
                            <p className="text-[11px] text-muted-foreground">R$ {Number(r.total_revenue).toFixed(0)}</p>
                          )}
                        </button>
                      );
                    })}
                    {cards.length === 0 && <p className="text-[11px] text-muted-foreground text-center py-4">Vazio</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <CRMContactDetailModal
        open={!!selectedContactId}
        onOpenChange={(open: boolean) => { if (!open) setSelectedContactId(null); }}
        detail={detailQuery.data ?? null}
        isLoading={detailQuery.isLoading || detailQuery.isFetching}
        error={detailQuery.error as Error | null}
        onSaved={() => {
          detailQuery.refetch();
          qc.invalidateQueries({ queryKey: ["crm-patients"] });
          qc.invalidateQueries({ queryKey: ["pro-agenda"] });
        }}
      />
    </div>
  );
}

function CRMContactDetailModal({ open, onOpenChange, detail, isLoading, error, onSaved }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  detail: ContactDetail | null;
  isLoading: boolean;
  error: Error | null;
  onSaved: () => void;
}) {
  const navigate = useNavigate();
  const editFn = useServerFn(updateCrmContact);
  const apptFn = useServerFn(createManualAppointment);
  const quoteFn = useServerFn(createQuote);
  const statusFn = useServerFn(updateCrmStatus);
  const [scheduleOpen, setScheduleOpen] = useState(false);
  const [form, setForm] = useState({
    full_name: "", phone: "", whatsapp: "", email: "", city: "", date_of_birth: "",
    sex: "", insurance: "", origin: "cadastro_direto", notes: "", status: "novo_lead",
  });

  useEffect(() => {
    if (!open || !detail?.contact) return;
    const contact = detail.contact;
    setForm({
      full_name: contact.full_name ?? "",
      phone: contact.phone ?? "",
      whatsapp: contact.whatsapp ?? "",
      email: contact.email ?? "",
      city: contact.city ?? "",
      date_of_birth: contact.date_of_birth ? String(contact.date_of_birth).slice(0, 10) : "",
      sex: contact.sex ?? "",
      insurance: contact.insurance ?? "",
      origin: contact.origin ?? detail.relationship?.origin ?? "cadastro_direto",
      notes: contact.notes ?? "",
      status: detail.relationship?.status ?? "novo_lead",
    });
  }, [open, detail]);

  const set = (key: keyof typeof form, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const contact = detail?.contact ?? null;
  const relationship = detail?.relationship ?? null;
  const professionalId = relationship?.professional_id ?? contact?.professional_id ?? null;
  const patientName = contact?.full_name ?? "Paciente";

  const saveMut = useMutation({
    mutationFn: async () => {
      if (!contact) throw new Error("Contato não carregado");
      const updated = await editFn({ data: { contactId: contact.id, ...form, origin: form.origin as never } });
      if (relationship && form.status !== relationship.status) {
        await statusFn({ data: { relationshipId: relationship.id, status: form.status as never, override: true } });
      }
      return updated;
    },
    onSuccess: () => { toast.success("Dados atualizados"); onSaved(); },
    onError: (e: Error) => {
      toast.error(e.message ?? "Erro ao salvar");
    },
  });

  const quoteMut = useMutation({
    mutationFn: () => {
      if (!contact) throw new Error("Contato não carregado");
      return quoteFn({ data: {
        patient_id: contact.id,
        company_id: contact.company_id ?? relationship?.company_id ?? null,
        title: `Orçamento - ${patientName}`,
      }});
    },
    onSuccess: (quote) => { toast.success("Orçamento criado"); navigate({ to: "/pro/orcamentos/$id", params: { id: quote.id } }); },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao criar orçamento"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Ficha do lead</DialogTitle></DialogHeader>
        {isLoading && <p className="text-sm text-muted-foreground py-8 text-center">Carregando ficha…</p>}
        {!isLoading && error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">
            Não foi possível abrir este paciente. Verifique suas permissões ou tente novamente.
          </div>
        )}
        {!isLoading && !error && contact && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl border border-border bg-card p-3">
              <div className="size-10 rounded-full bg-primary-soft text-primary grid place-items-center font-bold shrink-0">
                {patientName.charAt(0)}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{patientName}</p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {contact.phone && <span className="inline-flex items-center gap-1"><Phone className="size-3" />{contact.phone}</span>}
                  {contact.email && <span className="inline-flex items-center gap-1"><Mail className="size-3" />{contact.email}</span>}
                  {contact.city && <span className="inline-flex items-center gap-1"><MapPin className="size-3" />{contact.city}</span>}
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Nome</Label><Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} /></div>
              <div><Label>Telefone</Label><Input value={form.phone} onChange={(e) => set("phone", e.target.value)} /></div>
              <div><Label>WhatsApp</Label><Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} /></div>
              <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} /></div>
              <div><Label>Cidade</Label><Input value={form.city} onChange={(e) => set("city", e.target.value)} /></div>
              <div><Label>Data de nascimento</Label><Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} /></div>
              <div><Label>Sexo</Label><Input value={form.sex} onChange={(e) => set("sex", e.target.value)} /></div>
              <div><Label>Convênio</Label><Input value={form.insurance} onChange={(e) => set("insurance", e.target.value)} /></div>
              <div>
                <Label>Origem</Label>
                <Select value={form.origin} onValueChange={(value) => set("origin", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ORIGINS.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status do funil</Label>
                <Select value={form.status} onValueChange={(value) => set("status", value)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{ORDER.map((value) => <SelectItem key={value} value={value}>{STATUS_META[value].label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="sm:col-span-2"><Label>Observações</Label><Textarea rows={4} value={form.notes} onChange={(e) => set("notes", e.target.value)} /></div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3">
              <Button variant="outline" onClick={() => saveMut.mutate()} disabled={saveMut.isPending || !form.full_name.trim() || !form.phone.trim()}>
                <Pencil className="size-4" /> Salvar alterações
              </Button>
              <Button onClick={() => setScheduleOpen(true)} disabled={!professionalId}>
                <CalendarPlus className="size-4" /> Agendar
              </Button>
              <Button variant="outline" onClick={() => quoteMut.mutate()} disabled={quoteMut.isPending}>
                <FileText className="size-4" /> Criar orçamento
              </Button>
            </div>
          </div>
        )}
        <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Fechar</Button></DialogFooter>
      </DialogContent>
      {contact && professionalId && (
        <ScheduleContactDialog
          open={scheduleOpen}
          onOpenChange={setScheduleOpen}
          contactId={contact.id}
          patientName={patientName}
          professionalId={professionalId}
          apptFn={apptFn}
          onCreated={() => { setScheduleOpen(false); onSaved(); toast.success("Agendamento criado"); }}
        />
      )}
    </Dialog>
  );
}

function ScheduleContactDialog({ open, onOpenChange, contactId, patientName, professionalId, apptFn, onCreated }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contactId: string;
  patientName: string;
  professionalId: string;
  apptFn: ReturnType<typeof useServerFn<typeof createManualAppointment>>;
  onCreated: () => void;
}) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [duration, setDuration] = useState(30);
  const [price, setPrice] = useState(0);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    if (!open) return;
    const next = new Date();
    next.setDate(next.getDate() + 1);
    setDate(next.toISOString().slice(0, 10));
    setTime("09:00");
    setDuration(30);
    setPrice(0);
    setNotes("");
  }, [open]);

  const mut = useMutation({
    mutationFn: () => apptFn({ data: {
      patient_id: contactId,
      professional_id: professionalId,
      scheduled_at: new Date(`${date}T${time}:00`).toISOString(),
      duration_minutes: duration,
      price,
      notes: notes || null,
    }}),
    onSuccess: onCreated,
    onError: (e: Error) => {
      toast.error(e.message ?? "Erro ao agendar");
    },
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
