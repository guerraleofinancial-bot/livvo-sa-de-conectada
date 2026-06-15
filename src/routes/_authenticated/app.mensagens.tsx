import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/app/mensagens")({
  component: Mensagens,
});

function Mensagens() {
  const { user } = useAuth();

  const { data: appts } = useQuery({
    queryKey: ["chat-list", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, scheduled_at, status, professional_id, patient_id, professionals(profiles:profiles!professionals_profile_fkey(full_name, avatar_url), specialties(name))")
        .or(`patient_id.eq.${user!.id},professional_id.eq.${user!.id}`)
        .in("status", ["agendada", "confirmada", "em_andamento", "realizada"])
        .order("scheduled_at", { ascending: false });
      return data ?? [];
    },
  });

  return (
    <div className="px-5 pt-10 space-y-5 livvo-fade-in">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Mensagens</h1>
        <p className="text-sm text-muted-foreground mt-1">Conversas das suas consultas</p>
      </header>

      <div className="space-y-2">
        {(appts ?? []).map((row) => {
          const a = row as typeof row & { professionals: { profiles: { full_name?: string; avatar_url?: string } | null; specialties: { name?: string } | null } | null };
          return (
            <Link key={a.id} to="/app/chat/$id" params={{ id: a.id }} className="flex items-center gap-3 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-colors">
              <div className="size-12 rounded-full bg-primary-soft grid place-items-center text-primary font-bold border border-border overflow-hidden shrink-0">
                {a.professionals?.profiles?.avatar_url ? <img src={a.professionals.profiles.avatar_url} className="size-full object-cover" alt="" /> : (a.professionals?.profiles?.full_name ?? "?").charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{a.professionals?.profiles?.full_name}</p>
                <p className="text-xs text-muted-foreground truncate">{a.professionals?.specialties?.name} · {new Date(a.scheduled_at).toLocaleDateString("pt-BR")}</p>
              </div>
              <MessageSquare className="size-4 text-muted-foreground shrink-0" />
            </Link>
          );
        })}
        {appts && appts.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <MessageSquare className="size-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">Nenhuma conversa ainda</p>
            <p className="text-xs text-muted-foreground mt-1">As conversas são liberadas após agendar uma consulta.</p>
          </div>
        )}
      </div>
    </div>
  );
}
