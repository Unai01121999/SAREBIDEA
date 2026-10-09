-- SAREBIDEA · Datos del panel privado en Supabase.
-- Tablas: clients, websites, domains, hostings, invoices, tasks, panel_users, activity, app_settings.
-- Seguridad: RLS activado; solo las cuentas de admin_emails con TOTP (is_admin()) pueden leer o escribir. El visitante anónimo no ve nada.
-- Además: cada solicitud nueva del formulario (tabla leads) crea sola su cliente (origen «Formulario web»).

create table if not exists public.clients (
  id text primary key,
  company text not null,
  contact_name text not null default '',
  email text not null default '',
  phone text not null default '',
  address text not null default '',
  postal_code text not null default '',
  province text not null default '',
  country text not null default 'España',
  tax_id text not null default '',
  status text not null default 'PENDING' check (status in ('ACTIVE','PENDING','INACTIVE')),
  services text[] not null default '{}',
  notes text not null default '',
  archived boolean not null default false,
  origin text not null default 'MANUAL' check (origin in ('MANUAL','FORM')),
  source_id text unique,
  form_data jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.websites (
  id text primary key,
  client_id text not null references public.clients(id) on delete cascade,
  name text not null,
  status text not null default 'DEVELOPMENT' check (status in ('DEVELOPMENT','PRODUCTION','PAUSED','ARCHIVED')),
  technology text not null default 'WORDPRESS',
  description text not null default '',
  domain_name text not null default '',
  production_url text not null default '',
  staging_url text not null default '',
  repo_url text not null default '',
  main_branch text not null default 'main',
  hosting_provider text not null default '',
  pack text,
  start_date timestamptz not null default now(),
  publish_date timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.domains (
  id text primary key,
  client_id text not null references public.clients(id) on delete cascade,
  website_id text references public.websites(id) on delete set null,
  name text not null,
  registrar text not null default '',
  registered_at timestamptz not null default now(),
  renews_at timestamptz not null,
  annual_cost numeric not null default 0,
  auto_renew boolean not null default true,
  dns text not null default '',
  nameservers text[] not null default '{}',
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.hostings (
  id text primary key,
  client_id text not null references public.clients(id) on delete cascade,
  website_id text references public.websites(id) on delete set null,
  provider text not null,
  plan text not null default '',
  annual_cost numeric not null default 0,
  contracted_at timestamptz not null default now(),
  renews_at timestamptz not null,
  active boolean not null default true,
  notes text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.invoices (
  id text primary key,
  number text not null unique,
  client_id text not null references public.clients(id) on delete cascade,
  concept text not null,
  description text not null default '',
  issued_at timestamptz not null default now(),
  due_at timestamptz not null default now(),
  subtotal numeric not null default 0,
  tax_rate numeric not null default 21,
  status text not null default 'PENDING' check (status in ('PAID','PENDING','OVERDUE','CANCELLED')),
  recurring boolean not null default false,
  website_id text references public.websites(id) on delete set null,
  domain_id text references public.domains(id) on delete set null,
  hosting_id text references public.hostings(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id text primary key,
  title text not null,
  description text not null default '',
  client_id text references public.clients(id) on delete cascade,
  website_id text references public.websites(id) on delete set null,
  priority text not null default 'MEDIUM',
  status text not null default 'TODO',
  labels text[] not null default '{}',
  comments jsonb not null default '[]',
  position integer not null default 0,
  due_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.panel_users (
  id text primary key,
  name text not null,
  email text not null,
  role text not null default 'VIEWER',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity (
  id text primary key,
  entity text not null,
  entity_id text not null,
  client_id text,
  message text not null,
  actor text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists public.app_settings (
  id integer primary key check (id = 1),
  data jsonb not null
);

create index if not exists websites_client_idx on public.websites(client_id);
create index if not exists domains_client_idx on public.domains(client_id);
create index if not exists hostings_client_idx on public.hostings(client_id);
create index if not exists invoices_client_idx on public.invoices(client_id);
create index if not exists tasks_client_idx on public.tasks(client_id);
create index if not exists activity_created_idx on public.activity(created_at desc);

-- Seguridad: solo is_admin() (cuenta de admin_emails + TOTP). El rol anónimo no tiene ningún acceso.
alter table public.clients enable row level security;
revoke all on public.clients from anon;
grant select, insert, update, delete on public.clients to authenticated;
create policy "admin todo" on public.clients for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.websites enable row level security;
revoke all on public.websites from anon;
grant select, insert, update, delete on public.websites to authenticated;
create policy "admin todo" on public.websites for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.domains enable row level security;
revoke all on public.domains from anon;
grant select, insert, update, delete on public.domains to authenticated;
create policy "admin todo" on public.domains for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.hostings enable row level security;
revoke all on public.hostings from anon;
grant select, insert, update, delete on public.hostings to authenticated;
create policy "admin todo" on public.hostings for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.invoices enable row level security;
revoke all on public.invoices from anon;
grant select, insert, update, delete on public.invoices to authenticated;
create policy "admin todo" on public.invoices for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.tasks enable row level security;
revoke all on public.tasks from anon;
grant select, insert, update, delete on public.tasks to authenticated;
create policy "admin todo" on public.tasks for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.panel_users enable row level security;
revoke all on public.panel_users from anon;
grant select, insert, update, delete on public.panel_users to authenticated;
create policy "admin todo" on public.panel_users for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.activity enable row level security;
revoke all on public.activity from anon;
grant select, insert, update, delete on public.activity to authenticated;
create policy "admin todo" on public.activity for all to authenticated using (public.is_admin()) with check (public.is_admin());
alter table public.app_settings enable row level security;
revoke all on public.app_settings from anon;
grant select, insert, update, delete on public.app_settings to authenticated;
create policy "admin todo" on public.app_settings for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Valores iniciales
insert into public.app_settings (id, data) values (1, '{
  "company": {"name": "SAREBIDEA", "taxId": "79078063S", "address": "Gueñes", "email": "sarebidea@sarebidea.com", "phone": "", "website": "https://sarebidea.com"},
  "taxes": {"vat": 21, "irpf": 15},
  "currency": "EUR",
  "hostingProviders": ["Hostinger", "SiteGround", "OVH", "Cloudways", "Raiola", "Otros"],
  "domainRegistrars": ["Hostinger", "OVH", "Cloudflare", "DonDominio", "GoDaddy", "Otros"]
}') on conflict (id) do nothing;
insert into public.panel_users (id, name, email, role) values ('usr_001', 'Unai Padura Larrea', 'sarebidea@sarebidea.com', 'OWNER') on conflict (id) do nothing;

-- Cada solicitud nueva del formulario crea su cliente (idempotente por source_id).
create or replace function public.lead_to_client() returns trigger
language plpgsql security definer set search_path = public as $fn$
declare cid text := 'cli_' || substr(replace(new.id::text, '-', ''), 1, 12);
begin
  insert into public.clients (id, company, contact_name, email, phone, status, notes, origin, source_id, form_data, created_at, updated_at)
  values (
    cid,
    coalesce(nullif(btrim(new.company), ''), new.name),
    new.name,
    coalesce(new.email, ''),
    coalesce(new.phone, ''),
    case coalesce(new.status, 'nuevo') when 'cliente' then 'ACTIVE' when 'descartado' then 'INACTIVE' else 'PENDING' end,
    concat_ws(chr(10), nullif('Web: ' || coalesce(new.website, ''), 'Web: '), nullif('Dominio: ' || coalesce(new.domain, ''), 'Dominio: '), new.notes),
    case when coalesce(new.source, 'web') = 'web' then 'FORM' else 'MANUAL' end,
    new.id::text,
    case when coalesce(new.source, 'web') = 'web'
      then jsonb_build_object('code', coalesce(new.code, ''), 'businessType', coalesce(new.business_type, ''), 'description', coalesce(new.description, ''), 'submittedAt', new.created_at)
      end,
    new.created_at,
    now()
  ) on conflict (source_id) do nothing;
  if found then
    insert into public.activity (id, entity, entity_id, client_id, message, actor, created_at)
    values ('act_' || substr(replace(new.id::text, '-', ''), 1, 12), 'client', cid, cid,
      'Nueva solicitud ' || case when coalesce(new.source, 'web') = 'web' then 'del formulario' else 'importada' end || ': ' || coalesce(nullif(btrim(new.company), ''), new.name),
      'Formulario web', new.created_at);
  end if;
  return new;
end $fn$;

drop trigger if exists leads_to_client on public.leads;
create trigger leads_to_client after insert on public.leads for each row execute function public.lead_to_client();

-- Solicitudes que ya existían
insert into public.clients (id, company, contact_name, email, phone, status, notes, origin, source_id, form_data, created_at, updated_at)
select 'cli_' || substr(replace(l.id::text, '-', ''), 1, 12),
  coalesce(nullif(btrim(l.company), ''), l.name), l.name, coalesce(l.email, ''), coalesce(l.phone, ''),
  case coalesce(l.status, 'nuevo') when 'cliente' then 'ACTIVE' when 'descartado' then 'INACTIVE' else 'PENDING' end,
  concat_ws(chr(10), nullif('Web: ' || coalesce(l.website, ''), 'Web: '), nullif('Dominio: ' || coalesce(l.domain, ''), 'Dominio: '), l.notes),
  case when coalesce(l.source, 'web') = 'web' then 'FORM' else 'MANUAL' end,
  l.id::text,
  case when coalesce(l.source, 'web') = 'web' then jsonb_build_object('code', coalesce(l.code, ''), 'businessType', coalesce(l.business_type, ''), 'description', coalesce(l.description, ''), 'submittedAt', l.created_at) end,
  l.created_at, now()
from public.leads l
on conflict (source_id) do nothing;
