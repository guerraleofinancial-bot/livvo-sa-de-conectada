
-- 1. Cutoff timestamp on platform_settings
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS single_role_enforced_at TIMESTAMPTZ NOT NULL DEFAULT now();

-- 2. Exception flag on profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS role_exception BOOLEAN NOT NULL DEFAULT false;

-- 3. Enforce single-role trigger
CREATE OR REPLACE FUNCTION public.enforce_single_role()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _cutoff TIMESTAMPTZ;
  _created TIMESTAMPTZ;
  _exception BOOLEAN;
  _existing_count INT;
BEGIN
  -- Admin role is orthogonal (staff), never blocked
  IF NEW.role = 'admin'::public.app_role THEN
    RETURN NEW;
  END IF;

  SELECT single_role_enforced_at INTO _cutoff FROM public.platform_settings WHERE id = 1;
  SELECT created_at, role_exception INTO _created, _exception FROM public.profiles WHERE id = NEW.user_id;

  -- Grandfather: account existed before cutoff, OR marked as exception, OR no profile yet (edge case)
  IF _created IS NULL OR _created < COALESCE(_cutoff, now()) OR COALESCE(_exception, false) THEN
    RETURN NEW;
  END IF;

  -- Count existing non-admin roles for this user (excluding same row on conflict-do-nothing scenarios)
  SELECT COUNT(*) INTO _existing_count
    FROM public.user_roles
   WHERE user_id = NEW.user_id
     AND role <> 'admin'::public.app_role
     AND role <> NEW.role;

  IF _existing_count > 0 THEN
    RAISE EXCEPTION 'Uma conta só pode ter um tipo de identidade (paciente, profissional ou empresa). Crie uma nova conta com outro e-mail para o papel adicional.'
      USING ERRCODE = 'check_violation';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_single_role ON public.user_roles;
CREATE TRIGGER trg_enforce_single_role
  BEFORE INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_role();

-- 4. Admin view of multi-role accounts
CREATE OR REPLACE FUNCTION public.admin_multi_role_accounts()
RETURNS TABLE(
  user_id UUID,
  email TEXT,
  full_name TEXT,
  roles public.app_role[],
  created_at TIMESTAMPTZ,
  last_sign_in_at TIMESTAMPTZ,
  role_exception BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    ur.user_id,
    u.email::text,
    p.full_name,
    array_agg(ur.role ORDER BY ur.role) AS roles,
    p.created_at,
    u.last_sign_in_at,
    COALESCE(p.role_exception, false)
  FROM public.user_roles ur
  JOIN auth.users u ON u.id = ur.user_id
  LEFT JOIN public.profiles p ON p.id = ur.user_id
  WHERE public.has_role(auth.uid(), 'admin'::public.app_role)
  GROUP BY ur.user_id, u.email, p.full_name, p.created_at, u.last_sign_in_at, p.role_exception
  HAVING COUNT(*) FILTER (WHERE ur.role <> 'admin'::public.app_role) > 1;
$$;

GRANT EXECUTE ON FUNCTION public.admin_multi_role_accounts() TO authenticated;

-- 5. Admin helper: toggle exception flag
CREATE OR REPLACE FUNCTION public.admin_set_role_exception(_user_id UUID, _flag BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.profiles SET role_exception = _flag, updated_at = now() WHERE id = _user_id;
  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_set_role_exception(UUID, BOOLEAN) TO authenticated;
