import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { createManualPatient, listCrmScope } from "@/lib/livvo/patients.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

const ORIGINS = [
  { v: "busca_organica", l: "Busca Livvo" },
  { v: "anuncio_patrocinado", l: "Destaque Patrocinado" },
  { v: "indicacao", l: "Indicação" },
  { v: "campanha", l: "WhatsApp / Instagram / Facebook" },
  { v: "perfil_publico", l: "Google / Site Próprio" },
  { v: "cadastro_direto", l: "Recepção / Ligação" },
  { v: "importado", l: "Importação de Base" },
  { v: "outros", l: "Outros" },
] as const;

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

const UNASSIGNED = "__none__";

export function NewPatientDialog({ open, onOpenChange }: Props) {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const createFn = useServerFn(createManualPatient);
  const scopeFn = useServerFn(listCrmScope);
  const { data: scope } = useQuery({
    queryKey: ["crm-scope"],
    queryFn: () => scopeFn(),
    enabled: open,
  });
  const [form, setForm] = useState({
    full_name: "", phone: "", whatsapp: "", city: "",
    email: "", date_of_birth: "", sex: "",
    notes: "", insurance: "", origin: "cadastro_direto",
    responsible_user_id: "",
  });

  const set = (k: keyof typeof form, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const mut = useMutation({
    mutationFn: async (mode: "save" | "appt" | "quote") => {
      const { responsible_user_id, ...rest } = form;
      const payload: any = { ...rest, source: "manual" };
      if (responsible_user_id && responsible_user_id !== UNASSIGNED) {
        payload.responsible_user_id = responsible_user_id;
      }
      if (scope?.company?.id) payload.company_id = scope.company.id;
      const res = await createFn({ data: payload });
      return { ...res, mode };
    },
    onSuccess: ({ relationshipId, mode }) => {
      qc.invalidateQueries({ queryKey: ["crm-patients"] });
      qc.invalidateQueries({ queryKey: ["crm-dashboard"] });
      toast.success("Paciente cadastrado");
      onOpenChange(false);
      setForm({ full_name: "", phone: "", whatsapp: "", city: "", email: "", date_of_birth: "", sex: "", notes: "", insurance: "", origin: "cadastro_direto", responsible_user_id: "" });
      if (mode === "appt") navigate({ to: "/pro/agenda" });
      else if (mode === "quote") navigate({ to: "/pro/orcamentos" });
      else if (relationshipId) navigate({ to: "/pro/crm/$id", params: { id: relationshipId } });
      else navigate({ to: "/pro/crm" });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro ao salvar"),
  });

  const canSave = form.full_name.trim() && form.phone.trim() && form.city.trim();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Novo paciente</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Nome completo *</Label>
            <Input value={form.full_name} onChange={(e) => set("full_name", e.target.value)} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Telefone *</Label>
              <Input value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="(11) 99999-0000" />
            </div>
            <div>
              <Label>WhatsApp</Label>
              <Input value={form.whatsapp} onChange={(e) => set("whatsapp", e.target.value)} placeholder="igual ao telefone" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Cidade *</Label>
              <Input value={form.city} onChange={(e) => set("city", e.target.value)} />
            </div>
            <div>
              <Label>E-mail</Label>
              <Input type="email" value={form.email} onChange={(e) => set("email", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Data de nascimento</Label>
              <Input type="date" value={form.date_of_birth} onChange={(e) => set("date_of_birth", e.target.value)} />
            </div>
            <div>
              <Label>Sexo</Label>
              <Select value={form.sex} onValueChange={(v) => set("sex", v)}>
                <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="feminino">Feminino</SelectItem>
                  <SelectItem value="masculino">Masculino</SelectItem>
                  <SelectItem value="outro">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label>Convênio</Label>
            <Input value={form.insurance} onChange={(e) => set("insurance", e.target.value)} placeholder="Particular / Unimed..." />
          </div>
          <div>
            <Label>Origem</Label>
            <Select value={form.origin} onValueChange={(v) => set("origin", v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {ORIGINS.map((o) => <SelectItem key={o.v} value={o.v}>{o.l}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Observações</Label>
            <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} />
          </div>
        </div>
        <div className="flex flex-col gap-2 pt-2 border-t">
          <Button disabled={!canSave || mut.isPending} onClick={() => mut.mutate("save")}>
            {mut.isPending && <Loader2 className="size-4 animate-spin mr-2" />} Salvar
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" disabled={!canSave || mut.isPending} onClick={() => mut.mutate("appt")}>Salvar e Agendar</Button>
            <Button variant="outline" disabled={!canSave || mut.isPending} onClick={() => mut.mutate("quote")}>Salvar e Orçar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
