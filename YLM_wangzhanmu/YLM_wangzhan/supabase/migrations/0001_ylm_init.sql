create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.models (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text not null,
  brand text,
  vehicle_class text,
  energy_type text,
  year int,
  fob_price_min numeric,
  fob_price_max numeric,
  currency text not null default 'USD',
  is_hot boolean not null default false,
  is_active boolean not null default true,
  specs jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_models_hot_active on public.models(is_hot, is_active);
create index if not exists idx_models_brand on public.models(brand);
create index if not exists idx_models_energy_type on public.models(energy_type);

drop trigger if exists trg_models_updated_at on public.models;
create trigger trg_models_updated_at
before update on public.models
for each row execute function public.set_updated_at();

create table if not exists public.model_images (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null,
  path text not null,
  alt text,
  sort_order int not null default 0,
  is_cover boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists idx_model_images_model_id on public.model_images(model_id);

create table if not exists public.model_translations (
  id uuid primary key default gen_random_uuid(),
  model_id uuid not null,
  locale text not null,
  name text not null,
  summary text,
  description text,
  seo jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique (model_id, locale)
);

create index if not exists idx_model_translations_model_id on public.model_translations(model_id);
create index if not exists idx_model_translations_locale on public.model_translations(locale);

drop trigger if exists trg_model_translations_updated_at on public.model_translations;
create trigger trg_model_translations_updated_at
before update on public.model_translations
for each row execute function public.set_updated_at();

create table if not exists public.inquiries (
  id uuid primary key default gen_random_uuid(),
  inquiry_no text unique not null default (
    'YLM-' || to_char(now(), 'YYYYMMDD') || '-' || substr(md5(gen_random_uuid()::text), 1, 6)
  ),
  locale text,
  company_name text not null,
  contact_name text not null,
  email text not null,
  whatsapp text,
  country_region text,
  incoterm text,
  destination_port text,
  total_quantity int,
  need_by text,
  note text,
  status text not null default 'new' check (status in ('new','contacted','quoting','won','lost')),
  admin_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_inquiries_created_at on public.inquiries(created_at desc);
create index if not exists idx_inquiries_status on public.inquiries(status);

drop trigger if exists trg_inquiries_updated_at on public.inquiries;
create trigger trg_inquiries_updated_at
before update on public.inquiries
for each row execute function public.set_updated_at();

create table if not exists public.inquiry_items (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null,
  model_id uuid,
  quantity int,
  note text
);

create index if not exists idx_inquiry_items_inquiry_id on public.inquiry_items(inquiry_id);
create index if not exists idx_inquiry_items_model_id on public.inquiry_items(model_id);

create table if not exists public.site_config (
  id uuid primary key default gen_random_uuid(),
  key text unique not null,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_site_config_updated_at on public.site_config;
create trigger trg_site_config_updated_at
before update on public.site_config
for each row execute function public.set_updated_at();

alter table public.models enable row level security;
alter table public.model_images enable row level security;
alter table public.model_translations enable row level security;
alter table public.inquiries enable row level security;
alter table public.inquiry_items enable row level security;
alter table public.site_config enable row level security;

grant select on public.models to anon;
grant select on public.model_images to anon;
grant select on public.model_translations to anon;
grant insert on public.inquiries to anon;
grant insert on public.inquiry_items to anon;
grant select on public.site_config to anon;

grant all privileges on public.models to authenticated;
grant all privileges on public.model_images to authenticated;
grant all privileges on public.model_translations to authenticated;
grant all privileges on public.inquiries to authenticated;
grant all privileges on public.inquiry_items to authenticated;
grant all privileges on public.site_config to authenticated;

drop policy if exists models_select_active_for_anon on public.models;
create policy models_select_active_for_anon
on public.models
for select
to anon
using (is_active = true);

drop policy if exists models_all_for_admin on public.models;
create policy models_all_for_admin
on public.models
for all
to authenticated
using (true)
with check (true);

drop policy if exists model_images_select_for_anon on public.model_images;
create policy model_images_select_for_anon
on public.model_images
for select
to anon
using (
  exists (
    select 1
    from public.models m
    where m.id = model_images.model_id and m.is_active = true
  )
);

drop policy if exists model_images_all_for_admin on public.model_images;
create policy model_images_all_for_admin
on public.model_images
for all
to authenticated
using (true)
with check (true);

drop policy if exists model_translations_select_for_anon on public.model_translations;
create policy model_translations_select_for_anon
on public.model_translations
for select
to anon
using (
  exists (
    select 1
    from public.models m
    where m.id = model_translations.model_id and m.is_active = true
  )
);

drop policy if exists model_translations_all_for_admin on public.model_translations;
create policy model_translations_all_for_admin
on public.model_translations
for all
to authenticated
using (true)
with check (true);

drop policy if exists inquiries_insert_for_anon on public.inquiries;
create policy inquiries_insert_for_anon
on public.inquiries
for insert
to anon
with check (true);

drop policy if exists inquiries_all_for_admin on public.inquiries;
create policy inquiries_all_for_admin
on public.inquiries
for all
to authenticated
using (true)
with check (true);

drop policy if exists inquiry_items_insert_for_anon on public.inquiry_items;
create policy inquiry_items_insert_for_anon
on public.inquiry_items
for insert
to anon
with check (true);

drop policy if exists inquiry_items_all_for_admin on public.inquiry_items;
create policy inquiry_items_all_for_admin
on public.inquiry_items
for all
to authenticated
using (true)
with check (true);

drop policy if exists site_config_select_for_anon on public.site_config;
create policy site_config_select_for_anon
on public.site_config
for select
to anon
using (true);

drop policy if exists site_config_all_for_admin on public.site_config;
create policy site_config_all_for_admin
on public.site_config
for all
to authenticated
using (true)
with check (true);
