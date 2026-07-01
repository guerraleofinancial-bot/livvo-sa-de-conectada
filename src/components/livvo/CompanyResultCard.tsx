import { Link } from "@tanstack/react-router";
import { Building2, MapPin, Star, ArrowRight } from "lucide-react";

export interface CompanyRow {
  id: string;
  legal_name: string | null;
  trade_name: string | null;
  type: string | null;
  address_city: string | null;
  address_state: string | null;
  logo_url: string | null;
  slug?: string | null;
  description?: string | null;
  rating_average?: number | null;
  rating_count?: number | null;
}

/**
 * Card premium para uso em listas full-width (uma coluna mobile, 2 col desktop).
 * Diferente do CompanyCard compacto (usado em carrosséis).
 */
export function CompanyResultCard({ row }: { row: CompanyRow }) {
  const name = row.trade_name ?? row.legal_name ?? "—";
  const location = [row.address_city, row.address_state].filter(Boolean).join(" · ");
  const rating = Number(row.rating_average ?? 0);
  const count = Number(row.rating_count ?? 0);

  return (
    <Link
      to="/app/empresa/$id"
      params={{ id: row.id }}
      className="group flex gap-4 rounded-2xl border border-border/70 bg-card p-4 md:p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-lifted)]"
    >
      <div className="grid size-16 md:size-20 shrink-0 place-items-center rounded-2xl bg-health-soft text-health overflow-hidden ring-1 ring-border/60">
        {row.logo_url ? (
          <img src={row.logo_url} className="size-full object-cover" alt="" />
        ) : (
          <Building2 className="size-7 md:size-8" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-base md:text-[17px] font-semibold text-foreground">{name}</p>
            {row.type && (
              <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {row.type}
              </p>
            )}
          </div>
          {rating > 0 && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">
              <Star className="size-3 fill-current" /> {rating.toFixed(1)}
              {count > 0 && <span className="text-muted-foreground/70">({count})</span>}
            </span>
          )}
        </div>
        {location && (
          <p className="mt-1.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3.5" /> {location}
          </p>
        )}
        {row.description && (
          <p className="mt-2 line-clamp-2 text-[13px] text-muted-foreground/90">{row.description}</p>
        )}
        <span className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-primary opacity-70 group-hover:opacity-100">
          Ver perfil <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  );
}

export function CompanyResultCardSkeleton() {
  return (
    <div className="flex gap-4 rounded-2xl border border-border/70 bg-card p-4 md:p-5 animate-pulse">
      <div className="size-16 md:size-20 rounded-2xl bg-muted/50" />
      <div className="flex-1 space-y-2">
        <div className="h-4 w-2/3 rounded bg-muted/50" />
        <div className="h-3 w-1/3 rounded bg-muted/40" />
        <div className="h-3 w-full rounded bg-muted/30" />
      </div>
    </div>
  );
}
