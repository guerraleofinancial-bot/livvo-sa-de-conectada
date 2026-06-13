import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const EventEnum = z.enum([
  "appointment_created","appointment_confirmed","appointment_cancelled","appointment_rescheduled",
  "new_message","new_review","appointment_reminder","review_request","retention_campaign",
]);

export const listNotifications = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("notifications").select("*")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false }).limit(50);
    if (error) throw error;
    return data ?? [];
  });

export const markNotificationsRead = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { ids?: string[] }) => z.object({ ids: z.array(z.string().uuid()).optional() }).parse(d))
  .handler(async ({ data, context }) => {
    let q = context.supabase.from("notifications").update({ read_at: new Date().toISOString() })
      .eq("user_id", context.userId).is("read_at", null);
    if (data.ids && data.ids.length) q = q.in("id", data.ids);
    const { error } = await q;
    if (error) throw error;
    return { ok: true };
  });

export const getNotificationPreferences = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data } = await context.supabase.from("notification_preferences")
      .select("*").eq("user_id", context.userId).maybeSingle();
    return data ?? { user_id: context.userId, in_app: true, email: false, whatsapp: false, events_muted: [], whatsapp_phone: null };
  });

export const upsertNotificationPreferences = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { in_app: boolean; email: boolean; whatsapp: boolean; events_muted: string[]; whatsapp_phone?: string | null }) =>
    z.object({
      in_app: z.boolean(),
      email: z.boolean(),
      whatsapp: z.boolean(),
      events_muted: z.array(EventEnum),
      whatsapp_phone: z.string().trim().max(32).nullable().optional(),
    }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase.from("notification_preferences").upsert({
      user_id: context.userId, ...data,
    });
    if (error) throw error;
    return { ok: true };
  });
