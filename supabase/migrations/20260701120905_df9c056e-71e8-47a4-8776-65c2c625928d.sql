
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS config jsonb NOT NULL DEFAULT '{}'::jsonb;

UPDATE public.platform_settings
SET config = COALESCE(config, '{}'::jsonb) || jsonb_build_object(
  'geral', COALESCE(config->'geral', jsonb_build_object(
    'brand_name', 'Livvo',
    'tagline', 'Sua saúde, mais perto de você.',
    'default_locale', 'pt-BR',
    'default_timezone', 'America/Sao_Paulo'
  )),
  'contatos', COALESCE(config->'contatos', jsonb_build_object(
    'support_email', 'contato@livvo.com.br',
    'support_phone', '',
    'support_whatsapp', ''
  )),
  'social', COALESCE(config->'social', jsonb_build_object(
    'instagram', '',
    'facebook', '',
    'linkedin', '',
    'youtube', '',
    'tiktok', ''
  )),
  'seo', COALESCE(config->'seo', jsonb_build_object(
    'meta_title', 'Livvo — Marketplace de Saúde',
    'meta_description', 'Encontre profissionais e clínicas de saúde perto de você.',
    'meta_keywords', 'saúde, marketplace, agendamento, clínicas, profissionais',
    'og_image_url', ''
  )),
  'financeiro', COALESCE(config->'financeiro', jsonb_build_object(
    'pix_key', '',
    'gateway', 'mock',
    'auto_release_days', 2,
    'min_payout_amount', 50
  )),
  'founders', COALESCE(config->'founders', jsonb_build_object(
    'active', true,
    'commission_percent', 0,
    'slots_total', 100,
    'slots_used', 0,
    'ends_at', null
  )),
  'seguranca', COALESCE(config->'seguranca', jsonb_build_object(
    'require_2fa_admin', false,
    'session_ttl_hours', 168,
    'lock_after_failed_attempts', 5
  ))
)
WHERE id = 1;

CREATE TABLE IF NOT EXISTS public.audit_logs (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  actor_id     uuid,
  actor_email  text,
  actor_role   text,
  event        text NOT NULL,
  module       text NOT NULL,
  entity_type  text,
  entity_id    text,
  description  text,
  before_data  jsonb,
  after_data   jsonb,
  ip_address   text,
  user_agent   text
);

GRANT SELECT ON public.audit_logs TO authenticated;
GRANT ALL    ON public.audit_logs TO service_role;

CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS audit_logs_event_idx      ON public.audit_logs (event);
CREATE INDEX IF NOT EXISTS audit_logs_module_idx     ON public.audit_logs (module);
CREATE INDEX IF NOT EXISTS audit_logs_actor_idx      ON public.audit_logs (actor_id);
CREATE INDEX IF NOT EXISTS audit_logs_entity_idx     ON public.audit_logs (entity_type, entity_id);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit admin read" ON public.audit_logs;
CREATE POLICY "audit admin read" ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));
