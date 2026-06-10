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
    <div className="pb-24">
      <div className="bg-health text-health-foreground px-5 pt-10 pb-6 rounded-b-3xl">
        <div className="flex items-center justify-between mb-5">
          <Link to="/app/buscar" className="inline-flex size-9 items-center justify-center rounded-full bg-white/20"><ArrowLeft className="size-4" /></Link>
          <button onClick={() => toggleFav.mutate()} className="size-9 rounded-full bg-white/20 grid place-items-center">
            <Heart className={`size-4 ${fav ? "fill-current" : ""}`} />
          </button>
        </div>
        <div className="flex items-center gap-4">
          <div className="size-16 rounded-2xl bg-white/20 grid place-items-center"><Building2 className="size-8" /></div>
          <div>
            <p className="text-xs uppercase font-bold opacity-80 tracking-wider">{company.type}</p>
            <h1 className="text-xl font-bold">{company.trade_name ?? company.legal_name}</h1>
            <p className="text-xs opacity-80 mt-1 flex items-center gap-1"><MapPin className="size-3" /> {[company.address_city, company.address_state].filter(Boolean).join(" · ")}</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        {company.description && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Sobre</h2>
            <p className="text-sm leading-relaxed">{company.description}</p>
          </section>
        )}

        {company.phone && (
          <div className="flex items-center gap-2 text-sm"><Phone className="size-4 text-primary" /> {company.phone}</div>
        )}

        <section>
          <h2 className="text-sm font-bold mb-3">Serviços oferecidos ({services?.length ?? 0})</h2>
          <div className="space-y-2">
            {(services ?? []).map((s) => {
              const cat = (s as typeof s & { categories: { name?: string } | null }).categories;
              return (
                <Link
                  key={s.id}
                  to="/app/checkout/$id"
                  params={{ id: s.id }}
                  search={{ professionalId: company.owner_id, scheduledAt: new Date(Date.now() + 86400000).toISOString(), serviceId: s.id }}
                  className="block p-4 rounded-2xl bg-card border border-border hover:border-primary/30"
                >
                  <div className="flex justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">{s.name}</p>
                      <p className="text-xs text-muted-foreground flex items-center gap-2 mt-1">
                        {cat?.name && <span className="px-2 py-0.5 bg-primary-soft text-primary rounded-full text-[10px] font-bold uppercase">{cat.name}</span>}
                        <span className="flex items-center gap-1"><Clock className="size-3" /> {s.duration_minutes}min</span>
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-mono text-base font-bold">R$ {Number(s.price).toFixed(0)}</p>
                      <p className="text-[10px] text-primary font-semibold mt-1">Agendar →</p>
                    </div>
                  </div>
                </Link>
              );
            })}
            {services && services.length === 0 && (
              <p className="text-sm text-muted-foreground">Nenhum serviço cadastrado.</p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
