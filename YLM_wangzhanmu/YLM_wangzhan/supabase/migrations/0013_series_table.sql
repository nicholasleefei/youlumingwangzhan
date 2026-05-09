-- ================================================
-- 车系表 - 完整实现
-- ================================================

-- ================================================
-- 1. 车系基础表
-- ================================================
create table if not exists public.series (
  id uuid primary key default gen_random_uuid(),
  jm_id int unique not null,
  brand_jm_id int not null,
  brand_id uuid references public.brands(id) on delete cascade,
  name text not null,
  fullname text,
  initial text,
  logo_url text,
  salestate text,
  depth int not null,
  subcompany_name text,
  subcompany_jm_id int,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_series_jm_id on public.series(jm_id);
create index if not exists idx_series_brand_jm_id on public.series(brand_jm_id);
create index if not exists idx_series_brand_id on public.series(brand_id);
create index if not exists idx_series_initial on public.series(initial);
create index if not exists idx_series_salestate on public.series(salestate);

-- ================================================
-- 2. 触发器：自动更新 updated_at
-- ================================================
drop trigger if exists trg_series_updated_at on public.series;
create trigger trg_series_updated_at
before update on public.series
for each row execute function public.set_updated_at();

-- ================================================
-- 3. 启用行级安全策略
-- ================================================
alter table public.series enable row level security;

-- ================================================
-- 4. RLS 策略
-- ================================================
drop policy if exists series_select_all on public.series;
create policy series_select_all
on public.series
for select
to anon
using (true);

drop policy if exists series_all_for_admin on public.series;
create policy series_all_for_admin
on public.series
for all
to authenticated
using (true)
with check (true);

-- ================================================
-- 5. 权限配置
-- ================================================
grant select on public.series to anon;
grant all privileges on public.series to authenticated;
