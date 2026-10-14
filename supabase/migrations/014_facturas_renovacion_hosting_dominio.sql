-- Renovación anual de hosting + dominio: factura automática 30 días antes de que venza la renovación del dominio.
-- · El primer año (hosting + dominio) va incluido en el pack. La renovación se factura cada año en la fecha de renovación del dominio
--   (fecha_renovacion; al dar de alta un dominio el panel la fija a 1 año de la fecha de registro).
-- · Importe (base imponible, sin IVA) según el pack del cliente: Starter 90 €/año · Professional 120 €/año · Premium 180 €/año (desde 180 €).
--   El pack se toma de la primera factura de pack de esa web; si no hay, de la primera de ese cliente; si no, del pack elegido en el formulario;
--   si el cliente aún no tiene pack se usa el coste anual del dominio (si es > 0). Sin ninguna de las dos cosas no se genera nada.
-- · pg_cron ejecuta cada día a las 04:10 UTC generar_facturas_renovacion(): si faltan 30 días o menos para la próxima renovación y aún no
--   existe su factura, la crea (concepto DOMAIN, recurrente, PENDING, vence el día de la renovación). Si el dominio se da de alta con
--   menos de 30 días de margen, se factura al momento. Idempotente: índice único (dominio_id, renovacion_de).
-- · Si la fecha de renovación guardada ya pasó, se toma la siguiente aniversario (+1 año, +2…); nunca se facturan años pasados.
alter table public.facturas add column if not exists renovacion_de date;
create unique index if not exists facturas_renovacion_unica on public.facturas (dominio_id, renovacion_de) where concepto = 'DOMAIN' and renovacion_de is not null;

create or replace function public.precio_renovacion(p_pack text) returns numeric language sql immutable as
$$ select case p_pack when 'STARTER' then 90 when 'PROFESSIONAL' then 120 when 'PREMIUM' then 180 end::numeric $$;

create or replace function public.generar_facturas_renovacion() returns integer language plpgsql security definer set search_path to 'public' as $fn$
declare
  d record; proxima date; emision timestamptz; hoy date := (now() at time zone 'Europe/Madrid')::date;
  anio int := extract(year from (now() at time zone 'Europe/Madrid'))::int; maxn int; creadas int := 0; filas int;
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
    select coalesce(max(nullif(split_part(numero, '-', 3), '')::int), 0) into maxn from public.facturas where numero like 'F-' || anio || '-%';
    insert into public.facturas (id, numero, cliente_id, concepto, descripcion, fecha_emision, fecha_vencimiento, base_imponible, mantenimiento, pack, factura_origen_id, iva, estado, recurrente, web_id, dominio_id, alojamiento_id, renovacion_de)
    values ('fac_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), 'F-' || anio || '-' || lpad((maxn + 1)::text, 3, '0'), d.cliente_id, 'DOMAIN',
      'Renovación de hosting y dominio ' || d.nombre || ' · ' || to_char(proxima, 'DD/MM/YYYY'),
      emision, (proxima::timestamp at time zone 'Europe/Madrid'), v_importe, 0, v_pack, null, v_iva, 'PENDING', true, d.web_id, d.id, v_alojamiento, proxima)
    on conflict do nothing;
    get diagnostics filas = row_count;
    creadas := creadas + filas;
  end loop;
  return creadas;
end $fn$;
revoke all on function public.generar_facturas_renovacion() from public, anon, authenticated;
revoke all on function public.precio_renovacion(text) from public, anon;
create extension if not exists pg_cron;
select cron.schedule('facturas-renovacion-anual', '10 4 * * *', 'select public.generar_facturas_renovacion()');
