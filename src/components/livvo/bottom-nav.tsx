import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Calendar, MessageSquare, User } from "lucide-react";

type NavItem = { to: string; label: string; icon: typeof Home; exact?: boolean };

const items: NavItem[] = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/buscar", label: "Buscar", icon: Search },
  { to: "/app/consultas", label: "Consultas", icon: Calendar },
  { to: "/app/mensagens", label: "Mensagens", icon: MessageSquare },
  { to: "/app/perfil", label: "Perfil", icon: User },
];

export function PatientBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        {items.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          return (
            <Link
              key={it.to}
              to={it.to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-semibold transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <it.icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}

const proItems = [
  { to: "/pro", label: "Painel", icon: Home, exact: true },
  { to: "/pro/agenda", label: "Agenda", icon: Calendar },
  { to: "/pro/pacientes", label: "Pacientes", icon: User },
  { to: "/app/mensagens", label: "Chat", icon: MessageSquare },
  { to: "/app/perfil", label: "Perfil", icon: User },
] as const;

export function ProBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-4 py-3">
        {proItems.map((it) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          return (
            <Link
              key={`${it.to}-${it.label}`}
              to={it.to}
              className={`flex flex-1 flex-col items-center gap-1 rounded-lg py-1 text-[10px] font-semibold transition-colors ${
                active ? "text-primary" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <it.icon className="size-5" strokeWidth={active ? 2.5 : 2} />
              <span>{it.label}</span>
            </Link>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
