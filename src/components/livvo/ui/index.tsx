import { cn } from "@/lib/utils";
import { ShieldCheck, Crown, Sparkles, Star, Zap, TrendingUp, Clock, Award } from "lucide-react";
import type { ReactNode } from "react";

/** Unified header for any section (Home, Search, Landings). */
export function SectionHeader({
  eyebrow,
  title,
  subtitle,
  trailing,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex items-end justify-between gap-3", className)}>
      <div className="min-w-0">
        {eyebrow && <p className="livvo-eyebrow">{eyebrow}</p>}
        <h2 className="livvo-h2 mt-0.5 truncate">{title}</h2>
        {subtitle && <p className="livvo-subtle mt-0.5 line-clamp-1">{subtitle}</p>}
      </div>
      {trailing && <div className="shrink-0">{trailing}</div>}
    </div>
  );
}

/** Semantic empty state used across marketplace surfaces. */
export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-dashed border-border bg-card p-10 text-center",
        className,
      )}
    >
      {icon && (
        <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
          {icon}
        </div>
      )}
      <p className="mt-3 text-sm font-semibold text-foreground">{title}</p>
      {description && <p className="livvo-subtle mt-1">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

/** Skeleton block with shimmer. */
export function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("livvo-skeleton", className)} />;
}

/** KPI tile used in dashboards and hero rows. */
export function KpiTile({
  label,
  value,
  hint,
  icon,
  tone = "neutral",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: "neutral" | "primary" | "health" | "warning";
}) {
  const toneMap = {
    neutral: "bg-card border-border/70",
    primary: "bg-primary-soft border-primary/15",
    health: "bg-health-soft border-health/15",
    warning: "bg-warning-soft border-warning/20",
  } as const;
  return (
    <div className={cn("rounded-2xl border p-4 shadow-[var(--shadow-soft)]", toneMap[tone])}>
      <div className="flex items-center justify-between">
        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon && <div className="text-muted-foreground/70">{icon}</div>}
      </div>
      <p className="mt-2 text-xl font-semibold tracking-tight text-foreground">{value}</p>
      {hint && <p className="mt-1 text-[11px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Unified LivvoBadge used to communicate trust/quality. */
type BadgeVariant =
  | "verified"
  | "premium"
  | "sponsored"
  | "top"
  | "fast"
  | "new"
  | "hot"
  | "neutral"
  | "health";

export function LivvoBadge({
  variant = "neutral",
  label,
  icon,
  className,
}: {
  variant?: BadgeVariant;
  label: string;
  icon?: ReactNode;
  className?: string;
}) {
  const map: Record<BadgeVariant, { classes: string; icon: ReactNode }> = {
    verified: {
      classes: "bg-health-soft text-health border-health/20",
      icon: <ShieldCheck className="size-3" />,
    },
    premium: {
      classes: "bg-primary text-primary-foreground border-primary/30",
      icon: <Crown className="size-3" />,
    },
    sponsored: {
      classes: "border-amber-300/70 text-amber-800 dark:text-amber-200",
      icon: <Sparkles className="size-3" />,
    },
    top: {
      classes: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <Star className="size-3 fill-current" />,
    },
    fast: {
      classes: "bg-primary-soft text-primary border-primary/15",
      icon: <Zap className="size-3" />,
    },
    new: {
      classes: "bg-blue-50 text-blue-700 border-blue-200",
      icon: <Award className="size-3" />,
    },
    hot: {
      classes: "bg-rose-50 text-rose-700 border-rose-200",
      icon: <TrendingUp className="size-3" />,
    },
    neutral: {
      classes: "bg-card text-muted-foreground border-border",
      icon: <Clock className="size-3" />,
    },
    health: {
      classes: "bg-health-soft text-health border-health/20",
      icon: <ShieldCheck className="size-3" />,
    },
  };
  const sponsoredBg =
    variant === "sponsored"
      ? { background: "linear-gradient(135deg, hsl(45 95% 92%), hsl(38 95% 88%))" }
      : undefined;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10.5px] font-semibold",
        map[variant].classes,
        className,
      )}
      style={sponsoredBg}
    >
      {icon ?? map[variant].icon}
      {label}
    </span>
  );
}

/** Trust footer — global reassurance strip. */
export function TrustStrip({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-border/70 bg-card p-4 shadow-[var(--shadow-soft)]",
        className,
      )}
    >
      <div className="grid grid-cols-3 gap-3 text-center">
        <TrustItem
          icon={<ShieldCheck className="size-4" />}
          title="Parceiros verificados"
          desc="Conselho validado"
        />
        <TrustItem
          icon={<Award className="size-4" />}
          title="Pagamento seguro"
          desc="Criptografia SSL"
        />
        <TrustItem
          icon={<Sparkles className="size-4" />}
          title="Dados protegidos"
          desc="Conforme a LGPD"
        />
      </div>
    </div>
  );
}
function TrustItem({ icon, title, desc }: { icon: ReactNode; title: string; desc: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="grid size-9 place-items-center rounded-full bg-primary-soft text-primary">
        {icon}
      </div>
      <p className="text-[11px] font-semibold text-foreground">{title}</p>
      <p className="text-[10px] text-muted-foreground">{desc}</p>
    </div>
  );
}
