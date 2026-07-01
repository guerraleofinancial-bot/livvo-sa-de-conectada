import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { writeAudit } from "./audit.functions";

/**
 * Cobrança Livvo: cria payment "avulso" (sem appointment obrigatório) a partir
 * do CRM/orçamento/agendamento. Suporta paciente cadastrado (auth.users) ou
 * contato do CRM ainda não-cadastrado. Calcula comissão efetiva e gera link público.
 */

function genToken() {
  // 22 chars url-safe
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(36).padStart(2, "0")).join("").slice(0, 22);
}

export const createCharge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: {
    amount: number;
    description?: string | null;
    dueDate?: string | null;
    paymentMethod: "pix" | "cartao" | "link";
    crmContactId?: string | null;
    patientUserId?: string | null;
    appointmentId?: string | null;
    quoteId?: string | null;
    companyId?: string | null;
  }) =>
    z.object({
      amount: z.number().positive().max(1_000_000),
      description: z.string().max(500).nullable().optional(),
      dueDate: z.string().nullable().optional(),
      paymentMethod: z.enum(["pix", "cartao", "link"]),
      crmContactId: z.string().uuid().nullable().optional(),
      patientUserId: z.string().uuid().nullable().optional(),
      appointmentId: z.string().uuid().nullable().optional(),
      quoteId: z.string().uuid().nullable().optional(),
      companyId: z.string().uuid().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!data.crmContactId && !data.patientUserId && !data.appointmentId) {
      throw new Error("Informe um paciente, contato ou agendamento");
    }

    // Resolver paciente + empresa via contato/agendamento
    let patientUserId = data.patientUserId ?? null;
    let companyId = data.companyId ?? null;
    let crmContactId = data.crmContactId ?? null;

    if (data.crmContactId) {
      const { data: c } = await supabase
        .from("crm_contacts")
        .select("id, claimed_user_id, company_id, professional_id, full_name")
        .eq("id", data.crmContactId).maybeSingle();
      if (!c) throw new Error("Contato não encontrado");
      // permissão: profissional dono OU staff da empresa
      const ownsPro = c.professional_id === userId;
      let ownsCompany = false;
      if (!ownsPro && c.company_id) {
        const { data: ok } = await supabase.rpc("is_company_staff", { _user: userId, _company: c.company_id });
        ownsCompany = !!ok;
      }
      if (!ownsPro && !ownsCompany) throw new Error("Sem permissão sobre este contato");
      patientUserId = c.claimed_user_id ?? null;
      companyId = companyId ?? c.company_id ?? null;
      crmContactId = c.id;
    }

    if (data.appointmentId) {
      const { data: a } = await supabase.from("appointments").select("id, patient_id, professional_id").eq("id", data.appointmentId).maybeSingle();
      if (!a) throw new Error("Agendamento não encontrado");
      if (a.professional_id !== userId) throw new Error("Sem permissão sobre o agendamento");
      patientUserId = patientUserId ?? a.patient_id;
    }

    // Comissão efetiva
    const { data: pctRaw } = await supabase.rpc("effective_commission_percent", {
      _professional: userId,
      _company: companyId ?? userId,
    });
    const pct = Number(pctRaw ?? 15);
    const gross = Math.round(data.amount * 100) / 100;
    const commission = Math.round((gross * pct) / 100 * 100) / 100;
    const net = Math.round((gross - commission) * 100) / 100;

    const token = genToken();

    const { data: charge, error } = await supabaseAdmin.from("payments").insert({
      appointment_id: data.appointmentId ?? null,
      patient_id: patientUserId,
      crm_contact_id: crmContactId,
      quote_id: data.quoteId ?? null,
      company_id: companyId,
      recipient_id: userId,
      amount: gross,
      gross_amount: gross,
      commission_amount: commission,
      commission_percent: pct,
      net_amount: net,
      status: "enviada",
      method: data.paymentMethod,
      payment_method: data.paymentMethod,
      description: data.description ?? null,
      due_date: data.dueDate ?? null,
      public_token: token,
      sent_at: new Date().toISOString(),
      gateway: "mock",
      payout_status: "pendente",
    }).select().single();
    if (error || !charge) throw error ?? new Error("Falha ao criar cobrança");

    await supabaseAdmin.from("charge_events").insert([
      { payment_id: charge.id, event: "created", actor_id: userId, metadata: { method: data.paymentMethod } },
      { payment_id: charge.id, event: "sent", actor_id: userId, metadata: {} },
    ]);

    // Notifica paciente cadastrado
    if (patientUserId) {
      await supabaseAdmin.rpc("notify_user", {
        _user_id: patientUserId,
        _event: "charge_sent",
        _title: "Você recebeu uma cobrança",
        _body: `${data.description ?? "Cobrança"} — R$ ${gross.toFixed(2)}`,
        _link: `/pay/${token}`,
        _metadata: { payment_id: charge.id },
      });
    }

    await writeAudit({
      event: "charge.create",
      module: "billing",
      actorId: userId,
      entityType: "payment",
      entityId: charge.id,
      description: `Cobrança de R$ ${gross.toFixed(2)} criada (${data.paymentMethod})`,
      after: { amount: gross, commission, net, method: data.paymentMethod, contactId: crmContactId, patientUserId, appointmentId: data.appointmentId, quoteId: data.quoteId },
    });

    return {
      id: charge.id,
      token,
      publicUrl: `/pay/${token}`,
      gross,
      commission,
      net,
      commissionPercent: pct,
    };
  });

/** Pública: busca dados mínimos via token. */
export const getPublicCharge = createServerFn({ method: "GET" })
  .inputValidator((d: { token: string }) => z.object({ token: z.string().min(8).max(64) }).parse(d))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin
      .from("payments")
      .select("id, amount, description, due_date, status, method, recipient_id, company_id, public_token")
      .eq("public_token", data.token).maybeSingle();
    if (!p) throw new Error("Cobrança não encontrada");

    let providerName = "Profissional Livvo";
    if (p.company_id) {
      const { data: c } = await supabaseAdmin.from("companies").select("trade_name, legal_name").eq("id", p.company_id).maybeSingle();
      if (c?.trade_name || c?.legal_name) providerName = (c.trade_name ?? c.legal_name) as string;
    } else if (p.recipient_id) {
      const { data: pr } = await supabaseAdmin.from("profiles").select("full_name").eq("id", p.recipient_id).maybeSingle();
      if (pr?.full_name) providerName = pr.full_name;
    }

    // marca visualizada (idempotente)
    if (p.status === "enviada") {
      await supabaseAdmin.from("payments").update({ status: "visualizada", viewed_at: new Date().toISOString() }).eq("id", p.id);
      await supabaseAdmin.from("charge_events").insert({ payment_id: p.id, event: "viewed", metadata: {} });
    }

    return {
      id: p.id,
      amount: Number(p.amount),
      description: p.description,
      dueDate: p.due_date,
      status: p.status === "enviada" ? "visualizada" : p.status,
      method: p.method,
      providerName,
      token: p.public_token,
    };
  });

/** Confirma pagamento simulado e propaga efeitos. */
export const simulatePayCharge = createServerFn({ method: "POST" })
  .inputValidator((d: { token: string; method: "pix" | "cartao" | "link" }) =>
    z.object({ token: z.string().min(8).max(64), method: z.enum(["pix", "cartao", "link"]) }).parse(d),
  )
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: p } = await supabaseAdmin.from("payments").select("*").eq("public_token", data.token).maybeSingle();
    if (!p) throw new Error("Cobrança não encontrada");
    if (p.status === "pago") return { ok: true, alreadyPaid: true };
    if (["cancelada", "reembolsado"].includes(p.status)) throw new Error("Cobrança não pode ser paga");

    const now = new Date().toISOString();
    await supabaseAdmin.from("payments").update({
      status: "pago",
      method: data.method,
      payment_method: data.method,
      paid_at: now,
      gateway_transaction_id: `mock_${Date.now()}`,
    }).eq("id", p.id);

    await supabaseAdmin.from("charge_events").insert({
      payment_id: p.id, event: "paid", metadata: { method: data.method },
    });

    // Ledger
    if (p.recipient_id && Number(p.gross_amount) > 0) {
      await supabaseAdmin.from("wallet_transactions").insert([
        { provider_id: p.recipient_id, appointment_id: p.appointment_id, kind: "credito", amount: Number(p.gross_amount), description: `Pagamento de cobrança (mock ${data.method})` },
        { provider_id: p.recipient_id, appointment_id: p.appointment_id, kind: "comissao", amount: -Number(p.commission_amount ?? 0), description: `Comissão Livvo (${p.commission_percent ?? ""}%)` },
      ]);
    }

    // Efeitos colaterais
    if (p.appointment_id) {
      await supabaseAdmin.from("appointments").update({
        payment_status: "pago", financial_status: "pago",
      }).eq("id", p.appointment_id);
    }
    if (p.quote_id) {
      await supabaseAdmin.from("quotes").update({ status: "aprovado", decided_at: now }).eq("id", p.quote_id);
    }
    if (p.crm_contact_id && p.recipient_id) {
      await supabaseAdmin.from("crm_patient_relationships")
        .update({ status: "fidelizado", status_overridden: true, updated_at: now })
        .eq("professional_id", p.recipient_id)
        .eq("patient_id", p.crm_contact_id);
    }

    // Notificações
    if (p.recipient_id) {
      await supabaseAdmin.rpc("notify_user", {
        _user_id: p.recipient_id,
        _event: "charge_paid",
        _title: "Pagamento confirmado",
        _body: `Cobrança de R$ ${Number(p.gross_amount).toFixed(2)} foi paga.`,
        _metadata: { payment_id: p.id },
      });
    }
    if (p.patient_id) {
      await supabaseAdmin.rpc("notify_user", {
        _user_id: p.patient_id,
        _event: "charge_paid",
        _title: "Pagamento aprovado",
        _body: "Seu pagamento foi aprovado.",
        _metadata: { payment_id: p.id },
      });
    }

    await writeAudit({
      event: "payment.simulated",
      module: "billing",
      actorId: p.recipient_id,
      entityType: "payment",
      entityId: p.id,
      description: `Pagamento simulado (${data.method}) confirmado — R$ ${Number(p.gross_amount ?? p.amount).toFixed(2)}`,
      after: { method: data.method, amount: Number(p.amount), gross: Number(p.gross_amount ?? 0), commission: Number(p.commission_amount ?? 0) },
    });

    return { ok: true };
  });

/** Lista cobranças de um contato/paciente para mostrar histórico no CRM. */
export const listChargesForContact = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { contactId?: string | null; patientUserId?: string | null }) =>
    z.object({
      contactId: z.string().uuid().nullable().optional(),
      patientUserId: z.string().uuid().nullable().optional(),
    }).parse(d),
  )
  .handler(async ({ data, context }) => {
    const { supabase } = context;
    let q = supabase.from("payments").select("id, amount, status, description, due_date, created_at, sent_at, paid_at, public_token, method").order("created_at", { ascending: false });
    if (data.contactId) q = q.eq("crm_contact_id", data.contactId);
    else if (data.patientUserId) q = q.eq("patient_id", data.patientUserId);
    else return [];
    const { data: rows, error } = await q;
    if (error) throw error;
    return rows ?? [];
  });
