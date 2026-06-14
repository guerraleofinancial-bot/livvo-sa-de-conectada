
-- 1) crm_contacts table
CREATE TABLE public.crm_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  responsible_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name text NOT NULL,
  phone text NOT NULL,
  whatsapp text,
  email text,
  city text,
  date_of_birth date,
  sex text,
  notes text,
  insurance text,
  origin public.patient_origin NOT NULL DEFAULT 'cadastro_direto',
  origin_detail text,
  source text NOT NULL DEFAULT 'manual', -- manual | import_csv | import_xlsx
  claimed_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  claimed_at timestamptz,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_crm_contacts_pro ON public.crm_contacts(professional_id);
CREATE INDEX idx_crm_contacts_company ON public.crm_contacts(company_id);
CREATE INDEX idx_crm_contacts_phone ON public.crm_contacts(phone);
CREATE INDEX idx_crm_contacts_email ON public.crm_contacts(email);
CREATE INDEX idx_crm_contacts_claimed ON public.crm_contacts(claimed_user_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_contacts TO authenticated;
GRANT ALL ON public.crm_contacts TO service_role;

ALTER TABLE public.crm_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "crm_contacts pro manage" ON public.crm_contacts
  FOR ALL TO authenticated
  USING (professional_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (professional_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "crm_contacts company staff" ON public.crm_contacts
  FOR ALL TO authenticated
  USING (company_id IS NOT NULL AND public.is_company_staff(auth.uid(), company_id))
  WITH CHECK (company_id IS NOT NULL AND public.is_company_staff(auth.uid(), company_id));

CREATE TRIGGER trg_crm_contacts_updated BEFORE UPDATE ON public.crm_contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 2) Drop auth.users FK on patient_id (allow contact UUIDs)
ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_patient_id_fkey;
ALTER TABLE public.quotes DROP CONSTRAINT IF EXISTS quotes_patient_id_fkey;
ALTER TABLE public.crm_patient_relationships DROP CONSTRAINT IF EXISTS crm_patient_relationships_patient_id_fkey;

-- 3) notify_user becomes safe for non-auth IDs (manual contacts)
CREATE OR REPLACE FUNCTION public.notify_user(_user_id uuid, _event notification_event, _title text, _body text, _link text DEFAULT NULL::text, _metadata jsonb DEFAULT '{}'::jsonb)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _id uuid; _muted boolean;
BEGIN
  IF _user_id IS NULL THEN RETURN NULL; END IF;
  -- skip silently if not an authenticated user (manual contact)
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = _user_id) THEN RETURN NULL; END IF;
  SELECT _event = ANY(events_muted) INTO _muted FROM public.notification_preferences WHERE user_id = _user_id;
  IF COALESCE(_muted,false) THEN RETURN NULL; END IF;
  INSERT INTO public.notifications(user_id, title, body, link, event, metadata)
  VALUES (_user_id, _title, _body, _link, _event, _metadata)
  RETURNING id INTO _id;
  RETURN _id;
END $function$;

-- 4) Claim helper: when a user signs up, link their account to matching manual contacts
CREATE OR REPLACE FUNCTION public.claim_contact_match(_user uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _phone text; _email text; _count integer := 0; _c record;
BEGIN
  SELECT phone, email INTO _phone, _email FROM public.profiles WHERE id = _user;
  IF _phone IS NULL AND _email IS NULL THEN RETURN 0; END IF;

  FOR _c IN
    SELECT * FROM public.crm_contacts
    WHERE claimed_user_id IS NULL
      AND (
        (_phone IS NOT NULL AND (phone = _phone OR whatsapp = _phone))
        OR (_email IS NOT NULL AND email = _email)
      )
  LOOP
    -- Reassign historical rows from contact UUID to the user's UUID
    UPDATE public.appointments SET patient_id = _user WHERE patient_id = _c.id;
    UPDATE public.quotes SET patient_id = _user WHERE patient_id = _c.id;

    -- Merge CRM relationship row (avoid unique conflict)
    IF EXISTS (SELECT 1 FROM public.crm_patient_relationships WHERE professional_id = _c.professional_id AND patient_id = _user) THEN
      DELETE FROM public.crm_patient_relationships WHERE professional_id = _c.professional_id AND patient_id = _c.id;
    ELSE
      UPDATE public.crm_patient_relationships SET patient_id = _user WHERE professional_id = _c.professional_id AND patient_id = _c.id;
    END IF;

    UPDATE public.crm_contacts SET claimed_user_id = _user, claimed_at = now(), updated_at = now() WHERE id = _c.id;
    _count := _count + 1;
  END LOOP;

  RETURN _count;
END $$;
