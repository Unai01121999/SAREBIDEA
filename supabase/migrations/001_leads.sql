-- SAREBIDEA · Administradores y clientes (leads)

-- Cuentas con acceso al Área privada. Sin políticas: nadie la lee desde la web.
create table if not exists public.admin_emails (email text primary key check (email = lower(email)));
insert into public.admin_emails (email) values ('sarebidea@sarebidea.com') on conflict do nothing;
alter table public.admin_emails enable row level security;
revoke all on public.admin_emails from anon, authenticated;

-- Acceso = correo autorizado + sesión con segundo factor (aal2)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.admin_emails where email = lower(auth.jwt() ->> 'email'));
$$;
revoke execute on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

create sequence if not exists public.lead_code_seq;

create table if not exists public.leads (
  id             uuid primary key default gen_random_uuid(),
  code           text unique not null default 'SB-' || lpad(nextval('public.lead_code_seq')::text, 4, '0'),
  created_at     timestamptz not null default now(),
  name           text not null check (char_length(name) between 2 and 120),
  phone          text not null default '' check (char_length(phone) <= 30),
  email          text not null default '' check (char_length(email) <= 160),
  business_type  text not null default '' check (char_length(business_type) <= 80),
  description    text not null default '' check (char_length(description) <= 2000),
  source         text not null default 'web' check (source in ('web', 'telefono', 'presencial', 'email', 'otro')),
  status         text not null default 'nuevo' check (status in ('nuevo', 'contactado', 'cliente', 'descartado')),
  notes          text check (char_length(notes) <= 4000),
  website        text check (char_length(website) <= 300),
  domain         text check (char_length(domain) <= 200),
  domain_expiry  date,
  web_expiry     date,
  amount         numeric(10, 2) check (amount >= 0),
  payment_status text not null default 'pendiente' check (payment_status in ('pendiente', 'pagado', 'atrasado'))
);

alter table public.leads enable row level security;

-- Los visitantes no tocan la tabla: el formulario pasa por la Edge Function `submit-lead`
-- (anti-bot + validación), que inserta con la clave de servicio.
revoke all on public.leads from anon;
revoke all on sequence public.lead_code_seq from anon;
-- El código por defecto usa nextval con los permisos de quien inserta (el administrador).
grant usage on sequence public.lead_code_seq to authenticated;

-- Equipo (correo autorizado + segundo factor): todo.
grant select, insert, update, delete on public.leads to authenticated;
drop policy if exists "equipo" on public.leads;
create policy "equipo" on public.leads for all to authenticated
  using ((select public.is_admin())) with check ((select public.is_admin()));

-- Actualizaciones en vivo en el Área privada (RLS también se aplica a Realtime)
alter publication supabase_realtime add table public.leads;
