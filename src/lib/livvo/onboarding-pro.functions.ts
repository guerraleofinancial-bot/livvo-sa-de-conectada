import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const patchSchema = z.object({
  display_name: z.string().nullish(),
  cpf_cnpj: z.string().nullish(),
  specialty_id: z.string().uuid().nullish(),
  secondary_specialties: z.array(z.string().uuid()).optional(),
  professional_registry: z.string().nullish(),
  bio: z.string().nullish(),
  years_experience: z.number().int().min(0).max(80).nullish(),
  academic_formation: z.string().nullish(),
  postgrad: z.string().nullish(),
  certifications: z.array(z.string()).optional(),
  languages: z.array(z.string()).optional(),
  whatsapp: z.string().nullish(),
  phone: z.string().nullish(),
  professional_email: z.string().email().nullish().or(z.literal("")),
  instagram: z.string().nullish(),
  website: z.string().nullish(),
  address_zip: z.string().nullish(),
  address_street: z.string().nullish(),
  address_number: z.string().nullish(),
  address_complement: z.string().nullish(),
  address_district: z.string().nullish(),
  address_city: z.string().nullish(),
  address_state: z.string().max(2).nullish(),
  avatar_url: z.string().nullish(),
  logo_url: z.string().nullish(),
  cover_url: z.string().nullish(),
  consultation_price: z.number().min(0).optional(),
});

export const saveOnboardingStep = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { step: number; patch: z.input<typeof patchSchema> }) => ({ step: d.step, patch: patchSchema.parse(d.patch) }))
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // ensure role profissional
    await supabaseAdmin.from("user_roles").upsert({ user_id: context.userId, role: "profissional" }, { onConflict: "user_id,role" });
    const payload: Record<string, unknown> = {
      id: context.userId,
      ...Object.fromEntries(Object.entries(data.patch).filter(([, v]) => v !== undefined)),
      onboarding_step: data.step,
    };
    // required fields with safe defaults to allow upsert on first step
    if (!("professional_registry" in payload)) payload.professional_registry = payload.professional_registry ?? "";
    if (!("consultation_price" in payload)) payload.consultation_price = payload.consultation_price ?? 0;
    const { error } = await supabaseAdmin.from("professionals").upsert(payload, { onConflict: "id" });
    if (error) throw error;
    return { ok: true };
  });

export const setBusinessHours = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { hours: Array<{ weekday: number; opens_at?: string | null; closes_at?: string | null; lunch_start?: string | null; lunch_end?: string | null; closed: boolean }> }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("professional_business_hours").delete().eq("professional_id", context.userId);
    if (data.hours.length) {
      const rows = data.hours.map((h) => ({ ...h, professional_id: context.userId }));
      const { error } = await supabaseAdmin.from("professional_business_hours").insert(rows);
      if (error) throw error;
    }
    return { ok: true };
  });

export const uploadProviderDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { kind: "documento_pessoal" | "registro" | "comprovante_endereco" | "documento_empresa"; file_url: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("professional_documents").insert({
      professional_id: context.userId,
      kind: data.kind,
      file_url: data.file_url,
      status: "pendente",
    });
    if (error) throw error;
    return { ok: true };
  });

export const upsertProviderService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; type: "consulta" | "exame" | "procedimento" | "pacote"; description?: string; duration_minutes: number; price: number; active?: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const payload = { ...data, professional_id: context.userId };
    const { error } = await supabaseAdmin.from("services").upsert(payload);
    if (error) throw error;
    return { ok: true };
  });

export const deleteProviderService = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data, context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("services").delete().eq("id", data.id).eq("professional_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const submitOnboarding = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("professionals").update({
      status: "pendente",
      onboarding_completed_at: new Date().toISOString(),
    }).eq("id", context.userId);
    if (error) throw error;
    return { ok: true };
  });

export const lookupCep = createServerFn({ method: "GET" })
  .inputValidator((d: { cep: string }) => ({ cep: d.cep.replace(/\D/g, "") }))
  .handler(async ({ data }) => {
    if (data.cep.length !== 8) throw new Error("CEP inválido");
    const res = await fetch(`https://viacep.com.br/ws/${data.cep}/json/`);
    if (!res.ok) throw new Error("Falha ao consultar CEP");
    const json = (await res.json()) as { erro?: boolean; logradouro?: string; bairro?: string; localidade?: string; uf?: string };
    if (json.erro) throw new Error("CEP não encontrado");
    return {
      street: json.logradouro ?? "",
      district: json.bairro ?? "",
      city: json.localidade ?? "",
      state: json.uf ?? "",
    };
  });

export const approveProfessional = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { professionalId: string }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin.rpc("approve_professional", { _id: data.professionalId });
    if (error) throw error;
    return row;
  });
