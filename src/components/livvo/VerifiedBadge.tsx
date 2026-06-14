import { ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  council?: string | null;
  number?: string | null;
  uf?: string | null;
  size?: "sm" | "md";
  className?: string;
}

/**
 * Selo "Parceiro Verificado Livvo" — usado em cards de busca e perfis públicos.
 * Apenas para profissionais com `council_verified_at` validado pelo admin.
 */
export function VerifiedBadge({ council, number, uf, size = "sm", className }: VerifiedBadgeProps) {
  const text = [council, number, uf].filter(Boolean).join(" ");
  const isSm = size === "sm";
  return (
    <span
      title={text ? `Parceiro Verificado Livvo · ${text}` : "Parceiro Verificado Livvo"}
      className={cn(
        "inline-flex items-center gap-1 rounded-full bg-health-soft text-health border border-health/30 font-semibold whitespace-nowrap",
        isSm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
        className
      )}
    >
      <ShieldCheck className={isSm ? "size-3" : "size-3.5"} />
      {isSm ? "Verificado" : "Parceiro Verificado Livvo"}
    </span>
  );
}
