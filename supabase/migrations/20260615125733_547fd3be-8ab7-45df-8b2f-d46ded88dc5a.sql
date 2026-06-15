
-- C1: appointments — profissional ou staff de empresa (via unit) podem criar agendamento manual
DROP POLICY IF EXISTS "appt patient insert" ON public.appointments;
CREATE POLICY "appt insert by participants" ON public.appointments
  FOR INSERT TO authenticated
  WITH CHECK (
    auth.uid() = patient_id
    OR auth.uid() = professional_id
    OR (unit_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.company_units u
      WHERE u.id = appointments.unit_id
        AND public.is_company_staff(auth.uid(), u.company_id)
    ))
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
  );

-- C2: featured_subscriptions — contratação por profissional ou dono de empresa
CREATE POLICY "fs insert own" ON public.featured_subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (professional_id IS NOT NULL AND professional_id = auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_owner(auth.uid(), company_id))
  );

CREATE POLICY "fs update own" ON public.featured_subscriptions
  FOR UPDATE TO authenticated
  USING (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (professional_id IS NOT NULL AND professional_id = auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_owner(auth.uid(), company_id))
  )
  WITH CHECK (
    public.has_role(auth.uid(), 'admin'::public.app_role)
    OR (professional_id IS NOT NULL AND professional_id = auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_owner(auth.uid(), company_id))
  );

CREATE POLICY "fs delete admin" ON public.featured_subscriptions
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "fr write subscription owner" ON public.featured_regions
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.featured_subscriptions s
    WHERE s.id = featured_regions.subscription_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (s.professional_id IS NOT NULL AND s.professional_id = auth.uid())
        OR (s.company_id IS NOT NULL AND public.is_company_owner(auth.uid(), s.company_id))
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.featured_subscriptions s
    WHERE s.id = featured_regions.subscription_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (s.professional_id IS NOT NULL AND s.professional_id = auth.uid())
        OR (s.company_id IS NOT NULL AND public.is_company_owner(auth.uid(), s.company_id))
      )
  ));

CREATE POLICY "fcat write subscription owner" ON public.featured_categories
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.featured_subscriptions s
    WHERE s.id = featured_categories.subscription_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (s.professional_id IS NOT NULL AND s.professional_id = auth.uid())
        OR (s.company_id IS NOT NULL AND public.is_company_owner(auth.uid(), s.company_id))
      )
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.featured_subscriptions s
    WHERE s.id = featured_categories.subscription_id
      AND (
        public.has_role(auth.uid(), 'admin'::public.app_role)
        OR (s.professional_id IS NOT NULL AND s.professional_id = auth.uid())
        OR (s.company_id IS NOT NULL AND public.is_company_owner(auth.uid(), s.company_id))
      )
  ));

-- C4: profiles — leitura pública limitada para perfil público de profissional aprovado
DROP POLICY IF EXISTS "profiles self read" ON public.profiles;
CREATE POLICY "profiles read self or approved professional" ON public.profiles
  FOR SELECT TO authenticated
  USING (
    auth.uid() = id
    OR public.has_role(auth.uid(), 'admin'::public.app_role)
    OR EXISTS (
      SELECT 1 FROM public.professionals p
      WHERE p.id = profiles.id
        AND p.status = 'aprovado'
        AND p.council_verified_at IS NOT NULL
        AND (p.documents_expire_at IS NULL OR p.documents_expire_at > now())
    )
  );
