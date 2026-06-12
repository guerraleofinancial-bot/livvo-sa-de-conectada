/**
 * Webhook público para gateways de pagamento.
 *
 * Em /api/public/* a autenticação da Lovable é bypassada — por isso o
 * handler valida tudo aqui dentro (assinatura HMAC, payload). Hoje só
 * registramos o payload em payment_webhook_events; o processamento real
 * só acontece após habilitar PagarMePaymentProvider.
 */
import { createFileRoute } from "@tanstack/react-router";
import { getPaymentProvider, type PaymentProviderName } from "@/lib/livvo/payment";

export const Route = createFileRoute("/api/public/payments/webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const raw = await request.text();
        const headers: Record<string, string> = {};
        request.headers.forEach((v, k) => { headers[k] = v; });

        const url = new URL(request.url);
        const gatewayParam = (url.searchParams.get("gateway") ?? "mock") as PaymentProviderName;
        const provider = getPaymentProvider(gatewayParam);

        let event;
        try {
          event = await provider.handleWebhook(raw, headers);
        } catch (err) {
          // Provider ainda não implementado / assinatura inválida — registramos para auditoria.
          event = {
            gateway: gatewayParam,
            type: "unhandled",
            transactionId: undefined,
            payload: { raw, error: (err as Error).message },
          };
        }

        try {
          const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
          await supabaseAdmin.from("payment_webhook_events").insert({
            gateway: event.gateway,
            event_type: event.type,
            signature: headers["x-hub-signature"] ?? headers["x-signature"] ?? null,
            payload: event.payload as never,
            processed: false,
          });
        } catch (err) {
          console.error("[payments.webhook] persist failed", err);
        }

        return new Response("ok", { status: 200 });
      },
      GET: async () => new Response("payments webhook online", { status: 200 }),
    },
  },
});
