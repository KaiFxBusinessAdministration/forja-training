-- Ejecutar una sola vez en Supabase SQL Editor.
-- Permite que una cuenta recién creada cree únicamente su propio perfil.
create policy profiles_insert_self on public.profiles
for insert to authenticated
with check (id = auth.uid() and role = 'client');
