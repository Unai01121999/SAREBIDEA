-- SAREBIDEA · Tablas y columnas de la base de datos en español.
-- Tablas: clients→clientes, websites→webs, domains→dominios, hostings→alojamientos, invoices→facturas, tasks→tareas,
--         panel_users→usuarios_panel, activity→actividad, app_settings→ajustes, leads→solicitudes, admin_emails→correos_admin.
-- Las columnas se renombraron una a una (ver db-schema.ts del panel para la correspondencia completa). Los valores (ACTIVE, OWNER…) no cambian.
-- Las funciones lead_to_client, notify_new_lead, panel_role, my_panel_role, panel_me, is_admin, is_admin_email,
-- sync_admin_emails y log_activity se reescribieron con los nombres nuevos (en la base de datos).
-- Vista TEMPORAL de compatibilidad: `leads` (con los nombres antiguos, solo INSERT para anon) mantiene vivo el formulario de la
-- versión anterior de la web hasta que se publique la nueva. Cuando ya esté publicada la nueva, bórrala:
--   drop view public.leads;
alter table public.clients rename to clientes;
alter table public.websites rename to webs;
alter table public.domains rename to dominios;
alter table public.hostings rename to alojamientos;
alter table public.invoices rename to facturas;
alter table public.tasks rename to tareas;
alter table public.panel_users rename to usuarios_panel;
alter table public.activity rename to actividad;
alter table public.app_settings rename to ajustes;
alter table public.leads rename to solicitudes;
alter table public.admin_emails rename to correos_admin;
-- (columnas: clientes.company→empresa, contact_name→persona_contacto, email→correo, phone→telefono, address→direccion,
--  postal_code→codigo_postal, province→provincia, country→pais, tax_id→cif_nif, status→estado, services→servicios, notes→notas,
--  archived→archivado, origin→origen, source_id→id_origen, form_data→datos_formulario, created_at→creado_el, updated_at→actualizado_el;
--  y análogamente en el resto de tablas)
create view public.leads as select id, codigo as code, nombre as name, empresa as company, telefono as phone, correo as email, tipo_negocio as business_type, descripcion as description, origen as source, estado as status, notas as notes, web as website, dominio as domain, fecha_caducidad_dominio as domain_expiry, fecha_caducidad_web as web_expiry, importe as amount, estado_pago as payment_status, creado_el as created_at from public.solicitudes;
revoke all on public.leads from public, anon, authenticated;
grant insert (company, name, phone, email, business_type, description) on public.leads to anon;
