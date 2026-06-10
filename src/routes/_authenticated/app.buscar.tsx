import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Search as SearchIcon, ArrowLeft, MapPin, Star } from "lucide-react";
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

  const { data: specs } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => (await supabase.from("specialties").select("*").order("name")).data ?? [],
  });

  const { data: results } = useQuery({
    queryKey: ["search", q, specSlug],
    queryFn: async () => {
      let query = supabase
        .from("professionals")
        .select("id, consultation_price, rating_average, address_city, address_state, modality, profiles:id(full_name, avatar_url), specialties!inner(name, slug)")
        .eq("status", "aprovado");
      if (specSlug) query = query.eq("specialties.slug", specSlug);
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

  return (
    <div className="px-5 pt-10 space-y-5">
      <header className="flex items-center gap-3">
        <Link to="/app" className="size-10 rounded-full border border-border bg-card grid place-items-center">
          <ArrowLeft className="size-4" />
        </Link>
        <h1 className="text-lg font-bold">Buscar profissionais</h1>
      </header>

      <div className="relative">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por nome..."
          className="h-12 pl-11 rounded-2xl bg-card"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5 pb-1">
        <button
          onClick={() => setSpecSlug(undefined)}
          className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 border ${!specSlug ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}
        >
          Todas
        </button>
        {(specs ?? []).map((s) => (
          <button
            key={s.id}
            onClick={() => setSpecSlug(s.slug)}
            className={`px-4 py-2 rounded-full text-xs font-semibold shrink-0 border ${specSlug === s.slug ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}
          >
            {s.name}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {(results ?? []).map((row) => {
          const p = row as typeof row & { profiles: { full_name?: string; avatar_url?: string } | null; specialties: { name?: string } | null };
          return (
            <Link
              key={p.id}
              to="/app/profissional/$id"
              params={{ id: p.id }}
              className="block p-4 bg-card border border-border rounded-2xl shadow-sm"
            >
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
                    <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                      <MapPin className="size-3" /> {p.address_city ?? "—"}
                    </div>
                    <span className="font-mono text-xs font-bold">R$ {Number(p.consultation_price).toFixed(0)}</span>
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
        {results && results.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum profissional encontrado.
          </div>
        )}
      </div>
    </div>
  );
}
