import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, Wallet, FileText, Download } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/carteira")({
  component: Carteira,
});

function Carteira() {
  const { user } = useAuth();

  const { data: payments } = useQuery({
    queryKey: ["my-payments", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase
      .from("payments")
      .select("id, amount, status, method, paid_at, created_at, appointment_id, appointments(scheduled_at, professionals(profiles:profiles!professionals_profile_fkey(full_name)))")
      .eq("patient_id", user!.id)
      .order("created_at", { ascending: false })).data ?? [],
  });

  const totalSpent = (payments ?? []).filter((p) => p.status === "pago").reduce((s, p) => s + Number(p.amount), 0);

  return (
    <div className="px-5 pt-10 pb-24 space-y-5 livvo-fade-in">
      <header className="flex items-center gap-3">
        <Link to="/app/perfil" className="size-10 rounded-full border border-border bg-card grid place-items-center"><ArrowLeft className="size-4" /></Link>
        <div>
          <h1 className="text-lg font-bold">Carteira</h1>
          <p className="text-xs text-muted-foreground">Histórico de pagamentos e comprovantes</p>
        </div>
      </header>

      <div className="rounded-3xl bg-primary text-primary-foreground p-5 shadow-[var(--shadow-elevated)]">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider opacity-90"><Wallet className="size-4" /> Total investido em saúde</div>
        <p className="font-mono text-3xl font-bold mt-2">R$ {totalSpent.toFixed(2)}</p>
        <p className="text-xs opacity-80 mt-1">{(payments ?? []).filter((p) => p.status === "pago").length} pagamentos realizados</p>
      </div>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Histórico</h2>
        <div className="space-y-2">
          {(payments ?? []).map((p) => {
            const a = (p as typeof p & { appointments: { scheduled_at: string; professionals: { profiles: { full_name?: string } | null } | null } | null }).appointments;
            const proName = a?.professionals?.profiles?.full_name ?? "Atendimento";
            return (
              <div key={p.id} className="p-4 rounded-2xl bg-card border border-border">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate">{proName}</p>
                    <p className="text-xs text-muted-foreground">{a ? new Date(a.scheduled_at).toLocaleDateString("pt-BR") : "—"} · {p.method ?? "—"}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-sm font-bold">R$ {Number(p.amount).toFixed(2)}</p>
                    <span className={`text-[10px] font-bold uppercase ${p.status === "pago" ? "text-health" : p.status === "reembolsado" ? "text-warning-foreground" : "text-muted-foreground"}`}>{p.status}</span>
                  </div>
                </div>
                <button
                  onClick={() => window.print()}
                  className="text-xs text-primary font-semibold mt-2 flex items-center gap-1"
                ><Download className="size-3" /> Comprovante</button>
              </div>
            );
          })}
          {payments && payments.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
              <FileText className="size-8 text-muted-foreground mx-auto mb-2" />
              Nenhum pagamento ainda.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
