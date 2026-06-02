#!/usr/bin/env node
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

const MIGRATION_SQL = `
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

do $$
begin
  if not exists (select 1 from pg_type where typname = 'crm_customer_status') then
    create type public.crm_customer_status as enum ('new','contacted','qualified','quoted','negotiating','won','lost');
  end if;
  if not exists (select 1 from pg_type where typname = 'crm_opportunity_stage') then
    create type public.crm_opportunity_stage as enum ('lead','qualified','quoted','negotiating','won','lost');
  end if;
  if not exists (select 1 from pg_type where typname = 'crm_task_status') then
    create type public.crm_task_status as enum ('todo','done','canceled');
  end if;
end $$;

create table if not exists public.crm_customers (
  id uuid primary key default gen_random_uuid(),
  primary_email text not null unique,
  company_name text,
  contact_name text,
  whatsapp text,
  country_region text,
  status public.crm_customer_status not null default 'new',
  owner_admin_id uuid references public.admin_users(id) on delete set null,
  next_follow_up_at timestamptz,
  last_activity_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_customers_owner on public.crm_customers(owner_admin_id);
create index if not exists idx_crm_customers_status on public.crm_customers(status);
create index if not exists idx_crm_customers_next_follow_up on public.crm_customers(next_follow_up_at);

drop trigger if exists trg_crm_customers_updated_at on public.crm_customers;
create trigger trg_crm_customers_updated_at
before update on public.crm_customers
for each row execute function public.set_updated_at();

create table if not exists public.crm_opportunities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.crm_customers(id) on delete cascade,
  inquiry_id uuid references public.inquiries(id) on delete set null,
  stage public.crm_opportunity_stage not null default 'lead',
  amount numeric,
  probability numeric,
  expected_close_at timestamptz,
  assigned_admin_id uuid references public.admin_users(id) on delete set null,
  priority text not null default 'normal',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_opps_customer on public.crm_opportunities(customer_id);
create index if not exists idx_crm_opps_stage on public.crm_opportunities(stage);
create index if not exists idx_crm_opps_inquiry on public.crm_opportunities(inquiry_id);

drop trigger if exists trg_crm_opportunities_updated_at on public.crm_opportunities;
create trigger trg_crm_opportunities_updated_at
before update on public.crm_opportunities
for each row execute function public.set_updated_at();

create table if not exists public.crm_tasks (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.crm_customers(id) on delete cascade,
  opportunity_id uuid references public.crm_opportunities(id) on delete cascade,
  title text not null,
  due_at timestamptz,
  status public.crm_task_status not null default 'todo',
  assigned_admin_id uuid references public.admin_users(id) on delete set null,
  created_by_admin_id uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_tasks_due on public.crm_tasks(due_at);
create index if not exists idx_crm_tasks_assigned on public.crm_tasks(assigned_admin_id);
create index if not exists idx_crm_tasks_status on public.crm_tasks(status);

drop trigger if exists trg_crm_tasks_updated_at on public.crm_tasks;
create trigger trg_crm_tasks_updated_at
before update on public.crm_tasks
for each row execute function public.set_updated_at();

create table if not exists public.crm_activities (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.crm_customers(id) on delete cascade,
  opportunity_id uuid references public.crm_opportunities(id) on delete set null,
  type text not null,
  content text not null,
  created_by_admin_id uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_activities_customer on public.crm_activities(customer_id);
create index if not exists idx_crm_activities_created_at on public.crm_activities(created_at);

create table if not exists public.crm_files (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references public.crm_customers(id) on delete cascade,
  opportunity_id uuid references public.crm_opportunities(id) on delete cascade,
  activity_id uuid references public.crm_activities(id) on delete set null,
  bucket text not null,
  path text not null,
  file_name text not null,
  file_type text,
  file_size bigint,
  uploaded_by_admin_id uuid references public.admin_users(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists idx_crm_files_customer on public.crm_files(customer_id);
create index if not exists idx_crm_files_created_at on public.crm_files(created_at);

alter table public.crm_customers enable row level security;
alter table public.crm_opportunities enable row level security;
alter table public.crm_tasks enable row level security;
alter table public.crm_activities enable row level security;
alter table public.crm_files enable row level security;

drop policy if exists crm_customers_admin_select on public.crm_customers;
create policy crm_customers_admin_select on public.crm_customers for select to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_customers_admin_insert on public.crm_customers;
create policy crm_customers_admin_insert on public.crm_customers for insert to authenticated with check (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_customers_admin_update on public.crm_customers;
create policy crm_customers_admin_update on public.crm_customers for update to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true)) with check (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_customers_admin_delete on public.crm_customers;
create policy crm_customers_admin_delete on public.crm_customers for delete to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));

drop policy if exists crm_opps_admin_select on public.crm_opportunities;
create policy crm_opps_admin_select on public.crm_opportunities for select to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_opps_admin_insert on public.crm_opportunities;
create policy crm_opps_admin_insert on public.crm_opportunities for insert to authenticated with check (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_opps_admin_update on public.crm_opportunities;
create policy crm_opps_admin_update on public.crm_opportunities for update to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true)) with check (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_opps_admin_delete on public.crm_opportunities;
create policy crm_opps_admin_delete on public.crm_opportunities for delete to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));

drop policy if exists crm_tasks_admin_select on public.crm_tasks;
create policy crm_tasks_admin_select on public.crm_tasks for select to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_tasks_admin_insert on public.crm_tasks;
create policy crm_tasks_admin_insert on public.crm_tasks for insert to authenticated with check (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_tasks_admin_update on public.crm_tasks;
create policy crm_tasks_admin_update on public.crm_tasks for update to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true)) with check (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_tasks_admin_delete on public.crm_tasks;
create policy crm_tasks_admin_delete on public.crm_tasks for delete to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));

drop policy if exists crm_activities_admin_select on public.crm_activities;
create policy crm_activities_admin_select on public.crm_activities for select to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_activities_admin_insert on public.crm_activities;
create policy crm_activities_admin_insert on public.crm_activities for insert to authenticated with check (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_activities_admin_update on public.crm_activities;
create policy crm_activities_admin_update on public.crm_activities for update to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true)) with check (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_activities_admin_delete on public.crm_activities;
create policy crm_activities_admin_delete on public.crm_activities for delete to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));

drop policy if exists crm_files_admin_select on public.crm_files;
create policy crm_files_admin_select on public.crm_files for select to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_files_admin_insert on public.crm_files;
create policy crm_files_admin_insert on public.crm_files for insert to authenticated with check (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_files_admin_update on public.crm_files;
create policy crm_files_admin_update on public.crm_files for update to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true)) with check (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_files_admin_delete on public.crm_files;
create policy crm_files_admin_delete on public.crm_files for delete to authenticated using (exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));

insert into storage.buckets (id, name, public) values ('crm-files', 'crm-files', false) on conflict (id) do nothing;

drop policy if exists crm_files_bucket_select on storage.objects;
create policy crm_files_bucket_select on storage.objects for select to authenticated using (bucket_id = 'crm-files' and exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_files_bucket_insert on storage.objects;
create policy crm_files_bucket_insert on storage.objects for insert to authenticated with check (bucket_id = 'crm-files' and exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_files_bucket_update on storage.objects;
create policy crm_files_bucket_update on storage.objects for update to authenticated using (bucket_id = 'crm-files' and exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true)) with check (bucket_id = 'crm-files' and exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
drop policy if exists crm_files_bucket_delete on storage.objects;
create policy crm_files_bucket_delete on storage.objects for delete to authenticated using (bucket_id = 'crm-files' and exists (select 1 from public.admin_users au where au.id = auth.uid() and au.is_approved = true));
`;

async function main() {
  if (!SUPABASE_URL) {
    console.error("请在 .env.local 配置 VITE_SUPABASE_URL");
    process.exit(1);
  }

  console.log("请在 Supabase Dashboard 的 SQL Editor 执行以下 SQL：");
  console.log("\n" + "=".repeat(60));
  console.log(MIGRATION_SQL);
  console.log("=".repeat(60) + "\n");
}

main().catch(console.error);
