import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const StatusEnum = z.enum([
  "novo_lead", "agendado", "confirmada", "atendido", "cancelado", "retorno_pendente", "inativo",
]);

export const listCrmPatients = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("crm_patient_relationships")
      .select("*, patient:patient_id(id, full_name, avatar_url, phone, email)")
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
      .select("*, patient:patient_id(id, full_name, avatar_url, phone, email)")
      .eq("id", data.relationshipId).single();
    if (error) throw error;

    const [appts, notes] = await Promise.all([
      context.supabase.from("appointments")
        .select("id, scheduled_at, status, gross_amount, service_id")
        .eq("professional_id", rel.professional_id).eq("patient_id", rel.patient_id)
        .order("scheduled_at", { ascending: false }),
      context.supabase.from("crm_patient_notes")
        .select("*")
        .eq("professional_id", rel.professional_id).eq("patient_id", rel.patient_id)
        .order("created_at", { ascending: false }),
    ]);
    return { relationship: rel, appointments: appts.data ?? [], notes: notes.data ?? [] };
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
