import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { getPublicCharge, simulatePayCharge } from "@/lib/livvo/charges.functions";
import { Button } from "@/components/ui/button";
import { CreditCard, Smartphone, Link2, CheckCircle2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/pay/$token")({
  head: () => ({ meta: [{ title: "Pagamento Livvo" }] }),
  component: PayPage,
});

type Method = "pix" | "cartao" | "link";

function PayPage() {
  const { token } = Route.useParams();
  const fetchFn = useServerFn(getPublicCharge);
  const payFn = useServerFn(simulatePayCharge);
  const [method, setMethod] = useState<Method>("pix");

  const q = useQuery({
    queryKey: ["public-charge", token],
    queryFn: () => fetchFn({ data: { token } }),
    retry: false,
  });

  const mut = useMutation({
    mutationFn: () => payFn({ data: { token, method } }),
    onSuccess: () => { toast.success("Pagamento confirmado!"); q.refetch(); },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao pagar"),
  });

  if (q.isLoading) return <div className="min-h-screen grid place-items-center text-sm text-muted-foreground">Carregando…</div>;
  if (q.error || !q.data) return (
    <div className="min-h-screen grid place-items-center p-6">
      <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-6 max-w-md text-center">
        <p className="text-sm text-destructive">Cobrança não encontrada ou expirada.</p>
      </div>
    </div>
  );

  const c = q.data;
  const isPaid = c.status === "pago";

  return (
    <div className="min-h-screen bg-muted/30 p-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-card rounded-3xl border border-border shadow-sm overflow-hidden">
        <div className="bg-primary text-primary-foreground p-6 text-center">
          <ShieldCheck className="size-8 mx-auto mb-2 opacity-90" />
          <p className="text-xs uppercase tracking-wide opacity-80">Cobrança Livvo</p>
          <p className="text-base font-semibold mt-1">{c.providerName}</p>
        </div>
        <div className="p-6 space-y-5">
          {c.description && <p className="text-sm text-center text-muted-foreground">{c.description}</p>}
          <div className="text-center">
            <p className="text-xs text-muted-foreground">Valor a pagar</p>
            <p className="text-4xl font-bold tracking-tight mt-1">R$ {c.amount.toFixed(2)}</p>
            {c.dueDate && <p className="text-xs text-muted-foreground mt-1">Vence em {new Date(c.dueDate).toLocaleDateString("pt-BR")}</p>}
          </div>

          {isPaid ? (
            <div className="rounded-2xl bg-health-soft text-health p-6 text-center space-y-2">
              <CheckCircle2 className="size-10 mx-auto" />
              <p className="font-semibold">Pagamento aprovado</p>
              <p className="text-xs">Você pode fechar esta página.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <MethodBtn icon={<Smartphone className="size-4" />} label="PIX" active={method === "pix"} onClick={() => setMethod("pix")} />
                <MethodBtn icon={<CreditCard className="size-4" />} label="Cartão" active={method === "cartao"} onClick={() => setMethod("cartao")} />
                <MethodBtn icon={<Link2 className="size-4" />} label="Link" active={method === "link"} onClick={() => setMethod("link")} />
              </div>
              <Button className="w-full" size="lg" disabled={mut.isPending} onClick={() => mut.mutate()}>
                {mut.isPending ? "Processando…" : `Pagar R$ ${c.amount.toFixed(2)}`}
              </Button>
              <p className="text-[11px] text-center text-muted-foreground">
                Pagamento simulado. Em produção, será processado por gateway real.
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function MethodBtn({ icon, label, active, onClick }: { icon: React.ReactNode; label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 flex flex-col items-center gap-1 text-xs font-semibold transition ${
        active ? "border-primary bg-primary-soft text-primary" : "border-border bg-card"
      }`}
    >
      {icon}
      {label}
    </button>
  );
}
