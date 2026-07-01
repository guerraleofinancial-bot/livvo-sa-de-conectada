import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/**
 * Livvo — Métricas para o Dashboard administrativo.
 * Retorna série diária dos principais indicadores.
 */

type Row = { date: string } & Record<string, number>;

function daysAgoISO(days: number) {
  const d = new Date();
  d.setUTCHours(0, 0, 0, 0);
  d.setUTCDate(d.getUTCDate() - (days - 1));
  return d.toISOString();
}

function buildSeries(days: number, buckets: Map<string, Record<string, number>>, keys: string[]): Row[] {
  const out: Row[] = [];
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setUTCDate(today.getUTCDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const b = buckets.get(iso) ?? {};
    const row = { date: iso } as Row;
    for (const k of keys) row[k] = b[k] ?? 0;
    out.push(row);
  }
  return out;
}

export const getAdminGrowthMetrics = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days?: 7 | 30 | 90 }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");

    const days = data.days ?? 30;
    const since = daysAgoISO(days);

    const [pacientes, pros, empresas, appts, payments, commissions] = await Promise.all([
      supabaseAdmin.from("user_roles").select("created_at, user_id").eq("role", "paciente").gte("created_at", since),
      supabaseAdmin.from("professionals").select("created_at, status").gte("created_at", since),
      supabaseAdmin.from("companies").select("created_at, status").gte("created_at", since),
      supabaseAdmin.from("appointments").select("created_at, gross_amount, payment_status").gte("created_at", since),
      supabaseAdmin.from("payments").select("created_at, amount, status").gte("created_at", since),
      supabaseAdmin.from("wallet_transactions").select("created_at, amount, kind").eq("kind", "comissao").gte("created_at", since),
    ]);

    const buckets = new Map<string, Record<string, number>>();
    const bump = (iso: string, key: string, v = 1) => {
      const b = buckets.get(iso) ?? {};
      b[key] = (b[key] ?? 0) + v;
      buckets.set(iso, b);
    };

    (pacientes.data ?? []).forEach((r) => bump(r.created_at.slice(0, 10), "pacientes"));
    (pros.data ?? []).forEach((r) => bump(r.created_at.slice(0, 10), "profissionais"));
    (empresas.data ?? []).forEach((r) => bump(r.created_at.slice(0, 10), "empresas"));
    (appts.data ?? []).forEach((r) => {
      const iso = r.created_at.slice(0, 10);
      bump(iso, "agendamentos");
      if (r.payment_status === "pago") bump(iso, "receita_bruta", Number(r.gross_amount ?? 0));
    });
    (payments.data ?? []).forEach((r) => {
      const iso = r.created_at.slice(0, 10);
      bump(iso, "cobrancas");
      if (r.status === "pago") bump(iso, "receita_bruta", Number(r.amount ?? 0));
    });
    (commissions.data ?? []).forEach((r) => {
      bump(r.created_at.slice(0, 10), "comissao_livvo", Math.abs(Number(r.amount ?? 0)));
    });

    const series = buildSeries(days, buckets, [
      "pacientes", "profissionais", "empresas", "agendamentos", "cobrancas", "receita_bruta", "comissao_livvo",
    ]);

    // Pendentes de aprovação (snapshot atual)
    const [pendPros, pendCos] = await Promise.all([
      supabaseAdmin.from("professionals").select("id", { count: "exact", head: true }).in("status", ["pendente", "em_analise"]),
      supabaseAdmin.from("companies").select("id", { count: "exact", head: true }).eq("status", "pendente"),
    ]);

    const totals = series.reduce(
      (acc, r) => {
        for (const k of Object.keys(r)) if (k !== "date") acc[k] = (acc[k] ?? 0) + Number(r[k]);
        return acc;
      },
      {} as Record<string, number>,
    );

    return {
      days,
      series,
      totals,
      pending: {
        professionals: pendPros.count ?? 0,
        companies: pendCos.count ?? 0,
      },
    };
  });
