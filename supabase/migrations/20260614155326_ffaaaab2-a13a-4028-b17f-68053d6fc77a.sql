
-- Lote 1.1: Validação documental por conselho profissional

-- Enum de conselhos
DO $$ BEGIN
  CREATE TYPE public.professional_council AS ENUM
    ('CRM','CRO','CRP','CRF','CRBM','COREN','CRN','CREFITO','CREFONO','OUTRO');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Novo status no enum existente
ALTER TYPE public.professional_status ADD VALUE IF NOT EXISTS 'em_analise';
ALTER TYPE public.professional_status ADD VALUE IF NOT EXISTS 'documentacao_vencida';

-- Campos novos em professionals
ALTER TABLE public.professionals
  ADD COLUMN IF NOT EXISTS council public.professional_council,
  ADD COLUMN IF NOT EXISTS council_number TEXT,
  ADD COLUMN IF NOT EXISTS council_state TEXT,
  ADD COLUMN IF NOT EXISTS council_document_url TEXT,
  ADD COLUMN IF NOT EXISTS council_verified_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS council_rejection_reason TEXT,
  ADD COLUMN IF NOT EXISTS documents_expire_at TIMESTAMPTZ;

-- is_approved_professional: agora também exige conselho verificado
CREATE OR REPLACE FUNCTION public.is_approved_professional(_user uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    WHERE ur.user_id = _user AND ur.role = 'profissional'::public.app_role
  ) AND EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = _user
      AND p.status = 'aprovado'
      AND p.council_verified_at IS NOT NULL
      AND (p.documents_expire_at IS NULL OR p.documents_expire_at > now())
  );
$$;

-- Função admin: verificar conselho (separada do approve geral)
CREATE OR REPLACE FUNCTION public.verify_professional_council(_id uuid, _approved boolean, _reason text DEFAULT NULL)
RETURNS public.professionals
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE row public.professionals;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  IF _approved THEN
    UPDATE public.professionals SET
      council_verified_at = now(),
      council_rejection_reason = NULL,
      documents_expire_at = COALESCE(documents_expire_at, now() + INTERVAL '2 years'),
      updated_at = now()
    WHERE id = _id RETURNING * INTO row;
  ELSE
    UPDATE public.professionals SET
      council_verified_at = NULL,
      council_rejection_reason = _reason,
      status = 'rejeitado',
      updated_at = now()
    WHERE id = _id RETURNING * INTO row;
  END IF;
  RETURN row;
END $$;

-- search_providers_ranked: incluir campos de conselho
DROP FUNCTION IF EXISTS public.search_providers_ranked(text,text,text,text,integer);
CREATE OR REPLACE FUNCTION public.search_providers_ranked(
  _state text DEFAULT NULL,
  _city text DEFAULT NULL,
  _specialty_slug text DEFAULT NULL,
  _q text DEFAULT NULL,
  _limit integer DEFAULT 50
)
RETURNS TABLE(
  professional_id uuid, full_name text, avatar_url text,
  specialty_name text, specialty_slug text,
  address_city text, address_state text,
  consultation_price numeric, rating_average numeric, rating_count integer,
  is_premium boolean, rank_group integer, subscription_id uuid,
  council public.professional_council, council_number text, council_state text,
  is_verified boolean
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  WITH base AS (
    SELECT p.id AS professional_id, pr.full_name, p.avatar_url,
           sp.name AS specialty_name, sp.slug AS specialty_slug,
           p.address_city, p.address_state, p.consultation_price,
           p.rating_average, p.rating_count,
           p.council, p.council_number, p.council_state,
           (p.council_verified_at IS NOT NULL) AS is_verified
    FROM public.professionals p
    JOIN public.profiles pr ON pr.id = p.id
    LEFT JOIN public.specialties sp ON sp.id = p.specialty_id
    WHERE p.status='aprovado'
      AND p.council_verified_at IS NOT NULL
      AND (p.documents_expire_at IS NULL OR p.documents_expire_at > now())
      AND (_state IS NULL OR p.address_state ILIKE _state)
      AND (_city IS NULL OR p.address_city ILIKE '%'||_city||'%')
      AND (_specialty_slug IS NULL OR sp.slug = _specialty_slug)
      AND (_q IS NULL OR pr.full_name ILIKE '%'||_q||'%' OR sp.name ILIKE '%'||_q||'%')
  ),
  active_subs AS (
    SELECT s.id AS subscription_id, s.professional_id, p.kind
    FROM public.featured_subscriptions s
    JOIN public.featured_plans p ON p.id = s.plan_id
    WHERE s.status='ativo' AND s.target_type='professional'
      AND s.starts_at <= now() AND s.ends_at >= now()
  ),
  premium AS (
    SELECT b.*, s.subscription_id, 1 AS rank_group
    FROM base b JOIN active_subs s ON s.professional_id = b.professional_id AND s.kind='premium'
  ),
  regional AS (
    SELECT DISTINCT ON (b.professional_id) b.*, s.subscription_id, 2 AS rank_group
    FROM base b
    JOIN active_subs s ON s.professional_id = b.professional_id AND s.kind='regional'
    JOIN public.featured_regions r ON r.subscription_id = s.subscription_id
    WHERE (_state IS NULL OR r.state ILIKE _state)
      AND (r.city IS NULL OR _city IS NULL OR r.city ILIKE '%'||_city||'%')
      AND b.professional_id NOT IN (SELECT professional_id FROM premium)
  ),
  category AS (
    SELECT DISTINCT ON (b.professional_id) b.*, s.subscription_id, 3 AS rank_group
    FROM base b
    JOIN active_subs s ON s.professional_id = b.professional_id AND s.kind='category'
    JOIN public.featured_categories c ON c.subscription_id = s.subscription_id
    JOIN public.specialties sp2 ON sp2.id = c.specialty_id
    WHERE (_specialty_slug IS NULL OR sp2.slug = _specialty_slug)
      AND b.professional_id NOT IN (SELECT professional_id FROM premium)
      AND b.professional_id NOT IN (SELECT professional_id FROM regional)
  ),
  organic AS (
    SELECT b.*, NULL::uuid AS subscription_id, 4 AS rank_group
    FROM base b
    WHERE b.professional_id NOT IN (SELECT professional_id FROM premium)
      AND b.professional_id NOT IN (SELECT professional_id FROM regional)
      AND b.professional_id NOT IN (SELECT professional_id FROM category)
  ),
  unioned AS (
    SELECT * FROM premium UNION ALL SELECT * FROM regional
    UNION ALL SELECT * FROM category UNION ALL SELECT * FROM organic
  )
  SELECT u.professional_id, u.full_name, u.avatar_url, u.specialty_name, u.specialty_slug,
         u.address_city, u.address_state, u.consultation_price, u.rating_average, u.rating_count,
         public.is_provider_premium('professional', u.professional_id) AS is_premium,
         u.rank_group, u.subscription_id,
         u.council, u.council_number, u.council_state, u.is_verified
  FROM unioned u
  ORDER BY u.rank_group ASC, u.rating_average DESC NULLS LAST, u.rating_count DESC
  LIMIT _limit;
$$;
