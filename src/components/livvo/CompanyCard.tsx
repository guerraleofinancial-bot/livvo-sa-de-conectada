import { Link } from "@tanstack/react-router";
import { Building2, MapPin, ArrowRight, Sparkles } from "lucide-react";

export interface CompanyCardData {
  id: string;
  name: string | null;
  type?: string | null;
  city?: string | null;
  state?: string | null;
  logoUrl?: string | null;
  isSponsored?: boolean;
}

export function CompanyCard({ data }: { data: CompanyCardData }) {
  const location = [data.city, data.state].filter(Boolean).join(" · ");
  return (
    <Link
      to="/app/empresa/$id"
      params={{ id: data.id }}
      className="group relative flex w-56 shrink-0 flex-col gap-3 rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-lifted)]"
    >
      {data.isSponsored && (
        <span className="livvo-chip-sponsored absolute -top-2 left-4">
          <Sparkles className="size-3" /> Patrocinado
        </span>
      )}
      <div className="grid size-12 place-items-center rounded-xl bg-health-soft text-health overflow-hidden ring-1 ring-border/60">
        {data.logoUrl ? <img src={data.logoUrl} className="size-full object-cover" alt="" /> : <Building2 className="size-6" />}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-foreground">{data.name ?? "—"}</p>
        {data.type && (
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{data.type}</p>
        )}
        {location && (
          <p className="mt-1 flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            <MapPin className="size-3" /> {location}
          </p>
        )}
      </div>
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
        Explorar <ArrowRight className="size-3" />
      </span>
    </Link>
  );
}
