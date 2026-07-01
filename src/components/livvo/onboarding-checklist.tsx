import { Check, Circle } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Link } from "@tanstack/react-router";

export interface ChecklistItem {
  id: string;
  label: string;
  done: boolean;
  href?: string;
}

interface Props {
  title?: string;
  items: ChecklistItem[];
}

export function OnboardingChecklist({ title = "Checklist de onboarding", items }: Props) {
  const done = items.filter((i) => i.done).length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;

  return (
    <div className="livvo-card p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-bold tracking-tight">{title}</p>
          <p className="mt-0.5 text-xs text-muted-foreground">{done} de {items.length} concluídos · {pct}%</p>
        </div>
        <div className="text-xs font-bold text-primary">{pct}%</div>
      </div>
      <Progress value={pct} className="mt-3 h-2" />
      <ul className="mt-4 space-y-2">
        {items.map((it) => {
          const Content = (
            <div className={`flex items-center gap-3 rounded-lg px-2 py-1.5 text-sm ${it.done ? "text-muted-foreground line-through" : "hover:bg-muted"}`}>
              {it.done
                ? <Check className="size-4 text-primary" />
                : <Circle className="size-4 text-muted-foreground" />}
              <span className="flex-1">{it.label}</span>
            </div>
          );
          return (
            <li key={it.id}>
              {it.href && !it.done
                ? <Link to={it.href as never}>{Content}</Link>
                : Content}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
