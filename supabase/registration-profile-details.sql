-- Ejecutar una sola vez en Supabase SQL Editor.
alter table public.profiles
  add column if not exists phone_country text,
  add column if not exists phone text,
  add column if not exists sex text check (sex is null or sex in ('Masculino','Femenino'));

create or replace function public.handle_new_auth_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare requested_role public.app_role;
begin
  requested_role := case when new.raw_user_meta_data->>'requested_role' = 'trainer'
    then 'trainer'::public.app_role else 'client'::public.app_role end;
  insert into public.profiles (id, full_name, role, phone_country, phone, sex, age, height_cm)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Atleta'),
    requested_role,
    new.raw_user_meta_data->>'phone_country',
    new.raw_user_meta_data->>'phone',
    new.raw_user_meta_data->>'sex',
    nullif(new.raw_user_meta_data->>'age','')::integer,
    nullif(new.raw_user_meta_data->>'height_cm','')::numeric
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_auth_profile();
