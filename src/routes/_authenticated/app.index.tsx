import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import {
  Bell,
  Search,
  HeartPulse,
  Baby,
  Sparkles,
  Brain,
  Stethoscope,
  Flower,
  Bone,
  Apple,
  Eye,
  BrainCircuit,
  Building2,
  FlaskConical,
  Star,
  Calendar,
  ChevronRight,
} from "lucide-react";
import { useEffect } from "react";
import {
  ProfessionalCard,
  ProfessionalCardSkeleton,
  type ProfessionalCardData,
} from "@/components/livvo/ProfessionalCard";
import { CompanyCard } from "@/components/livvo/CompanyCard";
import { SectionHeader, EmptyState, TrustStrip, SkeletonBlock, HorizontalScroller } from "@/components/livvo/ui";

export const Route = createFileRoute("/_authenticated/app/")({
  component: PatientHome,
});

const iconMap: Record<string, typeof HeartPulse> = {
  "heart-pulse": HeartPulse,
  baby: Baby,
  sparkles: Sparkles,
  brain: Brain,
  "brain-circuit": BrainCircuit,
  stethoscope: Stethoscope,
  flower: Flower,
  bone: Bone,
  apple: Apple,
  eye: Eye,
};

type ProRow = {
  id: string;
  consultation_price: number | null;
  rating_average: number | null;
  rating_count: number | null;
  address_city: string | null;
  address_state: string | null;
  council: string | null;
  council_number: string | null;
  council_state: string | null;
  council_verified_at: string | null;
  created_at?: string | null;
  profiles: { full_name?: string; avatar_url?: string } | null;
  specialties: { name?: string } | null;
};

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

function toCard(p: ProRow, extras?: Partial<ProfessionalCardData>): ProfessionalCardData {
  const rating = Number(p.rating_average ?? 0);
  const count = Number(p.rating_count ?? 0);
  const isNew = p.created_at ? Date.now() - new Date(p.created_at).getTime() < THIRTY_DAYS : false;
  return {
    id: p.id,
    fullName: p.profiles?.full_name ?? null,
    avatarUrl: p.profiles?.avatar_url ?? null,
    specialty: p.specialties?.name ?? null,
    city: p.address_city,
    state: p.address_state,
    price: p.consultation_price,
    rating: rating || null,
    ratingCount: count,
    council: p.council,
    councilNumber: p.council_number,
    councilState: p.council_state,
    isVerified: !!p.council_verified_at,
    agendaOpen: !!p.council_verified_at,
    isTopRated: rating >= 4.8 && count >= 20,
    isNewPartner: isNew,
    ...extras,
  };
}

function PatientHome() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!roles.length) return;
    if (roles.includes("admin")) navigate({ to: "/admin" });
    else if (roles.includes("profissional") && !roles.includes("paciente"))
      navigate({ to: "/pro" });
  }, [loading, roles, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("profiles").select("full_name, avatar_url").eq("id", user!.id).single())
        .data,
  });

  const { data: specs } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () =>
      (await supabase.from("specialties").select("*").eq("active", true).order("name")).data ?? [],
  });

  const { data: nextAppt } = useQuery({
    queryKey: ["next-appt", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (
        await supabase
          .from("appointments")
          .select(
            "id, scheduled_at, status, professional_id, professionals(id, profiles:profiles!professionals_profile_fkey(full_name, avatar_url), specialties(name))",
          )
          .eq("patient_id", user!.id)
          .in("status", ["agendada", "confirmada"])
          .gte("scheduled_at", new Date().toISOString())
          .order("scheduled_at", { ascending: true })
          .limit(1)
          .maybeSingle()
      ).data,
  });

  const proSelect =
    "id, consultation_price, rating_average, rating_count, address_city, address_state, council, council_number, council_state, council_verified_at, created_at, profiles:profiles!professionals_profile_fkey(full_name, avatar_url), specialties(name)";

  const { data: featured, isLoading: featuredLoading } = useQuery({
    queryKey: ["home-featured"],
    queryFn: async () =>
      (
        await supabase
          .from("professionals")
          .select(proSelect)
          .eq("status", "aprovado")
          .not("council_verified_at", "is", null)
          .gte("rating_average", 4.5)
          .order("rating_average", { ascending: false })
          .limit(6)
      ).data ?? [],
  });

  const { data: topRated, isLoading: topLoading } = useQuery({
    queryKey: ["home-top"],
    queryFn: async () =>
      (
        await supabase
          .from("professionals")
          .select(proSelect)
          .eq("status", "aprovado")
          .order("rating_average", { ascending: false })
          .limit(6)
      ).data ?? [],
  });

  const { data: today, isLoading: todayLoading } = useQuery({
    queryKey: ["home-today"],
    queryFn: async () => {
      const dow = new Date().getDay();
      const { data: avs } = await supabase
        .from("professional_availability")
        .select("professional_id")
        .eq("day_of_week", dow)
        .eq("active", true)
        .limit(30);
      const ids = Array.from(new Set((avs ?? []).map((a) => a.professional_id))).slice(0, 12);
      if (!ids.length) return [];
      return (
        (
          await supabase
            .from("professionals")
            .select(proSelect)
            .in("id", ids)
            .eq("status", "aprovado")
            .limit(8)
        ).data ?? []
      );
    },
  });

  const { data: recent, isLoading: recentLoading } = useQuery({
    queryKey: ["home-recent"],
    queryFn: async () =>
      (
        await supabase
          .from("professionals")
          .select(proSelect)
          .eq("status", "aprovado")
          .not("council_verified_at", "is", null)
          .order("created_at", { ascending: false })
          .limit(6)
      ).data ?? [],
  });

  const { data: clinics } = useQuery({
    queryKey: ["home-clinics"],
    queryFn: async () =>
      (
        await supabase
          .from("companies")
          .select("id, legal_name, trade_name, type, address_city, address_state, logo_url")
          .eq("status", "aprovado")
          .eq("type", "clinica")
          .limit(10)
      ).data ?? [],
  });

  const { data: labs } = useQuery({
    queryKey: ["home-labs"],
    queryFn: async () =>
      (
        await supabase
          .from("companies")
          .select("id, legal_name, trade_name, type, address_city, address_state, logo_url")
          .eq("status", "aprovado")
          .in("type", ["laboratorio", "diagnostico"])
          .limit(10)
      ).data ?? [],
  });

  const { data: reviews } = useQuery({
    queryKey: ["home-reviews"],
    queryFn: async () =>
      (
        await supabase
          .from("reviews")
          .select(
            "rating, comment, created_at, professional_id, professionals(id, profiles:profiles!professionals_profile_fkey(full_name, avatar_url), specialties(name))",
          )
          .eq("status", "publicada")
          .order("created_at", { ascending: false })
          .limit(6)
      ).data ?? [],
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();
  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="pb-10 livvo-fade-in">
      {/* Header */}
      <header className="px-5 pt-10 pb-4 flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 shrink-0 rounded-full bg-primary-soft grid place-items-center text-primary font-bold ring-1 ring-border overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="size-full object-cover" />
            ) : (
              firstName.charAt(0).toUpperCase()
            )}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{greeting},</p>
            <h1 className="text-lg font-bold tracking-tight truncate">
              Olá, {firstName || "paciente"}
            </h1>
          </div>
        </div>
        <button
          className="size-10 rounded-full border border-border bg-card grid place-items-center shadow-sm relative"
          aria-label="Notificações"
        >
          <Bell className="size-4 text-muted-foreground" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-health" />
        </button>
      </header>

      {/* Hero search */}
      <section className="px-5">
        <Link to="/app/buscar" className="block">
          <div className="livvo-hero-gradient rounded-3xl border border-border/70 p-5 shadow-[var(--shadow-soft)]">
            <p className="livvo-eyebrow">Marketplace de saúde</p>
            <h2 className="livvo-h1 mt-1">
              Encontre profissionais
              <br />
              verificados perto de você
            </h2>
            <div className="relative mt-4">
              <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
              <div className="h-12 pl-11 pr-4 bg-card border border-border rounded-2xl flex items-center text-sm text-muted-foreground shadow-sm">
                Especialidade, nome ou exame
              </div>
            </div>
            <p className="livvo-subtle mt-3 text-[11px]">
              Todos os profissionais têm registro do conselho verificado.
            </p>
          </div>
        </Link>

        {/* Atalhos por tipo de parceiro */}
        <div className="mt-3 grid grid-cols-4 gap-2">
          {[
            { to: "/app/buscar/profissionais", label: "Profissionais", Icon: Stethoscope, tone: "primary" },
            { to: "/app/buscar/clinicas", label: "Clínicas", Icon: Building2, tone: "health" },
            { to: "/app/buscar/laboratorios", label: "Laboratórios", Icon: FlaskConical, tone: "primary" },
            { to: "/app/buscar/exames", label: "Exames", Icon: ClipboardList, tone: "health" },
          ].map(({ to, label, Icon, tone }) => (
            <Link
              key={to}
              to={to}
              className="group flex flex-col items-center gap-1.5 rounded-2xl border border-border/70 bg-card p-3 text-center transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-soft)]"
            >
              <div
                className={`grid size-10 place-items-center rounded-xl transition-transform group-hover:scale-105 ${
                  tone === "primary" ? "bg-primary-soft text-primary" : "bg-health-soft text-health"
                }`}
              >
                <Icon className="size-5" />
              </div>
              <span className="text-[11px] font-semibold text-foreground leading-tight">{label}</span>
            </Link>
          ))}
        </div>
      </section>


      {/* Specialties */}
      <section className="px-5 mt-6 livvo-slide-up">
        <SectionHeader
          eyebrow="Categorias"
          title="Especialidades"
          trailing={
            <Link to="/app/buscar" className="text-xs font-semibold text-primary hover:underline">
              Ver todas
            </Link>
          }
        />
        <HorizontalScroller className="mt-3" snap="start">
          {(specs ?? []).map((s, i) => {
            const Icon = iconMap[s.icon ?? ""] ?? Stethoscope;
            const tinted = i % 2 === 0;
            return (
              <Link
                key={s.id}
                to="/app/buscar"
                search={{ specialty: s.slug }}
                className="flex flex-col items-center gap-2 w-20 group"
              >
                <div
                  className={`size-14 rounded-2xl border flex items-center justify-center transition-transform group-hover:-translate-y-0.5 ${tinted ? "bg-primary-soft border-primary/10 text-primary" : "bg-health-soft border-health/10 text-health"}`}
                >
                  <Icon className="size-6" />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight line-clamp-2 break-words">
                  {s.name}
                </span>
              </Link>
            );
          })}
        </HorizontalScroller>
      </section>


      {/* Next appointment */}
      {nextAppt && (
        <section className="px-5 mt-6 livvo-slide-up">
          <div className="rounded-3xl livvo-hero-primary p-5 shadow-[var(--shadow-hero)] relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <span className="inline-block px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wide mb-2">
                    Próxima consulta
                  </span>
                  <p className="text-base font-semibold">
                    {new Date(nextAppt.scheduled_at).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "short",
                    })}
                    {" · "}
                    {new Date(nextAppt.scheduled_at).toLocaleTimeString("pt-BR", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <Calendar className="size-6 opacity-80" />
              </div>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-semibold truncate">
                    {(nextAppt as any).professionals?.profiles?.full_name}
                  </p>
                  <p className="text-xs opacity-80 truncate">
                    {(nextAppt as any).professionals?.specialties?.name}
                  </p>
                </div>
                <Link
                  to="/app/consultas"
                  className="px-4 py-2 bg-white text-primary text-xs font-bold rounded-xl"
                >
                  Ver detalhes
                </Link>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
          </div>
        </section>
      )}

      {/* Featured */}
      <ProRail
        eyebrow="Em destaque"
        title="Profissionais em destaque"
        subtitle="Selecionados pelo nosso algoritmo de qualidade"
        loading={featuredLoading}
        pros={featured as ProRow[] | undefined}
        highlight="premium"
      />

      {/* Top rated */}
      <ProRail
        eyebrow="Prova social"
        title="Mais bem avaliados"
        loading={topLoading}
        pros={topRated as ProRow[] | undefined}
      />

      {/* Today */}
      <ProRail
        eyebrow="Marketplace vivo"
        title="Atendem hoje"
        subtitle="Agenda aberta para agendamento imediato"
        loading={todayLoading}
        pros={today as ProRow[] | undefined}
        highlight="hot"
      />

      {/* Clinics */}
      {clinics && clinics.length > 0 && (
        <section className="px-5 mt-8 livvo-slide-up">
          <SectionHeader
            eyebrow="Estabelecimentos"
            title="Clínicas em destaque"
            trailing={
              <Link
                to="/app/buscar"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
              >
                Ver mais <ChevronRight className="size-3.5" />
              </Link>
            }
          />
          <HorizontalScroller className="mt-3" snap="start">
            {clinics.map((c) => (
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

      {/* Labs */}
      {labs && labs.length > 0 && (
        <section className="px-5 mt-8 livvo-slide-up">
          <SectionHeader
            eyebrow="Exames & diagnóstico"
            title="Laboratórios"
            trailing={
              <Link
                to="/app/buscar"
                className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
              >
                Ver mais <ChevronRight className="size-3.5" />
              </Link>
            }
          />
          <HorizontalScroller className="mt-3" snap="start">
            {labs.map((c) => (
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

      {/* Recent partners */}
      <ProRail
        eyebrow="Novidades"
        title="Recém-chegados"
        subtitle="Novos parceiros verificados na Livvo"
        loading={recentLoading}
        pros={recent as ProRow[] | undefined}
        highlight="new"
      />

      {/* Reviews rail */}
      {reviews && reviews.length > 0 && (
        <section className="px-5 mt-8 livvo-slide-up">
          <SectionHeader eyebrow="Comunidade" title="Avaliações recentes" />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {reviews.map((r, i) => {
              const pro = (r as any).professionals;
              return (
                <div
                  key={i}
                  className="rounded-2xl bg-card border border-border/70 p-4 shadow-[var(--shadow-soft)]"
                >
                  <div className="flex items-center gap-3">
                    <div className="size-9 rounded-full bg-primary-soft grid place-items-center text-primary text-xs font-bold overflow-hidden ring-1 ring-border/60">
                      {pro?.profiles?.avatar_url ? (
                        <img
                          src={pro.profiles.avatar_url}
                          alt=""
                          className="size-full object-cover"
                        />
                      ) : (
                        (pro?.profiles?.full_name ?? "?").charAt(0)
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate">
                        {pro?.profiles?.full_name ?? "Profissional Livvo"}
                      </p>
                      <p className="text-[11px] text-muted-foreground truncate">
                        {pro?.specialties?.name}
                      </p>
                    </div>
                    <div className="ml-auto flex items-center gap-0.5 text-amber-500 text-xs">
                      {Array.from({ length: r.rating }).map((_, k) => (
                        <Star key={k} className="size-3 fill-current" />
                      ))}
                    </div>
                  </div>
                  {r.comment && (
                    <p className="mt-3 text-sm leading-relaxed text-foreground/85 line-clamp-3">
                      {r.comment}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Trust strip */}
      <section className="px-5 mt-10">
        <TrustStrip />
      </section>
    </div>
  );
}

function ProRail({
  eyebrow,
  title,
  subtitle,
  loading,
  pros,
  highlight,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  loading?: boolean;
  pros?: ProRow[];
  highlight?: "premium" | "hot" | "new";
}) {
  return (
    <section className="px-5 mt-8 livvo-slide-up">
      <SectionHeader
        eyebrow={eyebrow}
        title={title}
        subtitle={subtitle}
        trailing={
          <Link
            to="/app/buscar"
            className="inline-flex items-center gap-0.5 text-xs font-semibold text-primary hover:underline"
          >
            Ver mais <ChevronRight className="size-3.5" />
          </Link>
        }
      />
      {!loading && (!pros || pros.length === 0) ? (
        <div className="mt-3">
          <EmptyState
            icon={<Sparkles className="size-5" />}
            title="Ainda sem parceiros nessa categoria"
            description="Novos profissionais entram toda semana."
          />
        </div>
      ) : (
        <HorizontalScroller className="mt-3" snap="start">
          {loading &&
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="w-[300px]">
                <ProfessionalCardSkeleton />
              </div>
            ))}
          {!loading &&
            (pros ?? []).map((p) => (
              <div key={p.id} className="w-[300px]">
                <ProfessionalCard
                  data={toCard(p, {
                    isPremium: highlight === "premium",
                    isHotToday: highlight === "hot",
                    isNewPartner: highlight === "new" ? true : undefined,
                  })}
                />
              </div>
            ))}
        </HorizontalScroller>
      )}
    </section>

  );
}
