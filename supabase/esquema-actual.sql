-- Esquema REAL de la base de datos de SAREBIDEA (esquema `public`), volcado el 21/10/2026 tras la migración 018.
-- Sirve de referencia y para recrear la base de datos desde cero: las migraciones 002–018 cuentan la historia,
-- pero algunas piezas antiguas (correos_admin, is_admin, log_activity…) se crearon directamente en Supabase.
-- Orden: tablas, funciones, disparadores, políticas RLS y tareas programadas (pg_cron).
-- El secreto del aviso por correo se ha sustituido por TU_SECRETO (el real está solo en la base de datos y en la Edge Function).

create sequence if not exists public.lead_code_seq;

-- tabla actividad
create table if not exists public.actividad (
  id text not null,
  entidad text not null,
  entidad_id text not null,
  cliente_id text,
  mensaje text not null,
  autor text not null default ''::text,
  creado_el timestamp with time zone not null default now(),
  constraint activity_pkey PRIMARY KEY (id)
);
alter table public.actividad enable row level security;

-- tabla ajustes
create table if not exists public.ajustes (
  id integer not null,
  datos jsonb not null,
  constraint app_settings_id_check CHECK ((id = 1)),
  constraint app_settings_pkey PRIMARY KEY (id)
);
alter table public.ajustes enable row level security;

-- tabla clientes
create table if not exists public.clientes (
  id text not null,
  empresa text not null,
  persona_contacto text not null default ''::text,
  correo text not null default ''::text,
  telefono text not null default ''::text,
  direccion text not null default ''::text,
  codigo_postal text not null default ''::text,
  provincia text not null default ''::text,
  pais text not null default 'España'::text,
  cif_nif text not null default ''::text,
  estado text not null default 'PENDING'::text,
  servicios text[] not null default '{}'::text[],
  notas text not null default ''::text,
  archivado boolean not null default false,
  origen text not null default 'MANUAL'::text,
  id_origen text,
  datos_formulario jsonb,
  creado_el timestamp with time zone not null default now(),
  actualizado_el timestamp with time zone not null default now(),
  pack_interes text,
  constraint clientes_pack_interes_check CHECK (((pack_interes IS NULL) OR (pack_interes = ANY (ARRAY['STARTER'::text, 'PROFESSIONAL'::text, 'PREMIUM'::text, 'INDECISO'::text])))),
  constraint clients_origin_check CHECK ((origen = ANY (ARRAY['MANUAL'::text, 'FORM'::text]))),
  constraint clients_pkey PRIMARY KEY (id),
  constraint clients_source_id_key UNIQUE (id_origen),
  constraint clients_status_check CHECK ((estado = ANY (ARRAY['ACTIVE'::text, 'PENDING'::text, 'INACTIVE'::text])))
);
alter table public.clientes enable row level security;

-- tabla webs
create table if not exists public.webs (
  id text not null,
  cliente_id text not null,
  nombre text not null,
  estado text not null default 'DEVELOPMENT'::text,
  tecnologia text not null default 'WORDPRESS'::text,
  descripcion text not null default ''::text,
  nombre_dominio text not null default ''::text,
  url_produccion text not null default ''::text,
  url_pruebas text not null default ''::text,
  url_repositorio text not null default ''::text,
  rama_principal text not null default 'main'::text,
  proveedor_hosting text not null default ''::text,
  pack text,
  fecha_inicio timestamp with time zone not null default now(),
  fecha_publicacion timestamp with time zone,
  creado_el timestamp with time zone not null default now(),
  actualizado_el timestamp with time zone not null default now(),
  constraint webs_urls_http CHECK (((COALESCE(url_produccion, ''::text) ~* '^(https?://.+)?$'::text) AND (COALESCE(url_pruebas, ''::text) ~* '^(https?://.+)?$'::text) AND (COALESCE(url_repositorio, ''::text) ~* '^(https?://.+)?$'::text))),
  constraint websites_client_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  constraint websites_pkey PRIMARY KEY (id),
  constraint websites_status_check CHECK ((estado = ANY (ARRAY['DEVELOPMENT'::text, 'PRODUCTION'::text, 'PAUSED'::text, 'ARCHIVED'::text])))
);
alter table public.webs enable row level security;

-- tabla alojamientos
create table if not exists public.alojamientos (
  id text not null,
  cliente_id text not null,
  web_id text,
  proveedor text not null,
  plan text not null default ''::text,
  coste_anual numeric not null default 0,
  fecha_contratacion timestamp with time zone not null default now(),
  fecha_renovacion timestamp with time zone not null,
  activo boolean not null default true,
  notas text not null default ''::text,
  creado_el timestamp with time zone not null default now(),
  actualizado_el timestamp with time zone not null default now(),
  constraint hostings_client_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  constraint hostings_pkey PRIMARY KEY (id),
  constraint hostings_website_id_fkey FOREIGN KEY (web_id) REFERENCES webs(id) ON DELETE SET NULL
);
alter table public.alojamientos enable row level security;

-- tabla correos_admin (sin políticas a propósito: solo la leen funciones SECURITY DEFINER)
create table if not exists public.correos_admin (
  correo text not null,
  constraint admin_emails_pkey PRIMARY KEY (correo)
);
alter table public.correos_admin enable row level security;

-- tabla dominios
create table if not exists public.dominios (
  id text not null,
  cliente_id text not null,
  web_id text,
  nombre text not null,
  registrador text not null default ''::text,
  fecha_registro timestamp with time zone not null default now(),
  fecha_renovacion timestamp with time zone not null,
  coste_anual numeric not null default 0,
  renovacion_automatica boolean not null default true,
  dns text not null default ''::text,
  servidores_dns text[] not null default '{}'::text[],
  notas text not null default ''::text,
  creado_el timestamp with time zone not null default now(),
  actualizado_el timestamp with time zone not null default now(),
  constraint domains_client_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  constraint domains_pkey PRIMARY KEY (id),
  constraint domains_website_id_fkey FOREIGN KEY (web_id) REFERENCES webs(id) ON DELETE SET NULL
);
alter table public.dominios enable row level security;

-- tabla facturas
create table if not exists public.facturas (
  id text not null,
  numero text not null,
  cliente_id text not null,
  concepto text not null,
  descripcion text not null default ''::text,
  fecha_emision timestamp with time zone not null default now(),
  fecha_vencimiento timestamp with time zone not null default now(),
  base_imponible numeric not null default 0,
  iva numeric not null default 21,
  estado text not null default 'PENDING'::text,
  recurrente boolean not null default false,
  web_id text,
  dominio_id text,
  alojamiento_id text,
  creado_el timestamp with time zone not null default now(),
  actualizado_el timestamp with time zone not null default now(),
  pack text,
  mantenimiento numeric not null default 0,
  factura_origen_id text,
  archivo_ruta text,
  archivo_nombre text,
  archivo_tipo text,
  archivos jsonb not null default '[]'::jsonb,
  renovacion_de date,
  constraint facturas_mantenimiento_check CHECK ((mantenimiento >= (0)::numeric)),
  constraint facturas_numero_formato CHECK ((numero ~ '^F-[0-9]{4}-[0-9]+$'::text)),
  constraint facturas_pack_check CHECK (((pack IS NULL) OR (pack = ANY (ARRAY['STARTER'::text, 'PROFESSIONAL'::text, 'PREMIUM'::text])))),
  constraint invoices_client_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  constraint invoices_domain_id_fkey FOREIGN KEY (dominio_id) REFERENCES dominios(id) ON DELETE SET NULL,
  constraint invoices_hosting_id_fkey FOREIGN KEY (alojamiento_id) REFERENCES alojamientos(id) ON DELETE SET NULL,
  constraint invoices_number_key UNIQUE (numero),
  constraint invoices_pkey PRIMARY KEY (id),
  constraint invoices_status_check CHECK ((estado = ANY (ARRAY['PAID'::text, 'PENDING'::text, 'OVERDUE'::text, 'CANCELLED'::text]))),
  constraint invoices_website_id_fkey FOREIGN KEY (web_id) REFERENCES webs(id) ON DELETE SET NULL
);
alter table public.facturas enable row level security;

-- tabla notas_calendario
create table if not exists public.notas_calendario (
  id text not null,
  dia date not null,
  texto text not null,
  hecha boolean not null default false,
  autor text not null default ''::text,
  creado_el timestamp with time zone not null default now(),
  actualizado_el timestamp with time zone not null default now(),
  constraint notas_calendario_pkey PRIMARY KEY (id),
  constraint notas_calendario_texto_check CHECK (((length(btrim(texto)) > 0) AND (length(texto) <= 4000)))
);
alter table public.notas_calendario enable row level security;

-- tabla solicitudes (formulario de la web)
create table if not exists public.solicitudes (
  id uuid not null default gen_random_uuid(),
  codigo text default ('SB-'::text || lpad((nextval('lead_code_seq'::regclass))::text, 4, '0'::text)),
  nombre text not null,
  telefono text,
  correo text,
  tipo_negocio text,
  descripcion text,
  origen text not null default 'web'::text,
  estado text not null default 'nuevo'::text,
  notas text,
  web text,
  dominio text,
  fecha_caducidad_dominio date,
  fecha_caducidad_web date,
  importe numeric(10,2),
  estado_pago text default 'pendiente'::text,
  creado_el timestamp with time zone not null default now(),
  empresa text,
  pack_interes text,
  constraint leads_business_type_check CHECK ((char_length(tipo_negocio) <= 80)),
  constraint leads_code_key UNIQUE (codigo),
  constraint leads_company_check CHECK (((empresa IS NULL) OR (char_length(empresa) <= 120))),
  constraint leads_description_check CHECK ((char_length(descripcion) <= 2000)),
  constraint leads_email_check CHECK ((char_length(correo) <= 160)),
  constraint leads_name_check CHECK (((char_length(nombre) >= 3) AND (char_length(nombre) <= 120))),
  constraint leads_phone_check CHECK ((char_length(telefono) <= 40)),
  constraint leads_pkey PRIMARY KEY (id),
  constraint solicitudes_pack_interes_check CHECK (((pack_interes IS NULL) OR (pack_interes = ANY (ARRAY['STARTER'::text, 'PROFESSIONAL'::text, 'PREMIUM'::text, 'INDECISO'::text]))))
);
alter table public.solicitudes enable row level security;
revoke insert, update, delete, select on public.solicitudes from anon;
grant insert (empresa, nombre, telefono, correo, tipo_negocio, pack_interes, descripcion) on public.solicitudes to anon;

-- tabla tareas
create table if not exists public.tareas (
  id text not null,
  titulo text not null,
  descripcion text not null default ''::text,
  cliente_id text,
  web_id text,
  prioridad text not null default 'MEDIUM'::text,
  estado text not null default 'TODO'::text,
  etiquetas text[] not null default '{}'::text[],
  comentarios jsonb not null default '[]'::jsonb,
  posicion integer not null default 0,
  fecha_limite timestamp with time zone,
  completada_el timestamp with time zone,
  creado_el timestamp with time zone not null default now(),
  actualizado_el timestamp with time zone not null default now(),
  constraint tasks_client_id_fkey FOREIGN KEY (cliente_id) REFERENCES clientes(id) ON DELETE CASCADE,
  constraint tasks_pkey PRIMARY KEY (id),
  constraint tasks_website_id_fkey FOREIGN KEY (web_id) REFERENCES webs(id) ON DELETE SET NULL
);
alter table public.tareas enable row level security;

-- tabla usuarios_panel
create table if not exists public.usuarios_panel (
  id text not null,
  nombre text not null,
  correo text not null,
  rol text not null default 'VIEWER'::text,
  activo boolean not null default true,
  creado_el timestamp with time zone not null default now(),
  actualizado_el timestamp with time zone not null default now(),
  id_autenticacion uuid,
  constraint panel_users_pkey PRIMARY KEY (id)
);
alter table public.usuarios_panel enable row level security;

-- ─── Funciones ─────────────────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.precio_renovacion(p_pack text)
 RETURNS numeric
 LANGUAGE sql
 IMMUTABLE
 SET search_path TO 'public'
AS $function$ select case p_pack when 'STARTER' then 90 when 'PROFESSIONAL' then 120 when 'PREMIUM' then 180 end::numeric $function$
;

CREATE OR REPLACE FUNCTION public.panel_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select u.rol from public.usuarios_panel u where lower(u.correo) = lower(coalesce(auth.jwt()->>'email', '')) and u.activo and coalesce(auth.jwt()->>'aal', '') = 'aal2' limit 1;
$function$
;

CREATE OR REPLACE FUNCTION public.panel_can(module text, action text)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select case public.panel_role()
    when 'OWNER' then true
    when 'ADMIN' then module in ('clients', 'tasks', 'billing') or (module = 'settings' and action = 'read')
    when 'EDITOR' then module in ('clients', 'tasks') or (module = 'billing' and action = 'read')
    when 'VIEWER' then module in ('clients', 'tasks') and action = 'read'
    else false
  end;
$function$
;

CREATE OR REPLACE FUNCTION public.panel_me()
 RETURNS jsonb
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select jsonb_build_object('name', u.nombre, 'email', u.correo, 'role', u.rol) from public.usuarios_panel u where lower(u.correo) = lower(coalesce(auth.jwt()->>'email', '')) and u.activo limit 1;
$function$
;

CREATE OR REPLACE FUNCTION public.my_panel_role()
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select u.rol from public.usuarios_panel u where lower(u.correo) = lower(coalesce(auth.jwt()->>'email', '')) and u.activo limit 1;
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.correos_admin where correo = auth.jwt()->>'email') and coalesce(auth.jwt()->>'aal', '') = 'aal2';
$function$
;

CREATE OR REPLACE FUNCTION public.is_admin_email()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select exists (select 1 from public.correos_admin where lower(correo) = lower(coalesce(auth.jwt()->>'email', '')));
$function$
;

CREATE OR REPLACE FUNCTION public.sync_admin_emails()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_op = 'DELETE' then
    delete from public.correos_admin where lower(correo) = lower(old.correo);
    return old;
  end if;
  if tg_op = 'UPDATE' and lower(old.correo) <> lower(new.correo) then
    delete from public.correos_admin where lower(correo) = lower(old.correo);
  end if;
  if new.activo then
    insert into public.correos_admin (correo) values (lower(new.correo)) on conflict do nothing;
  else
    delete from public.correos_admin where lower(correo) = lower(new.correo);
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.redes_sociales()
 RETURNS json
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select json_build_object(
    'instagram', coalesce((select case when (datos->'company'->>'instagramUrl') ~* '^https?://' then datos->'company'->>'instagramUrl' end from public.ajustes where id = 1), ''),
    'facebook',  coalesce((select case when (datos->'company'->>'facebookUrl') ~* '^https?://' then datos->'company'->>'facebookUrl' end from public.ajustes where id = 1), '')
  )
$function$
;

CREATE OR REPLACE FUNCTION public.actualizar_ajustes(p_cambios jsonb)
 RETURNS jsonb
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  insert into public.ajustes (id, datos) values (1, p_cambios)
  on conflict (id) do update set datos = coalesce(public.ajustes.datos, '{}'::jsonb) || excluded.datos
  returning datos;
$function$
;

CREATE OR REPLACE FUNCTION public.anadir_servicio_cliente(p_cliente text, p_servicio text)
 RETURNS void
 LANGUAGE sql
 SET search_path TO 'public'
AS $function$
  update public.clientes set servicios = array_append(servicios, p_servicio)
   where id = p_cliente and not (p_servicio = any(coalesce(servicios, '{}')));
$function$
;

CREATE OR REPLACE FUNCTION public.pack_del_dominio(p_cliente text, p_web text)
 RETURNS text
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare v text;
begin
  if p_web is not null then
    select f.pack into v from public.facturas f where f.web_id = p_web and f.pack is not null and f.factura_origen_id is null and f.concepto = 'WEB_DEVELOPMENT' and f.estado <> 'CANCELLED' order by f.fecha_emision limit 1;
  end if;
  if v is null then
    select f.pack into v from public.facturas f where f.cliente_id = p_cliente and f.pack is not null and f.factura_origen_id is null and f.concepto = 'WEB_DEVELOPMENT' and f.estado <> 'CANCELLED' order by f.fecha_emision limit 1;
  end if;
  if v is null then
    select c.pack_interes into v from public.clientes c where c.id = p_cliente and c.pack_interes in ('STARTER', 'PROFESSIONAL', 'PREMIUM');
  end if;
  return v;
end $function$
;

CREATE OR REPLACE FUNCTION public.sincronizar_coste_dominios(p_cliente text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare n integer;
begin
  update public.dominios d set coste_anual = public.precio_renovacion(public.pack_del_dominio(d.cliente_id, d.web_id))
   where (p_cliente is null or d.cliente_id = p_cliente)
     and public.precio_renovacion(public.pack_del_dominio(d.cliente_id, d.web_id)) is not null
     and d.coste_anual is distinct from public.precio_renovacion(public.pack_del_dominio(d.cliente_id, d.web_id));
  get diagnostics n = row_count;
  return n;
end $function$
;

CREATE OR REPLACE FUNCTION public.trg_sincronizar_coste_dominios()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if tg_table_name = 'facturas' then
    if new.pack is not null and new.concepto = 'WEB_DEVELOPMENT' then perform public.sincronizar_coste_dominios(new.cliente_id); end if;
  else
    new.coste_anual := coalesce(public.precio_renovacion(public.pack_del_dominio(new.cliente_id, new.web_id)), new.coste_anual);
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.siguiente_numero_factura(p_fecha timestamp with time zone)
 RETURNS text
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare anio int := extract(year from (coalesce(p_fecha, now()) at time zone 'Europe/Madrid'))::int; maxn int;
begin
  perform pg_advisory_xact_lock(hashtext('numero_factura_' || anio));
  select coalesce(max(split_part(numero, '-', 3)::int), 0) into maxn
    from public.facturas where numero ~ ('^F-' || anio || '-[0-9]+$');
  return 'F-' || anio || '-' || lpad((maxn + 1)::text, 3, '0');
end $function$
;

CREATE OR REPLACE FUNCTION public.trg_numero_factura()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if coalesce(btrim(new.numero), '') = '' then new.numero := public.siguiente_numero_factura(new.fecha_emision); end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.generar_facturas_mantenimiento()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  f record; k int; emision timestamptz; hoy date := (now() at time zone 'Europe/Madrid')::date;
  creadas int := 0; filas int;
begin
  perform pg_advisory_xact_lock(hashtext('generar_facturas_mantenimiento'));
  for f in select * from public.facturas where pack is not null and mantenimiento > 0 and factura_origen_id is null and concepto = 'WEB_DEVELOPMENT' and estado <> 'CANCELLED' loop
    for k in 1..36 loop
      emision := f.fecha_emision + make_interval(months => k);
      exit when (emision at time zone 'Europe/Madrid')::date > hoy;
      continue when exists (select 1 from public.facturas x where x.factura_origen_id = f.id and x.fecha_emision = emision);
      insert into public.facturas (id, numero, cliente_id, concepto, descripcion, fecha_emision, fecha_vencimiento, base_imponible, mantenimiento, pack, factura_origen_id, iva, estado, recurrente, web_id, dominio_id, alojamiento_id)
      values ('fac_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), '', f.cliente_id, 'MAINTENANCE',
        'Mantenimiento mensual ' || case f.pack when 'STARTER' then 'Pack Starter' when 'PROFESSIONAL' then 'Pack Professional' else 'Pack Premium' end || ' · ' || to_char(emision at time zone 'Europe/Madrid', 'MM/YYYY'),
        emision, emision + interval '30 days', 0, f.mantenimiento, f.pack, f.id, f.iva, 'PENDING', true, f.web_id, null, null)
      on conflict do nothing;
      get diagnostics filas = row_count;
      creadas := creadas + filas;
    end loop;
  end loop;
  return creadas;
end $function$
;

CREATE OR REPLACE FUNCTION public.generar_facturas_renovacion()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  d record; proxima date; emision timestamptz; hoy date := (now() at time zone 'Europe/Madrid')::date;
  creadas int := 0; filas int;
  v_pack text; v_iva numeric; v_importe numeric; v_alojamiento text;
begin
  perform pg_advisory_xact_lock(hashtext('generar_facturas_renovacion'));
  for d in select * from public.dominios loop
    proxima := (d.fecha_renovacion at time zone 'Europe/Madrid')::date;
    while proxima < hoy loop proxima := (proxima + interval '1 year')::date; end loop;
    continue when proxima - 30 > hoy;
    continue when exists (select 1 from public.facturas x where x.dominio_id = d.id and x.concepto = 'DOMAIN' and x.renovacion_de = proxima);

    v_pack := null; v_iva := null;
    select f.pack, f.iva into v_pack, v_iva from public.facturas f
      where f.web_id is not distinct from d.web_id and d.web_id is not null and f.pack is not null and f.factura_origen_id is null and f.concepto = 'WEB_DEVELOPMENT' and f.estado <> 'CANCELLED'
      order by f.fecha_emision limit 1;
    if v_pack is null then
      select f.pack, f.iva into v_pack, v_iva from public.facturas f
        where f.cliente_id = d.cliente_id and f.pack is not null and f.factura_origen_id is null and f.concepto = 'WEB_DEVELOPMENT' and f.estado <> 'CANCELLED'
        order by f.fecha_emision limit 1;
    end if;
    if v_pack is null then
      select c.pack_interes into v_pack from public.clientes c where c.id = d.cliente_id and c.pack_interes in ('STARTER', 'PROFESSIONAL', 'PREMIUM');
    end if;
    v_importe := coalesce(public.precio_renovacion(v_pack), nullif(d.coste_anual, 0));
    continue when v_importe is null;
    if v_iva is null then
      select f.iva into v_iva from public.facturas f where f.cliente_id = d.cliente_id order by f.fecha_emision desc limit 1;
    end if;
    v_iva := coalesce(v_iva, 21);
    select a.id into v_alojamiento from public.alojamientos a where a.activo and (a.web_id is not distinct from d.web_id and d.web_id is not null or a.cliente_id = d.cliente_id)
      order by (a.web_id is not distinct from d.web_id) desc, a.fecha_contratacion limit 1;

    emision := greatest(((proxima - 30)::timestamp at time zone 'Europe/Madrid'), now());
    insert into public.facturas (id, numero, cliente_id, concepto, descripcion, fecha_emision, fecha_vencimiento, base_imponible, mantenimiento, pack, factura_origen_id, iva, estado, recurrente, web_id, dominio_id, alojamiento_id, renovacion_de)
    values ('fac_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), '', d.cliente_id, 'DOMAIN',
      'Renovación de hosting y dominio ' || d.nombre || ' · ' || to_char(proxima, 'DD/MM/YYYY'),
      emision, (proxima::timestamp at time zone 'Europe/Madrid'), v_importe, 0, v_pack, null, v_iva, 'PENDING', true, d.web_id, d.id, v_alojamiento, proxima)
    on conflict do nothing;
    get diagnostics filas = row_count;
    creadas := creadas + filas;
  end loop;
  return creadas;
end $function$
;

CREATE OR REPLACE FUNCTION public.generar_facturas_renovacion_con_costes()
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  perform public.sincronizar_coste_dominios();
  return public.generar_facturas_renovacion();
end $function$
;

CREATE OR REPLACE FUNCTION public.lead_to_client()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare cid text := 'cli_' || substr(replace(new.id::text, '-', ''), 1, 12);
begin
  insert into public.clientes (id, empresa, persona_contacto, correo, telefono, estado, notas, origen, id_origen, datos_formulario, pack_interes, creado_el, actualizado_el)
  values (
    cid,
    coalesce(nullif(btrim(new.empresa), ''), new.nombre),
    new.nombre,
    coalesce(new.correo, ''),
    coalesce(new.telefono, ''),
    case coalesce(new.estado, 'nuevo') when 'cliente' then 'ACTIVE' when 'descartado' then 'INACTIVE' else 'PENDING' end,
    concat_ws(chr(10), nullif('Web: ' || coalesce(new.web, ''), 'Web: '), nullif('Dominio: ' || coalesce(new.dominio, ''), 'Dominio: '), new.notas),
    case when coalesce(new.origen, 'web') = 'web' then 'FORM' else 'MANUAL' end,
    new.id::text,
    case when coalesce(new.origen, 'web') = 'web'
      then jsonb_build_object('code', coalesce(new.codigo, ''), 'businessType', coalesce(new.tipo_negocio, ''), 'description', coalesce(new.descripcion, ''), 'submittedAt', new.creado_el)
      end,
    new.pack_interes,
    new.creado_el,
    now()
  ) on conflict (id_origen) do nothing;
  if found then
    insert into public.actividad (id, entidad, entidad_id, cliente_id, mensaje, autor, creado_el)
    values ('act_' || substr(replace(new.id::text, '-', ''), 1, 12), 'client', cid, cid,
      'Nueva solicitud ' || case when coalesce(new.origen, 'web') = 'web' then 'del formulario' else 'importada' end || ': ' || coalesce(nullif(btrim(new.empresa), ''), new.nombre),
      'Formulario web', new.creado_el);
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.notify_new_lead()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if new.origen = 'web' then
    perform net.http_post(
      url     := 'https://acipnrmskjupfznxjpvt.supabase.co/functions/v1/notify-new-lead',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', 'TU_SECRETO'),
      body    := jsonb_build_object('type', 'INSERT', 'table', 'solicitudes', 'record', to_jsonb(new))
    );
  end if;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.trg_limite_solicitudes()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  if coalesce(auth.role(), 'anon') <> 'anon' then return new; end if;
  if (select count(*) from public.solicitudes where lower(correo) = lower(new.correo) and creado_el > now() - interval '1 hour') >= 3
     or (select count(*) from public.solicitudes where creado_el > now() - interval '10 minutes') >= 20 then
    raise exception 'demasiadas_solicitudes' using errcode = 'P0001';
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.trg_autor_nota()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  new.autor := coalesce((select u.nombre from public.usuarios_panel u where lower(u.correo) = lower(coalesce(auth.jwt() ->> 'email', '')) limit 1),
                        auth.jwt() ->> 'email', new.autor, '');
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.log_activity()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  r jsonb;
  o jsonb;
  ent text;
  noun text;
  fem boolean := false;
  verb text;
  lbl text;
  cid text;
  who text;
  changed text[];
  shown text;
  nombres jsonb := '{"empresa":"empresa","persona_contacto":"contacto","correo":"correo","telefono":"teléfono","direccion":"dirección","codigo_postal":"código postal","provincia":"provincia","pais":"país","cif_nif":"CIF/NIF","estado":"estado","notas":"notas","archivado":"archivado","servicios":"servicios","tecnologia":"tecnología","descripcion":"descripción","nombre_dominio":"dominio","url_produccion":"URL de producción","url_pruebas":"URL de pruebas","url_repositorio":"repositorio","rama_principal":"rama","proveedor_hosting":"hosting","pack":"pack","fecha_inicio":"inicio","fecha_publicacion":"publicación","nombre":"nombre","registrador":"registrador","fecha_registro":"registro","fecha_renovacion":"renovación","coste_anual":"coste anual","renovacion_automatica":"renovación automática","dns":"DNS","servidores_dns":"servidores DNS","proveedor":"proveedor","plan":"plan","fecha_contratacion":"contratación","activo":"activo","concepto":"concepto","fecha_emision":"emisión","fecha_vencimiento":"vencimiento","base_imponible":"base imponible","iva":"IVA","recurrente":"recurrente","web_id":"web","dominio_id":"dominio","alojamiento_id":"alojamiento","titulo":"título","prioridad":"prioridad","etiquetas":"etiquetas","comentarios":"comentarios","cliente_id":"cliente","completada_el":"completada","fecha_limite":"fecha límite","datos":"ajustes","numero":"número","archivos":"archivos adjuntos","archivo_ruta":"archivo adjunto","archivo_nombre":"archivo adjunto","archivo_tipo":"archivo adjunto","mantenimiento":"mantenimiento","factura_origen_id":"factura de origen"}';
begin
  if tg_op = 'DELETE' then r := to_jsonb(old); else r := to_jsonb(new); end if;
  if tg_table_name = 'clientes' then
    ent := 'client'; noun := 'Cliente'; lbl := r->>'empresa'; cid := r->>'id';
    if tg_op = 'INSERT' and r->>'origen' = 'FORM' and r->>'id_origen' is not null then return new; end if;
  elsif tg_table_name = 'webs' then ent := 'website'; noun := 'Web'; fem := true; lbl := r->>'nombre'; cid := r->>'cliente_id';
  elsif tg_table_name = 'dominios' then ent := 'domain'; noun := 'Dominio'; lbl := r->>'nombre'; cid := r->>'cliente_id';
  elsif tg_table_name = 'alojamientos' then ent := 'hosting'; noun := 'Hosting'; lbl := concat_ws(' · ', r->>'proveedor', nullif(r->>'plan', '')); cid := r->>'cliente_id';
  elsif tg_table_name = 'facturas' then ent := 'invoice'; noun := 'Factura'; fem := true; lbl := r->>'numero'; cid := r->>'cliente_id';
  elsif tg_table_name = 'tareas' then ent := 'task'; noun := 'Tarea'; fem := true; lbl := r->>'titulo'; cid := r->>'cliente_id';
  else ent := 'settings'; noun := 'Ajustes'; lbl := 'empresa, impuestos o proveedores'; cid := null;
  end if;
  if tg_op = 'DELETE' and cid is not null and tg_table_name <> 'clientes' and not exists (select 1 from public.clientes where id = cid) then return old; end if;
  if tg_op = 'UPDATE' then
    o := to_jsonb(old);
    select array_agg(e.key order by e.key) into changed from jsonb_each(r) e where e.value is distinct from (o -> e.key) and e.key not in ('actualizado_el', 'creado_el', 'posicion');
    if changed is null then return new; end if;
    if changed <@ array['servicios'] then return new; end if;
    if changed <@ array['web_id', 'dominio_id', 'alojamiento_id'] and r->>'web_id' is null and r->>'dominio_id' is null and r->>'alojamiento_id' is null then return new; end if;
    shown := (select string_agg(distinct coalesce(nombres ->> k, k), ', ') from (select k from unnest(changed) k limit 5) s);
    if array_length(changed, 1) > 5 then shown := shown || '…'; end if;
  end if;
  verb := case tg_op when 'INSERT' then 'creado' when 'UPDATE' then 'actualizado' else 'eliminado' end;
  if noun = 'Ajustes' then verb := case tg_op when 'INSERT' then 'creados' when 'UPDATE' then 'actualizados' else 'eliminados' end;
  elsif fem then verb := regexp_replace(verb, 'o$', 'a');
  end if;
  select coalesce((select u.nombre from public.usuarios_panel u where lower(u.correo) = lower(coalesce(auth.jwt() ->> 'email', '')) limit 1), auth.jwt() ->> 'email', 'Sistema') into who;
  insert into public.actividad (id, entidad, entidad_id, cliente_id, mensaje, autor, creado_el)
  values ('act_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), ent, coalesce(r->>'id', '1'), cid,
    noun || ' ' || verb || ': ' || coalesce(lbl, 'registro') || case when shown is not null then ' (' || shown || ')' else '' end, who, now());
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$function$
;

-- Permisos de ejecución: las funciones internas no se pueden llamar desde la API.
revoke execute on function public.sincronizar_coste_dominios(text), public.pack_del_dominio(text, text), public.precio_renovacion(text),
  public.log_activity(), public.trg_sincronizar_coste_dominios(), public.siguiente_numero_factura(timestamptz), public.trg_numero_factura(),
  public.trg_limite_solicitudes(), public.trg_autor_nota() from public, anon, authenticated;
revoke execute on function public.is_admin(), public.is_admin_email(), public.my_panel_role() from public, anon, authenticated;
revoke execute on function public.anadir_servicio_cliente(text, text), public.actualizar_ajustes(jsonb) from public, anon;
grant execute on function public.anadir_servicio_cliente(text, text), public.actualizar_ajustes(jsonb) to authenticated;

-- ─── Disparadores ──────────────────────────────────────────────────────────────────────────────────────

CREATE TRIGGER log_activity_settings AFTER INSERT OR DELETE OR UPDATE ON public.ajustes FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_activity_hostings AFTER INSERT OR DELETE OR UPDATE ON public.alojamientos FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER log_activity_clients AFTER INSERT OR DELETE OR UPDATE ON public.clientes FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER dominios_coste_por_pack BEFORE INSERT ON public.dominios FOR EACH ROW EXECUTE FUNCTION trg_sincronizar_coste_dominios();
CREATE TRIGGER log_activity_domains AFTER INSERT OR DELETE OR UPDATE ON public.dominios FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER facturas_numero BEFORE INSERT ON public.facturas FOR EACH ROW EXECUTE FUNCTION trg_numero_factura();
CREATE TRIGGER facturas_sincronizar_coste_dominios AFTER INSERT OR UPDATE OF pack ON public.facturas FOR EACH ROW EXECUTE FUNCTION trg_sincronizar_coste_dominios();
CREATE TRIGGER log_activity_invoices AFTER INSERT OR DELETE OR UPDATE ON public.facturas FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER notas_autor BEFORE INSERT ON public.notas_calendario FOR EACH ROW EXECUTE FUNCTION trg_autor_nota();
CREATE TRIGGER leads_notify_new AFTER INSERT ON public.solicitudes FOR EACH ROW EXECUTE FUNCTION notify_new_lead();
CREATE TRIGGER leads_to_client AFTER INSERT ON public.solicitudes FOR EACH ROW EXECUTE FUNCTION lead_to_client();
CREATE TRIGGER solicitudes_limite BEFORE INSERT ON public.solicitudes FOR EACH ROW EXECUTE FUNCTION trg_limite_solicitudes();
CREATE TRIGGER log_activity_tasks AFTER INSERT OR DELETE OR UPDATE ON public.tareas FOR EACH ROW EXECUTE FUNCTION log_activity();
CREATE TRIGGER panel_users_sync_admin AFTER INSERT OR DELETE OR UPDATE ON public.usuarios_panel FOR EACH ROW EXECUTE FUNCTION sync_admin_emails();
CREATE TRIGGER log_activity_websites AFTER INSERT OR DELETE OR UPDATE ON public.webs FOR EACH ROW EXECUTE FUNCTION log_activity();

-- ─── Políticas RLS ─────────────────────────────────────────────────────────────────────────────────────
-- Las políticas «admin todo» con false son restos inocuos de la primera versión (no dan acceso a nadie).

create policy "activity crear" on public.actividad as permissive for insert to authenticated with check (false);
create policy "activity ver" on public.actividad as permissive for select to authenticated using ((panel_role() IS NOT NULL));
create policy "admin todo" on public.actividad as permissive for all to authenticated using (false) with check (false);

create policy "admin todo" on public.ajustes as permissive for all to authenticated using (false) with check (false);
create policy "settings crear" on public.ajustes as permissive for insert to authenticated with check (panel_can('settings'::text, 'write'::text));
create policy "settings editar" on public.ajustes as permissive for update to authenticated using (panel_can('settings'::text, 'write'::text)) with check (panel_can('settings'::text, 'write'::text));
create policy "settings ver" on public.ajustes as permissive for select to authenticated using ((panel_role() IS NOT NULL));

create policy "admin todo" on public.alojamientos as permissive for all to authenticated using (false) with check (false);
create policy "hostings borrar" on public.alojamientos as permissive for delete to authenticated using (panel_can('clients'::text, 'write'::text));
create policy "hostings crear" on public.alojamientos as permissive for insert to authenticated with check (panel_can('clients'::text, 'write'::text));
create policy "hostings editar" on public.alojamientos as permissive for update to authenticated using (panel_can('clients'::text, 'write'::text)) with check (panel_can('clients'::text, 'write'::text));
create policy "hostings ver" on public.alojamientos as permissive for select to authenticated using (panel_can('clients'::text, 'read'::text));

create policy "admin todo" on public.clientes as permissive for all to authenticated using (false) with check (false);
create policy "clients borrar" on public.clientes as permissive for delete to authenticated using (panel_can('clients'::text, 'write'::text));
create policy "clients crear" on public.clientes as permissive for insert to authenticated with check (panel_can('clients'::text, 'write'::text));
create policy "clients editar" on public.clientes as permissive for update to authenticated using (panel_can('clients'::text, 'write'::text)) with check (panel_can('clients'::text, 'write'::text));
create policy "clients ver" on public.clientes as permissive for select to authenticated using (panel_can('clients'::text, 'read'::text));

create policy "admin todo" on public.dominios as permissive for all to authenticated using (false) with check (false);
create policy "domains borrar" on public.dominios as permissive for delete to authenticated using (panel_can('clients'::text, 'write'::text));
create policy "domains crear" on public.dominios as permissive for insert to authenticated with check (panel_can('clients'::text, 'write'::text));
create policy "domains editar" on public.dominios as permissive for update to authenticated using (panel_can('clients'::text, 'write'::text)) with check (panel_can('clients'::text, 'write'::text));
create policy "domains ver" on public.dominios as permissive for select to authenticated using (panel_can('clients'::text, 'read'::text));

create policy "admin todo" on public.facturas as permissive for all to authenticated using (false) with check (false);
create policy "invoices borrar" on public.facturas as permissive for delete to authenticated using (panel_can('billing'::text, 'write'::text));
create policy "invoices crear" on public.facturas as permissive for insert to authenticated with check (panel_can('billing'::text, 'write'::text));
create policy "invoices editar" on public.facturas as permissive for update to authenticated using (panel_can('billing'::text, 'write'::text)) with check (panel_can('billing'::text, 'write'::text));
create policy "invoices ver" on public.facturas as permissive for select to authenticated using (panel_can('billing'::text, 'read'::text));

create policy "notas borrar" on public.notas_calendario as permissive for delete to authenticated using (panel_can('tasks'::text, 'write'::text));
create policy "notas crear" on public.notas_calendario as permissive for insert to authenticated with check (panel_can('tasks'::text, 'write'::text));
create policy "notas editar" on public.notas_calendario as permissive for update to authenticated using (panel_can('tasks'::text, 'write'::text)) with check (panel_can('tasks'::text, 'write'::text));
create policy "notas ver" on public.notas_calendario as permissive for select to authenticated using (panel_can('tasks'::text, 'read'::text));

create policy "admin borra" on public.solicitudes as permissive for delete to authenticated using (false);
create policy "admin edita" on public.solicitudes as permissive for update to authenticated using (false) with check (false);
create policy "admin inserta" on public.solicitudes as permissive for insert to authenticated with check (false);
create policy "admin lee" on public.solicitudes as permissive for select to authenticated using (false);
create policy "formulario publico inserta" on public.solicitudes as permissive for insert to anon with check (true);
create policy "leads borrar" on public.solicitudes as permissive for delete to authenticated using (panel_can('clients'::text, 'write'::text));
create policy "leads crear" on public.solicitudes as permissive for insert to authenticated with check (panel_can('clients'::text, 'write'::text));
create policy "leads editar" on public.solicitudes as permissive for update to authenticated using (panel_can('clients'::text, 'write'::text)) with check (panel_can('clients'::text, 'write'::text));
create policy "leads ver" on public.solicitudes as permissive for select to authenticated using (panel_can('clients'::text, 'read'::text));

create policy "admin todo" on public.tareas as permissive for all to authenticated using (false) with check (false);
create policy "tasks borrar" on public.tareas as permissive for delete to authenticated using (panel_can('tasks'::text, 'write'::text));
create policy "tasks crear" on public.tareas as permissive for insert to authenticated with check (panel_can('tasks'::text, 'write'::text));
create policy "tasks editar" on public.tareas as permissive for update to authenticated using (panel_can('tasks'::text, 'write'::text)) with check (panel_can('tasks'::text, 'write'::text));
create policy "tasks ver" on public.tareas as permissive for select to authenticated using (panel_can('tasks'::text, 'read'::text));

create policy "admin todo" on public.usuarios_panel as permissive for all to authenticated using (false) with check (false);
create policy "usuarios ver" on public.usuarios_panel as permissive for select to authenticated using (panel_can('settings'::text, 'read'::text));

create policy "admin todo" on public.webs as permissive for all to authenticated using (false) with check (false);
create policy "websites borrar" on public.webs as permissive for delete to authenticated using (panel_can('clients'::text, 'write'::text));
create policy "websites crear" on public.webs as permissive for insert to authenticated with check (panel_can('clients'::text, 'write'::text));
create policy "websites editar" on public.webs as permissive for update to authenticated using (panel_can('clients'::text, 'write'::text)) with check (panel_can('clients'::text, 'write'::text));
create policy "websites ver" on public.webs as permissive for select to authenticated using (panel_can('clients'::text, 'read'::text));

-- ─── Tareas programadas (pg_cron, hora UTC) ────────────────────────────────────────────────────────────
-- select cron.schedule('facturas-mantenimiento-mensual', '5 4 * * *', 'select public.generar_facturas_mantenimiento()');
-- select cron.schedule('facturas-renovacion-anual', '10 4 * * *', 'select public.generar_facturas_renovacion_con_costes()');

-- ─── Almacenamiento: adjuntos de facturas (privado, máx. 10 MB, PDF o imagen) ───────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('facturas', 'facturas', false, 10485760, array['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
on conflict (id) do nothing;
create policy "facturas archivos: leer" on storage.objects for select to authenticated using ((bucket_id = 'facturas'::text) AND panel_can('billing'::text, 'read'::text));
create policy "facturas archivos: subir" on storage.objects for insert to authenticated with check ((bucket_id = 'facturas'::text) AND panel_can('billing'::text, 'write'::text));
create policy "facturas archivos: reemplazar" on storage.objects for update to authenticated using ((bucket_id = 'facturas'::text) AND panel_can('billing'::text, 'write'::text)) with check ((bucket_id = 'facturas'::text) AND panel_can('billing'::text, 'write'::text));
create policy "facturas archivos: borrar" on storage.objects for delete to authenticated using ((bucket_id = 'facturas'::text) AND panel_can('billing'::text, 'write'::text));
