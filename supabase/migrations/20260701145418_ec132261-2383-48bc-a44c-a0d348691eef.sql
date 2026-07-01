
ALTER TABLE public.platform_settings
  ADD COLUMN IF NOT EXISTS demo_mode BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS demo_mode_changed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS demo_mode_changed_by UUID;

-- Garante default desativado em produção
UPDATE public.platform_settings SET demo_mode = false WHERE id = 1 AND demo_mode IS NULL;
