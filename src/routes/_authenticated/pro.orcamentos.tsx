import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listProQuotes } from "@/lib/livvo/quotes.functions";
import { FileText, ChevronRight, Plus, ArrowLeft } from "lucide-react";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/_authenticated/pro/orcamentos")({
  component: QuotesList,
});

const STATUS_META: Record<string, { label: string; cls: string }> = {
  rascunho: { label: "Rascunho", cls: "bg-muted text-muted-foreground" },
  enviado: { label: "Enviado", cls: "bg-blue-100 text-blue-700" },
  visualizado: { label: "Visualizado", cls: "bg-violet-100 text-violet-700" },
  aprovado: { label: "Aprovado", cls: "bg-emerald-100 text-emerald-700" },
  recusado: { label: "Recusado", cls: "bg-destructive/10 text-destructive" },
  expirado: { label: "Expirado", cls: "bg-amber-100 text-amber-700" },
};

function QuotesList() {
  const fetchFn = useServerFn(listProQuotes);
  const { data } = useQuery({ queryKey: ["quotes-pro"], queryFn: () => fetchFn() });
  const [q, setQ] = useState("");
  const rows = useMemo(() => {
    const all = data ?? [];
    return all.filter((r) => {
      const p = (r as { patient?: { full_name?: string } }).patient;
      return !q || (p?.full_name ?? "").toLowerCase().includes(q.toLowerCase()) || r.title.toLowerCase().includes(q.toLowerCase());
    });
  }, [data, q]);

  return (
    <div className="px-5 pt-10 space-y-5 livvo-fade-in">
      <Link to="/pro/crm" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> CRM</Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Orçamentos</h1>
        <p className="text-sm text-muted-foreground mt-1">{data?.length ?? 0} orçamentos</p>
      </header>

      <Input placeholder="Buscar..." value={q} onChange={(e) => setQ(e.target.value)} className="rounded-xl" />

      <div className="rounded-xl border border-dashed border-border p-3 text-xs text-muted-foreground">
        Para criar um orçamento, abra a ficha de um paciente em <Link to="/pro/crm" className="text-primary font-semibold">CRM</Link> e use "Novo orçamento".
      </div>

      <div className="space-y-2">
        {rows.map((r) => {
          const p = (r as { patient?: { full_name?: string; avatar_url?: string } }).patient ?? {};
          const meta = STATUS_META[r.status] ?? STATUS_META.rascunho;
          return (
            <Link key={r.id} to="/pro/orcamentos/$id" params={{ id: r.id }} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/30">
              <div className="size-10 rounded-full bg-primary-soft text-primary grid place-items-center font-bold overflow-hidden shrink-0">
                {p.avatar_url ? <img src={p.avatar_url} className="size-full object-cover" alt="" /> : (p.full_name ?? "?").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{p.full_name ?? "Paciente"}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${meta.cls}`}>{meta.label}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{r.title} · R$ {Number(r.total).toFixed(2)}</div>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          );
        })}
        {rows.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <FileText className="size-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhum orçamento ainda.</p>
          </div>
        )}
      </div>
    </div>
  );
}
