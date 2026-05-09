-- ================================================
-- 品牌Logo存储系统 - 完整实现
-- ================================================

-- ================================================
-- 1. 品牌基础表（基于聚美智数API字段）
-- ================================================
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  jm_id int unique not null,        -- 聚美智数品牌ID
  name text not null,              -- 品牌名称
  initial text,                   -- 品牌首字母
  logo_url text,                  -- 原始Logo URL
  parent_id int default 0,           -- 上级品牌ID
  depth int not null,               -- 层级（1=品牌，2=子公司，3=车系，4=车型）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brands_jm_id on public.brands(jm_id);
create index if not exists idx_brands_initial on public.brands(initial);
create index if not exists idx_brands_depth on public.brands(depth);

-- ================================================
-- 2. 品牌Logo存储表（一对一关系，Base64编码）
-- ================================================
create table if not exists public.brand_logos (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid unique not null references public.brands(id) on delete cascade,
  logo_base64 text not null,           -- Logo图片的Base64编码
  logo_mime_type text not null,      -- 图片MIME类型（如 image/png）
  logo_size_bytes int not null,        -- 图片字节大小
  logo_original_url text,             -- 原始图片URL（参考）
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brand_logos_brand_id on public.brand_logos(brand_id);

-- ================================================
-- 3. 触发器：自动更新 updated_at
-- ================================================
drop trigger if exists trg_brands_updated_at on public.brands;
create trigger trg_brands_updated_at
before update on public.brands
for each row execute function public.set_updated_at();

drop trigger if exists trg_brand_logos_updated_at on public.brand_logos;
create trigger trg_brand_logos_updated_at
before update on public.brand_logos
for each row execute function public.set_updated_at();

-- ================================================
-- 4. 启用行级安全策略（RLS）
-- ================================================
alter table public.brands enable row level security;
alter table public.brand_logos enable row level security;

-- ================================================
-- 5. RLS 策略：品牌表
-- ================================================
drop policy if exists brands_select_all on public.brands;
create policy brands_select_all
on public.brands
for select
to anon
using (true);

drop policy if exists brands_all_for_admin on public.brands;
create policy brands_all_for_admin
on public.brands
for all
to authenticated
using (true)
with check (true);

-- ================================================
-- 6. RLS 策略：品牌Logo表
-- ================================================
drop policy if exists brand_logos_select_all on public.brand_logos;
create policy brand_logos_select_all
on public.brand_logos
for select
to anon
using (true);

drop policy if exists brand_logos_all_for_admin on public.brand_logos;
create policy brand_logos_all_for_admin
on public.brand_logos
for all
to authenticated
using (true)
with check (true);

-- ================================================
-- 7. 权限配置
-- ================================================
grant select on public.brands to anon;
grant select on public.brand_logos to anon;

grant all privileges on public.brands to authenticated;
grant all privileges on public.brand_logos to authenticated;

-- ================================================
-- 8. 完成说明
-- ================================================
comment on table public.brands is '品牌基础表（基于聚美智数API）';
comment on table public.brand_logos is '品牌Logo存储表（Base64编码，一对一关系）';
