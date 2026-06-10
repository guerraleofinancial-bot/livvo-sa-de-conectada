import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState, useEffect } from "react";
import { LogOut, FileText, ShieldCheck, Stethoscope, ChevronRight, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { claimFirstAdmin } from "@/lib/livvo/admin.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/app/perfil")({
  component: Perfil,
});

function Perfil() {
  const { user, roles } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();
  const claim = useServerFn(claimFirstAdmin);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("profiles").select("*").eq("id", user!.id).single()).data,
  });

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  useEffect(() => {
    if (profile) { setName(profile.full_name ?? ""); setPhone(profile.phone ?? ""); setCity(profile.city ?? ""); }
  }, [profile]);

  const save = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("profiles").update({ full_name: name, phone, city }).eq("id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Perfil atualizado"); qc.invalidateQueries({ queryKey: ["profile"] }); },
  });

  async function signOut() {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  async function makeAdmin() {
    try {
      await claim();
      toast.success("Você agora é administrador!");
      qc.invalidateQueries();
      navigate({ to: "/admin" });
    } catch (e) {
      toast.error((e as Error).message);
    }
  }

  return (
    <div className="px-5 pt-10 space-y-5 livvo-fade-in">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Meu perfil</h1>
        <p className="text-sm text-muted-foreground mt-1">{user?.email}</p>
        <div className="flex gap-1 mt-2 flex-wrap">
          {roles.map((r) => (
            <span key={r} className="px-2 py-0.5 rounded-full bg-primary-soft text-primary text-[10px] font-bold uppercase">{r}</span>
          ))}
        </div>
      </header>

      <section className="rounded-2xl bg-card border border-border p-4 space-y-4">
        <div>
          <Label htmlFor="n">Nome</Label>
          <Input id="n" value={name} onChange={(e) => setName(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="p">Telefone</Label>
          <Input id="p" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </div>
        <div>
          <Label htmlFor="c">Cidade</Label>
          <Input id="c" value={city} onChange={(e) => setCity(e.target.value)} />
        </div>
        <Button className="w-full rounded-xl" onClick={() => save.mutate()} disabled={save.isPending}>Salvar</Button>
      </section>

      <section className="rounded-2xl bg-card border border-border divide-y divide-border">
        <Link to="/app/documentos" className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
          <FileText className="size-5 text-primary" />
          <div className="flex-1"><p className="text-sm font-semibold">Documentos de saúde</p><p className="text-xs text-muted-foreground">Exames e receitas</p></div>
          <ChevronRight className="size-4 text-muted-foreground" />
        </Link>
        {!roles.includes("profissional") && (
          <Link to="/onboarding-pro" className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
            <Stethoscope className="size-5 text-health" />
            <div className="flex-1"><p className="text-sm font-semibold">Quero ser profissional</p><p className="text-xs text-muted-foreground">Cadastre seu perfil profissional</p></div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        )}
        {roles.includes("profissional") && (
          <Link to="/pro" className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
            <Stethoscope className="size-5 text-health" />
            <div className="flex-1"><p className="text-sm font-semibold">Painel profissional</p><p className="text-xs text-muted-foreground">Agenda e pacientes</p></div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        )}
        {roles.includes("admin") && (
          <Link to="/admin" className="flex items-center gap-3 p-4 hover:bg-muted/40 transition-colors">
            <ShieldCheck className="size-5 text-primary" />
            <div className="flex-1"><p className="text-sm font-semibold">Painel administrativo</p></div>
            <ChevronRight className="size-4 text-muted-foreground" />
          </Link>
        )}
      </section>

      {!roles.includes("admin") && (
        <button onClick={makeAdmin} className="w-full text-xs text-muted-foreground hover:text-foreground py-2">
          Tornar-me administrador (apenas se ainda não houver um)
        </button>
      )}

      <Button variant="outline" className="w-full rounded-xl gap-2 text-destructive" onClick={signOut}>
        <LogOut className="size-4" /> Sair
      </Button>
    </div>
  );
}
