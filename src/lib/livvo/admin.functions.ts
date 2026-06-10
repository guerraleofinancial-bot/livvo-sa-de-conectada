import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function assertAdmin(ctx: any) {
  const { data } = await ctx.supabase.rpc("has_role", { _user_id: ctx.userId, _role: "admin" });
  if (!data) throw new Error("Forbidden");
}

export const setProfessionalStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { professionalId: string; status: "aprovado" | "rejeitado" | "suspenso" | "pendente" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { status: typeof data.status; approved_at?: string; approved_by?: string } = { status: data.status };
    if (data.status === "aprovado") { patch.approved_at = new Date().toISOString(); patch.approved_by = context.userId; }
    const { error } = await supabaseAdmin.from("professionals").update(patch).eq("id", data.professionalId);
    if (error) throw error;
    return { ok: true };
  });

export const setCompanyStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { companyId: string; status: "aprovado" | "rejeitado" | "suspenso" | "pendente" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: { status: typeof data.status; approved_at?: string; approved_by?: string } = { status: data.status };
    if (data.status === "aprovado") { patch.approved_at = new Date().toISOString(); patch.approved_by = context.userId; }
    const { error } = await supabaseAdmin.from("companies").update(patch).eq("id", data.companyId);
    if (error) throw error;
    return { ok: true };
  });

export const setUserSuspended = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; suspended: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("profiles").update({ suspended: data.suspended }).eq("id", data.userId);
    if (error) throw error;
    return { ok: true };
  });

export const updatePlatformSettings = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { commission_percent?: number; cancellation_window_hours?: number; refund_policy?: string }) =>
    z.object({
      commission_percent: z.number().min(0).max(50).optional(),
      cancellation_window_hours: z.number().int().min(0).max(168).optional(),
      refund_policy: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("platform_settings")
      .update({ ...data, updated_at: new Date().toISOString(), updated_by: context.userId })
      .eq("id", 1);
    if (error) throw error;
    return { ok: true };
  });

export const setReviewStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { reviewId: string; status: "publicada" | "oculta" }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("reviews").update({ status: data.status }).eq("id", data.reviewId);
    if (error) throw error;
    return { ok: true };
  });

export const upsertCategory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; slug: string; name: string; icon?: string; active?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("categories").upsert(data);
    if (error) throw error;
    return { ok: true };
  });

export const createPayoutForProvider = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { providerId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: txs } = await supabaseAdmin.from("wallet_transactions").select("amount").eq("provider_id", data.providerId);
    const balance = (txs ?? []).reduce((s, t) => s + Number(t.amount), 0);
    if (balance <= 0) throw new Error("Sem saldo a repassar");
    const { data: payout, error } = await supabaseAdmin.from("payouts").insert({
      provider_id: data.providerId, amount: balance, status: "pago", paid_at: new Date().toISOString(), created_by: context.userId,
    }).select().single();
    if (error) throw error;
    await supabaseAdmin.from("wallet_transactions").insert({
      provider_id: data.providerId, payout_id: payout.id, kind: "repasse", amount: -balance, description: "Repasse Livvo",
    });
    return { ok: true, amount: balance };
  });

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

export const seedDemoData = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: specs } = await supabaseAdmin.from("specialties").select("id, slug");
    const bySlug = Object.fromEntries((specs ?? []).map((s) => [s.slug, s.id]));
    const { data: cats } = await supabaseAdmin.from("categories").select("id, slug");
    const catSlug = Object.fromEntries((cats ?? []).map((c) => [c.slug, c.id]));

    const pros = [
      { email: "dra.helena@livvo.demo", name: "Dra. Helena Souza", reg: "CRM 123456", spec: "dermatologia", price: 250, city: "São Paulo", state: "SP", bio: "Dermatologista com 12 anos de experiência em pele clínica e estética." },
      { email: "dr.ricardo@livvo.demo", name: "Dr. Ricardo Santos", reg: "CRM 234567", spec: "clinico-geral", price: 200, city: "São Paulo", state: "SP", bio: "Clínico geral — atendimento humanizado para toda a família." },
      { email: "dra.beatriz@livvo.demo", name: "Dra. Beatriz Silva", reg: "CRM 345678", spec: "pediatria", price: 220, city: "Rio de Janeiro", state: "RJ", bio: "Pediatra com foco em desenvolvimento infantil." },
      { email: "dr.lucas@livvo.demo", name: "Dr. Lucas Mendes", reg: "CRM 456789", spec: "cardiologia", price: 320, city: "Belo Horizonte", state: "MG", bio: "Cardiologista preventivo e check-up cardiovascular." },
      { email: "dra.camila@livvo.demo", name: "Dra. Camila Lima", reg: "CRP 06/12345", spec: "psicologia", price: 180, city: "São Paulo", state: "SP", bio: "Psicóloga clínica — ansiedade e TCC." },
      { email: "dr.marcos@livvo.demo", name: "Dr. Marcos Lins", reg: "CRM 567890", spec: "psiquiatria", price: 380, city: "Porto Alegre", state: "RS", bio: "Psiquiatra adulto." },
      { email: "dr.bruno@livvo.demo", name: "Dr. Bruno Tavares", reg: "CRO 22345", spec: "odontologia", price: 180, city: "São Paulo", state: "SP", bio: "Dentista clínico geral e estética." },
      { email: "carla.fisio@livvo.demo", name: "Carla Pereira", reg: "CREFITO 34567", spec: "fisioterapia", price: 150, city: "Curitiba", state: "PR", bio: "Fisioterapeuta ortopédica e RPG." },
    ];

    const { data: existing } = await supabaseAdmin.auth.admin.listUsers();
    const userByEmail = new Map(existing.users.map((u) => [u.email!, u.id]));

    const proIds: string[] = [];
    for (const d of pros) {
      let uid = userByEmail.get(d.email);
      if (!uid) {
        const { data: u } = await supabaseAdmin.auth.admin.createUser({
          email: d.email, password: "Livvo!2026", email_confirm: true,
          user_metadata: { full_name: d.name, role: "profissional" },
        });
        if (!u?.user) continue;
        uid = u.user.id;
      }
      await supabaseAdmin.from("user_roles").upsert({ user_id: uid, role: "profissional" }, { onConflict: "user_id,role" });
      await supabaseAdmin.from("professionals").upsert({
        id: uid, specialty_id: bySlug[d.spec], professional_registry: d.reg, bio: d.bio,
        address_city: d.city, address_state: d.state, consultation_price: d.price,
        modality: "presencial", status: "aprovado", approved_at: new Date().toISOString(), approved_by: context.userId,
      });
      await supabaseAdmin.from("professional_availability").delete().eq("professional_id", uid);
      await supabaseAdmin.from("professional_availability").insert(
        [1, 2, 3, 4, 5].map((dow) => ({ professional_id: uid as string, day_of_week: dow, start_time: "09:00", end_time: "17:00", active: true })),
      );
      proIds.push(uid);
    }

    const companies = [
      { email: "clinica.vida@livvo.demo", name: "Clínica Vida & Saúde", type: "clinica" as const, city: "São Paulo", state: "SP", desc: "Clínica multiprofissional no centro de SP.", cnpj: "12.345.678/0001-90" },
      { email: "lab.exata@livvo.demo", name: "Laboratório Exata Diagnósticos", type: "laboratorio" as const, city: "São Paulo", state: "SP", desc: "Exames laboratoriais com coleta domiciliar.", cnpj: "23.456.789/0001-01" },
      { email: "centro.imagem@livvo.demo", name: "Centro de Imagem Núcleo", type: "diagnostico" as const, city: "Belo Horizonte", state: "MG", desc: "Ressonância, tomografia e ultrassom.", cnpj: "34.567.890/0001-12" },
      { email: "estetica.bela@livvo.demo", name: "Bella Estética Avançada", type: "estetica" as const, city: "Rio de Janeiro", state: "RJ", desc: "Procedimentos estéticos com tecnologia de ponta.", cnpj: "45.678.901/0001-23" },
    ];

    const companyIds: string[] = [];
    for (const c of companies) {
      let ownerId = userByEmail.get(c.email);
      if (!ownerId) {
        const { data: u } = await supabaseAdmin.auth.admin.createUser({
          email: c.email, password: "Livvo!2026", email_confirm: true,
          user_metadata: { full_name: c.name, role: "profissional" },
        });
        if (!u?.user) continue;
        ownerId = u.user.id;
      }
      await supabaseAdmin.from("user_roles").upsert({ user_id: ownerId, role: "profissional" }, { onConflict: "user_id,role" });
      await supabaseAdmin.from("companies").delete().eq("owner_id", ownerId);
      const { data: comp } = await supabaseAdmin.from("companies").insert({
        owner_id: ownerId, legal_name: c.name, trade_name: c.name, cnpj: c.cnpj, type: c.type,
        description: c.desc, address_city: c.city, address_state: c.state,
        status: "aprovado", approved_at: new Date().toISOString(), approved_by: context.userId,
      }).select().single();
      if (comp) companyIds.push(comp.id);
    }

    const serviceSpecs = [
      { owner: "pro" as const, ownerIdx: 0, name: "Consulta dermatológica", cat: "consulta", price: 250, dur: 40 },
      { owner: "pro" as const, ownerIdx: 0, name: "Limpeza de pele profunda", cat: "estetica", price: 380, dur: 60 },
      { owner: "pro" as const, ownerIdx: 2, name: "Consulta pediátrica", cat: "consulta", price: 220, dur: 30 },
      { owner: "pro" as const, ownerIdx: 4, name: "Sessão de psicoterapia", cat: "terapia", price: 180, dur: 50 },
      { owner: "pro" as const, ownerIdx: 6, name: "Limpeza e profilaxia", cat: "odontologia", price: 180, dur: 40 },
      { owner: "pro" as const, ownerIdx: 6, name: "Clareamento dental", cat: "odontologia", price: 1200, dur: 60 },
      { owner: "pro" as const, ownerIdx: 7, name: "Fisioterapia ortopédica", cat: "fisioterapia", price: 150, dur: 50 },
      { owner: "company" as const, ownerIdx: 1, name: "Hemograma completo", cat: "exame", price: 70, dur: 15 },
      { owner: "company" as const, ownerIdx: 1, name: "Painel lipídico", cat: "exame", price: 90, dur: 15 },
      { owner: "company" as const, ownerIdx: 2, name: "Ressonância de joelho", cat: "exame", price: 850, dur: 45 },
      { owner: "company" as const, ownerIdx: 2, name: "Ultrassom abdominal", cat: "exame", price: 320, dur: 30 },
      { owner: "company" as const, ownerIdx: 3, name: "Criolipólise", cat: "estetica", price: 690, dur: 60 },
      { owner: "company" as const, ownerIdx: 3, name: "Toxina botulínica", cat: "estetica", price: 1500, dur: 30 },
      { owner: "company" as const, ownerIdx: 0, name: "Check-up executivo", cat: "consulta", price: 950, dur: 90 },
    ];

    for (const s of serviceSpecs) {
      await supabaseAdmin.from("services").insert({
        professional_id: s.owner === "pro" ? proIds[s.ownerIdx] : null,
        company_id: s.owner === "company" ? companyIds[s.ownerIdx] : null,
        category_id: catSlug[s.cat] ?? null,
        name: s.name, duration_minutes: s.dur, price: s.price, active: true,
      });
    }

    // Paciente demo + agendamentos
    const patientEmail = "paciente.demo@livvo.demo";
    let patientId = userByEmail.get(patientEmail);
    if (!patientId) {
      const { data: u } = await supabaseAdmin.auth.admin.createUser({
        email: patientEmail, password: "Livvo!2026", email_confirm: true,
        user_metadata: { full_name: "Paciente Demonstração", role: "paciente" },
      });
      patientId = u?.user?.id;
    }

    if (patientId) {
      const { data: settings } = await supabaseAdmin.from("platform_settings").select("commission_percent").eq("id", 1).single();
      const pct = Number(settings?.commission_percent ?? 15);
      const demoAppts: Array<{ proIdx: number; days: number; status: "realizada" | "confirmada" | "agendada"; price: number }> = [
        { proIdx: 0, days: -10, status: "realizada", price: 250 },
        { proIdx: 2, days: -5, status: "realizada", price: 220 },
        { proIdx: 4, days: -2, status: "realizada", price: 180 },
        { proIdx: 0, days: 3, status: "confirmada", price: 250 },
        { proIdx: 1, days: 5, status: "confirmada", price: 200 },
        { proIdx: 3, days: 7, status: "agendada", price: 320 },
        { proIdx: 6, days: 10, status: "agendada", price: 180 },
      ];
      for (const a of demoAppts) {
        const when = new Date(); when.setDate(when.getDate() + a.days); when.setHours(10, 0, 0, 0);
        const commission = Math.round(a.price * pct) / 100;
        const net = a.price - commission;
        const { data: appt } = await supabaseAdmin.from("appointments").insert({
          patient_id: patientId, professional_id: proIds[a.proIdx], scheduled_at: when.toISOString(),
          duration_minutes: 30, modality: "presencial", status: a.status, price: a.price,
          gross_amount: a.price, commission_amount: commission, net_amount: net,
          payment_status: "pago", payment_method: "mock_card",
        }).select().single();
        if (appt) {
          await supabaseAdmin.from("payments").insert({
            appointment_id: appt.id, patient_id: patientId, amount: a.price, status: "pago", method: "mock_card", paid_at: new Date().toISOString(),
          });
          await supabaseAdmin.from("wallet_transactions").insert([
            { provider_id: proIds[a.proIdx], appointment_id: appt.id, kind: "credito", amount: a.price, description: "Pagamento de consulta" },
            { provider_id: proIds[a.proIdx], appointment_id: appt.id, kind: "comissao", amount: -commission, description: `Comissão Livvo (${pct}%)` },
          ]);
          if (a.status === "realizada") {
            await supabaseAdmin.from("reviews").insert({
              appointment_id: appt.id, patient_id: patientId, professional_id: proIds[a.proIdx],
              rating: 5, comment: "Atendimento excelente, profissional muito atencioso!",
            });
          }
        }
      }
    }

    return { ok: true, created: proIds.length, companies: companyIds.length, services: serviceSpecs.length };
  });
