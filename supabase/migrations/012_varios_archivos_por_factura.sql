-- Varios archivos por factura: `archivos` es una lista JSON [{path, name, type, size, addedAt}] (path = ruta en el bucket privado «facturas»).
-- Sustituye a archivo_ruta / archivo_nombre / archivo_tipo (que quedan sin usar). Los archivos que ya estaban adjuntos se copian a la lista.
alter table public.facturas add column if not exists archivos jsonb not null default '[]'::jsonb;
update public.facturas set archivos = jsonb_build_array(jsonb_build_object('path', archivo_ruta, 'name', coalesce(archivo_nombre, 'archivo'), 'type', coalesce(archivo_tipo, ''), 'size', 0, 'addedAt', actualizado_el))
where archivo_ruta is not null and archivos = '[]'::jsonb;
-- (log_activity muestra la columna como «archivos adjuntos» en el historial.)
