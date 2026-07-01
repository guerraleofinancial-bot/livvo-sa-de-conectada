import { useEffect, useState } from "react";
import { X, Sparkles } from "lucide-react";
import { Link } from "@tanstack/react-router";

interface FirstVisitTipProps {
  id: string;
  title: string;
  message: string;
  articleSlug?: string;
}

/** Card dispensável que aparece apenas na primeira visita à tela. */
export function FirstVisitTip({ id, title, message, articleSlug }: FirstVisitTipProps) {
  const storageKey = `livvo:tip:${id}`;
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(storageKey)) setShow(true);
    } catch { /* noop */ }
  }, [storageKey]);

  function dismiss() {
    try { localStorage.setItem(storageKey, "1"); } catch { /* noop */ }
    setShow(false);
  }

  if (!show) return null;

  return (
    <div className="relative rounded-2xl border border-primary/20 bg-primary-soft/60 p-4 pr-10">
      <button
        onClick={dismiss}
        aria-label="Dispensar"
        className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground hover:bg-muted"
      >
        <X className="size-4" />
      </button>
      <div className="flex items-start gap-3">
        <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary text-primary-foreground">
          <Sparkles className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{message}</p>
          <div className="mt-2 flex items-center gap-3">
            <button onClick={dismiss} className="text-xs font-semibold text-primary">Entendi</button>
            {articleSlug && (
              <Link to="/ajuda/$slug" params={{ slug: articleSlug }} className="text-xs font-semibold text-muted-foreground hover:text-foreground">
                Saiba mais
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
