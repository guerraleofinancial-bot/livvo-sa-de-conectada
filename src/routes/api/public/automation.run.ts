import { createFileRoute } from "@tanstack/react-router";

// Drains queued automation jobs. Called by pg_cron (or any scheduler).
// Auth: `apikey` header must match Supabase anon key.
export const Route = createFileRoute("/api/public/automation/run")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const apikey = request.headers.get("apikey");
        if (!apikey || apikey !== process.env.SUPABASE_PUBLISHABLE_KEY) {
          return new Response("Unauthorized", { status: 401 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        const { data: jobs, error } = await supabaseAdmin
          .from("automation_jobs")
          .select("*")
          .eq("status", "queued")
          .lte("run_at", new Date().toISOString())
          .order("run_at", { ascending: true })
          .limit(100);
        if (error) return Response.json({ error: error.message }, { status: 500 });

        let processed = 0;
        for (const job of jobs ?? []) {
          try {
            const { title, body, link, event } = renderJob(job);
            // Notify patient
            if (job.patient_id) {
              await supabaseAdmin.from("notifications").insert({
                user_id: job.patient_id, title, body, link, event,
                metadata: { automation_job: job.id, appointment_id: job.appointment_id },
              });
            }
            await supabaseAdmin.from("automation_jobs")
              .update({ status: "sent", attempts: job.attempts + 1 })
              .eq("id", job.id);
            processed++;
          } catch (e) {
            await supabaseAdmin.from("automation_jobs")
              .update({ status: "failed", attempts: job.attempts + 1, last_error: (e as Error).message })
              .eq("id", job.id);
          }
        }
        return Response.json({ ok: true, processed });
      },
    },
  },
});

function renderJob(job: any): { title: string; body: string; link: string; event: string } {
  switch (job.kind) {
    case "reminder_24h":
      return { title: "Lembrete de atendimento", body: "Você tem um atendimento amanhã.", link: "/app/consultas", event: "appointment_reminder" };
    case "review_request":
      return { title: "Como foi seu atendimento?", body: "Avalie seu profissional e ajude outros pacientes.", link: "/app/consultas", event: "review_request" };
    case "retention_90d":
      return { title: "Está na hora do retorno?", body: "Faz 90 dias do seu último atendimento. Que tal agendar um retorno?", link: "/app/buscar", event: "retention_campaign" };
    default:
      return { title: "Aviso", body: "", link: "/app", event: "appointment_reminder" };
  }
}
