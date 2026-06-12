import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Upload, X, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Shape = "circle" | "rect";

interface Props {
  value?: string | null;
  onChange: (url: string | null) => void;
  bucket?: "provider-media" | "provider-documents";
  folder?: string;
  shape?: Shape;
  label?: string;
  className?: string;
  aspect?: string;
}

export function ImageUpload({ value, onChange, bucket = "provider-media", folder = "misc", shape = "rect", label, className, aspect = "aspect-video" }: Props) {
  const { user } = useAuth();
  const [busy, setBusy] = useState(false);

  async function handleFile(file: File) {
    if (!user) return;
    if (file.size > 8 * 1024 * 1024) { toast.error("Arquivo muito grande (máx 8MB)"); return; }
    setBusy(true);
    try {
      const ext = file.name.split(".").pop() ?? "bin";
      const path = `${user.id}/${folder}/${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, { upsert: true, contentType: file.type });
      if (error) throw error;
      const { data, error: signErr } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365);
      if (signErr) throw signErr;
      onChange(data.signedUrl);
      toast.success("Upload concluído");
    } catch (e) {
      toast.error("Falha no upload", { description: (e as Error).message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("space-y-2", className)}>
      {label && <p className="text-sm font-medium">{label}</p>}
      <div className={cn("relative overflow-hidden border-2 border-dashed border-border bg-muted/30 grid place-items-center", shape === "circle" ? "rounded-full size-28" : `rounded-xl ${aspect}`)}>
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="size-full object-cover" />
        ) : (
          <Upload className="size-6 text-muted-foreground" />
        )}
        {busy && <div className="absolute inset-0 bg-background/70 grid place-items-center"><Loader2 className="size-6 animate-spin" /></div>}
      </div>
      <div className="flex gap-2">
        <label className="inline-flex">
          <input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} />
          <Button asChild variant="outline" size="sm"><span className="cursor-pointer">{value ? "Trocar" : "Enviar"}</span></Button>
        </label>
        {value && <Button variant="ghost" size="sm" onClick={() => onChange(null)}><X className="size-4" /></Button>}
      </div>
    </div>
  );
}
