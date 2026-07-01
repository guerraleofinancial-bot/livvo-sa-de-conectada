
-- 1) Enum de status da conta
DO $$ BEGIN
  CREATE TYPE public.account_status AS ENUM (
    'paciente',
    'profissional_pendente',
    'profissional_aprovado',
    'empresa_pendente',
    'empresa_aprovada',
    'suspenso',
    'bloqueado'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) Coluna em profiles (derivada, mas persistida para consultas rápidas e admin override)
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_status public.account_status,
  ADD COLUMN IF NOT EXISTS status_reason text,
  ADD COLUMN IF NOT EXISTS status_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS status_changed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- 3) Função de derivação — calcula status a partir de user_roles + professionals + companies
CREATE OR REPLACE FUNCTION public.compute_account_status(_user uuid)
RETURNS public.account_status
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current public.account_status;
  _has_pro boolean;
  _has_emp boolean;
  _has_pac boolean;
  _pro_ok boolean;
  _emp_ok boolean;
BEGIN
  -- Se admin já marcou como suspenso/bloqueado, respeita
  SELECT account_status INTO _current FROM public.profiles WHERE id = _user;
  IF _current IN ('suspenso','bloqueado') THEN
    RETURN _current;
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user AND role='profissional') INTO _has_pro;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user AND role='empresa') INTO _has_emp;
  SELECT EXISTS(SELECT 1 FROM public.user_roles WHERE user_id=_user AND role='paciente') INTO _has_pac;

  IF _has_pro THEN
    SELECT (status='aprovado' AND council_verified_at IS NOT NULL)
      INTO _pro_ok FROM public.professionals WHERE id=_user;
    RETURN CASE WHEN COALESCE(_pro_ok,false) THEN 'profissional_aprovado'::public.account_status
                ELSE 'profissional_pendente'::public.account_status END;
  END IF;

  IF _has_emp THEN
    SELECT (status='aprovado') INTO _emp_ok FROM public.companies WHERE owner_id=_user LIMIT 1;
    RETURN CASE WHEN COALESCE(_emp_ok,false) THEN 'empresa_aprovada'::public.account_status
                ELSE 'empresa_pendente'::public.account_status END;
  END IF;

  RETURN 'paciente'::public.account_status;
END $$;

-- 4) Trigger para atualizar profiles.account_status quando algo relevante muda
CREATE OR REPLACE FUNCTION public.sync_account_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _uid uuid; _new public.account_status; _cur public.account_status;
BEGIN
  _uid := CASE TG_TABLE_NAME
    WHEN 'user_roles' THEN COALESCE(NEW.user_id, OLD.user_id)
    WHEN 'professionals' THEN COALESCE(NEW.id, OLD.id)
    WHEN 'companies' THEN COALESCE(NEW.owner_id, OLD.owner_id)
    WHEN 'profiles' THEN COALESCE(NEW.id, OLD.id)
  END;
  IF _uid IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  SELECT account_status INTO _cur FROM public.profiles WHERE id=_uid;
  -- Nunca sobrescrever suspenso/bloqueado automaticamente
  IF _cur IN ('suspenso','bloqueado') THEN RETURN COALESCE(NEW, OLD); END IF;

  _new := public.compute_account_status(_uid);
  IF _cur IS DISTINCT FROM _new THEN
    UPDATE public.profiles SET account_status=_new, updated_at=now() WHERE id=_uid;
  END IF;
  RETURN COALESCE(NEW, OLD);
END $$;

DROP TRIGGER IF EXISTS trg_sync_status_user_roles ON public.user_roles;
CREATE TRIGGER trg_sync_status_user_roles
AFTER INSERT OR UPDATE OR DELETE ON public.user_roles
FOR EACH ROW EXECUTE FUNCTION public.sync_account_status();

DROP TRIGGER IF EXISTS trg_sync_status_pros ON public.professionals;
CREATE TRIGGER trg_sync_status_pros
AFTER INSERT OR UPDATE OF status, council_verified_at ON public.professionals
FOR EACH ROW EXECUTE FUNCTION public.sync_account_status();

DROP TRIGGER IF EXISTS trg_sync_status_companies ON public.companies;
CREATE TRIGGER trg_sync_status_companies
AFTER INSERT OR UPDATE OF status, owner_id ON public.companies
FOR EACH ROW EXECUTE FUNCTION public.sync_account_status();

-- 5) Backfill imediato
UPDATE public.profiles p
   SET account_status = public.compute_account_status(p.id)
 WHERE account_status IS NULL;

-- 6) RPC admin: alterar status manualmente (suspender/bloquear/reativar)
CREATE OR REPLACE FUNCTION public.admin_set_account_status(_user_id uuid, _status public.account_status, _reason text DEFAULT NULL)
RETURNS public.profiles
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _row public.profiles; _new public.account_status;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;

  -- Ao "reativar" (qualquer status que não seja suspenso/bloqueado), recomputamos
  IF _status NOT IN ('suspenso','bloqueado') THEN
    -- Limpa lock antes de recomputar
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

-- 7) Helper para o app: bloquear ações se conta suspensa/bloqueada
CREATE OR REPLACE FUNCTION public.is_account_active(_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public
AS $$
  SELECT COALESCE(
    (SELECT account_status NOT IN ('suspenso','bloqueado') FROM public.profiles WHERE id=_user),
    true
  );
$$;
