import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { TablesUpdate } from "@/integrations/supabase/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CheckCircle2, XCircle, Clock, MoreVertical, UserX, Play, RotateCcw, History } from "lucide-react";
import { toast } from "sonner";


export type ApptForActions = {
  id: string;
  patient_id: string | null;
  professional_id: string;
  scheduled_at: string;
  duration_minutes: number | null;
  status: string;
  service_id: string | null;
  price?: number | null;
};

const CANCEL_REASONS = [
  "Paciente desistiu",
  "Paciente remarcou",
  "Profissional indisponível",
  "Clínica fechada",
  "Outro",
];

export function AppointmentActions({ appt, onOpenTimeline, invalidateKeys }: {
  appt: ApptForActions;
  onOpenTimeline?: () => void;
  invalidateKeys?: string[];
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState<null | "reschedule" | "cancel" | "noshow" | "complete">(null);

  const invalidate = () => {
    (invalidateKeys ?? ["pro-agenda", "pro-next", "crm-dashboard", "pro-pending"]).forEach((k) =>
      qc.invalidateQueries({ queryKey: [k] })
    );
  };

  const setStatus = useMutation({
    mutationFn: async (patch: { status: "agendada" | "confirmada" | "em_andamento" | "realizada" | "cancelada" | "nao_compareceu"; [k: string]: unknown }) => {
      const { error } = await supabase.from("appointments").update(patch).eq("id", appt.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Agendamento atualizado"); invalidate(); setOpen(null); },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao atualizar"),
  });


  const rescheduleMut = useMutation({
    mutationFn: async ({ when, reason }: { when: string; reason: string }) => {
      const iso = new Date(when).toISOString();
      const { error } = await supabase.from("appointments").update({
        scheduled_at: iso,
        reschedule_reason: reason || null,
        rescheduled_by: (await supabase.auth.getUser()).data.user?.id ?? null,
        status: "agendada",
      }).eq("id", appt.id);
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Consulta reagendada"); invalidate(); setOpen(null); },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao reagendar"),
  });

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-1.5 rounded-lg hover:bg-muted" aria-label="Ações">
            <MoreVertical className="size-4 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {appt.status === "agendada" && (
            <DropdownMenuItem onClick={() => setStatus.mutate({ status: "confirmada" })}>
              <CheckCircle2 className="size-4 mr-2" /> Confirmar consulta
            </DropdownMenuItem>
          )}
          {(appt.status === "agendada" || appt.status === "confirmada") && (
            <DropdownMenuItem onClick={() => setStatus.mutate({ status: "em_andamento", started_at: new Date().toISOString() })}>
              <Play className="size-4 mr-2" /> Iniciar atendimento
            </DropdownMenuItem>
          )}
          {appt.status !== "realizada" && appt.status !== "cancelada" && (
            <DropdownMenuItem onClick={() => setOpen("complete")}>
              <CheckCircle2 className="size-4 mr-2" /> Concluir consulta
            </DropdownMenuItem>
          )}
          {appt.status !== "realizada" && appt.status !== "cancelada" && (
            <DropdownMenuItem onClick={() => setOpen("noshow")}>
              <UserX className="size-4 mr-2" /> Paciente não compareceu
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setOpen("reschedule")}>
            <Clock className="size-4 mr-2" /> Reagendar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {onOpenTimeline && (
            <DropdownMenuItem onClick={onOpenTimeline}>
              <History className="size-4 mr-2" /> Ver histórico
            </DropdownMenuItem>
          )}
          {appt.status !== "cancelada" && (
            <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => setOpen("cancel")}>
              <XCircle className="size-4 mr-2" /> Cancelar consulta
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Reschedule */}
      <RescheduleDialog
        open={open === "reschedule"}
        onOpenChange={(v) => setOpen(v ? "reschedule" : null)}
        initial={appt.scheduled_at}
        onConfirm={(when, reason) => rescheduleMut.mutate({ when, reason })}
        loading={rescheduleMut.isPending}
      />

      {/* Cancel */}
      <CancelDialog
        open={open === "cancel"}
        onOpenChange={(v) => setOpen(v ? "cancel" : null)}
        onConfirm={(reason) => setStatus.mutate({ status: "cancelada", cancellation_reason: reason, cancelled_at: new Date().toISOString() })}
        loading={setStatus.isPending}
      />

      {/* No-show */}
      <ConfirmDialog
        open={open === "noshow"}
        onOpenChange={(v) => setOpen(v ? "noshow" : null)}
        title="Marcar como não compareceu?"
        description="Isso atualizará as estatísticas do paciente e registrará no histórico."
        confirmLabel="Confirmar"
        onConfirm={() => setStatus.mutate({ status: "nao_compareceu", no_show_at: new Date().toISOString() })}
        loading={setStatus.isPending}
      />

      {/* Complete */}
      <ConfirmDialog
        open={open === "complete"}
        onOpenChange={(v) => setOpen(v ? "complete" : null)}
        title="Concluir consulta?"
        description="Você poderá iniciar cobrança, solicitar avaliação e agendar retorno em seguida."
        confirmLabel="Concluir"
        onConfirm={() => setStatus.mutate({ status: "realizada", completed_at: new Date().toISOString() })}
        loading={setStatus.isPending}
      />
    </>
  );
}

function RescheduleDialog({ open, onOpenChange, initial, onConfirm, loading }: {
  open: boolean; onOpenChange: (v: boolean) => void; initial: string;
  onConfirm: (when: string, reason: string) => void; loading?: boolean;
}) {
  const iso = new Date(initial);
  const local = new Date(iso.getTime() - iso.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
  const [when, setWhen] = useState(local);
  const [reason, setReason] = useState("");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Reagendar consulta</DialogTitle>
          <DialogDescription>O histórico da consulta anterior será preservado.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label htmlFor="when">Nova data e horário</Label>
            <Input id="when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="reason">Motivo (opcional)</Label>
            <Textarea id="reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Ex.: paciente solicitou remarcação" rows={3} maxLength={500} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => onConfirm(when, reason)} disabled={!when || loading}>Reagendar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CancelDialog({ open, onOpenChange, onConfirm, loading }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  onConfirm: (reason: string) => void; loading?: boolean;
}) {
  const [reason, setReason] = useState<string>(CANCEL_REASONS[0]);
  const [custom, setCustom] = useState("");
  const final = reason === "Outro" ? custom.trim() : reason;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>Cancelar consulta</DialogTitle>
          <DialogDescription>Informe o motivo para registrar na timeline.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Motivo</Label>
            <Select value={reason} onValueChange={setReason}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {CANCEL_REASONS.map((r) => <SelectItem key={r} value={r}>{r}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {reason === "Outro" && (
            <Textarea value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Descreva o motivo" rows={3} maxLength={500} />
          )}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button variant="destructive" onClick={() => onConfirm(final)} disabled={!final || loading}>Cancelar consulta</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmDialog({ open, onOpenChange, title, description, confirmLabel, onConfirm, loading }: {
  open: boolean; onOpenChange: (v: boolean) => void;
  title: string; description?: string; confirmLabel: string;
  onConfirm: () => void; loading?: boolean;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm rounded-2xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Voltar</Button>
          <Button onClick={onConfirm} disabled={loading}>{confirmLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Utility to know if appointment is a "pendência" (passed time still open)
export function isPending(appt: { scheduled_at: string; status: string }) {
  const passed = new Date(appt.scheduled_at) < new Date();
  return passed && (appt.status === "agendada" || appt.status === "confirmada");
}

export { RotateCcw };
