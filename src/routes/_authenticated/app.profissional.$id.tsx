import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, MapPin, Star, Calendar, Clock, Heart, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { VerifiedBadge } from "@/components/livvo/VerifiedBadge";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/profissional/$id")({
  component: ProfileDetail,
});

function ProfileDetail() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [selectedSlot, setSelectedSlot] = useState<Date | null>(null);
  const [serviceId, setServiceId] = useState<string | undefined>(undefined);

  const { data: pro, isLoading: proLoading } = useQuery({
    queryKey: ["pro", id],
    queryFn: async () =>
      (
        await supabase
          .from("professionals")
          .select("*, profiles:profiles!professionals_profile_fkey(full_name, avatar_url, city, state), specialties(name)")
          .eq("id", id)
          .eq("status", "aprovado")
          .not("council_verified_at", "is", null)
          .maybeSingle()
      ).data,
  });

  const { data: services } = useQuery({
    queryKey: ["pro-services", id],
    queryFn: async () => (await supabase.from("services").select("*, categories(name)").eq("professional_id", id).eq("active", true)).data ?? [],
  });

  const { data: avail } = useQuery({
    queryKey: ["avail", id],
    queryFn: async () => (await supabase.from("professional_availability").select("*").eq("professional_id", id).eq("active", true)).data ?? [],
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => (await supabase.from("reviews").select("rating, comment, created_at").eq("professional_id", id).eq("status", "publicada").order("created_at", { ascending: false }).limit(3)).data ?? [],
  });

  const { data: fav } = useQuery({
    queryKey: ["fav", id, user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("favorites").select("id").eq("patient_id", user!.id).eq("professional_id", id).maybeSingle()).data,
  });

  const toggleFav = useMutation({
    mutationFn: async () => {
      if (fav) await supabase.from("favorites").delete().eq("id", fav.id);
      else await supabase.from("favorites").insert({ patient_id: user!.id, professional_id: id });
    },
    onSuccess: () => { toast.success(fav ? "Removido dos favoritos" : "Favoritado!"); qc.invalidateQueries({ queryKey: ["fav", id] }); qc.invalidateQueries({ queryKey: ["favorites"] }); },
  });

  const slots: Date[] = [];
  if (avail && avail.length) {
    for (let d = 1; d <= 14; d++) {
      const day = new Date(); day.setDate(day.getDate() + d);
      const dow = day.getDay();
      avail.filter((a) => a.day_of_week === dow).forEach((a) => {
        const [sh, sm] = a.start_time.split(":").map(Number);
        const [eh] = a.end_time.split(":").map(Number);
        for (let h = sh; h < eh; h++) {
          const slot = new Date(day); slot.setHours(h, sm || 0, 0, 0);
          slots.push(slot);
        }
      });
    }
  }

  if (proLoading) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>;
  if (!pro) return <div className="p-8 text-center text-sm text-muted-foreground">Profissional não encontrado ou indisponível.</div>;
  const p = pro as typeof pro & { profiles: { full_name?: string; avatar_url?: string } | null; specialties: { name?: string } | null };

  function goCheckout() {
    if (!selectedSlot) return;
    navigate({ to: "/app/checkout/$id", params: { id }, search: { professionalId: id, scheduledAt: selectedSlot.toISOString(), serviceId } });
  }

  return (
    <div className="pb-32 livvo-fade-in">
      {/* Hero */}
      <div className="livvo-hero-primary px-5 pt-10 pb-8 rounded-b-[28px] relative overflow-hidden shadow-[var(--shadow-hero)]">
        <div className="absolute -right-20 -top-20 size-64 rounded-full bg-white/10 blur-3xl pointer-events-none" />
        <div className="relative flex justify-between items-center mb-6">
          <Link to="/app/buscar" className="inline-flex size-10 items-center justify-center rounded-full bg-white/15 backdrop-blur hover:bg-white/25 transition-colors">
            <ArrowLeft className="size-4" />
          </Link>
          <button onClick={() => toggleFav.mutate()} className="size-10 rounded-full bg-white/15 backdrop-blur grid place-items-center hover:bg-white/25 transition-colors">
            <Heart className={`size-4 ${fav ? "fill-current" : ""}`} />
          </button>
        </div>
        <div className="relative flex items-start gap-4">
          <div className="size-24 rounded-3xl bg-white/15 ring-2 ring-white/25 grid place-items-center text-2xl font-bold overflow-hidden shrink-0 shadow-xl">
            {p.profiles?.avatar_url ? <img src={p.profiles.avatar_url} className="size-full object-cover" alt="" /> : (p.profiles?.full_name ?? "?").charAt(0)}
          </div>
          <div className="min-w-0 pt-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] opacity-80">{p.specialties?.name ?? "Profissional"}</p>
            <h1 className="text-[22px] font-semibold tracking-tight mt-0.5">{p.profiles?.full_name}</h1>
            <div className="flex flex-wrap items-center gap-1.5 mt-2">
              {p.council_verified_at && (
                <VerifiedBadge council={p.council} number={p.council_number} uf={p.council_state} size="sm" className="bg-white/15 text-white border-white/30" />
              )}
              {Number(p.rating_count) > 0 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
                  <Star className="size-3 fill-current" /> {Number(p.rating_average).toFixed(1)}
                  <span className="opacity-80">({p.rating_count})</span>
                </span>
              )}
              {(p.address_city || p.address_state) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2.5 py-1 text-[11px] font-semibold">
                  <MapPin className="size-3" /> {[p.address_city, p.address_state].filter(Boolean).join(" · ")}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-7">
        {/* KPI cards */}
        <div className="grid grid-cols-3 gap-2">
          <StatCard label="A partir de" value={`R$ ${Number(p.consultation_price).toFixed(0)}`} mono />
          <StatCard label="Modalidade" value="Presencial" />
          <StatCard label="Registro" value={p.professional_registry} small />
        </div>

        {p.bio && (
          <Section title="Sobre o profissional">
            <p className="text-sm leading-relaxed text-foreground/85">{p.bio}</p>
          </Section>
        )}

        {(p.address_city || p.address_street) && (
          <Section title="Endereço" icon={<MapPin className="size-3.5" />}>
            <p className="text-sm text-foreground/85">{[p.address_street, p.address_city, p.address_state].filter(Boolean).join(", ")}</p>
          </Section>
        )}

        {services && services.length > 0 && (
          <Section title="Serviços & valores" icon={<Briefcase className="size-3.5" />}>
            <div className="space-y-2">
              {services.map((s) => {
                const active = serviceId === s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setServiceId(active ? undefined : s.id)}
                    className={`w-full rounded-2xl border p-3.5 text-left transition-all ${active ? "border-primary bg-primary-soft shadow-[var(--shadow-glow)]" : "border-border/70 bg-card hover:border-primary/30"}`}
                  >
                    <div className="flex justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{s.name}</p>
                        <p className="mt-0.5 flex items-center gap-1 text-[11px] text-muted-foreground">
                          <Clock className="size-3" /> {s.duration_minutes} min
                        </p>
                      </div>
                      <p className="font-mono text-sm font-bold">R$ {Number(s.price).toFixed(0)}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </Section>
        )}

        <Section title="Horários disponíveis" icon={<Calendar className="size-3.5" />}>
          {slots.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-sm text-muted-foreground">
              Sem horários disponíveis no momento.
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {slots.slice(0, 24).map((s, i) => {
                const active = selectedSlot?.getTime() === s.getTime();
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedSlot(s)}
                    className={`rounded-2xl border p-3 text-center text-xs font-semibold transition-all ${active ? "bg-primary text-primary-foreground border-primary shadow-[var(--shadow-elevated)]" : "bg-card border-border/70 hover:border-primary/40 hover:-translate-y-0.5"}`}
                  >
                    <p className="font-bold">{s.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                    <p className="opacity-80 mt-0.5">{s.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </button>
                );
              })}
            </div>
          )}
        </Section>

        {reviews && reviews.length > 0 && (
          <Section title="Avaliações">
            <div className="space-y-2">
              {reviews.map((r, i) => (
                <div key={i} className="rounded-2xl bg-card border border-border/70 p-4">
                  <div className="flex gap-0.5 text-amber-500 text-xs">
                    {"★".repeat(r.rating)}<span className="text-muted-foreground/50">{"★".repeat(5 - r.rating)}</span>
                  </div>
                  {r.comment && <p className="mt-1.5 text-sm leading-relaxed text-foreground/85">{r.comment}</p>}
                </div>
              ))}
            </div>
          </Section>
        )}
      </div>

      {/* Sticky CTA */}
      <div className="fixed inset-x-0 bottom-20 z-30 px-5 max-w-md mx-auto">
        <div className="rounded-2xl bg-card/95 backdrop-blur border border-border/80 shadow-[var(--shadow-hero)] p-2">
          <Button disabled={!selectedSlot} onClick={goCheckout} size="lg" className="w-full rounded-xl h-12 text-[15px] font-semibold">
            {selectedSlot ? `Continuar para pagamento` : "Selecione um horário"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, icon, children }: { title: string; icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="livvo-slide-up">
      <h2 className="mb-3 flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground">
        {icon}
        {title}
      </h2>
      {children}
    </section>
  );
}

function StatCard({ label, value, mono, small }: { label: string; value: string; mono?: boolean; small?: boolean }) {
  return (
    <div className="rounded-2xl bg-card border border-border/70 p-3 shadow-[var(--shadow-soft)]">
      <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className={`mt-1 font-semibold ${mono ? "font-mono text-sm" : small ? "text-xs truncate" : "text-sm"}`}>{value}</p>
    </div>
  );
}
