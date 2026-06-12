
-- Enums
DO $$ BEGIN CREATE TYPE public.featured_kind AS ENUM ('premium', 'regional', 'category', 'perfil_premium'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.featured_status AS ENUM ('ativo', 'pausado', 'expirado', 'cancelado'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ad_event_kind AS ENUM ('impression', 'click', 'booking'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;
DO $$ BEGIN CREATE TYPE public.ad_target_type AS ENUM ('professional', 'company'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- featured_plans
CREATE TABLE public.featured_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  kind public.featured_kind NOT NULL,
  price_cents INTEGER NOT NULL CHECK (price_cents >= 0),
  duration_days INTEGER NOT NULL CHECK (duration_days > 0),
  description TEXT,
  perks JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.featured_plans TO authenticated;
GRANT ALL ON public.featured_plans TO service_role;
ALTER TABLE public.featured_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY fp_read ON public.featured_plans FOR SELECT TO authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY fp_admin_write ON public.featured_plans FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER trg_fp_upd BEFORE UPDATE ON public.featured_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- featured_subscriptions
CREATE TABLE public.featured_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.featured_plans(id) ON DELETE RESTRICT,
  target_type public.ad_target_type NOT NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  status public.featured_status NOT NULL DEFAULT 'ativo',
  starts_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at TIMESTAMPTZ NOT NULL,
  amount_paid_cents INTEGER NOT NULL DEFAULT 0,
  auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
  payment_ref TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((target_type='professional' AND professional_id IS NOT NULL AND company_id IS NULL)
      OR (target_type='company' AND company_id IS NOT NULL AND professional_id IS NULL))
);
CREATE INDEX idx_fs_active ON public.featured_subscriptions(status, ends_at) WHERE status='ativo';
CREATE INDEX idx_fs_pro ON public.featured_subscriptions(professional_id);
CREATE INDEX idx_fs_company ON public.featured_subscriptions(company_id);
GRANT SELECT ON public.featured_subscriptions TO authenticated;
GRANT ALL ON public.featured_subscriptions TO service_role;
ALTER TABLE public.featured_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY fs_read_own ON public.featured_subscriptions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin')
      OR (professional_id IS NOT NULL AND professional_id = auth.uid())
      OR (company_id IS NOT NULL AND public.is_company_owner(auth.uid(), company_id)));
CREATE TRIGGER trg_fs_upd BEFORE UPDATE ON public.featured_subscriptions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- featured_regions
CREATE TABLE public.featured_regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.featured_subscriptions(id) ON DELETE CASCADE,
  state TEXT NOT NULL,
  city TEXT,
  district TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_fr_sub ON public.featured_regions(subscription_id);
CREATE INDEX idx_fr_geo ON public.featured_regions(state, city);
GRANT SELECT ON public.featured_regions TO authenticated;
GRANT ALL ON public.featured_regions TO service_role;
ALTER TABLE public.featured_regions ENABLE ROW LEVEL SECURITY;
CREATE POLICY fr_read ON public.featured_regions FOR SELECT TO authenticated USING (true);

-- featured_categories
CREATE TABLE public.featured_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES public.featured_subscriptions(id) ON DELETE CASCADE,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE CASCADE,
  company_type public.company_type,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK (specialty_id IS NOT NULL OR company_type IS NOT NULL)
);
CREATE INDEX idx_fc_sub ON public.featured_categories(subscription_id);
CREATE INDEX idx_fc_spec ON public.featured_categories(specialty_id);
GRANT SELECT ON public.featured_categories TO authenticated;
GRANT ALL ON public.featured_categories TO service_role;
ALTER TABLE public.featured_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY fcat_read ON public.featured_categories FOR SELECT TO authenticated USING (true);

-- ad_impressions
CREATE TABLE public.ad_impressions (
  id BIGSERIAL PRIMARY KEY,
  subscription_id UUID REFERENCES public.featured_subscriptions(id) ON DELETE SET NULL,
  target_type public.ad_target_type NOT NULL,
  professional_id UUID,
  company_id UUID,
  kind public.ad_event_kind NOT NULL,
  viewer_id UUID,
  context JSONB,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_ai_time ON public.ad_impressions(occurred_at DESC);
CREATE INDEX idx_ai_sub ON public.ad_impressions(subscription_id);
CREATE INDEX idx_ai_target ON public.ad_impressions(target_type, professional_id, company_id);
GRANT SELECT ON public.ad_impressions TO authenticated;
GRANT ALL ON public.ad_impressions TO service_role;
ALTER TABLE public.ad_impressions ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_read_own ON public.ad_impressions FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(),'admin')
      OR (professional_id IS NOT NULL AND professional_id = auth.uid())
      OR (company_id IS NOT NULL AND public.is_company_owner(auth.uid(), company_id)));

-- profiles_premium_assets
CREATE TABLE public.profiles_premium_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type public.ad_target_type NOT NULL,
  professional_id UUID REFERENCES public.professionals(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE,
  video_url TEXT,
  extra_photos TEXT[] NOT NULL DEFAULT '{}',
  highlight_cta_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CHECK ((target_type='professional' AND professional_id IS NOT NULL AND company_id IS NULL)
      OR (target_type='company' AND company_id IS NOT NULL AND professional_id IS NULL)),
  UNIQUE(professional_id),
  UNIQUE(company_id)
);
GRANT SELECT ON public.profiles_premium_assets TO authenticated;
GRANT ALL ON public.profiles_premium_assets TO service_role;
ALTER TABLE public.profiles_premium_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY ppa_read ON public.profiles_premium_assets FOR SELECT TO authenticated USING (true);
CREATE POLICY ppa_own_write ON public.profiles_premium_assets FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')
      OR (professional_id IS NOT NULL AND professional_id = auth.uid())
      OR (company_id IS NOT NULL AND public.is_company_owner(auth.uid(), company_id)))
  WITH CHECK (public.has_role(auth.uid(),'admin')
      OR (professional_id IS NOT NULL AND professional_id = auth.uid())
      OR (company_id IS NOT NULL AND public.is_company_owner(auth.uid(), company_id)));
CREATE TRIGGER trg_ppa_upd BEFORE UPDATE ON public.profiles_premium_assets FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Helper: is_premium
CREATE OR REPLACE FUNCTION public.is_provider_premium(_target_type public.ad_target_type, _target_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.featured_subscriptions s
    JOIN public.featured_plans p ON p.id = s.plan_id
    WHERE s.status='ativo' AND s.starts_at <= now() AND s.ends_at >= now()
      AND p.kind='perfil_premium' AND s.target_type=_target_type
      AND ((_target_type='professional' AND s.professional_id=_target_id)
        OR (_target_type='company' AND s.company_id=_target_id))
  );
$$;
REVOKE EXECUTE ON FUNCTION public.is_provider_premium(public.ad_target_type, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_provider_premium(public.ad_target_type, uuid) TO authenticated, service_role;

-- Search ranking function (profissionais)
CREATE OR REPLACE FUNCTION public.search_providers_ranked(
  _state TEXT DEFAULT NULL,
  _city TEXT DEFAULT NULL,
  _specialty_slug TEXT DEFAULT NULL,
  _q TEXT DEFAULT NULL,
  _limit INT DEFAULT 50
)
RETURNS TABLE(
  professional_id UUID,
  full_name TEXT,
  avatar_url TEXT,
  specialty_name TEXT,
  specialty_slug TEXT,
  address_city TEXT,
  address_state TEXT,
  consultation_price NUMERIC,
  rating_average NUMERIC,
  rating_count INT,
  is_premium BOOLEAN,
  rank_group INT,
  subscription_id UUID
)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH base AS (
    SELECT p.id AS professional_id, pr.full_name, p.avatar_url,
           sp.name AS specialty_name, sp.slug AS specialty_slug,
           p.address_city, p.address_state, p.consultation_price,
           p.rating_average, p.rating_count
    FROM public.professionals p
    JOIN public.profiles pr ON pr.id = p.id
    LEFT JOIN public.specialties sp ON sp.id = p.specialty_id
    WHERE p.status='aprovado'
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
         u.rank_group, u.subscription_id
  FROM unioned u
  ORDER BY u.rank_group ASC, u.rating_average DESC NULLS LAST, u.rating_count DESC
  LIMIT _limit;
$$;
REVOKE EXECUTE ON FUNCTION public.search_providers_ranked(TEXT,TEXT,TEXT,TEXT,INT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.search_providers_ranked(TEXT,TEXT,TEXT,TEXT,INT) TO authenticated, service_role;

-- Ads revenue summary
CREATE OR REPLACE FUNCTION public.ads_revenue_summary(_from TIMESTAMPTZ, _to TIMESTAMPTZ)
RETURNS TABLE(total_cents BIGINT, subscriptions_count BIGINT)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT COALESCE(SUM(amount_paid_cents),0)::BIGINT, COUNT(*)::BIGINT
  FROM public.featured_subscriptions
  WHERE created_at >= _from AND created_at < _to;
$$;
REVOKE EXECUTE ON FUNCTION public.ads_revenue_summary(TIMESTAMPTZ,TIMESTAMPTZ) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.ads_revenue_summary(TIMESTAMPTZ,TIMESTAMPTZ) TO authenticated, service_role;

-- Seed plans
INSERT INTO public.featured_plans (code, name, kind, price_cents, duration_days, description, perks) VALUES
  ('premium-search-30', 'Patrocinado Premium (30 dias)', 'premium', 29900, 30, 'Primeiras posições em todos os resultados de busca.', '["Selo Patrocinado","Topo da busca","Prioridade máxima"]'::jsonb),
  ('regional-30', 'Destaque Regional (30 dias)', 'regional', 14900, 30, 'Maior visibilidade na sua cidade ou estado.', '["Destaque por cidade","Destaque por estado","Bairro opcional"]'::jsonb),
  ('category-30', 'Destaque por Categoria (30 dias)', 'category', 19900, 30, 'Posição privilegiada na sua especialidade.', '["Destaque por especialidade","Destaque por tipo de empresa"]'::jsonb),
  ('perfil-premium-30', 'Perfil Premium (30 dias)', 'perfil_premium', 9900, 30, 'Selo Premium, galeria ampliada, vídeo institucional e CTA destacado.', '["Selo Premium","Galeria ampliada","Vídeo institucional","Mais fotos","CTA destacado"]'::jsonb)
ON CONFLICT (code) DO NOTHING;
