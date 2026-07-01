
-- Add columns to appointments for reschedule / cancel / no-show tracking
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS no_show_at timestamptz,
  ADD COLUMN IF NOT EXISTS rescheduled_from_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS rescheduled_to_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reschedule_reason text,
  ADD COLUMN IF NOT EXISTS rescheduled_by uuid,
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz;

-- Immutable timeline
CREATE TABLE IF NOT EXISTS public.appointment_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  event_type text NOT NULL,
  description text,
  actor_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.appointment_events TO authenticated;
GRANT ALL ON public.appointment_events TO service_role;

ALTER TABLE public.appointment_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "appt events read" ON public.appointment_events;
CREATE POLICY "appt events read" ON public.appointment_events
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_events.appointment_id
      AND (a.patient_id = auth.uid() OR a.professional_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  ));

DROP POLICY IF EXISTS "appt events insert" ON public.appointment_events;
CREATE POLICY "appt events insert" ON public.appointment_events
  FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = appointment_events.appointment_id
      AND (a.patient_id = auth.uid() OR a.professional_id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  ));

CREATE INDEX IF NOT EXISTS idx_appt_events_appt ON public.appointment_events(appointment_id, created_at DESC);

-- Auto-log timeline
CREATE OR REPLACE FUNCTION public.log_appointment_event()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE _actor uuid; _desc text;
BEGIN
  _actor := auth.uid();
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.appointment_events(appointment_id, event_type, description, actor_id, metadata)
    VALUES (NEW.id,
            CASE WHEN NEW.rescheduled_from_id IS NOT NULL THEN 'rescheduled_created' ELSE 'created' END,
            CASE WHEN NEW.rescheduled_from_id IS NOT NULL THEN 'Consulta reagendada (novo horário)' ELSE 'Consulta criada' END,
            _actor,
            jsonb_build_object('scheduled_at', NEW.scheduled_at, 'status', NEW.status, 'rescheduled_from_id', NEW.rescheduled_from_id));
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
      _desc := CASE NEW.status::text
        WHEN 'confirmada' THEN 'Consulta confirmada'
        WHEN 'em_andamento' THEN 'Atendimento iniciado'
        WHEN 'realizada' THEN 'Consulta concluída'
        WHEN 'cancelada' THEN COALESCE('Cancelada: '||NEW.cancellation_reason, 'Consulta cancelada')
        WHEN 'nao_compareceu' THEN 'Paciente não compareceu'
        WHEN 'agendada' THEN 'Status: agendada'
        ELSE 'Status atualizado para '||NEW.status::text
      END;
      INSERT INTO public.appointment_events(appointment_id, event_type, description, actor_id, metadata)
      VALUES (NEW.id, 'status_changed', _desc, _actor,
              jsonb_build_object('from', OLD.status, 'to', NEW.status,
                                 'reason', COALESCE(NEW.cancellation_reason, NEW.reschedule_reason)));
    END IF;

    IF NEW.scheduled_at IS DISTINCT FROM OLD.scheduled_at THEN
      INSERT INTO public.appointment_events(appointment_id, event_type, description, actor_id, metadata)
      VALUES (NEW.id, 'rescheduled', 'Consulta reagendada', _actor,
              jsonb_build_object('from', OLD.scheduled_at, 'to', NEW.scheduled_at, 'reason', NEW.reschedule_reason));
    END IF;
  END IF;

  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_log_appt_event ON public.appointments;
CREATE TRIGGER trg_log_appt_event
AFTER INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.log_appointment_event();
