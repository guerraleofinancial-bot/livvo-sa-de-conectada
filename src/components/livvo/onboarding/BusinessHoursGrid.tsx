import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

export type DayHours = {
  weekday: number;
  opens_at: string | null;
  closes_at: string | null;
  lunch_start: string | null;
  lunch_end: string | null;
  closed: boolean;
};

const LABELS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

interface Props {
  value: DayHours[];
  onChange: (v: DayHours[]) => void;
}

export function BusinessHoursGrid({ value, onChange }: Props) {
  function update(weekday: number, patch: Partial<DayHours>) {
    onChange(value.map((d) => (d.weekday === weekday ? { ...d, ...patch } : d)));
  }
  function copyToWeekdays() {
    const seg = value.find((d) => d.weekday === 1);
    if (!seg) return;
    onChange(value.map((d) => ([1, 2, 3, 4, 5].includes(d.weekday) ? { ...seg, weekday: d.weekday } : d)));
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
        <Button variant="ghost" size="sm" onClick={copyToWeekdays}><Copy className="size-4 mr-2" /> Copiar segunda para dias úteis</Button>
      </div>
      <div className="space-y-2">
        {value.map((d) => (
          <div key={d.weekday} className="grid grid-cols-12 gap-2 items-center rounded-xl border border-border p-3">
            <div className="col-span-3 text-sm font-medium">{LABELS[d.weekday]}</div>
            <div className="col-span-2 flex items-center gap-2">
              <Switch checked={!d.closed} onCheckedChange={(c) => update(d.weekday, { closed: !c })} />
              <span className="text-xs text-muted-foreground">{d.closed ? "Fechado" : "Aberto"}</span>
            </div>
            <div className="col-span-7 grid grid-cols-4 gap-2">
              <Input disabled={d.closed} type="time" value={d.opens_at ?? ""} onChange={(e) => update(d.weekday, { opens_at: e.target.value || null })} />
              <Input disabled={d.closed} type="time" value={d.closes_at ?? ""} onChange={(e) => update(d.weekday, { closes_at: e.target.value || null })} />
              <Input disabled={d.closed} type="time" placeholder="Almoço" value={d.lunch_start ?? ""} onChange={(e) => update(d.weekday, { lunch_start: e.target.value || null })} />
              <Input disabled={d.closed} type="time" placeholder="Volta" value={d.lunch_end ?? ""} onChange={(e) => update(d.weekday, { lunch_end: e.target.value || null })} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function defaultHours(): DayHours[] {
  return Array.from({ length: 7 }).map((_, i) => ({
    weekday: i,
    opens_at: i === 0 || i === 6 ? null : "09:00",
    closes_at: i === 0 || i === 6 ? null : "18:00",
    lunch_start: i === 0 || i === 6 ? null : "12:00",
    lunch_end: i === 0 || i === 6 ? null : "13:00",
    closed: i === 0 || i === 6,
  }));
}
