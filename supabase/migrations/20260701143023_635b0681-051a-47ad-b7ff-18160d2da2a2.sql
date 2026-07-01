
CREATE OR REPLACE FUNCTION public.sync_account_status()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid; _new public.account_status; _cur public.account_status; _rec jsonb;
BEGIN
  _rec := to_jsonb(COALESCE(NEW, OLD));
  IF TG_TABLE_NAME = 'user_roles' THEN
    _uid := (_rec->>'user_id')::uuid;
  ELSIF TG_TABLE_NAME = 'professionals' THEN
    _uid := (_rec->>'id')::uuid;
  ELSIF TG_TABLE_NAME = 'companies' THEN
    _uid := (_rec->>'owner_id')::uuid;
  ELSIF TG_TABLE_NAME = 'profiles' THEN
    _uid := (_rec->>'id')::uuid;
  END IF;
  IF _uid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT account_status INTO _cur FROM public.profiles WHERE id=_uid;
  IF _cur IN ('suspenso','bloqueado') THEN RETURN COALESCE(NEW, OLD); END IF;

  _new := public.compute_account_status(_uid);
  IF _cur IS DISTINCT FROM _new THEN
    UPDATE public.profiles SET account_status=_new, updated_at=now() WHERE id=_uid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DO $$
DECLARE _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE LOWER(email)='briopopcomercio@gmail.com' LIMIT 1;
  IF _uid IS NULL THEN RETURN; END IF;

  DELETE FROM public.appointment_events WHERE appointment_id IN (SELECT id FROM public.appointments WHERE professional_id=_uid OR patient_id=_uid);
  DELETE FROM public.appointments WHERE professional_id=_uid OR patient_id=_uid;
  DELETE FROM public.quote_items WHERE quote_id IN (SELECT id FROM public.quotes WHERE professional_id=_uid OR assigned_user_id=_uid OR patient_id=_uid);
  DELETE FROM public.quotes WHERE professional_id=_uid OR assigned_user_id=_uid OR patient_id=_uid;
  DELETE FROM public.crm_patient_relationships WHERE professional_id=_uid OR patient_id=_uid;
  DELETE FROM public.crm_contacts WHERE professional_id=_uid OR claimed_user_id=_uid;
  DELETE FROM public.reviews WHERE professional_id=_uid OR patient_id=_uid;
  DELETE FROM public.favorites WHERE patient_id=_uid;
  DELETE FROM public.notifications WHERE user_id=_uid;
  DELETE FROM public.notification_preferences WHERE user_id=_uid;
  DELETE FROM public.wallet_transactions WHERE provider_id=_uid;
  DELETE FROM public.professional_business_hours WHERE professional_id=_uid;
  DELETE FROM public.professional_availability WHERE professional_id=_uid;
  DELETE FROM public.featured_subscriptions WHERE professional_id=_uid;
  DELETE FROM public.automation_jobs WHERE professional_id=_uid OR patient_id=_uid;
  DELETE FROM public.professionals WHERE id=_uid;

  DELETE FROM public.company_members WHERE user_id=_uid;
  DELETE FROM public.companies WHERE owner_id=_uid;

  DELETE FROM public.user_roles WHERE user_id=_uid;

  INSERT INTO public.admin_grants (user_id, level, notes)
  VALUES (_uid, 'super_admin', 'Super Admin fundador — Livvo')
  ON CONFLICT (user_id) DO UPDATE SET level='super_admin';

  UPDATE public.profiles SET account_status = NULL, status_reason = 'Conta exclusiva de Super Admin', updated_at = now() WHERE id=_uid;
END $$;
