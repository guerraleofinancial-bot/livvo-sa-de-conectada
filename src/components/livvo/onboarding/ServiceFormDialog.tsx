import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { upsertProviderService } from "@/lib/livvo/onboarding-pro.functions";
import { toast } from "sonner";

interface Props {
  onSaved?: () => void;
  trigger?: React.ReactNode;
  initial?: { id?: string; name?: string; type?: "consulta" | "exame" | "procedimento" | "pacote"; description?: string; duration_minutes?: number; price?: number };
}

const TYPES = [
  { value: "consulta", label: "Consulta" },
  { value: "exame", label: "Exame" },
  { value: "procedimento", label: "Procedimento" },
  { value: "pacote", label: "Pacote" },
] as const;

export function ServiceFormDialog({ onSaved, trigger, initial }: Props) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initial?.name ?? "");
  const [type, setType] = useState<"consulta" | "exame" | "procedimento" | "pacote">(initial?.type ?? "consulta");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(String(initial?.duration_minutes ?? 30));
  const [price, setPrice] = useState(String(initial?.price ?? 200));
  const upsert = useServerFn(upsertProviderService);

  async function save() {
    if (!name.trim()) { toast.error("Informe o nome"); return; }
    try {
      await upsert({ data: { id: initial?.id, name, type, description, duration_minutes: Number(duration), price: Number(price), active: true } });
      toast.success("Serviço salvo");
      setOpen(false);
      onSaved?.();
    } catch (e) { toast.error("Erro", { description: (e as Error).message }); }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger ?? <Button size="sm" variant="outline"><Plus className="size-4 mr-1" /> Novo serviço</Button>}</DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>{initial?.id ? "Editar serviço" : "Novo serviço"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Consulta Cardiológica" /></div>
          <div>
            <Label>Categoria</Label>
            <select value={type} onChange={(e) => setType(e.target.value as typeof type)} className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm">
              {TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div><Label>Descrição</Label><Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Duração (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
            <div><Label>Valor (R$)</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
          </div>
          <Button onClick={save} className="w-full">Salvar</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
