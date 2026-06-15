import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { z } from "zod";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CreditCard, QrCode, ShieldCheck, Lock } from "lucide-react";
import { toast } from "sonner";
import { createPaidAppointment } from "@/lib/livvo/payment.functions";

const search = z.object({
  professionalId: z.string().uuid(),
  scheduledAt: z.string(),
  serviceId: z.string().uuid().optional(),
});

export const Route = createFileRoute("/_authenticated/app/checkout/$id")({
  validateSearch: search,
  component: Checkout,
});

function Checkout() {
  const params = Route.useSearch();
  const navigate = useNavigate();
  const charge = useServerFn(createPaidAppointment);
  const [method, setMethod] = useState<"mock_card" | "mock_pix">("mock_card");
  const [simulate, setSimulate] = useState<"approved" | "declined" | "pending">("approved");
  const [card, setCard] = useState("4242 4242 4242 4242");
  const [cvc, setCvc] = useState("123");

  const { data: pro } = useQuery({
    queryKey: ["chk-pro", params.professionalId],
    queryFn: async () => (await supabase.from("professionals").select("id, consultation_price, profiles:profiles!professionals_profile_fkey(full_name), specialties(name)").eq("id", params.professionalId).single()).data,
  });

  const { data: service } = useQuery({
    queryKey: ["chk-svc", params.serviceId],
    enabled: !!params.serviceId,
    queryFn: async () => (await supabase.from("services").select("*, categories(name)").eq("id", params.serviceId!).single()).data,
  });

  const { data: settings } = useQuery({
    queryKey: ["settings"],
    queryFn: async () => (await supabase.from("platform_settings").select("*").eq("id", 1).single()).data,
  });

  const price = service ? Number(service.price) : Number(pro?.consultation_price ?? 0);
  const pct = Number(settings?.commission_percent ?? 15);
  const commission = Math.round(price * pct) / 100;
  const livvoFee = commission; // visível como "taxa de serviço" para o paciente? No, comissão é do prestador. Paciente paga só o preço.

  const pay = useMutation({
    mutationFn: async () => charge({ data: { professionalId: params.professionalId, scheduledAt: params.scheduledAt, serviceId: params.serviceId ?? null, paymentMethod: method, simulate } }),
    onSuccess: () => {
      const msg = simulate === "pending" ? "Pagamento pendente" : "Pagamento aprovado!";
      toast.success(msg, { description: simulate === "pending" ? "Aguardando confirmação." : "Sua consulta foi confirmada." });
      navigate({ to: "/app/consultas" });
    },
    onError: (e) => toast.error("Falha no pagamento", { description: (e as Error).message }),
  });

  const proRow = pro as typeof pro & { profiles: { full_name?: string } | null; specialties: { name?: string } | null } | null;
  const slotDate = new Date(params.scheduledAt);

  return (
    <div className="px-5 pt-10 pb-32 space-y-5 livvo-fade-in">
      <header className="flex items-center gap-3">
        <Link to="/app/profissional/$id" params={{ id: params.professionalId }} className="size-10 rounded-full border border-border bg-card grid place-items-center"><ArrowLeft className="size-4" /></Link>
        <h1 className="text-lg font-bold">Pagamento</h1>
      </header>

      <section className="rounded-3xl bg-card border border-border p-5">
        <p className="text-xs uppercase font-bold text-muted-foreground">Resumo</p>
        <p className="text-sm font-semibold mt-2">{service?.name ?? `Consulta — ${proRow?.specialties?.name ?? ""}`}</p>
        <p className="text-xs text-muted-foreground">{proRow?.profiles?.full_name}</p>
        <p className="text-xs text-muted-foreground mt-1">{slotDate.toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" })} · {slotDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
        <div className="border-t border-border mt-4 pt-3 flex justify-between items-center">
          <span className="text-sm">Total</span>
          <span className="font-mono text-2xl font-bold">R$ {price.toFixed(2)}</span>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">Inclui taxa de plataforma Livvo (comissão de {pct}% retida automaticamente do prestador).</p>
      </section>

      <section className="rounded-3xl bg-card border border-border p-5 space-y-4">
        <p className="text-xs uppercase font-bold text-muted-foreground">Forma de pagamento</p>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => setMethod("mock_card")} className={`p-4 rounded-2xl border text-left ${method === "mock_card" ? "border-primary bg-primary-soft" : "border-border"}`}>
            <CreditCard className="size-5 text-primary mb-2" />
            <p className="text-sm font-semibold">Cartão de crédito</p>
            <p className="text-[10px] text-muted-foreground">Visa, Master, Elo</p>
          </button>
          <button onClick={() => setMethod("mock_pix")} className={`p-4 rounded-2xl border text-left ${method === "mock_pix" ? "border-primary bg-primary-soft" : "border-border"}`}>
            <QrCode className="size-5 text-primary mb-2" />
            <p className="text-sm font-semibold">PIX</p>
            <p className="text-[10px] text-muted-foreground">Aprovação imediata</p>
          </button>
        </div>

        {method === "mock_card" && (
          <div className="space-y-2">
            <input value={card} onChange={(e) => setCard(e.target.value)} className="w-full h-11 rounded-xl border border-border bg-background px-3 font-mono text-sm" placeholder="Número do cartão" />
            <div className="grid grid-cols-2 gap-2">
              <input className="h-11 rounded-xl border border-border bg-background px-3 text-sm" placeholder="MM/AA" defaultValue="12/29" />
              <input value={cvc} onChange={(e) => setCvc(e.target.value)} className="h-11 rounded-xl border border-border bg-background px-3 text-sm" placeholder="CVC" />
            </div>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Lock className="size-3" /> Modo demonstração — nenhum valor real é cobrado.</p>
          </div>
        )}

        {method === "mock_pix" && (
          <div className="rounded-2xl bg-muted/50 p-6 text-center">
            <QrCode className="size-24 mx-auto text-foreground" strokeWidth={1.5} />
            <p className="text-xs text-muted-foreground mt-2">QR Code de demonstração</p>
          </div>
        )}
      </section>

      <section className="rounded-3xl bg-card border border-dashed border-border p-5">
        <p className="text-xs uppercase font-bold text-muted-foreground mb-2">Simulação (modo demo)</p>
        <div className="grid grid-cols-3 gap-2">
          {([
            { v: "approved" as const, label: "Aprovado" },
            { v: "pending" as const, label: "Pendente" },
            { v: "declined" as const, label: "Recusado" },
          ]).map((o) => (
            <button key={o.v} onClick={() => setSimulate(o.v)} className={`px-3 py-2 rounded-xl border text-xs ${simulate === o.v ? "border-primary bg-primary-soft" : "border-border"}`}>{o.label}</button>
          ))}
        </div>
        <p className="text-[10px] text-muted-foreground mt-2">Estes cenários simulam respostas do gateway (MockPaymentProvider). Em produção, virão do Pagar.me.</p>
      </section>

      <div className="flex items-center gap-2 text-xs text-muted-foreground"><ShieldCheck className="size-4 text-health" /> Pagamento processado e protegido pela Livvo.</div>

      <div className="fixed inset-x-0 bottom-20 z-30 px-5 max-w-md mx-auto">
        <Button onClick={() => pay.mutate()} disabled={pay.isPending} size="lg" className="w-full rounded-2xl shadow-[var(--shadow-elevated)]">
          {pay.isPending ? "Processando..." : `Pagar R$ ${price.toFixed(2)}`}
        </Button>
      </div>
    </div>
  );
}
