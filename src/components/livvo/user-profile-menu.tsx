import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, HelpCircle, LogOut, Settings, User as UserIcon } from "lucide-react";
import { toast } from "sonner";

function initialsFrom(name?: string | null, email?: string | null) {
  const base = (name ?? email ?? "?").trim();
  if (!base) return "?";
  const parts = base.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return base.slice(0, 2).toUpperCase();
}

export function UserProfileMenu({ variant = "light" }: { variant?: "light" | "dark" }) {
  const { user, isPatient, isProfessional, isCompany, isAdmin, isAdminMaster, isSuperAdmin } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [fullName, setFullName] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    if (!user) { setFullName(null); return; }
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle().then(({ data }) => {
      if (alive) setFullName((data?.full_name as string | undefined) ?? null);
    });
    return () => { alive = false; };
  }, [user?.id]);

  const roleLabel = isSuperAdmin
    ? "Super Admin"
    : isAdminMaster
    ? "Admin Master"
    : isAdmin
    ? "Admin"
    : isCompany
    ? "Empresa"
    : isProfessional
    ? "Profissional"
    : isPatient
    ? "Paciente"
    : "Usuário";

  const displayName = fullName ?? user?.email?.split("@")[0] ?? "Minha conta";
  const shortName = displayName.split(" ")[0];
  const initials = initialsFrom(fullName, user?.email);

  async function signOut() {
    try {
      await qc.cancelQueries();
      qc.clear();
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      try { localStorage.clear(); } catch { /* noop */ }
      toast.success("Você saiu da sua conta.");
      navigate({ to: "/", replace: true });
    } catch (e) {
      try { localStorage.clear(); } catch { /* noop */ }
      toast.error("Não foi possível encerrar a sessão. Sessão local limpa.");
      navigate({ to: "/auth", replace: true });
    }
  }

  const triggerClasses =
    variant === "dark"
      ? "flex items-center gap-2 pl-1 pr-2 py-1 rounded-full border border-white/20 hover:bg-white/10 text-white transition"
      : "flex items-center gap-2 pl-1 pr-2.5 py-1 rounded-full border border-border hover:bg-muted transition";

  if (!user) {
    return (
      <Link
        to="/auth"
        className="inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-semibold hover:bg-muted"
      >
        Entrar
      </Link>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger aria-label="Abrir menu do perfil" className={triggerClasses}>
        <span className="size-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-[11px] font-bold">
          {initials}
        </span>
        <span className="hidden sm:inline text-xs font-semibold max-w-[110px] truncate">{shortName}</span>
        <ChevronDown className="size-3.5 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel className="py-2">
          <div className="flex items-center gap-2.5">
            <span className="size-9 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">
              {initials}
            </span>
            <div className="min-w-0">
              <p className="text-sm font-semibold truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
              <span className="mt-1 inline-flex items-center rounded-full bg-primary/10 text-primary px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
                {roleLabel}
              </span>
            </div>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link to="/app/perfil"><UserIcon className="size-4 mr-2" /> Meu perfil</Link>
        </DropdownMenuItem>
        {isAdmin && (
          <DropdownMenuItem asChild>
            <Link to="/admin"><Settings className="size-4 mr-2" /> Painel administrativo</Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuItem asChild>
          <Link to="/ajuda"><HelpCircle className="size-4 mr-2" /> Central de Ajuda</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
          <LogOut className="size-4 mr-2" /> Sair
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
