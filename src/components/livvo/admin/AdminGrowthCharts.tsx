import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import { getAdminGrowthMetrics } from "@/lib/livvo/admin-metrics.functions";

const METRIC_META: Record<string, { label: string; kind: "line" | "bar"; color: string; format?: (v: number) => string }> = {
  pacientes:       { label: "Pacientes cadastrados",   kind: "line", color: "hsl(var(--primary))" },
  profissionais:   { label: "Profissionais cadastrados", kind: "line", color: "hsl(var(--health))" },
  empresas:        { label: "Empresas cadastradas",    kind: "line", color: "#0ea5e9" },
  agendamentos:    { label: "Agendamentos criados",    kind: "bar",  color: "hsl(var(--primary))" },
  cobrancas:       { label: "Cobranças enviadas",      kind: "bar",  color: "#f59e0b" },
  receita_bruta:   { label: "Receita bruta",           kind: "line", color: "#16a34a", format: (v) => `R$ ${v.toFixed(0)}` },
  comissao_livvo:  { label: "Comissão Livvo",          kind: "line", color: "#a855f7", format: (v) => `R$ ${v.toFixed(0)}` },
};

export function AdminGrowthCharts() {
  const [days, setDays] = useState<7 | 30 | 90>(30);
  const fetchMetrics = useServerFn(getAdminGrowthMetrics);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-growth", days],
    queryFn: () => fetchMetrics({ data: { days } }),
  });

  const series = useMemo(() => data?.series ?? [], [data]);
  const totals = data?.totals ?? {};

  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold">Crescimento — últimos {days} dias</h3>
        <div className="flex gap-1">
          {[7, 30, 90].map((d) => (
            <button
              key={d}
              onClick={() => setDays(d as 7 | 30 | 90)}
              className={`px-3 py-1 text-xs font-semibold rounded-full border ${days === d ? "bg-primary text-primary-foreground border-primary" : "bg-card border-border text-muted-foreground"}`}
            >
              {d}d
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.keys(METRIC_META).map((k) => {
          const meta = METRIC_META[k];
          const v = Number(totals[k] ?? 0);
          return (
            <div key={k} className="rounded-2xl bg-card border border-border p-3">
              <p className="text-[10px] font-bold uppercase text-muted-foreground truncate">{meta.label}</p>
              <p className="font-mono text-xl font-bold mt-1">{meta.format ? meta.format(v) : v}</p>
            </div>
          );
        })}
        <div className="rounded-2xl bg-warning/10 border border-warning/30 p-3">
          <p className="text-[10px] font-bold uppercase text-warning">Aprovações pendentes</p>
          <p className="font-mono text-xl font-bold mt-1">{(data?.pending.professionals ?? 0) + (data?.pending.companies ?? 0)}</p>
          <p className="text-[10px] text-muted-foreground mt-0.5">{data?.pending.professionals ?? 0} profissionais · {data?.pending.companies ?? 0} empresas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {Object.entries(METRIC_META).map(([key, meta]) => (
          <div key={key} className="rounded-2xl bg-card border border-border p-4">
            <p className="text-xs font-bold text-muted-foreground mb-2">{meta.label}</p>
            <div className="h-40">
              {isLoading ? (
                <div className="h-full grid place-items-center text-xs text-muted-foreground">Carregando...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  {meta.kind === "line" ? (
                    <LineChart data={series} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip formatter={(v: number) => meta.format ? meta.format(v) : v} labelFormatter={(l) => new Date(l).toLocaleDateString("pt-BR")} />
                      <Line type="monotone" dataKey={key} stroke={meta.color} strokeWidth={2} dot={false} />
                    </LineChart>
                  ) : (
                    <BarChart data={series} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} fontSize={10} />
                      <YAxis fontSize={10} />
                      <Tooltip formatter={(v: number) => meta.format ? meta.format(v) : v} labelFormatter={(l) => new Date(l).toLocaleDateString("pt-BR")} />
                      <Bar dataKey={key} fill={meta.color} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  )}
                </ResponsiveContainer>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
