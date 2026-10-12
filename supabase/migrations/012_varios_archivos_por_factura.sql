-- Varios archivos por factura: `archivos` es una lista JSON [{path, name, type, size, addedAt}] (path = ruta en el bucket privado «facturas»).
-- Sustituye a archivo_ruta / archivo_nombre / archivo_tipo (que quedan sin usar). Los archivos que ya estaban adjuntos se copian a la lista.
alter table public.facturas add column if not exists archivos jsonb not null default '[]'::jsonb;
update public.facturas set archivos = jsonb_build_array(jsonb_build_object('path', archivo_ruta, 'name', coalesce(archivo_nombre, 'archivo'), 'type', coalesce(archivo_tipo, ''), 'size', 0, 'addedAt', actualizado_el))
where archivo_ruta is not null and archivos = '[]'::jsonb;
-- (log_activity muestra la columna como «archivos adjuntos» en el historial.)

-- Vincular a su web las facturas que no tenían (solo si el cliente tiene una única web). El panel hace lo mismo al guardar una factura.
update public.facturas f set web_id = (select w.id from public.webs w where w.cliente_id = f.cliente_id)
where f.web_id is null and (select count(*) from public.webs w where w.cliente_id = f.cliente_id) = 1;
