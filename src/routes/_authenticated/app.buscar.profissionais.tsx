import { createFileRoute, getRouteApi } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Search as SearchIcon, Sparkles } from "lucide-react";
import {
  ProfessionalCard,
  ProfessionalCardSkeleton,
  type ProfessionalCardData,
} from "@/components/livvo/ProfessionalCard";
import { SectionHeader } from "@/components/livvo/ui";
import { trackAdEvent } from "@/lib/livvo/ads.functions";

export const Route = createFileRoute("/_authenticated/app/buscar/profissionais")({
  component: BuscarProfissionais,
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

function toCard(r: Ranked, label?: string): ProfessionalCardData {
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
    sponsoredLabel: label,
    agendaOpen: r.is_verified,
  };
}

function BuscarProfissionais() {
  const s = parent.useSearch();
  const specSlug = s.spec ?? s.specialty;
  const q = s.q ?? "";
  const city = s.city ?? "";
  const state = s.uf ?? "";
  const trackEvent = useServerFn(trackAdEvent);

  const { data: ranked, isLoading } = useQuery<Ranked[]>({
    queryKey: ["search-pros", q, specSlug, city, state],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("search_providers_ranked", {
        _state: state.trim() || undefined,
        _city: city.trim() || undefined,
        _specialty_slug: specSlug ?? undefined,
        _q: q.trim() || undefined,
        _limit: 60,
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
            context: { q, city, state, specialty: specSlug, tab: "profissionais" },
          },
        }).catch(() => {});
      }
    });
  }, [ranked, trackEvent, q, city, state, specSlug]);

  function onClick(r: Ranked) {
    if (r.rank_group < 4 && r.subscription_id) {
      trackEvent({
        data: {
          subscriptionId: r.subscription_id,
          targetType: "professional",
          targetId: r.professional_id,
          kind: "click",
          context: { q, city, state, specialty: specSlug, tab: "profissionais" },
        },
      }).catch(() => {});
    }
  }

  const sponsored = (ranked ?? []).filter((r) => r.rank_group < 4);
  const organic = (ranked ?? []).filter((r) => r.rank_group === 4);

  return (
    <>
      {isLoading && (
        <section className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProfessionalCardSkeleton key={i} />
          ))}
        </section>
      )}

      {!isLoading && sponsored.length > 0 && (
        <section className="livvo-slide-up">
          <SectionHeader
            title={
              <span className="inline-flex items-center gap-2">
                <span>Em destaque</span>
                <span className="livvo-chip-sponsored">
                  <Sparkles className="size-3" /> Patrocinado
                </span>
              </span>
            }
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {sponsored.map((p) => (
              <ProfessionalCard key={p.professional_id} data={toCard(p, "Destaque")} onClick={() => onClick(p)} />
            ))}
          </div>
        </section>
      )}

      {!isLoading && organic.length > 0 && (
        <section className="livvo-slide-up">
          <SectionHeader
            eyebrow="Resultados"
            title="Profissionais"
            trailing={<span className="livvo-subtle">{organic.length} resultado{organic.length !== 1 ? "s" : ""}</span>}
          />
          <div className="mt-4 grid gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {organic.map((p) => (
              <ProfessionalCard key={p.professional_id} data={toCard(p)} onClick={() => onClick(p)} />
            ))}
          </div>
        </section>
      )}

      {!isLoading && (ranked ?? []).length === 0 && (
        <div className="rounded-3xl border border-dashed border-border bg-card p-10 md:p-14 text-center">
          <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-primary-soft text-primary">
            <SearchIcon className="size-6" />
          </div>
          <p className="mt-4 text-base font-semibold text-foreground">Nenhum profissional encontrado</p>
          <p className="livvo-subtle mt-1 max-w-sm mx-auto">
            Ajuste os filtros ou tente outra especialidade.
          </p>
        </div>
      )}
    </>
  );
}
