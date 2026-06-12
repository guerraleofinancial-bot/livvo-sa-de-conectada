
REVOKE SELECT ON public.companies FROM anon;
DROP POLICY IF EXISTS "companies public approved read" ON public.companies;
CREATE POLICY "companies authenticated approved read" ON public.companies
  FOR SELECT TO authenticated USING (status = 'aprovado' OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

REVOKE SELECT ON public.coupons FROM anon;
DROP POLICY IF EXISTS "cou_read_active" ON public.coupons;
CREATE POLICY "cou_read_active_auth" ON public.coupons
  FOR SELECT TO authenticated USING (active = true OR public.has_role(auth.uid(),'admin'));

REVOKE SELECT ON public.platform_settings FROM anon;
DROP POLICY IF EXISTS "settings public read" ON public.platform_settings;
CREATE POLICY "settings authenticated read" ON public.platform_settings
  FOR SELECT TO authenticated USING (true);

REVOKE SELECT ON public.professionals FROM anon;
DROP POLICY IF EXISTS "prof public approved read" ON public.professionals;
CREATE POLICY "prof authenticated approved read" ON public.professionals
  FOR SELECT TO authenticated USING (status = 'aprovado' OR id = auth.uid() OR public.has_role(auth.uid(),'admin'));

REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_updated_at_column() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.recompute_professional_rating() FROM PUBLIC, anon, authenticated;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_company_owner(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.effective_commission_percent(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.effective_cancellation_policy(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.wallet_balance(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.wallet_releasable(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.nearby_units(numeric, numeric, numeric) FROM PUBLIC, anon;
