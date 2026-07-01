import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Calendar, CheckCircle2, Clock, RefreshCw, XCircle, UserX, Plus, Play } from "lucide-react";

type Event = {
  id: string;
  event_type: string;
  description: string | null;
  created_at: string;
  metadata: Record<string, unknown>;
};

const ICONS: Record<string, typeof Calendar> = {
  created: Plus,
  rescheduled_created: Plus,
  status_changed: CheckCircle2,
  rescheduled: RefreshCw,
};

function iconFor(ev: Event) {
  const to = (ev.metadata as { to?: string })?.to;
  if (ev.event_type === "status_changed") {
    if (to === "cancelada") return XCircle;
    if (to === "nao_compareceu") return UserX;
    if (to === "realizada") return CheckCircle2;
    if (to === "em_andamento") return Play;
    if (to === "confirmada") return CheckCircle2;
    return Clock;
  }
  return ICONS[ev.event_type] ?? Calendar;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function AppointmentTimelineDialog({ appointmentId, open, onOpenChange }: {
  appointmentId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const { data: events, isLoading } = useQuery({
    queryKey: ["appt-events", appointmentId],
    enabled: !!appointmentId && open,
    queryFn: async (): Promise<Event[]> => {
      const { data, error } = await supabase.from("appointment_events")
        .select("id, event_type, description, created_at, metadata")
        .eq("appointment_id", appointmentId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Event[];
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Histórico da consulta</DialogTitle>
          <DialogDescription>Todos os eventos registrados nesta consulta.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto -mx-2 px-2">
          {isLoading && <p className="text-sm text-muted-foreground py-4 text-center">Carregando...</p>}
          {!isLoading && (events?.length ?? 0) === 0 && (
            <p className="text-sm text-muted-foreground py-4 text-center">Sem eventos registrados.</p>
          )}
          <ol className="relative border-l border-border ml-3 space-y-4 py-2">
            {(events ?? []).map((ev) => {
              const Icon = iconFor(ev);
              const meta = ev.metadata as { from?: string; to?: string; reason?: string | null };
              return (
                <li key={ev.id} className="ml-4">
                  <span className="absolute -left-3 mt-0.5 size-6 rounded-full bg-primary-soft grid place-items-center">
                    <Icon className="size-3 text-primary" />
                  </span>
                  <p className="text-sm font-semibold">{ev.description ?? ev.event_type}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(ev.created_at)}</p>
                  {ev.event_type === "rescheduled" && meta.from && meta.to && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      De {formatDate(meta.from)} → {formatDate(meta.to)}
                    </p>
                  )}
                  {meta.reason && (
                    <p className="text-xs text-muted-foreground mt-0.5 italic">Motivo: {meta.reason}</p>
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
