import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useMemo, useState, type FormEvent } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import {
  Search as SearchIcon,
  ArrowLeft,
  SlidersHorizontal,
  MapPin,
  X,
  Stethoscope,
  Building2,
  FlaskConical,
  ClipboardList,
  LayoutGrid,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { HorizontalScroller } from "@/components/livvo/ui";

const searchSchema = z.object({
  spec: z.string().optional(),
  q: z.string().optional(),
  city: z.string().optional(),
  uf: z.string().optional(),
  // legacy
  specialty: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/app/buscar")({
  validateSearch: searchSchema,
  component: BuscarLayout,
});

const TABS = [
  { to: "/app/buscar", label: "Todos", icon: LayoutGrid, exact: true },
  { to: "/app/buscar/profissionais", label: "Profissionais", icon: Stethoscope, exact: false },
  { to: "/app/buscar/clinicas", label: "Clínicas", icon: Building2, exact: false },
  { to: "/app/buscar/laboratorios", label: "Laboratórios", icon: FlaskConical, exact: false },
  { to: "/app/buscar/exames", label: "Exames", icon: ClipboardList, exact: false },
] as const;

// Palavras-chave para busca inteligente na aba "Todos"
const KEYWORD_ROUTES: Array<{ patterns: RegExp; to: (typeof TABS)[number]["to"] }> = [
  { patterns: /hospital|cl[ií]nica|centro m[eé]dico|policl[ií]nica|ambulat[oó]rio/i, to: "/app/buscar/clinicas" },
  { patterns: /laborat[oó]rio|diagn[oó]stico|coleta|imagem|raio.?x|ressonancia|ressonância|tomografia|ultrassom/i, to: "/app/buscar/laboratorios" },
  { patterns: /hemograma|exame|glicose|colesterol|urina|sangue|hormônio|hormonio|tsh|pcr|covid/i, to: "/app/buscar/exames" },
];

function BuscarLayout() {
  const raw = Route.useSearch();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  // aceita ?specialty= legado
  const specSlug = raw.spec ?? raw.specialty;
  const [q, setQ] = useState(raw.q ?? "");
  const [city, setCity] = useState(raw.city ?? "");
  const [uf, setUf] = useState(raw.uf ?? "");
  const [showFilters, setShowFilters] = useState(false);

  const { data: specs } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => (await supabase.from("specialties").select("*").order("name")).data ?? [],
  });

  const activeFilters = useMemo(
    () =>
      [
        specSlug && (specs ?? []).find((s) => s.slug === specSlug)?.name,
        city && `Cidade: ${city}`,
        uf && `UF: ${uf}`,
      ].filter(Boolean) as string[],
    [specSlug, city, uf, specs]
  );

  const currentTab = TABS.find((t) => (t.exact ? pathname === t.to : pathname.startsWith(t.to))) ?? TABS[0];
  const isTodos = currentTab.to === "/app/buscar";

  function applySearch(nextQ: string) {
    // Busca inteligente: se estiver em "Todos" e o texto casar com uma categoria,
    // redireciona para a aba mais relevante.
    let targetTab: (typeof TABS)[number]["to"] = currentTab.to;
    if (isTodos && nextQ.trim()) {
      const hit = KEYWORD_ROUTES.find((k) => k.patterns.test(nextQ));
      if (hit) targetTab = hit.to;
    }
    navigate({
      to: targetTab,
      search: {
        q: nextQ.trim() || undefined,
        spec: specSlug || undefined,
        city: city.trim() || undefined,
        uf: uf.trim().toUpperCase() || undefined,
      },
    });
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    applySearch(q);
  }

  function updateSpec(slug: string | undefined) {
    navigate({
      to: currentTab.to,
      search: {
        q: q.trim() || undefined,
        spec: slug,
        city: city.trim() || undefined,
        uf: uf.trim().toUpperCase() || undefined,
      },
    });
  }

  function clearAll() {
    setQ("");
    setCity("");
    setUf("");
    navigate({ to: currentTab.to, search: {} });
  }

  return (
    <div className="pb-16 livvo-fade-in">
      {/* Hero */}
      <header className="livvo-hero-gradient border-b border-border/60 rounded-b-[28px] md:rounded-b-[40px]">
        <div className="mx-auto w-full max-w-6xl px-5 md:px-8 pt-8 md:pt-12 pb-5 md:pb-8">
          <div className="mb-4 flex items-center justify-between">
            <Link
              to="/app"
              className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur hover:border-primary/40 transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft className="size-4" />
            </Link>
            <span className="livvo-eyebrow">Marketplace de saúde</span>
          </div>

          <div className="max-w-3xl">
            <h1 className="livvo-h1 md:text-[38px] md:leading-[1.1]">O que você procura?</h1>
            <p className="livvo-subtle mt-2 md:text-base">
              Profissionais, clínicas, laboratórios e exames verificados — perto de você.
            </p>
          </div>

          <form onSubmit={onSubmit} className="relative mt-5 md:mt-7 max-w-3xl">
            <SearchIcon className="pointer-events-none absolute left-4 md:left-5 top-1/2 -translate-y-1/2 size-4 md:size-5 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cardiologista, Clínica Vida, laboratório, hemograma..."
              className="h-12 md:h-14 pl-11 md:pl-14 pr-14 md:pr-16 rounded-2xl bg-card border-border/70 shadow-[0_6px_24px_-10px_rgba(0,0,0,0.15)] text-[15px] md:text-base placeholder:text-muted-foreground/80"
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Abrir filtros"
              className={`absolute right-2 md:right-2.5 top-1/2 -translate-y-1/2 grid size-9 md:size-10 place-items-center rounded-xl transition-all ${
                showFilters
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-primary-soft text-primary hover:bg-primary/10"
              }`}
            >
              <SlidersHorizontal className="size-4" />
            </button>
          </form>

          {activeFilters.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5 max-w-3xl">
              {activeFilters.map((f) => (
                <span key={f} className="livvo-chip-primary">{f}</span>
              ))}
              <button
                onClick={clearAll}
                className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
              >
                <X className="size-3" /> Limpar
              </button>
            </div>
          )}
        </div>

        {/* Tabs */}
        <nav
          aria-label="Categorias de busca"
          className="mx-auto w-full max-w-6xl px-5 md:px-8"
        >
          <div className="-mx-5 md:-mx-8 px-5 md:px-8 pb-4 md:pb-5 overflow-x-auto scrollbar-hide">
            <div className="inline-flex items-center gap-1.5 rounded-2xl border border-border/60 bg-card/70 backdrop-blur p-1 shadow-[var(--shadow-soft)]">
              {TABS.map((t) => {
                const Icon = t.icon;
                const active = currentTab.to === t.to;
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    search={{
                      q: q.trim() || undefined,
                      spec: specSlug || undefined,
                      city: city.trim() || undefined,
                      uf: uf.trim().toUpperCase() || undefined,
                    }}
                    className={`inline-flex items-center gap-1.5 rounded-xl px-3 md:px-4 h-9 md:h-10 text-xs md:text-sm font-semibold transition-all whitespace-nowrap ${
                      active
                        ? "bg-foreground text-background shadow-sm"
                        : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                    }`}
                  >
                    <Icon className="size-3.5 md:size-4" />
                    {t.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      </header>

      <div className="mx-auto w-full max-w-6xl px-5 md:px-8 pt-6 md:pt-8 space-y-8 md:space-y-10">
        {showFilters && (
          <div className="rounded-2xl border border-border bg-card p-4 md:p-5 shadow-[var(--shadow-soft)] livvo-slide-up">
            <p className="livvo-eyebrow mb-3">Localização</p>
            <div className="grid grid-cols-[80px_1fr] md:grid-cols-[100px_1fr_1fr] gap-3 text-sm">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">UF</label>
                <Input
                  value={uf}
                  onChange={(e) => setUf(e.target.value.toUpperCase())}
                  onBlur={() => applySearch(q)}
                  placeholder="MA"
                  maxLength={2}
                  className="h-10"
                />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">Cidade</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    onBlur={() => applySearch(q)}
                    placeholder="São Luís"
                    className="h-10 pl-8"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chips de especialidades (contextual: profissionais e clínicas) */}
        {(currentTab.to === "/app/buscar" ||
          currentTab.to === "/app/buscar/profissionais" ||
          currentTab.to === "/app/buscar/clinicas") && (
          <section aria-label="Especialidades">
            <HorizontalScroller snap="center" showArrows ariaLabel="Especialidades">
              <button
                data-active={!specSlug || undefined}
                onClick={() => updateSpec(undefined)}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                  !specSlug
                    ? "bg-foreground text-background border-foreground shadow-sm"
                    : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                }`}
              >
                Todas
              </button>
              {(specs ?? []).map((s) => (
                <button
                  key={s.id}
                  data-active={specSlug === s.slug || undefined}
                  onClick={() => updateSpec(s.slug)}
                  className={`rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                    specSlug === s.slug
                      ? "bg-foreground text-background border-foreground shadow-sm"
                      : "bg-card border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </HorizontalScroller>
          </section>
        )}

        <Outlet />
      </div>
    </div>
  );
}
