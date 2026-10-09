-- SAREBIDEA · Historial (tabla activity) automático, con el nombre real de quien hace cada cambio.
-- Un disparador por tabla escribe una fila cuando se crea, edita o borra algo, venga de donde venga (panel, SQL…).
-- El actor sale del correo de la sesión (panel_users.name); si no hay sesión, «Sistema».
-- No se anotan: mover tarjetas en el tablero (solo cambia `position`), cambios solo de servicios del cliente (automáticos),
-- vínculos que se anulan por borrar la web, borrados en cascada de un cliente, ni las altas desde el formulario
-- (esas ya las anota lead_to_client). Altas/cambios/bajas de usuarios las anota la función manage-panel-users.
-- La función log_activity() está creada en la base de datos (ver su definición allí); se asocia así:
create trigger log_activity_clients after insert or update or delete on public.clients for each row execute function public.log_activity();
create trigger log_activity_websites after insert or update or delete on public.websites for each row execute function public.log_activity();
create trigger log_activity_domains after insert or update or delete on public.domains for each row execute function public.log_activity();
create trigger log_activity_hostings after insert or update or delete on public.hostings for each row execute function public.log_activity();
create trigger log_activity_invoices after insert or update or delete on public.invoices for each row execute function public.log_activity();
create trigger log_activity_tasks after insert or update or delete on public.tasks for each row execute function public.log_activity();
create trigger log_activity_settings after insert or update or delete on public.app_settings for each row execute function public.log_activity();
