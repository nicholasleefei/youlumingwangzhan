create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  email_norm text generated always as (lower(email)) stored,
  company_name text,
  contact_name text,
  whatsapp text,
  country_region text,
  status text not null default 'new' check (status in ('new','contacted','qualified','quoted','negotiating','won','lost')),
  owner_admin_id uuid,
  next_follow_up_at timestamptz,
  last_contact_at timestamptz,
  last_inquiry_at timestamptz,
  admin_note text,
  source text not null default 'inquiry_form',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (email_norm)
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'customers_owner_admin_id_fkey'
  ) then
    alter table public.customers
      add constraint customers_owner_admin_id_fkey
      foreign key (owner_admin_id)
      references public.admin_users(id)
      on delete set null;
  end if;
end
$$;

drop trigger if exists trg_customers_updated_at on public.customers;
create trigger trg_customers_updated_at
before update on public.customers
for each row execute function public.set_updated_at();

alter table public.customers enable row level security;

grant insert on public.customers to anon;
grant all privileges on public.customers to authenticated;

drop policy if exists customers_insert_for_anon on public.customers;
create policy customers_insert_for_anon
on public.customers
for insert
to anon
with check (true);

drop policy if exists customers_all_for_admin on public.customers;
create policy customers_all_for_admin
on public.customers
for all
to authenticated
using (true)
with check (true);

alter table public.inquiries
  add column if not exists customer_id uuid,
  add column if not exists assigned_admin_id uuid,
  add column if not exists next_follow_up_at timestamptz,
  add column if not exists priority text not null default 'normal',
  add column if not exists updated_by_admin_id uuid;

alter table public.inquiries drop constraint if exists inquiries_status_check;
alter table public.inquiries
  add constraint inquiries_status_check
  check (status in ('new','contacted','qualified','quoting','quoted','negotiating','won','lost'));

alter table public.inquiries drop constraint if exists inquiries_priority_check;
alter table public.inquiries
  add constraint inquiries_priority_check
  check (priority in ('low','normal','high','urgent'));

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inquiries_customer_id_fkey'
  ) then
    alter table public.inquiries
      add constraint inquiries_customer_id_fkey
      foreign key (customer_id)
      references public.customers(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'inquiries_assigned_admin_id_fkey'
  ) then
    alter table public.inquiries
      add constraint inquiries_assigned_admin_id_fkey
      foreign key (assigned_admin_id)
      references public.admin_users(id)
      on delete set null;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'inquiries_updated_by_admin_id_fkey'
  ) then
    alter table public.inquiries
      add constraint inquiries_updated_by_admin_id_fkey
      foreign key (updated_by_admin_id)
      references public.admin_users(id)
      on delete set null;
  end if;
end
$$;

create or replace function public.ensure_customer_for_inquiry()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  cid uuid;
  e text;
begin
  e := lower(trim(new.email));
  if e is null or e = '' then
    return new;
  end if;

  insert into public.customers (
    email,
    company_name,
    contact_name,
    whatsapp,
    country_region,
    last_inquiry_at,
    source
  )
  values (
    e,
    nullif(trim(new.company_name), ''),
    nullif(trim(new.contact_name), ''),
    nullif(trim(new.whatsapp), ''),
    nullif(trim(new.country_region), ''),
    now(),
    'inquiry_form'
  )
  on conflict (email_norm) do update
    set
      company_name = coalesce(excluded.company_name, customers.company_name),
      contact_name = coalesce(excluded.contact_name, customers.contact_name),
      whatsapp = coalesce(excluded.whatsapp, customers.whatsapp),
      country_region = coalesce(excluded.country_region, customers.country_region),
      last_inquiry_at = now(),
      updated_at = now()
  returning id into cid;

  new.customer_id := cid;
  update public.customers
    set last_inquiry_at = now()
    where id = cid;

  return new;
end;
$$;

drop trigger if exists trg_inquiries_ensure_customer on public.inquiries;
create trigger trg_inquiries_ensure_customer
before insert on public.inquiries
for each row execute function public.ensure_customer_for_inquiry();

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inquiry_items_inquiry_id_fkey'
  ) then
    alter table public.inquiry_items
      add constraint inquiry_items_inquiry_id_fkey
      foreign key (inquiry_id)
      references public.inquiries(id)
      on delete cascade;
  end if;

end
$$;

create table if not exists public.inquiry_events (
  id uuid primary key default gen_random_uuid(),
  inquiry_id uuid not null,
  event_type text not null check (event_type in ('note','status_change','assignment','follow_up','system')),
  message text,
  from_status text,
  to_status text,
  next_follow_up_at timestamptz,
  created_by_admin_id uuid,
  created_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'inquiry_events_inquiry_id_fkey'
  ) then
    alter table public.inquiry_events
      add constraint inquiry_events_inquiry_id_fkey
      foreign key (inquiry_id)
      references public.inquiries(id)
      on delete cascade;
  end if;

  if not exists (
    select 1
    from pg_constraint
    where conname = 'inquiry_events_created_by_admin_id_fkey'
  ) then
    alter table public.inquiry_events
      add constraint inquiry_events_created_by_admin_id_fkey
      foreign key (created_by_admin_id)
      references public.admin_users(id)
      on delete set null;
  end if;
end
$$;

create index if not exists idx_customers_last_inquiry_at on public.customers(last_inquiry_at desc);
create index if not exists idx_customers_status on public.customers(status);
create index if not exists idx_inquiries_customer_id on public.inquiries(customer_id);
create index if not exists idx_inquiries_assigned_admin_id on public.inquiries(assigned_admin_id);
create index if not exists idx_inquiries_next_follow_up_at on public.inquiries(next_follow_up_at);
create index if not exists idx_inquiry_events_inquiry_id on public.inquiry_events(inquiry_id);
create index if not exists idx_inquiry_events_created_at on public.inquiry_events(created_at desc);

alter table public.inquiry_events enable row level security;

grant all privileges on public.inquiry_events to authenticated;

drop policy if exists inquiry_events_all_for_admin on public.inquiry_events;
create policy inquiry_events_all_for_admin
on public.inquiry_events
for all
to authenticated
using (true)
with check (true);

create or replace view public.customer_overview
with (security_invoker = true)
as
select
  c.id as customer_id,
  c.email,
  c.company_name,
  c.contact_name,
  c.whatsapp,
  c.country_region,
  c.status as customer_status,
  c.owner_admin_id,
  c.next_follow_up_at as customer_next_follow_up_at,
  c.last_inquiry_at,
  c.last_contact_at,
  c.admin_note as customer_admin_note,
  coalesce(stats.inquiries_total, 0) as inquiries_total,
  coalesce(stats.inquiries_open, 0) as inquiries_open,
  stats.last_inquiry_id,
  stats.last_inquiry_no,
  stats.last_inquiry_status,
  stats.last_inquiry_created_at
from public.customers c
left join lateral (
  select
    count(*)::int as inquiries_total,
    count(*) filter (where i.status not in ('won','lost'))::int as inquiries_open,
    (array_agg(i.id order by i.created_at desc))[1] as last_inquiry_id,
    (array_agg(i.inquiry_no order by i.created_at desc))[1] as last_inquiry_no,
    (array_agg(i.status order by i.created_at desc))[1] as last_inquiry_status,
    (max(i.created_at)) as last_inquiry_created_at
  from public.inquiries i
  where i.customer_id = c.id
) stats on true;

grant select on public.customer_overview to authenticated;

create or replace view public.inquiry_overview
with (security_invoker = true)
as
select
  i.id as inquiry_id,
  i.inquiry_no,
  i.locale,
  i.status,
  i.priority,
  i.next_follow_up_at,
  i.assigned_admin_id,
  i.admin_note,
  i.created_at,
  i.updated_at,
  i.customer_id,
  c.email as customer_email,
  c.company_name as customer_company_name,
  c.contact_name as customer_contact_name,
  c.whatsapp as customer_whatsapp,
  c.country_region as customer_country_region,
  (select count(*)::int from public.inquiry_items it where it.inquiry_id = i.id) as items_count
from public.inquiries i
left join public.customers c on c.id = i.customer_id;

grant select on public.inquiry_overview to authenticated;
