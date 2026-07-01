
-- 1. Tabela de níveis administrativos (paralela ao user_roles funcional)
CREATE TABLE IF NOT EXISTS public.admin_grants (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  level TEXT NOT NULL CHECK (level IN ('admin','admin_master','super_admin')),
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT
);

GRANT SELECT ON public.admin_grants TO authenticated;
GRANT ALL ON public.admin_grants TO service_role;

ALTER TABLE public.admin_grants ENABLE ROW LEVEL SECURITY;

-- 2. Helpers
CREATE OR REPLACE FUNCTION public.is_super_admin(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.admin_grants WHERE user_id=_user AND level='super_admin')
$$;

CREATE OR REPLACE FUNCTION public.is_admin_master(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.admin_grants WHERE user_id=_user AND level IN ('admin_master','super_admin'))
$$;

CREATE OR REPLACE FUNCTION public.is_platform_admin(_user uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS(SELECT 1 FROM public.admin_grants WHERE user_id=_user)
      OR EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user AND role='admin')
$$;

-- Atualiza has_role: super_admin e admin_master satisfazem checagem de 'admin'
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
      OR (_role = 'admin'::public.app_role AND EXISTS (SELECT 1 FROM public.admin_grants WHERE user_id = _user_id))
$$;

-- Policies em admin_grants
DROP POLICY IF EXISTS "platform admins can view grants" ON public.admin_grants;
CREATE POLICY "platform admins can view grants" ON public.admin_grants
  FOR SELECT TO authenticated
  USING (public.is_platform_admin(auth.uid()));

DROP POLICY IF EXISTS "only super admin can manage grants" ON public.admin_grants;
CREATE POLICY "only super admin can manage grants" ON public.admin_grants
  FOR ALL TO authenticated
  USING (public.is_super_admin(auth.uid()))
  WITH CHECK (public.is_super_admin(auth.uid()));

-- 3. Remover auto-aprovação (profissional e empresa nascem pendentes)
DROP TRIGGER IF EXISTS trg_auto_approve_professional ON public.professionals;
DROP TRIGGER IF EXISTS trg_auto_approve_company ON public.companies;

-- 4. Novo user: cria profile + role + concede super_admin se for o e-mail fundador
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'paciente'));

  IF LOWER(NEW.email) = 'briopopcomercio@gmail.com' THEN
    INSERT INTO public.admin_grants (user_id, level, notes)
    VALUES (NEW.id, 'super_admin', 'Super Admin fundador — Livvo')
    ON CONFLICT (user_id) DO UPDATE SET level='super_admin';
  END IF;
  RETURN NEW;
END $$;

-- 5. Backfill: se o fundador já existir, concede super_admin
DO $$
DECLARE _uid uuid;
BEGIN
  SELECT id INTO _uid FROM auth.users WHERE LOWER(email) = 'briopopcomercio@gmail.com' LIMIT 1;
  IF _uid IS NOT NULL THEN
    INSERT INTO public.admin_grants (user_id, level, notes)
    VALUES (_uid, 'super_admin', 'Super Admin fundador — Livvo (backfill)')
    ON CONFLICT (user_id) DO UPDATE SET level='super_admin';
  END IF;
END $$;

-- 6. Proteção do super_admin em ações de admin
CREATE OR REPLACE FUNCTION public.admin_set_account_status(_user_id uuid, _status account_status, _reason text DEFAULT NULL)
RETURNS profiles LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.profiles; _new public.account_status;
BEGIN
  IF NOT public.is_platform_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF public.is_super_admin(_user_id) AND NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Somente um Super Admin pode alterar outro Super Admin';
  END IF;

  IF _status NOT IN ('suspenso','bloqueado') THEN
    UPDATE public.profiles SET account_status = NULL WHERE id = _user_id;
    _new := public.compute_account_status(_user_id);
  ELSE
    _new := _status;
  END IF;

  UPDATE public.profiles
     SET account_status = _new,
         status_reason = _reason,
         status_changed_at = now(),
         status_changed_by = auth.uid(),
         updated_at = now()
   WHERE id = _user_id
  RETURNING * INTO _row;
  RETURN _row;
END $$;

-- 7. Ajusta enforce_single_role: níveis administrativos são ortogonais
CREATE OR REPLACE FUNCTION public.enforce_single_role()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _cutoff TIMESTAMPTZ; _created TIMESTAMPTZ; _exception BOOLEAN; _existing_count INT;
BEGIN
  IF NEW.role = 'admin'::public.app_role THEN
    RETURN NEW;
  END IF;
  SELECT single_role_enforced_at INTO _cutoff FROM public.platform_settings WHERE id = 1;
  SELECT created_at, role_exception INTO _created, _exception FROM public.profiles WHERE id = NEW.user_id;
  IF _created IS NULL OR _created < COALESCE(_cutoff, now()) OR COALESCE(_exception, false) THEN
    RETURN NEW;
  END IF;
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
END $$;

-- 8. RPC para o super_admin gerenciar níveis administrativos
CREATE OR REPLACE FUNCTION public.admin_grant_level(_user_id uuid, _level text)
RETURNS admin_grants LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.admin_grants;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Somente Super Admin pode conceder níveis administrativos';
  END IF;
  IF _level NOT IN ('admin','admin_master','super_admin') THEN
    RAISE EXCEPTION 'Nível inválido';
  END IF;
  INSERT INTO public.admin_grants (user_id, level, granted_by)
  VALUES (_user_id, _level, auth.uid())
  ON CONFLICT (user_id) DO UPDATE SET level = EXCLUDED.level, granted_by = auth.uid(), granted_at = now()
  RETURNING * INTO _row;
  RETURN _row;
END $$;

CREATE OR REPLACE FUNCTION public.admin_revoke_level(_user_id uuid)
RETURNS boolean LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Somente Super Admin pode revogar níveis administrativos';
  END IF;
  IF public.is_super_admin(_user_id) AND _user_id = auth.uid() THEN
    RAISE EXCEPTION 'Você não pode revogar seu próprio Super Admin';
  END IF;
  DELETE FROM public.admin_grants WHERE user_id = _user_id;
  RETURN true;
END $$;
