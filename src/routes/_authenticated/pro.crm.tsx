import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listCrmPatients } from "@/lib/livvo/crm.functions";
import { Users, Phone, Calendar, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/pro/crm")({
  component: CrmPage,
});

const STATUS_META: Record<string, { label: string; cls: string }> = {
  novo_lead: { label: "Novo Lead", cls: "bg-primary-soft text-primary" },
  agendado: { label: "Agendado", cls: "bg-blue-100 text-blue-700" },
  confirmada: { label: "Confirmado", cls: "bg-health-soft text-health" },
  atendido: { label: "Atendido", cls: "bg-emerald-100 text-emerald-700" },
  cancelado: { label: "Cancelado", cls: "bg-destructive/10 text-destructive" },
  retorno_pendente: { label: "Retorno Pendente", cls: "bg-amber-100 text-amber-700" },
  inativo: { label: "Inativo", cls: "bg-muted text-muted-foreground" },
};

function CrmPage() {
  const fetchFn = useServerFn(listCrmPatients);
  const { data } = useQuery({ queryKey: ["crm-patients"], queryFn: () => fetchFn() });
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<string>("");
  const navigate = useNavigate();

  const filtered = useMemo(() => {
    const rows = data ?? [];
    return rows.filter((r) => {
      const p = (r as any).patient;
      const matchesQ = !q || (p?.full_name ?? "").toLowerCase().includes(q.toLowerCase());
      const matchesS = !filter || r.status === filter;
      return matchesQ && matchesS;
    });
  }, [data, q, filter]);

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    (data ?? []).forEach((r) => { map[r.status] = (map[r.status] ?? 0) + 1; });
    return map;
  }, [data]);

  return (
    <div className="px-5 pt-10 space-y-5 livvo-fade-in">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">CRM de pacientes</h1>
        <p className="text-sm text-muted-foreground mt-1">{data?.length ?? 0} pacientes no seu funil</p>
      </header>

      <Input placeholder="Buscar paciente..." value={q} onChange={(e) => setQ(e.target.value)} className="rounded-xl" />

      <div className="flex gap-2 overflow-x-auto -mx-5 px-5 pb-1">
        <button onClick={() => setFilter("")} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border ${filter === "" ? "bg-foreground text-background border-foreground" : "border-border bg-card"}`}>
          Todos ({data?.length ?? 0})
        </button>
        {Object.entries(STATUS_META).map(([k, m]) => (
          <button key={k} onClick={() => setFilter(k)} className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold border ${filter === k ? "bg-foreground text-background border-foreground" : "border-border bg-card"}`}>
            {m.label} ({counts[k] ?? 0})
          </button>
        ))}
      </div>

      <div className="space-y-2">
        {filtered.map((r) => {
          const p = (r as any).patient ?? {};
          const meta = STATUS_META[r.status] ?? STATUS_META.novo_lead;
          return (
            <button key={r.id} onClick={() => navigate({ to: "/pro/crm/$id", params: { id: r.id } })}
              className="w-full text-left flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
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
              <ChevronRight className="size-4 text-muted-foreground shrink-0" />
            </button>
          );
        })}
        {filtered.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Users className="size-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum paciente encontrado.</p>
            <Link to="/pro/agenda" className="mt-3 inline-block text-sm font-semibold text-primary">Ver agenda</Link>
          </div>
        )}
      </div>
    </div>
  );
}
