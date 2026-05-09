-- ================================================
-- 添加获取表字段的函数
-- ================================================

CREATE OR REPLACE FUNCTION public.get_table_columns(table_name text)
RETURNS TABLE(
  column_name text,
  data_type text,
  is_nullable boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.column_name::text,
    c.data_type::text,
    CASE WHEN c.is_nullable = 'YES' THEN true ELSE false END
  FROM information_schema.columns c
  WHERE c.table_schema = 'public'
    AND c.table_name = get_table_columns.table_name
  ORDER BY c.ordinal_position;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 授予执行权限
-- ================================================
GRANT EXECUTE ON FUNCTION public.get_table_columns(text) TO anon, authenticated, service_role;
