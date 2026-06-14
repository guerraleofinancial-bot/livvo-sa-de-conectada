import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listPatientQuotes } from "@/lib/livvo/quotes.functions";
import { FileText, ChevronRight, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/orcamentos")({
  component: PatientQuotes,
});

const STATUS_META: Record<string, { label: string; cls: string }> = {
  enviado: { label: "Aguardando você", cls: "bg-blue-100 text-blue-700" },
  visualizado: { label: "Em análise", cls: "bg-violet-100 text-violet-700" },
  aprovado: { label: "Aprovado", cls: "bg-emerald-100 text-emerald-700" },
  recusado: { label: "Recusado", cls: "bg-destructive/10 text-destructive" },
  expirado: { label: "Expirado", cls: "bg-amber-100 text-amber-700" },
};

function PatientQuotes() {
  const fetchFn = useServerFn(listPatientQuotes);
  const { data } = useQuery({ queryKey: ["my-quotes"], queryFn: () => fetchFn() });

  return (
    <div className="px-5 pt-10 space-y-5 livvo-fade-in">
      <Link to="/app" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Início</Link>
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Meus orçamentos</h1>
        <p className="text-sm text-muted-foreground mt-1">{data?.length ?? 0} orçamentos recebidos</p>
      </header>

      <div className="space-y-2">
        {(data ?? []).map((q) => {
          const meta = STATUS_META[q.status] ?? STATUS_META.enviado;
          return (
            <Link key={q.id} to="/app/orcamentos/$id" params={{ id: q.id }} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
              <div className="size-10 rounded-xl bg-primary-soft text-primary grid place-items-center"><FileText className="size-4" /></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{q.title}</p>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${meta.cls}`}>{meta.label}</span>
                </div>
                <p className="text-xs text-muted-foreground">R$ {Number(q.total).toFixed(2)}</p>
              </div>
              <ChevronRight className="size-4 text-muted-foreground" />
            </Link>
          );
        })}
        {data && data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Nenhum orçamento.</div>
        )}
      </div>
    </div>
  );
}
