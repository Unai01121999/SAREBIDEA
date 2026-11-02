-- 020 · CAPTCHA del formulario de contacto (ya aplicada en el proyecto).
-- El formulario ya no escribe directamente en `solicitudes`: lo envía a la Edge Function `enviar-solicitud`
-- (supabase/functions/enviar-solicitud), que comprueba Cloudflare Turnstile en el servidor (secreto TURNSTILE_SECRET_KEY),
-- aplica límites por IP y por correo y guarda la solicitud con la clave de servicio.
-- Huellas (SHA-256) de las IP que envían el formulario, para el límite por IP. Solo se guardan 2 días.
create table if not exists public.envios_formulario (
  id bigint generated always as identity primary key,
  ip_hash text not null,
  creado_el timestamptz not null default now()
);
create index if not exists envios_formulario_ip on public.envios_formulario (ip_hash, creado_el);
alter table public.envios_formulario enable row level security;
revoke all on public.envios_formulario from anon, authenticated;

-- PASO 2 (cuando la web nueva esté subida a Hostinger): cerrar la vía directa, que se salta el CAPTCHA.
-- revoke insert on public.solicitudes from anon;
-- drop policy if exists "formulario publico inserta" on public.solicitudes;
