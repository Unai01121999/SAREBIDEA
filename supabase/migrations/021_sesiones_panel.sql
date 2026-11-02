-- 021 · Sesiones del panel con caducidad en el servidor (ya aplicada en el proyecto).
-- Una sesión del panel solo da acceso durante 12 horas desde que se inició: panel_role() comprueba la sesión del token
-- (claim session_id) en auth.sessions. Un token robado deja de servir a las 12 h o en cuanto se cierra la sesión.
create or replace function public.panel_role()
 returns text language sql stable security definer set search_path to 'public'
as $function$
  select u.rol from public.usuarios_panel u
   where lower(u.correo) = lower(coalesce(auth.jwt()->>'email', '')) and u.activo
     and coalesce(auth.jwt()->>'aal', '') = 'aal2'
     and exists (select 1 from auth.sessions s
                  where s.id = nullif(auth.jwt()->>'session_id', '')::uuid
                    and s.created_at > now() - interval '12 hours')
   limit 1;
$function$;

-- Cada hora se borran las sesiones de más de 12 horas; sus tokens de renovación caen con ellas (ON DELETE CASCADE).
create or replace function public.cerrar_sesiones_caducadas()
 returns integer language plpgsql security definer set search_path to 'public'
as $function$
declare n integer;
begin
  delete from auth.sessions where created_at < now() - interval '12 hours';
  get diagnostics n = row_count;
  return n;
end $function$;
revoke execute on function public.cerrar_sesiones_caducadas() from public, anon, authenticated;
select cron.schedule('cerrar-sesiones-caducadas', '17 * * * *', 'select public.cerrar_sesiones_caducadas()');
