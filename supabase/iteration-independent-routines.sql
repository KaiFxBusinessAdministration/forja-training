-- Rutinas creadas por atletas independientes.
-- Ejecutar una sola vez en Supabase SQL Editor.

alter table public.routines
  add column if not exists owner_id uuid references public.profiles(id) on delete cascade;

alter table public.profiles
  add column if not exists age integer check (age is null or age between 10 and 100),
  add column if not exists goal text,
  add column if not exists weight_kg numeric(6,2) check (weight_kg is null or weight_kg > 0),
  add column if not exists height_cm numeric(5,2) check (height_cm is null or height_cm > 0);

alter table public.profiles
  add column if not exists emergency_contact_name text,
  add column if not exists emergency_contact_phone text;

alter table public.progress_logs
  add column if not exists sets_completed integer check (sets_completed is null or sets_completed >= 0);

alter table public.routines
  alter column trainer_id drop not null;

update public.routines
set owner_id = coalesce(owner_id, client_id, trainer_id)
where owner_id is null;

alter table public.routines
  alter column owner_id set not null;

drop policy if exists routines_member_read on public.routines;
drop policy if exists routines_trainer_insert on public.routines;
drop policy if exists routines_trainer_update on public.routines;
drop policy if exists routines_trainer_delete on public.routines;

create policy routines_member_read on public.routines
for select using (
  owner_id = auth.uid()
  or trainer_id = auth.uid()
  or client_id = auth.uid()
  or public.is_admin()
);

create policy routines_owner_insert on public.routines
for insert with check (
  owner_id = auth.uid()
  and (
    (trainer_id = auth.uid() and client_id is not null and public.is_trainer_of(client_id))
    or (trainer_id is null and client_id = auth.uid())
  )
);

create policy routines_owner_update on public.routines
for update using (owner_id = auth.uid() or trainer_id = auth.uid())
with check (owner_id = auth.uid() or trainer_id = auth.uid());

create policy routines_owner_delete on public.routines
for delete using (owner_id = auth.uid() or trainer_id = auth.uid());

drop policy if exists routine_exercises_trainer_manage on public.routine_exercises;
create policy routine_exercises_owner_manage on public.routine_exercises
for all using (
  exists (select 1 from public.routines r
    where r.id = routine_id and (r.owner_id = auth.uid() or r.trainer_id = auth.uid()))
)
with check (
  exists (select 1 from public.routines r
    where r.id = routine_id and (r.owner_id = auth.uid() or r.trainer_id = auth.uid()))
);
