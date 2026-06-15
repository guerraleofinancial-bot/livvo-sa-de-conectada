
-- C5: trigger para sincronizar business_hours → availability automaticamente
CREATE OR REPLACE FUNCTION public.sync_business_hours_to_availability()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pro uuid;
BEGIN
  _pro := COALESCE(NEW.professional_id, OLD.professional_id);
  -- regenerate availability for this professional from business_hours
  DELETE FROM public.professional_availability WHERE professional_id = _pro;
  INSERT INTO public.professional_availability (professional_id, day_of_week, start_time, end_time, active)
  SELECT bh.professional_id, bh.weekday,
         CASE WHEN bh.lunch_start IS NOT NULL THEN bh.opens_at ELSE bh.opens_at END,
         CASE WHEN bh.lunch_start IS NOT NULL THEN bh.lunch_start ELSE bh.closes_at END,
         true
  FROM public.professional_business_hours bh
  WHERE bh.professional_id = _pro AND bh.closed = false AND bh.opens_at IS NOT NULL AND bh.closes_at IS NOT NULL
  UNION ALL
  SELECT bh.professional_id, bh.weekday, bh.lunch_end, bh.closes_at, true
  FROM public.professional_business_hours bh
  WHERE bh.professional_id = _pro AND bh.closed = false AND bh.lunch_end IS NOT NULL AND bh.closes_at IS NOT NULL;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_sync_hours_to_avail ON public.professional_business_hours;
CREATE TRIGGER trg_sync_hours_to_avail
AFTER INSERT OR UPDATE OR DELETE ON public.professional_business_hours
FOR EACH ROW EXECUTE FUNCTION public.sync_business_hours_to_availability();

-- C6: approve_professional também marca council_verified_at se documento já existe
CREATE OR REPLACE FUNCTION public.approve_professional(_id uuid)
RETURNS public.professionals LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE row public.professionals;
BEGIN
  IF NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.professionals
    SET status='aprovado',
        approved_at = now(),
        approved_by = auth.uid(),
        council_verified_at = CASE
          WHEN council_verified_at IS NOT NULL THEN council_verified_at
          WHEN council_document_url IS NOT NULL THEN now()
          ELSE NULL
        END,
        documents_expire_at = COALESCE(documents_expire_at, now() + INTERVAL '2 years'),
        zero_commission_start = COALESCE(zero_commission_start, now()),
        zero_commission_end = COALESCE(zero_commission_end, now() + INTERVAL '90 days')
    WHERE id = _id
    RETURNING * INTO row;
  RETURN row;
END $$;

-- Backfill: gerar professional_availability para quem já tem business_hours mas não tem availability
INSERT INTO public.professional_availability (professional_id, day_of_week, start_time, end_time, active)
SELECT bh.professional_id, bh.weekday, bh.opens_at,
       COALESCE(bh.lunch_start, bh.closes_at), true
FROM public.professional_business_hours bh
WHERE bh.closed = false AND bh.opens_at IS NOT NULL AND bh.closes_at IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.professional_availability pa WHERE pa.professional_id = bh.professional_id)
UNION ALL
SELECT bh.professional_id, bh.weekday, bh.lunch_end, bh.closes_at, true
FROM public.professional_business_hours bh
WHERE bh.closed = false AND bh.lunch_end IS NOT NULL AND bh.closes_at IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.professional_availability pa WHERE pa.professional_id = bh.professional_id);
