import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useMemo, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Search as SearchIcon, ArrowLeft, SlidersHorizontal, Sparkles, MapPin, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ProfessionalCard, ProfessionalCardSkeleton, type ProfessionalCardData } from "@/components/livvo/ProfessionalCard";
import { CompanyCard } from "@/components/livvo/CompanyCard";
import { trackAdEvent } from "@/lib/livvo/ads.functions";

const searchSchema = z.object({
  specialty: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/app/buscar")({
  validateSearch: searchSchema,
  component: Buscar,
});

type Ranked = {
  professional_id: string;
  full_name: string;
  avatar_url: string | null;
  specialty_name: string | null;
  specialty_slug: string | null;
  address_city: string | null;
  address_state: string | null;
  consultation_price: number;
  rating_average: number;
  rating_count: number;
  is_premium: boolean;
  rank_group: number;
  subscription_id: string | null;
  council: string | null;
  council_number: string | null;
  council_state: string | null;
  is_verified: boolean;
};

function toCardData(r: Ranked, sponsoredLabel?: string): ProfessionalCardData {
  return {
    id: r.professional_id,
    fullName: r.full_name,
    avatarUrl: r.avatar_url,
    specialty: r.specialty_name,
    city: r.address_city,
    state: r.address_state,
    price: r.consultation_price,
    rating: r.rating_average,
    ratingCount: r.rating_count,
    council: r.council,
    councilNumber: r.council_number,
    councilState: r.council_state,
    isVerified: r.is_verified,
    isPremium: r.is_premium,
    isSponsored: r.rank_group < 4,
    sponsoredLabel,
    agendaOpen: r.is_verified,
  };
}

function Buscar() {
  const { specialty: initialSpec, q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const [specSlug, setSpecSlug] = useState<string | undefined>(initialSpec);
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const trackEvent = useServerFn(trackAdEvent);

  const { data: specs } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => (await supabase.from("specialties").select("*").order("name")).data ?? [],
  });

  const { data: ranked, isLoading } = useQuery<Ranked[]>({
    queryKey: ["search-ranked", q, specSlug, city, state],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_providers_ranked", {
        _state: state.trim() || undefined,
        _city: city.trim() || undefined,
        _specialty_slug: specSlug ?? undefined,
        _q: q.trim() || undefined,
        _limit: 50,
      });
      if (error) throw error;
      return (data ?? []) as Ranked[];
    },
  });

  const fired = useRef(new Set<string>());
  useEffect(() => {
    (ranked ?? []).forEach((r) => {
      if (r.rank_group < 4 && r.subscription_id && !fired.current.has(r.subscription_id)) {
        fired.current.add(r.subscription_id);
        trackEvent({ data: { subscriptionId: r.subscription_id, targetType: "professional", targetId: r.professional_id, kind: "impression", context: { q, city, state, specialty: specSlug } } }).catch(() => {});
      }
    });
  }, [ranked, trackEvent, q, city, state, specSlug]);

  function onSponsoredClick(r: Ranked) {
    if (r.rank_group < 4 && r.subscription_id) {
      trackEvent({ data: { subscriptionId: r.subscription_id, targetType: "professional", targetId: r.professional_id, kind: "click", context: { q, city, state, specialty: specSlug } } }).catch(() => {});
    }
  }

  const groups = useMemo(() => [
    { title: "Patrocinado", label: "Patrocinado", rank: 1, sponsored: true },
    { title: "Em destaque na sua região", label: "Destaque regional", rank: 2, sponsored: true },
    { title: "Em destaque na categoria", label: "Destaque de categoria", rank: 3, sponsored: true },
    { title: "Profissionais", label: undefined, rank: 4, sponsored: false },
  ].map((g) => ({ ...g, items: (ranked ?? []).filter((r) => r.rank_group === g.rank) })), [ranked]);

  const { data: companies } = useQuery({
    queryKey: ["search-companies", q, city],
    queryFn: async () => {
      let query = supabase.from("companies").select("id, legal_name, trade_name, type, address_city, address_state, logo_url").eq("status", "aprovado");
      if (city.trim()) query = query.ilike("address_city", `%${city}%`);
      if (q.trim()) query = query.or(`legal_name.ilike.%${q}%,trade_name.ilike.%${q}%`);
      return (await query.limit(15)).data ?? [];
    },
  });

  const activeFilters = [
    specSlug && (specs ?? []).find((s) => s.slug === specSlug)?.name,
    city && `Cidade: ${city}`,
    state && `UF: ${state}`,
  ].filter(Boolean) as string[];

  const totalCount = ranked?.length ?? 0;

  return (
    <div className="pb-10 livvo-fade-in">
      {/* Hero */}
      <header className="livvo-hero-gradient px-5 pt-10 pb-6 rounded-b-[28px] border-b border-border/60">
        <div className="mb-4 flex items-center justify-between">
          <Link
            to="/app"
            className="inline-flex size-10 items-center justify-center rounded-full border border-border bg-card/80 backdrop-blur hover:border-primary/40 transition-colors"
          >
            <ArrowLeft className="size-4" />
          </Link>
          <span className="livvo-eyebrow">Marketplace</span>
        </div>
        <h1 className="livvo-h1">Encontre o profissional certo</h1>
        <p className="livvo-subtle mt-1">Especialidades, clínicas e laboratórios verificados — perto de você.</p>

        <div className="relative mt-5">
          <SearchIcon className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nome, especialidade, clínica ou exame"
            className="h-12 pl-11 pr-14 rounded-2xl bg-card border-border/70 shadow-sm text-[15px] placeholder:text-muted-foreground/80"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Abrir filtros"
            className={`absolute right-2 top-1/2 -translate-y-1/2 grid size-9 place-items-center rounded-xl transition-colors ${showFilters ? "bg-primary text-primary-foreground" : "bg-primary-soft text-primary hover:bg-primary/10"}`}
          >
            <SlidersHorizontal className="size-4" />
          </button>
        </div>

        {activeFilters.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {activeFilters.map((f) => (
              <span key={f} className="livvo-chip-primary">
                {f}
              </span>
            ))}
            <button
              onClick={() => { setSpecSlug(undefined); setCity(""); setState(""); }}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
            >
              <X className="size-3" /> Limpar
            </button>
          </div>
        )}
      </header>

      <div className="px-5 pt-5 space-y-6">
        {showFilters && (
          <div className="rounded-2xl border border-border bg-card p-4 shadow-[var(--shadow-soft)] livvo-slide-up">
            <p className="livvo-eyebrow mb-3">Localização</p>
            <div className="grid grid-cols-[80px_1fr] gap-2 text-sm">
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">UF</label>
                <Input value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="MA" maxLength={2} className="h-10" />
              </div>
              <div>
                <label className="text-[11px] font-semibold text-muted-foreground">Cidade</label>
                <div className="relative">
                  <MapPin className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
                  <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Luís" className="h-10 pl-8" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Chip row: specialties */}
        <div className="-mx-5 px-5">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            <button
              onClick={() => setSpecSlug(undefined)}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                !specSlug ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
              }`}
            >
              Todas
            </button>
            {(specs ?? []).map((s) => (
              <button
                key={s.id}
                onClick={() => setSpecSlug(s.slug)}
                className={`shrink-0 rounded-full border px-4 py-2 text-xs font-semibold transition-all ${
                  specSlug === s.slug ? "bg-foreground text-background border-foreground" : "bg-card border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Companies rail */}
        {companies && companies.length > 0 && (
          <section>
            <SectionHeader eyebrow="Estabelecimentos" title="Clínicas & laboratórios" />
            <div className="-mx-5 mt-3 flex gap-3 overflow-x-auto scrollbar-hide px-5 pb-1">
              {companies.map((c) => (
                <CompanyCard
                  key={c.id}
                  data={{
                    id: c.id,
                    name: c.trade_name ?? c.legal_name,
                    type: c.type,
                    city: c.address_city,
                    state: c.address_state,
                    logoUrl: c.logo_url,
                  }}
                />
              ))}
            </div>
          </section>
        )}

        {/* Result groups */}
        {isLoading && (
          <section className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => <ProfessionalCardSkeleton key={i} />)}
          </section>
        )}

        {!isLoading && groups.map((g) => g.items.length > 0 && (
          <section key={g.rank} className="livvo-slide-up">
            <SectionHeader
              eyebrow={g.sponsored ? undefined : "Resultados"}
              title={g.title}
              badge={g.sponsored ? <span className="livvo-chip-sponsored"><Sparkles className="size-3" /> {g.label}</span> : undefined}
              trailing={!g.sponsored && totalCount > 0 ? <span className="livvo-subtle">{g.items.length} resultado{g.items.length !== 1 ? "s" : ""}</span> : undefined}
            />
            <div className="mt-3 space-y-3">
              {g.items.map((p) => (
                <ProfessionalCard
                  key={p.professional_id}
                  data={toCardData(p, g.label)}
                  onClick={() => onSponsoredClick(p)}
                />
              ))}
            </div>
          </section>
        ))}

        {!isLoading && totalCount === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <div className="mx-auto grid size-12 place-items-center rounded-2xl bg-primary-soft text-primary">
              <SearchIcon className="size-5" />
            </div>
            <p className="mt-3 text-sm font-semibold text-foreground">Nenhum profissional encontrado</p>
            <p className="livvo-subtle mt-1">Tente ajustar filtros ou o termo de busca.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  eyebrow,
  title,
  badge,
  trailing,
}: {
  eyebrow?: string;
  title: string;
  badge?: React.ReactNode;
  trailing?: React.ReactNode;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div className="min-w-0">
        {eyebrow && <p className="livvo-eyebrow">{eyebrow}</p>}
        <h2 className="livvo-h2 mt-0.5 flex items-center gap-2">
          <span className="truncate">{title}</span>
          {badge}
        </h2>
      </div>
      {trailing}
    </div>
  );
}
