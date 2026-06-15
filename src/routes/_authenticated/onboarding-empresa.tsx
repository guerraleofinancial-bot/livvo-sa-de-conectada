import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Building2, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding-empresa")({
  component: OnboardingEmpresa,
});

const TYPES = [
  { id: "clinica", label: "Clínica" },
  { id: "laboratorio", label: "Laboratório" },
  { id: "diagnostico", label: "Diagnóstico por imagem" },
  { id: "estetica", label: "Estética & bem-estar" },
  { id: "outros", label: "Outros" },
] as const;

function OnboardingEmpresa() {
  const { user, isCompany, loading } = useAuth();
  const navigate = useNavigate();
  const [legalName, setLegalName] = useState("");
  const [tradeName, setTradeName] = useState("");
  const [type, setType] = useState<(typeof TYPES)[number]["id"]>("clinica");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [existing, setExisting] = useState<{ id: string; status: string } | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("companies")
      .select("id, status")
      .eq("owner_id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setExisting(data);
      });
  }, [user]);

  // Ensure the role is empresa; if not, this page shouldn't be used.
  useEffect(() => {
    if (loading) return;
    if (user && !isCompany) {
      navigate({ to: "/app", replace: true });
    }
  }, [loading, user, isCompany, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    if (!legalName.trim()) return toast.error("Informe a razão social ou nome da empresa.");
    setSaving(true);
    const { error } = await supabase.from("companies").insert({
      owner_id: user.id,
      legal_name: legalName.trim(),
      trade_name: tradeName.trim() || null,
      type,
      phone: phone || null,
      address_city: city || null,
      address_state: state || null,
      description: description || null,
      status: "pendente",
    });
    setSaving(false);
    if (error) return toast.error("Não foi possível salvar", { description: error.message });
    toast.success("Cadastro enviado!", { description: "Sua empresa está pendente de aprovação." });
    navigate({ to: "/pro" });
  }

  if (existing) {
    return (
      <div className="mx-auto max-w-md p-6">
        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
          <div className="mx-auto mb-4 grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <ShieldCheck className="size-7" />
          </div>
          <h1 className="text-lg font-bold">Cadastro recebido</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Status atual: <span className="font-semibold">{existing.status}</span>.
            Você poderá completar documentação e cadastros após a aprovação.
          </p>
          <Button asChild className="mt-5 w-full rounded-xl" size="lg">
            <Link to="/pro">Ir para a área empresarial</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-5">
      <Link to="/app" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Pular por enquanto
      </Link>

      <div className="mb-6 flex items-center gap-3">
        <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
          <Building2 className="size-6" />
        </div>
        <div>
          <p className="text-xs font-semibold text-muted-foreground">Clínica ou Empresa</p>
          <h1 className="text-xl font-bold tracking-tight">Vamos te conhecer</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-[var(--shadow-card)]">
        <div>
          <Label htmlFor="legal">Razão social *</Label>
          <Input id="legal" required value={legalName} onChange={(e) => setLegalName(e.target.value)} placeholder="Ex: Clínica Vida LTDA" />
        </div>
        <div>
          <Label htmlFor="trade">Nome fantasia</Label>
          <Input id="trade" value={tradeName} onChange={(e) => setTradeName(e.target.value)} placeholder="Ex: Clínica Vida" />
        </div>

        <div>
          <Label>Tipo de operação</Label>
          <div className="mt-2 grid grid-cols-2 gap-2">
            {TYPES.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setType(t.id)}
                className={`rounded-xl border-2 p-2.5 text-xs font-semibold transition ${
                  type === t.id ? "border-primary bg-primary-soft text-primary" : "border-border text-foreground hover:border-primary/30"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="city">Cidade</Label>
            <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Paulo" />
          </div>
          <div>
            <Label htmlFor="state">UF</Label>
            <Input id="state" value={state} onChange={(e) => setState(e.target.value.toUpperCase().slice(0, 2))} placeholder="SP" />
          </div>
        </div>

        <div>
          <Label htmlFor="phone">Telefone</Label>
          <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(11) 4000-0000" />
        </div>

        <div>
          <Label htmlFor="desc">Sobre a empresa</Label>
          <Textarea id="desc" value={description} onChange={(e) => setDescription(e.target.value)} rows={3} placeholder="Conte resumidamente o que vocês oferecem (opcional)" />
        </div>

        <div className="rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground flex gap-2">
          <CheckCircle2 className="size-4 shrink-0 text-primary" />
          <span>Cadastro rápido. CNPJ e documentos serão solicitados após aprovação inicial.</span>
        </div>

        <Button type="submit" disabled={saving} className="w-full rounded-xl" size="lg">
          {saving ? "Enviando..." : "Enviar para aprovação"}
        </Button>
      </form>
    </div>
  );
}
