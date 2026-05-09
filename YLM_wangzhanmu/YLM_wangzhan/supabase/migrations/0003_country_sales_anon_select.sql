grant select on public.country_sales to anon;

drop policy if exists country_sales_select_for_anon on public.country_sales;
create policy country_sales_select_for_anon
on public.country_sales
for select
to anon
using (true);
