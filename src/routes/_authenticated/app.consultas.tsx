import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Calendar, Clock, MessageSquare, XCircle, CheckCircle2, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/app/consultas")({
  component: Consultas,
});

function Consultas() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [tab, setTab] = useState<"upcoming" | "past">("upcoming");
  const [ratingFor, setRatingFor] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");

  const { data: appts } = useQuery({
    queryKey: ["my-appts", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("appointments")
        .select("*, professionals(id, profiles:profiles!professionals_profile_fkey(full_name, avatar_url), specialties(name)), reviews(id)")
        .eq("patient_id", user!.id)
        .order("scheduled_at", { ascending: false });
      return data ?? [];
    },
  });

  const cancel = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("appointments").update({ status: "cancelada", cancelled_at: new Date().toISOString(), cancelled_by: user!.id }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Consulta cancelada"); qc.invalidateQueries({ queryKey: ["my-appts"] }); },
  });

  const submitReview = useMutation({
    mutationFn: async () => {
      const appt = appts!.find((a) => a.id === ratingFor)!;
      const { error } = await supabase.from("reviews").insert({
        appointment_id: appt.id, patient_id: user!.id, professional_id: appt.professional_id, rating, comment: comment.trim() || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Avaliação enviada!"); setRatingFor(null); setComment(""); setRating(5); qc.invalidateQueries({ queryKey: ["my-appts"] }); },
    onError: (e) => toast.error("Erro", { description: (e as Error).message }),
  });

  const now = Date.now();
  const upcoming = (appts ?? []).filter((a) => new Date(a.scheduled_at).getTime() >= now && !["cancelada", "realizada", "nao_compareceu"].includes(a.status));
  const past = (appts ?? []).filter((a) => !upcoming.includes(a));
  const shown = tab === "upcoming" ? upcoming : past;

  return (
    <div className="px-5 pt-10 space-y-5 livvo-fade-in">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">Minhas consultas</h1>
        <p className="text-sm text-muted-foreground mt-1">Acompanhe seus agendamentos</p>
      </header>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        <button onClick={() => setTab("upcoming")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === "upcoming" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Próximas ({upcoming.length})</button>
        <button onClick={() => setTab("past")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === "past" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Histórico ({past.length})</button>
      </div>

      <div className="space-y-3">
        {shown.map((row) => {
          const a = row as typeof row & { professionals: { profiles: { full_name?: string; avatar_url?: string } | null; specialties: { name?: string } | null } | null; reviews?: { id: string }[] };
          const d = new Date(a.scheduled_at);
          const isFuture = d.getTime() >= now;
          const canChat = ["agendada", "confirmada", "em_andamento", "realizada"].includes(a.status);
          return (
            <div key={a.id} className="rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="size-12 rounded-full bg-primary-soft grid place-items-center text-primary font-bold border border-border overflow-hidden shrink-0">
                  {a.professionals?.profiles?.avatar_url ? <img src={a.professionals.profiles.avatar_url} className="size-full object-cover" alt="" /> : (a.professionals?.profiles?.full_name ?? "?").charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold truncate">{a.professionals?.profiles?.full_name}</h3>
                  <p className="text-xs text-muted-foreground">{a.professionals?.specialties?.name}</p>
                  <div className="mt-2 flex items-center gap-3 text-xs">
                    <span className="flex items-center gap-1"><Calendar className="size-3" /> {d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" })}</span>
                    <span className="flex items-center gap-1"><Clock className="size-3" /> {d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                      a.status === "confirmada" ? "bg-health-soft text-health" :
                      a.status === "cancelada" ? "bg-destructive/10 text-destructive" :
                      a.status === "realizada" ? "bg-muted text-muted-foreground" :
                      "bg-primary-soft text-primary"
                    }`}>{a.status.replace("_", " ")}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                {canChat && (
                  <Link to="/app/chat/$id" params={{ id: a.id }} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full rounded-lg gap-1"><MessageSquare className="size-3" /> Chat</Button>
                  </Link>
                )}
                {isFuture && a.status !== "cancelada" && (
                  <Button variant="ghost" size="sm" className="flex-1 rounded-lg gap-1 text-destructive" onClick={() => cancel.mutate(a.id)}>
                    <XCircle className="size-3" /> Cancelar
                  </Button>
                )}
                {a.status === "realizada" && !(a.reviews && a.reviews.length) && (
                  <Button size="sm" className="flex-1 rounded-lg gap-1" onClick={() => setRatingFor(a.id)}>
                    <Star className="size-3" /> Avaliar
                  </Button>
                )}
              </div>
            </div>
          );
        })}
        {shown.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <Calendar className="size-8 mx-auto text-muted-foreground mb-3" />
            <p className="text-sm text-muted-foreground">{tab === "upcoming" ? "Nenhuma consulta agendada" : "Sem histórico ainda"}</p>
            <Link to="/app/buscar" className="mt-4 inline-block text-sm font-semibold text-primary">Buscar profissionais</Link>
          </div>
        )}
      </div>

      {/* Review modal */}
      {ratingFor && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-center p-5" onClick={() => setRatingFor(null)}>
          <div className="bg-card rounded-3xl p-6 max-w-sm w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Avaliar consulta</h2>
            <p className="text-sm text-muted-foreground mt-1">Como foi seu atendimento?</p>
            <div className="flex justify-center gap-1 my-5">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setRating(n)} className={`size-10 text-2xl ${n <= rating ? "text-amber-500" : "text-muted"}`}>★</button>
              ))}
            </div>
            <Textarea value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentário (opcional)" rows={3} />
            <div className="flex gap-2 mt-4">
              <Button variant="outline" className="flex-1" onClick={() => setRatingFor(null)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => submitReview.mutate()} disabled={submitReview.isPending}>Enviar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
