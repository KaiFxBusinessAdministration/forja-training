-- Etapa 4: condiciones y registro manual de pagos.
-- Ejecutar una sola vez en Supabase SQL Editor.
alter table public.profiles
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
drop policy if exists trainer_payments_member_read on public.trainer_payments;
create policy trainer_payments_member_read on public.trainer_payments for select to authenticated
using (trainer_id = auth.uid() or client_id = auth.uid() or public.is_admin());
drop policy if exists trainer_payments_trainer_manage on public.trainer_payments;
create policy trainer_payments_trainer_manage on public.trainer_payments for all to authenticated
using (trainer_id = auth.uid() or public.is_admin())
with check (trainer_id = auth.uid() or public.is_admin());
