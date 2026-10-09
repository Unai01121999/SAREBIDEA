-- Formulario: «Nombre de la empresa» + «Persona de contacto» (en `name`). Cambio aditivo: no toca datos existentes.
alter table public.leads add column if not exists company text check (company is null or char_length(company) <= 120);
grant insert (company) on public.leads to anon;
