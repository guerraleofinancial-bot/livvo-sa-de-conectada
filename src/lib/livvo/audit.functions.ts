import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { getRequest } from "@tanstack/react-start/server";

/**
 * Livvo — Audit logs
 * Todos os writes usam o service_role (via supabaseAdmin) para nunca falhar
 * por RLS. A leitura é restrita a admins (política de RLS na tabela).
 */

export type AuditModule =
  | "auth"
  | "admin"
  | "settings"
  | "crm"
  | "agenda"
  | "billing"
  | "profile"
  | "system";

export type AuditPayload = {
  event: string;
  module: AuditModule;
  actorId?: string | null;
  actorEmail?: string | null;
  actorRole?: string | null;
  entityType?: string | null;
  entityId?: string | null;
  description?: string | null;
  before?: unknown;
  after?: unknown;
  ip?: string | null;
  userAgent?: string | null;
};

/**
 * Helper interno reutilizável dentro de outras server functions.
 * Nunca lança — falhas de auditoria não podem quebrar o fluxo principal.
 */
export async function writeAudit(p: AuditPayload): Promise<void> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let ip = p.ip ?? null;
    let ua = p.userAgent ?? null;
    if (!ip || !ua) {
      try {
        const req = getRequest();
        if (req?.headers) {
          ip = ip ?? req.headers.get("x-forwarded-for") ?? req.headers.get("x-real-ip") ?? null;
          ua = ua ?? req.headers.get("user-agent") ?? null;
        }
      } catch { /* no-op fora de request */ }
    }
    await supabaseAdmin.from("audit_logs").insert({
      event: p.event,
      module: p.module,
      actor_id: p.actorId ?? null,
      actor_email: p.actorEmail ?? null,
      actor_role: p.actorRole ?? null,
      entity_type: p.entityType ?? null,
      entity_id: p.entityId ? String(p.entityId) : null,
      description: p.description ?? null,
      before_data: p.before as never ?? null,
      after_data: p.after as never ?? null,
      ip_address: ip,
      user_agent: ua,
    });
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error("[audit] failed to write log", e);
  }
}

/** Endpoint público (autenticado) usado pelo cliente para registrar eventos leves como login/signup. */
export const recordClientAudit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { event: string; module: AuditModule; description?: string | null; entityType?: string | null; entityId?: string | null }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: u } = await supabaseAdmin.auth.admin.getUserById(context.userId);
    const email = u.user?.email ?? null;
    const { data: roles } = await supabaseAdmin.from("user_roles").select("role").eq("user_id", context.userId);
    const primaryRole =
      roles?.find((r) => r.role === "admin")?.role ??
      roles?.find((r) => r.role === "empresa")?.role ??
      roles?.find((r) => r.role === "profissional")?.role ??
      roles?.[0]?.role ?? null;
    await writeAudit({
      event: data.event,
      module: data.module,
      actorId: context.userId,
      actorEmail: email,
      actorRole: primaryRole,
      description: data.description ?? null,
      entityType: data.entityType ?? null,
      entityId: data.entityId ?? null,
    });
    return { ok: true };
  });

export const listAuditLogs = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    limit?: number;
    offset?: number;
    event?: string | null;
    module?: string | null;
    actorId?: string | null;
    entityType?: string | null;
    entityId?: string | null;
    since?: string | null; // ISO date
    until?: string | null;
    q?: string | null;
  }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const limit = Math.min(Math.max(1, data.limit ?? 100), 500);
    const offset = Math.max(0, data.offset ?? 0);
    let q = supabaseAdmin.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false });
    if (data.event) q = q.eq("event", data.event);
    if (data.module) q = q.eq("module", data.module);
    if (data.actorId) q = q.eq("actor_id", data.actorId);
    if (data.entityType) q = q.eq("entity_type", data.entityType);
    if (data.entityId) q = q.eq("entity_id", data.entityId);
    if (data.since) q = q.gte("created_at", data.since);
    if (data.until) q = q.lte("created_at", data.until);
    if (data.q) q = q.or(`description.ilike.%${data.q}%,actor_email.ilike.%${data.q}%,event.ilike.%${data.q}%`);
    const { data: rows, count, error } = await q.range(offset, offset + limit - 1);
    if (error) throw error;
    return { rows: rows ?? [], total: count ?? 0 };
  });

export const listAuditFacets = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: isAdmin } = await supabaseAdmin.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { data } = await supabaseAdmin.from("audit_logs").select("event, module").limit(2000).order("created_at", { ascending: false });
    const events = Array.from(new Set((data ?? []).map((r) => r.event))).sort();
    const modules = Array.from(new Set((data ?? []).map((r) => r.module))).sort();
    return { events, modules };
  });
