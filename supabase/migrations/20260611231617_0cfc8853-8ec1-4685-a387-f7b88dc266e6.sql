
-- =========================================================
-- LIVVO V2: STRUCTURAL EXPANSION
-- =========================================================

-- ENUMS
DO $$ BEGIN
  CREATE TYPE public.service_type AS ENUM ('consulta','exame','procedimento','pacote');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.resource_kind AS ENUM ('sala','equipamento_ultrassom','equipamento_tomografia','equipamento_laser','sala_coleta','outro');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.financial_status AS ENUM ('agendado','pago','realizado','liberado_repasse','repassado','reembolsado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.coupon_type AS ENUM ('percent','fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payout_batch_status AS ENUM ('pendente','pago','cancelado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- =========================================================
-- 1) cancellation_policies (referenciada por outras tabelas)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.cancellation_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  hours_before_full_refund INT NOT NULL DEFAULT 24,
  hours_before_partial_refund INT NOT NULL DEFAULT 4,
  partial_refund_percent NUMERIC(5,2) NOT NULL DEFAULT 50,
  non_refundable_after_confirmation BOOLEAN NOT NULL DEFAULT FALSE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cancellation_policies TO authenticated, anon;
GRANT ALL ON public.cancellation_policies TO service_role;
ALTER TABLE public.cancellation_policies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cp_read_all" ON public.cancellation_policies FOR SELECT USING (true);
CREATE POLICY "cp_admin_write" ON public.cancellation_policies FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER cp_updated_at BEFORE UPDATE ON public.cancellation_policies FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.cancellation_policies (name, hours_before_full_refund, hours_before_partial_refund, partial_refund_percent, is_default)
VALUES ('Padrão Livvo', 24, 4, 50, true)
ON CONFLICT DO NOTHING;

-- =========================================================
-- 2) ALTER existing tables
-- =========================================================
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS commission_percent_override NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS cancellation_policy_id UUID REFERENCES public.cancellation_policies(id),
  ADD COLUMN IF NOT EXISTS default_country TEXT NOT NULL DEFAULT 'BR';

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS commission_percent_override NUMERIC(5,2),
  ADD COLUMN IF NOT EXISTS cancellation_policy_id UUID REFERENCES public.cancellation_policies(id),
  ADD COLUMN IF NOT EXISTS latitude NUMERIC(10,7),
  ADD COLUMN IF NOT EXISTS longitude NUMERIC(10,7);

ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS type public.service_type NOT NULL DEFAULT 'consulta',
  ADD COLUMN IF NOT EXISTS requires_resource_kind public.resource_kind,
  ADD COLUMN IF NOT EXISTS unit_scope TEXT NOT NULL DEFAULT 'any';

ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS release_after_days INT NOT NULL DEFAULT 2,
  ADD COLUMN IF NOT EXISTS default_cancellation_policy_id UUID REFERENCES public.cancellation_policies(id);

UPDATE public.platform_settings SET default_cancellation_policy_id = (SELECT id FROM public.cancellation_policies WHERE is_default LIMIT 1) WHERE default_cancellation_policy_id IS NULL;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS unit_id UUID,
  ADD COLUMN IF NOT EXISTS resource_id UUID,
  ADD COLUMN IF NOT EXISTS package_purchase_id UUID,
  ADD COLUMN IF NOT EXISTS coupon_code TEXT,
  ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS financial_status public.financial_status NOT NULL DEFAULT 'agendado',
  ADD COLUMN IF NOT EXISTS released_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS payout_item_id UUID;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'publicada';

-- =========================================================
-- 3) company_units
-- =========================================================
CREATE TABLE IF NOT EXISTS public.company_units (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  address_street TEXT,
  address_number TEXT,
  address_district TEXT,
  address_city TEXT,
  address_state TEXT,
  address_zip TEXT,
  country TEXT NOT NULL DEFAULT 'BR',
  latitude NUMERIC(10,7),
  longitude NUMERIC(10,7),
  phone TEXT,
  business_hours JSONB NOT NULL DEFAULT '{}'::JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.company_units TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.company_units TO authenticated;
GRANT ALL ON public.company_units TO service_role;
ALTER TABLE public.company_units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "units_read_all" ON public.company_units FOR SELECT USING (true);
CREATE POLICY "units_owner_write" ON public.company_units FOR ALL TO authenticated
  USING (public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER units_updated_at BEFORE UPDATE ON public.company_units FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_units_company ON public.company_units(company_id);
CREATE INDEX IF NOT EXISTS idx_units_city ON public.company_units(address_state, address_city);

ALTER TABLE public.appointments
  ADD CONSTRAINT fk_appt_unit FOREIGN KEY (unit_id) REFERENCES public.company_units(id) ON DELETE SET NULL;

ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS default_unit_id UUID REFERENCES public.company_units(id) ON DELETE SET NULL;

-- =========================================================
-- 4) resources
-- =========================================================
CREATE TABLE IF NOT EXISTS public.resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id UUID NOT NULL REFERENCES public.company_units(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  kind public.resource_kind NOT NULL DEFAULT 'sala',
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.resources TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.resources TO authenticated;
GRANT ALL ON public.resources TO service_role;
ALTER TABLE public.resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "res_read_all" ON public.resources FOR SELECT USING (true);
CREATE POLICY "res_owner_write" ON public.resources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.company_units u WHERE u.id = unit_id AND public.is_company_owner(auth.uid(), u.company_id)))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.company_units u WHERE u.id = unit_id AND public.is_company_owner(auth.uid(), u.company_id)));
CREATE TRIGGER res_updated_at BEFORE UPDATE ON public.resources FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.appointments
  ADD CONSTRAINT fk_appt_resource FOREIGN KEY (resource_id) REFERENCES public.resources(id) ON DELETE SET NULL;

-- =========================================================
-- 5) service_resources (N:N)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.service_resources (
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  PRIMARY KEY (service_id, resource_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_resources TO anon, authenticated;
GRANT INSERT, DELETE ON public.service_resources TO authenticated;
GRANT ALL ON public.service_resources TO service_role;
ALTER TABLE public.service_resources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sr_read_all" ON public.service_resources FOR SELECT USING (true);
CREATE POLICY "sr_admin_write" ON public.service_resources FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND (s.professional_id = auth.uid() OR (s.company_id IS NOT NULL AND public.is_company_owner(auth.uid(), s.company_id)))))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND (s.professional_id = auth.uid() OR (s.company_id IS NOT NULL AND public.is_company_owner(auth.uid(), s.company_id)))));

-- =========================================================
-- 6) unit_professionals
-- =========================================================
CREATE TABLE IF NOT EXISTS public.unit_professionals (
  unit_id UUID NOT NULL REFERENCES public.company_units(id) ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (unit_id, professional_id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.unit_professionals TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.unit_professionals TO authenticated;
GRANT ALL ON public.unit_professionals TO service_role;
ALTER TABLE public.unit_professionals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "up_read_all" ON public.unit_professionals FOR SELECT USING (true);
CREATE POLICY "up_owner_write" ON public.unit_professionals FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.company_units u WHERE u.id = unit_id AND public.is_company_owner(auth.uid(), u.company_id)))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.company_units u WHERE u.id = unit_id AND public.is_company_owner(auth.uid(), u.company_id)));

-- =========================================================
-- 7) resource_blocked_slots
-- =========================================================
CREATE TABLE IF NOT EXISTS public.resource_blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.resources(id) ON DELETE CASCADE,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.resource_blocked_slots TO authenticated;
GRANT ALL ON public.resource_blocked_slots TO service_role;
ALTER TABLE public.resource_blocked_slots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "rbs_read_all" ON public.resource_blocked_slots FOR SELECT TO authenticated USING (true);
CREATE POLICY "rbs_owner_write" ON public.resource_blocked_slots FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.resources r JOIN public.company_units u ON u.id = r.unit_id WHERE r.id = resource_id AND public.is_company_owner(auth.uid(), u.company_id)))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.resources r JOIN public.company_units u ON u.id = r.unit_id WHERE r.id = resource_id AND public.is_company_owner(auth.uid(), u.company_id)));

-- =========================================================
-- 8) service_packages (1:1 com services do tipo pacote)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.service_packages (
  service_id UUID PRIMARY KEY REFERENCES public.services(id) ON DELETE CASCADE,
  sessions_total INT NOT NULL,
  validity_days INT NOT NULL DEFAULT 365,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.service_packages TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.service_packages TO authenticated;
GRANT ALL ON public.service_packages TO service_role;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sp_read_all" ON public.service_packages FOR SELECT USING (true);
CREATE POLICY "sp_owner_write" ON public.service_packages FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND (s.professional_id = auth.uid() OR (s.company_id IS NOT NULL AND public.is_company_owner(auth.uid(), s.company_id)))))
  WITH CHECK (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.services s WHERE s.id = service_id AND (s.professional_id = auth.uid() OR (s.company_id IS NOT NULL AND public.is_company_owner(auth.uid(), s.company_id)))));
CREATE TRIGGER sp_updated_at BEFORE UPDATE ON public.service_packages FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 9) package_purchases + package_sessions
-- =========================================================
CREATE TABLE IF NOT EXISTS public.package_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.services(id),
  professional_id UUID REFERENCES public.professionals(id),
  company_id UUID REFERENCES public.companies(id),
  sessions_total INT NOT NULL,
  sessions_used INT NOT NULL DEFAULT 0,
  amount_paid NUMERIC(10,2) NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.package_purchases TO authenticated;
GRANT ALL ON public.package_purchases TO service_role;
ALTER TABLE public.package_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pp_read_own" ON public.package_purchases FOR SELECT TO authenticated USING (patient_id = auth.uid() OR professional_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "pp_admin_write" ON public.package_purchases FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.appointments ADD CONSTRAINT fk_appt_package FOREIGN KEY (package_purchase_id) REFERENCES public.package_purchases(id) ON DELETE SET NULL;

-- =========================================================
-- 10) coupons + redemptions
-- =========================================================
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  description TEXT,
  type public.coupon_type NOT NULL DEFAULT 'percent',
  value NUMERIC(10,2) NOT NULL,
  min_amount NUMERIC(10,2) DEFAULT 0,
  max_uses INT,
  uses_count INT NOT NULL DEFAULT 0,
  valid_from TIMESTAMPTZ,
  valid_until TIMESTAMPTZ,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  service_id UUID REFERENCES public.services(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  campaign_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.coupons TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.coupons TO authenticated;
GRANT ALL ON public.coupons TO service_role;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cou_read_active" ON public.coupons FOR SELECT USING (active = true);
CREATE POLICY "cou_admin_write" ON public.coupons FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER cou_updated_at BEFORE UPDATE ON public.coupons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coupon_id UUID NOT NULL REFERENCES public.coupons(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount_discounted NUMERIC(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.coupon_redemptions TO authenticated;
GRANT ALL ON public.coupon_redemptions TO service_role;
ALTER TABLE public.coupon_redemptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cr_read_own" ON public.coupon_redemptions FOR SELECT TO authenticated USING (patient_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "cr_admin_write" ON public.coupon_redemptions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- 11) campaigns
-- =========================================================
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  rules JSONB NOT NULL DEFAULT '{}'::JSONB,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.campaigns TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.campaigns TO authenticated;
GRANT ALL ON public.campaigns TO service_role;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cam_read_active" ON public.campaigns FOR SELECT USING (active = true);
CREATE POLICY "cam_admin_write" ON public.campaigns FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER cam_updated_at BEFORE UPDATE ON public.campaigns FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.coupons ADD CONSTRAINT fk_coupon_campaign FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- =========================================================
-- 12) cashback
-- =========================================================
CREATE TABLE IF NOT EXISTS public.cashback_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  percent NUMERIC(5,2) NOT NULL,
  min_amount NUMERIC(10,2) DEFAULT 0,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cashback_rules TO authenticated;
GRANT ALL ON public.cashback_rules TO service_role;
ALTER TABLE public.cashback_rules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbr_read_all" ON public.cashback_rules FOR SELECT TO authenticated USING (true);
CREATE POLICY "cbr_admin_write" ON public.cashback_rules FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.cashback_balances (
  patient_id UUID PRIMARY KEY,
  balance NUMERIC(10,2) NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cashback_balances TO authenticated;
GRANT ALL ON public.cashback_balances TO service_role;
ALTER TABLE public.cashback_balances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbb_read_own" ON public.cashback_balances FOR SELECT TO authenticated USING (patient_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.cashback_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  amount NUMERIC(10,2) NOT NULL,
  kind TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.cashback_transactions TO authenticated;
GRANT ALL ON public.cashback_transactions TO service_role;
ALTER TABLE public.cashback_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cbt_read_own" ON public.cashback_transactions FOR SELECT TO authenticated USING (patient_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- 13) payout_batches + payout_items
-- =========================================================
CREATE TABLE IF NOT EXISTS public.payout_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL,
  total_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  status public.payout_batch_status NOT NULL DEFAULT 'pendente',
  reference TEXT,
  paid_at TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payout_batches TO authenticated;
GRANT ALL ON public.payout_batches TO service_role;
ALTER TABLE public.payout_batches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pb_read_own" ON public.payout_batches FOR SELECT TO authenticated USING (provider_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "pb_admin_write" ON public.payout_batches FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER pb_updated_at BEFORE UPDATE ON public.payout_batches FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.payout_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES public.payout_batches(id) ON DELETE CASCADE,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id),
  amount NUMERIC(12,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.payout_items TO authenticated;
GRANT ALL ON public.payout_items TO service_role;
ALTER TABLE public.payout_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pi_read_own" ON public.payout_items FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR EXISTS (SELECT 1 FROM public.payout_batches b WHERE b.id = batch_id AND b.provider_id = auth.uid()));
CREATE POLICY "pi_admin_write" ON public.payout_items FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

ALTER TABLE public.appointments ADD CONSTRAINT fk_appt_payout_item FOREIGN KEY (payout_item_id) REFERENCES public.payout_items(id) ON DELETE SET NULL;

-- =========================================================
-- 14) provider_payout_accounts
-- =========================================================
CREATE TABLE IF NOT EXISTS public.provider_payout_accounts (
  provider_id UUID PRIMARY KEY,
  method TEXT NOT NULL DEFAULT 'pix',
  pix_key TEXT,
  bank_name TEXT,
  bank_agency TEXT,
  bank_account TEXT,
  bank_account_type TEXT,
  holder_name TEXT,
  holder_document TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.provider_payout_accounts TO authenticated;
GRANT ALL ON public.provider_payout_accounts TO service_role;
ALTER TABLE public.provider_payout_accounts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "ppa_self" ON public.provider_payout_accounts FOR ALL TO authenticated
  USING (provider_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (provider_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER ppa_updated_at BEFORE UPDATE ON public.provider_payout_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =========================================================
-- 15) FUNCTIONS
-- =========================================================
CREATE OR REPLACE FUNCTION public.effective_commission_percent(_professional UUID, _company UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(
    (SELECT commission_percent_override FROM public.professionals WHERE id = _professional),
    (SELECT commission_percent_override FROM public.companies WHERE id = _company),
    (SELECT commission_percent FROM public.platform_settings WHERE id = 1),
    15
  )::NUMERIC;
$$;

CREATE OR REPLACE FUNCTION public.effective_cancellation_policy(_professional UUID, _company UUID)
RETURNS public.cancellation_policies LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT cp.* FROM public.cancellation_policies cp
  WHERE cp.id = COALESCE(
    (SELECT cancellation_policy_id FROM public.professionals WHERE id = _professional),
    (SELECT cancellation_policy_id FROM public.companies WHERE id = _company),
    (SELECT default_cancellation_policy_id FROM public.platform_settings WHERE id = 1),
    (SELECT id FROM public.cancellation_policies WHERE is_default LIMIT 1)
  ) LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.wallet_releasable(_provider UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(net_amount), 0)::NUMERIC
  FROM public.appointments
  WHERE professional_id = _provider AND financial_status = 'liberado_repasse';
$$;

CREATE OR REPLACE FUNCTION public.nearby_units(_lat NUMERIC, _lng NUMERIC, _radius_km NUMERIC DEFAULT 25)
RETURNS TABLE(id UUID, company_id UUID, name TEXT, address_city TEXT, address_state TEXT, latitude NUMERIC, longitude NUMERIC, distance_km NUMERIC)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT u.id, u.company_id, u.name, u.address_city, u.address_state, u.latitude, u.longitude,
    (6371 * acos(
      LEAST(1, cos(radians(_lat)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians(_lng))
      + sin(radians(_lat)) * sin(radians(u.latitude)))
    ))::NUMERIC AS distance_km
  FROM public.company_units u
  WHERE u.active = true AND u.latitude IS NOT NULL AND u.longitude IS NOT NULL
    AND (6371 * acos(
      LEAST(1, cos(radians(_lat)) * cos(radians(u.latitude)) * cos(radians(u.longitude) - radians(_lng))
      + sin(radians(_lat)) * sin(radians(u.latitude)))
    )) <= _radius_km
  ORDER BY distance_km ASC;
$$;
