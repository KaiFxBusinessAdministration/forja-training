-- Corrige el perfil técnico que quedó registrado como entrenador de prueba.
update public.profiles
set role = 'admin'::public.app_role,
    trainer_verification_status = 'verified'
where full_name = 'Administrador Forja Training';

-- Conserva la solicitud histórica, pero deja de mostrarla como activa.
update public.trainer_clients
set status = 'inactive'
where trainer_id in (
  select id from public.profiles where full_name = 'Administrador Forja Training'
);
