import {
  Clock, CheckCircle2, XCircle, UserX, PlayCircle, CalendarClock, AlertTriangle, RotateCcw,
  type LucideIcon,
} from "lucide-react";
import {
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from "@/components/ui/tooltip";

export type AppointmentStatus =
  | "agendada" | "confirmada" | "em_andamento" | "realizada"
  | "cancelada" | "nao_compareceu" | "reagendada" | "pendente_definicao";

type Meta = { label: string; description: string; icon: LucideIcon; cls: string };

const META: Record<AppointmentStatus, Meta> = {
  agendada: { label: "Agendado", description: "Consulta marcada, aguardando confirmação.", icon: CalendarClock, cls: "bg-primary-soft text-primary border-primary/20" },
  confirmada: { label: "Confirmado", description: "Paciente confirmou a presença.", icon: CheckCircle2, cls: "bg-primary-soft text-primary border-primary/20" },
  em_andamento: { label: "Em andamento", description: "Atendimento em curso.", icon: PlayCircle, cls: "bg-accent text-accent-foreground border-accent" },
  realizada: { label: "Concluído", description: "Atendimento finalizado com sucesso.", icon: CheckCircle2, cls: "bg-health-soft text-health border-health/20" },
  cancelada: { label: "Cancelado", description: "Consulta cancelada com motivo registrado.", icon: XCircle, cls: "bg-destructive/10 text-destructive border-destructive/20" },
  nao_compareceu: { label: "Não compareceu", description: "Paciente não compareceu ao horário.", icon: UserX, cls: "bg-muted text-muted-foreground border-border" },
  reagendada: { label: "Reagendado", description: "Consulta remarcada; histórico preservado.", icon: RotateCcw, cls: "bg-accent text-accent-foreground border-accent" },
  pendente_definicao: { label: "Pendente de definição", description: "Data passou sem desfecho — escolha o resultado.", icon: AlertTriangle, cls: "bg-warning-soft text-warning border-warning/30" },
};

type Size = "sm" | "md";

export function StatusBadge({ status, size = "sm", showLabel = true, showIcon = true, className = "" }: {
  status: AppointmentStatus | string;
  size?: Size;
  showLabel?: boolean;
  showIcon?: boolean;
  className?: string;
}) {
  const meta = (META as Record<string, Meta | undefined>)[status] ?? META.agendada;
  const Icon = meta.icon;
  const sizeCls = size === "sm"
    ? "text-[10px] px-1.5 py-0.5 gap-1"
    : "text-xs px-2 py-1 gap-1.5";
  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            role="status"
            aria-label={`${meta.label}: ${meta.description}`}
            className={`inline-flex items-center rounded-full border font-semibold uppercase tracking-wide ${sizeCls} ${meta.cls} ${className}`}
          >
            {showIcon && <Icon className={size === "sm" ? "size-2.5" : "size-3"} />}
            {showLabel && meta.label}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="max-w-[220px] text-[11px]">
          {meta.description}
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

// re-export for legacy consumers
export { Clock };
