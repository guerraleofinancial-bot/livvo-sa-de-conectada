import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShieldCheck, ShieldOff } from "lucide-react";
import { toast } from "sonner";

type Row = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  roles: string[];
  created_at: string | null;
  last_sign_in_at: string | null;
  role_exception: boolean;
};

export function MultiRoleAccountsTab() {
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-multi-role"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("admin_multi_role_accounts");
      if (error) throw error;
      return (data ?? []) as Row[];
    },
  });

  const toggleException = useMutation({
    mutationFn: async ({ user_id, flag }: { user_id: string; flag: boolean }) => {
      const { error } = await supabase.rpc("admin_set_role_exception", { _user_id: user_id, _flag: flag });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Status atualizado");
      qc.invalidateQueries({ queryKey: ["admin-multi-role"] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border bg-primary-soft/40 p-4 text-xs text-foreground/80">
        <p className="font-semibold text-foreground mb-1">Regra atual: uma conta = uma identidade</p>
        <p>
          Contas antigas (anteriores à data de corte) são mantidas para preservar compatibilidade. Novas contas não podem receber um segundo papel.
          Marque uma conta como <strong>exceção</strong> apenas para casos autorizados (ex.: profissional que também atua como paciente na mesma conta durante o piloto).
          Quando o assistente de migração estiver disponível, essas contas poderão ser divididas preservando histórico.
        </p>
      </div>

      {isLoading && (
        <div className="grid place-items-center py-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
      )}

      {!isLoading && (!data || data.length === 0) && (
        <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma conta com múltiplos papéis. ✅
        </div>
      )}

      <div className="space-y-2">
        {(data ?? []).map((row) => (
          <div key={row.user_id} className="rounded-2xl border border-border bg-card p-4 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="text-sm font-semibold truncate">{row.full_name || "—"}</p>
                {row.role_exception && (
                  <Badge variant="secondary" className="text-[10px]"><ShieldCheck className="size-3 mr-1" /> Exceção</Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground truncate">{row.email}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {row.roles.map((r) => (
                  <span key={r} className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-muted text-foreground/80">{r}</span>
                ))}
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                Criada em {row.created_at ? new Date(row.created_at).toLocaleDateString("pt-BR") : "—"}
                {" · "}
                Último acesso {row.last_sign_in_at ? new Date(row.last_sign_in_at).toLocaleDateString("pt-BR") : "nunca"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                size="sm"
                variant={row.role_exception ? "outline" : "secondary"}
                disabled={toggleException.isPending}
                onClick={() => toggleException.mutate({ user_id: row.user_id, flag: !row.role_exception })}
              >
                {row.role_exception ? (<><ShieldOff className="size-3.5 mr-1" /> Remover exceção</>) : (<><ShieldCheck className="size-3.5 mr-1" /> Marcar como exceção</>)}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
