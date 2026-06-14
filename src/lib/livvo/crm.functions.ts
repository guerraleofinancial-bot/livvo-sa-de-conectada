import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const StatusEnum = z.enum([
  "novo_lead", "contato_realizado", "orcamento_enviado", "aguardando_decisao",
  "agendado", "confirmada", "atendido", "fidelizado",
  "retorno_pendente", "inativo", "cancelado",
]);

const OriginEnum = z.enum([
  "busca_organica", "anuncio_patrocinado", "indicacao", "cadastro_direto",
  "importado", "perfil_publico", "campanha", "outros",
]);

export const listCrmPatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("crm_patient_relationships")
      .select("*, patient:patient_id(id, full_name, avatar_url, phone, email, city, date_of_birth)")
      .eq("professional_id", context.userId)
      .order("updated_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const getCrmPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { relationshipId: string }) => z.object({ relationshipId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rel, error } = await context.supabase
      .from("crm_patient_relationships")
      .select("*, patient:patient_id(id, full_name, avatar_url, phone, email, city, date_of_birth)")
      .eq("id", data.relationshipId).single();
    if (error) throw error;

    const [appts, notes, quotes] = await Promise.all([
      context.supabase.from("appointments")
        .select("id, scheduled_at, status, gross_amount, service_id, created_at")
        .eq("professional_id", rel.professional_id).eq("patient_id", rel.patient_id)
        .order("scheduled_at", { ascending: false }),
      context.supabase.from("crm_patient_notes")
        .select("*")
        .eq("professional_id", rel.professional_id).eq("patient_id", rel.patient_id)
        .order("created_at", { ascending: false }),
      context.supabase.from("quotes")
        .select("id, status, title, total, created_at, sent_at, decided_at, valid_until")
        .eq("patient_id", rel.patient_id)
        .or(`professional_id.eq.${rel.professional_id},assigned_user_id.eq.${rel.professional_id}`)
        .order("created_at", { ascending: false }),
    ]);
    return { relationship: rel, appointments: appts.data ?? [], notes: notes.data ?? [], quotes: quotes.data ?? [] };
  });

export const updateCrmStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { relationshipId: string; status: z.infer<typeof StatusEnum>; override?: boolean }) =>
    z.object({ relationshipId: z.string().uuid(), status: StatusEnum, override: z.boolean().default(true) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: result, error } = await context.supabase.rpc("crm_set_status", {
      _rel_id: data.relationshipId, _status: data.status, _override: data.override,
    });
    if (error) throw error;
    return result;
  });

export const updateCrmRelationship = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { relationshipId: string; origin?: z.infer<typeof OriginEnum>; quick_note?: string; assigned_user_id?: string | null }) =>
    z.object({
      relationshipId: z.string().uuid(),
      origin: OriginEnum.optional(),
      quick_note: z.string().trim().max(500).optional(),
      assigned_user_id: z.string().uuid().nullable().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const patch: {
      origin?: z.infer<typeof OriginEnum>;
      quick_note?: string;
      assigned_user_id?: string | null;
    } = {};
    if (data.origin !== undefined) patch.origin = data.origin;
    if (data.quick_note !== undefined) patch.quick_note = data.quick_note;
    if (data.assigned_user_id !== undefined) patch.assigned_user_id = data.assigned_user_id;
    const { data: row, error } = await context.supabase
      .from("crm_patient_relationships")
      .update(patch)
      .eq("id", data.relationshipId)
      .eq("professional_id", context.userId)
      .select()
      .single();
    if (error) throw error;
    return row;
  });

export const addCrmNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { relationshipId: string; content: string; visibility: "private" | "clinic" }) =>
    z.object({
      relationshipId: z.string().uuid(),
      content: z.string().trim().min(1).max(2000),
      visibility: z.enum(["private", "clinic"]),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rel, error: relErr } = await context.supabase
      .from("crm_patient_relationships")
      .select("professional_id, patient_id, company_id")
      .eq("id", data.relationshipId).single();
    if (relErr) throw relErr;
    if (rel.professional_id !== context.userId) throw new Error("Forbidden");
    const { data: row, error } = await context.supabase.from("crm_patient_notes").insert({
      professional_id: rel.professional_id, patient_id: rel.patient_id, company_id: rel.company_id,
      author_id: context.userId, visibility: data.visibility, content: data.content,
    }).select().single();
    if (error) throw error;
    return row;
  });

export const deleteCrmNote = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { noteId: string }) => z.object({ noteId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("crm_patient_notes").delete().eq("id", data.noteId);
    if (error) throw error;
    return { ok: true };
  });

export const getCrmDashboard = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rangeDays?: number }) => z.object({ rangeDays: z.number().int().min(1).max(365).default(30) }).parse(d))
  .handler(async ({ data, context }) => {
    const to = new Date();
    const from = new Date(to.getTime() - data.rangeDays * 86400000);
    const { data: result, error } = await context.supabase.rpc("crm_dashboard", {
      _pro: context.userId, _from: from.toISOString(), _to: to.toISOString(),
    });
    if (error) throw error;
    return result as Record<string, number>;
  });
