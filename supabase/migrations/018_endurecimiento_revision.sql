-- 018 · Endurecimiento tras la revisión de seguridad (octubre de 2026).
-- 1) Funciones internas fuera del alcance de anon/authenticated. 2) Numeración de facturas única y atómica.
-- 3) Límite antispam del formulario público. 4) Validaciones en la base de datos. 5) Autor fiable en notas e historial.
-- 6) Escrituras atómicas para los servicios del cliente y los ajustes.

-- 1 · Funciones internas: solo las usan otras funciones SECURITY DEFINER o disparadores.
alter function public.precio_renovacion(text) set search_path = public;
revoke execute on function public.sincronizar_coste_dominios(text) from public, anon, authenticated;
revoke execute on function public.pack_del_dominio(text, text) from public, anon, authenticated;
revoke execute on function public.precio_renovacion(text) from public, anon, authenticated;
revoke execute on function public.log_activity() from public, anon, authenticated;
revoke execute on function public.trg_sincronizar_coste_dominios() from public, anon, authenticated;

-- 2 · Numeración de facturas: F-AAAA-NNN, con el año de la fecha de emisión y un único cerrojo por año,
--     compartido por el panel (disparador) y las tareas automáticas.
create or replace function public.siguiente_numero_factura(p_fecha timestamptz)
returns text language plpgsql security definer set search_path = public as $$
declare anio int := extract(year from (coalesce(p_fecha, now()) at time zone 'Europe/Madrid'))::int; maxn int;
begin
  perform pg_advisory_xact_lock(hashtext('numero_factura_' || anio));
  select coalesce(max(split_part(numero, '-', 3)::int), 0) into maxn
    from public.facturas where numero ~ ('^F-' || anio || '-[0-9]+$');
  return 'F-' || anio || '-' || lpad((maxn + 1)::text, 3, '0');
end $$;
revoke execute on function public.siguiente_numero_factura(timestamptz) from public, anon, authenticated;

-- Si el panel deja el número vacío, la base de datos asigna el siguiente.
create or replace function public.trg_numero_factura()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(btrim(new.numero), '') = '' then new.numero := public.siguiente_numero_factura(new.fecha_emision); end if;
  return new;
end $$;
revoke execute on function public.trg_numero_factura() from public, anon, authenticated;
drop trigger if exists facturas_numero on public.facturas;
create trigger facturas_numero before insert on public.facturas for each row execute function public.trg_numero_factura();

alter table public.facturas add constraint facturas_numero_formato check (numero ~ '^F-[0-9]{4}-[0-9]+$');

-- Las tareas automáticas dejan el número vacío y lo pone el disparador (mismo cerrojo y mismo año que el panel).
do $$
declare f text; d text;
begin
  foreach f in array array['public.generar_facturas_mantenimiento()','public.generar_facturas_renovacion()'] loop
    d := pg_get_functiondef(f::regprocedure);
    d := replace(d, E'select coalesce(max(nullif(split_part(numero, ''-'', 3), '''')::int), 0) into maxn from public.facturas where numero like ''F-'' || anio || ''-%'';', '');
    d := replace(d, $r$'F-' || anio || '-' || lpad((maxn + 1)::text, 3, '0')$r$, $r$''$r$);
    if position('maxn + 1' in d) > 0 or position('split_part' in d) > 0 then raise exception 'no reemplazado en %', f; end if;
    execute d;
  end loop;
end $$;

-- 3 · Antispam del formulario público: como mucho 3 solicitudes por correo y hora y 20 en total cada 10 minutos.
create or replace function public.trg_limite_solicitudes()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if coalesce(auth.role(), 'anon') <> 'anon' then return new; end if;
  if (select count(*) from public.solicitudes where lower(correo) = lower(new.correo) and creado_el > now() - interval '1 hour') >= 3
     or (select count(*) from public.solicitudes where creado_el > now() - interval '10 minutes') >= 20 then
    raise exception 'demasiadas_solicitudes' using errcode = 'P0001';
  end if;
  return new;
end $$;
revoke execute on function public.trg_limite_solicitudes() from public, anon, authenticated;
drop trigger if exists solicitudes_limite on public.solicitudes;
create trigger solicitudes_limite before insert on public.solicitudes for each row execute function public.trg_limite_solicitudes();

-- 4 · URLs de las webs: vacías o http(s).
alter table public.webs add constraint webs_urls_http check (
  coalesce(url_produccion, '') ~* '^(https?://.+)?$' and coalesce(url_pruebas, '') ~* '^(https?://.+)?$' and coalesce(url_repositorio, '') ~* '^(https?://.+)?$');

-- 5 · El historial solo lo escriben los disparadores; el autor de una nota es quien ha iniciado sesión.
alter policy "activity crear" on public.actividad with check (false);

create or replace function public.trg_autor_nota()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  new.autor := coalesce((select u.nombre from public.usuarios_panel u where lower(u.correo) = lower(coalesce(auth.jwt() ->> 'email', '')) limit 1),
                        auth.jwt() ->> 'email', new.autor, '');
  return new;
end $$;
revoke execute on function public.trg_autor_nota() from public, anon, authenticated;
drop trigger if exists notas_autor on public.notas_calendario;
create trigger notas_autor before insert on public.notas_calendario for each row execute function public.trg_autor_nota();

-- 6 · Escrituras atómicas (SECURITY INVOKER: siguen aplicándose las políticas RLS de quien llama).
create or replace function public.anadir_servicio_cliente(p_cliente text, p_servicio text)
returns void language sql security invoker set search_path = public as $$
  update public.clientes set servicios = array_append(servicios, p_servicio)
   where id = p_cliente and not (p_servicio = any(coalesce(servicios, '{}')));
$$;
revoke execute on function public.anadir_servicio_cliente(text, text) from public, anon;
grant execute on function public.anadir_servicio_cliente(text, text) to authenticated;

create or replace function public.actualizar_ajustes(p_cambios jsonb)
returns jsonb language sql security invoker set search_path = public as $$
  insert into public.ajustes (id, datos) values (1, p_cambios)
  on conflict (id) do update set datos = coalesce(public.ajustes.datos, '{}'::jsonb) || excluded.datos
  returning datos;
$$;
revoke execute on function public.actualizar_ajustes(jsonb) from public, anon;
grant execute on function public.actualizar_ajustes(jsonb) to authenticated;

-- 7 · El formulario público solo puede rellenar sus propios campos (no estado, importe, notas…).
revoke insert, update, delete, select on public.solicitudes from anon;
grant insert (empresa, nombre, telefono, correo, tipo_negocio, pack_interes, descripcion) on public.solicitudes to anon;

-- 8 · Funciones antiguas que ya no usa nada (ni políticas ni el panel): fuera de la API.
revoke execute on function public.is_admin(), public.is_admin_email(), public.my_panel_role() from public, anon, authenticated;
