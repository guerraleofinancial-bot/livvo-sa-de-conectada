import { useState, type KeyboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Props {
  value: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
}

export function ChipsInput({ value, onChange, placeholder, suggestions }: Props) {
  const [input, setInput] = useState("");
  function add(v: string) {
    const t = v.trim();
    if (!t || value.includes(t)) return;
    onChange([...value, t]);
    setInput("");
  }
  function onKey(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); }
    if (e.key === "Backspace" && !input && value.length) onChange(value.slice(0, -1));
  }
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {value.map((v) => (
          <Badge key={v} variant="secondary" className="gap-1">{v}<button onClick={() => onChange(value.filter((x) => x !== v))}><X className="size-3" /></button></Badge>
        ))}
      </div>
      <Input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={onKey} placeholder={placeholder ?? "Digite e pressione Enter"} />
      {suggestions && suggestions.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {suggestions.filter((s) => !value.includes(s)).map((s) => (
            <button key={s} onClick={() => add(s)} className="text-xs px-2 py-1 rounded-full border border-border hover:bg-muted">+ {s}</button>
          ))}
        </div>
      )}
    </div>
  );
}
