
-- Auto-approve new professionals (TEST MODE)
CREATE OR REPLACE FUNCTION public.auto_approve_professional()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.status := 'aprovado';
  NEW.approved_at := COALESCE(NEW.approved_at, now());
  NEW.council_verified_at := COALESCE(NEW.council_verified_at, now());
  NEW.documents_expire_at := COALESCE(NEW.documents_expire_at, now() + INTERVAL '2 years');
  NEW.zero_commission_start := COALESCE(NEW.zero_commission_start, now());
  NEW.zero_commission_end := COALESCE(NEW.zero_commission_end, now() + INTERVAL '90 days');
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_approve_professional ON public.professionals;
CREATE TRIGGER trg_auto_approve_professional
  BEFORE INSERT ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_professional();

-- Auto-approve new companies (TEST MODE)
CREATE OR REPLACE FUNCTION public.auto_approve_company()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.status := 'aprovado';
  NEW.approved_at := COALESCE(NEW.approved_at, now());
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_auto_approve_company ON public.companies;
CREATE TRIGGER trg_auto_approve_company
  BEFORE INSERT ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.auto_approve_company();

-- Approve existing pending records
UPDATE public.professionals SET
  status = 'aprovado',
  approved_at = COALESCE(approved_at, now()),
  council_verified_at = COALESCE(council_verified_at, now()),
  documents_expire_at = COALESCE(documents_expire_at, now() + INTERVAL '2 years'),
  zero_commission_start = COALESCE(zero_commission_start, now()),
  zero_commission_end = COALESCE(zero_commission_end, now() + INTERVAL '90 days')
WHERE status <> 'aprovado';

UPDATE public.companies SET
  status = 'aprovado',
  approved_at = COALESCE(approved_at, now())
WHERE status <> 'aprovado';
