#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function loadEnv() {
  const envPath = path.join(__dirname, "..", ".env.local");
  if (!fs.existsSync(envPath)) return {};
  const content = fs.readFileSync(envPath, "utf8");
  const env = {};
  for (const line of content.split("\n")) {
    const [key, ...valueParts] = line.split("=");
    if (key && key.trim()) {
      env[key.trim()] = valueParts.join("=").trim();
    }
  }
  return env;
}

const env = loadEnv();
const SUPABASE_URL = env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;

const MIGRATION_SQL = `
-- ================================================
-- 品牌Logo存储系统 - 完整实现
-- ================================================

-- ================================================
-- 1. 品牌基础表（基于聚美智数API字段）
-- ================================================
create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  jm_id int unique not null,
  name text not null,
  initial text,
  logo_url text,
  parent_id int default 0,
  depth int not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brands_jm_id on public.brands(jm_id);
create index if not exists idx_brands_initial on public.brands(initial);
create index if not exists idx_brands_depth on public.brands(depth);

-- ================================================
-- 2. 品牌Logo存储表
-- ================================================
create table if not exists public.brand_logos (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid unique not null references public.brands(id) on delete cascade,
  logo_base64 text not null,
  logo_mime_type text not null,
  logo_size_bytes int not null,
  logo_original_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_brand_logos_brand_id on public.brand_logos(brand_id);

-- ================================================
-- 3. 启用行级安全策略
-- ================================================
alter table public.brands enable row level security;
alter table public.brand_logos enable row level security;

-- ================================================
-- 4. RLS 策略
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
-- 5. 权限配置
-- ================================================
grant select on public.brands to anon;
grant select on public.brand_logos to anon;

grant all privileges on public.brands to authenticated;
grant all privileges on public.brand_logos to authenticated;
`;

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("请配置 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("=== 应用 brands 表迁移 ===");

  console.log("\n注意：Supabase JS 客户端不支持直接执行多语句 SQL。");
  console.log("请手动在 Supabase 控制台执行以下 SQL：");
  console.log("\n" + "=".repeat(60));
  console.log(MIGRATION_SQL);
  console.log("=".repeat(60));
  
  console.log("\n或者访问 Supabase 控制台:");
  console.log(`https://supabase.com/dashboard/project/${SUPABASE_URL.split('.')[0].replace('https://', '')}`);
  console.log("然后进入 SQL Editor 执行上述 SQL。");
}

main().catch(console.error);
