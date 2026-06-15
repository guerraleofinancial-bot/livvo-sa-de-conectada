import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const QuoteStatus = z.enum(["rascunho", "enviado", "visualizado", "aprovado", "recusado", "expirado"]);

const ItemSchema = z.object({
  id: z.string().uuid().optional(),
  service_id: z.string().uuid().nullable().optional(),
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(1000).optional().nullable(),
  quantity: z.number().min(0).max(9999),
  unit_price: z.number().min(0).max(1_000_000),
});

async function resolvePatients(supabase: any, ids: string[]) {
  if (!ids.length) return new Map<string, any>();
  const [{ data: profiles }, { data: contacts }] = await Promise.all([
    supabase.from("profiles").select("id, full_name, avatar_url, email, phone").in("id", ids),
    supabase.from("crm_contacts").select("id, full_name, phone, email").in("id", ids),
  ]);
  const map = new Map<string, any>();
  (profiles ?? []).forEach((p: any) => map.set(p.id, { ...p, kind: "user" }));
  (contacts ?? []).forEach((c: any) => { if (!map.has(c.id)) map.set(c.id, { ...c, avatar_url: null, kind: "contact" }); });
  return map;
}

export const listProQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quotes")
      .select("id, status, title, total, valid_until, created_at, sent_at, patient_id")
      .or(`professional_id.eq.${context.userId},assigned_user_id.eq.${context.userId}`)
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw error;
    const ids = Array.from(new Set((data ?? []).map((r: any) => r.patient_id).filter(Boolean))) as string[];
    const map = await resolvePatients(context.supabase, ids);
    return (data ?? []).map((r: any) => ({ ...r, patient: map.get(r.patient_id) ?? null }));
  });


export const listPatientQuotes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("quotes")
      .select("id, status, title, total, valid_until, created_at, sent_at, professional_id, company_id")
      .eq("patient_id", context.userId)
      .neq("status", "rascunho")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: q, error } = await context.supabase
      .from("quotes")
      .select("*, items:quote_items(*)")
      .eq("id", data.id).single();
    if (error) throw error;
    const map = await resolvePatients(context.supabase, q.patient_id ? [q.patient_id] : []);
    (q as any).patient = map.get(q.patient_id) ?? null;
    // mark as viewed if patient is viewing
    if (q.patient_id === context.userId && q.status === "enviado") {
      await context.supabase.from("quotes").update({ status: "visualizado" }).eq("id", q.id);
      q.status = "visualizado";
    }
    return q;
  });


export const createQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { patient_id: string; company_id?: string | null; title?: string }) =>
    z.object({
      patient_id: z.string().uuid(),
      company_id: z.string().uuid().nullable().optional(),
      title: z.string().trim().max(200).optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase.from("quotes").insert({
      patient_id: data.patient_id,
      professional_id: context.userId,
      author_id: context.userId,
      company_id: data.company_id ?? null,
      title: data.title ?? "Orçamento",
      status: "rascunho",
    }).select().single();
    if (error) throw error;
    return row;
  });

export const updateQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    id: string; title?: string; notes?: string; internal_notes?: string;
    discount?: number; valid_until?: string | null;
  }) => z.object({
    id: z.string().uuid(),
    title: z.string().trim().min(1).max(200).optional(),
    notes: z.string().trim().max(2000).optional(),
    internal_notes: z.string().trim().max(2000).optional(),
    discount: z.number().min(0).max(1_000_000).optional(),
    valid_until: z.string().nullable().optional(),
  }).parse(d))
  .handler(async ({ data, context }) => {
    const { id, ...patch } = data;
    const { data: row, error } = await context.supabase.from("quotes")
      .update(patch).eq("id", id).select().single();
    if (error) throw error;
    return row;
  });

export const saveQuoteItems = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { quote_id: string; items: z.infer<typeof ItemSchema>[] }) =>
    z.object({ quote_id: z.string().uuid(), items: z.array(ItemSchema) }).parse(d))
  .handler(async ({ data, context }) => {
    // simple strategy: delete all and reinsert
    await context.supabase.from("quote_items").delete().eq("quote_id", data.quote_id);
    if (data.items.length === 0) return { ok: true };
    const rows = data.items.map((it, idx) => ({
      quote_id: data.quote_id,
      service_id: it.service_id ?? null,
      name: it.name,
      description: it.description ?? null,
      quantity: it.quantity,
      unit_price: it.unit_price,
      position: idx,
    }));
    const { error } = await context.supabase.from("quote_items").insert(rows);
    if (error) throw error;
    return { ok: true };
  });

export const setQuoteStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string; status: z.infer<typeof QuoteStatus>; reason?: string }) =>
    z.object({ id: z.string().uuid(), status: QuoteStatus, reason: z.string().trim().max(500).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const patch: { status: z.infer<typeof QuoteStatus>; decision_reason?: string } = { status: data.status };
    if (data.reason) patch.decision_reason = data.reason;
    const { data: row, error } = await context.supabase.from("quotes")
      .update(patch).eq("id", data.id).select().single();
    if (error) throw error;
    return row;
  });

export const deleteQuote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("quotes").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const listProServicesForQuote = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("services").select("id, name, price, duration_minutes")
      .or(`professional_id.eq.${context.userId}`)
      .eq("active", true)
      .order("name");
    if (error) throw error;
    return data ?? [];
  });
