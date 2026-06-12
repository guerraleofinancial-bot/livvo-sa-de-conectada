import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getPaymentProvider, type PaymentMethod } from "@/lib/livvo/payment";

type CtxLike = { supabase: ReturnType<typeof globalThis.fetch> extends never ? never : any; userId: string }; // eslint-disable-line @typescript-eslint/no-explicit-any

/**
 * Checkout simulado: cria agendamento com financial_status='pago',
 * calcula comissão efetiva (override profissional → empresa → global),
 * aplica cupom se informado, grava ledger (bloqueado até liberar repasse).
 */
export const createPaidAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    professionalId: string;
    scheduledAt: string;
    serviceId?: string | null;
    unitId?: string | null;
    resourceId?: string | null;
    couponCode?: string | null;
    packagePurchaseId?: string | null;
    paymentMethod: "mock_card" | "mock_pix" | "pacote";
    notes?: string;
    simulate?: "approved" | "declined" | "pending";
  }) =>
    z.object({
      professionalId: z.string().uuid(),
      scheduledAt: z.string(),
      serviceId: z.string().uuid().nullable().optional(),
      unitId: z.string().uuid().nullable().optional(),
      resourceId: z.string().uuid().nullable().optional(),
      couponCode: z.string().max(40).nullable().optional(),
      packagePurchaseId: z.string().uuid().nullable().optional(),
      paymentMethod: z.enum(["mock_card", "mock_pix", "pacote"]),
      notes: z.string().max(500).optional(),
      simulate: z.enum(["approved", "declined", "pending"]).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve service + price + duration + company
    let price = 0;
    let duration = 30;
    let companyId: string | null = null;
    let serviceType: string = "consulta";
    if (data.serviceId) {
      const { data: svc } = await supabase.from("services").select("price, duration_minutes, company_id, type").eq("id", data.serviceId).single();
      if (!svc) throw new Error("Serviço não encontrado");
      price = Number(svc.price);
      duration = svc.duration_minutes ?? 30;
      companyId = svc.company_id ?? null;
      serviceType = svc.type ?? "consulta";
    } else {
      const { data: pro } = await supabase.from("professionals").select("consultation_price, company_id").eq("id", data.professionalId).single();
      if (!pro) throw new Error("Profissional não encontrado");
      price = Number(pro.consultation_price);
      companyId = (pro as { company_id?: string | null }).company_id ?? null;
    }

    // Coupon discount
    let discount = 0;
    let couponId: string | null = null;
    if (data.couponCode) {
      const { data: cou } = await supabase.from("coupons").select("*").eq("code", data.couponCode).eq("active", true).maybeSingle();
      if (cou) {
        const now = Date.now();
        const okFrom = !cou.valid_from || new Date(cou.valid_from).getTime() <= now;
        const okUntil = !cou.valid_until || new Date(cou.valid_until).getTime() >= now;
        const okMin = !cou.min_amount || price >= Number(cou.min_amount);
        const okUses = cou.max_uses == null || (cou.uses_count ?? 0) < cou.max_uses;
        if (okFrom && okUntil && okMin && okUses) {
          discount = cou.type === "percent" ? Math.round((price * Number(cou.value)) / 100 * 100) / 100 : Math.min(price, Number(cou.value));
          couponId = cou.id;
        }
      }
    }

    const gross = Math.max(0, price - discount);

    // Effective commission
    const { data: pctData } = await supabase.rpc("effective_commission_percent", { _professional: data.professionalId, _company: companyId ?? (data.professionalId as string) });
    const pct = Number(pctData ?? 15);
    const commission = Math.round((gross * pct) / 100 * 100) / 100;
    const net = Math.round((gross - commission) * 100) / 100;

    // Avoid clash on professional or resource
    const slotIso = new Date(data.scheduledAt).toISOString();
    const { data: clash } = await supabase.from("appointments").select("id")
      .eq("professional_id", data.professionalId).eq("scheduled_at", slotIso)
      .in("status", ["agendada", "confirmada"]).maybeSingle();
    if (clash) throw new Error("Horário indisponível (profissional)");
    if (data.resourceId) {
      const { data: rClash } = await supabase.from("appointments").select("id")
        .eq("resource_id", data.resourceId).eq("scheduled_at", slotIso)
        .in("status", ["agendada", "confirmada"]).maybeSingle();
      if (rClash) throw new Error("Recurso indisponível neste horário");
    }

    // Package consumption path
    const usingPackage = data.paymentMethod === "pacote" && !!data.packagePurchaseId;
    if (usingPackage) {
      const { data: pkg } = await supabaseAdmin.from("package_purchases").select("*").eq("id", data.packagePurchaseId!).single();
      if (!pkg) throw new Error("Pacote não encontrado");
      if (pkg.patient_id !== userId) throw new Error("Pacote não pertence ao paciente");
      if ((pkg.sessions_used ?? 0) >= pkg.sessions_total) throw new Error("Pacote sem sessões");
      if (new Date(pkg.expires_at).getTime() < Date.now()) throw new Error("Pacote expirado");
      await supabaseAdmin.from("package_purchases").update({ sessions_used: (pkg.sessions_used ?? 0) + 1 }).eq("id", pkg.id);
    }

    const finStatus = usingPackage ? "pago" : "pago";
    const payAmount = usingPackage ? 0 : gross;

    // Roteia pelo PaymentProvider (mock hoje, Pagar.me amanhã).
    const provider = getPaymentProvider();
    let chargeResult: Awaited<ReturnType<typeof provider.createCharge>> | null = null;
    if (!usingPackage) {
      chargeResult = await provider.createCharge({
        amount: payAmount,
        method: data.paymentMethod as PaymentMethod,
        customerId: userId,
        recipientId: data.professionalId,
        simulate: data.simulate,
        metadata: { professionalId: data.professionalId, serviceId: data.serviceId ?? null },
      });
      if (chargeResult.status === "recusado") throw new Error("Pagamento recusado pelo emissor");
    }
    const apptPaymentStatus = chargeResult ? (chargeResult.status === "aprovado" ? "pago" : chargeResult.status === "pendente" ? "pendente" : "pago") : "pago";
    const apptFinStatus = chargeResult && chargeResult.status === "pendente" ? "aguardando_pagamento" : finStatus;

    const { data: appt, error: aErr } = await supabaseAdmin.from("appointments").insert({
      patient_id: userId,
      professional_id: data.professionalId,
      service_id: data.serviceId ?? null,
      unit_id: data.unitId ?? null,
      resource_id: data.resourceId ?? null,
      package_purchase_id: usingPackage ? data.packagePurchaseId! : null,
      coupon_code: data.couponCode ?? null,
      discount_amount: discount,
      scheduled_at: slotIso,
      duration_minutes: duration,
      modality: "presencial",
      status: chargeResult?.status === "pendente" ? "agendada" : "confirmada",
      price: payAmount,
      gross_amount: payAmount,
      commission_amount: usingPackage ? 0 : commission,
      net_amount: usingPackage ? 0 : net,
      payment_status: apptPaymentStatus,
      payment_method: data.paymentMethod,
      financial_status: apptFinStatus,
      gateway: chargeResult?.gateway ?? null,
      gateway_transaction_id: chargeResult?.transactionId ?? null,
      patient_notes: data.notes ?? null,
    }).select().single();
    if (aErr || !appt) throw aErr ?? new Error("Falha ao agendar");

    if (!usingPackage && chargeResult) {
      await supabaseAdmin.from("payments").insert({
        appointment_id: appt.id,
        patient_id: userId,
        amount: payAmount,
        status: chargeResult.status === "aprovado" ? "pago" : "pendente",
        method: data.paymentMethod,
        paid_at: chargeResult.status === "aprovado" ? new Date().toISOString() : null,
        gateway: chargeResult.gateway,
        gateway_transaction_id: chargeResult.transactionId,
        gateway_payment_id: chargeResult.paymentId,
        payment_method: data.paymentMethod,
        gross_amount: payAmount,
        commission_amount: commission,
        net_amount: net,
        recipient_id: data.professionalId,
        payout_status: "pendente",
      });
      if (chargeResult.status === "aprovado") {
        await supabaseAdmin.from("wallet_transactions").insert([
          { provider_id: data.professionalId, appointment_id: appt.id, kind: "credito", amount: payAmount, description: "Pagamento de consulta (bloqueado até liberação)" },
          { provider_id: data.professionalId, appointment_id: appt.id, kind: "comissao", amount: -commission, description: `Comissão Livvo (${pct}%)` },
        ]);
      }
    }

    if (couponId) {
      await supabaseAdmin.from("coupon_redemptions").insert({ coupon_id: couponId, patient_id: userId, appointment_id: appt.id, amount_discounted: discount });
      await supabaseAdmin.rpc; // noop placeholder
      const { data: cur } = await supabaseAdmin.from("coupons").select("uses_count").eq("id", couponId).single();
      await supabaseAdmin.from("coupons").update({ uses_count: (cur?.uses_count ?? 0) + 1 }).eq("id", couponId);
    }

    await supabaseAdmin.from("notifications").insert([
      { user_id: userId, title: "Consulta confirmada", body: usingPackage ? `Sessão de pacote agendada.` : `Pagamento de R$ ${payAmount.toFixed(2)} recebido.` },
      { user_id: data.professionalId, title: "Nova consulta confirmada", body: usingPackage ? "Sessão de pacote agendada." : `Você recebeu R$ ${net.toFixed(2)} (líquido, aguardando liberação).` },
    ]);

    return { ok: true, appointmentId: appt.id, gross: payAmount, discount, commission, net, serviceType };
  });

/** Prestador marca atendimento como realizado. */
export const markAppointmentCompleted = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { appointmentId: string }) => z.object({ appointmentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: appt } = await supabase.from("appointments").select("*").eq("id", data.appointmentId).single();
    if (!appt) throw new Error("Consulta não encontrada");
    if (appt.professional_id !== userId) throw new Error("Sem permissão");
    if (appt.financial_status !== "pago") throw new Error("Estado inválido");
    await supabaseAdmin.from("appointments").update({
      status: "realizada", financial_status: "realizado", completed_at: new Date().toISOString(),
    }).eq("id", appt.id);
    return { ok: true };
  });

/** Cancelar respeitando política efetiva do parceiro. */
export const cancelAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { appointmentId: string }) => z.object({ appointmentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: appt } = await supabase.from("appointments").select("*").eq("id", data.appointmentId).single();
    if (!appt) throw new Error("Consulta não encontrada");
    if (appt.patient_id !== userId && appt.professional_id !== userId) throw new Error("Sem permissão");
    if (appt.financial_status === "repassado") throw new Error("Já repassado — não cancelável");

    // companyId p/ policy
    let companyId: string | null = null;
    if (appt.service_id) {
      const { data: svc } = await supabase.from("services").select("company_id").eq("id", appt.service_id).single();
      companyId = svc?.company_id ?? null;
    }
    const { data: pol } = await supabase.rpc("effective_cancellation_policy", { _professional: appt.professional_id, _company: companyId ?? appt.professional_id });
    const policy = (pol ?? null) as null | { hours_before_full_refund: number; hours_before_partial_refund: number; partial_refund_percent: number; non_refundable_after_confirmation: boolean };

    const hoursToAppt = (new Date(appt.scheduled_at).getTime() - Date.now()) / 36e5;
    let refundPct = 0;
    if (!policy?.non_refundable_after_confirmation) {
      if (hoursToAppt >= (policy?.hours_before_full_refund ?? 24)) refundPct = 100;
      else if (hoursToAppt >= (policy?.hours_before_partial_refund ?? 4)) refundPct = policy?.partial_refund_percent ?? 0;
    }

    const refundAmount = Math.round((Number(appt.gross_amount) * refundPct) / 100 * 100) / 100;
    const finStatus = appt.financial_status === "pago" && refundPct > 0 ? "reembolsado" : appt.financial_status;

    await supabaseAdmin.from("appointments").update({
      status: "cancelada", cancelled_at: new Date().toISOString(), cancelled_by: userId, financial_status: finStatus,
    }).eq("id", appt.id);

    if (appt.financial_status === "pago" && refundAmount > 0) {
      const commissionReversal = Math.round((Number(appt.commission_amount) * refundPct) / 100 * 100) / 100;
      await supabaseAdmin.from("wallet_transactions").insert([
        { provider_id: appt.professional_id, appointment_id: appt.id, kind: "reembolso", amount: -refundAmount, description: `Reembolso (${refundPct}%) ao paciente` },
        { provider_id: appt.professional_id, appointment_id: appt.id, kind: "ajuste", amount: commissionReversal, description: "Estorno proporcional de comissão" },
      ]);
      await supabaseAdmin.from("payments").update({ status: "reembolsado" as const }).eq("appointment_id", appt.id);
    }

    if (appt.package_purchase_id) {
      const { data: pkg } = await supabaseAdmin.from("package_purchases").select("sessions_used").eq("id", appt.package_purchase_id).single();
      if (pkg && (pkg.sessions_used ?? 0) > 0) {
        await supabaseAdmin.from("package_purchases").update({ sessions_used: pkg.sessions_used - 1 }).eq("id", appt.package_purchase_id);
      }
    }

    await supabaseAdmin.from("notifications").insert([
      { user_id: appt.patient_id, title: "Consulta cancelada", body: refundPct ? `Reembolso de ${refundPct}% processado.` : "Cancelamento sem reembolso." },
      { user_id: appt.professional_id, title: "Consulta cancelada", body: `Agendamento de ${new Date(appt.scheduled_at).toLocaleString("pt-BR")} cancelado.` },
    ]);

    return { ok: true, refundPercent: refundPct, refundAmount };
  });
