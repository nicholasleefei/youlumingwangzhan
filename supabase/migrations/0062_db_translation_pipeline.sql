create table if not exists public.admin_secrets (
  key text primary key,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_admin_secrets_updated_at on public.admin_secrets;
create trigger trg_admin_secrets_updated_at
before update on public.admin_secrets
for each row execute function public.set_updated_at();

alter table public.admin_secrets enable row level security;

grant select, insert, update, delete on public.admin_secrets to authenticated;

drop policy if exists admin_secrets_manage_super_admin on public.admin_secrets;
create policy admin_secrets_manage_super_admin
on public.admin_secrets
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_super_admin = true and is_approved = true
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_super_admin = true and is_approved = true
  )
);

create table if not exists public.entity_translations (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('brand', 'series', 'model_detail')),
  jm_id int not null,
  locale text not null,
  data jsonb not null default '{}'::jsonb,
  source_data jsonb not null default '{}'::jsonb,
  source_updated_at timestamptz not null default now(),
  model text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, jm_id, locale)
);

drop trigger if exists trg_entity_translations_updated_at on public.entity_translations;
create trigger trg_entity_translations_updated_at
before update on public.entity_translations
for each row execute function public.set_updated_at();

create index if not exists idx_entity_translations_lookup on public.entity_translations(entity_type, locale, jm_id);

alter table public.entity_translations enable row level security;

grant select on public.entity_translations to anon;
grant all privileges on public.entity_translations to authenticated;

drop policy if exists entity_translations_select_all on public.entity_translations;
create policy entity_translations_select_all
on public.entity_translations
for select
to anon
using (true);

drop policy if exists entity_translations_all_for_admin on public.entity_translations;
create policy entity_translations_all_for_admin
on public.entity_translations
for all
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_approved = true
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_approved = true
  )
);

create table if not exists public.entity_translation_jobs (
  id uuid primary key default gen_random_uuid(),
  entity_type text not null check (entity_type in ('brand', 'series', 'model_detail')),
  jm_id int not null,
  source_locale text not null default 'zh-CN',
  target_locales text[] not null,
  fields text[] not null,
  source_updated_at timestamptz not null,
  status text not null default 'pending' check (status in ('pending', 'processing', 'done', 'error')),
  attempts int not null default 0,
  error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (entity_type, jm_id, source_updated_at)
);

drop trigger if exists trg_entity_translation_jobs_updated_at on public.entity_translation_jobs;
create trigger trg_entity_translation_jobs_updated_at
before update on public.entity_translation_jobs
for each row execute function public.set_updated_at();

create index if not exists idx_entity_translation_jobs_status on public.entity_translation_jobs(status, created_at);

alter table public.entity_translation_jobs enable row level security;

grant all privileges on public.entity_translation_jobs to authenticated;

drop policy if exists entity_translation_jobs_select_admin on public.entity_translation_jobs;
create policy entity_translation_jobs_select_admin
on public.entity_translation_jobs
for select
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_approved = true
  )
);

drop policy if exists entity_translation_jobs_modify_admin on public.entity_translation_jobs;
create policy entity_translation_jobs_modify_admin
on public.entity_translation_jobs
for insert
to authenticated
with check (
  exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_approved = true
  )
);

drop policy if exists entity_translation_jobs_update_admin on public.entity_translation_jobs;
create policy entity_translation_jobs_update_admin
on public.entity_translation_jobs
for update
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_approved = true
  )
)
with check (
  exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_approved = true
  )
);

drop policy if exists entity_translation_jobs_delete_admin on public.entity_translation_jobs;
create policy entity_translation_jobs_delete_admin
on public.entity_translation_jobs
for delete
to authenticated
using (
  exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_approved = true
  )
);

create or replace function public.enqueue_entity_translation_job()
returns trigger
language plpgsql
as $$
declare
  entity_type text := tg_argv[0];
  fields text[] := string_to_array(tg_argv[1], ',');
  changed text[] := '{}'::text[];
  f text;
  cfg jsonb;
  target_locales text[];
  source_locale text;
begin
  select value into cfg from public.site_config where key = 'db_translation_ai';
  source_locale := coalesce(cfg->>'source_locale', 'zh-CN');

  select coalesce(array_agg(x), array['en']::text[])
    into target_locales
  from (
    select jsonb_array_elements_text(coalesce(cfg->'target_locales', '[]'::jsonb)) as x
  ) t;

  if target_locales is null or array_length(target_locales, 1) is null then
    target_locales := array['en'];
  end if;

  if tg_op = 'INSERT' then
    changed := fields;
  else
    foreach f in array fields loop
      if (to_jsonb(old)->>f) is distinct from (to_jsonb(new)->>f) then
        changed := array_append(changed, f);
      end if;
    end loop;
  end if;

  if array_length(changed, 1) is null then
    return new;
  end if;

  insert into public.entity_translation_jobs (
    entity_type,
    jm_id,
    source_locale,
    target_locales,
    fields,
    source_updated_at,
    status
  )
  values (
    entity_type,
    new.jm_id,
    source_locale,
    target_locales,
    changed,
    new.updated_at,
    'pending'
  )
  on conflict (entity_type, jm_id, source_updated_at)
  do update set
    fields = (
      select array_agg(distinct x)
      from unnest(public.entity_translation_jobs.fields || excluded.fields) as x
    ),
    target_locales = excluded.target_locales,
    status = case when public.entity_translation_jobs.status = 'done' then 'pending' else public.entity_translation_jobs.status end,
    updated_at = now();

  return new;
end;
$$;

drop trigger if exists trg_brands_enqueue_translation on public.brands;
create trigger trg_brands_enqueue_translation
after insert or update of name, fullname on public.brands
for each row execute function public.enqueue_entity_translation_job('brand', 'name,fullname');

drop trigger if exists trg_series_enqueue_translation on public.series;
create trigger trg_series_enqueue_translation
after insert or update of name, fullname, subcompany_name on public.series
for each row execute function public.enqueue_entity_translation_job('series', 'name,fullname,subcompany_name');

drop trigger if exists trg_model_details_enqueue_translation on public.model_details;
create trigger trg_model_details_enqueue_translation
after insert or update of name, brandname, parentname, groupname on public.model_details
for each row execute function public.enqueue_entity_translation_job('model_detail', 'name,brandname,parentname,groupname');

insert into public.site_config (key, value)
values (
  'db_translation_ai',
  jsonb_build_object(
    'enabled', false,
    'source_locale', 'zh-CN',
    'target_locales', jsonb_build_array('en'),
    'model', 'doubao-seed-2-0-lite-260428',
    'endpoint', 'https://ark.cn-beijing.volces.com/api/v3/responses'
  )
)
on conflict (key)
do nothing;

