
-- 1) derive_crm_status: fix mutable search_path
CREATE OR REPLACE FUNCTION public.derive_crm_status(_status appointment_status, _scheduled_at timestamptz)
RETURNS crm_status
LANGUAGE sql IMMUTABLE
SET search_path = public
AS $$
  SELECT CASE
    WHEN _status='cancelada' THEN 'cancelado'::public.crm_status
    WHEN _status='realizada' THEN 'atendido'::public.crm_status
    WHEN _status='confirmada' THEN 'confirmada'::public.crm_status
    WHEN _status IN ('agendada','em_andamento') THEN 'agendado'::public.crm_status
    ELSE 'novo_lead'::public.crm_status
  END
$$;

-- 2) Revoke EXECUTE from anon on internal SECURITY DEFINER helpers
REVOKE EXECUTE ON FUNCTION public.notify_user(uuid, notification_event, text, text, text, jsonb) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.crm_appointment_sync() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_new_review() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.approve_professional(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.crm_set_status(uuid, crm_status, boolean) FROM PUBLIC, anon;

-- 3) automation_jobs: restrict reads to admins only (table is internal/queue)
DROP POLICY IF EXISTS "jobs pro read" ON public.automation_jobs;
CREATE POLICY "jobs admin read" ON public.automation_jobs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 4) provider-media storage: drop anon read, keep authenticated; signed URLs continue to work for public viewers
DROP POLICY IF EXISTS "provider-media read" ON storage.objects;
CREATE POLICY "provider-media authenticated read" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'provider-media');
