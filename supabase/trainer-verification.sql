-- Etapa 6: validación documental de entrenadores.
alter table public.profiles
  add column if not exists trainer_verification_status text not null default 'pending' check (trainer_verification_status in ('pending','verified','rejected')),
  add column if not exists trainer_certifications text,
  add column if not exists trainer_certificate_url text,
  add column if not exists trainer_verification_notes text;

drop policy if exists profiles_admin_verification on public.profiles;
create policy profiles_admin_verification on public.profiles for update to authenticated
using (public.is_admin()) with check (public.is_admin());
