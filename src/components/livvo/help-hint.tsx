import { HelpCircle } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Link } from "@tanstack/react-router";

interface HelpHintProps {
  text: string;
  articleSlug?: string;
  className?: string;
}

/** Ícone (?) que abre um popover explicativo curto, sem sair da tela. */
export function HelpHint({ text, articleSlug, className }: HelpHintProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label="Ajuda"
          className={`inline-flex size-4 items-center justify-center rounded-full text-muted-foreground hover:text-primary ${className ?? ""}`}
        >
          <HelpCircle className="size-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent side="top" className="w-64 text-xs leading-relaxed">
        <p>{text}</p>
        {articleSlug && (
          <Link
            to="/ajuda/$slug"
            params={{ slug: articleSlug }}
            className="mt-2 inline-block text-[11px] font-semibold text-primary hover:underline"
          >
            Saiba mais →
          </Link>
        )}
      </PopoverContent>
    </Popover>
  );
}
