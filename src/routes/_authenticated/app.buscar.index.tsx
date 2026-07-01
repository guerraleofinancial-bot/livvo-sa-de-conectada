import { createFileRoute, getRouteApi, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Sparkles, Search as SearchIcon, Building2, FlaskConical } from "lucide-react";
import {
  ProfessionalCard,
  ProfessionalCardSkeleton,
  type ProfessionalCardData,
} from "@/components/livvo/ProfessionalCard";
import { CompanyCard } from "@/components/livvo/CompanyCard";
import { HorizontalScroller, SectionHeader } from "@/components/livvo/ui";
import { trackAdEvent } from "@/lib/livvo/ads.functions";

export const Route = createFileRoute("/_authenticated/app/buscar/")({
  component: BuscarTodos,
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

const parent = getRouteApi("/_authenticated/app/buscar");

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

function BuscarTodos() {
  const s = parent.useSearch();
  const specSlug = s.spec ?? s.specialty;
  const q = s.q ?? "";
  const city = s.city ?? "";
  const state = s.uf ?? "";
  const trackEvent = useServerFn(trackAdEvent);

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
        trackEvent({
          data: {
            subscriptionId: r.subscription_id,
            targetType: "professional",
            targetId: r.professional_id,
            kind: "impression",
            context: { q, city, state, specialty: specSlug },
          },
        }).catch(() => {});
      }
    });
  }, [ranked, trackEvent, q, city, state, specSlug]);

  function onSponsoredClick(r: Ranked) {
    if (r.rank_group < 4 && r.subscription_id) {
      trackEvent({
        data: {
          subscriptionId: r.subscription_id,
          targetType: "professional",
          targetId: r.professional_id,
          kind: "click",
          context: { q, city, state, specialty: specSlug },
        },
      }).catch(() => {});
    }
  }

  const groups = useMemo(
    () =>
      [
        { title: "Patrocinado", label: "Patrocinado", rank: 1, sponsored: true },
        { title: "Em destaque na sua região", label: "Destaque regional", rank: 2, sponsored: true },
        { title: "Em destaque na categoria", label: "Destaque de categoria", rank: 3, sponsored: true },
        { title: "Profissionais", label: undefined, rank: 4, sponsored: false },
      ].map((g) => ({ ...g, items: (ranked ?? []).filter((r) => r.rank_group === g.rank) })),
    [ranked]
  );

  const { data: companies } = useQuery({
    queryKey: ["search-companies-all", q, city],
    queryFn: async () => {
      let query = supabase
        .from("companies")
        .select("id, legal_name, trade_name, type, address_city, address_state, logo_url, slug")
        .eq("status", "aprovado");
      if (city.trim()) query = query.ilike("address_city", `%${city}%`);
      if (q.trim()) query = query.or(`legal_name.ilike.%${q}%,trade_name.ilike.%${q}%`);
      return (await query.limit(15)).data ?? [];
    },
  });

  const totalCount = ranked?.length ?? 0;

  return (
    <>
      {companies && companies.length > 0 && (
        <section className="rounded-3xl border border-border/60 bg-card/40 px-5 py-5 md:px-6 md:py-6 shadow-[var(--shadow-soft)]">
          <SectionHeader
            eyebrow="Estabelecimentos"
            title="Clínicas & laboratórios"
            trailing={
              <div className="flex gap-1.5">
                <Link
                  to="/app/buscar/clinicas"
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  <Building2 className="size-3" /> Clínicas
                </Link>
                <Link
                  to="/app/buscar/laboratorios"
                  className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] font-semibold text-muted-foreground hover:text-foreground"
                >
                  <FlaskConical className="size-3" /> Laboratórios
                </Link>
              </div>
            }
          />
          <HorizontalScroller className="mt-4" snap="start" ariaLabel="Clínicas e laboratórios">
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
          </HorizontalScroller>
        </section>
      )}

      {isLoading && (
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProfessionalCardSkeleton key={i} />
          ))}
        </section>
      )}

      {!isLoading &&
        groups.map(
          (g) =>
            g.items.length > 0 && (
              <section key={g.rank} className="livvo-slide-up">
                <SectionHeader
                  eyebrow={g.sponsored ? undefined : "Resultados"}
                  title={
                    <span className="inline-flex items-center gap-2">
                      <span>{g.title}</span>
                      {g.sponsored && (
                        <span className="livvo-chip-sponsored">
                          <Sparkles className="size-3" /> {g.label}
                        </span>
                      )}
                    </span>
                  }
                  trailing={
                    !g.sponsored && totalCount > 0 ? (
                      <span className="livvo-subtle">
                        {g.items.length} resultado{g.items.length !== 1 ? "s" : ""}
                      </span>
                    ) : undefined
                  }
                />

                <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {g.items.map((p) => (
                    <ProfessionalCard
                      key={p.professional_id}
                      data={toCardData(p, g.label)}
                      onClick={() => onSponsoredClick(p)}
                    />
                  ))}
                </div>
              </section>
            )
        )}

      {!isLoading && totalCount === 0 && (!companies || companies.length === 0) && (
        <EmptyState />
      )}
    </>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-border bg-card p-10 md:p-14 text-center">
      <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
        <SearchIcon className="size-6" />
      </div>
      <p className="mt-4 text-base font-semibold text-foreground">Nenhum resultado encontrado</p>
      <p className="livvo-subtle mt-1 max-w-sm mx-auto">
        Tente ajustar filtros, buscar por outra especialidade ou explorar as abas específicas.
      </p>
    </div>
  );
}
