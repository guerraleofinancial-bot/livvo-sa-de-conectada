import { createFileRoute, Link, useNavigate, redirect } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Users, Stethoscope, Calendar, Wallet, ShieldCheck, CheckCircle2, XCircle, Ban, Database, LogOut, Building2, Percent, MessageSquareWarning, Send, Sparkles, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { setProfessionalStatus, setCompanyStatus, setUserSuspended, seedDemoData, updatePlatformSettings, setReviewStatus, createPayoutBatch, markPayoutBatchPaid, setDemoMode, purgeDemoData } from "@/lib/livvo/admin.functions";
import { verifyProfessionalCouncil } from "@/lib/livvo/onboarding-pro.functions";
import { adminAdsRevenueReport, adminListSubscriptions, cancelSubscription } from "@/lib/livvo/ads.functions";
import { toast } from "sonner";
import { AdminGrowthCharts } from "@/components/livvo/admin/AdminGrowthCharts";
import { SettingsCenter } from "@/components/livvo/admin/SettingsCenter";
import { AuditLogsTab } from "@/components/livvo/admin/AuditLogsTab";
import { MultiRoleAccountsTab } from "@/components/livvo/admin/MultiRoleAccountsTab";
import { FileText, UsersRound } from "lucide-react";


export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
    const [{ data: roles }, { data: grant }] = await Promise.all([
      supabase.from("user_roles").select("role").eq("user_id", data.user.id),
      supabase.from("admin_grants").select("level").eq("user_id", data.user.id).maybeSingle(),
    ]);
    const isAdmin = grant !== null || (roles ?? []).some((r) => r.role === "admin");
    if (!isAdmin) throw redirect({ to: "/app" });
  },
  component: AdminPanel,
});

type Tab = "overview" | "pros" | "companies" | "finance" | "ads" | "reviews" | "users" | "identidades" | "settings" | "audit";

function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("overview");

  const setStatus = useServerFn(setProfessionalStatus);
  const setCompany = useServerFn(setCompanyStatus);
  const setSusp = useServerFn(setUserSuspended);
  const seed = useServerFn(seedDemoData);
  const toggleDemo = useServerFn(setDemoMode);
  const purgeDemo = useServerFn(purgeDemoData);
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
    queryFn: async () => (await supabase.from("professionals").select("*, profiles:profiles!professionals_profile_fkey(full_name, email), specialties(name)").in("status", ["pendente","em_analise"])).data ?? [],
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

  const demoMode = Boolean((settings as { demo_mode?: boolean } | null | undefined)?.demo_mode);
  const toggleDemoMut = useMutation({
    mutationFn: async (enabled: boolean) => toggleDemo({ data: { enabled, purge: true } }),
    onSuccess: (r) => {
      toast.success(r.current
        ? "Modo Demonstração ATIVADO — dados fictícios podem aparecer."
        : `Modo Demonstração DESATIVADO${r.purged ? ` — ${r.purged} contas demo removidas` : ""}.`);
      qc.invalidateQueries();
    },
    onError: (e) => toast.error((e as Error).message),
  });
  const purgeDemoMut = useMutation({
    mutationFn: async () => purgeDemo(),
    onSuccess: (r) => { toast.success(`Purga concluída: ${r.purged} contas demo removidas.`); qc.invalidateQueries(); },
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
    { id: "identidades", label: "Identidades", icon: UsersRound },
    { id: "settings", label: "Configurações", icon: Percent },
    { id: "audit", label: "Auditoria", icon: FileText },

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
          <div className="flex gap-2 items-center">
            <span className={`hidden sm:inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide px-2 py-1 rounded-full border ${demoMode ? "border-amber-400/60 bg-amber-50 text-amber-700" : "border-emerald-400/50 bg-emerald-50 text-emerald-700"}`}>
              <span className={`size-1.5 rounded-full ${demoMode ? "bg-amber-500" : "bg-emerald-500"}`} />
              {demoMode ? "Modo Demo ativo" : "Dados reais"}
            </span>
            {demoMode && (
              <Button size="sm" variant="outline" onClick={() => seedNow.mutate()} disabled={seedNow.isPending}>
                <Database className="size-4 mr-1" /> {seedNow.isPending ? "..." : "Popular demo"}
              </Button>
            )}
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
            <AdminGrowthCharts />
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
                const p = row as typeof row & { profiles: { full_name?: string; email?: string } | null; specialties: { name?: string } | null; council?: string | null; council_number?: string | null; council_state?: string | null; council_document_url?: string | null; council_verified_at?: string | null };
                const councilText = [p.council, p.council_number, p.council_state].filter(Boolean).join(" ");
                return (
                  <div key={p.id} className="p-4 rounded-2xl bg-card border border-border space-y-3">
                    <div className="flex items-center gap-4 flex-wrap">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{p.profiles?.full_name}</p>
                        <p className="text-xs text-muted-foreground truncate">{p.specialties?.name} · {p.profiles?.email}</p>
                      </div>
                      <Button size="sm" variant="outline" className="text-destructive" onClick={async () => { const reason = prompt("Motivo da rejeição?") ?? ""; await setStatus({ data: { professionalId: p.id, status: "rejeitado" } }); toast.success("Rejeitado"); void reason; qc.invalidateQueries({ queryKey: ["pending-pros"] }); }}><XCircle className="size-4 mr-1" /> Rejeitar</Button>
                      <Button size="sm" disabled={!p.council_verified_at} title={!p.council_verified_at ? "Verifique o conselho antes de aprovar" : ""} onClick={async () => { await setStatus({ data: { professionalId: p.id, status: "aprovado" } }); toast.success("Aprovado"); qc.invalidateQueries({ queryKey: ["pending-pros"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); }}><CheckCircle2 className="size-4 mr-1" /> Aprovar</Button>
                    </div>
                    <div className="rounded-xl bg-muted/50 border border-border p-3 flex items-center gap-3 flex-wrap text-xs">
                      <ShieldCheck className={`size-4 ${p.council_verified_at ? "text-health" : "text-warning"}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold">Conselho: {councilText || <span className="text-muted-foreground">não informado</span>}</p>
                        <p className="text-muted-foreground">Status: {p.council_verified_at ? "verificado" : "aguardando análise"}</p>
                      </div>
                      {p.council_document_url && (
                        <Button size="sm" variant="outline" onClick={async () => {
                          const { data } = await supabase.storage.from("provider-documents").createSignedUrl(p.council_document_url!, 60 * 10);
                          if (data?.signedUrl) window.open(data.signedUrl, "_blank");
                          else toast.error("Documento não encontrado");
                        }}>Ver documento</Button>
                      )}
                      {!p.council_verified_at ? (
                        <Button size="sm" disabled={!councilText || !p.council_document_url} onClick={async () => { await verifyCouncil({ data: { professionalId: p.id, approved: true } }); toast.success("Conselho verificado"); qc.invalidateQueries({ queryKey: ["pending-pros"] }); }}>Verificar conselho</Button>
                      ) : (
                        <Button size="sm" variant="outline" onClick={async () => { const reason = prompt("Motivo da revogação?") ?? ""; await verifyCouncil({ data: { professionalId: p.id, approved: false, reason } }); toast.success("Verificação revogada"); qc.invalidateQueries({ queryKey: ["pending-pros"] }); }}>Revogar</Button>
                      )}
                    </div>
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
            <p className="text-xs text-muted-foreground mb-3">
              O status da conta é calculado automaticamente conforme o papel (paciente, profissional, empresa) e o estágio de aprovação. Use "Suspender" ou "Bloquear" para intervenção manual.
            </p>
            <div className="rounded-2xl bg-card border border-border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 text-xs uppercase font-bold text-muted-foreground">
                  <tr><th className="text-left p-3">Nome</th><th className="text-left p-3 hidden md:table-cell">Email</th><th className="text-left p-3">Status da conta</th><th></th></tr>
                </thead>
                <tbody>
                  {(users ?? []).map((u) => {
                    const s = (u as { account_status?: string }).account_status ?? "paciente";
                    const label: Record<string, string> = {
                      paciente: "Paciente",
                      profissional_pendente: "Profissional pendente",
                      profissional_aprovado: "Profissional aprovado",
                      empresa_pendente: "Empresa pendente",
                      empresa_aprovada: "Empresa aprovada",
                      suspenso: "Suspenso",
                      bloqueado: "Bloqueado",
                    };
                    const tone =
                      s === "bloqueado" ? "bg-destructive/10 text-destructive"
                      : s === "suspenso" ? "bg-warning-soft text-warning-foreground"
                      : s.endsWith("_aprovado") || s.endsWith("_aprovada") ? "bg-health-soft text-health"
                      : s.endsWith("_pendente") ? "bg-warning-soft text-warning-foreground"
                      : "bg-muted text-foreground/80";
                    const set = async (status: string, reason?: string | null) => {
                      const { error } = await supabase.rpc("admin_set_account_status", { _user_id: u.id, _status: status as never, _reason: reason ?? undefined });

                      if (error) return toast.error(error.message);
                      toast.success("Status atualizado");
                      qc.invalidateQueries({ queryKey: ["all-profiles"] });
                    };
                    return (
                      <tr key={u.id} className="border-t border-border">
                        <td className="p-3 font-semibold">{u.full_name}</td>
                        <td className="p-3 text-muted-foreground hidden md:table-cell">{u.email}</td>
                        <td className="p-3"><span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${tone}`}>{label[s] ?? s}</span></td>
                        <td className="p-3 text-right space-x-1 whitespace-nowrap">
                          {s === "suspenso" || s === "bloqueado" ? (
                            <Button size="sm" variant="ghost" onClick={() => set("paciente")}>Reativar</Button>
                          ) : (
                            <>
                              <Button size="sm" variant="ghost" onClick={() => { const r = prompt("Motivo da suspensão (opcional):") ?? undefined; set("suspenso", r); }}>Suspender</Button>
                              <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { const r = prompt("Motivo do bloqueio (opcional):") ?? undefined; set("bloqueado", r); }}><Ban className="size-4 mr-1" />Bloquear</Button>
                            </>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}


        {tab === "settings" && settings && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold">Central de configurações</h2>

            {/* Modo Demonstração */}
            <div className={`rounded-2xl border p-5 ${demoMode ? "border-amber-300 bg-amber-50/60" : "border-border bg-card"}`}>
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`size-2 rounded-full ${demoMode ? "bg-amber-500" : "bg-emerald-500"}`} />
                    <h3 className="text-sm font-bold">Modo Demonstração</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded ${demoMode ? "bg-amber-200/70 text-amber-800" : "bg-emerald-100 text-emerald-700"}`}>
                      {demoMode ? "Ativado" : "Desativado"}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground max-w-2xl">
                    Quando ativado, a plataforma pode exibir dados fictícios (contas <code>@livvo.demo</code>) para testes e apresentações.
                    <strong> Não usar em produção.</strong> Ao desativar, todas as contas demo são removidas automaticamente e a plataforma passa a exibir somente dados reais aprovados.
                  </p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <Button
                    size="sm"
                    variant={demoMode ? "outline" : "default"}
                    onClick={() => {
                      if (demoMode) {
                        if (!confirm("Desativar o Modo Demonstração vai remover TODAS as contas @livvo.demo (profissionais, clínicas e pacientes de teste). Continuar?")) return;
                      }
                      toggleDemoMut.mutate(!demoMode);
                    }}
                    disabled={toggleDemoMut.isPending}
                  >
                    {toggleDemoMut.isPending ? "..." : demoMode ? "Desativar modo demo" : "Ativar modo demo"}
                  </Button>
                  {demoMode && (
                    <button
                      onClick={() => { if (confirm("Remover apenas as contas demo, mantendo o modo ativo?")) purgeDemoMut.mutate(); }}
                      disabled={purgeDemoMut.isPending}
                      className="text-[11px] text-muted-foreground underline underline-offset-2 hover:text-foreground"
                    >
                      {purgeDemoMut.isPending ? "purgando..." : "Purgar dados demo agora"}
                    </button>
                  )}
                </div>
              </div>
            </div>

            <SettingsCenter
              initial={settings as never}
              onSave={async (v) => { await updSettings({ data: v }); qc.invalidateQueries({ queryKey: ["settings"] }); }}
            />
          </section>
        )}


        {tab === "identidades" && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold">Contas com múltiplos papéis</h2>
            <MultiRoleAccountsTab />
          </section>
        )}

        {tab === "audit" && (
          <section className="space-y-4">
            <h2 className="text-sm font-bold">Logs de auditoria</h2>
            <AuditLogsTab />
          </section>
        )}

      </main>
    </div>
  );
}

