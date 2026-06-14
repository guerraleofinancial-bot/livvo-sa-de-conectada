import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { bulkImportPatients } from "@/lib/livvo/patients.functions";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Upload, FileSpreadsheet, Loader2, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import Papa from "papaparse";
import * as XLSX from "xlsx";

type Props = { open: boolean; onOpenChange: (v: boolean) => void };

const TARGETS = [
  { key: "full_name", label: "Nome *", required: true },
  { key: "phone", label: "Telefone *", required: true },
  { key: "whatsapp", label: "WhatsApp" },
  { key: "email", label: "E-mail" },
  { key: "city", label: "Cidade" },
  { key: "date_of_birth", label: "Data de nascimento" },
  { key: "sex", label: "Sexo" },
  { key: "notes", label: "Observações" },
  { key: "insurance", label: "Convênio" },
] as const;

const SYNONYMS: Record<string, string> = {
  nome: "full_name", "nome completo": "full_name", paciente: "full_name", name: "full_name",
  telefone: "phone", celular: "phone", phone: "phone", fone: "phone",
  whatsapp: "whatsapp", zap: "whatsapp", wpp: "whatsapp",
  email: "email", "e-mail": "email", mail: "email",
  cidade: "city", city: "city", municipio: "city",
  nascimento: "date_of_birth", "data de nascimento": "date_of_birth", "data nascimento": "date_of_birth", dob: "date_of_birth", "data de nasc": "date_of_birth",
  sexo: "sex", genero: "sex", sex: "sex",
  observacoes: "notes", observações: "notes", obs: "notes", notas: "notes", notes: "notes",
  convenio: "insurance", convênio: "insurance", plano: "insurance", insurance: "insurance",
};

function autoMap(headers: string[]): Record<string, string> {
  const m: Record<string, string> = {};
  for (const h of headers) {
    const k = h.trim().toLowerCase();
    const t = SYNONYMS[k];
    if (t) m[h] = t;
  }
  return m;
}

export function ImportPatientsDialog({ open, onOpenChange }: Props) {
  const qc = useQueryClient();
  const importFn = useServerFn(bulkImportPatients);
  const [step, setStep] = useState<"upload" | "map" | "done">("upload");
  const [source, setSource] = useState<"import_csv" | "import_xlsx">("import_csv");
  const [headers, setHeaders] = useState<string[]>([]);
  const [rowsRaw, setRowsRaw] = useState<Record<string, unknown>[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [duplicate, setDuplicate] = useState<"skip" | "update" | "create">("skip");
  const [result, setResult] = useState<{ created: number; updated: number; skipped: number; errors: number } | null>(null);

  const reset = () => { setStep("upload"); setHeaders([]); setRowsRaw([]); setMapping({}); setResult(null); };

  const handleFile = async (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase();
    if (ext === "csv") {
      setSource("import_csv");
      Papa.parse<Record<string, unknown>>(f, {
        header: true, skipEmptyLines: true,
        complete: (res) => {
          const hdrs = res.meta.fields ?? [];
          setHeaders(hdrs); setRowsRaw(res.data); setMapping(autoMap(hdrs)); setStep("map");
        },
        error: (e) => toast.error(e.message),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      setSource("import_xlsx");
      const buf = await f.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });
      const hdrs = json.length ? Object.keys(json[0]) : [];
      setHeaders(hdrs); setRowsRaw(json); setMapping(autoMap(hdrs)); setStep("map");
    } else {
      toast.error("Formato não suportado. Use .csv ou .xlsx");
    }
  };

  const mappedRows = rowsRaw.map((r) => {
    const out: Record<string, unknown> = { origin: "importado" };
    for (const [src, tgt] of Object.entries(mapping)) {
      if (!tgt) continue;
      const v = r[src];
      if (v === undefined || v === null || v === "") continue;
      out[tgt] = typeof v === "string" ? v.trim() : String(v);
    }
    return out;
  });

  const valid = mappedRows.filter((r) => r.full_name && r.phone);
  const ready = !!mapping && Object.values(mapping).includes("full_name") && Object.values(mapping).includes("phone");

  const mut = useMutation({
    mutationFn: () => importFn({ data: { rows: valid, source, duplicate_strategy: duplicate } }),
    onSuccess: (r) => {
      setResult(r); setStep("done");
      qc.invalidateQueries({ queryKey: ["crm-patients"] });
      qc.invalidateQueries({ queryKey: ["crm-dashboard"] });
    },
    onError: (e: Error) => toast.error(e.message ?? "Erro na importação"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Importar pacientes</DialogTitle></DialogHeader>

        {step === "upload" && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Aceita arquivos <b>.csv</b> e <b>.xlsx</b>. As colunas devem incluir pelo menos <b>Nome</b> e <b>Telefone</b>.</p>
            <label className="block border-2 border-dashed border-border rounded-2xl p-10 text-center cursor-pointer hover:border-primary/40">
              <input type="file" accept=".csv,.xlsx,.xls" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
              <FileSpreadsheet className="size-10 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm font-semibold">Selecionar arquivo</p>
              <p className="text-xs text-muted-foreground mt-1">CSV ou Excel</p>
            </label>
          </div>
        )}

        {step === "map" && (
          <div className="space-y-4">
            <p className="text-xs text-muted-foreground">{rowsRaw.length} linhas detectadas. Mapeie suas colunas para os campos da Livvo.</p>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {headers.map((h) => (
                <div key={h} className="grid grid-cols-2 gap-2 items-center">
                  <div className="text-sm font-medium truncate">{h}</div>
                  <Select value={mapping[h] ?? "ignore"} onValueChange={(v) => setMapping((m) => ({ ...m, [h]: v === "ignore" ? "" : v }))}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ignore">— Ignorar —</SelectItem>
                      {TARGETS.map((t) => <SelectItem key={t.key} value={t.key}>{t.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div>
              <Label>Em caso de duplicidade (mesmo telefone/email)</Label>
              <Select value={duplicate} onValueChange={(v) => setDuplicate(v as typeof duplicate)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="skip">Ignorar registro duplicado</SelectItem>
                  <SelectItem value="update">Atualizar cadastro existente</SelectItem>
                  <SelectItem value="create">Criar mesmo assim</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-border p-3 bg-muted/30 text-xs">
              <b>{valid.length}</b> de {rowsRaw.length} linhas válidas (Nome + Telefone preenchidos).
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={reset} className="flex-1">Cancelar</Button>
              <Button disabled={!ready || valid.length === 0 || mut.isPending} onClick={() => mut.mutate()} className="flex-1">
                {mut.isPending && <Loader2 className="size-4 animate-spin mr-2" />} Importar {valid.length} pacientes
              </Button>
            </div>
          </div>
        )}

        {step === "done" && result && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="size-12 mx-auto text-health" />
            <div>
              <p className="text-lg font-bold">Importação concluída</p>
              <p className="text-sm text-muted-foreground mt-1">
                {result.created} criados · {result.updated} atualizados · {result.skipped} ignorados · {result.errors} com erro
              </p>
            </div>
            <Button onClick={() => { onOpenChange(false); reset(); }} className="w-full">Concluir</Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export function NewPatientButtons({ onNew, onImport }: { onNew: () => void; onImport: () => void }) {
  return (
    <div className="flex gap-2">
      <button onClick={onImport} className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-2 text-xs font-semibold hover:border-primary/30">
        <Upload className="size-3.5" /> Importar
      </button>
      <button onClick={onNew} className="inline-flex items-center gap-1.5 rounded-full bg-primary text-primary-foreground px-3 py-2 text-xs font-semibold">
        + Novo Paciente
      </button>
    </div>
  );
}
