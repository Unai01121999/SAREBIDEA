-- Facturas mensuales de mantenimiento generadas por la propia base de datos (no dependen de que alguien abra el panel).
-- Cada día a las 04:05 UTC (06:05 en verano / 05:05 en invierno, hora de Madrid) pg_cron ejecuta generar_facturas_mantenimiento():
-- para cada primera factura de pack (con mantenimiento) crea, un mes tras otro y el MISMO DÍA del mes en que se emitió la primera,
-- una factura independiente solo de mantenimiento (estado PENDING). Es idempotente (índice único facturas_mantenimiento_unica).
-- Si el día no existe en un mes (p. ej. 31), se usa el último día de ese mes.
create or replace function public.generar_facturas_mantenimiento() returns integer language plpgsql security definer set search_path to 'public' as $fn$
declare
  f record; k int; emision timestamptz; hoy date := (now() at time zone 'Europe/Madrid')::date;
  anio int := extract(year from (now() at time zone 'Europe/Madrid'))::int; maxn int; creadas int := 0; filas int;
begin
  perform pg_advisory_xact_lock(hashtext('generar_facturas_mantenimiento'));
  for f in select * from public.facturas where pack is not null and mantenimiento > 0 and factura_origen_id is null and concepto = 'WEB_DEVELOPMENT' and estado <> 'CANCELLED' loop
    for k in 1..36 loop
      emision := f.fecha_emision + make_interval(months => k);
      exit when (emision at time zone 'Europe/Madrid')::date > hoy;
      continue when exists (select 1 from public.facturas x where x.factura_origen_id = f.id and x.fecha_emision = emision);
      select coalesce(max(nullif(split_part(numero, '-', 3), '')::int), 0) into maxn from public.facturas where numero like 'F-' || anio || '-%';
      insert into public.facturas (id, numero, cliente_id, concepto, descripcion, fecha_emision, fecha_vencimiento, base_imponible, mantenimiento, pack, factura_origen_id, iva, estado, recurrente, web_id, dominio_id, alojamiento_id)
      values ('fac_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 12), 'F-' || anio || '-' || lpad((maxn + 1)::text, 3, '0'), f.cliente_id, 'MAINTENANCE',
        'Mantenimiento mensual ' || case f.pack when 'STARTER' then 'Pack Starter' when 'PROFESSIONAL' then 'Pack Professional' else 'Pack Premium' end || ' · ' || to_char(emision at time zone 'Europe/Madrid', 'MM/YYYY'),
        emision, emision + interval '30 days', 0, f.mantenimiento, f.pack, f.id, f.iva, 'PENDING', true, f.web_id, null, null)
      on conflict do nothing;
      get diagnostics filas = row_count;
      creadas := creadas + filas;
    end loop;
  end loop;
  return creadas;
end $fn$;
revoke all on function public.generar_facturas_mantenimiento() from public, anon, authenticated;
create extension if not exists pg_cron;
select cron.schedule('facturas-mantenimiento-mensual', '5 4 * * *', 'select public.generar_facturas_mantenimiento()');
