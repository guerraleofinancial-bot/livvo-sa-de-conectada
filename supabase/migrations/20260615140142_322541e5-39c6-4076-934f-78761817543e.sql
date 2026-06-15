
-- Allow company-owned CRM contacts without a specific professional
ALTER TABLE public.crm_contacts ALTER COLUMN professional_id DROP NOT NULL;

ALTER TABLE public.crm_contacts DROP CONSTRAINT IF EXISTS crm_contacts_scope_check;
ALTER TABLE public.crm_contacts ADD CONSTRAINT crm_contacts_scope_check
  CHECK (professional_id IS NOT NULL OR company_id IS NOT NULL);

-- Allow the responsible professional to see company contacts assigned to them
DROP POLICY IF EXISTS "crm_contacts responsible" ON public.crm_contacts;
CREATE POLICY "crm_contacts responsible" ON public.crm_contacts
  FOR ALL TO authenticated
  USING (responsible_user_id = auth.uid())
  WITH CHECK (responsible_user_id = auth.uid());
