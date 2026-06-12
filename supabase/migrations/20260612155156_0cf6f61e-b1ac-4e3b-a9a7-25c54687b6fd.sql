
-- Extend professionals
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS display_name TEXT,
  ADD COLUMN IF NOT EXISTS cpf_cnpj TEXT,
  ADD COLUMN IF NOT EXISTS secondary_specialties UUID[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS years_experience INTEGER,
  ADD COLUMN IF NOT EXISTS academic_formation TEXT,
  ADD COLUMN IF NOT EXISTS postgrad TEXT,
  ADD COLUMN IF NOT EXISTS certifications TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS languages TEXT[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS whatsapp TEXT,
  ADD COLUMN IF NOT EXISTS professional_email TEXT,
  ADD COLUMN IF NOT EXISTS instagram TEXT,
  ADD COLUMN IF NOT EXISTS website TEXT,
  ADD COLUMN IF NOT EXISTS address_zip TEXT,
  ADD COLUMN IF NOT EXISTS address_number TEXT,
  ADD COLUMN IF NOT EXISTS address_complement TEXT,
  ADD COLUMN IF NOT EXISTS address_district TEXT,
  ADD COLUMN IF NOT EXISTS cover_url TEXT,
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS onboarding_step INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zero_commission_start TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS zero_commission_end TIMESTAMPTZ;

-- Document kinds & status enums
DO $$ BEGIN
  CREATE TYPE public.provider_document_kind AS ENUM ('documento_pessoal','registro','comprovante_endereco','documento_empresa');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.provider_document_status AS ENUM ('pendente','em_analise','aprovado','rejeitado');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Provider documents
CREATE TABLE IF NOT EXISTS public.professional_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  kind public.provider_document_kind NOT NULL,
  file_url TEXT NOT NULL,
  status public.provider_document_status NOT NULL DEFAULT 'pendente',
  reviewer_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_documents TO authenticated;
GRANT ALL ON public.professional_documents TO service_role;
ALTER TABLE public.professional_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "docs owner manage" ON public.professional_documents
  FOR ALL TO authenticated
  USING (auth.uid() = professional_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = professional_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_professional_documents_updated_at
  BEFORE UPDATE ON public.professional_documents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Business hours
CREATE TABLE IF NOT EXISTS public.professional_business_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  opens_at TIME,
  closes_at TIME,
  lunch_start TIME,
  lunch_end TIME,
  closed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (professional_id, weekday)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_business_hours TO authenticated;
GRANT SELECT ON public.professional_business_hours TO anon;
GRANT ALL ON public.professional_business_hours TO service_role;
ALTER TABLE public.professional_business_hours ENABLE ROW LEVEL SECURITY;
CREATE POLICY "hours public read" ON public.professional_business_hours
  FOR SELECT USING (true);
CREATE POLICY "hours owner manage" ON public.professional_business_hours
  FOR ALL TO authenticated
  USING (auth.uid() = professional_id OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (auth.uid() = professional_id OR public.has_role(auth.uid(),'admin'));
CREATE TRIGGER update_professional_business_hours_updated_at
  BEFORE UPDATE ON public.professional_business_hours
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Approve professional with 90d zero commission
CREATE OR REPLACE FUNCTION public.approve_professional(_id UUID)
RETURNS public.professionals
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  row public.professionals;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.professionals
    SET status='aprovado',
        approved_at = now(),
        approved_by = auth.uid(),
        zero_commission_start = COALESCE(zero_commission_start, now()),
        zero_commission_end = COALESCE(zero_commission_end, now() + INTERVAL '90 days')
    WHERE id = _id
    RETURNING * INTO row;
  RETURN row;
END;
$$;

-- Effective commission percent honors zero-commission window
CREATE OR REPLACE FUNCTION public.effective_commission_percent(_professional uuid, _company uuid)
RETURNS numeric
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN EXISTS (
      SELECT 1 FROM public.professionals
      WHERE id = _professional
        AND zero_commission_start IS NOT NULL
        AND zero_commission_end IS NOT NULL
        AND now() BETWEEN zero_commission_start AND zero_commission_end
    ) THEN 0::NUMERIC
    ELSE COALESCE(
      (SELECT commission_percent_override FROM public.professionals WHERE id = _professional),
      (SELECT commission_percent_override FROM public.companies WHERE id = _company),
      (SELECT commission_percent FROM public.platform_settings WHERE id = 1),
      15
    )::NUMERIC
  END;
$$;
