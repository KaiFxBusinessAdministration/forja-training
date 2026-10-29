-- FLOW FITNESS / FORJA TRAINING
-- Ejecutar en Supabase SQL Editor.

create type public.app_role as enum ('admin', 'trainer', 'client');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role public.app_role not null default 'client',
  weight_kg numeric(6,2) check (weight_kg is null or weight_kg > 0),
  height_cm numeric(5,2) check (height_cm is null or height_cm > 0),
  avatar_url text,
  created_at timestamptz not null default now()
);

create table public.trainer_clients (
  trainer_id uuid not null references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active','pending','inactive')),
  created_at timestamptz not null default now(),
  primary key (trainer_id, client_id),
  check (trainer_id <> client_id)
);

create table public.routines (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  trainer_id uuid references public.profiles(id) on delete cascade,
  client_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  day_name text not null,
  warmup_steps jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.routine_exercises (
  id uuid primary key default gen_random_uuid(),
  routine_id uuid not null references public.routines(id) on delete cascade,
  exercise_id text not null,
  exercise_name text not null,
  muscle_group text,
  sets integer not null default 3 check (sets > 0 and sets <= 50),
  reps text not null default '12',
  weight numeric(7,2),
  rest_seconds integer check (rest_seconds is null or (rest_seconds >= 0 and rest_seconds <= 3600)),
  position integer not null default 0,
  notes text
);

create table public.progress_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.profiles(id) on delete cascade,
  routine_exercise_id uuid references public.routine_exercises(id) on delete set null,
  exercise_name text not null,
  weight numeric(7,2),
  sets_completed integer check (sets_completed is null or sets_completed >= 0),
  repetitions integer check (repetitions is null or repetitions >= 0),
  notes text,
  recorded_at timestamptz not null default now()
);

create table public.performance_profiles (
  client_id uuid primary key references public.profiles(id) on delete cascade,
  tracking_type text not null default 'General' check (tracking_type in ('General','Rendimiento','Preparación para competencia')),
  sport_goal text,
  supplementation text,
  medical_follow_up text,
  performance_notes text,
  updated_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

create or replace function public.is_trainer_of(target_client uuid) returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.trainer_clients where trainer_id = auth.uid() and client_id = target_client and status = 'active');
$$;

alter table public.profiles enable row level security;
alter table public.trainer_clients enable row level security;
alter table public.routines enable row level security;
alter table public.routine_exercises enable row level security;
alter table public.progress_logs enable row level security;
alter table public.performance_profiles enable row level security;

create policy profiles_self_or_admin on public.profiles for select using (id = auth.uid() or public.is_admin());
create policy profiles_update_self on public.profiles for update using (id = auth.uid());
create policy trainer_clients_visible_to_members on public.trainer_clients for select using (trainer_id = auth.uid() or client_id = auth.uid() or public.is_admin());
create policy trainer_clients_admin_manage on public.trainer_clients for all using (public.is_admin()) with check (public.is_admin());

create policy routines_member_read on public.routines for select using (owner_id = auth.uid() or trainer_id = auth.uid() or client_id = auth.uid() or public.is_admin());
create policy routines_owner_insert on public.routines for insert with check (owner_id = auth.uid() and ((trainer_id = auth.uid() and public.is_trainer_of(client_id)) or (trainer_id is null and client_id = auth.uid())));
create policy routines_owner_update on public.routines for update using (owner_id = auth.uid() or trainer_id = auth.uid()) with check (owner_id = auth.uid() or trainer_id = auth.uid());
create policy routines_owner_delete on public.routines for delete using (owner_id = auth.uid() or trainer_id = auth.uid());

create policy routine_exercises_member_read on public.routine_exercises for select using (exists (select 1 from public.routines r where r.id = routine_id and (r.trainer_id = auth.uid() or r.client_id = auth.uid() or public.is_admin())));
create policy routine_exercises_owner_manage on public.routine_exercises for all using (exists (select 1 from public.routines r where r.id = routine_id and (r.owner_id = auth.uid() or r.trainer_id = auth.uid()))) with check (exists (select 1 from public.routines r where r.id = routine_id and (r.owner_id = auth.uid() or r.trainer_id = auth.uid())));

create policy progress_client_read_insert on public.progress_logs for select using (client_id = auth.uid() or public.is_trainer_of(client_id) or public.is_admin());
create policy progress_client_create on public.progress_logs for insert with check (client_id = auth.uid());
create policy performance_member_read on public.performance_profiles for select using (client_id = auth.uid() or public.is_trainer_of(client_id) or public.is_admin());
create policy performance_trainer_manage on public.performance_profiles for all using (public.is_trainer_of(client_id) or public.is_admin()) with check (public.is_trainer_of(client_id) or public.is_admin());

create index routines_client_idx on public.routines(client_id, day_name);
create index progress_logs_client_idx on public.progress_logs(client_id, recorded_at desc);
