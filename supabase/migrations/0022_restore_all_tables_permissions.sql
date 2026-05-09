-- ================================================
-- 恢复所有表的权限和 RLS 策略
-- ================================================

-- ================================================
-- 1. brands 表
-- ================================================
grant select on public.brands to anon;
grant all privileges on public.brands to authenticated;

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
-- 2. brand_logos 表
-- ================================================
grant select on public.brand_logos to anon;
grant all privileges on public.brand_logos to authenticated;

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
-- 3. series 表
-- ================================================
grant select on public.series to anon;
grant all privileges on public.series to authenticated;

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
-- 4. models_jumdata 表
-- ================================================
grant select on public.models_jumdata to anon;
grant all privileges on public.models_jumdata to authenticated;

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
-- 5. model_details 表
-- ================================================
grant select on public.model_details to anon;
grant all privileges on public.model_details to authenticated;

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
