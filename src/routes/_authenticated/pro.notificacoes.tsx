import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listNotifications, markNotificationsRead, getNotificationPreferences, upsertNotificationPreferences } from "@/lib/livvo/notifications.functions";
import { Bell, Check, Settings as SettingsIcon } from "lucide-react";
import { useState, useEffect } from "react";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/pro/notificacoes")({
  component: NotifPage,
});

const EVENTS: Array<[string, string]> = [
  ["appointment_created", "Novo agendamento"],
  ["appointment_confirmed", "Confirmação"],
  ["appointment_cancelled", "Cancelamento"],
  ["appointment_rescheduled", "Reagendamento"],
  ["new_message", "Nova mensagem"],
  ["new_review", "Nova avaliação"],
  ["appointment_reminder", "Lembretes"],
  ["review_request", "Pedido de avaliação"],
  ["retention_campaign", "Campanha de retorno"],
];

function NotifPage() {
  const qc = useQueryClient();
  const [tab, setTab] = useState<"inbox" | "prefs">("inbox");
  const list = useServerFn(listNotifications);
  const mark = useServerFn(markNotificationsRead);
  const getPrefs = useServerFn(getNotificationPreferences);
  const savePrefs = useServerFn(upsertNotificationPreferences);

  const { data: items } = useQuery({ queryKey: ["notifs"], queryFn: () => list() });
  const { data: prefs } = useQuery({ queryKey: ["notif-prefs"], queryFn: () => getPrefs() });

  const markMut = useMutation({
    mutationFn: () => mark({ data: {} }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifs"] }),
  });

  const [form, setForm] = useState({ in_app: true, email: false, whatsapp: false, events_muted: [] as string[], whatsapp_phone: "" });
  useEffect(() => {
    if (prefs) setForm({
      in_app: prefs.in_app, email: prefs.email, whatsapp: prefs.whatsapp,
      events_muted: prefs.events_muted ?? [], whatsapp_phone: prefs.whatsapp_phone ?? "",
    });
  }, [prefs]);

  const saveMut = useMutation({
    mutationFn: () => savePrefs({ data: { ...form, whatsapp_phone: form.whatsapp_phone || null } }),
    onSuccess: () => { toast.success("Preferências salvas"); qc.invalidateQueries({ queryKey: ["notif-prefs"] }); },
  });

  function toggleEvent(k: string) {
    setForm((f) => ({ ...f, events_muted: f.events_muted.includes(k) ? f.events_muted.filter((x) => x !== k) : [...f.events_muted, k] }));
  }

  return (
    <div className="px-5 pt-10 space-y-5 livvo-fade-in pb-10">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Notificações</h1>
          <p className="text-sm text-muted-foreground mt-1">Central de avisos e preferências</p>
        </div>
        {tab === "inbox" && items && items.some((n) => !n.read_at) && (
          <Button size="sm" variant="outline" onClick={() => markMut.mutate()}><Check className="size-3 mr-1" /> Marcar lidas</Button>
        )}
      </header>

      <div className="grid grid-cols-2 gap-1 rounded-xl bg-muted p-1">
        <button onClick={() => setTab("inbox")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === "inbox" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Inbox</button>
        <button onClick={() => setTab("prefs")} className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === "prefs" ? "bg-card shadow-sm" : "text-muted-foreground"}`}>Preferências</button>
      </div>

      {tab === "inbox" ? (
        <div className="space-y-2">
          {(items ?? []).map((n) => (
            <a key={n.id} href={n.link ?? "#"} className={`block rounded-2xl border p-3 ${n.read_at ? "border-border bg-card" : "border-primary/30 bg-primary-soft"}`}>
              <div className="flex items-start gap-3">
                <Bell className="size-4 mt-0.5 text-primary" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold">{n.title}</p>
                  {n.body && <p className="text-xs text-muted-foreground mt-0.5">{n.body}</p>}
                  <p className="text-[10px] text-muted-foreground mt-1">{new Date(n.created_at).toLocaleString("pt-BR")}</p>
                </div>
              </div>
            </a>
          ))}
          {items && items.length === 0 && (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <Bell className="size-8 mx-auto text-muted-foreground mb-3" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação ainda.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
            <h2 className="text-sm font-bold flex items-center gap-2"><SettingsIcon className="size-4" /> Canais</h2>
            <Row label="No painel (in-app)" checked={form.in_app} onChange={(v) => setForm({ ...form, in_app: v })} />
            <Row label="E-mail (em breve)" checked={form.email} disabled onChange={(v) => setForm({ ...form, email: v })} hint="Integração com Resend prevista." />
            <Row label="WhatsApp (em breve)" checked={form.whatsapp} disabled onChange={(v) => setForm({ ...form, whatsapp: v })} hint="Integração com WhatsApp Business / Evolution / Z-API prevista." />
            {form.whatsapp && (
              <Input placeholder="(11) 99999-9999" value={form.whatsapp_phone} onChange={(e) => setForm({ ...form, whatsapp_phone: e.target.value })} />
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
            <h2 className="text-sm font-bold">Eventos</h2>
            <p className="text-[11px] text-muted-foreground">Desmarque para silenciar.</p>
            {EVENTS.map(([k, label]) => (
              <label key={k} className="flex items-center justify-between py-1.5">
                <span className="text-sm">{label}</span>
                <Switch checked={!form.events_muted.includes(k)} onCheckedChange={() => toggleEvent(k)} />
              </label>
            ))}
          </div>

          <Button className="w-full" onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
            Salvar preferências
          </Button>
        </div>
      )}
    </div>
  );
}

function Row({ label, checked, onChange, disabled, hint }: { label: string; checked: boolean; onChange: (v: boolean) => void; disabled?: boolean; hint?: string }) {
  return (
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-sm">{label}</p>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
