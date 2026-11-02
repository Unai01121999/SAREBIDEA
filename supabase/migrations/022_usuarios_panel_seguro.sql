-- 022 · Gestión de usuarios del panel más segura (ya aplicada en el proyecto).
-- 1) Los roles se asignan por la cuenta de acceso (auth.uid()), no por el correo del token.
create or replace function public.panel_role()
 returns text language sql stable security definer set search_path to 'public'
as $function$
  select u.rol from public.usuarios_panel u
   where u.id_autenticacion = auth.uid() and u.activo
     and coalesce(auth.jwt()->>'aal', '') = 'aal2'
     and exists (select 1 from auth.sessions s
                  where s.id = nullif(auth.jwt()->>'session_id', '')::uuid
                    and s.created_at > now() - interval '12 hours')
   limit 1;
$function$;
create or replace function public.panel_me()
 returns jsonb language sql stable security definer set search_path to 'public'
as $function$
  select jsonb_build_object('name', u.nombre, 'email', u.correo, 'role', u.rol)
    from public.usuarios_panel u where u.id_autenticacion = auth.uid() and u.activo limit 1;
$function$;
create or replace function public.my_panel_role()
 returns text language sql stable security definer set search_path to 'public'
as $function$
  select u.rol from public.usuarios_panel u where u.id_autenticacion = auth.uid() and u.activo limit 1;
$function$;

-- 2) Cerrar sesiones / borrar el doble factor de un usuario (solo la función manage-panel-users, con la clave de servicio).
create or replace function public.reiniciar_acceso_usuario(p_user uuid, p_borrar_factores boolean)
 returns jsonb language plpgsql security definer set search_path to 'public'
as $function$
declare s int; f int := 0;
begin
  delete from auth.sessions where user_id = p_user;
  get diagnostics s = row_count;
  if p_borrar_factores then
    delete from auth.mfa_factors where user_id = p_user;
    get diagnostics f = row_count;
  end if;
  return jsonb_build_object('sesiones', s, 'factores', f);
end $function$;
revoke execute on function public.reiniciar_acceso_usuario(uuid, boolean) from public, anon, authenticated;
grant execute on function public.reiniciar_acceso_usuario(uuid, boolean) to service_role;

-- 3) Estado del doble factor de cada usuario, solo para quien gestiona usuarios.
create or replace function public.estado_doble_factor()
 returns table(id text, doble_factor boolean) language sql stable security definer set search_path to 'public'
as $function$
  select u.id, exists (select 1 from auth.mfa_factors f where f.user_id = u.id_autenticacion and f.status = 'verified')
    from public.usuarios_panel u
   where public.panel_can('settings', 'write');
$function$;
revoke execute on function public.estado_doble_factor() from public, anon;
grant execute on function public.estado_doble_factor() to authenticated;
