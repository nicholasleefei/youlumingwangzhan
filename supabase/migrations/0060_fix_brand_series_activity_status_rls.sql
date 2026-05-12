-- Fix NULL activity_status causing anon RLS to hide rows

begin;

update public.brands
set activity_status = 0
where activity_status is null;

alter table public.brands
alter column activity_status set default 0;

alter table public.brands
alter column activity_status set not null;

update public.series
set activity_status = 0
where activity_status is null;

alter table public.series
alter column activity_status set default 0;

alter table public.series
alter column activity_status set not null;

drop policy if exists "brands_select_active_only" on public.brands;
create policy "brands_select_active_only"
on public.brands
for select
to anon
using (activity_status = 0);

drop policy if exists "series_select_active_only" on public.series;
create policy "series_select_active_only"
on public.series
for select
to anon
using (activity_status = 0);

commit;
