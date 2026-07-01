import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

type CoreSettings = {
  commission_percent: number;
  cancellation_window_hours: number;
  refund_policy: string;
  release_after_days?: number | null;
  config?: Record<string, Record<string, unknown>> | null;
};

type SavePayload = {
  commission_percent?: number;
  cancellation_window_hours?: number;
  refund_policy?: string;
  release_after_days?: number;
  config?: Record<string, unknown>;
};

const SECTIONS = [
  { id: "geral",       label: "Geral" },
  { id: "contatos",    label: "Contatos" },
  { id: "social",      label: "Redes sociais" },
  { id: "seo",         label: "SEO global" },
  { id: "comissao",    label: "Comissão" },
  { id: "financeiro",  label: "Financeiro" },
  { id: "founders",    label: "Parceiros Fundadores" },
  { id: "seguranca",   label: "Segurança" },
] as const;

type SectionId = typeof SECTIONS[number]["id"];

function FieldRow({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-xs font-bold uppercase text-muted-foreground">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function SettingsCenter({ initial, onSave }: { initial: CoreSettings; onSave: (v: SavePayload) => Promise<void> }) {
  const [active, setActive] = useState<SectionId>("geral");
  const [core, setCore] = useState({
    commission_percent: Number(initial.commission_percent ?? 15),
    cancellation_window_hours: Number(initial.cancellation_window_hours ?? 24),
    refund_policy: initial.refund_policy ?? "",
    release_after_days: Number(initial.release_after_days ?? 2),
  });
  const [config, setConfig] = useState<Record<string, Record<string, unknown>>>(initial.config ?? {});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setCore({
      commission_percent: Number(initial.commission_percent ?? 15),
      cancellation_window_hours: Number(initial.cancellation_window_hours ?? 24),
      refund_policy: initial.refund_policy ?? "",
      release_after_days: Number(initial.release_after_days ?? 2),
    });
    setConfig(initial.config ?? {});
  }, [initial]);

  const setC = (section: string, key: string, value: unknown) =>
    setConfig((prev) => ({ ...prev, [section]: { ...(prev[section] ?? {}), [key]: value } }));
  const g = <T,>(section: string, key: string, fallback: T): T => {
    const v = (config[section] as Record<string, unknown> | undefined)?.[key];
    return (v === undefined || v === null ? fallback : v) as T;
  };

  const dirty = useMemo(() => JSON.stringify({ core, config }) !== JSON.stringify({
    core: {
      commission_percent: Number(initial.commission_percent ?? 15),
      cancellation_window_hours: Number(initial.cancellation_window_hours ?? 24),
      refund_policy: initial.refund_policy ?? "",
      release_after_days: Number(initial.release_after_days ?? 2),
    },
    config: initial.config ?? {},
  }), [core, config, initial]);

  async function handleSave() {
    setSaving(true);
    try {
      await onSave({
        commission_percent: core.commission_percent,
        cancellation_window_hours: core.cancellation_window_hours,
        refund_policy: core.refund_policy,
        release_after_days: core.release_after_days,
        config,
      });
      toast.success("Configurações salvas");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-5">
      <nav className="flex md:flex-col gap-1 overflow-x-auto pb-2 md:pb-0 border-b md:border-b-0 md:border-r border-border md:pr-3">
        {SECTIONS.map((s) => (
          <button
            key={s.id}
            onClick={() => setActive(s.id)}
            className={`shrink-0 text-left text-xs font-semibold px-3 py-2 rounded-lg transition ${active === s.id ? "bg-primary/10 text-primary" : "text-muted-foreground hover:bg-muted"}`}
          >
            {s.label}
          </button>
        ))}
      </nav>

      <div className="space-y-5">
        {active === "geral" && (
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4 max-w-xl">
            <FieldRow label="Nome da marca">
              <Input value={g("geral", "brand_name", "Livvo")} onChange={(e) => setC("geral", "brand_name", e.target.value)} />
            </FieldRow>
            <FieldRow label="Tagline">
              <Input value={g("geral", "tagline", "")} onChange={(e) => setC("geral", "tagline", e.target.value)} />
            </FieldRow>
            <FieldRow label="Idioma padrão">
              <Input value={g("geral", "default_locale", "pt-BR")} onChange={(e) => setC("geral", "default_locale", e.target.value)} />
            </FieldRow>
            <FieldRow label="Fuso horário">
              <Input value={g("geral", "default_timezone", "America/Sao_Paulo")} onChange={(e) => setC("geral", "default_timezone", e.target.value)} />
            </FieldRow>
          </div>
        )}

        {active === "contatos" && (
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4 max-w-xl">
            <FieldRow label="Email de suporte">
              <Input type="email" value={g("contatos", "support_email", "")} onChange={(e) => setC("contatos", "support_email", e.target.value)} />
            </FieldRow>
            <FieldRow label="Telefone de suporte">
              <Input value={g("contatos", "support_phone", "")} onChange={(e) => setC("contatos", "support_phone", e.target.value)} />
            </FieldRow>
            <FieldRow label="WhatsApp">
              <Input value={g("contatos", "support_whatsapp", "")} onChange={(e) => setC("contatos", "support_whatsapp", e.target.value)} />
            </FieldRow>
          </div>
        )}

        {active === "social" && (
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4 max-w-xl">
            {[["instagram","Instagram"],["facebook","Facebook"],["linkedin","LinkedIn"],["youtube","YouTube"],["tiktok","TikTok"]].map(([k, l]) => (
              <FieldRow key={k} label={l as string}>
                <Input placeholder="https://..." value={g("social", k as string, "")} onChange={(e) => setC("social", k as string, e.target.value)} />
              </FieldRow>
            ))}
          </div>
        )}

        {active === "seo" && (
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4 max-w-xl">
            <FieldRow label="Meta título">
              <Input value={g("seo", "meta_title", "")} onChange={(e) => setC("seo", "meta_title", e.target.value)} />
            </FieldRow>
            <FieldRow label="Meta descrição">
              <textarea rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" value={g("seo", "meta_description", "")} onChange={(e) => setC("seo", "meta_description", e.target.value)} />
            </FieldRow>
            <FieldRow label="Palavras-chave (separadas por vírgula)">
              <Input value={g("seo", "meta_keywords", "")} onChange={(e) => setC("seo", "meta_keywords", e.target.value)} />
            </FieldRow>
            <FieldRow label="Imagem OG (URL)">
              <Input value={g("seo", "og_image_url", "")} onChange={(e) => setC("seo", "og_image_url", e.target.value)} />
            </FieldRow>
          </div>
        )}

        {active === "comissao" && (
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4 max-w-xl">
            <FieldRow label="Comissão Livvo (%)" hint="Percentual retido de cada pagamento processado pela plataforma.">
              <Input type="number" step="0.5" min={0} max={50} value={core.commission_percent} onChange={(e) => setCore({ ...core, commission_percent: Number(e.target.value) })} />
            </FieldRow>
          </div>
        )}

        {active === "financeiro" && (
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4 max-w-xl">
            <FieldRow label="Chave PIX da plataforma">
              <Input value={g("financeiro", "pix_key", "")} onChange={(e) => setC("financeiro", "pix_key", e.target.value)} />
            </FieldRow>
            <FieldRow label="Gateway ativo" hint="'mock' enquanto os testes estão liberados.">
              <Input value={g("financeiro", "gateway", "mock")} onChange={(e) => setC("financeiro", "gateway", e.target.value)} />
            </FieldRow>
            <FieldRow label="Liberação automática após (dias)">
              <Input type="number" min={0} max={60} value={core.release_after_days} onChange={(e) => setCore({ ...core, release_after_days: Number(e.target.value) })} />
            </FieldRow>
            <FieldRow label="Valor mínimo para repasse (R$)">
              <Input type="number" min={0} value={Number(g("financeiro", "min_payout_amount", 50))} onChange={(e) => setC("financeiro", "min_payout_amount", Number(e.target.value))} />
            </FieldRow>
            <FieldRow label="Janela de cancelamento (horas)">
              <Input type="number" min={0} max={168} value={core.cancellation_window_hours} onChange={(e) => setCore({ ...core, cancellation_window_hours: Number(e.target.value) })} />
            </FieldRow>
            <FieldRow label="Política de reembolso">
              <textarea rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" value={core.refund_policy} onChange={(e) => setCore({ ...core, refund_policy: e.target.value })} />
            </FieldRow>
          </div>
        )}

        {active === "founders" && (
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4 max-w-xl">
            <FieldRow label="Programa ativo?">
              <select className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" value={String(g("founders", "active", true))} onChange={(e) => setC("founders", "active", e.target.value === "true")}>
                <option value="true">Sim</option>
                <option value="false">Não</option>
              </select>
            </FieldRow>
            <FieldRow label="Comissão dos fundadores (%)">
              <Input type="number" step="0.5" min={0} max={50} value={Number(g("founders", "commission_percent", 0))} onChange={(e) => setC("founders", "commission_percent", Number(e.target.value))} />
            </FieldRow>
            <FieldRow label="Vagas totais">
              <Input type="number" min={0} value={Number(g("founders", "slots_total", 100))} onChange={(e) => setC("founders", "slots_total", Number(e.target.value))} />
            </FieldRow>
            <FieldRow label="Vagas ocupadas">
              <Input type="number" min={0} value={Number(g("founders", "slots_used", 0))} onChange={(e) => setC("founders", "slots_used", Number(e.target.value))} />
            </FieldRow>
            <FieldRow label="Encerra em (opcional)">
              <Input type="date" value={g<string>("founders", "ends_at", "")?.slice(0,10) ?? ""} onChange={(e) => setC("founders", "ends_at", e.target.value || null)} />
            </FieldRow>
          </div>
        )}

        {active === "seguranca" && (
          <div className="rounded-2xl bg-card border border-border p-5 space-y-4 max-w-xl">
            <FieldRow label="Exigir 2FA para admins">
              <select className="w-full rounded-xl border border-border bg-background px-3 py-2 text-sm" value={String(g("seguranca", "require_2fa_admin", false))} onChange={(e) => setC("seguranca", "require_2fa_admin", e.target.value === "true")}>
                <option value="false">Não</option>
                <option value="true">Sim</option>
              </select>
            </FieldRow>
            <FieldRow label="Duração da sessão (horas)">
              <Input type="number" min={1} max={720} value={Number(g("seguranca", "session_ttl_hours", 168))} onChange={(e) => setC("seguranca", "session_ttl_hours", Number(e.target.value))} />
            </FieldRow>
            <FieldRow label="Bloquear conta após tentativas falhas">
              <Input type="number" min={1} max={20} value={Number(g("seguranca", "lock_after_failed_attempts", 5))} onChange={(e) => setC("seguranca", "lock_after_failed_attempts", Number(e.target.value))} />
            </FieldRow>
          </div>
        )}

        <div className="flex justify-end sticky bottom-3">
          <Button disabled={!dirty || saving} onClick={handleSave}>{saving ? "Salvando..." : "Salvar alterações"}</Button>
        </div>
      </div>
    </div>
  );
}
