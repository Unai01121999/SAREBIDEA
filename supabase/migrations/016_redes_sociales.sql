-- Enlaces a las cuentas de Instagram y Facebook que se muestran en el pie de la web pública.
-- Se escriben en el panel (Configuración → Datos de la empresa) y se guardan en ajustes.datos.company (instagramUrl, facebookUrl).
-- La web pública (visitante anónimo) NO puede leer la tabla de ajustes: solo puede llamar a esta función, que devuelve únicamente
-- esos dos enlaces y solo si empiezan por http:// o https:// (así nunca se publica un esquema peligroso como javascript:).
create or replace function public.redes_sociales() returns json language sql stable security definer set search_path to 'public' as $fn$
  select json_build_object(
    'instagram', coalesce((select case when (datos->'company'->>'instagramUrl') ~* '^https?://' then datos->'company'->>'instagramUrl' end from public.ajustes where id = 1), ''),
    'facebook',  coalesce((select case when (datos->'company'->>'facebookUrl') ~* '^https?://' then datos->'company'->>'facebookUrl' end from public.ajustes where id = 1), '')
  )
$fn$;
revoke all on function public.redes_sociales() from public;
grant execute on function public.redes_sociales() to anon, authenticated;
