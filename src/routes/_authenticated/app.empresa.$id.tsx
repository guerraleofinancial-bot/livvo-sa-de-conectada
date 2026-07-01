import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, MapPin, Building2, Phone, Heart, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/empresa/$id")({
  component: Empresa,
});

function Empresa() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: company } = useQuery({
    queryKey: ["company", id],
    queryFn: async () => (await supabase.from("companies").select("*").eq("id", id).single()).data,
  });

  const { data: services } = useQuery({
    queryKey: ["company-services", id],
    queryFn: async () => (await supabase.from("services").select("*, categories(name)").eq("company_id", id).eq("active", true).order("name")).data ?? [],
  });

  const { data: fav } = useQuery({
    queryKey: ["fav-company", id, user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("favorites").select("id").eq("patient_id", user!.id).eq("company_id", id).maybeSingle()).data,
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (fav) await supabase.from("favorites").delete().eq("id", fav.id);
      else await supabase.from("favorites").insert({ patient_id: user!.id, company_id: id });
    },
    onSuccess: () => { toast.success(fav ? "Removido" : "Favoritado"); qc.invalidateQueries({ queryKey: ["fav-company"] }); qc.invalidateQueries({ queryKey: ["favorites"] }); },
  });

  if (!company) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>;

  return (
    <div className="pb-24 livvo-fade-in">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-b-[28px] px-5 pt-10 pb-8 text-white shadow-[var(--shadow-hero)]"
        style={{ background: "linear-gradient(135deg, hsl(160 70% 40%), hsl(173 80% 32%))" }}>
        <div className="absolute -right-16 -top-16 size-56 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative flex items-center justify-between mb-6">
          <Link to="/app/buscar" className="inline-flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25 transition-colors"><ArrowLeft className="size-4" /></Link>
          <button onClick={() => toggleFav.mutate()} className="size-10 rounded-full bg-white/15 backdrop-blur grid place-items-center hover:bg-white/25 transition-colors">
            <Heart className={`size-4 ${fav ? "fill-current" : ""}`} />
          </button>
        </div>
        <div className="relative flex items-center gap-4">
          <div className="size-20 rounded-2xl bg-white/15 ring-2 ring-white/25 grid place-items-center overflow-hidden shadow-xl">
            {company.logo_url ? <img src={company.logo_url} alt="" className="size-full object-cover" /> : <Building2 className="size-8" />}
          </div>
          <div className="min-w-0">
            <p className="text-[11px] uppercase font-semibold opacity-80 tracking-[0.14em]">{company.type}</p>
            <h1 className="text-[22px] font-semibold tracking-tight mt-0.5">{company.trade_name ?? company.legal_name}</h1>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {(company.address_city || company.address_state) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
                  <MapPin className="size-3" /> {[company.address_city, company.address_state].filter(Boolean).join(" · ")}
                </span>
              )}
              {company.phone && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
                  <Phone className="size-3" /> {company.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-7">
        {company.description && (
          <section className="livvo-slide-up">
            <h2 className="mb-3 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">Sobre a empresa</h2>
            <p className="text-sm leading-relaxed text-foreground/85">{company.description}</p>
          </section>
        )}

        <section className="livvo-slide-up">
          <div className="mb-3 flex items-end justify-between">
            <h2 className="livvo-h2">Serviços oferecidos</h2>
            <span className="livvo-subtle">{services?.length ?? 0} disponível{(services?.length ?? 0) === 1 ? "" : "is"}</span>
          </div>
          <div className="space-y-2">
            {(services ?? []).map((s) => {
              const cat = (s as typeof s & { categories: { name?: string } | null }).categories;
              return (
                <Link
                  key={s.id}
                  to="/app/checkout/$id"
                  params={{ id: s.id }}
                  search={{ professionalId: company.owner_id, scheduledAt: new Date(Date.now() + 86400000).toISOString(), serviceId: s.id }}
                  className="group block rounded-2xl border border-border/70 bg-card p-4 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[var(--shadow-lifted)]"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
                        {cat?.name && <span className="livvo-chip-primary">{cat.name}</span>}
                        <span className="livvo-chip"><Clock className="size-3" /> {s.duration_minutes} min</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-base font-bold">R$ {Number(s.price).toFixed(0)}</p>
                      <p className="mt-1 text-[11px] font-semibold text-primary opacity-70 group-hover:opacity-100 transition-opacity">Agendar →</p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {services && services.length === 0 && (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center text-sm text-muted-foreground">
                Nenhum serviço cadastrado ainda.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
