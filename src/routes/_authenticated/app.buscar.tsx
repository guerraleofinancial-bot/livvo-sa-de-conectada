import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Search as SearchIcon, ArrowLeft, MapPin, Star, Building2, SlidersHorizontal, Sparkles, Crown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { VerifiedBadge } from "@/components/livvo/VerifiedBadge";
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

  const { data: ranked } = useQuery<Ranked[]>({
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

  // Fire impressions once per (subscription_id, query) for sponsored rows
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

  const groups: Array<{ title: string; rank: number; items: Ranked[]; sponsored: boolean }> = [
    { title: "Patrocinado", rank: 1, items: (ranked ?? []).filter((r) => r.rank_group === 1), sponsored: true },
    { title: "Em destaque na sua região", rank: 2, items: (ranked ?? []).filter((r) => r.rank_group === 2), sponsored: true },
    { title: "Em destaque na categoria", rank: 3, items: (ranked ?? []).filter((r) => r.rank_group === 3), sponsored: true },
    { title: "Profissionais", rank: 4, items: (ranked ?? []).filter((r) => r.rank_group === 4), sponsored: false },
  ];

  const { data: companies } = useQuery({
    queryKey: ["search-companies", q, city],
    queryFn: async () => {
      let query = supabase.from("companies").select("id, legal_name, trade_name, type, address_city, address_state, logo_url").eq("status", "aprovado");
      if (city.trim()) query = query.ilike("address_city", `%${city}%`);
      if (q.trim()) query = query.or(`legal_name.ilike.%${q}%,trade_name.ilike.%${q}%`);
      return (await query.limit(15)).data ?? [];
    },
  });

  return (
    <div className="px-5 pt-10 pb-8 space-y-5">
      <header className="flex items-center gap-3">
        <Link to="/app" className="size-10 rounded-full border border-border bg-card grid place-items-center"><ArrowLeft className="size-4" /></Link>
        <h1 className="text-lg font-bold">Buscar</h1>
      </header>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Nome, clínica ou exame" className="h-12 pl-11 pr-12 rounded-2xl bg-card" />
        <button onClick={() => setShowFilters(!showFilters)} className="absolute right-3 top-1/2 -translate-y-1/2 size-8 rounded-xl bg-primary-soft text-primary grid place-items-center">
          <SlidersHorizontal className="size-4" />
        </button>
      </div>

      {showFilters && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3 text-sm">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Estado</label>
              <Input value={state} onChange={(e) => setState(e.target.value.toUpperCase())} placeholder="MA" maxLength={2} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground">Cidade</label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="São Luís" />
            </div>
          </div>
        </div>
      )}

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
        <button onClick={() => setSpecSlug(undefined)} className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 border ${!specSlug ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>Todas</button>
        {(specs ?? []).map((s) => (
          <button key={s.id} onClick={() => setSpecSlug(s.slug)} className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 border ${specSlug === s.slug ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}>{s.name}</button>
        ))}
      </div>

      {companies && companies.length > 0 && (
        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Clínicas e laboratórios</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
            {companies.map((c) => (
              <Link key={c.id} to="/app/empresa/$id" params={{ id: c.id }} className="w-48 shrink-0 p-3 bg-card border border-border rounded-2xl">
                <div className="size-10 rounded-xl bg-health-soft text-health grid place-items-center mb-2"><Building2 className="size-5" /></div>
                <p className="text-sm font-semibold truncate">{c.trade_name ?? c.legal_name}</p>
                <p className="text-[10px] uppercase font-bold text-muted-foreground mt-0.5">{c.type}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="size-3" /> {c.address_city ?? "—"}</p>
              </Link>
            ))}
          </div>
        </section>
      )}

      {groups.map((g) => g.items.length > 0 && (
        <section key={g.rank}>
          <h2 className="text-xs font-bold uppercase tracking-wider mb-2 flex items-center gap-1.5">
            {g.sponsored && <Sparkles className="size-3 text-amber-500" />}
            <span className={g.sponsored ? "text-amber-600" : "text-muted-foreground"}>{g.title}</span>
          </h2>
          <div className="space-y-3">
            {g.items.map((p) => (
              <Link
                key={p.professional_id}
                to="/app/profissional/$id"
                params={{ id: p.professional_id }}
                onClick={() => onSponsoredClick(p)}
                className={`block p-4 rounded-2xl shadow-sm relative ${g.sponsored ? "bg-card border-2 border-amber-400/60" : "bg-card border border-border"}`}
              >
                {g.sponsored && (
                  <span className="absolute -top-2 left-3 text-[9px] font-bold uppercase tracking-wider bg-amber-400 text-amber-950 px-2 py-0.5 rounded-full">Patrocinado</span>
                )}
                <div className="flex gap-4">
                  <div className="size-16 rounded-full bg-primary-soft shrink-0 grid place-items-center text-primary font-bold border border-border overflow-hidden">
                    {p.avatar_url ? <img src={p.avatar_url} className="size-full object-cover" alt="" /> : (p.full_name ?? "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate flex items-center gap-1.5">
                          {p.full_name}
                          {p.is_premium && <Crown className="size-3.5 text-primary" />}
                        </h3>
                        <p className="text-xs text-muted-foreground truncate">{p.specialty_name}</p>
                      </div>
                      <div className="flex items-center gap-1 text-xs font-semibold text-amber-500 shrink-0">
                        <Star className="size-3 fill-current" /> {Number(p.rating_average).toFixed(1)}
                      </div>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-1 text-[11px] text-muted-foreground"><MapPin className="size-3" /> {p.address_city ?? "—"}</div>
                      <span className="font-mono text-xs font-bold">R$ {Number(p.consultation_price).toFixed(0)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      ))}

      {ranked && ranked.length === 0 && (
        <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Nenhum profissional encontrado.</div>
      )}
    </div>
  );
}
