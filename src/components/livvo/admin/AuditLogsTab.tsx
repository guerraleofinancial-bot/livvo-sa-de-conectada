import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { listAuditLogs, listAuditFacets } from "@/lib/livvo/audit.functions";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronRight } from "lucide-react";

type Row = {
  id: string; created_at: string; actor_id: string | null; actor_email: string | null; actor_role: string | null;
  event: string; module: string; entity_type: string | null; entity_id: string | null; description: string | null;
  before_data: unknown; after_data: unknown; ip_address: string | null; user_agent: string | null;
};

export function AuditLogsTab() {
  const listFn = useServerFn(listAuditLogs);
  const facetsFn = useServerFn(listAuditFacets);
  const [q, setQ] = useState("");
  const [event, setEvent] = useState<string>("");
  const [mod, setMod] = useState<string>("");
  const [since, setSince] = useState<string>("");
  const [until, setUntil] = useState<string>("");
  const [offset, setOffset] = useState(0);
  const limit = 50;
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const filters = useMemo(() => ({
    q: q || null,
    event: event || null,
    module: mod || null,
    since: since ? new Date(since).toISOString() : null,
    until: until ? new Date(until + "T23:59:59").toISOString() : null,
    limit, offset,
  }), [q, event, mod, since, until, offset]);

  const { data: facets } = useQuery({ queryKey: ["audit-facets"], queryFn: () => facetsFn() });
  const { data, isLoading, refetch } = useQuery({
    queryKey: ["audit-logs", filters],
    queryFn: () => listFn({ data: filters }),
  });

  const rows = (data?.rows ?? []) as Row[];
  const total = data?.total ?? 0;

  return (
    <section className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
        <Input placeholder="Buscar (descrição, email, evento)" value={q} onChange={(e) => { setOffset(0); setQ(e.target.value); }} className="md:col-span-2" />
        <select className="rounded-xl border border-border bg-background px-3 py-2 text-sm" value={event} onChange={(e) => { setOffset(0); setEvent(e.target.value); }}>
          <option value="">Todos eventos</option>
          {(facets?.events ?? []).map((ev) => <option key={ev} value={ev}>{ev}</option>)}
        </select>
        <select className="rounded-xl border border-border bg-background px-3 py-2 text-sm" value={mod} onChange={(e) => { setOffset(0); setMod(e.target.value); }}>
          <option value="">Todos módulos</option>
          {(facets?.modules ?? []).map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
        <Input type="date" value={since} onChange={(e) => { setOffset(0); setSince(e.target.value); }} />
        <Input type="date" value={until} onChange={(e) => { setOffset(0); setUntil(e.target.value); }} />
      </div>

      <div className="rounded-2xl bg-card border border-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-[10px] uppercase font-bold text-muted-foreground">
            <tr>
              <th className="text-left p-3 w-8"></th>
              <th className="text-left p-3">Quando</th>
              <th className="text-left p-3">Ator</th>
              <th className="text-left p-3">Evento</th>
              <th className="text-left p-3 hidden md:table-cell">Módulo</th>
              <th className="text-left p-3">Descrição</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">Carregando...</td></tr>
            )}
            {!isLoading && rows.length === 0 && (
              <tr><td colSpan={6} className="p-6 text-center text-xs text-muted-foreground">Nenhum log encontrado com esses filtros.</td></tr>
            )}
            {rows.map((r) => {
              const open = !!expanded[r.id];
              return (
                <>
                  <tr key={r.id} className="border-t border-border hover:bg-muted/30 cursor-pointer" onClick={() => setExpanded((s) => ({ ...s, [r.id]: !s[r.id] }))}>
                    <td className="p-3">{open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}</td>
                    <td className="p-3 whitespace-nowrap text-xs">{new Date(r.created_at).toLocaleString("pt-BR")}</td>
                    <td className="p-3 text-xs">
                      <div className="font-semibold truncate max-w-[160px]">{r.actor_email ?? "—"}</div>
                      <div className="text-[10px] text-muted-foreground uppercase">{r.actor_role ?? "system"}</div>
                    </td>
                    <td className="p-3"><code className="text-[11px] bg-muted px-2 py-0.5 rounded">{r.event}</code></td>
                    <td className="p-3 hidden md:table-cell text-xs">{r.module}</td>
                    <td className="p-3 text-xs">{r.description ?? <span className="text-muted-foreground">—</span>}</td>
                  </tr>
                  {open && (
                    <tr key={r.id + "-d"} className="border-t border-border bg-muted/20">
                      <td colSpan={6} className="p-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <p className="font-bold uppercase text-muted-foreground mb-1">Entidade</p>
                            <p>{r.entity_type ?? "—"} · <span className="font-mono">{r.entity_id ?? "—"}</span></p>
                            <p className="mt-2 text-muted-foreground">IP: {r.ip_address ?? "—"}</p>
                            <p className="text-muted-foreground truncate">UA: {r.user_agent ?? "—"}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <p className="font-bold uppercase text-muted-foreground mb-1">Antes</p>
                              <pre className="text-[10px] bg-background border border-border rounded p-2 overflow-auto max-h-40">{JSON.stringify(r.before_data, null, 2) || "—"}</pre>
                            </div>
                            <div>
                              <p className="font-bold uppercase text-muted-foreground mb-1">Depois</p>
                              <pre className="text-[10px] bg-background border border-border rounded p-2 overflow-auto max-h-40">{JSON.stringify(r.after_data, null, 2) || "—"}</pre>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <p>Mostrando {rows.length} de {total} registro(s)</p>
        <div className="flex gap-2">
          <Button size="sm" variant="outline" disabled={offset === 0} onClick={() => setOffset(Math.max(0, offset - limit))}>Anterior</Button>
          <Button size="sm" variant="outline" disabled={offset + limit >= total} onClick={() => setOffset(offset + limit)}>Próximo</Button>
          <Button size="sm" variant="ghost" onClick={() => refetch()}>Atualizar</Button>
        </div>
      </div>
    </section>
  );
}
