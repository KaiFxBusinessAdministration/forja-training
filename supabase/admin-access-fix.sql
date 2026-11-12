-- Reparación de acceso administrativo para Forja-Training.
-- Ejecutar en el proyecto correcto: upeqqzpilnkqysmgfgcy.

alter table public.profiles
  add column if not exists trainer_verification_status text not null default 'pending'
    check (trainer_verification_status in ('pending','verified','rejected')),
  add column if not exists trainer_certifications text,
  add column if not exists trainer_certificate_url text,
  add column if not exists trainer_verification_notes text;

do $$
declare
  admin_id uuid;
begin
  select id into admin_id
  from auth.users
  where email = 'forja-admin@forjaentrenamiento.vercel.app'
  limit 1;

  if admin_id is null then
    raise exception 'No existe el usuario forja-admin en Auth';
  end if;

  insert into public.profiles (id, full_name, role)
  values (admin_id, 'Administrador Forja Training', 'admin'::public.app_role)
  on conflict (id) do update
    set role = 'admin'::public.app_role,
        full_name = coalesce(public.profiles.full_name, 'Administrador Forja Training');
end $$;

drop policy if exists profiles_admin_read on public.profiles;
create policy profiles_admin_read on public.profiles
for select to authenticated
using (public.is_admin() or id = auth.uid());

drop policy if exists admin_directory_read on public.profiles;
create policy admin_directory_read on public.profiles
for select to authenticated
using (public.is_admin() or id = auth.uid() or role = 'trainer'::public.app_role and trainer_verification_status = 'verified');

drop policy if exists admin_requests_read on public.trainer_clients;
create policy admin_requests_read on public.trainer_clients
for select to authenticated
using (public.is_admin() or trainer_id = auth.uid() or client_id = auth.uid());

drop policy if exists admin_payments_read on public.trainer_payments;
create policy admin_payments_read on public.trainer_payments
for select to authenticated
using (public.is_admin() or trainer_id = auth.uid() or client_id = auth.uid());
