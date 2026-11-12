-- Corrección de roles reales de Forja-Training.

update public.profiles p
set role = 'client'::public.app_role
from auth.users u
where p.id = u.id
  and lower(u.email) = 'marcoalencastrob@gmail.com';

update public.profiles p
set role = 'trainer'::public.app_role,
    trainer_verification_status = coalesce(trainer_verification_status, 'pending')
from auth.users u
where p.id = u.id
  and lower(u.email) = 'manuelalbertobarriga@gmail.com';

update public.trainer_clients tc
set status = 'inactive'
where tc.client_id = (select id from auth.users where lower(email) = 'marcoalencastrob@gmail.com')
  and tc.trainer_id = (select id from public.profiles where full_name = 'Administrador Forja Training');
