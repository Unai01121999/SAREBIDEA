-- 019 · El mantenimiento se factura aparte del diseño web (ya aplicada en el proyecto).
-- El mantenimiento mensual automático arranca desde la primera factura de «Mantenimiento mensual» hecha a mano
-- (o, en facturas antiguas, desde la de diseño web que llevaba el primer mes): una sola por cliente y web.
do $$
declare d text; a text := $a$for f in select * from public.facturas where pack is not null and mantenimiento > 0 and factura_origen_id is null and concepto = 'WEB_DEVELOPMENT' and estado <> 'CANCELLED' loop$a$;
begin
  d := pg_get_functiondef('public.generar_facturas_mantenimiento()'::regprocedure);
  if position(a in d) = 0 then raise exception 'generar_facturas_mantenimiento: texto no encontrado'; end if;
  d := replace(d, a, $b$for f in select distinct on (cliente_id, coalesce(web_id, '')) * from public.facturas where pack is not null and mantenimiento > 0 and factura_origen_id is null and concepto in ('MAINTENANCE', 'WEB_DEVELOPMENT') and estado <> 'CANCELLED' order by cliente_id, coalesce(web_id, ''), fecha_emision loop$b$);
  execute d;
end $$;
