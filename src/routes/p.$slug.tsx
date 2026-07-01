import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Star, Calendar, Clock, Briefcase, Globe, Instagram, Award, Languages, ArrowRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/livvo/VerifiedBadge";
import { ShareMenu } from "@/components/livvo/share-menu";
import { FavoriteButton } from "@/components/livvo/favorite-button";
import { MarketingNav, MarketingFooter } from "@/components/livvo/marketing-shell";

const SITE = "https://livvo-conecta-saude.lovable.app";

async function loadPro(slug: string) {
  // Slug or UUID fallback
  let q = supabase
    .from("professionals")
    .select("*, profiles:profiles!professionals_profile_fkey(full_name, avatar_url), specialties(name, slug)")
    .eq("status", "aprovado")
    .not("council_verified_at", "is", null);
  q = /^[0-9a-f]{8}-/i.test(slug) ? q.eq("id", slug) : q.eq("slug", slug);
  const { data } = await q.maybeSingle();
  if (!data) throw notFound();
  return data;
}

export const Route = createFileRoute("/p/$slug")({
  loader: async ({ params }) => {
    const pro = await loadPro(params.slug);
    return { pro };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.pro as
      | { profiles?: { full_name?: string; avatar_url?: string } | null; specialties?: { name?: string } | null; address_city?: string; address_state?: string; bio?: string; council?: string; council_number?: string; council_state?: string; consultation_price?: number }
      | undefined;
    const name = p?.profiles?.full_name ?? "Profissional";
    const spec = p?.specialties?.name ?? "Saúde";
    const loc = [p?.address_city, p?.address_state].filter(Boolean).join(" / ");
    const title = `${name} — ${spec}${loc ? " · " + loc : ""} | Livvo`;
    const desc = (p?.bio?.slice(0, 155)) || `Agende consulta presencial com ${name}, ${spec.toLowerCase()} verificado pela Livvo${loc ? " em " + loc : ""}.`;
    const url = `${SITE}/p/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "profile" },
        { property: "og:url", content: url },
        ...(p?.profiles?.avatar_url ? [{ property: "og:image", content: p.profiles.avatar_url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: p ? [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Physician",
          name,
          medicalSpecialty: spec,
          url,
          image: p.profiles?.avatar_url,
          address: loc ? { "@type": "PostalAddress", addressLocality: p.address_city, addressRegion: p.address_state, addressCountry: "BR" } : undefined,
          priceRange: p.consultation_price ? `R$ ${p.consultation_price}` : undefined,
          identifier: p.council_number ? `${p.council} ${p.council_number}/${p.council_state}` : undefined,
        }),
      }] : [],
    };
  },
  component: PublicPro,
  errorComponent: ({ error }) => (
    <div className="max-w-md mx-auto p-8 text-center">
      <p className="text-sm text-muted-foreground">Não foi possível carregar este perfil.</p>
      <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="max-w-md mx-auto p-8 text-center">
      <h1 className="text-xl font-bold">Perfil indisponível</h1>
      <p className="text-sm text-muted-foreground mt-2">Este profissional pode ter sido removido ou ainda está em análise.</p>
      <Link to="/" className="inline-block mt-4 text-primary underline text-sm">Voltar ao início</Link>
    </div>
  ),
});

function PublicPro() {
  const { pro } = Route.useLoaderData();
  const p = pro as typeof pro & {
    profiles: { full_name?: string; avatar_url?: string } | null;
    specialties: { name?: string; slug?: string } | null;
  };
  const url = typeof window !== "undefined" ? window.location.href : `${SITE}/p/${p.slug}`;
  const name = p.profiles?.full_name ?? "Profissional";
  const spec = p.specialties?.name ?? "";

  const { data: services } = useQuery({
    queryKey: ["public-pro-services", p.id],
    queryFn: async () => (await supabase.from("services").select("id,name,price,duration_minutes").eq("professional_id", p.id).eq("active", true)).data ?? [],
  });

  const { data: hours } = useQuery({
    queryKey: ["public-pro-hours", p.id],
    queryFn: async () => (await supabase.from("professional_business_hours").select("weekday,opens_at,closes_at,lunch_start,lunch_end,closed").eq("professional_id", p.id).order("weekday")).data ?? [],
  });

  const { data: reviews } = useQuery({
    queryKey: ["public-pro-reviews", p.id],
    queryFn: async () => (await supabase.from("reviews").select("rating,comment,created_at").eq("professional_id", p.id).eq("status", "publicada").order("created_at", { ascending: false }).limit(6)).data ?? [],
  });

  const scheduleHref = `/app/profissional/${p.id}`;
  const weekdays = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      {/* HERO */}
      <section className="relative">
        <div className="h-40 md:h-56 bg-gradient-to-br from-primary via-primary/80 to-health" />
        <div className="max-w-4xl mx-auto px-5 -mt-16 pb-6">
          <div className="livvo-card p-5 md:p-6 flex flex-col md:flex-row md:items-end gap-5">
            <div className="size-24 md:size-32 rounded-2xl bg-muted overflow-hidden border-4 border-background shadow-lg shrink-0 -mt-16 md:-mt-24">
              {p.profiles?.avatar_url ? (
                <img src={p.profiles.avatar_url} alt={name} className="size-full object-cover" />
              ) : (
                <div className="size-full grid place-items-center text-3xl font-bold text-muted-foreground">{name.charAt(0)}</div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                {p.council_verified_at && <VerifiedBadge council={p.council} number={p.council_number} uf={p.council_state} size="md" />}
                {p.consultation_price ? (
                  <span className="text-xs font-mono bg-primary-soft text-primary px-2 py-0.5 rounded-full font-bold">a partir de R$ {Number(p.consultation_price).toFixed(0)}</span>
                ) : null}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{name}</h1>
              <p className="text-sm text-muted-foreground">{spec}{p.secondary_specialties?.length ? ` · ${p.secondary_specialties.slice(0, 2).join(", ")}` : ""}</p>
              <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                {(p.address_city || p.address_state) && (
                  <span className="inline-flex items-center gap-1"><MapPin className="size-3" /> {[p.address_city, p.address_state].filter(Boolean).join(" / ")}</span>
                )}
                <span className="inline-flex items-center gap-1"><Star className="size-3 fill-amber-400 text-amber-400" /> {Number(p.rating_average ?? 0).toFixed(1)} ({p.rating_count ?? 0})</span>
              </div>
            </div>
            <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
              <Button asChild size="lg" className="shadow"><Link to={scheduleHref}><Calendar className="size-4 mr-2" /> Agendar</Link></Button>
              <div className="flex gap-2">
                <FavoriteButton professionalId={p.id} />
                <ShareMenu url={url} title={`${name} — ${spec}`} text="Confira este perfil na Livvo" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-5 pb-16 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {p.bio && (
            <section className="livvo-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Sobre</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line">{p.bio}</p>
            </section>
          )}

          {(p.years_experience || p.academic_formation || p.postgrad || p.certifications?.length) && (
            <section className="livvo-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Award className="size-4" /> Formação e experiência</h2>
              <ul className="text-sm space-y-2">
                {p.years_experience && <li>• {p.years_experience} anos de experiência</li>}
                {p.academic_formation && <li>• {p.academic_formation}</li>}
                {p.postgrad && <li>• {p.postgrad}</li>}
                {p.certifications?.map((c: string, i: number) => <li key={i}>• {c}</li>)}
              </ul>
            </section>
          )}

          {services && services.length > 0 && (
            <section className="livvo-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Briefcase className="size-4" /> Procedimentos e exames</h2>
              <div className="space-y-2">
                {services.map((s) => (
                  <div key={s.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                    <div>
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground inline-flex items-center gap-1"><Clock className="size-3" /> {s.duration_minutes}min</p>
                    </div>
                    <p className="font-mono font-bold text-sm">R$ {Number(s.price).toFixed(0)}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {reviews && reviews.length > 0 && (
            <section className="livvo-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Avaliações</h2>
              <div className="space-y-3">
                {reviews.map((r, i) => (
                  <div key={i} className="border-b border-border last:border-0 pb-3 last:pb-0">
                    <div className="flex gap-1 text-amber-500 text-sm">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                    {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          {hours && hours.length > 0 && (
            <section className="livvo-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Clock className="size-4" /> Horários</h2>
              <ul className="text-xs space-y-1.5">
                {hours.map((h) => (
                  <li key={h.weekday} className="flex justify-between">
                    <span className="font-semibold">{weekdays[h.weekday]}</span>
                    <span className="text-muted-foreground">
                      {h.closed || !h.opens_at ? "Fechado" : `${h.opens_at.slice(0, 5)}–${h.closes_at?.slice(0, 5)}`}
                    </span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {p.languages?.length ? (
            <section className="livvo-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2"><Languages className="size-4" /> Idiomas</h2>
              <div className="flex flex-wrap gap-1.5">
                {p.languages.map((l: string) => <span key={l} className="text-xs bg-muted px-2 py-1 rounded-full">{l}</span>)}
              </div>
            </section>
          ) : null}

          {(p.instagram || p.website) && (
            <section className="livvo-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Contato</h2>
              <ul className="text-sm space-y-2">
                {p.instagram && <li><a href={`https://instagram.com/${p.instagram.replace(/^@/, "")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary"><Instagram className="size-4" /> @{p.instagram.replace(/^@/, "")}</a></li>}
                {p.website && <li><a href={p.website} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 hover:text-primary"><Globe className="size-4" /> Site</a></li>}
              </ul>
            </section>
          )}

          {(p.latitude && p.longitude) ? (
            <section className="livvo-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2"><MapPin className="size-4" /> Localização</h2>
              <p className="text-sm">{[p.address_street, p.address_city, p.address_state].filter(Boolean).join(", ")}</p>
              <a href={`https://www.google.com/maps/search/?api=1&query=${p.latitude},${p.longitude}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-primary mt-2 hover:underline">
                Abrir no Google Maps <ArrowRight className="size-3" />
              </a>
            </section>
          ) : null}

          <section className="livvo-card p-5 bg-primary-soft/50 border-primary/20">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="size-4 text-primary" />
              <h3 className="text-sm font-bold">Parceiro Verificado Livvo</h3>
            </div>
            <p className="text-xs text-muted-foreground">Conselho, documentos e identidade validados pela equipe Livvo.</p>
          </section>
        </aside>
      </main>

      <MarketingFooter />
    </div>
  );
}
