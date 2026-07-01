import { ShieldCheck } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface VerifiedBadgeProps {
  council?: string | null;
  number?: string | null;
  uf?: string | null;
  size?: "sm" | "md";
  className?: string;
  /** Quando true, o selo é apenas visual (sem popover). */
  static?: boolean;
}

/**
 * Selo "Parceiro Verificado Livvo" — usado em cards de busca e perfis públicos.
 * Apenas para profissionais/empresas com documentação analisada e aprovada.
 * Clique/toque abre um popover explicando o significado.
 */
export function VerifiedBadge({
  council,
  number,
  uf,
  size = "sm",
  className,
  static: isStatic = false,
}: VerifiedBadgeProps) {
  const councilText = [council, number, uf].filter(Boolean).join(" ");
  const isSm = size === "sm";

  const badgeClasses = cn(
    "inline-flex items-center gap-1 rounded-full bg-health-soft text-health border border-health/30 font-semibold whitespace-nowrap transition",
    !isStatic && "hover:bg-health/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-health/40 cursor-help",
    isSm ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs",
    className,
  );

  const label = (
    <>
      <ShieldCheck className={isSm ? "size-3" : "size-3.5"} />
      {isSm ? "Verificado" : "Parceiro Verificado Livvo"}
    </>
  );

  if (isStatic) {
    return (
      <span
        title={councilText ? `Parceiro Verificado Livvo · ${councilText}` : "Parceiro Verificado Livvo"}
        className={badgeClasses}
      >
        {label}
      </span>
    );
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Saiba mais sobre o selo Parceiro Verificado Livvo"
          onClick={(e) => e.stopPropagation()}
          className={badgeClasses}
        >
          {label}
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        className="w-80 p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          <div className="size-9 shrink-0 rounded-xl bg-health-soft text-health grid place-items-center">
            <ShieldCheck className="size-5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold">Parceiro Verificado Livvo</p>
            {councilText && (
              <p className="text-[11px] text-muted-foreground font-mono mt-0.5">{councilText}</p>
            )}
          </div>
        </div>

        <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
          A equipe da Livvo analisou a documentação deste profissional ou empresa e confirmou que possui registro
          ativo e compatível com os serviços oferecidos.
        </p>

        <div className="mt-3 flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wide text-muted-foreground font-semibold">
            Verificação manual
          </span>
          <Link
            to="/verificacao"
            className="inline-flex items-center rounded-full bg-primary px-3 py-1.5 text-[11px] font-bold text-primary-foreground hover:bg-primary/90 transition"
          >
            Saiba mais
          </Link>
        </div>
      </PopoverContent>
    </Popover>
  );
}
