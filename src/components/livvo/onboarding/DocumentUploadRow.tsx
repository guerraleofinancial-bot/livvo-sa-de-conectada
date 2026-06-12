import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload, Loader2, FileText } from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import { uploadProviderDocument } from "@/lib/livvo/onboarding-pro.functions";
import { toast } from "sonner";

const KIND_LABEL: Record<string, string> = {
  documento_pessoal: "Documento pessoal",
  registro: "Registro profissional",
  comprovante_endereco: "Comprovante de endereço",
  documento_empresa: "Documento da empresa",
};

const STATUS_LABEL: Record<string, string> = {
  pendente: "Pendente",
  em_analise: "Em análise",
  aprovado: "Aprovado",
  rejeitado: "Rejeitado",
};

interface Props {
  kind: keyof typeof KIND_LABEL;
  existing?: { id: string; status: string; file_url: string } | null;
  onUploaded?: () => void;
}

export function DocumentUploadRow({ kind, existing, onUploaded }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);
  const insert = useServerFn(uploadProviderDocument);

  async function handle(file: File) {
    if (!user) return;
    if (file.size > 12 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 12MB)"); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${kind}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("provider-documents").upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      await insert({ data: { kind, file_url: path } });
      toast.success("Documento enviado");
      onUploaded?.();
    } catch (e) { toast.error("Falha", { description: (e as Error).message }); }
    finally { setBusy(false); }
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-4">
      <div className="flex items-center gap-3 min-w-0">
        <div className="size-10 rounded-lg bg-muted grid place-items-center"><FileText className="size-5 text-muted-foreground" /></div>
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{KIND_LABEL[kind]}</p>
          {existing && <Badge variant="secondary" className="mt-1">{STATUS_LABEL[existing.status]}</Badge>}
        </div>
      </div>
      <label>
        <input type="file" className="hidden" accept="image/*,application/pdf" onChange={(e) => e.target.files?.[0] && handle(e.target.files[0])} />
        <Button asChild size="sm" variant="outline"><span className="cursor-pointer">{busy ? <Loader2 className="size-4 animate-spin" /> : <><Upload className="size-4 mr-1" /> {existing ? "Reenviar" : "Enviar"}</>}</span></Button>
      </label>
    </div>
  );
}
