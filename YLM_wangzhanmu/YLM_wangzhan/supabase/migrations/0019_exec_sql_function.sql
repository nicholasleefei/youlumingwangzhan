-- ================================================
-- exec_sql 函数 - 用于执行任意 SQL 语句
-- ================================================

create or replace function public.exec_sql(sql_query text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  execute sql_query;
end;
$$;

grant execute on function public.exec_sql(text) to authenticated;
