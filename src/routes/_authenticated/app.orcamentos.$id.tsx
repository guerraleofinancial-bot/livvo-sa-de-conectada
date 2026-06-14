import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getQuote, setQuoteStatus } from "@/lib/livvo/quotes.functions";
import { ArrowLeft, Check, X, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/orcamentos/$id")({
  component: PatientQuoteView,
});

function PatientQuoteView() {
  const { id } = Route.useParams();
  const fetchFn = useServerFn(getQuote);
  const statusFn = useServerFn(setQuoteStatus);
  const { data, refetch } = useQuery({ queryKey: ["my-quote", id], queryFn: () => fetchFn({ data: { id } }) });

  const decide = useMutation({
    mutationFn: (status: "aprovado" | "recusado") => statusFn({ data: { id, status } }),
    onSuccess: () => { toast.success("Resposta enviada"); refetch(); },
  });

  if (!data) return <div className="p-10 text-center text-sm text-muted-foreground">Carregando…</div>;
  const items = (data.items as Array<{ id: string; name: string; quantity: number; unit_price: number; total: number; description: string | null }>) ?? [];

  return (
    <div className="px-5 pt-10 pb-10 space-y-5 livvo-fade-in">
      <Link to="/app/orcamentos" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Orçamentos</Link>

      <header>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="size-4 text-primary" />
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-muted">{data.status}</span>
        </div>
        <h1 className="text-xl font-bold">{data.title}</h1>
        {data.valid_until && <p className="text-xs text-muted-foreground mt-1">Válido até {new Date(data.valid_until).toLocaleDateString("pt-BR")}</p>}
      </header>

      <section className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="rounded-xl border border-border bg-card p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold">{it.name}</p>
              <p className="text-sm font-bold">R$ {Number(it.total).toFixed(2)}</p>
            </div>
            <p className="text-xs text-muted-foreground">{it.quantity} × R$ {Number(it.unit_price).toFixed(2)}</p>
            {it.description && <p className="text-xs text-muted-foreground mt-1">{it.description}</p>}
          </div>
        ))}
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
        <div className="flex items-center justify-between text-sm"><span>Subtotal</span><span>R$ {Number(data.subtotal).toFixed(2)}</span></div>
        {Number(data.discount) > 0 && <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Desconto</span><span>− R$ {Number(data.discount).toFixed(2)}</span></div>}
        <div className="flex items-center justify-between text-base font-bold border-t border-border pt-2"><span>Total</span><span>R$ {Number(data.total).toFixed(2)}</span></div>
      </section>

      {data.notes && (
        <section className="rounded-xl border border-border bg-card p-3 text-sm whitespace-pre-wrap">{data.notes}</section>
      )}

      {["enviado", "visualizado"].includes(data.status) && (
        <section className="flex gap-2 sticky bottom-20 bg-surface/95 backdrop-blur-md py-2 -mx-5 px-5 border-t border-border">
          <Button variant="outline" className="flex-1" onClick={() => decide.mutate("recusado")} disabled={decide.isPending}>
            <X className="size-4 mr-1.5" /> Recusar
          </Button>
          <Button className="flex-1" onClick={() => decide.mutate("aprovado")} disabled={decide.isPending}>
            <Check className="size-4 mr-1.5" /> Aprovar
          </Button>
        </section>
      )}
      {data.status === "aprovado" && <p className="text-center text-sm font-semibold text-emerald-700">Você aprovou este orçamento.</p>}
      {data.status === "recusado" && <p className="text-center text-sm font-semibold text-destructive">Você recusou este orçamento.</p>}
    </div>
  );
}
