import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { writeAudit } from "./audit.functions";

export const listCrmScope = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data: pro } = await supabase.from("professionals").select("id").eq("id", userId).maybeSingle();
    const { data: companies } = await supabase.from("companies").select("id, legal_name, trade_name").eq("owner_id", userId);
    const company = companies?.[0] ?? null;

    let responsibleOptions: Array<{ id: string; full_name: string }> = [];
    if (company) {
      // Owner is always a candidate if they are also a professional
      const ids = new Set<string>();
      if (pro) ids.add(userId);
      const { data: members } = await supabase
        .from("company_members").select("user_id").eq("company_id", company.id);
      (members ?? []).forEach((m: any) => ids.add(m.user_id));
      const { data: unitPros } = await supabase
        .from("unit_professionals").select("professional_id, company_units!inner(company_id)")
        .eq("company_units.company_id", company.id);
      (unitPros ?? []).forEach((u: any) => ids.add(u.professional_id));
      if (ids.size) {
        const { data: pros } = await supabase
          .from("professionals").select("id, status").in("id", Array.from(ids)).eq("status", "aprovado");
        const proIds = (pros ?? []).map((p: any) => p.id);
        if (proIds.length) {
          const { data: profs } = await supabase
            .from("profiles").select("id, full_name").in("id", proIds);
          responsibleOptions = (profs ?? []) as any;
        }
      }
    }
    return {
      isSoloProfessional: !!pro && !company,
      company,
      responsibleOptions,
    };
  });

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
  let { data: pro } = await supabase
    .from("professionals").select("id").eq("id", userId).maybeSingle();
  if (!pro) {
    // If user has the 'profissional' role but no professionals row yet,
    // auto-create a minimal one so CRM works (auto-approve trigger handles status).
    const { data: roles } = await supabase
      .from("user_roles").select("role").eq("user_id", userId);
    const hasProRole = (roles ?? []).some((r: any) => r.role === "profissional");
    if (hasProRole) {
      const { data: created } = await supabase
        .from("professionals")
        .insert({ id: userId, professional_registry: "" })
        .select("id").maybeSingle();
      if (created) pro = created;
    }
  }
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
    await writeAudit({
      event: "patient.create",
      module: "crm",
      actorId: context.userId,
      entityType: "crm_contact",
      entityId: contact.id,
      description: `Paciente cadastrado: ${data.full_name}`,
      after: { contactId: contact.id, professionalId, companyId, origin: data.origin, source: data.source },
    });
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

const UpdateContactInput = z.object({
  contactId: z.string().uuid(),
  full_name: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().optional(),
  whatsapp: z.string().trim().optional().nullable(),
  email: z.string().trim().email().optional().or(z.literal("")).nullable(),
  city: z.string().trim().max(120).optional().nullable(),
  date_of_birth: z.string().trim().optional().nullable(),
  sex: z.string().trim().max(20).optional().nullable(),
  insurance: z.string().trim().max(120).optional().nullable(),
  notes: z.string().trim().max(2000).optional().nullable(),
  origin: OriginEnum.optional(),
});

export const updateCrmContact = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => UpdateContactInput.parse(d))
  .handler(async ({ data, context }) => {
    const { contactId, ...rest } = data;
    const patch: Record<string, unknown> = clean({ ...rest });
    if (rest.phone !== undefined) patch.phone = digitsOnly(rest.phone);
    if (rest.whatsapp !== undefined && rest.whatsapp !== null) {
      patch.whatsapp = digitsOnly(rest.whatsapp);
    }
    if (rest.email === "") patch.email = null;
    const { data: row, error } = await context.supabase
      .from("crm_contacts").update(patch as never).eq("id", contactId).select().single();
    if (error) throw error;
    await writeAudit({
      event: "patient.update",
      module: "crm",
      actorId: context.userId,
      entityType: "crm_contact",
      entityId: contactId,
      description: "Paciente atualizado",
      after: patch,
    });
    return row;
  });

const CreateApptInput = z.object({
  patient_id: z.string().uuid(),
  professional_id: z.string().uuid(),
  scheduled_at: z.string(),
  duration_minutes: z.number().int().min(5).max(480).default(30),
  service_id: z.string().uuid().nullable().optional(),
  price: z.number().min(0).default(0),
  notes: z.string().trim().max(2000).optional().nullable(),
});

export const createManualAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => CreateApptInput.parse(d))
  .handler(async ({ data, context }) => {
    const payload = {
      patient_id: data.patient_id,
      professional_id: data.professional_id,
      scheduled_at: data.scheduled_at,
      duration_minutes: data.duration_minutes,
      service_id: data.service_id ?? null,
      price: data.price,
      gross_amount: data.price,
      net_amount: data.price,
      notes: data.notes ?? null,
      status: "agendada" as const,
    };
    const { data: row, error } = await context.supabase
      .from("appointments").insert(payload).select().single();
    if (error) throw error;
    await context.supabase
      .from("crm_patient_relationships")
      .update({
        status: "agendado",
        status_suggested: "agendado",
        status_changed_at: new Date().toISOString(),
        status_changed_by: context.userId,
        next_appointment_at: data.scheduled_at,
        updated_at: new Date().toISOString(),
      })
      .eq("professional_id", data.professional_id)
      .eq("patient_id", data.patient_id);
    return row;
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
