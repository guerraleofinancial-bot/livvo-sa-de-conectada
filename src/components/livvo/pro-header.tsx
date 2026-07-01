import { useNavigate } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { LogOut, User as UserIcon, Bell, ChevronDown, HelpCircle, Megaphone } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

export function ProHeader({ title }: { title?: string }) {
  const navigate = useNavigate();
  const { user, isCompany } = useAuth();

  async function signOut() {
    await supabase.auth.signOut();
    try { localStorage.clear(); } catch { /* noop */ }
    toast.success("Sessão encerrada");
    navigate({ to: "/", replace: true });
  }

  const initial = (user?.email ?? "?").slice(0, 1).toUpperCase();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto max-w-md px-5 h-14 flex items-center justify-between">
        <p className="text-sm font-bold tracking-tight truncate">{title ?? (isCompany ? "Livvo · Empresa" : "Livvo · Profissional")}</p>
        <div className="flex items-center gap-1">
          <Link to="/pro/notificacoes" className="p-2 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Notificações">
            <Bell className="size-4" />
          </Link>
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-lg hover:bg-muted">
              <span className="size-7 rounded-full bg-primary text-primary-foreground grid place-items-center text-xs font-bold">{initial}</span>
              <ChevronDown className="size-3 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/pro/marketing"><Megaphone className="size-4 mr-2" /> Marketing</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/app/perfil"><UserIcon className="size-4 mr-2" /> Meu perfil</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/ajuda"><HelpCircle className="size-4 mr-2" /> Central de Ajuda</Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
                <LogOut className="size-4 mr-2" /> Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
