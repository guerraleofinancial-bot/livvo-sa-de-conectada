
-- ============== ENUMS ==============
DO $$ BEGIN
  CREATE TYPE public.company_type AS ENUM ('clinica','laboratorio','diagnostico','estetica','outros');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.company_role AS ENUM ('owner','admin','profissional');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.tx_kind AS ENUM ('credito','comissao','repasse','reembolso','ajuste');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.review_status AS ENUM ('publicada','oculta','denunciada');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.ticket_status AS ENUM ('aberto','em_andamento','resolvido','fechado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============== COMPANIES ==============
CREATE TABLE IF NOT EXISTS public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  legal_name TEXT NOT NULL,
  trade_name TEXT,
  cnpj TEXT,
  type public.company_type NOT NULL DEFAULT 'clinica',
  description TEXT,
  logo_url TEXT,
  phone TEXT,
  email TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  status public.professional_status NOT NULL DEFAULT 'pendente',
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.companies TO authenticated;
GRANT SELECT ON public.companies TO anon;
GRANT ALL ON public.companies TO service_role;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "companies public approved read" ON public.companies FOR SELECT
  USING (status = 'aprovado' OR auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "companies owner insert" ON public.companies FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = owner_id);
CREATE POLICY "companies owner/admin update" ON public.companies FOR UPDATE TO authenticated
  USING (auth.uid() = owner_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "companies admin delete" ON public.companies FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_companies_updated BEFORE UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== COMPANY MEMBERS ==============
CREATE TABLE IF NOT EXISTS public.company_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.company_role NOT NULL DEFAULT 'profissional',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (company_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.company_members TO authenticated;
GRANT ALL ON public.company_members TO service_role;
ALTER TABLE public.company_members ENABLE ROW LEVEL SECURITY;
CREATE OR REPLACE FUNCTION public.is_company_owner(_user UUID, _company UUID)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS (SELECT 1 FROM public.companies WHERE id = _company AND owner_id = _user);
$$;
CREATE POLICY "members read scoped" ON public.company_members FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "members owner manage" ON public.company_members FOR ALL TO authenticated
  USING (public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin'));

-- ============== CATEGORIES ==============
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  icon TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories public read" ON public.categories FOR SELECT USING (true);
CREATE POLICY "categories admin write" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.categories (slug, name, icon, sort_order) VALUES
  ('consulta','Consultas','stethoscope',1),
  ('exame','Exames','test-tube',2),
  ('procedimento','Procedimentos','syringe',3),
  ('estetica','Estética','sparkles',4),
  ('terapia','Terapias','brain',5),
  ('odontologia','Odontologia','smile',6),
  ('fisioterapia','Fisioterapia','activity',7)
ON CONFLICT (slug) DO NOTHING;

-- More specialties
INSERT INTO public.specialties (slug, name) VALUES
  ('odontologia','Odontologia'),
  ('fisioterapia','Fisioterapia'),
  ('estetica','Estética'),
  ('endocrinologia','Endocrinologia'),
  ('urologia','Urologia')
ON CONFLICT (slug) DO NOTHING;

-- ============== SERVICES ==============
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  category_id UUID REFERENCES public.categories(id),
  name TEXT NOT NULL,
  description TEXT,
  duration_minutes INT NOT NULL DEFAULT 30,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (professional_id IS NOT NULL OR company_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_services_prof ON public.services(professional_id);
CREATE INDEX IF NOT EXISTS idx_services_company ON public.services(company_id);
GRANT SELECT ON public.services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.services TO authenticated;
GRANT ALL ON public.services TO service_role;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "services public read" ON public.services FOR SELECT
  USING (active = true OR auth.uid() = professional_id OR public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "services owner manage" ON public.services FOR ALL TO authenticated
  USING (auth.uid() = professional_id OR public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = professional_id OR public.is_company_owner(auth.uid(), company_id) OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_services_updated BEFORE UPDATE ON public.services
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============== FAVORITES ==============
CREATE TABLE IF NOT EXISTS public.favorites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (professional_id IS NOT NULL OR company_id IS NOT NULL),
  UNIQUE (patient_id, professional_id),
  UNIQUE (patient_id, company_id)
);
GRANT SELECT, INSERT, DELETE ON public.favorites TO authenticated;
GRANT ALL ON public.favorites TO service_role;
ALTER TABLE public.favorites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fav self read" ON public.favorites FOR SELECT TO authenticated USING (auth.uid() = patient_id);
CREATE POLICY "fav self insert" ON public.favorites FOR INSERT TO authenticated WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "fav self delete" ON public.favorites FOR DELETE TO authenticated USING (auth.uid() = patient_id);

-- ============== PLATFORM SETTINGS ==============
CREATE TABLE IF NOT EXISTS public.platform_settings (
  id INT PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  commission_percent NUMERIC(5,2) NOT NULL DEFAULT 15.00,
  cancellation_window_hours INT NOT NULL DEFAULT 24,
  refund_policy TEXT NOT NULL DEFAULT 'Reembolso integral se cancelado com mais de 24h de antecedência.',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
GRANT SELECT ON public.platform_settings TO anon, authenticated;
GRANT ALL ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "settings public read" ON public.platform_settings FOR SELECT USING (true);
CREATE POLICY "settings admin write" ON public.platform_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
INSERT INTO public.platform_settings (id) VALUES (1) ON CONFLICT DO NOTHING;

-- ============== WALLET TRANSACTIONS ==============
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- profissional ou owner da empresa
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  payout_id UUID,
  kind public.tx_kind NOT NULL,
  amount NUMERIC(10,2) NOT NULL, -- positivo para crédito ao prestador; negativo para débito
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_wtx_provider ON public.wallet_transactions(provider_id);
CREATE INDEX IF NOT EXISTS idx_wtx_appt ON public.wallet_transactions(appointment_id);
GRANT SELECT ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "wtx self/admin read" ON public.wallet_transactions FOR SELECT TO authenticated
  USING (auth.uid() = provider_id OR public.has_role(auth.uid(),'admin'));

-- ============== PAYOUTS ==============
CREATE TABLE IF NOT EXISTS public.payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente', -- pendente, pago, cancelado
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id)
);
CREATE INDEX IF NOT EXISTS idx_payouts_provider ON public.payouts(provider_id);
GRANT SELECT ON public.payouts TO authenticated;
GRANT ALL ON public.payouts TO service_role;
ALTER TABLE public.payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "payouts self/admin read" ON public.payouts FOR SELECT TO authenticated
  USING (auth.uid() = provider_id OR public.has_role(auth.uid(),'admin'));

-- ============== SUPPORT TICKETS ==============
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  status public.ticket_status NOT NULL DEFAULT 'aberto',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.support_tickets TO authenticated;
GRANT ALL ON public.support_tickets TO service_role;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY "tickets self/admin read" ON public.support_tickets FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "tickets self insert" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "tickets admin update" ON public.support_tickets FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER trg_tickets_updated BEFORE UPDATE ON public.support_tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.support_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.support_messages TO authenticated;
GRANT ALL ON public.support_messages TO service_role;
ALTER TABLE public.support_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "smsg participants read" ON public.support_messages FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));
CREATE POLICY "smsg participants insert" ON public.support_messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (SELECT 1 FROM public.support_tickets t WHERE t.id = ticket_id AND (t.user_id = auth.uid() OR public.has_role(auth.uid(),'admin'))));

-- ============== ALTER EXISTING TABLES ==============
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS avatar_url TEXT,
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS service_id UUID REFERENCES public.services(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gross_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS commission_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS net_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'pendente',
  ADD COLUMN IF NOT EXISTS payment_method TEXT;

ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status public.review_status NOT NULL DEFAULT 'publicada';

-- Allow patient delete fav by appointment? Not needed.

-- ============== HELPER FUNCTIONS ==============
CREATE OR REPLACE FUNCTION public.wallet_balance(_provider UUID)
RETURNS NUMERIC LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE(SUM(amount),0)::NUMERIC FROM public.wallet_transactions WHERE provider_id = _provider;
$$;

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.appointments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
