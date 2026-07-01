
-- 1. Slug columns
ALTER TABLE public.professionals ADD COLUMN IF NOT EXISTS slug text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug text;

-- 2. Slugify helper (no unaccent extension dependency: manual translit)
CREATE OR REPLACE FUNCTION public.slugify(_input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE _s text;
BEGIN
  IF _input IS NULL THEN RETURN NULL; END IF;
  _s := lower(_input);
  _s := translate(_s,
    'áàâãäåāăąçćčđďéèêëēĕėęěğǵḧíìîïĩīĭįıĵķĺļľłḿñńňņŋóòôõöōŏőøṕŕŗřśšşșťţțúùûüũūŭůűųẃẍÿýžźż',
    'aaaaaaaaacccddeeeeeeeeegghiiiiiiiiijklllllmnnnnnooooooooprrrsssstttuuuuuuuuuuwxyyzzz');
  _s := regexp_replace(_s, '[^a-z0-9]+', '-', 'g');
  _s := regexp_replace(_s, '(^-+|-+$)', '', 'g');
  IF _s = '' OR _s IS NULL THEN _s := 'perfil'; END IF;
  RETURN _s;
END $$;

-- 3. Unique slug generator with collision handling
CREATE OR REPLACE FUNCTION public.ensure_unique_slug(_base text, _table text, _self_id uuid)
RETURNS text
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE _slug text := _base; _n int := 1; _exists boolean;
BEGIN
  LOOP
    EXECUTE format('SELECT EXISTS(SELECT 1 FROM public.%I WHERE slug = $1 AND id <> COALESCE($2, ''00000000-0000-0000-0000-000000000000''::uuid))', _table)
      INTO _exists USING _slug, _self_id;
    EXIT WHEN NOT _exists;
    _n := _n + 1;
    _slug := _base || '-' || _n;
  END LOOP;
  RETURN _slug;
END $$;

-- 4. Auto-fill trigger for professionals
CREATE OR REPLACE FUNCTION public.professionals_fill_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _base text; _name text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    SELECT full_name INTO _name FROM public.profiles WHERE id = NEW.id;
    _base := public.slugify(COALESCE(NEW.display_name, _name, 'profissional'));
    NEW.slug := public.ensure_unique_slug(_base, 'professionals', NEW.id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_professionals_fill_slug ON public.professionals;
CREATE TRIGGER trg_professionals_fill_slug
  BEFORE INSERT OR UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.professionals_fill_slug();

-- 5. Auto-fill trigger for companies
CREATE OR REPLACE FUNCTION public.companies_fill_slug()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _base text;
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    _base := public.slugify(COALESCE(NEW.trade_name, NEW.legal_name, 'empresa'));
    NEW.slug := public.ensure_unique_slug(_base, 'companies', NEW.id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_companies_fill_slug ON public.companies;
CREATE TRIGGER trg_companies_fill_slug
  BEFORE INSERT OR UPDATE ON public.companies
  FOR EACH ROW EXECUTE FUNCTION public.companies_fill_slug();

-- 6. Backfill existing rows
UPDATE public.professionals p SET slug = public.ensure_unique_slug(
  public.slugify(COALESCE(p.display_name, (SELECT full_name FROM public.profiles WHERE id = p.id), 'profissional')),
  'professionals', p.id)
WHERE slug IS NULL OR slug = '';

UPDATE public.companies c SET slug = public.ensure_unique_slug(
  public.slugify(COALESCE(c.trade_name, c.legal_name, 'empresa')),
  'companies', c.id)
WHERE slug IS NULL OR slug = '';

-- 7. Unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS professionals_slug_uidx ON public.professionals(slug);
CREATE UNIQUE INDEX IF NOT EXISTS companies_slug_uidx ON public.companies(slug);

-- 8. Public anon read policies (visitors can view approved/verified profiles)
DROP POLICY IF EXISTS "prof public approved read" ON public.professionals;
CREATE POLICY "prof public approved read" ON public.professionals
  FOR SELECT TO anon
  USING (status = 'aprovado'::professional_status
         AND council_verified_at IS NOT NULL
         AND (documents_expire_at IS NULL OR documents_expire_at > now()));

DROP POLICY IF EXISTS "companies public approved read" ON public.companies;
CREATE POLICY "companies public approved read" ON public.companies
  FOR SELECT TO anon
  USING (status = 'aprovado'::professional_status);

DROP POLICY IF EXISTS "profiles public approved read" ON public.profiles;
CREATE POLICY "profiles public approved read" ON public.profiles
  FOR SELECT TO anon
  USING (EXISTS (
    SELECT 1 FROM public.professionals p
    WHERE p.id = profiles.id
      AND p.status = 'aprovado'::professional_status
      AND p.council_verified_at IS NOT NULL
      AND (p.documents_expire_at IS NULL OR p.documents_expire_at > now())
  ));

GRANT SELECT ON public.professionals TO anon;
GRANT SELECT ON public.companies TO anon;
GRANT SELECT ON public.profiles TO anon;

-- 9. Grant anon read on related tables already exposed to public (already role=public which includes anon)
-- specialties, professional_business_hours, reviews, services are TO public → already visible.
