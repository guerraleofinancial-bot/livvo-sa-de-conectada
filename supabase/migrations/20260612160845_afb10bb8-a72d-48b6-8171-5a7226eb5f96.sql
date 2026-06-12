-- 1) Odonto + orofacial specialties
INSERT INTO public.specialties (slug, name, icon, active) VALUES
  ('ortodontia','Ortodontia','smile',true),
  ('implantodontia','Implantodontia','smile',true),
  ('endodontia','Endodontia','smile',true),
  ('periodontia','Periodontia','smile',true),
  ('cirurgia-bucomaxilofacial','Cirurgia Bucomaxilofacial','smile',true),
  ('odontopediatria','Odontopediatria','baby',true),
  ('protese-dentaria','Prótese Dentária','smile',true),
  ('radiologia-odontologica','Radiologia Odontológica','scan',true),
  ('clinico-geral-odontologico','Clínico Geral Odontológico','smile',true),
  ('harmonizacao-orofacial','Harmonização Orofacial','sparkles',true),
  ('estetica-facial','Estética Facial','sparkles',true)
ON CONFLICT (slug) DO NOTHING;

-- 2) Categorias para o marketplace de saúde bucal e facial
INSERT INTO public.categories (slug, name, icon, active, sort_order) VALUES
  ('odontologia-geral','Odontologia Geral','smile',true,40),
  ('estetica-facial','Estética Facial','sparkles',true,41),
  ('pacote-odontologico','Pacotes Odontológicos','package',true,42)
ON CONFLICT (slug) DO NOTHING;

-- 3) Gateway-ready payments
ALTER TABLE public.payments
  ADD COLUMN IF NOT EXISTS gateway TEXT NOT NULL DEFAULT 'mock',
  ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT,
  ADD COLUMN IF NOT EXISTS gateway_payment_id TEXT,
  ADD COLUMN IF NOT EXISTS payment_method TEXT,
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(12,2),
  ADD COLUMN IF NOT EXISTS recipient_id UUID,
  ADD COLUMN IF NOT EXISTS payout_status TEXT NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS refund_status TEXT,
  ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS webhook_payload JSONB,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT now();

CREATE INDEX IF NOT EXISTS payments_gateway_tx_idx ON public.payments(gateway, gateway_transaction_id);

DROP TRIGGER IF EXISTS payments_set_updated_at ON public.payments;
CREATE TRIGGER payments_set_updated_at BEFORE UPDATE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4) Gateway no appointment
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS gateway TEXT,
  ADD COLUMN IF NOT EXISTS gateway_transaction_id TEXT;

-- 5) Inbound webhook log
CREATE TABLE IF NOT EXISTS public.payment_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gateway TEXT NOT NULL,
  event_type TEXT,
  signature TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT ON public.payment_webhook_events TO authenticated;
GRANT ALL ON public.payment_webhook_events TO service_role;

ALTER TABLE public.payment_webhook_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins podem ler webhooks" ON public.payment_webhook_events;
CREATE POLICY "Admins podem ler webhooks" ON public.payment_webhook_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));