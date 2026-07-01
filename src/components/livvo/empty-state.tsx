import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  tone = "primary",
  className = "",
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: ReactNode;
  tone?: "primary" | "muted" | "warning";
  className?: string;
}) {
  const iconCls = tone === "warning"
    ? "bg-warning-soft text-warning"
    : tone === "muted"
    ? "bg-muted text-muted-foreground"
    : "bg-primary-soft text-primary";
  return (
    <div className={`livvo-card border-dashed p-8 text-center space-y-3 ${className}`}>
      <div className={`size-14 mx-auto rounded-2xl grid place-items-center ${iconCls}`}>
        <Icon className="size-6" />
      </div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        {description && <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">{description}</p>}
      </div>
      {action && <div className="pt-1">{action}</div>}
    </div>
  );
}

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`livvo-shimmer rounded-md ${className}`} aria-hidden="true" />;
}

export function SkeletonRow() {
  return (
    <div className="livvo-card p-3 flex items-center gap-3">
      <Skeleton className="size-12 rounded-xl" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-2.5 w-20" />
      </div>
    </div>
  );
}
