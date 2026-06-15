import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Heart, Star, MapPin, Building2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/favoritos")({
  component: Favoritos,
});

function Favoritos() {
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: favs } = useQuery({
    queryKey: ["favorites", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("favorites")
        .select(`
          id, professional_id, company_id,
          professionals(id, consultation_price, rating_average, address_city, profiles:profiles!professionals_profile_fkey(full_name, avatar_url), specialties(name)),
          companies(id, legal_name, trade_name, type, address_city, logo_url)
        `)
        .eq("patient_id", user!.id);
      return data ?? [];
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("favorites").delete().eq("id", id); },
    onSuccess: () => { toast.success("Removido dos favoritos"); qc.invalidateQueries({ queryKey: ["favorites"] }); },
  });

  return (
    <div className="px-5 pt-10 pb-8 space-y-4 livvo-fade-in">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Favoritos</h1>
        <p className="text-sm text-muted-foreground">Seus profissionais e clínicas salvos</p>
      </header>

      <div className="space-y-3">
        {(favs ?? []).map((f) => {
          const row = f as typeof f & {
            professionals: { id: string; consultation_price: number; rating_average: number; address_city: string | null; profiles: { full_name?: string; avatar_url?: string } | null; specialties: { name?: string } | null } | null;
            companies: { id: string; legal_name: string; trade_name: string | null; type: string; address_city: string | null; logo_url: string | null } | null;
          };
          if (row.professionals) {
            const p = row.professionals;
            return (
              <div key={f.id} className="p-4 bg-card border border-border rounded-2xl shadow-sm flex gap-3">
                <Link to="/app/profissional/$id" params={{ id: p.id }} className="flex-1 flex gap-3 min-w-0">
                  <div className="size-14 rounded-full bg-primary-soft grid place-items-center text-primary font-bold overflow-hidden shrink-0">
                    {p.profiles?.avatar_url ? <img src={p.profiles.avatar_url} className="size-full object-cover" alt="" /> : (p.profiles?.full_name ?? "?").charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{p.profiles?.full_name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.specialties?.name}</p>
                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground mt-1">
                      <span className="flex items-center gap-1 text-amber-500"><Star className="size-3 fill-current" /> {Number(p.rating_average).toFixed(1)}</span>
                      <span className="flex items-center gap-1"><MapPin className="size-3" /> {p.address_city ?? "—"}</span>
                    </div>
                  </div>
                </Link>
                <button onClick={() => remove.mutate(f.id)} className="text-destructive shrink-0"><Heart className="size-5 fill-current" /></button>
              </div>
            );
          }
          if (row.companies) {
            const c = row.companies;
            return (
              <div key={f.id} className="p-4 bg-card border border-border rounded-2xl shadow-sm flex gap-3">
                <Link to="/app/empresa/$id" params={{ id: c.id }} className="flex-1 flex gap-3 min-w-0">
                  <div className="size-14 rounded-2xl bg-health-soft text-health grid place-items-center shrink-0">
                    <Building2 className="size-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate">{c.trade_name ?? c.legal_name}</p>
                    <p className="text-xs text-muted-foreground capitalize">{c.type}</p>
                    <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-1"><MapPin className="size-3" /> {c.address_city ?? "—"}</p>
                  </div>
                </Link>
                <button onClick={() => remove.mutate(f.id)} className="text-destructive shrink-0"><Heart className="size-5 fill-current" /></button>
              </div>
            );
          }
          return null;
        })}
        {favs && favs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center">
            <Heart className="size-8 text-muted-foreground mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">Você ainda não tem favoritos</p>
            <Link to="/app/buscar" className="text-xs font-semibold text-primary mt-2 inline-block">Buscar profissionais</Link>
          </div>
        )}
      </div>
    </div>
  );
}
