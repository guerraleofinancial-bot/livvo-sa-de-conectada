-- Add explicit FK from professionals.id -> profiles.id so PostgREST can embed.
-- Both are PK -> auth.users(id), but PostgREST needs a direct FK to resolve.
ALTER TABLE public.professionals
  ADD CONSTRAINT professionals_profile_fkey
  FOREIGN KEY (id) REFERENCES public.profiles(id) ON DELETE CASCADE;