import { createFileRoute, Outlet, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProBottomNav } from "@/components/livvo/bottom-nav";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, ShieldAlert, Clock, HeartPulse } from "lucide-react";
import { useEffect } from "react";

export const Route = createFileRoute("/_authenticated/pro")({
  component: ProLayout,
});

function ProLayout() {
  const { user, isProfessional, isAdmin, loading } = useAuth();
  const navigate = useNavigate();

  const { data: pro, isLoading: proLoading } = useQuery({
    queryKey: ["pro-status", user?.id],
    enabled: !!user && (isProfessional || isAdmin),
    queryFn: async () => {
      const { data } = await supabase
        .from("professionals").select("id, status").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (loading) return;
    if (!user) return;
    // Patient trying to access pro area → bounce to /app
    if (!isProfessional && !isAdmin) {
      navigate({ to: "/app", replace: true });
    }
  }, [loading, user, isProfessional, isAdmin, navigate]);

  if (loading || (isProfessional && proLoading)) {
    return <div className="min-h-screen grid place-items-center"><Loader2 className="size-6 animate-spin text-muted-foreground" /></div>;
  }

  if (!isProfessional && !isAdmin) return null;

  // Professional registered but no profissionals row yet → finish onboarding
  if (isProfessional && !pro) {
    return <PendingScreen kind="onboarding" />;
  }

  // Professional with row but not approved yet → blocked area, only show pending
  if (isProfessional && !isAdmin && pro && pro.status !== "aprovado") {
    return <PendingScreen kind="review" status={pro.status} />;
  }

  return (
    <div className="min-h-screen bg-surface pb-24">
      <div className="mx-auto max-w-md">
        <Outlet />
      </div>
      <ProBottomNav />
    </div>
  );
}

function PendingScreen({ kind, status }: { kind: "onboarding" | "review"; status?: string }) {
  return (
    <div className="min-h-screen bg-surface px-5 py-10">
      <div className="mx-auto max-w-md space-y-6">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <HeartPulse className="size-6" />
          </div>
          <div>
            <p className="text-xs font-semibold text-muted-foreground">Livvo Parceiros</p>
            <h1 className="text-xl font-bold tracking-tight">Área profissional</h1>
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 text-center shadow-[var(--shadow-card)]">
          {kind === "onboarding" ? (
            <>
              <ShieldAlert className="size-12 mx-auto text-warning mb-3" />
              <h2 className="text-lg font-bold">Conclua seu cadastro profissional</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Para acessar CRM, agenda, financeiro e perfil público, envie sua especialidade,
                conselho profissional e documentação obrigatória.
              </p>
              <Link to="/onboarding-pro" className="mt-5 inline-flex w-full justify-center rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground">
                Iniciar cadastro
              </Link>
            </>
          ) : (
            <>
              <Clock className="size-12 mx-auto text-warning mb-3" />
              <h2 className="text-lg font-bold">Cadastro {status === "pendente" ? "em análise" : status}</h2>
              <p className="mt-2 text-sm text-muted-foreground">
                Sua conta está aguardando validação documental pela equipe Livvo.
                Você receberá uma notificação assim que for aprovado.
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                Acesso ao CRM, agenda, financeiro, perfil público, destaques patrocinados e
                premium é liberado apenas após aprovação.
              </p>
              <Link to="/onboarding-pro" className="mt-5 inline-flex w-full justify-center rounded-xl border border-border bg-card px-4 py-3 text-sm font-semibold">
                Revisar dados enviados
              </Link>
            </>
          )}
        </div>

        <Link to="/app" className="block text-center text-xs font-semibold text-muted-foreground">
          ← Voltar para a área do paciente
        </Link>
      </div>
    </div>
  );
}
