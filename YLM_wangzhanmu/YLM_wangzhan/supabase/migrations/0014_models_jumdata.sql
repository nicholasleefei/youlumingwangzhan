-- ================================================
-- 车型表（基于聚美智数API）- 完整实现
-- ================================================

-- ================================================
-- 1. 车型基础表
-- ================================================
create table if not exists public.models_jumdata (
  id uuid primary key default gen_random_uuid(),
  jm_id int unique not null,
  series_jm_id int not null,
  series_id uuid references public.series(id) on delete cascade,
  brand_jm_id int not null,
  brand_id uuid references public.brands(id) on delete cascade,
  name text not null,
  groupid text,
  groupname text,
  sizetype text,
  displacement2 text,
  displacement text,
  geartype text,
  geartype2 int,
  logo_url text,
  yeartype text,
  listdate text,
  price text,
  productionstate text,
  salestate text,
  depth int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_models_jumdata_jm_id on public.models_jumdata(jm_id);
create index if not exists idx_models_jumdata_series_jm_id on public.models_jumdata(series_jm_id);
create index if not exists idx_models_jumdata_series_id on public.models_jumdata(series_id);
create index if not exists idx_models_jumdata_brand_jm_id on public.models_jumdata(brand_jm_id);
create index if not exists idx_models_jumdata_brand_id on public.models_jumdata(brand_id);
create index if not exists idx_models_jumdata_yeartype on public.models_jumdata(yeartype);
create index if not exists idx_models_jumdata_productionstate on public.models_jumdata(productionstate);
create index if not exists idx_models_jumdata_salestate on public.models_jumdata(salestate);

-- ================================================
-- 2. 触发器：自动更新 updated_at
-- ================================================
drop trigger if exists trg_models_jumdata_updated_at on public.models_jumdata;
create trigger trg_models_jumdata_updated_at
before update on public.models_jumdata
for each row execute function public.set_updated_at();

-- ================================================
-- 3. 启用行级安全策略
-- ================================================
alter table public.models_jumdata enable row level security;

-- ================================================
-- 4. RLS 策略
-- ================================================
drop policy if exists models_jumdata_select_all on public.models_jumdata;
create policy models_jumdata_select_all
on public.models_jumdata
for select
to anon
using (true);

drop policy if exists models_jumdata_all_for_admin on public.models_jumdata;
create policy models_jumdata_all_for_admin
on public.models_jumdata
for all
to authenticated
using (true)
with check (true);

-- ================================================
-- 5. 权限配置
-- ================================================
grant select on public.models_jumdata to anon;
grant all privileges on public.models_jumdata to authenticated;
