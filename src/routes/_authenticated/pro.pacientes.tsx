import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Users } from "lucide-react";

export const Route = createFileRoute("/_authenticated/pro/pacientes")({
  component: Pacientes,
});

function Pacientes() {
  const { user } = useAuth();

  const { data } = useQuery({
    queryKey: ["my-patients", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("appointments").select("patient_id, scheduled_at, status, profiles:patient_id(full_name, avatar_url, phone)").eq("professional_id", user!.id).order("scheduled_at", { ascending: false });
      const seen = new Set<string>();
      return (data ?? []).filter((a) => { if (seen.has(a.patient_id)) return false; seen.add(a.patient_id); return true; });
    },
  });

  return (
    <div className="px-5 pt-10 space-y-5 livvo-fade-in">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Meus pacientes</h1>
        <p className="text-sm text-muted-foreground mt-1">{data?.length ?? 0} {data?.length === 1 ? "paciente" : "pacientes"} atendidos</p>
      </header>

      <div className="space-y-2">
        {(data ?? []).map((row) => {
          const a = row as typeof row & { profiles: { full_name?: string; avatar_url?: string; phone?: string } | null };
          return (
            <div key={a.patient_id} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border">
              <div className="size-12 rounded-full bg-primary-soft text-primary grid place-items-center font-bold border border-border overflow-hidden shrink-0">
                {a.profiles?.avatar_url ? <img src={a.profiles.avatar_url} className="size-full object-cover" alt="" /> : (a.profiles?.full_name ?? "?").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{a.profiles?.full_name ?? "Paciente"}</p>
                <p className="text-xs text-muted-foreground">Última consulta: {new Date(a.scheduled_at).toLocaleDateString("pt-BR")}</p>
              </div>
            </div>
          );
        })}
        {data && data.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Users className="size-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Você ainda não atendeu nenhum paciente.</p>
          </div>
        )}
      </div>
    </div>
  );
}
