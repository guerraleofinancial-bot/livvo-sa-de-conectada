import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Stethoscope } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/onboarding-pro")({
  component: Onboarding,
});

function Onboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: specs } = useQuery({
    queryKey: ["specs"],
    queryFn: async () => (await supabase.from("specialties").select("*").order("name")).data ?? [],
  });

  const [specId, setSpecId] = useState("");
  const [reg, setReg] = useState("");
  const [bio, setBio] = useState("");
  const [price, setPrice] = useState("250");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [street, setStreet] = useState("");
  const [modality, setModality] = useState<"presencial" | "telemedicina">("presencial");

  const submit = useMutation({
    mutationFn: async () => {
      // ensure role
      await supabase.from("user_roles").upsert({ user_id: user!.id, role: "profissional" }, { onConflict: "user_id,role" });
      const { error } = await supabase.from("professionals").upsert({
        id: user!.id,
        specialty_id: specId,
        professional_registry: reg,
        bio,
        consultation_price: Number(price),
        address_city: city,
        address_state: state,
        address_street: street,
        modality,
        status: "pendente",
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Cadastro enviado!", { description: "Aguarde a aprovação do administrador." }); navigate({ to: "/pro" }); },
    onError: (e) => toast.error("Erro", { description: (e as Error).message }),
  });

  return (
    <div className="min-h-screen bg-surface">
      <div className="max-w-md mx-auto px-5 py-8">
        <Link to="/app/perfil" className="inline-flex items-center gap-2 text-sm text-muted-foreground mb-6"><ArrowLeft className="size-4" /> Voltar</Link>
        <div className="flex items-center gap-3 mb-6">
          <div className="size-12 rounded-2xl bg-health text-white grid place-items-center"><Stethoscope className="size-6" /></div>
          <div>
            <h1 className="text-xl font-bold">Cadastro profissional</h1>
            <p className="text-sm text-muted-foreground">Complete seu perfil para começar a atender</p>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 space-y-4">
          <div>
            <Label>Especialidade</Label>
            <select value={specId} onChange={(e) => setSpecId(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm">
              <option value="">Selecione...</option>
              {(specs ?? []).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          <div>
            <Label>Registro profissional</Label>
            <Input value={reg} onChange={(e) => setReg(e.target.value)} placeholder="Ex.: CRM 123456 / SP" />
          </div>
          <div>
            <Label>Bio</Label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} placeholder="Conte sobre sua experiência..." />
          </div>
          <div>
            <Label>Valor da consulta (R$)</Label>
            <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} />
            <p className="mt-1 text-xs text-muted-foreground">Atendimentos presenciais. A Livvo é um marketplace de saúde presencial.</p>
          </div>

          <div><Label>Rua</Label><Input value={street} onChange={(e) => setStreet(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Cidade</Label><Input value={city} onChange={(e) => setCity(e.target.value)} /></div>
            <div><Label>UF</Label><Input maxLength={2} value={state} onChange={(e) => setState(e.target.value.toUpperCase())} /></div>
          </div>

          <Button onClick={() => submit.mutate()} disabled={!specId || !reg || submit.isPending} className="w-full rounded-xl" size="lg">
            {submit.isPending ? "Enviando..." : "Enviar para análise"}
          </Button>
          <p className="text-xs text-muted-foreground text-center">Seu perfil só aparecerá para pacientes após aprovação do administrador.</p>
        </div>
      </div>
    </div>
  );
}
