import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Bell, Search, HeartPulse, Baby, Sparkles, Brain, Stethoscope, Flower, Bone, Apple, Eye, BrainCircuit } from "lucide-react";
import { useEffect } from "react";
import { ProfessionalCard, ProfessionalCardSkeleton } from "@/components/livvo/ProfessionalCard";

export const Route = createFileRoute("/_authenticated/app/")({
  component: PatientHome,
});

const iconMap: Record<string, typeof HeartPulse> = {
  "heart-pulse": HeartPulse, baby: Baby, sparkles: Sparkles, brain: Brain,
  "brain-circuit": BrainCircuit, stethoscope: Stethoscope, flower: Flower,
  bone: Bone, apple: Apple, eye: Eye,
};

function PatientHome() {
  const { user, roles, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!roles.length) return;
    if (roles.includes("admin")) navigate({ to: "/admin" });
    else if (roles.includes("profissional") && !roles.includes("paciente")) navigate({ to: "/pro" });
  }, [loading, roles, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, avatar_url").eq("id", user!.id).single();
      return data;
    },
  });

  const { data: specs } = useQuery({
    queryKey: ["specialties"],
    queryFn: async () => {
      const { data } = await supabase.from("specialties").select("*").eq("active", true).order("name");
      return data ?? [];
    },
  });

  const { data: nextAppt } = useQuery({
    queryKey: ["next-appt", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("id, scheduled_at, status, professional_id, professionals(id, profiles:profiles!professionals_profile_fkey(full_name, avatar_url), specialties(name))")
        .eq("patient_id", user!.id)
        .in("status", ["agendada", "confirmada"])
        .gte("scheduled_at", new Date().toISOString())
        .order("scheduled_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: pros, isLoading: prosLoading } = useQuery({
    queryKey: ["pros-near"],
    queryFn: async () => {
      const { data } = await supabase
        .from("professionals")
        .select("id, consultation_price, rating_average, rating_count, address_city, address_state, council, council_number, council_state, council_verified_at, profiles:profiles!professionals_profile_fkey(full_name, avatar_url), specialties(name)")
        .eq("status", "aprovado")
        .order("rating_average", { ascending: false })
        .limit(5);
      return data ?? [];
    },
  });

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Bom dia";
    if (h < 18) return "Boa tarde";
    return "Boa noite";
  })();

  const firstName = profile?.full_name?.split(" ")[0] ?? "";

  return (
    <div className="px-5 pt-10 space-y-7 livvo-fade-in">
      {/* Header */}
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 shrink-0 rounded-full bg-primary-soft grid place-items-center text-primary font-bold ring-1 ring-border overflow-hidden">
            {profile?.avatar_url ? <img src={profile.avatar_url} alt="" className="size-full object-cover" /> : firstName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium text-muted-foreground truncate">{greeting},</p>
            <h1 className="text-lg font-bold tracking-tight truncate">Olá, {firstName || "paciente"}</h1>
          </div>
        </div>
        <button className="size-10 rounded-full border border-border bg-card grid place-items-center shadow-sm relative">
          <Bell className="size-4 text-muted-foreground" />
          <span className="absolute top-2 right-2 size-2 rounded-full bg-health" />
        </button>
      </header>

      {/* Search */}
      <Link to="/app/buscar" className="block">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <div className="h-12 pl-11 pr-4 bg-card border border-border rounded-2xl flex items-center text-sm text-muted-foreground shadow-sm">
            Encontre profissionais de saúde
          </div>
        </div>
      </Link>

      {/* Specialties */}
      <section className="livvo-slide-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Especialidades</h2>
          <Link to="/app/buscar" className="text-xs font-semibold text-primary">Ver todas</Link>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-5 px-5">
          {(specs ?? []).map((s, i) => {
            const Icon = iconMap[s.icon ?? ""] ?? Stethoscope;
            const tinted = i % 2 === 0;
            return (
              <Link
                key={s.id}
                to="/app/buscar"
                search={{ specialty: s.slug }}
                className="flex flex-col items-center gap-2 shrink-0 w-20"
              >
                <div className={`size-14 rounded-2xl border flex items-center justify-center ${tinted ? "bg-primary-soft border-primary/10 text-primary" : "bg-health-soft border-health/10 text-health"}`}>
                  <Icon className="size-6" />
                </div>
                <span className="text-[11px] font-medium text-center leading-tight line-clamp-2 break-words">{s.name}</span>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Next appointment */}
      {nextAppt && (
        <section className="livvo-slide-up">
          <div className="rounded-3xl bg-primary text-primary-foreground p-5 shadow-[var(--shadow-elevated)] relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex justify-between items-start mb-5">
                <div>
                  <span className="inline-block px-2 py-0.5 bg-white/20 rounded text-[10px] font-bold uppercase tracking-wide mb-2">Próxima consulta</span>
                  <p className="text-base font-semibold">
                    {new Date(nextAppt.scheduled_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}
                    {" · "}
                    {new Date(nextAppt.scheduled_at).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="min-w-0">
                  
                  <p className="text-sm font-semibold truncate">{(nextAppt as any).professionals?.profiles?.full_name}</p>
                  
                  <p className="text-xs opacity-80 truncate">{(nextAppt as any).professionals?.specialties?.name}</p>
                </div>
                <Link to="/app/consultas" className="px-4 py-2 bg-white text-primary text-xs font-bold rounded-xl">Ver</Link>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl pointer-events-none" />
          </div>
        </section>
      )}

      {/* Pros near you */}
      <section className="livvo-slide-up">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-bold">Profissionais bem avaliados</h2>
          <Link to="/app/buscar" className="text-xs font-semibold text-primary">Ver todos</Link>
        </div>
        <div className="space-y-3">
          {(pros ?? []).map((row) => {
            const p = row as typeof row & { profiles: { full_name?: string; avatar_url?: string } | null; specialties: { name?: string } | null };
            return (
            <Link
              key={p.id}
              to="/app/profissional/$id"
              params={{ id: p.id }}
              className="block p-4 bg-card border border-border rounded-2xl shadow-sm hover:border-primary/30 transition-colors"
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
                      <span>★</span> {Number(p.rating_average).toFixed(1)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="font-mono text-[11px] text-muted-foreground flex gap-3">
                      <span>{p.address_city ?? "—"}</span>
                      <span className="text-foreground font-bold">R$ {Number(p.consultation_price).toFixed(0)}</span>
                    </div>
                    <div className="px-3 py-1.5 bg-health text-white text-[11px] font-bold rounded-lg shadow-sm shadow-health/20">
                      Agendar
                    </div>
                  </div>
                </div>
              </div>
            </Link>
            );
          })}
          {pros && pros.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
              Nenhum profissional disponível ainda.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
