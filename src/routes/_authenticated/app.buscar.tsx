import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Search as SearchIcon, ArrowLeft, MapPin, Star, Building2, SlidersHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";

const searchSchema = z.object({
  specialty: z.string().optional(),
  q: z.string().optional(),
});

export const Route = createFileRoute("/_authenticated/app/buscar")({
  validateSearch: searchSchema,
  component: Buscar,
});

function Buscar() {
  const { specialty: initialSpec, q: initialQ } = Route.useSearch();
  const [q, setQ] = useState(initialQ ?? "");
  const [specSlug, setSpecSlug] = useState<string | undefined>(initialSpec);
  const [maxPrice, setMaxPrice] = useState<number>(2000);
  const [minRating, setMinRating] = useState<number>(0);
  const [city, setCity] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  const { data: specs } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => (await supabase.from("specialties").select("*").order("name")).data ?? [],
  });

  const { data: pros } = useQuery({
    queryKey: ["search-pros", q, specSlug, maxPrice, minRating, city],
    queryFn: async () => {
      let query = supabase
        .from("professionals")
        .select("id, consultation_price, rating_average, address_city, address_state, profiles:id(full_name, avatar_url), specialties!inner(name, slug)")
        .eq("status", "aprovado")
        .lte("consultation_price", maxPrice)
        .gte("rating_average", minRating);
      if (specSlug) query = query.eq("specialties.slug", specSlug);
      if (city.trim()) query = query.ilike("address_city", `%${city}%`);
      const { data } = await query.limit(30);
      let rows = data ?? [];
      if (q.trim()) {
        const term = q.toLowerCase();
        rows = rows.filter((r) => {
          const p = r as typeof r & { profiles: { full_name?: string } | null };
          return p.profiles?.full_name?.toLowerCase().includes(term);
        });
      }
      return rows;
    },
  });

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
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Cidade</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex.: São Paulo" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Preço máximo: R$ {maxPrice}</label>
            <input type="range" min={50} max={2000} step={50} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full accent-primary" />
          </div>
          <div>
            <label className="text-xs font-semibold text-muted-foreground">Avaliação mínima: {minRating.toFixed(1)} ★</label>
            <input type="range" min={0} max={5} step={0.5} value={minRating} onChange={(e) => setMinRating(Number(e.target.value))} className="w-full accent-primary" />
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

      <section>
        <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Profissionais</h2>
        <div className="space-y-3">
          {(pros ?? []).map((row) => {
            const p = row as typeof row & { profiles: { full_name?: string; avatar_url?: string } | null; specialties: { name?: string } | null };
            return (
              <Link key={p.id} to="/app/profissional/$id" params={{ id: p.id }} className="block p-4 bg-card border border-border rounded-2xl shadow-sm">
                <div className="flex gap-4">
                  <div className="size-16 rounded-full bg-primary-soft shrink-0 grid place-items-center text-primary font-bold border border-border overflow-hidden">
                    {p.profiles?.avatar_url ? <img src={p.profiles.avatar_url} className="size-full object-cover" alt="" /> : (p.profiles?.full_name ?? "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h3 className="text-sm font-semibold truncate">{p.profiles?.full_name}</h3>
                        <p className="text-xs text-muted-foreground truncate">{p.specialties?.name}</p>
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
            );
          })}
          {pros && pros.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">Nenhum profissional encontrado.</div>
          )}
        </div>
      </section>
    </div>
  );
}
