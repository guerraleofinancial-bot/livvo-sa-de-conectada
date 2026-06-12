import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function isAdmin(ctx: any): Promise<boolean> {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  return !!data;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertOwnership(ctx: any, targetType: "professional" | "company", targetId: string) {
  if (await isAdmin(ctx)) return;
  if (targetType === "professional") {
    if (targetId !== ctx.userId) throw new Error("Forbidden");
    return;
  }
  const { data } = await ctx.supabase.from("companies").select("owner_id").eq("id", targetId).maybeSingle();
  if (!data || data.owner_id !== ctx.userId) throw new Error("Forbidden");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertTargetExists(ctx: any, targetType: "professional" | "company", targetId: string) {
  const table = targetType === "professional" ? "professionals" : "companies";
  const { data } = await ctx.supabase.from(table).select("id").eq("id", targetId).maybeSingle();
  if (!data) {
    throw new Error(
      targetType === "professional"
        ? "ONBOARDING_REQUIRED:Complete seu cadastro profissional antes de contratar um destaque."
        : "ONBOARDING_REQUIRED:Cadastro de empresa não encontrado.",
    );
  }
}

export const listFeaturedPlans = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase.from("featured_plans").select("*").eq("active", true).order("price_cents");
    if (error) throw error;
    return data ?? [];
  });

export const subscribeToPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    planId: string;
    targetType: "professional" | "company";
    targetId: string;
    regions?: Array<{ state: string; city?: string | null; district?: string | null }>;
    categories?: Array<{ specialtyId?: string | null; companyType?: string | null }>;
  }) =>
    z.object({
      planId: z.string().uuid(),
      targetType: z.enum(["professional", "company"]),
      targetId: z.string().uuid(),
      regions: z.array(z.object({ state: z.string().min(2).max(2), city: z.string().nullable().optional(), district: z.string().nullable().optional() })).optional(),
      categories: z.array(z.object({ specialtyId: z.string().uuid().nullable().optional(), companyType: z.string().nullable().optional() })).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertOwnership(context, data.targetType, data.targetId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: plan } = await supabaseAdmin.from("featured_plans").select("*").eq("id", data.planId).single();
    if (!plan || !plan.active) throw new Error("Plano indisponível");
    const startsAt = new Date();
    const endsAt = new Date(startsAt.getTime() + plan.duration_days * 86400000);
    const { data: sub, error } = await supabaseAdmin.from("featured_subscriptions").insert({
      plan_id: plan.id,
      target_type: data.targetType,
      professional_id: data.targetType === "professional" ? data.targetId : null,
      company_id: data.targetType === "company" ? data.targetId : null,
      status: "ativo",
      starts_at: startsAt.toISOString(),
      ends_at: endsAt.toISOString(),
      amount_paid_cents: plan.price_cents,
      payment_ref: `mock_${Date.now()}`,
      created_by: context.userId,
    }).select().single();
    if (error || !sub) throw error ?? new Error("Falha ao contratar");
    if (plan.kind === "regional" && data.regions?.length) {
      await supabaseAdmin.from("featured_regions").insert(
        data.regions.map((r) => ({ subscription_id: sub.id, state: r.state, city: r.city ?? null, district: r.district ?? null })),
      );
    }
    if (plan.kind === "category" && data.categories?.length) {
      await supabaseAdmin.from("featured_categories").insert(
        data.categories.map((c) => ({ subscription_id: sub.id, specialty_id: c.specialtyId ?? null, company_type: (c.companyType ?? null) as never })),
      );
    }
    return { ok: true, subscriptionId: sub.id };
  });

export const cancelSubscription = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { subscriptionId: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: sub } = await supabaseAdmin.from("featured_subscriptions").select("*").eq("id", data.subscriptionId).single();
    if (!sub) throw new Error("Não encontrado");
    await assertOwnership(context, sub.target_type as "professional" | "company", (sub.professional_id ?? sub.company_id) as string);
    await supabaseAdmin.from("featured_subscriptions").update({ status: "cancelado" }).eq("id", sub.id);
    return { ok: true };
  });

export const myActiveSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetType: "professional" | "company"; targetId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertOwnership(context, data.targetType, data.targetId);
    const { supabase } = context;
    const col = data.targetType === "professional" ? "professional_id" : "company_id";
    const { data: list } = await supabase
      .from("featured_subscriptions")
      .select("*, featured_plans(name, kind, perks, price_cents, duration_days)")
      .eq(col, data.targetId)
      .order("created_at", { ascending: false });
    return list ?? [];
  });

export const trackAdEvent = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { subscriptionId?: string | null; targetType: "professional" | "company"; targetId: string; kind: "impression" | "click" | "booking"; context?: Record<string, unknown> }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("ad_impressions").insert({
      subscription_id: data.subscriptionId ?? null,
      target_type: data.targetType,
      professional_id: data.targetType === "professional" ? data.targetId : null,
      company_id: data.targetType === "company" ? data.targetId : null,
      kind: data.kind,
      viewer_id: context.userId,
      context: (data.context ?? null) as never,
    });
    return { ok: true };
  });

export const adsAnalyticsForProvider = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { targetType: "professional" | "company"; targetId: string; days?: number }) => d)
  .handler(async ({ data, context }) => {
    await assertOwnership(context, data.targetType, data.targetId);
    const { supabase } = context;
    const since = new Date(Date.now() - (data.days ?? 30) * 86400000).toISOString();
    const col = data.targetType === "professional" ? "professional_id" : "company_id";
    const { data: rows } = await supabase.from("ad_impressions").select("kind").eq(col, data.targetId).gte("occurred_at", since);
    let impressions = 0, clicks = 0, bookings = 0;
    (rows ?? []).forEach((r: { kind: string }) => {
      if (r.kind === "impression") impressions++;
      else if (r.kind === "click") clicks++;
      else if (r.kind === "booking") bookings++;
    });
    const conversion = clicks > 0 ? (bookings / clicks) * 100 : 0;
    return { impressions, clicks, bookings, conversion };
  });

export const adminAdsRevenueReport = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { days: number }) => d)
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const to = new Date();
    const from = new Date(to.getTime() - data.days * 86400000);
    const { data: summary } = await supabaseAdmin.rpc("ads_revenue_summary", { _from: from.toISOString(), _to: to.toISOString() });
    const row = Array.isArray(summary) ? summary[0] : summary;
    const adsCents = Number(row?.total_cents ?? 0);
    const subsCount = Number(row?.subscriptions_count ?? 0);
    const { data: tx } = await supabaseAdmin.from("wallet_transactions").select("amount").eq("kind", "comissao").gte("created_at", from.toISOString());
    const commissions = Math.abs((tx ?? []).reduce((s, t) => s + Number(t.amount), 0));
    return { adsCents, subsCount, commissions, total: commissions + adsCents / 100 };
  });

export const adminUpsertPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; code: string; name: string; kind: "premium" | "regional" | "category" | "perfil_premium"; price_cents: number; duration_days: number; description?: string; active?: boolean }) => d)
  .handler(async ({ data, context }) => {
    if (!(await isAdmin(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("featured_plans").upsert(data as never);
    if (error) throw error;
    return { ok: true };
  });

export const adminListSubscriptions = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    if (!(await isAdmin(context))) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("featured_subscriptions")
      .select("*, featured_plans(name, kind), profiles:professional_id(full_name), companies:company_id(legal_name)")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });
