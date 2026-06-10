import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

/** Admin-only: approve / reject / suspend a professional */
export const setProfessionalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { professionalId: string; status: "aprovado" | "rejeitado" | "suspenso" | "pendente" }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { status: typeof data.status; approved_at?: string; approved_by?: string } = { status: data.status };
    if (data.status === "aprovado") {
      patch.approved_at = new Date().toISOString();
      patch.approved_by = context.userId;
    }
    const { error } = await supabaseAdmin.from("professionals").update(patch).eq("id", data.professionalId);
    if (error) throw error;
    return { ok: true };
  });

/** Admin-only: suspend / unsuspend any user */
export const setUserSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; suspended: boolean }) => d)
  .handler(async ({ data, context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ suspended: data.suspended }).eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

/** First admin bootstrap: any signed-in user can claim the admin role IF no admin exists yet. */
export const claimFirstAdmin = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin.from("user_roles").select("*", { count: "exact", head: true }).eq("role", "admin");
    if ((count ?? 0) > 0) throw new Error("Já existe um administrador.");
    const { error } = await supabaseAdmin.from("user_roles").insert({ user_id: context.userId, role: "admin" });
    if (error) throw error;
    return { ok: true };
  });

/** Seed demo data: creates 6 approved professionals + sample appointments. Admin only. */
export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin } = await context.supabase.rpc("has_role", { _user_id: context.userId, _role: "admin" });
    if (!isAdmin) throw new Error("Forbidden");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: specs } = await supabaseAdmin.from("specialties").select("id, slug");
    const bySlug = Object.fromEntries((specs ?? []).map((s) => [s.slug, s.id]));

    const demos = [
      { email: "dra.helena@livvo.demo", name: "Dra. Helena Souza", reg: "CRM 123456", spec: "dermatologia", price: 250, city: "São Paulo", state: "SP", bio: "Dermatologista com 12 anos de experiência em pele clínica e estética." },
      { email: "dr.ricardo@livvo.demo", name: "Dr. Ricardo Santos", reg: "CRM 234567", spec: "clinico-geral", price: 200, city: "São Paulo", state: "SP", bio: "Clínico geral, atendimento humanizado para toda a família." },
      { email: "dra.beatriz@livvo.demo", name: "Dra. Beatriz Silva", reg: "CRM 345678", spec: "pediatria", price: 220, city: "Rio de Janeiro", state: "RJ", bio: "Pediatra com foco em desenvolvimento infantil." },
      { email: "dr.lucas@livvo.demo", name: "Dr. Lucas Mendes", reg: "CRM 456789", spec: "cardiologia", price: 320, city: "Belo Horizonte", state: "MG", bio: "Cardiologista — prevenção e check-up cardiovascular." },
      { email: "dra.camila@livvo.demo", name: "Dra. Camila Lima", reg: "CRP 06/12345", spec: "psicologia", price: 180, city: "São Paulo", state: "SP", bio: "Psicóloga clínica — ansiedade e terapia cognitivo-comportamental." },
      { email: "dr.marcos@livvo.demo", name: "Dr. Marcos Lins", reg: "CRM 567890", spec: "psiquiatria", price: 380, city: "Porto Alegre", state: "RS", bio: "Psiquiatra adulto. Atendimento presencial e por telemedicina." },
    ];

    let created = 0;
    for (const d of demos) {
      // create or fetch user
      const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
      let userId = existing.users.find((u) => u.email === d.email)?.id;
      if (!userId) {
        const { data: u, error: ue } = await supabaseAdmin.auth.admin.createUser({
          email: d.email,
          password: "Livvo!2026",
          email_confirm: true,
          user_metadata: { full_name: d.name, role: "profissional" },
        });
        if (ue) continue;
        userId = u.user!.id;
      }
      // ensure professional role
      await supabaseAdmin.from("user_roles").upsert({ user_id: userId, role: "profissional" }, { onConflict: "user_id,role" });
      // upsert professional row (approved)
      await supabaseAdmin.from("professionals").upsert({
        id: userId,
        specialty_id: bySlug[d.spec],
        professional_registry: d.reg,
        bio: d.bio,
        address_city: d.city,
        address_state: d.state,
        consultation_price: d.price,
        modality: "presencial",
        status: "aprovado",
        approved_at: new Date().toISOString(),
        approved_by: context.userId,
      });
      // availability Mon-Fri 9-17
      await supabaseAdmin.from("professional_availability").delete().eq("professional_id", userId);
      const slots = [1, 2, 3, 4, 5].map((dow) => ({
        professional_id: userId!, day_of_week: dow, start_time: "09:00", end_time: "17:00", active: true,
      }));
      await supabaseAdmin.from("professional_availability").insert(slots);
      created++;
    }

    return { ok: true, created };
  });
