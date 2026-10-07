# Puesta en marcha: acceso seguro y aviso por correo

Esto activa, en la web publicada:

1. **Área privada con Google + segundo factor.** Solo entra `sarebidea@sarebidea.com`: primero con su cuenta de Google y después con un código de 6 cifras de una app de autenticación (Google Authenticator, Authy, 1Password…).
2. **Correo "Nuevo Cliente"** a `sarebidea@sarebidea.com` cada vez que alguien envía el formulario, con nombre, teléfono, correo, tipo de negocio, descripción, ID y fecha. Al pulsar "Responder" le escribes directamente al cliente.

Se usan dos servicios con plan gratuito: **Supabase** (login, base de datos) y **Resend** (envío de correos). Sin las variables de entorno, la web funciona como hasta ahora (vista previa / modo local).

> Requisito: `sarebidea@sarebidea.com` tiene que poder iniciar sesión con Google (Google Workspace, o una cuenta de Google creada con ese correo).

## 1. Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (región: Europa).
2. **SQL Editor** → pega y ejecuta `supabase/migrations/001_leads.sql`.
3. **Authentication → Sign In / Providers → Google**: actívalo. Necesitas un *Client ID* y *Client secret* de Google Cloud:
   - [console.cloud.google.com](https://console.cloud.google.com) → APIs y servicios → Credenciales → Crear credenciales → ID de cliente de OAuth → Aplicación web.
   - *URI de redireccionamiento autorizados*: la que te muestra Supabase (`https://TU_PROYECTO.supabase.co/auth/v1/callback`).
4. **Authentication → URL Configuration**: *Site URL* = `https://sarebidea.com` y añade `https://sarebidea.com/**` (y `http://localhost:5173/**` para probar) en *Redirect URLs*.
5. **Authentication → Multi-Factor**: comprueba que *TOTP (App Authenticator)* está activado (lo está por defecto).
6. **Authentication → Sign In / Providers**: desactiva *Allow new users to sign up* con email si no lo vas a usar. Aunque alguien entre con otra cuenta de Google, la base de datos solo le deja ver datos si su correo está en `admin_emails` **y** ha pasado el segundo factor.

## 2. Correo con Resend

1. Crea una cuenta en [resend.com](https://resend.com) → *Domains* → añade `sarebidea.com` y copia los registros DNS que te da en tu proveedor de dominio. Espera a que salga *Verified*.
2. *API Keys* → crea una clave.
3. Despliega la función (con la [CLI de Supabase](https://supabase.com/docs/guides/cli)):

   ```bash
   supabase login
   supabase link --project-ref TU_PROYECTO
   supabase secrets set RESEND_API_KEY=re_xxx WEBHOOK_SECRET=una-frase-larga-y-aleatoria
   supabase functions deploy notify-new-lead --no-verify-jwt
   ```

   Opcional: `NOTIFY_TO` (destinatario, por defecto sarebidea@sarebidea.com) y `NOTIFY_FROM` (remitente, por defecto `Web SAREBIDEA <web@sarebidea.com>`).
4. Abre `supabase/migrations/002_aviso_por_correo.sql`, sustituye `TU_PROYECTO` y `TU_SECRETO` (el mismo `WEBHOOK_SECRET`) y ejecútalo en el SQL Editor.

## 3. Variables de la web

En tu hosting (Vercel, Netlify…) o en un archivo `.env` (ver `.env.example`):

```
VITE_SUPABASE_URL=https://TU_PROYECTO.supabase.co
VITE_SUPABASE_ANON_KEY=…   (Project Settings → API → anon public)
VITE_ADMIN_EMAILS=sarebidea@sarebidea.com
```

Después: `npm run build` y publica la carpeta `dist/`.

## 4. Primer acceso

1. Entra en `https://sarebidea.com/#area-privada` → **Continuar con Google** → elige `sarebidea@sarebidea.com`.
2. La primera vez aparece un **código QR**: escanéalo con la app de autenticación y escribe el código de 6 cifras.
3. A partir de ahí, cada acceso pide Google + el código de la app.

**Dar acceso a otra persona:** añade su correo en la tabla `admin_emails` (Table Editor) y en `VITE_ADMIN_EMAILS`.
**Móvil perdido:** en Supabase → Authentication → Users → el usuario → borra su factor; en el siguiente acceso verás un QR nuevo.

## Seguridad, en resumen

- Los visitantes solo pueden **crear** una solicitud con los 5 campos del formulario; no pueden leer ni cambiar nada (permisos por columna + RLS).
- Leer, editar o borrar exige correo autorizado y sesión con segundo factor (`aal2`), comprobado en la base de datos, no solo en la web.
- La función de correo solo acepta llamadas con el `WEBHOOK_SECRET`.
