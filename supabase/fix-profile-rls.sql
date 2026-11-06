-- Corrección RLS para el alta y el primer acceso.
-- Ejecutar una sola vez en Supabase SQL Editor.
alter table public.profiles enable row level security;

drop policy if exists profiles_insert_self on public.profiles;
create policy profiles_insert_self on public.profiles
for insert to authenticated
with check (
  id = auth.uid()
  and role in ('client'::public.app_role, 'trainer'::public.app_role)
);

-- El trigger crea el perfil antes de que el usuario confirme el correo.
-- La política anterior solo funciona como respaldo para sesiones ya autenticadas.
