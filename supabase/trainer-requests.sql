-- Etapa 2: solicitudes atleta-entrenador.
-- Ejecutar una sola vez en Supabase SQL Editor.
alter table public.trainer_clients enable row level security;

drop policy if exists trainer_clients_client_request on public.trainer_clients;
create policy trainer_clients_client_request on public.trainer_clients
for insert to authenticated
with check (client_id = auth.uid() and status = 'pending');

drop policy if exists trainer_clients_trainer_review on public.trainer_clients;
create policy trainer_clients_trainer_review on public.trainer_clients
for update to authenticated
using (trainer_id = auth.uid())
with check (trainer_id = auth.uid() and status in ('active','inactive','pending'));

drop policy if exists trainer_profiles_directory_read on public.profiles;
create policy trainer_profiles_directory_read on public.profiles
for select to authenticated
using (role = 'trainer'::public.app_role or id = auth.uid() or public.is_admin());
