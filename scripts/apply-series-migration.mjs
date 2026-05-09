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
`;

async function main() {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("请配置 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("=== 应用 series 表迁移 ===");

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
