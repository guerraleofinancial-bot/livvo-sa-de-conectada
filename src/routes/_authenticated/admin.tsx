import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Users, Stethoscope, Calendar, Wallet, ShieldCheck, CheckCircle2, XCircle, Ban, Database, LogOut, Building2, Percent, MessageSquareWarning, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setProfessionalStatus, setCompanyStatus, setUserSuspended, seedDemoData, updatePlatformSettings, setReviewStatus, createPayoutBatch, markPayoutBatchPaid } from "@/lib/livvo/admin.functions";
import { verifyProfessionalCouncil } from "@/lib/livvo/onboarding-pro.functions";
import { adminAdsRevenueReport, adminListSubscriptions, cancelSubscription } from "@/lib/livvo/ads.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPanel,
});

type Tab = "overview" | "pros" | "companies" | "finance" | "ads" | "reviews" | "users" | "settings";

function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  const setStatus = useServerFn(setProfessionalStatus);
  const setCompany = useServerFn(setCompanyStatus);
  const setSusp = useServerFn(setUserSuspended);
  const seed = useServerFn(seedDemoData);
  const updSettings = useServerFn(updatePlatformSettings);
  const setRev = useServerFn(setReviewStatus);
  const createBatch = useServerFn(createPayoutBatch);
  const payBatch = useServerFn(markPayoutBatchPaid);
  const verifyCouncil = useServerFn(verifyProfessionalCouncil);
  const adsReport = useServerFn(adminAdsRevenueReport);
  const listSubs = useServerFn(adminListSubscriptions);
  const cancelSub = useServerFn(cancelSubscription);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [patients, pros, companies, scheduled, done, gmv, commission] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "paciente"),
        supabase.from("professionals").select("id", { count: "exact", head: true }).eq("status", "aprovado"),
        supabase.from("companies").select("id", { count: "exact", head: true }).eq("status", "aprovado"),
        supabase.from("appointments").select("id", { count: "exact", head: true }).in("status", ["agendada", "confirmada"]),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "realizada"),
        supabase.from("appointments").select("gross_amount").eq("payment_status", "pago"),
        supabase.from("wallet_transactions").select("amount").eq("kind", "comissao"),
      ]);
      return {
        patients: patients.count ?? 0,
        pros: pros.count ?? 0,
        companies: companies.count ?? 0,
        scheduled: scheduled.count ?? 0,
        done: done.count ?? 0,
        gmv: (gmv.data ?? []).reduce((s, a) => s + Number(a.gross_amount), 0),
        commission: Math.abs((commission.data ?? []).reduce((s, a) => s + Number(a.amount), 0)),
      };
    },
  });

  const { data: pendingPros } = useQuery({
    queryKey: ["pending-pros"], enabled: isAdmin,
    queryFn: async () => (await supabase.from("professionals").select("*, profiles:id(full_name, email), specialties(name)").in("status", ["pendente","em_analise"])).data ?? [],
  });
  const { data: pendingCompanies } = useQuery({
    queryKey: ["pending-companies"], enabled: isAdmin,
    queryFn: async () => (await supabase.from("companies").select("*").eq("status", "pendente")).data ?? [],
  });
  const { data: users } = useQuery({
    queryKey: ["all-profiles"], enabled: isAdmin && tab === "users",
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(30)).data ?? [],
  });
  const { data: settings } = useQuery({
    queryKey: ["settings"], enabled: isAdmin,
    queryFn: async () => (await supabase.from("platform_settings").select("*").eq("id", 1).single()).data,
  });
  const { data: allReviews } = useQuery({
    queryKey: ["all-reviews"], enabled: isAdmin && tab === "reviews",
    queryFn: async () => (await supabase.from("reviews").select("*, profiles:patient_id(full_name)").order("created_at", { ascending: false }).limit(30)).data ?? [],
  });
  const { data: providerBalances } = useQuery({
    queryKey: ["provider-balances"], enabled: isAdmin && tab === "finance",
    queryFn: async () => {
      const { data } = await supabase.from("wallet_transactions").select("provider_id, amount");
      const map = new Map<string, number>();
      (data ?? []).forEach((r) => map.set(r.provider_id, (map.get(r.provider_id) ?? 0) + Number(r.amount)));
      const ids = Array.from(map.keys());
      if (!ids.length) return [];
      const { data: profs } = await supabase.from("profiles").select("id, full_name").in("id", ids);
      const nameMap = new Map((profs ?? []).map((p) => [p.id, p.full_name]));
      return ids.map((id) => ({ id, name: nameMap.get(id) ?? "—", balance: map.get(id) ?? 0 })).filter((r) => r.balance > 0);
    },
  });

  const [adsRange, setAdsRange] = useState<7 | 30 | 90>(30);
  const { data: adsRevenue } = useQuery({
    queryKey: ["ads-revenue", adsRange], enabled: isAdmin && tab === "ads",
    queryFn: () => adsReport({ data: { days: adsRange } }),
  });
  const { data: adSubs } = useQuery({
    queryKey: ["admin-ad-subs"], enabled: isAdmin && tab === "ads",
    queryFn: () => listSubs(),
  });

  const seedNow = useMutation({
    mutationFn: async () => seed(),
    onSuccess: (r) => { toast.success(`Demo: ${r.professionals} profissionais, ${r.companies} empresas, ${r.units} unidades, ${r.services} serviços`); qc.invalidateQueries(); },
    onError: (e) => toast.error((e as Error).message),
  });

  async function signOut() {
    await qc.cancelQueries(); qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  if (loading) return <div className="p-10 text-center text-sm text-muted-foreground">Carregando...</div>;
  if (!isAdmin) return (
    <div className="p-10 text-center">
      <p className="text-sm text-muted-foreground">Acesso restrito a administradores.</p>
      <Link to="/app" className="mt-4 inline-block text-primary text-sm font-semibold">Voltar</Link>
    </div>
  );

  const tabs: Array<{ id: Tab; label: string; icon: typeof Users }> = [
    { id: "overview", label: "Visão geral", icon: ShieldCheck },
    { id: "pros", label: "Profissionais", icon: Stethoscope },
    { id: "companies", label: "Empresas", icon: Building2 },
    { id: "finance", label: "Financeiro", icon: Wallet },
    { id: "ads", label: "Anúncios & Receita", icon: Sparkles },
    { id: "reviews", label: "Avaliações", icon: MessageSquareWarning },
    { id: "users", label: "Usuários", icon: Users },
    { id: "settings", label: "Configurações", icon: Percent },
  ];

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center"><ShieldCheck className="size-5" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin · Livvo</p>
              <h1 className="text-base font-bold">Painel da plataforma</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => seedNow.mutate()} disabled={seedNow.isPending}><Database className="size-4 mr-1" /> {seedNow.isPending ? "..." : "Popular demo"}</Button>
            <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="size-4" /></Button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-5 flex gap-1 overflow-x-auto scrollbar-hide">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`px-3 py-2 text-xs font-semibold border-b-2 shrink-0 flex items-center gap-1.5 ${tab === t.id ? "border-primary text-primary" : "border-transparent text-muted-foreground"}`}>
              <t.icon className="size-3.5" /> {t.label}
            </button>
          ))}
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-5 py-6 space-y-6">
        {tab === "overview" && (
          <>
            <section className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { icon: Users, label: "Pacientes", value: stats?.patients ?? 0 },
                { icon: Stethoscope, label: "Profissionais", value: stats?.pros ?? 0 },
                { icon: Building2, label: "Empresas", value: stats?.companies ?? 0 },
                { icon: Calendar, label: "Agendamentos", value: (stats?.scheduled ?? 0) + (stats?.done ?? 0) },
                { icon: Wallet, label: "GMV (volume)", value: `R$ ${(stats?.gmv ?? 0).toFixed(0)}` },
                { icon: Percent, label: "Receita Livvo", value: `R$ ${(stats?.commission ?? 0).toFixed(0)}` },
              ].map((s) => (
                <div key={s.label} className="rounded-2xl bg-card border border-border p-4">
                  <s.icon className="size-4 text-primary mb-2" />
                  <p className="font-mono text-2xl font-bold">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
                </div>
              ))}
            </section>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl bg-card border border-border p-5">
                <h3 className="text-sm font-bold mb-2">Pendências</h3>
                <p className="text-xs text-muted-foreground">{pendingPros?.length ?? 0} profissionais e {pendingCompanies?.length ?? 0} empresas aguardando aprovação.</p>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => setTab("pros")}>Profissionais</Button>
                  <Button size="sm" variant="outline" onClick={() => setTab("companies")}>Empresas</Button>
                </div>
              </div>
              <div className="rounded-2xl bg-primary text-primary-foreground p-5">
                <h3 className="text-sm font-bold opacity-90">Comissão atual</h3>
                <p className="font-mono text-3xl font-bold mt-1">{Number(settings?.commission_percent ?? 15).toFixed(1)}%</p>
                <p className="text-xs opacity-80 mt-1">Retida automaticamente em cada transação.</p>
              </div>
            </section>
          </>
        )}

        {tab === "pros" && (
          <section>
            <h2 className="text-sm font-bold mb-3">Solicitações pendentes ({pendingPros?.length ?? 0})</h2>
            <div className="space-y-2">
              {(pendingPros ?? []).map((row) => {
                const p = row as typeof row & { profiles: { full_name?: string; email?: string } | null; specialties: { name?: string } | null };
                return (
                  <div key={p.id} className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{p.profiles?.full_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.specialties?.name} · {p.professional_registry} · {p.profiles?.email}</p>
                    </div>
                    <Button size="sm" variant="outline" className="text-destructive" onClick={async () => { await setStatus({ data: { professionalId: p.id, status: "rejeitado" } }); toast.success("Rejeitado"); qc.invalidateQueries({ queryKey: ["pending-pros"] }); }}><XCircle className="size-4 mr-1" /> Rejeitar</Button>
                    <Button size="sm" onClick={async () => { await setStatus({ data: { professionalId: p.id, status: "aprovado" } }); toast.success("Aprovado"); qc.invalidateQueries({ queryKey: ["pending-pros"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }}><CheckCircle2 className="size-4 mr-1" /> Aprovar</Button>
                  </div>
                );
              })}
              {pendingPros && pendingPros.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma solicitação pendente.</div>
              )}
            </div>
          </section>
        )}

        {tab === "companies" && (
          <section>
            <h2 className="text-sm font-bold mb-3">Empresas pendentes ({pendingCompanies?.length ?? 0})</h2>
            <div className="space-y-2">
              {(pendingCompanies ?? []).map((c) => (
                <div key={c.id} className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4 flex-wrap">
                  <Building2 className="size-5 text-health" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.legal_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{c.type} · {c.cnpj} · {c.address_city}/{c.address_state}</p>
                  </div>
                  <Button size="sm" variant="outline" className="text-destructive" onClick={async () => { await setCompany({ data: { companyId: c.id, status: "rejeitado" } }); toast.success("Rejeitado"); qc.invalidateQueries({ queryKey: ["pending-companies"] }); }}><XCircle className="size-4 mr-1" /> Rejeitar</Button>
                  <Button size="sm" onClick={async () => { await setCompany({ data: { companyId: c.id, status: "aprovado" } }); toast.success("Aprovado"); qc.invalidateQueries({ queryKey: ["pending-companies"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }}><CheckCircle2 className="size-4 mr-1" /> Aprovar</Button>
                </div>
              ))}
              {pendingCompanies && pendingCompanies.length === 0 && (
                <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma empresa pendente.</div>
              )}
            </div>
          </section>
        )}

        {tab === "finance" && (
          <section>
            <h2 className="text-sm font-bold mb-3">Saldos a repassar</h2>
            <div className="space-y-2">
              {(providerBalances ?? []).map((b) => (
                <div key={b.id} className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{b.name}</p>
                    <p className="text-xs text-muted-foreground font-mono">R$ {b.balance.toFixed(2)} disponíveis</p>
                  </div>
                  <Button size="sm" onClick={async () => { try { const r = await createBatch({ data: { providerId: b.id } }); await payBatch({ data: { batchId: r.batchId } }); toast.success(`Repasse de R$ ${r.total.toFixed(2)} enviado`); qc.invalidateQueries(); } catch (e) { toast.error((e as Error).message); } }}>
                    <Send className="size-4 mr-1" /> Repassar
                  </Button>
                </div>
              ))}
              {providerBalances && providerBalances.length === 0 && (
                <p className="text-sm text-muted-foreground">Nenhum prestador com saldo a repassar.</p>
              )}
            </div>
          </section>
        )}

        {tab === "ads" && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold">Receita da plataforma · últimos {adsRange} dias</h2>
              <div className="flex gap-1">
                {[7, 30, 90].map((d) => (
                  <button key={d} onClick={() => setAdsRange(d as 7 | 30 | 90)} className={`px-3 py-1 text-xs font-semibold rounded-full border ${adsRange === d ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>{d}d</button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="rounded-2xl bg-card border border-border p-4">
                <Percent className="size-4 text-primary mb-2" />
                <p className="font-mono text-2xl font-bold">R$ {(adsRevenue?.commissions ?? 0).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Receita de comissões</p>
              </div>
              <div className="rounded-2xl bg-card border border-border p-4">
                <Sparkles className="size-4 text-amber-500 mb-2" />
                <p className="font-mono text-2xl font-bold">R$ {((adsRevenue?.adsCents ?? 0) / 100).toFixed(0)}</p>
                <p className="text-xs text-muted-foreground mt-1">Receita de anúncios ({adsRevenue?.subsCount ?? 0} assinaturas)</p>
              </div>
              <div className="rounded-2xl bg-primary text-primary-foreground p-4">
                <Wallet className="size-4 mb-2 opacity-90" />
                <p className="font-mono text-2xl font-bold">R$ {(adsRevenue?.total ?? 0).toFixed(0)}</p>
                <p className="text-xs opacity-80 mt-1">Receita total</p>
              </div>
            </div>
            <h3 className="text-sm font-bold mt-6">Assinaturas ativas e recentes</h3>
            <div className="space-y-2">
              {(adSubs ?? []).map((s) => {
                const r = s as typeof s & { featured_plans: { name: string; kind: string } | null; profiles: { full_name?: string } | null; companies: { legal_name?: string } | null };
                const target = r.profiles?.full_name ?? r.companies?.legal_name ?? "—";
                return (
                  <div key={s.id} className="p-3 rounded-2xl bg-card border border-border flex items-center gap-3 flex-wrap">
                    <Sparkles className="size-4 text-amber-500" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold truncate">{target} <span className="text-xs text-muted-foreground">· {r.featured_plans?.name}</span></p>
                      <p className="text-[10px] text-muted-foreground">Status {s.status} · expira {new Date(s.ends_at).toLocaleDateString("pt-BR")} · R$ {(s.amount_paid_cents / 100).toFixed(2)}</p>
                    </div>
                    {s.status === "ativo" && (
                      <Button size="sm" variant="outline" onClick={async () => { await cancelSub({ data: { subscriptionId: s.id } }); toast.success("Cancelado"); qc.invalidateQueries({ queryKey: ["admin-ad-subs"] }); }}>
                        <X className="size-4 mr-1" /> Cancelar
                      </Button>
                    )}
                  </div>
                );
              })}
              {adSubs && adSubs.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma assinatura ainda.</p>}
            </div>
          </section>
        )}

        {tab === "reviews" && (
          <section>
            <h2 className="text-sm font-bold mb-3">Moderação de avaliações</h2>
            <div className="space-y-2">
              {(allReviews ?? []).map((r) => {
                const author = (r as typeof r & { profiles: { full_name?: string } | null }).profiles;
                return (
                  <div key={r.id} className="p-4 rounded-2xl bg-card border border-border">
                    <div className="flex justify-between items-start gap-3">
                      <div className="min-w-0">
                        <div className="flex gap-1 text-amber-500 text-xs">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                        <p className="text-sm mt-1">{r.comment ?? <em className="text-muted-foreground">Sem comentário</em>}</p>
                        <p className="text-[10px] text-muted-foreground mt-1">por {author?.full_name ?? "—"} · {new Date(r.created_at).toLocaleDateString("pt-BR")} · <span className="uppercase font-bold">{r.status}</span></p>
                      </div>
                      <Button size="sm" variant="outline" onClick={async () => { await setRev({ data: { reviewId: r.id, status: r.status === "oculta" ? "publicada" : "oculta" } }); toast.success("Atualizado"); qc.invalidateQueries({ queryKey: ["all-reviews"] }); }}>
                        {r.status === "oculta" ? "Restaurar" : "Ocultar"}
                      </Button>
                    </div>
                  </div>
                );
              })}
              {allReviews && allReviews.length === 0 && <p className="text-sm text-muted-foreground">Nenhuma avaliação.</p>}
            </div>
          </section>
        )}

        {tab === "users" && (
          <section>
            <h2 className="text-sm font-bold mb-3">Usuários recentes</h2>
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
                  <tr><th className="text-left p-3">Nome</th><th className="text-left p-3 hidden md:table-cell">Email</th><th className="text-left p-3">Status</th><th></th></tr>
                </thead>
                <tbody>
                  {(users ?? []).map((u) => (
                    <tr key={u.id} className="border-t border-border">
                      <td className="p-3 font-semibold">{u.full_name}</td>
                      <td className="p-3 text-muted-foreground hidden md:table-cell">{u.email}</td>
                      <td className="p-3"><span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${u.suspended ? "bg-destructive/10 text-destructive" : "bg-health-soft text-health"}`}>{u.suspended ? "Suspenso" : "Ativo"}</span></td>
                      <td className="p-3 text-right"><Button size="sm" variant="ghost" onClick={async () => { await setSusp({ data: { userId: u.id, suspended: !u.suspended } }); toast.success("Usuário atualizado"); qc.invalidateQueries({ queryKey: ["all-profiles"] }); }}><Ban className="size-4 mr-1" />{u.suspended ? "Reativar" : "Suspender"}</Button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {tab === "settings" && settings && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold">Configurações da plataforma</h2>
            <SettingsForm initial={settings} onSave={async (v) => { await updSettings({ data: v }); toast.success("Salvo"); qc.invalidateQueries({ queryKey: ["settings"] }); }} />
          </section>
        )}
      </main>
    </div>
  );
}

function SettingsForm({ initial, onSave }: { initial: { commission_percent: number; cancellation_window_hours: number; refund_policy: string }; onSave: (v: { commission_percent: number; cancellation_window_hours: number; refund_policy: string }) => Promise<void> }) {
  const [pct, setPct] = useState(Number(initial.commission_percent));
  const [hrs, setHrs] = useState(Number(initial.cancellation_window_hours));
  const [policy, setPolicy] = useState(initial.refund_policy);
  return (
    <div className="rounded-2xl bg-card border border-border p-5 space-y-4 max-w-xl">
      <div>
        <label className="text-xs font-bold uppercase text-muted-foreground">Comissão Livvo (%)</label>
        <Input type="number" step="0.5" min={0} max={50} value={pct} onChange={(e) => setPct(Number(e.target.value))} />
        <p className="text-[10px] text-muted-foreground mt-1">Percentual retido automaticamente de cada pagamento.</p>
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-muted-foreground">Janela de cancelamento (horas)</label>
        <Input type="number" min={0} max={168} value={hrs} onChange={(e) => setHrs(Number(e.target.value))} />
      </div>
      <div>
        <label className="text-xs font-bold uppercase text-muted-foreground">Política de reembolso</label>
        <textarea value={policy} onChange={(e) => setPolicy(e.target.value)} rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" />
      </div>
      <Button onClick={() => onSave({ commission_percent: pct, cancellation_window_hours: hrs, refund_policy: policy })}>Salvar configurações</Button>
    </div>
  );
}
