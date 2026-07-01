import { Link } from "@tanstack/react-router";
import { useAuth } from "@/hooks/use-auth";
import { UserProfileMenu } from "@/components/livvo/user-profile-menu";
import { Bell } from "lucide-react";

export function ProHeader({ title }: { title?: string }) {
  const { isCompany } = useAuth();
  return (
    <header className="sticky top-0 z-30 -mx-4 md:-mx-8 border-b border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl px-4 md:px-8 h-14 flex items-center justify-between gap-3">
        <p className="text-sm font-bold tracking-tight truncate">{title ?? (isCompany ? "Livvo · Empresa" : "Livvo · Profissional")}</p>
        <div className="flex items-center gap-1.5">
          <Link to="/pro/notificacoes" className="p-2 rounded-lg hover:bg-muted text-muted-foreground" aria-label="Notificações">
            <Bell className="size-4" />
          </Link>
          <UserProfileMenu />
        </div>
      </div>
    </header>
  );
}
