-- Formulario: «¿Qué pack te interesa?» (Starter, Professional, Premium o «No lo tengo claro» = INDECISO).
-- Se guarda en solicitudes.pack_interes y el trigger lo copia a clientes.pack_interes (ficha del cliente).
-- Cambio aditivo: las filas anteriores quedan en NULL («Sin indicar»).
alter table public.solicitudes add column if not exists pack_interes text check (pack_interes is null or pack_interes in ('STARTER','PROFESSIONAL','PREMIUM','INDECISO'));
alter table public.clientes add column if not exists pack_interes text check (pack_interes is null or pack_interes in ('STARTER','PROFESSIONAL','PREMIUM','INDECISO'));
grant insert (pack_interes) on public.solicitudes to anon;

-- lead_to_client(): igual que antes pero copiando pack_interes a la ficha.
create or replace function public.lead_to_client() returns trigger language plpgsql security definer set search_path to 'public' as $fn$
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
end $fn$;
