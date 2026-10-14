-- El «coste anual» de un dominio es el precio de la renovación de hosting + dominio según el pack del cliente:
-- Starter 90 € · Professional 120 € · Premium 180 € (función precio_renovacion, migración 014).
-- El pack se toma como en la facturación: primera factura de pack de esa web → primera del cliente → pack elegido en el formulario.
-- Se mantiene sincronizado: al crearse la primera factura de un pack, al registrar un dominio, a diario junto con las renovaciones y una vez ahora.
-- Sin pack conocido no se toca el valor que haya.
create or replace function public.pack_del_dominio(p_cliente text, p_web text) returns text language plpgsql stable security definer set search_path to 'public' as $fn$
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
end $fn$;
revoke all on function public.pack_del_dominio(text, text) from public, anon;

create or replace function public.sincronizar_coste_dominios(p_cliente text default null) returns integer language plpgsql security definer set search_path to 'public' as $fn$
declare n integer;
begin
  update public.dominios d set coste_anual = public.precio_renovacion(public.pack_del_dominio(d.cliente_id, d.web_id))
   where (p_cliente is null or d.cliente_id = p_cliente)
     and public.precio_renovacion(public.pack_del_dominio(d.cliente_id, d.web_id)) is not null
     and d.coste_anual is distinct from public.precio_renovacion(public.pack_del_dominio(d.cliente_id, d.web_id));
  get diagnostics n = row_count;
  return n;
end $fn$;
revoke all on function public.sincronizar_coste_dominios(text) from public, anon;

create or replace function public.trg_sincronizar_coste_dominios() returns trigger language plpgsql security definer set search_path to 'public' as $fn$
begin
  if tg_table_name = 'facturas' then
    if new.pack is not null and new.concepto = 'WEB_DEVELOPMENT' then perform public.sincronizar_coste_dominios(new.cliente_id); end if;
  else
    new.coste_anual := coalesce(public.precio_renovacion(public.pack_del_dominio(new.cliente_id, new.web_id)), new.coste_anual);
  end if;
  return new;
end $fn$;
drop trigger if exists facturas_sincronizar_coste_dominios on public.facturas;
create trigger facturas_sincronizar_coste_dominios after insert or update of pack on public.facturas for each row execute function public.trg_sincronizar_coste_dominios();
drop trigger if exists dominios_coste_por_pack on public.dominios;
create trigger dominios_coste_por_pack before insert on public.dominios for each row execute function public.trg_sincronizar_coste_dominios();

-- La renovación diaria también repasa los costes (por si cambió algo sin pasar por los disparadores).
create or replace function public.generar_facturas_renovacion_con_costes() returns integer language plpgsql security definer set search_path to 'public' as $fn$
begin
  perform public.sincronizar_coste_dominios();
  return public.generar_facturas_renovacion();
end $fn$;
revoke all on function public.generar_facturas_renovacion_con_costes() from public, anon, authenticated;
select cron.unschedule('facturas-renovacion-anual');
select cron.schedule('facturas-renovacion-anual', '10 4 * * *', 'select public.generar_facturas_renovacion_con_costes()');
select public.sincronizar_coste_dominios();
