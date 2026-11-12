-- Etapa 1: datos profesionales del entrenador.
-- Ejecutar una sola vez en Supabase SQL Editor.
alter table public.profiles
  add column if not exists trainer_bio text,
  add column if not exists trainer_specialties text,
  add column if not exists trainer_service_mode text,
  add column if not exists trainer_location text;
