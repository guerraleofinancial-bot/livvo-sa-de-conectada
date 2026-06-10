import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Users, Stethoscope, Calendar, Wallet, ShieldCheck, CheckCircle2, XCircle, Ban, Database, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setProfessionalStatus, setUserSuspended, seedDemoData } from "@/lib/livvo/admin.functions";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminPanel,
});

function AdminPanel() {
  const { isAdmin, loading } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const setStatus = useServerFn(setProfessionalStatus);
  const setSusp = useServerFn(setUserSuspended);
  const seed = useServerFn(seedDemoData);

  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    enabled: isAdmin,
    queryFn: async () => {
      const [patients, pros, scheduled, done, revenue] = await Promise.all([
        supabase.from("user_roles").select("user_id", { count: "exact", head: true }).eq("role", "paciente"),
        supabase.from("professionals").select("id", { count: "exact", head: true }),
        supabase.from("appointments").select("id", { count: "exact", head: true }).in("status", ["agendada", "confirmada"]),
        supabase.from("appointments").select("id", { count: "exact", head: true }).eq("status", "realizada"),
        supabase.from("appointments").select("price").eq("status", "realizada"),
      ]);
      return {
        patients: patients.count ?? 0,
        pros: pros.count ?? 0,
        scheduled: scheduled.count ?? 0,
        done: done.count ?? 0,
        revenue: (revenue.data ?? []).reduce((s, a) => s + Number(a.price), 0),
      };
    },
  });

  const { data: pending } = useQuery({
    queryKey: ["pending-pros"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("professionals").select("*, profiles:id(full_name, email), specialties(name)").eq("status", "pendente").order("created_at", { ascending: false })).data ?? [],
  });

  const { data: users } = useQuery({
    queryKey: ["all-profiles"],
    enabled: isAdmin,
    queryFn: async () => (await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(20)).data ?? [],
  });

  const approve = useMutation({
    mutationFn: async (id: string) => setStatus({ data: { professionalId: id, status: "aprovado" } }),
    onSuccess: () => { toast.success("Profissional aprovado"); qc.invalidateQueries({ queryKey: ["pending-pros"] }); qc.invalidateQueries({ queryKey: ["admin-stats"] }); },
  });
  const reject = useMutation({
    mutationFn: async (id: string) => setStatus({ data: { professionalId: id, status: "rejeitado" } }),
    onSuccess: () => { toast.success("Profissional rejeitado"); qc.invalidateQueries({ queryKey: ["pending-pros"] }); },
  });
  const toggleSuspend = useMutation({
    mutationFn: async (v: { id: string; s: boolean }) => setSusp({ data: { userId: v.id, suspended: v.s } }),
    onSuccess: () => { toast.success("Usuário atualizado"); qc.invalidateQueries({ queryKey: ["all-profiles"] }); },
  });
  const seedNow = useMutation({
    mutationFn: async () => seed(),
    onSuccess: (r) => { toast.success(`Demo carregada: ${r.created} profissionais`); qc.invalidateQueries(); },
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

  return (
    <div className="min-h-screen bg-surface">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center"><ShieldCheck className="size-5" /></div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Admin</p>
              <h1 className="text-base font-bold">Livvo · Painel</h1>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={() => seedNow.mutate()} disabled={seedNow.isPending}><Database className="size-4 mr-1" /> {seedNow.isPending ? "Carregando..." : "Popular demo"}</Button>
            <Button size="sm" variant="ghost" onClick={signOut}><LogOut className="size-4" /></Button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-5 py-6 space-y-6">
        <section className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            { icon: Users, label: "Pacientes", value: stats?.patients ?? 0 },
            { icon: Stethoscope, label: "Profissionais", value: stats?.pros ?? 0 },
            { icon: Calendar, label: "Agendadas", value: stats?.scheduled ?? 0 },
            { icon: CheckCircle2, label: "Realizadas", value: stats?.done ?? 0 },
            { icon: Wallet, label: "Receita", value: `R$ ${(stats?.revenue ?? 0).toFixed(0)}` },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl bg-card border border-border p-4">
              <s.icon className="size-4 text-primary mb-2" />
              <p className="font-mono text-2xl font-bold">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </div>
          ))}
        </section>

        <section>
          <h2 className="text-sm font-bold mb-3">Aprovação de profissionais ({pending?.length ?? 0})</h2>
          <div className="space-y-2">
            {(pending ?? []).map((row) => {
              const p = row as typeof row & { profiles: { full_name?: string; email?: string } | null; specialties: { name?: string } | null };
              return (
                <div key={p.id} className="p-4 rounded-2xl bg-card border border-border flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.specialties?.name} · {p.professional_registry} · {p.profiles?.email}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => reject.mutate(p.id)} className="text-destructive"><XCircle className="size-4 mr-1" /> Rejeitar</Button>
                  <Button size="sm" onClick={() => approve.mutate(p.id)}><CheckCircle2 className="size-4 mr-1" /> Aprovar</Button>
                </div>
              );
            })}
            {pending && pending.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">Nenhuma solicitação pendente.</div>
            )}
          </div>
        </section>

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
                    <td className="p-3">
                      <span className={`px-2 py-0.5 text-[10px] uppercase font-bold rounded-full ${u.suspended ? "bg-destructive/10 text-destructive" : "bg-health-soft text-health"}`}>
                        {u.suspended ? "Suspenso" : "Ativo"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="ghost" onClick={() => toggleSuspend.mutate({ id: u.id, s: !u.suspended })}>
                        <Ban className="size-4 mr-1" /> {u.suspended ? "Reativar" : "Suspender"}
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  );
}
