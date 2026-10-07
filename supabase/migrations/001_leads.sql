-- SAREBIDEA · Clientes del Área privada
-- Ejecutar en Supabase → SQL Editor (o `supabase db push`).

-- Cuentas con acceso al Área privada. Para dar acceso a otra persona, añade su correo aquí.
create table if not exists public.admin_emails (email text primary key);
insert into public.admin_emails (email) values ('sarebidea@sarebidea.com') on conflict do nothing;
alter table public.admin_emails enable row level security; -- sin políticas: nadie la lee desde la web

-- Acceso = correo autorizado + sesión con segundo factor (aal2)
create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(auth.jwt() ->> 'aal', '') = 'aal2'
     and exists (select 1 from public.admin_emails where email = lower(auth.jwt() ->> 'email'));
$$;

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
  notes          text,
  website        text,
  domain         text,
  domain_expiry  date,
  web_expiry     date,
  amount         numeric(10, 2) check (amount >= 0),
  payment_status text not null default 'pendiente' check (payment_status in ('pendiente', 'pagado', 'atrasado'))
);

alter table public.leads enable row level security;

-- Visitantes de la web: solo pueden ENVIAR el formulario, y solo con estos cinco campos.
revoke all on public.leads from anon;
grant insert (name, phone, email, business_type, description) on public.leads to anon;
grant usage on sequence public.lead_code_seq to anon, authenticated;

drop policy if exists "formulario web" on public.leads;
create policy "formulario web" on public.leads for insert to anon
  with check (source = 'web' and status = 'nuevo');

-- Equipo (correo autorizado + segundo factor): todo.
grant select, insert, update, delete on public.leads to authenticated;
drop policy if exists "equipo" on public.leads;
create policy "equipo" on public.leads for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Actualizaciones en vivo en el Área privada
alter publication supabase_realtime add table public.leads;
