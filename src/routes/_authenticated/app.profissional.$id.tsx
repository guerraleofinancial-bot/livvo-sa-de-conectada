import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { ArrowLeft, MapPin, Star, Calendar, MessageSquare, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
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

  const { data: pro } = useQuery({
    queryKey: ["pro", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("professionals")
        .select("*, profiles:id(full_name, avatar_url, city, state), specialties(name)")
        .eq("id", id)
        .single();
      return data;
    },
  });

  const { data: avail } = useQuery({
    queryKey: ["avail", id],
    queryFn: async () => (await supabase.from("professional_availability").select("*").eq("professional_id", id).eq("active", true)).data ?? [],
  });

  const { data: reviews } = useQuery({
    queryKey: ["reviews", id],
    queryFn: async () => (await supabase.from("reviews").select("rating, comment, created_at").eq("professional_id", id).order("created_at", { ascending: false }).limit(3)).data ?? [],
  });

  // Build next 14 days of slots based on availability
  const slots: Date[] = [];
  if (avail && avail.length) {
    for (let d = 1; d <= 14; d++) {
      const day = new Date();
      day.setDate(day.getDate() + d);
      const dow = day.getDay();
      const todays = avail.filter((a) => a.day_of_week === dow);
      todays.forEach((a) => {
        const [sh, sm] = a.start_time.split(":").map(Number);
        const [eh] = a.end_time.split(":").map(Number);
        for (let h = sh; h < eh; h++) {
          const slot = new Date(day);
          slot.setHours(h, sm || 0, 0, 0);
          slots.push(slot);
        }
      });
    }
  }

  const book = useMutation({
    mutationFn: async () => {
      if (!user || !selectedSlot || !pro) throw new Error("Dados incompletos");
      const { data: appt, error } = await supabase.from("appointments").insert({
        patient_id: user.id,
        professional_id: pro.id,
        scheduled_at: selectedSlot.toISOString(),
        duration_minutes: 30,
        modality: pro.modality,
        status: "agendada",
        price: pro.consultation_price,
      }).select().single();
      if (error) throw error;
      return appt;
    },
    onSuccess: (appt) => {
      toast.success("Consulta agendada!", { description: "Você já pode conversar com o profissional." });
      qc.invalidateQueries({ queryKey: ["next-appt"] });
      navigate({ to: "/app/consultas" });
      // Best-effort notification
      void supabase.from("notifications").insert({ user_id: user!.id, title: "Consulta agendada", body: `Nova consulta em ${new Date(appt.scheduled_at).toLocaleString("pt-BR")}` });
    },
    onError: (e) => toast.error("Não foi possível agendar", { description: (e as Error).message }),
  });

  if (!pro) return <div className="p-8 text-center text-sm text-muted-foreground">Carregando...</div>;
  const p = pro as typeof pro & { profiles: { full_name?: string; avatar_url?: string; city?: string; state?: string } | null; specialties: { name?: string } | null };

  return (
    <div className="pb-8">
      <div className="bg-primary text-primary-foreground px-5 pt-10 pb-6 rounded-b-3xl">
        <Link to="/app/buscar" className="inline-flex size-9 items-center justify-center rounded-full bg-white/20 mb-5">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="size-20 rounded-full bg-white/20 grid place-items-center text-2xl font-bold border-2 border-white/30 overflow-hidden">
            {p.profiles?.avatar_url ? <img src={p.profiles.avatar_url} className="size-full object-cover" alt="" /> : (p.profiles?.full_name ?? "?").charAt(0)}
          </div>
          <div className="min-w-0">
            <h1 className="text-xl font-bold truncate">{p.profiles?.full_name}</h1>
            <p className="text-sm opacity-90">{p.specialties?.name}</p>
            <p className="text-xs opacity-75 mt-1 flex items-center gap-1"><Star className="size-3 fill-current" /> {Number(p.rating_average).toFixed(1)} · {p.rating_count} avaliações</p>
          </div>
        </div>
      </div>

      <div className="px-5 pt-6 space-y-6">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl bg-card border border-border p-3">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Valor</p>
            <p className="font-mono text-sm font-bold mt-1">R$ {Number(p.consultation_price).toFixed(0)}</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Modalidade</p>
            <p className="text-sm font-semibold mt-1 capitalize">{p.modality}</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-3">
            <p className="text-[10px] uppercase font-bold text-muted-foreground">Registro</p>
            <p className="text-xs font-semibold mt-1 truncate">{p.professional_registry}</p>
          </div>
        </div>

        {p.bio && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Sobre</h2>
            <p className="text-sm leading-relaxed">{p.bio}</p>
          </section>
        )}

        {(p.address_city || p.address_street) && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-2"><MapPin className="size-3" /> Endereço</h2>
            <p className="text-sm">{[p.address_street, p.address_city, p.address_state].filter(Boolean).join(", ")}</p>
          </section>
        )}

        <section>
          <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-2"><Calendar className="size-3" /> Horários disponíveis</h2>
          {slots.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sem horários disponíveis no momento.</p>
          ) : (
            <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
              {slots.slice(0, 24).map((s, i) => {
                const active = selectedSlot?.getTime() === s.getTime();
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedSlot(s)}
                    className={`p-3 rounded-xl border text-center text-xs font-semibold transition ${active ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border hover:border-primary/30"}`}
                  >
                    <p className="font-bold">{s.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</p>
                    <p className="opacity-80 mt-0.5">{s.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {reviews && reviews.length > 0 && (
          <section>
            <h2 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">Avaliações</h2>
            <div className="space-y-2">
              {reviews.map((r, i) => (
                <div key={i} className="rounded-xl bg-card border border-border p-3">
                  <div className="flex gap-1 text-amber-500 text-xs">{"★".repeat(r.rating)}{"☆".repeat(5 - r.rating)}</div>
                  {r.comment && <p className="text-sm mt-1">{r.comment}</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-20 z-30 px-5 max-w-md mx-auto">
        <Button
          disabled={!selectedSlot || book.isPending}
          onClick={() => book.mutate()}
          size="lg"
          className="w-full rounded-2xl shadow-[var(--shadow-elevated)]"
        >
          {book.isPending ? "Agendando..." : selectedSlot ? `Agendar para ${selectedSlot.toLocaleDateString("pt-BR")} às ${selectedSlot.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}` : "Selecione um horário"}
        </Button>
      </div>
    </div>
  );
}
