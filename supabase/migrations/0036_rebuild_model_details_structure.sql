-- 重新构建车型详情数据库结构，使其与聚美智数 API 返回的 JSON 结构完美对齐

-- 首先删除不需要的旧 jsonb 字段和额外的扁平字段
ALTER TABLE public.model_details
  DROP COLUMN IF EXISTS isnev,
  DROP COLUMN IF EXISTS incarcharge,
  DROP COLUMN IF EXISTS "4wdoffroad",
  DROP COLUMN IF EXISTS activesafety,
  DROP COLUMN IF EXISTS drivingcontrol,
  DROP COLUMN IF EXISTS wheelbrake,
  DROP COLUMN IF EXISTS appearanceantitheft,
  DROP COLUMN IF EXISTS color,
  DROP COLUMN IF EXISTS screensystem,
  DROP COLUMN IF EXISTS drivingfunction,
  DROP COLUMN IF EXISTS intelligentconfig,
  DROP COLUMN IF EXISTS externalrearmirror,
  DROP COLUMN IF EXISTS drivinghardware,
  DROP COLUMN IF EXISTS chassissteer,
  DROP COLUMN IF EXISTS passivesafety,
  DROP COLUMN IF EXISTS soundinteriorlight,
  DROP COLUMN IF EXISTS exteriorlight,
  DROP COLUMN IF EXISTS electricmotor,
  DROP COLUMN IF EXISTS sunroofglass;

-- 确保 JSONB 字段存在
ALTER TABLE public.model_details
  ADD COLUMN IF NOT EXISTS basic JSONB,
  ADD COLUMN IF NOT EXISTS body JSONB,
  ADD COLUMN IF NOT EXISTS drivingauxiliary JSONB,
  ADD COLUMN IF NOT EXISTS engine JSONB,
  ADD COLUMN IF NOT EXISTS actualtest JSONB,
  ADD COLUMN IF NOT EXISTS gearbox JSONB,
  ADD COLUMN IF NOT EXISTS chassisbrake JSONB,
  ADD COLUMN IF NOT EXISTS aircondrefrigerator JSONB,
  ADD COLUMN IF NOT EXISTS wheel JSONB,
  ADD COLUMN IF NOT EXISTS entcom JSONB,
  ADD COLUMN IF NOT EXISTS doormirror JSONB,
  ADD COLUMN IF NOT EXISTS seat JSONB,
  ADD COLUMN IF NOT EXISTS internalconfig JSONB,
  ADD COLUMN IF NOT EXISTS light JSONB,
  ADD COLUMN IF NOT EXISTS safe JSONB;

-- 确保所有顶级字段存在
ALTER TABLE public.model_details
  ADD COLUMN IF NOT EXISTS logo_url TEXT,
  ADD COLUMN IF NOT EXISTS initial TEXT,
  ADD COLUMN IF NOT EXISTS productionstate TEXT,
  ADD COLUMN IF NOT EXISTS salestate TEXT,
  ADD COLUMN IF NOT EXISTS yeartype TEXT,
  ADD COLUMN IF NOT EXISTS listdate TEXT,
  ADD COLUMN IF NOT EXISTS seatnum TEXT,
  ADD COLUMN IF NOT EXISTS depth INTEGER,
  ADD COLUMN IF NOT EXISTS geartype TEXT,
  ADD COLUMN IF NOT EXISTS geartype2 INTEGER,
  ADD COLUMN IF NOT EXISTS gearnum TEXT,
  ADD COLUMN IF NOT EXISTS compartnum INTEGER;

-- 重新创建 get_table_columns 函数以确保能获取最新结构
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

GRANT EXECUTE ON FUNCTION public.get_table_columns(text) TO anon, authenticated, service_role;
