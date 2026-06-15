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

  useEffect(() => {
    console.log("[CRM] selectedContactId", selectedContactId);
  }, [selectedContactId]);

  useEffect(() => {
    if (detailQuery.data) console.log("[CRM] resultado da busca do contato", detailQuery.data);
    if (detailQuery.error) console.error("[CRM] erro de permissão ou RLS", detailQuery.error);
  }, [detailQuery.data, detailQuery.error]);

  const openContact = (contactId: string, row?: CrmRow) => {
    console.log("[CRM] contact clicado", row ?? null);
    console.log("[CRM] contact.id", contactId);
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
