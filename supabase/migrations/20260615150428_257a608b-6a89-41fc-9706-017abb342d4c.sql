
-- 1) Tornar appointment_id e patient_id opcionais (cobrança pode nascer sem consulta e para contato não-cadastrado)
ALTER TABLE public.payments ALTER COLUMN appointment_id DROP NOT NULL;
ALTER TABLE public.payments ALTER COLUMN patient_id DROP NOT NULL;

-- 2) Novos campos de cobrança
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS crm_contact_id uuid REFERENCES public.crm_contacts(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS quote_id uuid REFERENCES public.quotes(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS due_date date;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS public_token text;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS sent_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS viewed_at timestamptz;
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS commission_percent numeric(5,2);

CREATE UNIQUE INDEX IF NOT EXISTS payments_public_token_uidx ON public.payments(public_token) WHERE public_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS payments_recipient_idx ON public.payments(recipient_id);
CREATE INDEX IF NOT EXISTS payments_crm_contact_idx ON public.payments(crm_contact_id);

-- 3) Garantir GRANTs (idempotente)
GRANT SELECT, INSERT, UPDATE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;

-- 4) Atualizar RLS: dropar policies antigas e recriar abrangendo recipient_id e crm_contact_id
DROP POLICY IF EXISTS "payments self read" ON public.payments;
DROP POLICY IF EXISTS "payments patient insert" ON public.payments;

CREATE POLICY "payments read" ON public.payments
FOR SELECT TO authenticated
USING (
  auth.uid() = patient_id
  OR auth.uid() = recipient_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (appointment_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = payments.appointment_id AND a.professional_id = auth.uid()
  ))
  OR (company_id IS NOT NULL AND public.is_company_staff(auth.uid(), company_id))
);

-- Profissional/admin/empresa cria cobrança em nome de paciente ou contato do CRM
CREATE POLICY "payments insert by provider" ON public.payments
FOR INSERT TO authenticated
WITH CHECK (
  auth.uid() = recipient_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (company_id IS NOT NULL AND public.is_company_staff(auth.uid(), company_id))
);

-- Paciente ainda pode inserir o próprio pagamento (fluxo existente)
CREATE POLICY "payments insert by patient" ON public.payments
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = patient_id);

-- Profissional/empresa pode atualizar (marcar cancelada, etc.)
CREATE POLICY "payments update by provider" ON public.payments
FOR UPDATE TO authenticated
USING (
  auth.uid() = recipient_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (company_id IS NOT NULL AND public.is_company_staff(auth.uid(), company_id))
)
WITH CHECK (
  auth.uid() = recipient_id
  OR public.has_role(auth.uid(), 'admin'::public.app_role)
  OR (company_id IS NOT NULL AND public.is_company_staff(auth.uid(), company_id))
);

-- 5) Eventos de cobrança (auditoria leve)
CREATE TABLE IF NOT EXISTS public.charge_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_id uuid NOT NULL REFERENCES public.payments(id) ON DELETE CASCADE,
  event text NOT NULL,
  actor_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.charge_events TO authenticated;
GRANT ALL ON public.charge_events TO service_role;

ALTER TABLE public.charge_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "charge_events read" ON public.charge_events
FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.payments p
  WHERE p.id = charge_events.payment_id
    AND (
      auth.uid() = p.patient_id
      OR auth.uid() = p.recipient_id
      OR public.has_role(auth.uid(), 'admin'::public.app_role)
      OR (p.company_id IS NOT NULL AND public.is_company_staff(auth.uid(), p.company_id))
    )
));

CREATE POLICY "charge_events insert" ON public.charge_events
FOR INSERT TO authenticated
WITH CHECK (true);

CREATE INDEX IF NOT EXISTS charge_events_payment_idx ON public.charge_events(payment_id);

-- 6) Adiciona evento de notificação dedicado a cobrança (idempotente)
ALTER TYPE public.notification_event ADD VALUE IF NOT EXISTS 'charge_sent';
ALTER TYPE public.notification_event ADD VALUE IF NOT EXISTS 'charge_paid';
