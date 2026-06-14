
-- 1) Backfill: anyone with a professionals row must have 'profissional' role
INSERT INTO public.user_roles (user_id, role)
SELECT p.id, 'profissional'::public.app_role
FROM public.professionals p
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur
  WHERE ur.user_id = p.id AND ur.role = 'profissional'::public.app_role
)
ON CONFLICT DO NOTHING;

-- 2) Backfill: any auth user without any role becomes 'paciente'
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'paciente'::public.app_role
FROM auth.users u
WHERE NOT EXISTS (SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id)
ON CONFLICT DO NOTHING;

-- 3) Helper: only approved professionals get pro-area access
CREATE OR REPLACE FUNCTION public.is_approved_professional(_user uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user AND ur.role = 'profissional'::public.app_role
  ) AND EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = _user AND p.status = 'aprovado'
  );
$$;
