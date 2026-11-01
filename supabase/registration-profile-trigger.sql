-- Ejecutar una sola vez en Supabase SQL Editor.
-- Crea el perfil junto con la cuenta Auth, incluso cuando se exige confirmar el correo.
create or replace function public.handle_new_auth_profile()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  requested_role public.app_role;
begin
  requested_role := case
    when new.raw_user_meta_data->>'requested_role' = 'trainer' then 'trainer'::public.app_role
    else 'client'::public.app_role
  end;

  insert into public.profiles (id, full_name, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1), 'Atleta'),
    requested_role
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_auth_profile();
