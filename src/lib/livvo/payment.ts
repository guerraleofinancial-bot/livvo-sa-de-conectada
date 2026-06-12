/**
 * Livvo — Camada de pagamentos (Payment Provider abstraction).
 *
 * Toda lógica financeira da plataforma passa por um PaymentProvider.
 * Hoje rodamos com MockPaymentProvider (checkout simulado).
 * Quando ativarmos Pagar.me, basta trocar a fábrica em `getPaymentProvider()`.
 *
 * IMPORTANTE
 * - Comissão, split e repasse SEMPRE são calculados no servidor.
 * - Nenhuma chave secreta vive neste arquivo. Em produção, virão de variáveis
 *   de ambiente lidas apenas em server functions / server routes.
 * - Mesmo durante a "comissão zero" do prestador, planos de destaque
 *   patrocinado continuam pagos normalmente (cobrança separada).
 */

export type PaymentMethod = "mock_card" | "mock_pix" | "card" | "pix" | "boleto";
export type PaymentStatus = "pendente" | "aprovado" | "recusado" | "estornado" | "cancelado";
export type PayoutStatus = "pendente" | "liberado" | "repassado" | "estornado";
export type RefundStatus = "nao_aplicavel" | "solicitado" | "concluido" | "negado";

export interface SplitBreakdown {
  grossAmount: number;
  commissionPercent: number;
  commissionAmount: number;
  netAmount: number;
}

export interface CreateChargeInput {
  amount: number;
  method: PaymentMethod;
  customerId: string;
  recipientId: string;
  metadata?: Record<string, unknown>;
  /** Para forçar cenários simulados: "approved" | "declined" | "pending". */
  simulate?: "approved" | "declined" | "pending";
}

export interface ChargeResult {
  gateway: string;
  status: PaymentStatus;
  transactionId: string;
  paymentId: string;
  method: PaymentMethod;
  amount: number;
  raw?: Record<string, unknown>;
}

export interface RefundResult {
  gateway: string;
  status: RefundStatus;
  refundId: string;
  amount: number;
  raw?: Record<string, unknown>;
}

export interface PayoutResult {
  gateway: string;
  status: PayoutStatus;
  payoutId: string;
  amount: number;
  recipientId: string;
}

export interface WebhookEvent {
  gateway: string;
  type: string;
  transactionId?: string;
  payload: Record<string, unknown>;
}

export interface PaymentProvider {
  readonly name: string;
  createCharge(input: CreateChargeInput): Promise<ChargeResult>;
  confirmPayment(transactionId: string): Promise<ChargeResult>;
  refundPayment(transactionId: string, amount?: number): Promise<RefundResult>;
  calculateSplit(grossAmount: number, commissionPercent: number): SplitBreakdown;
  createPayout(recipientId: string, amount: number): Promise<PayoutResult>;
  getPaymentStatus(transactionId: string): Promise<PaymentStatus>;
  handleWebhook(rawBody: string, headers: Record<string, string>): Promise<WebhookEvent>;
}

// ────────────────────────────────────────────────────────────────────────────
// Split util — compartilhado por todos os providers
// ────────────────────────────────────────────────────────────────────────────

export function calculateSplit(grossAmount: number, commissionPercent: number): SplitBreakdown {
  const gross = Math.round(grossAmount * 100) / 100;
  const pct = Math.max(0, Math.min(100, commissionPercent));
  const commission = Math.round((gross * pct) / 100 * 100) / 100;
  const net = Math.round((gross - commission) * 100) / 100;
  return { grossAmount: gross, commissionPercent: pct, commissionAmount: commission, netAmount: net };
}

// ────────────────────────────────────────────────────────────────────────────
// Mock provider — usado pelo checkout simulado atual
// ────────────────────────────────────────────────────────────────────────────

function mockId(prefix: string) {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export const MockPaymentProvider: PaymentProvider = {
  name: "mock",

  async createCharge(input) {
    // Simula cenários sem depender de cartão real.
    const force = input.simulate;
    let status: PaymentStatus = "aprovado";
    if (force === "declined") status = "recusado";
    else if (force === "pending") status = "pendente";
    // PIX simulado fica "pendente" até "confirmar" no UI; cartão aprova na hora.
    else if (input.method === "mock_pix" || input.method === "pix") status = "pendente";

    return {
      gateway: "mock",
      status,
      transactionId: mockId("mocktx"),
      paymentId: mockId("mockpay"),
      method: input.method,
      amount: input.amount,
      raw: { simulated: true, ts: new Date().toISOString() },
    };
  },

  async confirmPayment(transactionId) {
    return {
      gateway: "mock",
      status: "aprovado",
      transactionId,
      paymentId: mockId("mockpay"),
      method: "mock_pix",
      amount: 0,
      raw: { simulated: true, confirmed: true },
    };
  },

  async refundPayment(transactionId, amount) {
    return {
      gateway: "mock",
      status: "concluido",
      refundId: mockId("mockref"),
      amount: amount ?? 0,
      raw: { simulated: true, transactionId },
    };
  },

  calculateSplit,

  async createPayout(recipientId, amount) {
    return { gateway: "mock", status: "repassado", payoutId: mockId("mockpo"), amount, recipientId };
  },

  async getPaymentStatus() {
    return "aprovado";
  },

  async handleWebhook(rawBody) {
    const payload = safeJson(rawBody);
    return {
      gateway: "mock",
      type: (payload?.event as string) ?? "mock.event",
      transactionId: payload?.transaction_id as string | undefined,
      payload: payload ?? {},
    };
  },
};

function safeJson(raw: string): Record<string, unknown> | null {
  try { return JSON.parse(raw); } catch { return null; }
}

// ────────────────────────────────────────────────────────────────────────────
// Pagar.me — esqueleto para troca futura. NÃO usar em produção ainda.
// ────────────────────────────────────────────────────────────────────────────

/**
 * Estrutura preparada para integração real com Pagar.me.
 * Quando ativarmos:
 *  - Secrets necessárias (server-only): PAGARME_API_KEY, PAGARME_WEBHOOK_SECRET.
 *  - Recipients: cada prestador/clínica precisa ser cadastrado como recipient
 *    no Pagar.me; armazenar `pagarme_recipient_id` em provider_payout_accounts.
 *  - Split rules: usar `split` na criação da transação com a comissão da Livvo.
 *  - Métodos: card / pix / boleto (configurável por tenant).
 *  - Webhooks: endpoint público em /api/public/payments/webhook valida HMAC
 *    e grava em payment_webhook_events; só dispara side-effects após verificar
 *    assinatura.
 */
export const PagarMePaymentProvider: PaymentProvider = {
  name: "pagarme",

  async createCharge(_input) {
    // TODO: POST https://api.pagar.me/core/v5/orders com:
    //  - items[{ amount, description, quantity }]
    //  - payments[{ payment_method, credit_card / pix / boleto }]
    //  - customer (cpf/cnpj, email, telefone)
    //  - split[{ recipient_id, amount, charge_processing_fee }]
    throw new Error("PagarMePaymentProvider ainda não foi habilitado. Use MockPaymentProvider em desenvolvimento.");
  },

  async confirmPayment(_transactionId) {
    // TODO: GET /core/v5/charges/:id para sincronizar status
    throw new Error("PagarMePaymentProvider.confirmPayment não implementado");
  },

  async refundPayment(_transactionId, _amount) {
    // TODO: DELETE /core/v5/charges/:id  (estorno total ou parcial)
    throw new Error("PagarMePaymentProvider.refundPayment não implementado");
  },

  calculateSplit,

  async createPayout(_recipientId, _amount) {
    // TODO: POST /core/v5/recipients/:id/withdrawals
    throw new Error("PagarMePaymentProvider.createPayout não implementado");
  },

  async getPaymentStatus(_transactionId) {
    throw new Error("PagarMePaymentProvider.getPaymentStatus não implementado");
  },

  async handleWebhook(_rawBody, _headers) {
    // TODO:
    //  1. Ler header `X-Hub-Signature` e validar HMAC com PAGARME_WEBHOOK_SECRET
    //     usando timingSafeEqual.
    //  2. Persistir payload bruto em payment_webhook_events.
    //  3. Roteamento por `type` (order.paid, charge.refunded, etc).
    throw new Error("PagarMePaymentProvider.handleWebhook não implementado");
  },
};

// ────────────────────────────────────────────────────────────────────────────
// Fábrica
// ────────────────────────────────────────────────────────────────────────────

export type PaymentProviderName = "mock" | "pagarme";

export function getPaymentProvider(name?: PaymentProviderName | string | null): PaymentProvider {
  const key = (name ?? process.env.LIVVO_PAYMENT_PROVIDER ?? "mock").toLowerCase();
  if (key === "pagarme") return PagarMePaymentProvider;
  return MockPaymentProvider;
}
