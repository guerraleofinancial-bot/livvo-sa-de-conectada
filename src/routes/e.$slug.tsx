import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { MapPin, Building2, Phone, Mail, Calendar, Clock, ArrowRight, ShieldCheck, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ShareMenu } from "@/components/livvo/share-menu";
import { FavoriteButton } from "@/components/livvo/favorite-button";
import { MarketingNav, MarketingFooter } from "@/components/livvo/marketing-shell";

const SITE = "https://livvo-conecta-saude.lovable.app";

async function loadCompany(slug: string) {
  let q = supabase.from("companies").select("*").eq("status", "aprovado");
  q = /^[0-9a-f]{8}-/i.test(slug) ? q.eq("id", slug) : q.eq("slug", slug);
  const { data } = await q.maybeSingle();
  if (!data) throw notFound();
  return data;
}

export const Route = createFileRoute("/e/$slug")({
  loader: async ({ params }) => {
    const company = await loadCompany(params.slug);
    return { company };
  },
  head: ({ params, loaderData }) => {
    const c = loaderData?.company as
      | { trade_name?: string; legal_name?: string; description?: string; address_city?: string; address_state?: string; logo_url?: string; type?: string }
      | undefined;
    const name = c?.trade_name || c?.legal_name || "Empresa";
    const loc = [c?.address_city, c?.address_state].filter(Boolean).join(" / ");
    const title = `${name}${loc ? " — " + loc : ""} | Livvo`;
    const desc = c?.description?.slice(0, 155) || `Conheça ${name}${loc ? " em " + loc : ""} na Livvo — agende consultas, exames e procedimentos.`;
    const url = `${SITE}/e/${params.slug}`;
    return {
      meta: [
        { title },
        { name: "description", content: desc },
        { property: "og:title", content: title },
        { property: "og:description", content: desc },
        { property: "og:type", content: "website" },
        { property: "og:url", content: url },
        ...(c?.logo_url ? [{ property: "og:image", content: c.logo_url }] : []),
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: url }],
      scripts: c ? [{
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "MedicalBusiness",
          name,
          url,
          image: c.logo_url,
          address: loc ? { "@type": "PostalAddress", addressLocality: c.address_city, addressRegion: c.address_state, addressCountry: "BR" } : undefined,
        }),
      }] : [],
    };
  },
  component: PublicCompany,
  errorComponent: ({ error }) => (
    <div className="max-w-md mx-auto p-8 text-center">
      <p className="text-sm text-muted-foreground">Não foi possível carregar este perfil.</p>
      <p className="text-xs text-muted-foreground mt-2">{error.message}</p>
    </div>
  ),
  notFoundComponent: () => (
    <div className="max-w-md mx-auto p-8 text-center">
      <h1 className="text-xl font-bold">Empresa indisponível</h1>
      <p className="text-sm text-muted-foreground mt-2">Este perfil pode ter sido removido ou ainda está em análise.</p>
      <Link to="/" className="inline-block mt-4 text-primary underline text-sm">Voltar ao início</Link>
    </div>
  ),
});

function PublicCompany() {
  const { company: c } = Route.useLoaderData();
  const name = c.trade_name || c.legal_name || "Empresa";
  const url = typeof window !== "undefined" ? window.location.href : `${SITE}/e/${c.slug}`;

  const { data: services } = useQuery({
    queryKey: ["public-company-services", c.id],
    queryFn: async () =>
      (await supabase.from("services").select("id,name,price,duration_minutes,categories(name)").eq("company_id", c.id).eq("active", true).order("name")).data ?? [],
  });

  const { data: units } = useQuery({
    queryKey: ["public-company-units", c.id],
    queryFn: async () =>
      (await supabase.from("company_units").select("id,name,address_street,address_city,address_state,latitude,longitude").eq("company_id", c.id).eq("active", true)).data ?? [],
  });

  return (
    <div className="min-h-screen bg-background">
      <MarketingNav />

      <section className="relative">
        <div className="h-40 md:h-56 bg-gradient-to-br from-health via-health/80 to-primary" />
        <div className="max-w-4xl mx-auto px-5 -mt-16 pb-6">
          <div className="livvo-card p-5 md:p-6 flex flex-col md:flex-row md:items-end gap-5">
            <div className="size-24 md:size-32 rounded-2xl bg-muted overflow-hidden border-4 border-background shadow-lg shrink-0 -mt-16 md:-mt-24 grid place-items-center">
              {c.logo_url ? <img src={c.logo_url} alt={name} className="size-full object-cover" /> : <Building2 className="size-10 text-muted-foreground" />}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">{c.type}</p>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{name}</h1>
              {(c.address_city || c.address_state) && (
                <p className="text-sm text-muted-foreground inline-flex items-center gap-1 mt-1"><MapPin className="size-3" /> {[c.address_city, c.address_state].filter(Boolean).join(" / ")}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 md:flex-col md:items-stretch">
              <Button asChild size="lg" className="shadow"><Link to="/app/empresa/$id" params={{ id: c.id }}><Calendar className="size-4 mr-2" /> Agendar</Link></Button>
              <div className="flex gap-2">
                <FavoriteButton companyId={c.id} />
                <ShareMenu url={url} title={name} text="Confira este perfil na Livvo" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <main className="max-w-4xl mx-auto px-5 pb-16 grid md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          {c.description && (
            <section className="livvo-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">História</h2>
              <p className="text-sm leading-relaxed whitespace-pre-line">{c.description}</p>
            </section>
          )}

          {services && services.length > 0 && (
            <section className="livvo-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Serviços oferecidos ({services.length})</h2>
              <div className="space-y-2">
                {services.map((s) => {
                  const cat = (s as typeof s & { categories: { name?: string } | null }).categories;
                  return (
                    <div key={s.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                      <div>
                        <p className="text-sm font-semibold">{s.name}</p>
                        <p className="text-xs text-muted-foreground inline-flex items-center gap-2 mt-0.5">
                          {cat?.name && <span className="px-2 py-0.5 bg-primary-soft text-primary rounded-full text-[10px] font-bold uppercase">{cat.name}</span>}
                          <span className="inline-flex items-center gap-1"><Clock className="size-3" /> {s.duration_minutes}min</span>
                        </p>
                      </div>
                      <p className="font-mono font-bold text-sm">R$ {Number(s.price).toFixed(0)}</p>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {units && units.length > 0 && (
            <section className="livvo-card p-5">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Unidades</h2>
              <div className="space-y-3">
                {units.map((u) => (
                  <div key={u.id} className="flex items-start justify-between gap-3 border-b border-border last:border-0 pb-3 last:pb-0">
                    <div>
                      <p className="text-sm font-semibold">{u.name}</p>
                      <p className="text-xs text-muted-foreground">{[u.address_street, u.address_city, u.address_state].filter(Boolean).join(", ")}</p>
                    </div>
                    {u.latitude && u.longitude && (
                      <a href={`https://www.google.com/maps/search/?api=1&query=${u.latitude},${u.longitude}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary inline-flex items-center gap-1 shrink-0 hover:underline">
                        Mapa <ArrowRight className="size-3" />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="space-y-6">
          <section className="livvo-card p-5">
            <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-2">Contato</h2>
            <ul className="text-sm space-y-2">
              {c.phone && <li className="inline-flex items-center gap-2"><Phone className="size-4 text-primary" /> {c.phone}</li>}
              {c.email && <li className="inline-flex items-center gap-2"><Mail className="size-4 text-primary" /> {c.email}</li>}
              {(c.address_street || c.address_city) && (
                <li className="inline-flex items-start gap-2"><MapPin className="size-4 text-primary mt-0.5" /> <span>{[c.address_street, c.address_city, c.address_state].filter(Boolean).join(", ")}</span></li>
              )}
            </ul>
          </section>

          <section className="livvo-card p-5 bg-health-soft border-health/20">
            <div className="flex items-center gap-2 mb-2">
              <ShieldCheck className="size-4 text-health" />
              <h3 className="text-sm font-bold">Empresa aprovada Livvo</h3>
            </div>
            <p className="text-xs text-muted-foreground">Cadastro validado pela equipe Livvo.</p>
          </section>
        </aside>
      </main>

      <MarketingFooter />
    </div>
  );
}
