import { Link } from "@tanstack/react-router";
import { HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { ReactNode } from "react";

const navLinks = [
  { to: "/como-funciona", label: "Como funciona" },
  { to: "/para-parceiros", label: "Para parceiros" },
  { to: "/para-empresas", label: "Para empresas" },
  { to: "/planos-e-precos", label: "Planos e preços" },
] as const;

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3.5">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground shadow-sm">
            <HeartPulse className="size-5" />
          </div>
          <span className="truncate text-lg font-bold tracking-tight">Livvo</span>
        </Link>
        <nav className="hidden items-center gap-7 text-sm font-medium text-muted-foreground md:flex">
          {navLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              activeProps={{ className: "text-foreground" }}
              className="hover:text-foreground"
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link to="/auth" className="hidden sm:inline-flex">
            <Button variant="ghost" size="sm">Entrar</Button>
          </Link>
          <Link to="/auth" search={{ mode: "signup", role: "paciente" }}>
            <Button size="sm" className="rounded-lg">Criar conta</Button>
          </Link>
        </div>
      </div>
    </header>
  );
}

export function MarketingFooter() {
  return (
    <footer className="border-t border-border/60 bg-card/40 py-10">
      <div className="mx-auto grid max-w-6xl gap-8 px-5 md:grid-cols-4">
        <div>
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground">
              <HeartPulse className="size-4" />
            </div>
            <span className="font-bold tracking-tight">Livvo</span>
          </Link>
          <p className="mt-3 text-xs text-muted-foreground">
            Marketplace de saúde presencial. Consultas, exames e procedimentos em um só lugar.
          </p>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pacientes</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/auth" search={{ mode: "signup", role: "paciente" }} className="hover:text-primary">Criar conta</Link></li>
            <li><Link to="/como-funciona" className="hover:text-primary">Como funciona</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Parceiros</p>
          <ul className="space-y-2 text-sm">
            <li><Link to="/para-parceiros" className="hover:text-primary">Para parceiros</Link></li>
            <li><Link to="/para-empresas" className="hover:text-primary">Para empresas</Link></li>
            <li><Link to="/planos-e-precos" className="hover:text-primary">Planos e preços</Link></li>
          </ul>
        </div>
        <div>
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Legal</p>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Termos de uso</li>
            <li>Política de privacidade</li>
            <li>LGPD</li>
          </ul>
        </div>
      </div>
      <p className="mx-auto mt-8 max-w-6xl px-5 text-xs text-muted-foreground">
        © {new Date().getFullYear()} Livvo Saúde Conectada — Marketplace de saúde presencial.
      </p>
    </footer>
  );
}

export function MarketingShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-surface text-foreground">
      <MarketingNav />
      <main>{children}</main>
      <MarketingFooter />
    </div>
  );
}
