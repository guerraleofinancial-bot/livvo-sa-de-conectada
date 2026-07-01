import { Link } from "@tanstack/react-router";
import { Star, MapPin, Calendar, ShieldCheck, Crown, Sparkles, ArrowRight } from "lucide-react";
import { VerifiedBadge } from "./VerifiedBadge";
import { LivvoBadge } from "./ui";

export interface ProfessionalCardData {
  id: string;
  fullName: string | null;
  avatarUrl?: string | null;
  specialty?: string | null;
  city?: string | null;
  state?: string | null;
  price?: number | null;
  rating?: number | null;
  ratingCount?: number | null;
  council?: string | null;
  councilNumber?: string | null;
  councilState?: string | null;
  isVerified?: boolean;
  isPremium?: boolean;
  isSponsored?: boolean;
  sponsoredLabel?: string;
  agendaOpen?: boolean;
  insurances?: string[] | null;
  /** Derived trust/quality badges (all optional; caller decides based on real data). */
  isTopRated?: boolean;
  isNewPartner?: boolean;
  isHotToday?: boolean;
  isFastResponder?: boolean;
}


interface Props {
  data: ProfessionalCardData;
  variant?: "featured" | "row" | "compact";
  onClick?: () => void;
  showActions?: boolean;
}

/** Premium marketplace card — reusable across search, home, favorites. */
export function ProfessionalCard({ data, variant = "featured", onClick, showActions = true }: Props) {
  const initial = (data.fullName ?? "?").trim().charAt(0).toUpperCase();
  const rating = data.rating != null ? Number(data.rating) : null;
  const ratingCount = data.ratingCount ?? 0;
  const price = data.price != null ? Number(data.price) : null;
  const location = [data.city, data.state].filter(Boolean).join(" · ");

  const wrapperBase =
    "group relative block rounded-2xl bg-card border border-border/70 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-lifted)]";
  const wrapperSponsored = data.isSponsored ? "ring-1 ring-amber-300/60" : "";

  return (
    <Link
      to="/app/profissional/$id"
      params={{ id: data.id }}
      onClick={onClick}
      className={`${wrapperBase} ${wrapperSponsored} ${variant === "compact" ? "p-3" : "p-4 sm:p-5"}`}
    >
      {data.isSponsored && (
        <span className="livvo-chip-sponsored absolute -top-2 left-4">
          <Sparkles className="size-3" /> {data.sponsoredLabel ?? "Patrocinado"}
        </span>
      )}

      <div className={`grid ${variant === "compact" ? "grid-cols-[56px_minmax(0,1fr)]" : "grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[88px_minmax(0,1fr)]"} gap-4`}>
        {/* Avatar */}
        <div className="relative">
          <div
            className={`${variant === "compact" ? "size-14" : "size-[72px] sm:size-[88px]"} shrink-0 rounded-2xl bg-primary-soft ring-1 ring-border/70 overflow-hidden grid place-items-center text-primary font-bold text-xl`}
          >
            {data.avatarUrl ? (
              <img src={data.avatarUrl} alt="" className="size-full object-cover" loading="lazy" />
            ) : (
              initial
            )}
          </div>
          {data.isPremium && (
            <span className="absolute -bottom-1 -right-1 grid size-6 place-items-center rounded-full bg-primary text-primary-foreground ring-2 ring-card shadow-sm">
              <Crown className="size-3" />
            </span>
          )}
        </div>

        {/* Body */}
        <div className="min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="truncate text-[15px] font-semibold text-foreground">{data.fullName ?? "—"}</h3>
              <p className="mt-0.5 truncate text-[13px] text-muted-foreground">{data.specialty ?? "—"}</p>
            </div>
            {rating != null && ratingCount > 0 && (
              <div className="flex shrink-0 items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[11px] font-semibold text-amber-500">
                <Star className="size-3 fill-current" strokeWidth={0} />
                <span>{rating.toFixed(1)}</span>
                <span className="text-muted-foreground font-medium">({ratingCount})</span>
              </div>
            )}
          </div>

          {/* Chips */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            {data.isVerified && (
              <VerifiedBadge council={data.council} number={data.councilNumber} uf={data.councilState} />
            )}
            {data.isTopRated && <LivvoBadge variant="top" label="Top avaliado" />}
            {data.isHotToday && <LivvoBadge variant="hot" label="Em alta hoje" />}
            {data.isFastResponder && <LivvoBadge variant="fast" label="Responde rápido" />}
            {data.isNewPartner && <LivvoBadge variant="new" label="Novo parceiro" />}
            {location && (
              <span className="livvo-chip">
                <MapPin className="size-3" />
                {location}
              </span>
            )}
            {data.agendaOpen && !data.isHotToday && (
              <span className="livvo-chip-health">
                <Calendar className="size-3" />
                Agenda aberta
              </span>
            )}
            {data.insurances && data.insurances.length > 0 && (
              <span className="livvo-chip-primary">
                <ShieldCheck className="size-3" />
                {data.insurances.length === 1 ? data.insurances[0] : `${data.insurances.length} convênios`}
              </span>
            )}
          </div>

          {/* Footer */}
          {variant !== "compact" && (
            <div className="mt-4 flex items-end justify-between gap-3 border-t border-border/60 pt-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">A partir de</p>
                <p className="font-mono text-base font-bold text-foreground">
                  {price != null ? `R$ ${price.toFixed(0)}` : "Sob consulta"}
                </p>
              </div>
              {showActions && (
                <div className="flex items-center gap-2">
                  <span className="hidden rounded-xl border border-border px-3 py-2 text-xs font-semibold text-foreground transition-colors sm:inline-flex sm:items-center group-hover:border-primary/40 group-hover:text-primary">
                    Ver perfil
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-xl bg-primary px-3.5 py-2 text-xs font-semibold text-primary-foreground shadow-sm">
                    Agendar <ArrowRight className="size-3.5" />
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}

export function ProfessionalCardSkeleton({ variant = "featured" }: { variant?: "featured" | "compact" }) {
  return (
    <div className={`rounded-2xl border border-border/70 bg-card ${variant === "compact" ? "p-3" : "p-4 sm:p-5"}`}>
      <div className={`grid ${variant === "compact" ? "grid-cols-[56px_minmax(0,1fr)]" : "grid-cols-[72px_minmax(0,1fr)] sm:grid-cols-[88px_minmax(0,1fr)]"} gap-4`}>
        <div className={`${variant === "compact" ? "size-14" : "size-[72px] sm:size-[88px]"} livvo-skeleton rounded-2xl`} />
        <div className="min-w-0 space-y-2">
          <div className="livvo-skeleton h-4 w-2/3" />
          <div className="livvo-skeleton h-3 w-1/2" />
          <div className="flex gap-1.5 pt-1">
            <div className="livvo-skeleton h-5 w-20 rounded-full" />
            <div className="livvo-skeleton h-5 w-16 rounded-full" />
          </div>
          {variant !== "compact" && (
            <div className="flex justify-between pt-2">
              <div className="livvo-skeleton h-6 w-20" />
              <div className="livvo-skeleton h-8 w-24 rounded-xl" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
