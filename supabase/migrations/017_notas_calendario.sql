-- Notas del calendario del panel: una o varias notas descriptivas por día con lo que hay que hacer (con casilla de «hecha»).
-- Permisos como las tareas (módulo «tasks»): ver → quien puede leer tareas; crear, editar y borrar → quien puede escribirlas
-- (propietario, administrador y editor; el lector solo ve). El visitante anónimo no tiene acceso.
create table if not exists public.notas_calendario (
  id text primary key,
  dia date not null,
  texto text not null check (length(btrim(texto)) > 0 and length(texto) <= 4000),
  hecha boolean not null default false,
  autor text not null default '',
  creado_el timestamptz not null default now(),
  actualizado_el timestamptz not null default now()
);
create index if not exists notas_calendario_dia on public.notas_calendario (dia);
alter table public.notas_calendario enable row level security;
revoke all on table public.notas_calendario from anon;
create policy "notas ver" on public.notas_calendario for select to authenticated using (public.panel_can('tasks', 'read'));
create policy "notas crear" on public.notas_calendario for insert to authenticated with check (public.panel_can('tasks', 'write'));
create policy "notas editar" on public.notas_calendario for update to authenticated using (public.panel_can('tasks', 'write')) with check (public.panel_can('tasks', 'write'));
create policy "notas borrar" on public.notas_calendario for delete to authenticated using (public.panel_can('tasks', 'write'));
