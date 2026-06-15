import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const OriginEnum = z.enum([
  "busca_organica", "anuncio_patrocinado", "indicacao", "cadastro_direto",
  "importado", "perfil_publico", "campanha", "outros",
]);

const ContactInput = z.object({
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(8).max(30),
  whatsapp: z.string().trim().max(30).optional().nullable(),
  email: z.string().trim().email().max(180).optional().nullable().or(z.literal("")),
  city: z.string().trim().max(120).optional().nullable(),
  date_of_birth: z.string().trim().optional().nullable(),
  sex: z.string().trim().max(20).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  insurance: z.string().trim().max(120).optional().nullable(),
  origin: OriginEnum.default("cadastro_direto"),
  origin_detail: z.string().trim().max(120).optional().nullable(),
  responsible_user_id: z.string().uuid().nullable().optional(),
  company_id: z.string().uuid().nullable().optional(),
  source: z.enum(["manual", "import_csv", "import_xlsx"]).default("manual"),
});

function clean<T extends Record<string, unknown>>(o: T): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(o)) {
    if (v === "" || v === undefined) continue;
    out[k] = v;
  }
  return out as T;
}

function digitsOnly(v?: string | null) {
  return (v ?? "").replace(/\D+/g, "");
}

async function ensureRelationship(supabase: any, professionalId: string, patientId: string, origin: string, companyId: string | null) {
  // Upsert relationship row; trigger only fires from appointments, so we create it manually for manual patients.
  const { data: existing } = await supabase
    .from("crm_patient_relationships")
    .select("id")
    .eq("professional_id", professionalId).eq("patient_id", patientId).maybeSingle();
  if (existing) return existing.id as string;
  const { data, error } = await supabase
    .from("crm_patient_relationships")
    .insert({
      professional_id: professionalId,
      patient_id: patientId,
      company_id: companyId,
      status: "novo_lead",
      status_suggested: "novo_lead",
      origin,
    })
    .select("id").single();
  if (error) throw error;
  return data.id as string;
}

async function resolveScope(
  supabase: any, userId: string,
  requestedCompanyId: string | null, responsibleUserId: string | null
) {
  const { data: pro } = await supabase
    .from("professionals").select("id").eq("id", userId).maybeSingle();
  const isProfessional = !!pro;

  const { data: ownedCompanies } = await supabase
    .from("companies").select("id").eq("owner_id", userId);

  let companyId: string | null = requestedCompanyId ?? null;
  if (!companyId && ownedCompanies && ownedCompanies.length > 0) {
    companyId = ownedCompanies[0].id as string;
  }
  if (companyId) {
    const { data: ok } = await supabase.rpc("is_company_staff", { _user: userId, _company: companyId });
    if (!ok) companyId = null;
  }

  let professionalId: string | null = null;
  if (responsibleUserId) {
    const { data: respPro } = await supabase
      .from("professionals").select("id").eq("id", responsibleUserId).maybeSingle();
    if (respPro) professionalId = respPro.id as string;
  } else if (isProfessional && !companyId) {
    professionalId = userId;
  }

  if (!professionalId && !companyId) {
    throw new Error(
      "Não foi possível identificar o responsável pelo CRM. Complete seu perfil profissional ou vínculo empresarial."
    );
  }
  return { professionalId, companyId, responsibleUserId: responsibleUserId ?? null };
}

export const createManualPatient = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ContactInput.parse(d))
  .handler(async ({ data, context }) => {
    const { professionalId, companyId, responsibleUserId } = await resolveScope(
      context.supabase, context.userId, data.company_id ?? null, data.responsible_user_id ?? null
    );
    const { company_id: _c, responsible_user_id: _r, ...rest } = data;
    const payload = clean({
      ...rest,
      phone: digitsOnly(data.phone),
      whatsapp: data.whatsapp ? digitsOnly(data.whatsapp) : digitsOnly(data.phone),
      email: data.email || null,
      professional_id: professionalId,
      company_id: companyId,
      responsible_user_id: responsibleUserId,
      created_by: context.userId,
    });
    const { data: contact, error } = await context.supabase
      .from("crm_contacts").insert(payload).select().single();
    if (error) throw error;
    let relId: string | null = null;
    if (professionalId) {
      relId = await ensureRelationship(
        context.supabase, professionalId, contact.id, data.origin, companyId
      );
    }
    return { contact, relationshipId: relId };
  });

export const findDuplicates = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { phone?: string; email?: string }) =>
    z.object({ phone: z.string().optional(), email: z.string().optional() }).parse(d))
  .handler(async ({ data, context }) => {
    const phone = digitsOnly(data.phone);
    const email = (data.email ?? "").trim().toLowerCase();
    if (!phone && !email) return [];
    let q = context.supabase.from("crm_contacts").select("id, full_name, phone, email")
      .eq("professional_id", context.userId);
    const conds: string[] = [];
    if (phone) conds.push(`phone.eq.${phone}`, `whatsapp.eq.${phone}`);
    if (email) conds.push(`email.eq.${email}`);
    q = q.or(conds.join(","));
    const { data: rows } = await q.limit(5);
    return rows ?? [];
  });

const ImportRow = ContactInput.omit({ source: true }).partial({
  full_name: true, phone: true, origin: true,
}).extend({
  full_name: z.string().trim().min(1).max(120),
  phone: z.string().trim().min(8).max(30),
  origin: OriginEnum.default("importado"),
});

export const bulkImportPatients = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { rows: unknown[]; source: "import_csv" | "import_xlsx"; duplicate_strategy: "skip" | "update" | "create" }) =>
    z.object({
      rows: z.array(z.unknown()).min(1).max(2000),
      source: z.enum(["import_csv", "import_xlsx"]),
      duplicate_strategy: z.enum(["skip", "update", "create"]).default("skip"),
    }).parse(d))
  .handler(async ({ data, context }) => {
    let created = 0, updated = 0, skipped = 0, errors = 0, dupInFile = 0;
    const seen = new Map<string, number>(); // key (phone|email) -> first index
    for (const raw of data.rows) {
      try {
        const parsed = ImportRow.parse(raw);
        const phone = digitsOnly(parsed.phone);
        const whatsapp = parsed.whatsapp ? digitsOnly(parsed.whatsapp) : phone;
        const email = parsed.email ? String(parsed.email).trim().toLowerCase() : null;

        // in-file dedup
        const key = `${phone}|${email ?? ""}`;
        if (phone && seen.has(key)) {
          dupInFile++;
          if (data.duplicate_strategy === "skip") { skipped++; continue; }
        } else {
          seen.set(key, 1);
        }

        // duplicate check against DB
        const conds: string[] = [`phone.eq.${phone}`, `whatsapp.eq.${phone}`];
        if (email) conds.push(`email.eq.${email}`);
        const { data: dup } = await context.supabase.from("crm_contacts")
          .select("id").eq("professional_id", context.userId).or(conds.join(",")).maybeSingle();

        if (dup) {
          if (data.duplicate_strategy === "skip") { skipped++; continue; }
          if (data.duplicate_strategy === "update") {
            const patch = clean({ ...parsed, phone, whatsapp, email });
            await context.supabase.from("crm_contacts").update(patch).eq("id", dup.id);
            await ensureRelationship(context.supabase, context.userId, dup.id, parsed.origin, parsed.company_id ?? null);
            updated++; continue;
          }
        }
        const payload = clean({
          ...parsed, phone, whatsapp, email,
          professional_id: context.userId, created_by: context.userId, source: data.source,
        });
        const { data: contact, error } = await context.supabase.from("crm_contacts").insert(payload).select("id").single();
        if (error) throw error;
        await ensureRelationship(context.supabase, context.userId, contact.id, parsed.origin, parsed.company_id ?? null);
        created++;
      } catch {
        errors++;
      }
    }
    return { created, updated, skipped, errors, dupInFile };
  });
