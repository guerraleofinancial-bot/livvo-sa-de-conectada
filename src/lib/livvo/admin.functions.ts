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
  .inputValidator((d: { commission_percent?: number; cancellation_window_hours?: number; refund_policy?: string; release_after_days?: number }) =>
    z.object({
      commission_percent: z.number().min(0).max(50).optional(),
      cancellation_window_hours: z.number().int().min(0).max(168).optional(),
      refund_policy: z.string().max(500).optional(),
      release_after_days: z.number().int().min(0).max(60).optional(),
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

export const setPartnerCommission = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { target: "professional" | "company"; id: string; percent: number | null }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tbl = data.target === "professional" ? "professionals" : "companies";
    const { error } = await supabaseAdmin.from(tbl).update({ commission_percent_override: data.percent }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const setPartnerCancellationPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { target: "professional" | "company"; id: string; policyId: string | null }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const tbl = data.target === "professional" ? "professionals" : "companies";
    const { error } = await supabaseAdmin.from(tbl).update({ cancellation_policy_id: data.policyId }).eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

export const upsertCancellationPolicy = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; name: string; hours_before_full_refund: number; hours_before_partial_refund: number; partial_refund_percent: number; non_refundable_after_confirmation?: boolean }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("cancellation_policies").upsert(data);
    if (error) throw error;
    return { ok: true };
  });

export const upsertCoupon = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { id?: string; code: string; description?: string; type: "percent" | "fixed"; value: number; min_amount?: number; max_uses?: number; valid_from?: string; valid_until?: string; active?: boolean; company_id?: string | null }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.from("coupons").upsert(data);
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

/** Marca como liberados todos os atendimentos 'realizado' com mais de N dias. */
export const releaseCompletedAppointments = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: settings } = await supabaseAdmin.from("platform_settings").select("release_after_days").eq("id", 1).single();
    const days = settings?.release_after_days ?? 2;
    const cutoff = new Date(Date.now() - days * 86400000).toISOString();
    const { data: list } = await supabaseAdmin.from("appointments").select("id")
      .eq("financial_status", "realizado").lte("completed_at", cutoff);
    if (!list?.length) return { released: 0 };
    const ids = list.map((a) => a.id);
    await supabaseAdmin.from("appointments").update({ financial_status: "liberado_repasse", released_at: new Date().toISOString() }).in("id", ids);
    return { released: ids.length };
  });

/** Cria lote de repasse agrupando todos os 'liberado_repasse' do prestador. */
export const createPayoutBatch = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { providerId: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list } = await supabaseAdmin.from("appointments")
      .select("id, net_amount").eq("professional_id", data.providerId).eq("financial_status", "liberado_repasse");
    if (!list?.length) throw new Error("Sem itens a repassar");
    const total = list.reduce((s, a) => s + Number(a.net_amount), 0);
    const { data: batch, error } = await supabaseAdmin.from("payout_batches").insert({
      provider_id: data.providerId, total_amount: total, status: "pendente", created_by: context.userId,
    }).select().single();
    if (error || !batch) throw error ?? new Error("Falha ao criar lote");
    for (const a of list) {
      const { data: item } = await supabaseAdmin.from("payout_items").insert({
        batch_id: batch.id, appointment_id: a.id, amount: a.net_amount,
      }).select().single();
      if (item) await supabaseAdmin.from("appointments").update({ payout_item_id: item.id }).eq("id", a.id);
    }
    return { ok: true, batchId: batch.id, total };
  });

/** Marca lote como pago e registra no ledger. */
export const markPayoutBatchPaid = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { batchId: string; reference?: string }) => d)
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: batch } = await supabaseAdmin.from("payout_batches").select("*").eq("id", data.batchId).single();
    if (!batch) throw new Error("Lote não encontrado");
    if (batch.status !== "pendente") throw new Error("Lote não está pendente");
    await supabaseAdmin.from("payout_batches").update({
      status: "pago", paid_at: new Date().toISOString(), reference: data.reference ?? null,
    }).eq("id", batch.id);
    const { data: items } = await supabaseAdmin.from("payout_items").select("appointment_id").eq("batch_id", batch.id);
    const apptIds = (items ?? []).map((i) => i.appointment_id);
    if (apptIds.length) {
      await supabaseAdmin.from("appointments").update({ financial_status: "repassado" }).in("id", apptIds);
    }
    await supabaseAdmin.from("wallet_transactions").insert({
      provider_id: batch.provider_id, kind: "repasse", amount: -Number(batch.total_amount),
      description: `Repasse lote ${batch.id.slice(0, 8)}`,
    });
    await supabaseAdmin.from("notifications").insert({
      user_id: batch.provider_id, title: "Repasse efetuado",
      body: `R$ ${Number(batch.total_amount).toFixed(2)} foi repassado pela Livvo.`,
    });
    return { ok: true };
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
      { email: "dra.helena@livvo.demo", name: "Dra. Helena Souza", reg: "CRM 123456", spec: "dermatologia", price: 250, city: "São Luís", state: "MA", commission: 12, bio: "Dermatologista com 12 anos de experiência." },
      { email: "dr.ricardo@livvo.demo", name: "Dr. Ricardo Santos", reg: "CRM 234567", spec: "clinico-geral", price: 200, city: "São Luís", state: "MA", commission: null, bio: "Clínico geral humanizado." },
      { email: "dra.beatriz@livvo.demo", name: "Dra. Beatriz Silva", reg: "CRM 345678", spec: "pediatria", price: 220, city: "São Luís", state: "MA", commission: null, bio: "Pediatra focada em desenvolvimento infantil." },
      { email: "dr.lucas@livvo.demo", name: "Dr. Lucas Mendes", reg: "CRM 456789", spec: "cardiologia", price: 320, city: "Belo Horizonte", state: "MG", commission: null, bio: "Cardiologista preventivo." },
      { email: "dra.camila@livvo.demo", name: "Dra. Camila Lima", reg: "CRP 06/12345", spec: "psicologia", price: 180, city: "São Paulo", state: "SP", commission: 10, bio: "Psicóloga clínica (TCC)." },
      { email: "dr.marcos@livvo.demo", name: "Dr. Marcos Lins", reg: "CRM 567890", spec: "psiquiatria", price: 380, city: "Porto Alegre", state: "RS", commission: null, bio: "Psiquiatra adulto." },
      { email: "dr.bruno@livvo.demo", name: "Dr. Bruno Tavares", reg: "CRO 22345", spec: "odontologia", price: 180, city: "São Luís", state: "MA", commission: null, bio: "Dentista clínico e estética." },
      { email: "carla.fisio@livvo.demo", name: "Carla Pereira", reg: "CREFITO 34567", spec: "fisioterapia", price: 150, city: "Curitiba", state: "PR", commission: null, bio: "Fisioterapeuta ortopédica." },
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
        commission_percent_override: d.commission,
        modality: "presencial", status: "aprovado", approved_at: new Date().toISOString(), approved_by: context.userId,
      });
      await supabaseAdmin.from("professional_availability").delete().eq("professional_id", uid);
      await supabaseAdmin.from("professional_availability").insert(
        [1, 2, 3, 4, 5].map((dow) => ({ professional_id: uid as string, day_of_week: dow, start_time: "09:00", end_time: "17:00", active: true })),
      );
      proIds.push(uid);
    }

    const companies = [
      { email: "clinica.vida@livvo.demo", name: "Clínica Vida & Saúde", type: "clinica" as const, city: "São Luís", state: "MA", desc: "Clínica multiprofissional em São Luís.", cnpj: "12.345.678/0001-90", commission: 10,
        units: [
          { name: "Unidade Renascença", street: "Av. Colares Moreira", number: "1234", district: "Renascença", lat: -2.5, lng: -44.3 },
          { name: "Unidade Cohama", street: "Av. Daniel de La Touche", number: "987", district: "Cohama", lat: -2.55, lng: -44.27 },
          { name: "Unidade Calhau", street: "Av. dos Holandeses", number: "5000", district: "Calhau", lat: -2.49, lng: -44.24 },
        ] },
      { email: "lab.exata@livvo.demo", name: "Laboratório Exata Diagnósticos", type: "laboratorio" as const, city: "São Luís", state: "MA", desc: "Exames laboratoriais com coleta domiciliar.", cnpj: "23.456.789/0001-01", commission: 12,
        units: [{ name: "Unidade Central", street: "Rua Grande", number: "200", district: "Centro", lat: -2.53, lng: -44.30 }] },
      { email: "centro.imagem@livvo.demo", name: "Centro de Imagem Núcleo", type: "diagnostico" as const, city: "Belo Horizonte", state: "MG", desc: "Tomografia e ultrassom.", cnpj: "34.567.890/0001-12", commission: null,
        units: [{ name: "Unidade Savassi", street: "Rua Pernambuco", number: "1500", district: "Savassi", lat: -19.94, lng: -43.93 }] },
      { email: "estetica.bela@livvo.demo", name: "Bella Estética Avançada", type: "estetica" as const, city: "Rio de Janeiro", state: "RJ", desc: "Procedimentos estéticos avançados.", cnpj: "45.678.901/0001-23", commission: 20,
        units: [
          { name: "Unidade Ipanema", street: "Rua Visconde de Pirajá", number: "550", district: "Ipanema", lat: -22.98, lng: -43.20 },
          { name: "Unidade Barra", street: "Av. das Américas", number: "4000", district: "Barra da Tijuca", lat: -23.00, lng: -43.36 },
        ] },
    ];

    const companyIds: string[] = [];
    const unitIds: string[] = []; // flatten
    const unitByCompany: Record<number, string[]> = {};
    for (let ci = 0; ci < companies.length; ci++) {
      const c = companies[ci];
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
        commission_percent_override: c.commission,
        status: "aprovado", approved_at: new Date().toISOString(), approved_by: context.userId,
      }).select().single();
      if (!comp) continue;
      companyIds.push(comp.id);
      unitByCompany[ci] = [];
      for (const u of c.units) {
        const { data: unit } = await supabaseAdmin.from("company_units").insert({
          company_id: comp.id, name: u.name, address_street: u.street, address_number: u.number,
          address_district: u.district, address_city: c.city, address_state: c.state,
          latitude: u.lat, longitude: u.lng, phone: "(98) 3000-0000",
          business_hours: { mon: "08:00-18:00", tue: "08:00-18:00", wed: "08:00-18:00", thu: "08:00-18:00", fri: "08:00-18:00", sat: "08:00-12:00" },
          active: true,
        }).select().single();
        if (unit) { unitIds.push(unit.id); unitByCompany[ci].push(unit.id); }
      }
    }

    // Resources (na primeira unidade de cada empresa)
    const resourceSpecs: Array<{ companyIdx: number; unitIdx: number; name: string; kind: string }> = [
      { companyIdx: 0, unitIdx: 0, name: "Consultório 1", kind: "sala" },
      { companyIdx: 0, unitIdx: 1, name: "Consultório 2", kind: "sala" },
      { companyIdx: 1, unitIdx: 0, name: "Sala de coleta A", kind: "sala_coleta" },
      { companyIdx: 2, unitIdx: 0, name: "Ultrassom GE", kind: "equipamento_ultrassom" },
      { companyIdx: 2, unitIdx: 0, name: "Tomógrafo Siemens", kind: "equipamento_tomografia" },
      { companyIdx: 3, unitIdx: 0, name: "Laser Cynosure", kind: "equipamento_laser" },
    ];
    for (const r of resourceSpecs) {
      const uid = unitByCompany[r.companyIdx]?.[r.unitIdx];
      if (uid) await supabaseAdmin.from("resources").insert({ unit_id: uid, name: r.name, kind: r.kind as "sala" | "sala_coleta" | "equipamento_ultrassom" | "equipamento_tomografia" | "equipamento_laser" | "outro", active: true });
    }

    // Services (incluindo pacotes)
    const serviceSpecs = [
      { owner: "pro" as const, ownerIdx: 0, name: "Consulta dermatológica", cat: "consulta", type: "consulta", price: 250, dur: 40 },
      { owner: "pro" as const, ownerIdx: 0, name: "Limpeza de pele profunda", cat: "estetica", type: "procedimento", price: 380, dur: 60 },
      { owner: "pro" as const, ownerIdx: 2, name: "Consulta pediátrica", cat: "consulta", type: "consulta", price: 220, dur: 30 },
      { owner: "pro" as const, ownerIdx: 4, name: "Sessão de psicoterapia", cat: "terapia", type: "consulta", price: 180, dur: 50 },
      { owner: "pro" as const, ownerIdx: 6, name: "Limpeza e profilaxia", cat: "odontologia", type: "procedimento", price: 180, dur: 40 },
      { owner: "pro" as const, ownerIdx: 6, name: "Clareamento dental", cat: "odontologia", type: "procedimento", price: 1200, dur: 60 },
      { owner: "pro" as const, ownerIdx: 7, name: "Fisioterapia ortopédica", cat: "fisioterapia", type: "consulta", price: 150, dur: 50 },
      { owner: "pro" as const, ownerIdx: 7, name: "Pacote 10 sessões fisioterapia", cat: "fisioterapia", type: "pacote", price: 1200, dur: 50, sessions: 10, validity: 180 },
      { owner: "company" as const, ownerIdx: 1, name: "Hemograma completo", cat: "exame", type: "exame", price: 70, dur: 15 },
      { owner: "company" as const, ownerIdx: 1, name: "Painel lipídico", cat: "exame", type: "exame", price: 90, dur: 15 },
      { owner: "company" as const, ownerIdx: 2, name: "Ressonância de joelho", cat: "exame", type: "exame", price: 850, dur: 45 },
      { owner: "company" as const, ownerIdx: 2, name: "Ultrassom abdominal", cat: "exame", type: "exame", price: 320, dur: 30 },
      { owner: "company" as const, ownerIdx: 3, name: "Criolipólise", cat: "estetica", type: "procedimento", price: 690, dur: 60 },
      { owner: "company" as const, ownerIdx: 3, name: "Pacote 10 sessões depilação a laser", cat: "estetica", type: "pacote", price: 2400, dur: 30, sessions: 10, validity: 365 },
      { owner: "company" as const, ownerIdx: 0, name: "Check-up executivo", cat: "consulta", type: "procedimento", price: 950, dur: 90 },
    ];

    for (const s of serviceSpecs) {
      const { data: svc } = await supabaseAdmin.from("services").insert({
        professional_id: s.owner === "pro" ? proIds[s.ownerIdx] : null,
        company_id: s.owner === "company" ? companyIds[s.ownerIdx] : null,
        category_id: catSlug[s.cat] ?? null,
        name: s.name, duration_minutes: s.dur, price: s.price, active: true, type: s.type as "consulta" | "exame" | "procedimento" | "pacote",
      }).select().single();
      if (svc && s.type === "pacote" && "sessions" in s) {
        await supabaseAdmin.from("service_packages").insert({
          service_id: svc.id, sessions_total: s.sessions!, validity_days: s.validity!,
        });
      }
    }

    // Cupom demo
    await supabaseAdmin.from("coupons").upsert({
      code: "LIVVO10", description: "10% off na primeira consulta", type: "percent", value: 10,
      min_amount: 100, max_uses: 1000, active: true,
    }, { onConflict: "code" });

    // Paciente demo + agendamentos com financial_status variado
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
      const demoAppts: Array<{ proIdx: number; days: number; status: "realizada" | "confirmada" | "agendada" | "cancelada"; finStatus: "agendado" | "pago" | "realizado" | "liberado_repasse" | "repassado" | "reembolsado"; price: number }> = [
        { proIdx: 0, days: -20, status: "realizada", finStatus: "repassado", price: 250 },
        { proIdx: 0, days: -10, status: "realizada", finStatus: "liberado_repasse", price: 250 },
        { proIdx: 2, days: -5, status: "realizada", finStatus: "realizado", price: 220 },
        { proIdx: 4, days: -8, status: "cancelada", finStatus: "reembolsado", price: 180 },
        { proIdx: 0, days: 3, status: "confirmada", finStatus: "pago", price: 250 },
        { proIdx: 1, days: 5, status: "confirmada", finStatus: "pago", price: 200 },
        { proIdx: 3, days: 7, status: "agendada", finStatus: "agendado", price: 320 },
        { proIdx: 6, days: 10, status: "agendada", finStatus: "pago", price: 180 },
      ];
      for (const a of demoAppts) {
        const when = new Date(); when.setDate(when.getDate() + a.days); when.setHours(10, 0, 0, 0);
        const { data: pctData } = await supabaseAdmin.rpc("effective_commission_percent", { _professional: proIds[a.proIdx], _company: proIds[a.proIdx] });
        const pct = Number(pctData ?? 15);
        const commission = Math.round((a.price * pct) / 100 * 100) / 100;
        const net = Math.round((a.price - commission) * 100) / 100;
        const { data: appt } = await supabaseAdmin.from("appointments").insert({
          patient_id: patientId, professional_id: proIds[a.proIdx], scheduled_at: when.toISOString(),
          duration_minutes: 30, modality: "presencial", status: a.status, price: a.price,
          gross_amount: a.price, commission_amount: commission, net_amount: net,
          payment_status: a.finStatus === "reembolsado" ? "reembolsado" : "pago", payment_method: "mock_card",
          financial_status: a.finStatus,
          completed_at: ["realizado", "liberado_repasse", "repassado"].includes(a.finStatus) ? when.toISOString() : null,
          released_at: ["liberado_repasse", "repassado"].includes(a.finStatus) ? new Date().toISOString() : null,
        }).select().single();
        if (appt && a.finStatus !== "reembolsado") {
          await supabaseAdmin.from("payments").insert({
            appointment_id: appt.id, patient_id: patientId, amount: a.price, status: "pago", method: "mock_card", paid_at: new Date().toISOString(),
          });
          await supabaseAdmin.from("wallet_transactions").insert([
            { provider_id: proIds[a.proIdx], appointment_id: appt.id, kind: "credito", amount: a.price, description: "Pagamento de consulta" },
            { provider_id: proIds[a.proIdx], appointment_id: appt.id, kind: "comissao", amount: -commission, description: `Comissão Livvo (${pct}%)` },
          ]);
          if (a.finStatus === "repassado") {
            await supabaseAdmin.from("wallet_transactions").insert({
              provider_id: proIds[a.proIdx], appointment_id: appt.id, kind: "repasse", amount: -net, description: "Repasse Livvo",
            });
          }
          if (a.status === "realizada") {
            await supabaseAdmin.from("reviews").insert({
              appointment_id: appt.id, patient_id: patientId, professional_id: proIds[a.proIdx],
              rating: 5, comment: "Atendimento excelente, profissional muito atencioso!",
            });
          }
        }
      }

      // Pacote em uso (3/10 sessões consumidas) — pega o pacote de fisioterapia
      const { data: pkgSvc } = await supabaseAdmin.from("services").select("id").eq("name", "Pacote 10 sessões fisioterapia").maybeSingle();
      if (pkgSvc) {
        await supabaseAdmin.from("package_purchases").insert({
          patient_id: patientId, service_id: pkgSvc.id, professional_id: proIds[7],
          sessions_total: 10, sessions_used: 3, amount_paid: 1200,
          expires_at: new Date(Date.now() + 180 * 86400000).toISOString(),
        });
      }
    }

    return { ok: true, professionals: proIds.length, companies: companyIds.length, units: unitIds.length, services: serviceSpecs.length };
  });
