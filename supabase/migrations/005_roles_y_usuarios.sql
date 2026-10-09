-- SAREBIDEA · Usuarios y roles del panel gestionados desde la propia aplicación.
-- panel_users es la fuente de verdad (correo, rol, activo). admin_emails se mantiene sincronizada por un trigger.
-- Los permisos los aplica la base de datos con políticas RLS por rol; el panel solo oculta lo que no corresponde.
-- Crear/borrar cuentas de acceso lo hace la Edge Function `manage-panel-users` (solo propietario con doble factor).

alter table public.panel_users add column if not exists auth_id uuid;
create unique index if not exists panel_users_email_key on public.panel_users (lower(email));

create or replace function public.panel_role() returns text language sql stable security definer set search_path = public as $fn$
  select u.role from public.panel_users u where lower(u.email) = lower(coalesce(auth.jwt()->>'email', '')) and u.active and coalesce(auth.jwt()->>'aal', '') = 'aal2' limit 1;
$fn$;
create or replace function public.my_panel_role() returns text language sql stable security definer set search_path = public as $fn$
  select u.role from public.panel_users u where lower(u.email) = lower(coalesce(auth.jwt()->>'email', '')) and u.active limit 1;
$fn$;
create or replace function public.panel_me() returns jsonb language sql stable security definer set search_path = public as $fn$
  select to_jsonb(x) from (select u.name, u.email, u.role from public.panel_users u where lower(u.email) = lower(coalesce(auth.jwt()->>'email', '')) and u.active limit 1) x;
$fn$;
-- Matriz de permisos: OWNER todo · ADMIN todo salvo configuración (solo lectura) · EDITOR clientes y tareas, facturación solo lectura · VIEWER clientes y tareas solo lectura.
create or replace function public.panel_can(module text, action text) returns boolean language sql stable security definer set search_path = public as $fn$
  select case public.panel_role()
    when 'OWNER' then true
    when 'ADMIN' then module in ('clients', 'tasks', 'billing') or (module = 'settings' and action = 'read')
    when 'EDITOR' then module in ('clients', 'tasks') or (module = 'billing' and action = 'read')
    when 'VIEWER' then module in ('clients', 'tasks') and action = 'read'
    else false
  end;
$fn$;
revoke all on function public.panel_role() from public, anon;
revoke all on function public.my_panel_role() from public, anon;
revoke all on function public.panel_me() from public, anon;
revoke all on function public.panel_can(text, text) from public, anon;
grant execute on function public.panel_role() to authenticated;
grant execute on function public.my_panel_role() to authenticated;
grant execute on function public.panel_me() to authenticated;
grant execute on function public.panel_can(text, text) to authenticated;

-- Políticas por módulo (clients = clientes, webs, dominios, hosting y solicitudes del formulario)
create policy "clients ver" on public.clients for select to authenticated using (public.panel_can('clients', 'read'));
create policy "clients crear" on public.clients for insert to authenticated with check (public.panel_can('clients', 'write'));
create policy "clients editar" on public.clients for update to authenticated using (public.panel_can('clients', 'write')) with check (public.panel_can('clients', 'write'));
create policy "clients borrar" on public.clients for delete to authenticated using (public.panel_can('clients', 'write'));
create policy "websites ver" on public.websites for select to authenticated using (public.panel_can('clients', 'read'));
create policy "websites crear" on public.websites for insert to authenticated with check (public.panel_can('clients', 'write'));
create policy "websites editar" on public.websites for update to authenticated using (public.panel_can('clients', 'write')) with check (public.panel_can('clients', 'write'));
create policy "websites borrar" on public.websites for delete to authenticated using (public.panel_can('clients', 'write'));
create policy "domains ver" on public.domains for select to authenticated using (public.panel_can('clients', 'read'));
create policy "domains crear" on public.domains for insert to authenticated with check (public.panel_can('clients', 'write'));
create policy "domains editar" on public.domains for update to authenticated using (public.panel_can('clients', 'write')) with check (public.panel_can('clients', 'write'));
create policy "domains borrar" on public.domains for delete to authenticated using (public.panel_can('clients', 'write'));
create policy "hostings ver" on public.hostings for select to authenticated using (public.panel_can('clients', 'read'));
create policy "hostings crear" on public.hostings for insert to authenticated with check (public.panel_can('clients', 'write'));
create policy "hostings editar" on public.hostings for update to authenticated using (public.panel_can('clients', 'write')) with check (public.panel_can('clients', 'write'));
create policy "hostings borrar" on public.hostings for delete to authenticated using (public.panel_can('clients', 'write'));
create policy "tasks ver" on public.tasks for select to authenticated using (public.panel_can('tasks', 'read'));
create policy "tasks crear" on public.tasks for insert to authenticated with check (public.panel_can('tasks', 'write'));
create policy "tasks editar" on public.tasks for update to authenticated using (public.panel_can('tasks', 'write')) with check (public.panel_can('tasks', 'write'));
create policy "tasks borrar" on public.tasks for delete to authenticated using (public.panel_can('tasks', 'write'));
create policy "invoices ver" on public.invoices for select to authenticated using (public.panel_can('billing', 'read'));
create policy "invoices crear" on public.invoices for insert to authenticated with check (public.panel_can('billing', 'write'));
create policy "invoices editar" on public.invoices for update to authenticated using (public.panel_can('billing', 'write')) with check (public.panel_can('billing', 'write'));
create policy "invoices borrar" on public.invoices for delete to authenticated using (public.panel_can('billing', 'write'));
create policy "settings ver" on public.app_settings for select to authenticated using (public.panel_role() is not null);
create policy "settings crear" on public.app_settings for insert to authenticated with check (public.panel_can('settings', 'write'));
create policy "settings editar" on public.app_settings for update to authenticated using (public.panel_can('settings', 'write')) with check (public.panel_can('settings', 'write'));
create policy "activity ver" on public.activity for select to authenticated using (public.panel_role() is not null);
create policy "activity crear" on public.activity for insert to authenticated with check (public.panel_role() in ('OWNER', 'ADMIN', 'EDITOR'));
create policy "usuarios ver" on public.panel_users for select to authenticated using (public.panel_can('settings', 'read'));
create policy "leads ver" on public.leads for select to authenticated using (public.panel_can('clients', 'read'));
create policy "leads crear" on public.leads for insert to authenticated with check (public.panel_can('clients', 'write'));
create policy "leads editar" on public.leads for update to authenticated using (public.panel_can('clients', 'write')) with check (public.panel_can('clients', 'write'));
create policy "leads borrar" on public.leads for delete to authenticated using (public.panel_can('clients', 'write'));

-- Las políticas antiguas «admin todo» (acceso total para cualquier admin) quedan anuladas. Lo ideal es borrarlas:
--   drop policy "admin todo" on public.<tabla>;   (clients, websites, domains, hostings, invoices, tasks, panel_users, activity, app_settings)
--   drop policy "admin lee" / "admin edita" / "admin inserta" / "admin borra" on public.leads;
alter policy "admin todo" on public.clients using (false) with check (false);
alter policy "admin todo" on public.websites using (false) with check (false);
alter policy "admin todo" on public.domains using (false) with check (false);
alter policy "admin todo" on public.hostings using (false) with check (false);
alter policy "admin todo" on public.invoices using (false) with check (false);
alter policy "admin todo" on public.tasks using (false) with check (false);
alter policy "admin todo" on public.panel_users using (false) with check (false);
alter policy "admin todo" on public.activity using (false) with check (false);
alter policy "admin todo" on public.app_settings using (false) with check (false);
alter policy "admin lee" on public.leads using (false);
alter policy "admin edita" on public.leads using (false) with check (false);
alter policy "admin inserta" on public.leads with check (false);
alter policy "admin borra" on public.leads using (false);

-- admin_emails refleja a los usuarios activos de panel_users
create or replace function public.sync_admin_emails() returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  if tg_op = 'DELETE' then
    delete from public.admin_emails where lower(email) = lower(old.email);
    return old;
  end if;
  if tg_op = 'UPDATE' and lower(old.email) <> lower(new.email) then
    delete from public.admin_emails where lower(email) = lower(old.email);
  end if;
  if new.active then
    insert into public.admin_emails (email) values (lower(new.email)) on conflict do nothing;
  else
    delete from public.admin_emails where lower(email) = lower(new.email);
  end if;
  return new;
end;
$fn$;
create trigger panel_users_sync_admin after insert or update or delete on public.panel_users for each row execute function public.sync_admin_emails();
