-- 023 · Correcciones de severidad baja de la auditoría (ya aplicadas en el proyecto).

-- B1 · Adjuntos de facturas: solo rutas del almacenamiento privado («<id factura>/<marca>-<nombre>») y tipos PDF/imagen.
create or replace function public.archivos_factura_validos(p jsonb)
 returns boolean language sql immutable set search_path to 'public'
as $function$
  select jsonb_typeof(coalesce(p, '[]'::jsonb)) = 'array'
     and not exists (
       select 1 from jsonb_array_elements(coalesce(p, '[]'::jsonb)) e
        where jsonb_typeof(e) <> 'object'
           or coalesce(e->>'path', '') !~ '^[A-Za-z0-9_-]+/[0-9]+-[A-Za-z0-9._-]+$'
           or coalesce(e->>'type', '') not in ('image/jpeg', 'image/png', 'image/webp', 'application/pdf'));
$function$;
alter table public.facturas add constraint facturas_archivos_validos check (public.archivos_factura_validos(archivos));
alter table public.facturas add constraint facturas_archivo_ruta_valida check (archivo_ruta is null or archivo_ruta ~ '^[A-Za-z0-9_-]+/[0-9]+-[A-Za-z0-9._-]+$');

-- B8 · Comentarios de tareas: el autor (y la fecha) de cada comentario nuevo los pone la base de datos;
--      los comentarios ya guardados no se pueden reescribir (sí quitar).
create or replace function public.trg_autor_comentarios()
 returns trigger language plpgsql security definer set search_path to 'public'
as $function$
declare quien text; viejos jsonb := '[]'; e jsonb; res jsonb := '[]';
begin
  select u.nombre into quien from public.usuarios_panel u where u.id_autenticacion = auth.uid() limit 1;
  if quien is null then return new; end if;
  if tg_op = 'UPDATE' then viejos := coalesce(old.comentarios, '[]'); end if;
  for e in select * from jsonb_array_elements(coalesce(new.comentarios, '[]')) loop
    if exists (select 1 from jsonb_array_elements(viejos) o where o->>'id' = e->>'id') then
      res := res || (select o from jsonb_array_elements(viejos) o where o->>'id' = e->>'id' limit 1);
    else
      res := res || jsonb_build_object('id', coalesce(e->>'id', 'cmt_' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 10)),
                                       'text', left(coalesce(e->>'text', ''), 4000), 'author', quien, 'createdAt', to_jsonb(now()));
    end if;
  end loop;
  new.comentarios := res;
  return new;
end $function$;
revoke execute on function public.trg_autor_comentarios() from public, anon, authenticated;
create trigger tareas_autor_comentarios before insert or update of comentarios on public.tareas for each row execute function public.trg_autor_comentarios();

-- B9 · Historial: cada rol ve solo los eventos de los apartados a los que tiene acceso.
alter policy "activity ver" on public.actividad using (
  case entidad
    when 'invoice' then public.panel_can('billing', 'read')
    when 'settings' then public.panel_can('settings', 'read')
    when 'user' then public.panel_can('settings', 'read')
    when 'task' then public.panel_can('tasks', 'read')
    else public.panel_can('clients', 'read')
  end);
