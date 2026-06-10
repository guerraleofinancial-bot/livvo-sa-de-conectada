import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus, Trash2, Briefcase } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pro/servicos")({
  component: ProServicos,
});

function ProServicos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [price, setPrice] = useState("200");
  const [duration, setDuration] = useState("30");
  const [catId, setCatId] = useState("");

  const { data: cats } = useQuery({
    queryKey: ["cats"], queryFn: async () => (await supabase.from("categories").select("*").eq("active", true).order("sort_order")).data ?? [],
  });

  const { data: services } = useQuery({
    queryKey: ["my-services", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("services").select("*, categories(name)").eq("professional_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("services").insert({
        professional_id: user!.id, name, price: Number(price), duration_minutes: Number(duration), category_id: catId || null,
      });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Serviço cadastrado"); setOpen(false); setName(""); qc.invalidateQueries({ queryKey: ["my-services"] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { await supabase.from("services").delete().eq("id", id); },
    onSuccess: () => { toast.success("Removido"); qc.invalidateQueries({ queryKey: ["my-services"] }); },
  });

  return (
    <div className="px-5 pt-10 pb-8 space-y-5 livvo-fade-in">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Meus serviços</h1>
          <p className="text-sm text-muted-foreground">Catálogo de consultas, exames e procedimentos</p>
        </div>
        <Button size="sm" onClick={() => setOpen(!open)} className="rounded-xl"><Plus className="size-4 mr-1" /> Novo</Button>
      </header>

      {open && (
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div><Label>Nome</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Consulta dermatológica" /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>Preço (R$)</Label><Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} /></div>
            <div><Label>Duração (min)</Label><Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)} /></div>
          </div>
          <div>
            <Label>Categoria</Label>
            <select value={catId} onChange={(e) => setCatId(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm">
              <option value="">Sem categoria</option>
              {(cats ?? []).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <Button disabled={!name || add.isPending} onClick={() => add.mutate()} className="w-full rounded-xl">Cadastrar serviço</Button>
        </div>
      )}

      <div className="space-y-2">
        {(services ?? []).map((s) => {
          const cat = (s as typeof s & { categories: { name?: string } | null }).categories;
          return (
            <div key={s.id} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
              <div className="size-10 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0"><Briefcase className="size-4" /></div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{s.name}</p>
                <p className="text-xs text-muted-foreground">{cat?.name ?? "—"} · {s.duration_minutes}min</p>
              </div>
              <p className="font-mono font-bold text-sm">R$ {Number(s.price).toFixed(0)}</p>
              <button onClick={() => remove.mutate(s.id)} className="text-destructive p-2"><Trash2 className="size-4" /></button>
            </div>
          );
        })}
        {services && services.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum serviço ainda. Crie o primeiro acima.
          </div>
        )}
      </div>
    </div>
  );
}
