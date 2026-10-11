-- Facturación por pack: cada factura puede llevar el pack (en base_imponible va el precio del pack) y el mantenimiento
-- mensual en una columna aparte. La primera factura incluye pack + primer mes; los meses siguientes se generan
-- facturas independientes solo de mantenimiento (factura_origen_id apunta a la primera; el índice único evita duplicarlas).
-- Cambio aditivo: las facturas anteriores quedan con pack = NULL y mantenimiento = 0.
alter table public.facturas add column if not exists pack text check (pack is null or pack in ('STARTER','PROFESSIONAL','PREMIUM'));
alter table public.facturas add column if not exists mantenimiento numeric not null default 0 check (mantenimiento >= 0);
alter table public.facturas add column if not exists factura_origen_id text;
create unique index if not exists facturas_mantenimiento_unica on public.facturas (factura_origen_id, fecha_emision) where factura_origen_id is not null;
