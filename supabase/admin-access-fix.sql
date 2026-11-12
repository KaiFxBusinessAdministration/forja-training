-- Reparación de acceso administrativo para Forja-Training.
-- Ejecutar en el proyecto correcto: upeqqzpilnkqysmgfgcy.

-- Dependencias que pueden no existir todavía en el proyecto.
alter table public.profiles
  add column if not exists trainer_verification_status text not null default 'pending' check (trainer_verification_status in ('pending','verified','rejected')),
  add column if not exists trainer_certifications text,
  add column if not exists trainer_certificate_url text,
  add column if not exists trainer_verification_notes text,
  add column if not exists trainer_fee numeric(10,2) check (trainer_fee is null or trainer_fee >= 0),
  add column if not exists trainer_fee_frequency text,
  add column if not exists trainer_gym_included boolean not null default false,
  add column if not exists trainer_gym_fee numeric(10,2) check (trainer_gym_fee is null or trainer_gym_fee >= 0),
  add column if not exists trainer_payment_terms text;

create table if not exists public.trainer_payments (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  amount numeric(10,2) not null check (amount >= 0),
  concept text not null,
  status text not null default 'paid' check (status in ('paid','pending','cancelled')),
  paid_at timestamptz not null default now(),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.trainer_payments enable row level security;
create index if not exists trainer_payments_trainer_idx on public.trainer_payments(trainer_id, paid_at desc);
create index if not exists trainer_payments_client_idx on public.trainer_payments(client_id, paid_at desc);

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
