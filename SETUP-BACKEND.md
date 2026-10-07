# Backend: Supabase + Resend + Turnstile

Arquitectura: SPA estática (React/Vite) → Supabase Auth (correo + contraseña + MFA obligatorio) → PostgreSQL con RLS.
El formulario público llama a la Edge Function `submit-lead` (anti-bot Turnstile → guarda → correo por Resend).

## Ya aplicado en el proyecto `klvdmrkwscmzpzyuquih`
- Migración `supabase/migrations/001_leads.sql` (tablas `admin_emails`, `leads`, función `is_admin()`, RLS, Realtime).
- Edge Function `submit-lead` desplegada (`verify_jwt=false`: es pública; la protección es Turnstile + origen permitido).

## Lo que falta (necesita tus cuentas)
1. **Administrador**: Supabase → Authentication → Users → *Add user* → `sarebidea@sarebidea.com` + contraseña fuerte (marca *Auto Confirm*).
2. **Cerrar el registro**: Authentication → Sign In / Providers → desactiva *Allow new users to sign up*.
3. **MFA**: Authentication → Multi-Factor → comprueba que *TOTP* está activado.
4. **URL Configuration**: *Site URL* = tu dominio de producción.
5. **Resend**: verifica el dominio `sarebidea.com` en resend.com y crea una API key.
6. **Turnstile**: en Cloudflare → Turnstile → crea un widget para tu dominio (site key pública + secret key).
7. **Secretos de la función** (Supabase → Edge Functions → Secrets, o `supabase secrets set`):
   ```
   RESEND_API_KEY=re_xxx
   TURNSTILE_SECRET_KEY=0x4AAAA_secreta
   ALLOWED_ORIGINS=https://sarebidea.com,https://www.sarebidea.com,http://localhost:5173
   ```
   Opcionales: `NOTIFY_TO`, `NOTIFY_FROM` (por defecto `Web SAREBIDEA <sarebidea@sarebidea.com>`).
8. **Variables de la web** (solo públicas; `.env` o variables del hosting, ver `.env.example`):
   `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, `VITE_TURNSTILE_SITE_KEY`.

## Seguridad
- Los visitantes no tienen ningún permiso sobre las tablas. Solo pueden llamar a `submit-lead`.
- Leer/editar/borrar exige correo en `admin_emails` **y** sesión con segundo factor (`aal2`), comprobado en la base de datos.
- Nunca pongas `service_role`, la clave de Resend ni la secret de Turnstile en el frontend o en variables `VITE_`.
- Primer acceso: `/#area-privada` → correo y contraseña → escanea el QR → código de 6 cifras.
