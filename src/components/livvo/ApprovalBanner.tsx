import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, ShieldCheck, FileText, Clock } from "lucide-react";

type ProRow = {
  id: string;
  status: string | null;
  display_name: string | null;
  bio: string | null;
  council: string | null;
  council_number: string | null;
  council_document_url: string | null;
  council_verified_at: string | null;
  council_rejection_reason: string | null;
  onboarding_completed_at: string | null;
};

export function statusLabel(s?: string | null) {
  switch (s) {
    case "aprovado": return "Aprovado";
    case "pendente": return "Em análise";
    case "em_analise": return "Em análise";
    case "rejeitado": return "Rejeitado";
    case "documentacao_vencida": return "Documentação vencida";
    default: return "Cadastro incompleto";
  }
}

export function ApprovalBanner() {
  const { user } = useAuth();

  const { data: pro } = useQuery({
    queryKey: ["approval-pro", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase
        .from("professionals")
        .select("id,status,display_name,bio,council,council_number,council_document_url,council_verified_at,council_rejection_reason,onboarding_completed_at")
        .eq("id", user!.id)
        .maybeSingle()).data as ProRow | null,
  });

  const { data: hours } = useQuery({
    queryKey: ["approval-hours", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("professional_business_hours").select("id").eq("professional_id", user!.id).limit(1)).data ?? [],
  });

  const { data: services } = useQuery({
    queryKey: ["approval-services", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("services").select("id").eq("professional_id", user!.id).limit(1)).data ?? [],
  });

  if (!pro) {
    return (
      <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4">
        <p className="text-sm font-semibold">Conclua seu cadastro profissional</p>
        <p className="text-xs text-muted-foreground mt-1">
          Você já pode conhecer o painel. Finalize o cadastro para começar a atender pacientes reais.
        </p>
        <Link to="/onboarding-pro" className="mt-3 inline-flex rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
          Iniciar cadastro
        </Link>
      </div>
    );
  }

  if (pro.status === "aprovado" && pro.council_verified_at) return null;

  const items = [
    { key: "perfil", label: "Dados do perfil", done: !!(pro.display_name && pro.bio) },
    { key: "servicos", label: "Serviços cadastrados", done: (services?.length ?? 0) > 0 },
    { key: "horarios", label: "Horários de atendimento", done: (hours?.length ?? 0) > 0 },
    { key: "conselho", label: "Conselho profissional", done: !!(pro.council && pro.council_number) },
    { key: "documentos", label: "Documentação enviada", done: !!pro.council_document_url },
    { key: "envio", label: "Cadastro enviado para análise", done: !!pro.onboarding_completed_at },
    { key: "aprovacao", label: "Aprovação Livvo", done: pro.status === "aprovado" && !!pro.council_verified_at },
  ];
  const total = items.length;
  const done = items.filter((i) => i.done).length;
  const pct = Math.round((done / total) * 100);

  const isRejected = pro.status === "rejeitado";
  const isExpired = pro.status === "documentacao_vencida";

  return (
    <div className="rounded-2xl border border-warning/30 bg-warning/10 p-4 space-y-3">
      <div className="flex items-start gap-3">
        <div className="size-9 rounded-xl bg-warning/20 text-warning grid place-items-center shrink-0">
          {isRejected ? <FileText className="size-4" /> : <Clock className="size-4" />}
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold">Modo demonstração · {statusLabel(pro.status)}</p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Seu cadastro ainda está em análise. Você pode conhecer e configurar sua conta, mas só poderá receber pacientes após aprovação documental.
          </p>
          {isRejected && pro.council_rejection_reason && (
            <p className="text-xs text-destructive mt-2"><strong>Motivo:</strong> {pro.council_rejection_reason}</p>
          )}
          {isExpired && (
            <p className="text-xs text-destructive mt-2">Sua documentação venceu. Reenvie para reativar o atendimento.</p>
          )}
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between text-xs mb-1.5">
          <span className="font-semibold">Checklist de aprovação</span>
          <span className="font-mono text-muted-foreground">{done}/{total} · {pct}%</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>

      <ul className="space-y-1.5">
        {items.map((i) => (
          <li key={i.key} className="flex items-center gap-2 text-xs">
            {i.done ? <CheckCircle2 className="size-4 text-health" /> : <Circle className="size-4 text-muted-foreground" />}
            <span className={i.done ? "text-foreground" : "text-muted-foreground"}>{i.label}</span>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <Link to="/onboarding-pro" className="inline-flex flex-1 justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
          <ShieldCheck className="size-3.5 mr-1.5" />
          {pro.council_document_url ? "Revisar documentação" : "Enviar documentação"}
        </Link>
      </div>
    </div>
  );
}

export function LockedFeatureNotice({ title = "Função disponível após aprovação" }: { title?: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-center">
      <ShieldCheck className="size-6 mx-auto text-muted-foreground mb-2" />
      <p className="text-sm font-semibold">{title}</p>
      <p className="text-xs text-muted-foreground mt-1">
        Para proteger pacientes e parceiros, esta função será liberada após aprovação da documentação profissional.
      </p>
      <Link to="/onboarding-pro" className="mt-3 inline-flex rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground">
        Enviar documentação
      </Link>
    </div>
  );
}
