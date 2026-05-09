-- ================================================
-- 检查并修复 model_details 表的权限
-- ================================================

-- ================================================
-- 1. 首先查看当前的权限配置
-- ================================================

-- ================================================
-- 2. 确保 anon 和 authenticated 角色有正确的权限
-- ================================================
grant select on public.model_details to anon;
grant all privileges on public.model_details to authenticated;

-- ================================================
-- 3. 确保 RLS 策略正确
-- ================================================
drop policy if exists model_details_select_all on public.model_details;
create policy model_details_select_all
on public.model_details
for select
to anon
using (true);

drop policy if exists model_details_all_for_admin on public.model_details;
create policy model_details_all_for_admin
on public.model_details
for all
to authenticated
using (true)
with check (true);
