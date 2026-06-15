-- Add 'empresa' to app_role enum (idempotent)
DO $$ BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'empresa';
EXCEPTION WHEN duplicate_object THEN NULL; END $$;