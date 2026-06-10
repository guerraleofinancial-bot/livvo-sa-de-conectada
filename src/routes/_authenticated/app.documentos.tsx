import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";
import { ArrowLeft, FileText, Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/app/documentos")({
  component: Documentos,
});

function Documentos() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [title, setTitle] = useState("");
  const [type, setType] = useState("exame");
  const [notes, setNotes] = useState("");
  const [open, setOpen] = useState(false);

  const { data: docs } = useQuery({
    queryKey: ["docs", user?.id],
    enabled: !!user,
    queryFn: async () => (await supabase.from("health_documents").select("*").eq("patient_id", user!.id).order("uploaded_at", { ascending: false })).data ?? [],
  });

  const add = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("health_documents").insert({ patient_id: user!.id, title, document_type: type, notes });
      if (error) throw error;
    },
    onSuccess: () => { toast.success("Documento adicionado"); setOpen(false); setTitle(""); setNotes(""); qc.invalidateQueries({ queryKey: ["docs"] }); },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => { const { error } = await supabase.from("health_documents").delete().eq("id", id); if (error) throw error; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["docs"] }),
  });

  return (
    <div className="px-5 pt-10 space-y-5">
      <header className="flex items-center gap-3">
        <Link to="/app/perfil" className="size-10 rounded-full border border-border bg-card grid place-items-center">
          <ArrowLeft className="size-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-lg font-bold">Documentos de saúde</h1>
          <p className="text-xs text-muted-foreground">Carteira de saúde digital</p>
        </div>
        <Button size="icon" onClick={() => setOpen(true)} className="rounded-full"><Plus className="size-4" /></Button>
      </header>

      <div className="space-y-2">
        {(docs ?? []).map((d) => (
          <div key={d.id} className="flex items-center gap-3 p-4 rounded-2xl bg-card border border-border">
            <div className="size-10 rounded-xl bg-primary-soft text-primary grid place-items-center shrink-0">
              <FileText className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{d.title}</p>
              <p className="text-xs text-muted-foreground capitalize">{d.document_type} · {new Date(d.uploaded_at).toLocaleDateString("pt-BR")}</p>
            </div>
            <button onClick={() => remove.mutate(d.id)} className="size-8 grid place-items-center text-muted-foreground hover:text-destructive">
              <Trash2 className="size-4" />
            </button>
          </div>
        ))}
        {docs && docs.length === 0 && (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            Nenhum documento ainda. Toque em + para adicionar.
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm grid place-items-end sm:place-items-center p-0 sm:p-5" onClick={() => setOpen(false)}>
          <div className="bg-card w-full max-w-sm p-6 rounded-t-3xl sm:rounded-3xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-bold">Novo documento</h2>
            <div className="space-y-3 mt-4">
              <div><Label>Título</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ex.: Hemograma" /></div>
              <div><Label>Tipo</Label>
                <select value={type} onChange={(e) => setType(e.target.value)} className="w-full h-10 rounded-xl border border-border bg-card px-3 text-sm">
                  <option value="exame">Exame</option><option value="receita">Receita</option><option value="laudo">Laudo</option><option value="outro">Outro</option>
                </select>
              </div>
              <div><Label>Observações</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} /></div>
            </div>
            <div className="flex gap-2 mt-5">
              <Button variant="outline" className="flex-1" onClick={() => setOpen(false)}>Cancelar</Button>
              <Button className="flex-1" onClick={() => add.mutate()} disabled={!title || add.isPending}>Salvar</Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
