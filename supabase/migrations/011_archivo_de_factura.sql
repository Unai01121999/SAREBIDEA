-- Archivo de la factura real (jpg, png, webp o pdf, máx. 10 MB) adjunto a cada factura.
-- El archivo vive en un bucket PRIVADO de Supabase Storage («facturas»); en la tabla solo se guarda su ruta, nombre y tipo.
-- Se ve en otra pestaña con una URL firmada que caduca a los 5 minutos (no se descarga). Permisos: leer = panel_can('billing','read');
-- subir / reemplazar / borrar = panel_can('billing','write').
alter table public.facturas add column if not exists archivo_ruta text;
alter table public.facturas add column if not exists archivo_nombre text;
alter table public.facturas add column if not exists archivo_tipo text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types) values ('facturas', 'facturas', false, 10485760, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do update set public = false, file_size_limit = 10485760, allowed_mime_types = excluded.allowed_mime_types;
create policy "facturas archivos: leer" on storage.objects for select to authenticated using (bucket_id = 'facturas' and public.panel_can('billing', 'read'));
create policy "facturas archivos: subir" on storage.objects for insert to authenticated with check (bucket_id = 'facturas' and public.panel_can('billing', 'write'));
create policy "facturas archivos: reemplazar" on storage.objects for update to authenticated using (bucket_id = 'facturas' and public.panel_can('billing', 'write')) with check (bucket_id = 'facturas' and public.panel_can('billing', 'write'));
create policy "facturas archivos: borrar" on storage.objects for delete to authenticated using (bucket_id = 'facturas' and public.panel_can('billing', 'write'));

-- El historial (log_activity) muestra estas columnas con nombre legible: «archivo adjunto», «mantenimiento», «factura de origen»
-- (se añadieron al diccionario `nombres` y se agrupan con string_agg(distinct …)).
