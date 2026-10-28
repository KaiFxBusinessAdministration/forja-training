# Backend real de FLOW FITNESS

La aplicación está preparada para Supabase y Vercel.

## Configuración necesaria

1. Crear un proyecto en Supabase.
2. Ejecutar `schema.sql` en el SQL Editor.
3. Copiar:
   - Project URL
   - Publishable anon key
4. Pegarlos únicamente en `Assets/js/backend-config.js`:

```js
window.FLOW_BACKEND_CONFIG = {
  SUPABASE_URL: "https://TU-PROYECTO.supabase.co",
  SUPABASE_ANON_KEY: "TU_CLAVE_ANON_PUBLICA"
};
```

No usar la clave `service_role` en el navegador.

## Auth

En Supabase Auth se deben activar:

- Email/password.
- Confirmación de correo.
- Recuperación de contraseña.
- Google OAuth cuando exista el Client ID y Client Secret de Google.

El proveedor Google se configura en Supabase, nunca con secretos dentro de los HTML.

## Roles

Los roles válidos son `admin`, `trainer` y `client`. La relación entrenador-cliente se controla con `trainer_clients` y las políticas RLS impiden que un entrenador consulte clientes ajenos.

## Migración de la demo

Los datos actuales de `Data/clientes.json` y las rutinas almacenadas en `localStorage` deben migrarse una sola vez mediante un script administrativo, después de crear los usuarios reales. No se deben copiar datos de `localStorage` automáticamente para evitar mezclar usuarios o elevar privilegios.
