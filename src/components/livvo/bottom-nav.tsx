import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Search, Calendar, Heart, User, Wallet, Users, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

type NavItem = { to: string; label: string; icon: ComponentType<{ className?: string; strokeWidth?: number }>; exact?: boolean };

const patientItems: NavItem[] = [
  { to: "/app", label: "Início", icon: Home, exact: true },
  { to: "/app/buscar", label: "Buscar", icon: Search },
  { to: "/app/consultas", label: "Consultas", icon: Calendar },
  { to: "/app/favoritos", label: "Favoritos", icon: Heart },
  { to: "/app/perfil", label: "Perfil", icon: User },
];

const proItems: NavItem[] = [
  { to: "/pro", label: "Painel", icon: Home, exact: true },
  { to: "/pro/agenda", label: "Agenda", icon: Calendar },
  { to: "/pro/crm", label: "CRM", icon: Users },
  { to: "/pro/impulsionar", label: "Impulsionar", icon: Sparkles },
  { to: "/pro/financeiro", label: "Financeiro", icon: Wallet },
];

function Nav({ items }: { items: NavItem[] }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-card/90 backdrop-blur-xl">
      <div className="mx-auto flex max-w-md items-center justify-between px-2 py-3">
        {items.map((it, i) => {
          const active = it.exact ? pathname === it.to : pathname.startsWith(it.to);
          return (
            <Link
              key={`${it.to}-${i}`}
              to={it.to as never}
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

export function PatientBottomNav() { return <Nav items={patientItems} />; }
export function ProBottomNav() { return <Nav items={proItems} />; }
