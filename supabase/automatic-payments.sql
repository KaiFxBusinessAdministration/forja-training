-- Etapa 7: base para pagos automáticos.
-- No procesa cobros ni almacena tarjetas. Stripe/otro proveedor se conectará después.

create table if not exists public.training_plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  amount numeric(10,2) not null check (amount >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  interval text not null default 'month' check (interval in ('month','one_time')),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists public.trainer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  plan_id uuid not null references public.training_plans(id),
  status text not null default 'pending' check (status in ('pending','active','paused','cancelled','past_due')),
  provider text check (provider is null or provider in ('manual','stripe')),
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (trainer_id, client_id, plan_id)
);

create table if not exists public.payment_events (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.trainer_subscriptions(id) on delete set null,
  provider text not null check (provider in ('manual','stripe')),
  provider_event_id text,
  event_type text not null,
  amount numeric(10,2) check (amount is null or amount >= 0),
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null default 'received' check (status in ('received','succeeded','failed','refunded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (provider, provider_event_id)
);

alter table public.training_plans enable row level security;
alter table public.trainer_subscriptions enable row level security;
alter table public.payment_events enable row level security;

drop policy if exists training_plans_read on public.training_plans;
create policy training_plans_read on public.training_plans for select to authenticated
using (active = true or public.is_admin());

drop policy if exists training_plans_admin_manage on public.training_plans;
create policy training_plans_admin_manage on public.training_plans for all to authenticated
using (public.is_admin()) with check (public.is_admin());

drop policy if exists trainer_subscriptions_member_read on public.trainer_subscriptions;
create policy trainer_subscriptions_member_read on public.trainer_subscriptions for select to authenticated
using (trainer_id = auth.uid() or client_id = auth.uid() or public.is_admin());

drop policy if exists trainer_subscriptions_client_request on public.trainer_subscriptions;
create policy trainer_subscriptions_client_request on public.trainer_subscriptions for insert to authenticated
with check (client_id = auth.uid());

drop policy if exists trainer_subscriptions_trainer_manage on public.trainer_subscriptions;
create policy trainer_subscriptions_trainer_manage on public.trainer_subscriptions for update to authenticated
using (trainer_id = auth.uid() or public.is_admin())
with check (trainer_id = auth.uid() or public.is_admin());

drop policy if exists payment_events_member_read on public.payment_events;
create policy payment_events_member_read on public.payment_events for select to authenticated
using (exists (
  select 1 from public.trainer_subscriptions s
  where s.id = subscription_id
    and (s.trainer_id = auth.uid() or s.client_id = auth.uid())
) or public.is_admin());

drop policy if exists payment_events_admin_insert on public.payment_events;
create policy payment_events_admin_insert on public.payment_events for insert to authenticated
with check (public.is_admin());

create index if not exists trainer_subscriptions_client_idx on public.trainer_subscriptions(client_id, status);
create index if not exists trainer_subscriptions_trainer_idx on public.trainer_subscriptions(trainer_id, status);
create index if not exists payment_events_subscription_idx on public.payment_events(subscription_id, created_at desc);

insert into public.training_plans (name, description, amount, interval)
select 'Acompañamiento personalizado', 'Plan inicial para probar el servicio con registro manual.', 0, 'month'
where not exists (select 1 from public.training_plans);
