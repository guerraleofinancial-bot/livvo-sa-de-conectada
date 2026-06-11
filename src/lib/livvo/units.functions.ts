import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const unitSchema = z.object({
  id: z.string().uuid().optional(),
  company_id: z.string().uuid(),
  name: z.string().min(2),
  address_street: z.string().optional().nullable(),
  address_number: z.string().optional().nullable(),
  address_district: z.string().optional().nullable(),
  address_city: z.string().optional().nullable(),
  address_state: z.string().length(2).optional().nullable(),
  address_zip: z.string().optional().nullable(),
  latitude: z.number().optional().nullable(),
  longitude: z.number().optional().nullable(),
  phone: z.string().optional().nullable(),
  business_hours: z.record(z.string(), z.unknown()).optional(),
  active: z.boolean().optional(),
});

export const upsertUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: z.input<typeof unitSchema>) => unitSchema.parse(d))
  .handler(async ({ data, context }) => {
    const { data: isOwner } = await context.supabase.rpc("is_company_owner", { _user: context.userId, _company: data.company_id });
    if (!isOwner) {
      const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
      if (!isAdmin) throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.from("company_units").upsert(data).select().single();
    if (error) throw error;
    return row;
  });

export const upsertResource = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; unit_id: string; name: string; kind: string; description?: string; active?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: unit } = await supabaseAdmin.from("company_units").select("company_id").eq("id", data.unit_id).single();
    if (!unit) throw new Error("Unidade não encontrada");
    const { data: isOwner } = await context.supabase.rpc("is_company_owner", { _user: context.userId, _company: unit.company_id });
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isOwner && !isAdmin) throw new Error("Forbidden");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: row, error } = await supabaseAdmin.from("resources").upsert(data as any).select().single();
    if (error) throw error;
    return row;
  });

export const linkProfessionalToUnit = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { unit_id: string; professional_id: string; is_default?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: unit } = await supabaseAdmin.from("company_units").select("company_id").eq("id", data.unit_id).single();
    if (!unit) throw new Error("Unidade não encontrada");
    const { data: isOwner } = await context.supabase.rpc("is_company_owner", { _user: context.userId, _company: unit.company_id });
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isOwner && !isAdmin) throw new Error("Forbidden");
    const { error } = await supabaseAdmin.from("unit_professionals").upsert(data, { onConflict: "unit_id,professional_id" });
    if (error) throw error;
    return { ok: true };
  });
