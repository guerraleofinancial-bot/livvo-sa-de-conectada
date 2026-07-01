import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Wallet, TrendingUp, TrendingDown, Download } from "lucide-react";
import { FirstVisitTip } from "@/components/livvo/first-visit-tip";

export const Route = createFileRoute("/_authenticated/pro/financeiro")({
  component: ProFinanceiro,
});

function ProFinanceiro() {
  const { user } = useAuth();

  const { data: txs } = useQuery({
    queryKey: ["wtx", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("wallet_transactions").select("*").eq("provider_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const { data: payouts } = useQuery({
    queryKey: ["payouts", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("payouts").select("*").eq("provider_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const gross = (txs ?? []).filter((t) => t.kind === "credito").reduce((s, t) => s + Number(t.amount), 0);
  const commissions = (txs ?? []).filter((t) => t.kind === "comissao").reduce((s, t) => s + Number(t.amount), 0);
  const paid = (txs ?? []).filter((t) => t.kind === "repasse").reduce((s, t) => s + Number(t.amount), 0);
  const balance = (txs ?? []).reduce((s, t) => s + Number(t.amount), 0);

  function exportCsv() {
    const header = "data,tipo,valor,descricao\n";
    const rows = (txs ?? []).map((t) => `${new Date(t.created_at).toISOString()},${t.kind},${t.amount},"${t.description ?? ""}"`).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "livvo-extrato.csv"; a.click();
  }

  return (
    <div className="px-5 pt-10 pb-8 space-y-5 livvo-fade-in">
      <FirstVisitTip
        id="pro-financeiro"
        title="Cobre pelo Livvo"
        message="Envie cobranças por PIX ou cartão direto para o paciente. O valor cai na sua carteira."
        articleSlug="criar-cobranca"
      />
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-sm text-muted-foreground">Extrato, comissões e repasses</p>
        </div>
        <button onClick={exportCsv} className="text-xs text-primary font-semibold flex items-center gap-1"><Download className="size-3" /> CSV</button>
      </header>

      <div className="rounded-3xl bg-primary text-primary-foreground p-5 shadow-[var(--shadow-elevated)]">
        <p className="text-xs uppercase font-bold tracking-wider opacity-90 flex items-center gap-2"><Wallet className="size-4" /> Saldo disponível</p>
        <p className="font-mono text-4xl font-bold mt-2">R$ {balance.toFixed(2)}</p>
        <p className="text-xs opacity-80 mt-1">Próximo repasse processado pela equipe Livvo</p>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl bg-card border border-border p-3">
          <TrendingUp className="size-4 text-health mb-1" />
          <p className="font-mono text-sm font-bold">R$ {gross.toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground">Receita bruta</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-3">
          <TrendingDown className="size-4 text-destructive mb-1" />
          <p className="font-mono text-sm font-bold">R$ {Math.abs(commissions).toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground">Comissão Livvo</p>
        </div>
        <div className="rounded-2xl bg-card border border-border p-3">
          <Wallet className="size-4 text-primary mb-1" />
          <p className="font-mono text-sm font-bold">R$ {Math.abs(paid).toFixed(0)}</p>
          <p className="text-[10px] text-muted-foreground">Já repassado</p>
        </div>
      </div>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Repasses</h2>
        <div className="space-y-2">
          {(payouts ?? []).map((p) => (
            <div key={p.id} className="flex justify-between p-3 rounded-2xl bg-card border border-border text-sm">
              <span>{new Date(p.paid_at ?? p.created_at).toLocaleDateString("pt-BR")}</span>
              <span className="font-mono font-bold">R$ {Number(p.amount).toFixed(2)}</span>
            </div>
          ))}
          {payouts && payouts.length === 0 && <p className="text-xs text-muted-foreground">Nenhum repasse ainda.</p>}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Extrato</h2>
        <div className="space-y-1">
          {(txs ?? []).map((t) => (
            <div key={t.id} className="flex justify-between gap-3 p-3 rounded-xl bg-card border border-border text-xs">
              <div className="min-w-0">
                <p className="font-semibold capitalize">{t.kind}</p>
                <p className="text-muted-foreground truncate">{t.description} · {new Date(t.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <span className={`font-mono font-bold ${Number(t.amount) >= 0 ? "text-health" : "text-destructive"}`}>
                {Number(t.amount) >= 0 ? "+" : ""}{Number(t.amount).toFixed(2)}
              </span>
            </div>
          ))}
          {txs && txs.length === 0 && <p className="text-xs text-muted-foreground">Sem movimentações.</p>}
        </div>
      </section>
    </div>
  );
}
