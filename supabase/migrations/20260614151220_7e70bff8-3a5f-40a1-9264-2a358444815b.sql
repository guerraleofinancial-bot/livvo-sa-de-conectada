-- ============================================================
-- ONDA 1 CRM — colunas extras em relationships
-- ============================================================
ALTER TABLE public.crm_patient_relationships
  ADD COLUMN IF NOT EXISTS origin public.patient_origin NOT NULL DEFAULT 'cadastro_direto',
  ADD COLUMN IF NOT EXISTS origin_detail text,
  ADD COLUMN IF NOT EXISTS assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS quick_note text;

CREATE INDEX IF NOT EXISTS idx_crm_assigned ON public.crm_patient_relationships(assigned_user_id);

-- ============================================================
-- QUOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quotes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.quote_status NOT NULL DEFAULT 'rascunho',
  title text NOT NULL DEFAULT 'Orçamento',
  notes text,
  internal_notes text,
  subtotal numeric(12,2) NOT NULL DEFAULT 0,
  discount numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  valid_until date,
  sent_at timestamptz,
  viewed_at timestamptz,
  decided_at timestamptz,
  decision_reason text,
  converted_appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  share_token text UNIQUE DEFAULT encode(gen_random_bytes(16),'hex'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (professional_id IS NOT NULL OR company_id IS NOT NULL)
);
CREATE INDEX IF NOT EXISTS idx_quotes_pro ON public.quotes(professional_id);
CREATE INDEX IF NOT EXISTS idx_quotes_company ON public.quotes(company_id);
CREATE INDEX IF NOT EXISTS idx_quotes_patient ON public.quotes(patient_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON public.quotes(status);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quotes TO authenticated;
GRANT ALL ON public.quotes TO service_role;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- helpers de permissão de empresa (recepcionista pode gerir)
CREATE OR REPLACE FUNCTION public.is_company_staff(_user uuid, _company uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.companies WHERE id = _company AND owner_id = _user
  ) OR EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = _company AND m.user_id = _user
      AND m.role IN ('owner','admin','recepcionista')
  );
$$;
REVOKE ALL ON FUNCTION public.is_company_staff(uuid,uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_company_staff(uuid,uuid) TO authenticated, service_role;

CREATE POLICY "quotes patient read" ON public.quotes FOR SELECT TO authenticated
  USING (patient_id = auth.uid());

CREATE POLICY "quotes pro manage" ON public.quotes FOR ALL TO authenticated
  USING (
    (professional_id = auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_staff(auth.uid(), company_id))
    OR (assigned_user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  )
  WITH CHECK (
    (professional_id = auth.uid())
    OR (company_id IS NOT NULL AND public.is_company_staff(auth.uid(), company_id))
    OR (assigned_user_id = auth.uid())
    OR public.has_role(auth.uid(),'admin')
  );

CREATE TRIGGER trg_quotes_updated BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- QUOTE ITEMS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.quote_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id uuid NOT NULL REFERENCES public.quotes(id) ON DELETE CASCADE,
  service_id uuid REFERENCES public.services(id) ON DELETE SET NULL,
  name text NOT NULL,
  description text,
  quantity numeric(10,2) NOT NULL DEFAULT 1,
  unit_price numeric(12,2) NOT NULL DEFAULT 0,
  total numeric(12,2) NOT NULL DEFAULT 0,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_quote_items_quote ON public.quote_items(quote_id);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_items TO authenticated;
GRANT ALL ON public.quote_items TO service_role;
ALTER TABLE public.quote_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "quote items follow quote" ON public.quote_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_items.quote_id AND (
    q.patient_id = auth.uid() OR q.professional_id = auth.uid()
    OR (q.company_id IS NOT NULL AND public.is_company_staff(auth.uid(), q.company_id))
    OR q.assigned_user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
  )))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quotes q WHERE q.id = quote_items.quote_id AND (
    q.professional_id = auth.uid()
    OR (q.company_id IS NOT NULL AND public.is_company_staff(auth.uid(), q.company_id))
    OR q.assigned_user_id = auth.uid()
    OR public.has_role(auth.uid(),'admin')
  )));

-- ============================================================
-- TRIGGER: recalcula totais do orçamento quando itens mudam
-- ============================================================
CREATE OR REPLACE FUNCTION public.recompute_quote_totals()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _qid uuid; _sub numeric;
BEGIN
  _qid := COALESCE(NEW.quote_id, OLD.quote_id);
  SELECT COALESCE(SUM(quantity * unit_price),0) INTO _sub FROM public.quote_items WHERE quote_id = _qid;
  UPDATE public.quotes
     SET subtotal = _sub,
         total = GREATEST(_sub - COALESCE(discount,0), 0),
         updated_at = now()
   WHERE id = _qid;
  RETURN NULL;
END $$;
REVOKE ALL ON FUNCTION public.recompute_quote_totals() FROM PUBLIC, anon;

CREATE TRIGGER trg_quote_items_totals
  AFTER INSERT OR UPDATE OR DELETE ON public.quote_items
  FOR EACH ROW EXECUTE FUNCTION public.recompute_quote_totals();

-- auto-calc do total da linha
CREATE OR REPLACE FUNCTION public.quote_item_line_total()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.total := COALESCE(NEW.quantity,0) * COALESCE(NEW.unit_price,0);
  RETURN NEW;
END $$;

CREATE TRIGGER trg_quote_items_line_total BEFORE INSERT OR UPDATE ON public.quote_items
  FOR EACH ROW EXECUTE FUNCTION public.quote_item_line_total();

-- ============================================================
-- TRIGGER: status do orçamento → CRM + notificações
-- ============================================================
CREATE OR REPLACE FUNCTION public.quote_status_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pro uuid; _new_crm public.crm_status;
BEGIN
  _pro := COALESCE(NEW.professional_id, NEW.assigned_user_id);

  -- timestamps por status
  IF TG_OP='UPDATE' AND NEW.status <> OLD.status THEN
    IF NEW.status = 'enviado'   AND NEW.sent_at    IS NULL THEN NEW.sent_at    := now(); END IF;
    IF NEW.status = 'visualizado' AND NEW.viewed_at IS NULL THEN NEW.viewed_at := now(); END IF;
    IF NEW.status IN ('aprovado','recusado') AND NEW.decided_at IS NULL THEN NEW.decided_at := now(); END IF;
  END IF;

  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.quote_status_sync() FROM PUBLIC, anon;

CREATE TRIGGER trg_quotes_status_sync BEFORE UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.quote_status_sync();

-- AFTER trigger: efeitos colaterais (CRM + notificações)
CREATE OR REPLACE FUNCTION public.quote_status_effects()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _pro uuid; _new_crm public.crm_status;
BEGIN
  _pro := COALESCE(NEW.professional_id, NEW.assigned_user_id);

  IF TG_OP='INSERT' OR (TG_OP='UPDATE' AND NEW.status <> OLD.status) THEN
    _new_crm := CASE NEW.status
      WHEN 'enviado' THEN 'orcamento_enviado'::public.crm_status
      WHEN 'visualizado' THEN 'aguardando_decisao'::public.crm_status
      WHEN 'aprovado' THEN 'aguardando_decisao'::public.crm_status
      ELSE NULL END;

    IF _new_crm IS NOT NULL AND _pro IS NOT NULL THEN
      UPDATE public.crm_patient_relationships
        SET status = CASE WHEN status_overridden THEN status ELSE _new_crm END,
            status_suggested = _new_crm,
            updated_at = now()
      WHERE professional_id = _pro AND patient_id = NEW.patient_id;
    END IF;

    -- notificações
    IF TG_OP='UPDATE' AND NEW.status='enviado' AND OLD.status <> 'enviado' THEN
      PERFORM public.notify_user(NEW.patient_id,'quote_sent','Você recebeu um orçamento',
        'Um parceiro Livvo enviou um orçamento para você.', '/app/orcamentos/'||NEW.id,
        jsonb_build_object('quote_id', NEW.id));
    ELSIF TG_OP='UPDATE' AND NEW.status='aprovado' AND OLD.status <> 'aprovado' AND _pro IS NOT NULL THEN
      PERFORM public.notify_user(_pro,'quote_approved','Orçamento aprovado',
        'O paciente aprovou um orçamento.', '/pro/orcamentos/'||NEW.id,
        jsonb_build_object('quote_id', NEW.id));
    ELSIF TG_OP='UPDATE' AND NEW.status='recusado' AND OLD.status <> 'recusado' AND _pro IS NOT NULL THEN
      PERFORM public.notify_user(_pro,'quote_rejected','Orçamento recusado',
        'O paciente recusou um orçamento.', '/pro/orcamentos/'||NEW.id,
        jsonb_build_object('quote_id', NEW.id));
    ELSIF TG_OP='UPDATE' AND NEW.status='visualizado' AND OLD.status <> 'visualizado' AND _pro IS NOT NULL THEN
      PERFORM public.notify_user(_pro,'quote_viewed','Orçamento visualizado',
        'O paciente abriu seu orçamento.', '/pro/orcamentos/'||NEW.id,
        jsonb_build_object('quote_id', NEW.id));
    END IF;
  END IF;

  RETURN NEW;
END $$;
REVOKE ALL ON FUNCTION public.quote_status_effects() FROM PUBLIC, anon;

CREATE TRIGGER trg_quotes_effects AFTER INSERT OR UPDATE ON public.quotes
  FOR EACH ROW EXECUTE FUNCTION public.quote_status_effects();

-- ============================================================
-- DASHBOARD COMERCIAL: função agregadora
-- ============================================================
CREATE OR REPLACE FUNCTION public.crm_dashboard(_pro uuid, _from timestamptz, _to timestamptz)
RETURNS jsonb LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  WITH a AS (
    SELECT * FROM public.appointments
    WHERE professional_id = _pro AND created_at >= _from AND created_at < _to
  ),
  q AS (
    SELECT * FROM public.quotes
    WHERE (professional_id = _pro OR assigned_user_id = _pro)
      AND created_at >= _from AND created_at < _to
  ),
  rel AS (
    SELECT * FROM public.crm_patient_relationships WHERE professional_id = _pro
  )
  SELECT jsonb_build_object(
    'leads', (SELECT COUNT(*) FROM rel WHERE first_contact_at >= _from AND first_contact_at < _to),
    'appointments_created', (SELECT COUNT(*) FROM a),
    'appointments_done', (SELECT COUNT(*) FROM a WHERE status='realizada'),
    'cancellations', (SELECT COUNT(*) FROM a WHERE status='cancelada'),
    'quotes_sent', (SELECT COUNT(*) FROM q WHERE status IN ('enviado','visualizado','aprovado','recusado','expirado')),
    'quotes_approved', (SELECT COUNT(*) FROM q WHERE status='aprovado'),
    'revenue', (SELECT COALESCE(SUM(gross_amount),0) FROM a WHERE status='realizada'),
    'avg_ticket', (SELECT COALESCE(AVG(gross_amount),0) FROM a WHERE status='realizada'),
    'patients_active', (SELECT COUNT(*) FROM rel WHERE status IN ('agendado','confirmada','atendido','retorno_pendente','fidelizado')),
    'patients_inactive', (SELECT COUNT(*) FROM rel WHERE status = 'inativo'),
    'conversion_rate', (
      SELECT CASE WHEN COUNT(*)=0 THEN 0 ELSE (COUNT(*) FILTER (WHERE status='aprovado')::numeric / COUNT(*)::numeric) END
      FROM q WHERE status IN ('enviado','visualizado','aprovado','recusado','expirado')
    )
  );
$$;
REVOKE ALL ON FUNCTION public.crm_dashboard(uuid,timestamptz,timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.crm_dashboard(uuid,timestamptz,timestamptz) TO authenticated, service_role;
