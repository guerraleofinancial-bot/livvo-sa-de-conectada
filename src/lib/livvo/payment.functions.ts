import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

/**
 * Mock checkout: cria o agendamento PAGO, calcula comissão a partir de platform_settings,
 * grava ledger (crédito bruto + débito comissão) e payment + notificações.
 * Quando ligar gateway real (Stripe Connect), basta substituir o trecho de "captura".
 */
export const createPaidAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    professionalId: string;
    scheduledAt: string;
    serviceId?: string | null;
    paymentMethod: "mock_card" | "mock_pix";
    notes?: string;
  }) =>
    z.object({
      professionalId: z.string().uuid(),
      scheduledAt: z.string(),
      serviceId: z.string().uuid().nullable().optional(),
      paymentMethod: z.enum(["mock_card", "mock_pix"]),
      notes: z.string().max(500).optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Resolve price + duration
    let price = 0;
    let duration = 30;
    if (data.serviceId) {
      const { data: svc } = await supabase.from("services").select("price, duration_minutes").eq("id", data.serviceId).single();
      if (!svc) throw new Error("Serviço não encontrado");
      price = Number(svc.price);
      duration = svc.duration_minutes ?? 30;
    } else {
      const { data: pro } = await supabase.from("professionals").select("consultation_price").eq("id", data.professionalId).single();
      if (!pro) throw new Error("Profissional não encontrado");
      price = Number(pro.consultation_price);
    }

    // Get commission %
    const { data: settings } = await supabase.from("platform_settings").select("commission_percent").eq("id", 1).single();
    const pct = Number(settings?.commission_percent ?? 15);
    const commission = Math.round((price * pct) / 100 * 100) / 100;
    const net = Math.round((price - commission) * 100) / 100;

    // Avoid double-booking
    const slotIso = new Date(data.scheduledAt).toISOString();
    const { data: clash } = await supabase
      .from("appointments")
      .select("id")
      .eq("professional_id", data.professionalId)
      .eq("scheduled_at", slotIso)
      .in("status", ["agendada", "confirmada"])
      .maybeSingle();
    if (clash) throw new Error("Horário indisponível");

    // Create appointment as paid + confirmed
    const { data: appt, error: aErr } = await supabaseAdmin.from("appointments").insert({
      patient_id: userId,
      professional_id: data.professionalId,
      service_id: data.serviceId ?? null,
      scheduled_at: slotIso,
      duration_minutes: duration,
      modality: "presencial",
      status: "confirmada",
      price,
      gross_amount: price,
      commission_amount: commission,
      net_amount: net,
      payment_status: "pago",
      payment_method: data.paymentMethod,
      patient_notes: data.notes ?? null,
    }).select().single();
    if (aErr || !appt) throw aErr ?? new Error("Falha ao agendar");

    // Payment record
    await supabaseAdmin.from("payments").insert({
      appointment_id: appt.id,
      patient_id: userId,
      amount: price,
      status: "pago",
      method: data.paymentMethod,
      paid_at: new Date().toISOString(),
    });

    // Ledger: net credit + commission debit (separate rows for clarity)
    await supabaseAdmin.from("wallet_transactions").insert([
      { provider_id: data.professionalId, appointment_id: appt.id, kind: "credito", amount: price, description: "Pagamento de consulta" },
      { provider_id: data.professionalId, appointment_id: appt.id, kind: "comissao", amount: -commission, description: `Comissão Livvo (${pct}%)` },
    ]);

    // Notifications
    await supabaseAdmin.from("notifications").insert([
      { user_id: userId, title: "Consulta confirmada", body: `Pagamento de R$ ${price.toFixed(2)} recebido.` },
      { user_id: data.professionalId, title: "Nova consulta confirmada", body: `Você recebeu R$ ${net.toFixed(2)} (líquido).` },
    ]);

    return { ok: true, appointmentId: appt.id, gross: price, commission, net };
  });

/** Cancelar com regra de janela (refund integral se dentro da janela). */
export const cancelAppointment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { appointmentId: string }) => z.object({ appointmentId: z.string().uuid() }).parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: appt } = await supabase.from("appointments").select("*").eq("id", data.appointmentId).single();
    if (!appt) throw new Error("Consulta não encontrada");
    if (appt.patient_id !== userId && appt.professional_id !== userId) throw new Error("Sem permissão");

    const { data: settings } = await supabase.from("platform_settings").select("cancellation_window_hours").eq("id", 1).single();
    const windowHours = settings?.cancellation_window_hours ?? 24;
    const hoursToAppt = (new Date(appt.scheduled_at).getTime() - Date.now()) / 36e5;
    const fullRefund = hoursToAppt >= windowHours;

    await supabaseAdmin.from("appointments").update({
      status: "cancelada",
      cancelled_at: new Date().toISOString(),
      cancelled_by: userId,
      payment_status: appt.payment_status === "pago" && fullRefund ? "reembolsado" : appt.payment_status,
    }).eq("id", appt.id);

    if (appt.payment_status === "pago" && fullRefund) {
      // Reverter ledger
      await supabaseAdmin.from("wallet_transactions").insert([
        { provider_id: appt.professional_id, appointment_id: appt.id, kind: "reembolso", amount: -Number(appt.gross_amount), description: "Reembolso ao paciente" },
        { provider_id: appt.professional_id, appointment_id: appt.id, kind: "ajuste", amount: Number(appt.commission_amount), description: "Estorno de comissão" },
      ]);
      await supabaseAdmin.from("payments").update({ status: "reembolsado" }).eq("appointment_id", appt.id);
    }

    await supabaseAdmin.from("notifications").insert([
      { user_id: appt.patient_id, title: "Consulta cancelada", body: fullRefund ? "Reembolso integral processado." : "Sem reembolso (fora da janela)." },
      { user_id: appt.professional_id, title: "Consulta cancelada", body: `Agendamento de ${new Date(appt.scheduled_at).toLocaleString("pt-BR")} foi cancelado.` },
    ]);

    return { ok: true, refunded: fullRefund };
  });
