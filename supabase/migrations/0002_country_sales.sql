create table if not exists public.country_sales (
  id uuid primary key default gen_random_uuid(),
  country_name text not null unique,
  sales_volume int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_country_sales_country_name on public.country_sales(country_name);
create index if not exists idx_country_sales_sales_volume on public.country_sales(sales_volume desc);

drop trigger if exists trg_country_sales_updated_at on public.country_sales;
create trigger trg_country_sales_updated_at
before update on public.country_sales
for each row execute function public.set_updated_at();

alter table public.country_sales enable row level security;

grant all privileges on public.country_sales to authenticated;

drop policy if exists country_sales_all_for_admin on public.country_sales;
create policy country_sales_all_for_admin
on public.country_sales
for all
to authenticated
using (true)
with check (true);
