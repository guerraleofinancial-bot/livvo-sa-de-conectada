
-- ===== ENUMS =====
CREATE TYPE public.app_role AS ENUM ('paciente', 'profissional', 'admin');
CREATE TYPE public.gender_type AS ENUM ('feminino', 'masculino', 'outro', 'prefiro_nao_dizer');
CREATE TYPE public.professional_status AS ENUM ('pendente', 'aprovado', 'rejeitado', 'suspenso');
CREATE TYPE public.appointment_status AS ENUM ('agendada', 'confirmada', 'em_andamento', 'realizada', 'cancelada', 'nao_compareceu');
CREATE TYPE public.appointment_modality AS ENUM ('presencial', 'telemedicina');
CREATE TYPE public.payment_status AS ENUM ('pendente', 'pago', 'reembolsado', 'falhou');

-- ===== updated_at helper =====
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

-- ===== PROFILES =====
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  gender public.gender_type,
  city TEXT,
  state TEXT,
  suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_profiles_updated BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== USER ROLES =====
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- ===== SPECIALTIES =====
CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.specialties TO anon, authenticated;
GRANT ALL ON public.specialties TO service_role;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;

-- ===== PROFESSIONALS =====
CREATE TABLE public.professionals (
  id UUID PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  specialty_id UUID REFERENCES public.specialties(id),
  professional_registry TEXT NOT NULL,
  bio TEXT,
  address_street TEXT,
  address_city TEXT,
  address_state TEXT,
  consultation_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  modality public.appointment_modality NOT NULL DEFAULT 'presencial',
  status public.professional_status NOT NULL DEFAULT 'pendente',
  rating_average NUMERIC(3,2) NOT NULL DEFAULT 0,
  rating_count INTEGER NOT NULL DEFAULT 0,
  total_appointments INTEGER NOT NULL DEFAULT 0,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_prof_status ON public.professionals(status);
CREATE INDEX idx_prof_specialty ON public.professionals(specialty_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professionals TO authenticated;
GRANT ALL ON public.professionals TO service_role;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_prof_updated BEFORE UPDATE ON public.professionals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== AVAILABILITY (semanal recorrente) =====
CREATE TABLE public.professional_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_availability TO authenticated;
GRANT ALL ON public.professional_availability TO service_role;
ALTER TABLE public.professional_availability ENABLE ROW LEVEL SECURITY;

-- ===== BLOCKED SLOTS =====
CREATE TABLE public.professional_blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  starts_at TIMESTAMPTZ NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.professional_blocked_slots TO authenticated;
GRANT ALL ON public.professional_blocked_slots TO service_role;
ALTER TABLE public.professional_blocked_slots ENABLE ROW LEVEL SECURITY;

-- ===== APPOINTMENTS =====
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  modality public.appointment_modality NOT NULL DEFAULT 'presencial',
  status public.appointment_status NOT NULL DEFAULT 'agendada',
  notes TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  patient_notes TEXT,
  professional_notes TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by UUID REFERENCES auth.users,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_appt_patient ON public.appointments(patient_id);
CREATE INDEX idx_appt_prof ON public.appointments(professional_id);
CREATE INDEX idx_appt_scheduled ON public.appointments(scheduled_at);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.appointments TO authenticated;
GRANT ALL ON public.appointments TO service_role;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER trg_appt_updated BEFORE UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ===== HEALTH DOCUMENTS =====
CREATE TABLE public.health_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'exame',
  file_url TEXT,
  notes TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_documents TO authenticated;
GRANT ALL ON public.health_documents TO service_role;
ALTER TABLE public.health_documents ENABLE ROW LEVEL SECURITY;

-- ===== MESSAGES =====
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  content TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_msg_appt ON public.messages(appointment_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- ===== REVIEWS =====
CREATE TABLE public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL UNIQUE REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
  rating SMALLINT NOT NULL CHECK (rating BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ===== PAYMENTS =====
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  amount NUMERIC(10,2) NOT NULL,
  status public.payment_status NOT NULL DEFAULT 'pendente',
  method TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.payments TO authenticated;
GRANT ALL ON public.payments TO service_role;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- ===== NOTIFICATIONS =====
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT,
  link TEXT,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_notif_user ON public.notifications(user_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ===== RLS POLICIES =====

-- profiles
CREATE POLICY "profiles self read" ON public.profiles FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles self upsert" ON public.profiles FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles self update" ON public.profiles FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "profiles admin delete" ON public.profiles FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- user_roles
CREATE POLICY "roles self read" ON public.user_roles FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));
-- Inserts/updates/deletes must be done by service_role (server function only)

-- specialties (public read; admin write via service_role)
CREATE POLICY "specialties public read" ON public.specialties FOR SELECT
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

-- professionals
-- Public can see only approved professionals (for search)
CREATE POLICY "prof public approved read" ON public.professionals FOR SELECT
  USING (status = 'aprovado' OR auth.uid() = id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "prof self insert" ON public.professionals FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id);
CREATE POLICY "prof self/admin update" ON public.professionals FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.has_role(auth.uid(), 'admin'));

-- availability
CREATE POLICY "avail public read" ON public.professional_availability FOR SELECT USING (true);
CREATE POLICY "avail self manage" ON public.professional_availability FOR ALL TO authenticated
  USING (auth.uid() = professional_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = professional_id OR public.has_role(auth.uid(), 'admin'));

-- blocked slots
CREATE POLICY "blocked read" ON public.professional_blocked_slots FOR SELECT USING (true);
CREATE POLICY "blocked self manage" ON public.professional_blocked_slots FOR ALL TO authenticated
  USING (auth.uid() = professional_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = professional_id OR public.has_role(auth.uid(), 'admin'));

-- appointments
CREATE POLICY "appt participants read" ON public.appointments FOR SELECT TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = professional_id OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "appt patient insert" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);
CREATE POLICY "appt participants update" ON public.appointments FOR UPDATE TO authenticated
  USING (auth.uid() = patient_id OR auth.uid() = professional_id OR public.has_role(auth.uid(), 'admin'));

-- health_documents (paciente dono; profissional pode ler se vinculado por consulta)
CREATE POLICY "docs patient manage" ON public.health_documents FOR ALL TO authenticated
  USING (auth.uid() = patient_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = patient_id);

-- messages (apenas participantes da consulta)
CREATE POLICY "msg participants read" ON public.messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.appointments a WHERE a.id = appointment_id
      AND (a.patient_id = auth.uid() OR a.professional_id = auth.uid())
  ) OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY "msg participants insert" ON public.messages FOR INSERT TO authenticated
  WITH CHECK (sender_id = auth.uid() AND EXISTS (
    SELECT 1 FROM public.appointments a WHERE a.id = appointment_id
      AND (a.patient_id = auth.uid() OR a.professional_id = auth.uid())
      AND a.status IN ('agendada','confirmada','em_andamento','realizada')
  ));

-- reviews
CREATE POLICY "reviews public read" ON public.reviews FOR SELECT USING (true);
CREATE POLICY "reviews patient insert" ON public.reviews FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id AND EXISTS (
    SELECT 1 FROM public.appointments a WHERE a.id = appointment_id
      AND a.patient_id = auth.uid() AND a.status = 'realizada'
  ));

-- payments
CREATE POLICY "payments self read" ON public.payments FOR SELECT TO authenticated
  USING (auth.uid() = patient_id OR public.has_role(auth.uid(), 'admin')
    OR EXISTS (SELECT 1 FROM public.appointments a WHERE a.id = appointment_id AND a.professional_id = auth.uid()));
CREATE POLICY "payments patient insert" ON public.payments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = patient_id);

-- notifications
CREATE POLICY "notif self read" ON public.notifications FOR SELECT TO authenticated
  USING (auth.uid() = user_id);
CREATE POLICY "notif self update" ON public.notifications FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

-- ===== TRIGGER: auto-create profile + paciente role on signup =====
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, phone)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    NEW.email,
    NEW.raw_user_meta_data->>'phone'
  );
  -- Default role: paciente (profissional pode ser adicionado depois)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'paciente'));
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ===== TRIGGER: atualizar rating do profissional após review =====
CREATE OR REPLACE FUNCTION public.recompute_professional_rating()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE public.professionals p SET
    rating_average = COALESCE((SELECT AVG(rating)::numeric(3,2) FROM public.reviews WHERE professional_id = p.id), 0),
    rating_count = (SELECT COUNT(*) FROM public.reviews WHERE professional_id = p.id)
  WHERE p.id = NEW.professional_id;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_recompute_rating AFTER INSERT ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_professional_rating();

-- ===== Seed specialties =====
INSERT INTO public.specialties (name, slug, icon) VALUES
  ('Cardiologia', 'cardiologia', 'heart-pulse'),
  ('Pediatria', 'pediatria', 'baby'),
  ('Dermatologia', 'dermatologia', 'sparkles'),
  ('Psicologia', 'psicologia', 'brain'),
  ('Psiquiatria', 'psiquiatria', 'brain-circuit'),
  ('Clínico Geral', 'clinico-geral', 'stethoscope'),
  ('Ginecologia', 'ginecologia', 'flower'),
  ('Ortopedia', 'ortopedia', 'bone'),
  ('Nutrição', 'nutricao', 'apple'),
  ('Oftalmologia', 'oftalmologia', 'eye');
