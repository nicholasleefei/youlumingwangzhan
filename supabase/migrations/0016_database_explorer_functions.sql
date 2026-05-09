-- ================================================
-- 数据库表管理器辅助函数
-- ================================================

-- ================================================
-- 1. 获取所有表列表
-- ================================================
create or replace function public.get_tables_list()
returns table (
  id oid,
  schema name,
  name name,
  rls_enabled boolean,
  live_rows_estimate bigint
)
language sql
security definer
set search_path = ''
as $$
  select
    c.oid as id,
    n.nspname as schema,
    c.relname as name,
    c.relrowsecurity as rls_enabled,
    coalesce(n_tup_ins, 0) as live_rows_estimate
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_stat_user_tables s on s.relid = c.oid
  where c.relkind = 'r'
    and n.nspname = 'public'
  order by c.relname;
$$;

-- ================================================
-- 2. 获取指定表的列信息
-- ================================================
create or replace function public.get_table_columns(table_name text)
returns table (
  ordinal_position integer,
  name name,
  data_type text,
  is_nullable boolean,
  default_value text,
  is_identity boolean,
  is_unique boolean
)
language sql
security definer
set search_path = ''
as $$
  select
    a.attnum as ordinal_position,
    a.attname as name,
    format_type(a.atttypid, a.atttypmod) as data_type,
    not a.attnotnull as is_nullable,
    pg_get_expr(d.adbin, d.adrelid) as default_value,
    a.attidentity != '' as is_identity,
    exists (
      select 1
      from pg_index i
      join pg_attribute ia on ia.attrelid = i.indrelid and ia.attnum = any(i.indkey)
      where i.indrelid = c.oid
        and i.indisunique
        and ia.attname = a.attname
    ) as is_unique
  from pg_attribute a
  join pg_class c on c.oid = a.attrelid
  join pg_namespace n on n.oid = c.relnamespace
  left join pg_attrdef d on d.adrelid = c.oid and d.adnum = a.attnum
  where c.relname = table_name
    and n.nspname = 'public'
    and a.attnum > 0
    and not a.attisdropped
  order by a.attnum;
$$;

-- ================================================
-- 3. 获取指定表的主键信息
-- ================================================
create or replace function public.get_table_primary_keys(table_name text)
returns table (
  schema name,
  table_name name,
  name name
)
language sql
security definer
set search_path = ''
as $$
  select
    n.nspname as schema,
    c.relname as table_name,
    a.attname as name
  from pg_index i
  join pg_class c on c.oid = i.indrelid
  join pg_namespace n on n.oid = c.relnamespace
  join pg_attribute a on a.attrelid = c.oid and a.attnum = any(i.indkey)
  where i.indisprimary
    and c.relname = table_name
    and n.nspname = 'public'
  order by array_position(i.indkey::int[], a.attnum);
$$;

-- ================================================
-- 4. 权限配置
-- ================================================
grant execute on function public.get_tables_list() to authenticated;
grant execute on function public.get_table_columns(text) to authenticated;
grant execute on function public.get_table_primary_keys(text) to authenticated;
