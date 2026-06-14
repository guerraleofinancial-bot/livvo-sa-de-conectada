import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { getQuote, updateQuote, saveQuoteItems, setQuoteStatus, deleteQuote, listProServicesForQuote } from "@/lib/livvo/quotes.functions";
import { ArrowLeft, Plus, Trash2, Send, Check, X, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pro/orcamentos/$id")({
  component: QuoteEditor,
});

type Item = { id?: string; service_id?: string | null; name: string; description?: string | null; quantity: number; unit_price: number };

function QuoteEditor() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const fetchFn = useServerFn(getQuote);
  const updateFn = useServerFn(updateQuote);
  const itemsFn = useServerFn(saveQuoteItems);
  const statusFn = useServerFn(setQuoteStatus);
  const delFn = useServerFn(deleteQuote);
  const servicesFn = useServerFn(listProServicesForQuote);

  const { data, refetch } = useQuery({ queryKey: ["quote", id], queryFn: () => fetchFn({ data: { id } }) });
  const { data: services } = useQuery({ queryKey: ["services-for-quote"], queryFn: () => servicesFn() });

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [discount, setDiscount] = useState(0);
  const [validUntil, setValidUntil] = useState("");
  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    if (!data) return;
    setTitle(data.title);
    setNotes(data.notes ?? "");
    setDiscount(Number(data.discount ?? 0));
    setValidUntil(data.valid_until ?? "");
    type Row = { id: string; service_id: string | null; name: string; description: string | null; quantity: number; unit_price: number };
    setItems(((data.items as Row[]) ?? []).map((it) => ({
      id: it.id, service_id: it.service_id, name: it.name, description: it.description,
      quantity: Number(it.quantity), unit_price: Number(it.unit_price),
    })));
  }, [data]);

  const saveMut = useMutation({
    mutationFn: async () => {
      await updateFn({ data: { id, title, notes, discount, valid_until: validUntil || null } });
      await itemsFn({ data: { quote_id: id, items: items.map(({ id: _id, ...rest }) => rest) } });
    },
    onSuccess: () => { toast.success("Orçamento salvo"); refetch(); qc.invalidateQueries({ queryKey: ["quotes-pro"] }); },
    onError: (e) => toast.error((e as Error).message),
  });

  const setStatusMut = useMutation({
    mutationFn: (status: "enviado" | "aprovado" | "recusado") => statusFn({ data: { id, status } }),
    onSuccess: () => { refetch(); qc.invalidateQueries({ queryKey: ["quotes-pro"] }); },
  });

  const deleteMut = useMutation({
    mutationFn: () => delFn({ data: { id } }),
    onSuccess: () => navigate({ to: "/pro/orcamentos" }),
  });

  if (!data) return <div className="p-10 text-center text-sm text-muted-foreground">Carregando…</div>;
  const readOnly = data.status !== "rascunho";

  const subtotal = items.reduce((s, it) => s + it.quantity * it.unit_price, 0);
  const total = Math.max(subtotal - discount, 0);

  const addItem = () => setItems([...items, { name: "", quantity: 1, unit_price: 0 }]);
  const removeItem = (idx: number) => setItems(items.filter((_, i) => i !== idx));
  const setItem = (idx: number, patch: Partial<Item>) => setItems(items.map((it, i) => i === idx ? { ...it, ...patch } : it));
  const pickService = (idx: number, sid: string) => {
    if (!sid) return;
    const s = services?.find((x) => x.id === sid);
    if (!s) return;
    setItem(idx, { service_id: s.id, name: s.name, unit_price: Number(s.price) });
  };

  return (
    <div className="px-5 pt-10 pb-10 space-y-5 livvo-fade-in">
      <Link to="/pro/orcamentos" className="inline-flex items-center gap-1 text-sm text-muted-foreground"><ArrowLeft className="size-4" /> Orçamentos</Link>

      <header>
        <div className="flex items-center gap-2 mb-1">
          <FileText className="size-4 text-primary" />
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-muted">{data.status}</span>
        </div>
        <h1 className="text-xl font-bold">{title || "Orçamento"}</h1>
        <p className="text-xs text-muted-foreground mt-1">Para: {(data.patient as { full_name?: string })?.full_name}</p>
      </header>

      {!readOnly && (
        <section className="space-y-3 rounded-2xl border border-border bg-card p-4">
          <div>
            <label className="text-xs font-semibold">Título</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded-xl mt-1" />
          </div>
          <div>
            <label className="text-xs font-semibold">Validade</label>
            <Input type="date" value={validUntil} onChange={(e) => setValidUntil(e.target.value)} className="rounded-xl mt-1" />
          </div>
        </section>
      )}

      <section className="space-y-2">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold">Itens</h2>
          {!readOnly && <Button size="sm" variant="outline" onClick={addItem}><Plus className="size-3.5 mr-1" /> Adicionar</Button>}
        </div>
        <div className="space-y-2">
          {items.map((it, idx) => (
            <div key={idx} className="rounded-xl border border-border bg-card p-3 space-y-2">
              {!readOnly && services && services.length > 0 && (
                <select className="w-full text-xs rounded-lg border border-border bg-background p-2"
                  value={it.service_id ?? ""} onChange={(e) => pickService(idx, e.target.value)}>
                  <option value="">Item avulso (digite abaixo)</option>
                  {services.map((s) => <option key={s.id} value={s.id}>{s.name} — R$ {Number(s.price).toFixed(2)}</option>)}
                </select>
              )}
              <Input placeholder="Nome do item" value={it.name} disabled={readOnly}
                onChange={(e) => setItem(idx, { name: e.target.value })} className="rounded-lg" />
              <div className="flex gap-2">
                <Input type="number" min={0} step="0.01" placeholder="Qtd" value={it.quantity} disabled={readOnly}
                  onChange={(e) => setItem(idx, { quantity: Number(e.target.value) })} className="rounded-lg w-20" />
                <Input type="number" min={0} step="0.01" placeholder="Preço unit." value={it.unit_price} disabled={readOnly}
                  onChange={(e) => setItem(idx, { unit_price: Number(e.target.value) })} className="rounded-lg flex-1" />
                <div className="grid place-items-center px-3 text-sm font-semibold">R$ {(it.quantity * it.unit_price).toFixed(2)}</div>
                {!readOnly && (
                  <button onClick={() => removeItem(idx)} className="text-destructive p-2"><Trash2 className="size-4" /></button>
                )}
              </div>
            </div>
          ))}
          {items.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">Sem itens.</p>}
        </div>
      </section>

      <section className="rounded-2xl border border-border bg-card p-4 space-y-2">
        {!readOnly && (
          <div className="flex items-center justify-between gap-3">
            <label className="text-sm">Desconto</label>
            <Input type="number" min={0} step="0.01" value={discount}
              onChange={(e) => setDiscount(Number(e.target.value))} className="rounded-lg w-32" />
          </div>
        )}
        <div className="flex items-center justify-between text-sm"><span>Subtotal</span><span>R$ {subtotal.toFixed(2)}</span></div>
        {discount > 0 && <div className="flex items-center justify-between text-sm text-muted-foreground"><span>Desconto</span><span>− R$ {discount.toFixed(2)}</span></div>}
        <div className="flex items-center justify-between text-base font-bold border-t border-border pt-2"><span>Total</span><span>R$ {total.toFixed(2)}</span></div>
      </section>

      {!readOnly && (
        <section>
          <label className="text-xs font-semibold">Observações para o paciente</label>
          <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="rounded-xl mt-1" />
        </section>
      )}
      {readOnly && data.notes && (
        <section className="rounded-xl border border-border bg-card p-3 text-sm whitespace-pre-wrap">{data.notes}</section>
      )}

      <section className="flex gap-2 sticky bottom-20 bg-surface/95 backdrop-blur-md py-2 -mx-5 px-5 border-t border-border">
        {!readOnly ? (
          <>
            <Button className="flex-1" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>Salvar rascunho</Button>
            <Button variant="default" className="flex-1 bg-primary" onClick={async () => { await saveMut.mutateAsync(); setStatusMut.mutate("enviado"); }}>
              <Send className="size-4 mr-1.5" /> Enviar
            </Button>
            <button onClick={() => deleteMut.mutate()} className="p-2 text-destructive"><Trash2 className="size-4" /></button>
          </>
        ) : data.status === "aprovado" ? (
          <div className="flex-1 text-center text-sm font-semibold text-emerald-700">Aprovado pelo paciente</div>
        ) : data.status === "recusado" ? (
          <div className="flex-1 text-center text-sm font-semibold text-destructive">Recusado pelo paciente</div>
        ) : (
          <>
            <Button variant="outline" className="flex-1" onClick={() => setStatusMut.mutate("aprovado")}>
              <Check className="size-4 mr-1.5" /> Marcar aprovado
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setStatusMut.mutate("recusado")}>
              <X className="size-4 mr-1.5" /> Marcar recusado
            </Button>
          </>
        )}
      </section>
    </div>
  );
}
