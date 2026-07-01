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
  type KeyboardEvent,
  type ReactElement,
  type ReactNode,
} from "react";

/**
 * HorizontalScroller — Livvo Design System primitive premium.
 *
 * • Setas persistentes (não hover-only) que aparecem/somem conforme overflow
 * • Fade lateral evidente (largura maior + gradient mais denso)
 * • Preview do próximo item (peek ~30%) — via scroll-padding + item spacing
 * • Snap + swipe natural (mobile) / arrows + wheel (desktop)
 * • Navegação por teclado ← → quando o scroller tem foco
 * • Auto-centraliza item marcado com data-active="true"
 * • Bleed lateral para colar às bordas do container pai
 */
export interface HorizontalScrollerProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  gap?: number;
  snap?: "start" | "center" | "none";
  bleed?: boolean;
  showArrows?: boolean;
  wheelToHorizontal?: boolean;
  scrollStep?: number;
  trackClassName?: string;
  /** aria-label do scroller (acessibilidade) */
  ariaLabel?: string;
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
  ariaLabel,
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

  useEffect(() => {
    if (!wheelToHorizontal) return;
    const el = trackRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (e.deltaY === 0) return;
      if (Math.abs(e.deltaY) < Math.abs(e.deltaX)) return;
      if (el.scrollWidth <= el.clientWidth) return;
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [wheelToHorizontal]);

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

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      scrollBy(1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      scrollBy(-1);
    }
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
      {/* Fade esquerdo — mais evidente */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 left-0 z-10 w-16 md:w-20 bg-gradient-to-r from-background via-background/85 to-transparent transition-opacity duration-300 ${
          canLeft ? "opacity-100" : "opacity-0"
        }`}
      />
      {/* Fade direito — mais evidente */}
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 z-10 w-20 md:w-28 bg-gradient-to-l from-background via-background/85 to-transparent transition-opacity duration-300 ${
          canRight ? "opacity-100" : "opacity-0"
        }`}
      />

      {showArrows && (
        <>
          <button
            type="button"
            aria-label="Rolar para a esquerda"
            onClick={() => scrollBy(-1)}
            tabIndex={canLeft ? 0 : -1}
            className={`hidden md:grid absolute left-2 top-1/2 -translate-y-1/2 z-20 size-10 place-items-center rounded-full border border-border/70 bg-card/95 backdrop-blur shadow-[0_6px_20px_-6px_rgba(0,0,0,0.15)] text-foreground transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:text-primary ${
              canLeft ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-2 pointer-events-none"
            }`}
          >
            <ChevronLeft className="size-4" />
          </button>
          <button
            type="button"
            aria-label="Rolar para a direita"
            onClick={() => scrollBy(1)}
            tabIndex={canRight ? 0 : -1}
            className={`hidden md:grid absolute right-2 top-1/2 -translate-y-1/2 z-20 size-10 place-items-center rounded-full border border-border/70 bg-card/95 backdrop-blur shadow-[0_6px_20px_-6px_rgba(0,0,0,0.15)] text-foreground transition-all duration-300 hover:scale-105 hover:border-primary/40 hover:text-primary ${
              canRight ? "opacity-100 translate-x-0" : "opacity-0 translate-x-2 pointer-events-none"
            }`}
          >
            <ChevronRight className="size-4" />
          </button>
        </>
      )}

      <div
        ref={trackRef}
        role="region"
        aria-label={ariaLabel}
        tabIndex={0}
        onKeyDown={onKeyDown}
        className={`flex overflow-x-auto scrollbar-hide scroll-smooth outline-none focus-visible:ring-2 focus-visible:ring-primary/30 rounded-lg ${
          snap !== "none" ? "snap-x snap-mandatory" : ""
        } ${bleed ? "px-5" : ""} ${trackClassName}`}
        style={{
          scrollPaddingLeft: bleed ? 20 : 8,
          // scroll-padding-right maior => item nunca encosta na borda direita,
          // deixando ~30% do próximo visível (peek premium).
          scrollPaddingRight: 72,
        }}
      >
        {items}
        {/* Spacer para garantir peek do último item e respiro no snap */}
        <div aria-hidden className="shrink-0 w-6 md:w-10" />
      </div>
    </div>
  );
}

export default HorizontalScroller;
