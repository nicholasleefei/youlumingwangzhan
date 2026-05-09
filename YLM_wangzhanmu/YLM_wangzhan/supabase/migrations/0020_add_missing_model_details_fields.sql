-- ================================================
-- 为 model_details 表添加缺失的字段
-- ================================================

-- ================================================
-- 1. 新增的顶层字段
-- ================================================
alter table public.model_details add column if not exists isnev text;

-- ================================================
-- 2. 新增的 nested 字段 - JSONB 类型
-- ================================================
alter table public.model_details add column if not exists incarcharge jsonb;
alter table public.model_details add column if not exists "4wdoffroad" jsonb;
alter table public.model_details add column if not exists activesafety jsonb;
alter table public.model_details add column if not exists drivingcontrol jsonb;
alter table public.model_details add column if not exists wheelbrake jsonb;
alter table public.model_details add column if not exists appearanceantitheft jsonb;
alter table public.model_details add column if not exists color jsonb;
alter table public.model_details add column if not exists screensystem jsonb;
alter table public.model_details add column if not exists drivingfunction jsonb;
alter table public.model_details add column if not exists intelligentconfig jsonb;
alter table public.model_details add column if not exists externalrearmirror jsonb;
alter table public.model_details add column if not exists drivinghardware jsonb;
alter table public.model_details add column if not exists chassissteer jsonb;
alter table public.model_details add column if not exists passivesafety jsonb;
alter table public.model_details add column if not exists soundinteriorlight jsonb;
alter table public.model_details add column if not exists exteriorlight jsonb;
alter table public.model_details add column if not exists electricmotor jsonb;
alter table public.model_details add column if not exists sunroofglass jsonb;
