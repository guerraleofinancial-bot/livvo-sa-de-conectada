import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  Children,
  isValidElement,
  cloneElement,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type HTMLAttributes,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * HorizontalScroller — Livvo premium horizontal list primitive.
 *
 * Recursos:
 *  - Gradient fade nas extremidades quando há mais conteúdo
 *  - Setas discretas no desktop (hover-reveal)
 *  - Snap scroll + swipe natural no mobile
 *  - Roda do mouse / trackpad convertido em scroll horizontal
 *  - Preview do próximo item por padrão (mostra "peek")
 *  - Auto-centraliza item marcado com data-active="true"
 *  - Bleed lateral (negative margin) para tocar as bordas do container pai
 */
export interface HorizontalScrollerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  /** gap em px entre itens */
  gap?: number;
  /** habilita snap encaixe */
  snap?: "start" | "center" | "none";
  /** ativa "bleed" lateral (-mx-5 px-5) para colar às bordas do card pai */
  bleed?: boolean;
  /** exibe setas no desktop */
  showArrows?: boolean;
  /** converte scroll vertical do mouse em horizontal */
  wheelToHorizontal?: boolean;
  /** distância (px) por clique de seta */
  scrollStep?: number;
  /** classe extra no track (viewport rolável) */
  trackClassName?: string;
}

export function HorizontalScroller({
  children,
  gap = 12,
  snap = "start",
  bleed = true,
  showArrows = true,
  wheelToHorizontal = true,
  scrollStep,
  trackClassName = "",
  className = "",
  ...rest
}: HorizontalScrollerProps) {
  const trackRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const compute = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const left = el.scrollLeft;
    const max = el.scrollWidth - el.clientWidth;
    setCanLeft(left > 4);
    setCanRight(left < max - 4);
  }, []);

  useLayoutEffect(() => {
    compute();
  });

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const onScroll = () => compute();
    el.addEventListener("scroll", onScroll, { passive: true });
    const ro = new ResizeObserver(compute);
    ro.observe(el);
    Array.from(el.children).forEach((c) => ro.observe(c));
    window.addEventListener("resize", compute);
    return () => {
      el.removeEventListener("scroll", onScroll);
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [compute, children]);

  // Wheel → horizontal (desktop apenas, respeitando movimento diagonal)
  useEffect(() => {
    if (!wheelToHorizontal) return;
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      // só sequestra se realmente há overflow horizontal
      if (el.scrollWidth <= el.clientWidth) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [wheelToHorizontal]);

  // Auto center do item ativo
  useEffect(() => {
    const el = trackRef.current;
    if (!el) return;
    const active = el.querySelector<HTMLElement>('[data-active="true"]');
    if (!active) return;
    const target =
      active.offsetLeft - el.clientWidth / 2 + active.clientWidth / 2;
    el.scrollTo({ left: Math.max(0, target), behavior: "smooth" });
  }, [children]);

  const scrollBy = (dir: 1 | -1) => {
    const el = trackRef.current;
    if (!el) return;
    const step = scrollStep ?? Math.max(240, Math.round(el.clientWidth * 0.8));
    el.scrollBy({ left: dir * step, behavior: "smooth" });
  };

  const snapItem =
    snap === "center" ? "snap-center" : snap === "start" ? "snap-start" : "";

  const items = Children.map(children, (child, idx) => {
    if (!isValidElement(child)) return child;
    const el = child as ReactElement<{ className?: string; style?: React.CSSProperties }>;
    const existing = el.props.className ?? "";
    return cloneElement(el, {
      className: `${existing} shrink-0 ${snapItem}`.trim(),
      style: {
        ...(el.props.style ?? {}),
        marginLeft: idx === 0 ? 0 : gap,
      },
    });
  });

  return (
    <div
      className={`relative group/scroller ${bleed ? "-mx-5" : ""} ${className}`}
      {...rest}
    >
      {/* Fade esquerdo */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-10 bg-gradient-to-r from-background to-transparent transition-opacity duration-200 ${
          canLeft ? "opacity-100" : "opacity-0"
        } ${bleed ? "" : "rounded-l-2xl"}`}
      />
      {/* Fade direito */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent transition-opacity duration-200 ${
          canRight ? "opacity-100" : "opacity-0"
        } ${bleed ? "" : "rounded-r-2xl"}`}
      />

      {/* Setas — só desktop, aparecem quando há overflow */}
      {showArrows && (
        <>
          <button
            type="button"
            aria-label="Rolar para a esquerda"
            onClick={() => scrollBy(-1)}
            tabIndex={canLeft ? 0 : -1}
            className={`hidden md:grid absolute left-2 top-1/2 -translate-y-1/2 z-20 size-9 place-items-center rounded-full border border-border bg-card/95 backdrop-blur shadow-lg text-foreground transition-all duration-200 hover:scale-105 hover:bg-card ${
              canLeft
                ? "opacity-0 group-hover/scroller:opacity-100 focus-visible:opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Rolar para a direita"
            onClick={() => scrollBy(1)}
            tabIndex={canRight ? 0 : -1}
            className={`hidden md:grid absolute right-2 top-1/2 -translate-y-1/2 z-20 size-9 place-items-center rounded-full border border-border bg-card/95 backdrop-blur shadow-lg text-foreground transition-all duration-200 hover:scale-105 hover:bg-card ${
              canRight
                ? "opacity-0 group-hover/scroller:opacity-100 focus-visible:opacity-100"
                : "opacity-0 pointer-events-none"
            }`}
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}

      {/* Track */}
      <div
        ref={trackRef}
        className={`flex overflow-x-auto scrollbar-hide scroll-smooth ${
          snap !== "none" ? "snap-x snap-mandatory" : ""
        } ${bleed ? "px-5" : ""} ${trackClassName}`}
        style={{ scrollPaddingLeft: bleed ? 20 : 0, scrollPaddingRight: bleed ? 20 : 0 }}
      >
        {items}
        {/* peek final: pequeno spacer para dar respiro no snap */}
        <div aria-hidden className="shrink-0 w-2" />
      </div>
    </div>
  );
}

export default HorizontalScroller;
