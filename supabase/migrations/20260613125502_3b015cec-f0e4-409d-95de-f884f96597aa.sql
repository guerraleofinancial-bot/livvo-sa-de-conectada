
-- ENUMS
CREATE TYPE public.crm_status AS ENUM ('novo_lead','agendado','confirmada','atendido','cancelado','retorno_pendente','inativo');
CREATE TYPE public.notification_channel AS ENUM ('in_app','email','whatsapp');
CREATE TYPE public.notification_event AS ENUM (
  'appointment_created','appointment_confirmed','appointment_cancelled','appointment_rescheduled',
  'new_message','new_review','appointment_reminder','review_request','retention_campaign'
);
CREATE TYPE public.note_visibility AS ENUM ('private','clinic');
CREATE TYPE public.automation_kind AS ENUM ('reminder_24h','review_request','retention_90d');
CREATE TYPE public.automation_status AS ENUM ('queued','sent','failed','cancelled');

-- NOTIFICATIONS: extend with event metadata
ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS event public.notification_event,
  ADD COLUMN IF NOT EXISTS metadata jsonb NOT NULL DEFAULT '{}'::jsonb;

-- NOTIFICATION PREFERENCES
CREATE TABLE public.notification_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  in_app boolean NOT NULL DEFAULT true,
  email boolean NOT NULL DEFAULT false,
  whatsapp boolean NOT NULL DEFAULT false,
  events_muted public.notification_event[] NOT NULL DEFAULT '{}',
  whatsapp_phone text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notification_preferences TO authenticated;
GRANT ALL ON public.notification_preferences TO service_role;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "prefs self all" ON public.notification_preferences FOR ALL TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
CREATE TRIGGER trg_prefs_updated BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CRM PATIENT RELATIONSHIPS
CREATE TABLE public.crm_patient_relationships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  status public.crm_status NOT NULL DEFAULT 'novo_lead',
  status_suggested public.crm_status NOT NULL DEFAULT 'novo_lead',
  status_overridden boolean NOT NULL DEFAULT false,
  status_changed_at timestamptz NOT NULL DEFAULT now(),
  status_changed_by uuid REFERENCES auth.users(id),
  first_contact_at timestamptz NOT NULL DEFAULT now(),
  last_appointment_at timestamptz,
  next_appointment_at timestamptz,
  total_revenue numeric(12,2) NOT NULL DEFAULT 0,
  appointments_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (professional_id, patient_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_patient_relationships TO authenticated;
GRANT ALL ON public.crm_patient_relationships TO service_role;
ALTER TABLE public.crm_patient_relationships ENABLE ROW LEVEL SECURITY;
-- Professional owner reads/writes; company owners/admins also read; admin all
CREATE POLICY "crm pro manage" ON public.crm_patient_relationships FOR ALL TO authenticated
  USING (professional_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (professional_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "crm clinic read" ON public.crm_patient_relationships FOR SELECT TO authenticated
  USING (company_id IS NOT NULL AND (public.is_company_owner(auth.uid(), company_id) OR EXISTS (
    SELECT 1 FROM public.company_members m
    WHERE m.company_id = crm_patient_relationships.company_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')
  )));
CREATE INDEX idx_crm_pro ON public.crm_patient_relationships(professional_id);
CREATE INDEX idx_crm_patient ON public.crm_patient_relationships(patient_id);
CREATE INDEX idx_crm_company ON public.crm_patient_relationships(company_id);
CREATE TRIGGER trg_crm_updated BEFORE UPDATE ON public.crm_patient_relationships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- CRM PATIENT NOTES (commercial, not clinical)
CREATE TABLE public.crm_patient_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id uuid NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id uuid REFERENCES public.companies(id) ON DELETE SET NULL,
  author_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  visibility public.note_visibility NOT NULL DEFAULT 'private',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.crm_patient_notes TO authenticated;
GRANT ALL ON public.crm_patient_notes TO service_role;
ALTER TABLE public.crm_patient_notes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notes author manage" ON public.crm_patient_notes FOR ALL TO authenticated
  USING (author_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (author_id = auth.uid());
CREATE POLICY "notes pro read" ON public.crm_patient_notes FOR SELECT TO authenticated
  USING (professional_id = auth.uid());
CREATE POLICY "notes clinic read" ON public.crm_patient_notes FOR SELECT TO authenticated
  USING (visibility = 'clinic' AND company_id IS NOT NULL AND (
    public.is_company_owner(auth.uid(), company_id) OR EXISTS (
      SELECT 1 FROM public.company_members m
      WHERE m.company_id = crm_patient_notes.company_id AND m.user_id = auth.uid() AND m.role IN ('owner','admin')
    )
  ));
CREATE INDEX idx_notes_pro_patient ON public.crm_patient_notes(professional_id, patient_id);
CREATE TRIGGER trg_notes_updated BEFORE UPDATE ON public.crm_patient_notes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- AUTOMATION JOBS
CREATE TABLE public.automation_jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind public.automation_kind NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id) ON DELETE CASCADE,
  professional_id uuid REFERENCES public.professionals(id) ON DELETE CASCADE,
  patient_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  run_at timestamptz NOT NULL,
  status public.automation_status NOT NULL DEFAULT 'queued',
  attempts integer NOT NULL DEFAULT 0,
  last_error text,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.automation_jobs TO authenticated;
GRANT ALL ON public.automation_jobs TO service_role;
ALTER TABLE public.automation_jobs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "jobs pro read" ON public.automation_jobs FOR SELECT TO authenticated
  USING (professional_id = auth.uid() OR patient_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE INDEX idx_jobs_run ON public.automation_jobs(status, run_at);
CREATE TRIGGER trg_jobs_updated BEFORE UPDATE ON public.automation_jobs
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- HELPER: notify (security definer, used by triggers)
CREATE OR REPLACE FUNCTION public.notify_user(
  _user_id uuid, _event public.notification_event, _title text, _body text,
  _link text DEFAULT NULL, _metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _id uuid; _muted boolean;
BEGIN
  SELECT _event = ANY(events_muted) INTO _muted FROM public.notification_preferences WHERE user_id = _user_id;
  IF COALESCE(_muted,false) THEN RETURN NULL; END IF;
  INSERT INTO public.notifications(user_id, title, body, link, event, metadata)
  VALUES (_user_id, _title, _body, _link, _event, _metadata)
  RETURNING id INTO _id;
  RETURN _id;
END $$;

-- HELPER: compute CRM status from appointment row
CREATE OR REPLACE FUNCTION public.derive_crm_status(_status public.appointment_status, _scheduled_at timestamptz)
RETURNS public.crm_status LANGUAGE sql IMMUTABLE AS $$
  SELECT CASE
    WHEN _status='cancelada' THEN 'cancelado'::public.crm_status
    WHEN _status='realizada' THEN 'atendido'::public.crm_status
    WHEN _status='confirmada' THEN 'confirmada'::public.crm_status
    WHEN _status IN ('agendada','em_andamento') THEN 'agendado'::public.crm_status
    ELSE 'novo_lead'::public.crm_status
  END
$$;

-- TRIGGER: upsert CRM relationship + notifications on appointment changes
CREATE OR REPLACE FUNCTION public.crm_appointment_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _suggested public.crm_status;
  _last timestamptz; _next timestamptz; _count int; _rev numeric;
  _company uuid; _pro_user uuid; _patient_name text; _pro_name text;
BEGIN
  SELECT p.id INTO _pro_user FROM public.professionals p WHERE p.id = NEW.professional_id;
  -- Aggregates over all appts for this (pro, patient)
  SELECT MAX(scheduled_at) FILTER (WHERE status='realizada'),
         MIN(scheduled_at) FILTER (WHERE scheduled_at > now() AND status IN ('agendada','confirmada')),
         COUNT(*) FILTER (WHERE status='realizada'),
         COALESCE(SUM(gross_amount) FILTER (WHERE status='realizada'),0)
    INTO _last, _next, _count, _rev
    FROM public.appointments
    WHERE professional_id = NEW.professional_id AND patient_id = NEW.patient_id;

  _suggested := public.derive_crm_status(NEW.status, NEW.scheduled_at);

  INSERT INTO public.crm_patient_relationships(
    professional_id, patient_id, status, status_suggested, last_appointment_at,
    next_appointment_at, appointments_count, total_revenue
  ) VALUES (
    NEW.professional_id, NEW.patient_id, _suggested, _suggested, _last, _next, _count, _rev
  )
  ON CONFLICT (professional_id, patient_id) DO UPDATE SET
    status_suggested = EXCLUDED.status_suggested,
    status = CASE WHEN crm_patient_relationships.status_overridden THEN crm_patient_relationships.status ELSE EXCLUDED.status_suggested END,
    last_appointment_at = EXCLUDED.last_appointment_at,
    next_appointment_at = EXCLUDED.next_appointment_at,
    appointments_count = EXCLUDED.appointments_count,
    total_revenue = EXCLUDED.total_revenue,
    updated_at = now();

  -- Notifications
  IF TG_OP='INSERT' THEN
    PERFORM public.notify_user(NEW.professional_id, 'appointment_created',
      'Novo agendamento', 'Você recebeu um novo agendamento.', '/pro/agenda',
      jsonb_build_object('appointment_id', NEW.id));
    PERFORM public.notify_user(NEW.patient_id, 'appointment_created',
      'Agendamento confirmado', 'Seu agendamento foi registrado.', '/app/consultas',
      jsonb_build_object('appointment_id', NEW.id));
    -- Queue reminder 24h before
    IF NEW.scheduled_at > now() + INTERVAL '24 hours' THEN
      INSERT INTO public.automation_jobs(kind, appointment_id, professional_id, patient_id, run_at)
      VALUES ('reminder_24h', NEW.id, NEW.professional_id, NEW.patient_id, NEW.scheduled_at - INTERVAL '24 hours');
    END IF;
  ELSIF TG_OP='UPDATE' THEN
    IF NEW.status='cancelada' AND OLD.status <> 'cancelada' THEN
      PERFORM public.notify_user(NEW.professional_id,'appointment_cancelled','Agendamento cancelado','Um agendamento foi cancelado.','/pro/agenda',jsonb_build_object('appointment_id',NEW.id));
      PERFORM public.notify_user(NEW.patient_id,'appointment_cancelled','Agendamento cancelado','Seu agendamento foi cancelado.','/app/consultas',jsonb_build_object('appointment_id',NEW.id));
      UPDATE public.automation_jobs SET status='cancelled' WHERE appointment_id=NEW.id AND status='queued';
    ELSIF NEW.status='confirmada' AND OLD.status <> 'confirmada' THEN
      PERFORM public.notify_user(NEW.patient_id,'appointment_confirmed','Consulta confirmada','Seu atendimento foi confirmado.','/app/consultas',jsonb_build_object('appointment_id',NEW.id));
    ELSIF NEW.scheduled_at <> OLD.scheduled_at THEN
      PERFORM public.notify_user(NEW.patient_id,'appointment_rescheduled','Atendimento remarcado','Seu agendamento foi remarcado.','/app/consultas',jsonb_build_object('appointment_id',NEW.id));
      PERFORM public.notify_user(NEW.professional_id,'appointment_rescheduled','Atendimento remarcado','Um agendamento foi remarcado.','/pro/agenda',jsonb_build_object('appointment_id',NEW.id));
      UPDATE public.automation_jobs SET run_at = NEW.scheduled_at - INTERVAL '24 hours' WHERE appointment_id=NEW.id AND kind='reminder_24h' AND status='queued';
    END IF;
    -- Queue review request and 90-day retention after appointment is completed
    IF NEW.status='realizada' AND OLD.status <> 'realizada' THEN
      INSERT INTO public.automation_jobs(kind, appointment_id, professional_id, patient_id, run_at)
        VALUES ('review_request', NEW.id, NEW.professional_id, NEW.patient_id, now() + INTERVAL '2 hours');
      INSERT INTO public.automation_jobs(kind, appointment_id, professional_id, patient_id, run_at)
        VALUES ('retention_90d', NEW.id, NEW.professional_id, NEW.patient_id, now() + INTERVAL '90 days');
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_crm_appt_sync
AFTER INSERT OR UPDATE OF status, scheduled_at ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.crm_appointment_sync();

-- TRIGGER: message notification
CREATE OR REPLACE FUNCTION public.notify_new_message()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _a record; _to uuid;
BEGIN
  SELECT patient_id, professional_id INTO _a FROM public.appointments WHERE id = NEW.appointment_id;
  _to := CASE WHEN NEW.sender_id = _a.patient_id THEN _a.professional_id ELSE _a.patient_id END;
  PERFORM public.notify_user(_to,'new_message','Nova mensagem','Você recebeu uma nova mensagem.','/app/mensagens',
    jsonb_build_object('appointment_id', NEW.appointment_id, 'message_id', NEW.id));
  RETURN NEW;
END $$;
CREATE TRIGGER trg_msg_notify AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_new_message();

-- TRIGGER: review notification
CREATE OR REPLACE FUNCTION public.notify_new_review()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  PERFORM public.notify_user(NEW.professional_id,'new_review','Nova avaliação',
    'Você recebeu uma nova avaliação (' || NEW.rating::text || '★).', '/pro/index',
    jsonb_build_object('review_id', NEW.id));
  RETURN NEW;
END $$;
CREATE TRIGGER trg_review_notify AFTER INSERT ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.notify_new_review();

-- Override status (used by RPC from UI)
CREATE OR REPLACE FUNCTION public.crm_set_status(_rel_id uuid, _status public.crm_status, _override boolean DEFAULT true)
RETURNS public.crm_patient_relationships LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _row public.crm_patient_relationships;
BEGIN
  SELECT * INTO _row FROM public.crm_patient_relationships WHERE id = _rel_id;
  IF _row.professional_id <> auth.uid() AND NOT public.has_role(auth.uid(),'admin') THEN
    RAISE EXCEPTION 'Forbidden';
  END IF;
  UPDATE public.crm_patient_relationships
    SET status=_status, status_overridden=_override,
        status_changed_at=now(), status_changed_by=auth.uid()
    WHERE id=_rel_id RETURNING * INTO _row;
  RETURN _row;
END $$;
