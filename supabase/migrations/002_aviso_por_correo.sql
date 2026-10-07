-- SAREBIDEA · Correo "Nuevo Cliente" a sarebidea@sarebidea.com cada vez que alguien envía el formulario.
-- Antes: despliega la función `notify-new-lead` (ver SETUP-BACKEND.md).
-- Sustituye TU_PROYECTO y TU_SECRETO (el mismo valor que pusiste en WEBHOOK_SECRET) y ejecútalo.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_lead() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if new.source = 'web' then
    perform net.http_post(
      url     := 'https://klvdmrkwscmzpzyuquih.supabase.co/functions/v1/notify-new-lead',
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-webhook-secret', 'TU_SECRETO'),
      body    := jsonb_build_object('type', 'INSERT', 'table', 'leads', 'record', to_jsonb(new))
    );
  end if;
  return new;
end;
$$;

drop trigger if exists leads_notify_new on public.leads;
create trigger leads_notify_new after insert on public.leads
  for each row execute function public.notify_new_lead();
