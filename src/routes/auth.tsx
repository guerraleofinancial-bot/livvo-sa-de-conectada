import { createFileRoute, redirect, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HeartPulse, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { recordClientAudit } from "@/lib/livvo/audit.functions";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).default("login").catch("login"),
  role: z.enum(["paciente", "profissional", "empresa"]).default("paciente").catch("paciente"),
});

type SignupRole = "paciente" | "profissional" | "empresa";

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/app" });
  },
  head: () => ({ meta: [{ title: "Entrar — Livvo" }] }),
  component: AuthPage,
});

function AuthPage() {
  const { mode, role } = Route.useSearch();
  const navigate = useNavigate();
  const [tab, setTab] = useState<"login" | "signup">(mode);
  const [chosenRole, setChosenRole] = useState<SignupRole>(role);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error("Falha no login", { description: error.message });
    toast.success("Bem-vindo de volta!");
    navigate({ to: "/app" });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    if (password.length < 6) return toast.error("A senha deve ter pelo menos 6 caracteres.");
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/app`,
        data: { full_name: fullName, phone, role: chosenRole },
      },
    });
    setLoading(false);
    if (error) return toast.error("Falha no cadastro", { description: error.message });
    toast.success("Conta criada!", { description: "Bem-vindo à Livvo." });
    if (chosenRole === "profissional") navigate({ to: "/onboarding-pro" });
    else if (chosenRole === "empresa") navigate({ to: "/onboarding-empresa" });
    else navigate({ to: "/app" });
  }

  async function handleGoogle() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: `${window.location.origin}/app` });
    if (r.error) toast.error("Falha no login com Google");
  }

  return (
    <div className="min-h-screen bg-surface">
      <div className="mx-auto flex min-h-screen max-w-md flex-col px-5 py-8">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-4" /> Voltar
        </Link>

        <div className="mb-8 flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-elevated)]">
            <HeartPulse className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Livvo</p>
            <h1 className="text-xl font-bold tracking-tight">Saúde Conectada</h1>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
          <div className="mb-6 grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
            <button onClick={() => setTab("login")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${tab === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Entrar</button>
            <button onClick={() => setTab("signup")} className={`rounded-lg px-3 py-2 text-sm font-semibold transition ${tab === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>Cadastrar</button>
          </div>

          {tab === "signup" && (
            <div className="mb-5">
              <p className="mb-2 text-xs font-semibold text-muted-foreground">Como deseja usar a Livvo?</p>
              <div className="grid grid-cols-1 gap-2">
                {([
                  { id: "paciente", label: "Paciente", desc: "Buscar e agendar atendimentos" },
                  { id: "profissional", label: "Profissional da Saúde", desc: "Receber pacientes e gerir agenda" },
                  { id: "empresa", label: "Clínica ou Empresa", desc: "Gerenciar unidades e equipe" },
                ] as const).map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setChosenRole(r.id)}
                    className={`rounded-xl border-2 p-3 text-left text-sm font-semibold transition ${
                      chosenRole === r.id ? "border-primary bg-primary-soft text-primary" : "border-border bg-card text-foreground hover:border-primary/30"
                    }`}
                  >
                    {r.label}
                    <p className="mt-0.5 text-[11px] font-normal text-muted-foreground">{r.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={tab === "login" ? handleLogin : handleSignup} className="space-y-4">
            {tab === "signup" && (
              <>
                <div>
                  <Label htmlFor="name">Nome completo</Label>
                  <Input id="name" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Maria Silva" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 99999-0000" />
                </div>
              </>
            )}
            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
            </div>
            <div>
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" autoComplete={tab === "login" ? "current-password" : "new-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
            </div>

            <Button type="submit" className="w-full rounded-xl" size="lg" disabled={loading}>
              {loading ? "Aguarde..." : tab === "login" ? "Entrar" : "Criar conta"}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
            <div className="h-px flex-1 bg-border" /> ou <div className="h-px flex-1 bg-border" />
          </div>

          <Button type="button" variant="outline" className="w-full rounded-xl" size="lg" onClick={handleGoogle}>
            <svg className="size-4" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
            Continuar com Google
          </Button>
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          Ao continuar, você concorda com nossos Termos e Política de Privacidade (LGPD).
        </p>
      </div>
    </div>
  );
}
