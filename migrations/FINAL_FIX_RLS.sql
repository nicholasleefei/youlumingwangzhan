
-- ==========================================
-- RLS 策略最终修复脚本 - 完整版本
-- ==========================================
-- 执行位置: https://supabase.com/dashboard/project/xpksqkhgfqekysbebznv/sql
-- ==========================================

-- 1. 启用 RLS
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_details ENABLE ROW LEVEL SECURITY;

-- 2. 删除旧策略
DROP POLICY IF EXISTS "Brands are visible with normal activity status" ON brands;
DROP POLICY IF EXISTS "Models are visible with normal activity status" ON models;
DROP POLICY IF EXISTS "Series are visible with normal activity status" ON series;
DROP POLICY IF EXISTS "Model details are visible with normal activity status" ON model_details;
DROP POLICY IF EXISTS "Admins can manage all brands" ON brands;
DROP POLICY IF EXISTS "Admins can manage all models" ON models;
DROP POLICY IF EXISTS "Admins can manage all series" ON series;
DROP POLICY IF EXISTS "Admins can manage all model details" ON model_details;

-- 3. 创建新的策略

-- 品牌策略：只允许查询 activity_status = 0 的品牌
CREATE POLICY "Brands are visible with normal activity status"
  ON brands
  FOR SELECT
  USING (activity_status = 0);

-- 车系策略：只允许查询 activity_status = 0 且关联品牌正常的车系
CREATE POLICY "Series are visible with normal activity status"
  ON series
  FOR SELECT
  USING (
    activity_status = 0 AND
    EXISTS (
      SELECT 1 FROM brands
      WHERE brands.id = series.brand_id
      AND brands.activity_status = 0
    )
  );

-- 车型策略：只允许查询 activity_status = 0 且关联品牌正常的车型
CREATE POLICY "Models are visible with normal activity status"
  ON models
  FOR SELECT
  USING (
    activity_status = 0 AND
    (
      brand IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM brands
        WHERE brands.name = models.brand
        AND brands.activity_status = 0
      )
      OR brand IS NULL
    )
  );

-- 车型详情策略
CREATE POLICY "Model details are visible with normal activity status"
  ON model_details
  FOR SELECT
  USING (
    activity_status = 0 AND
    (
      brandname IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM brands
        WHERE brands.name = model_details.brandname
        AND brands.activity_status = 0
      )
      OR model_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM models
        WHERE models.id = model_details.model_id
        AND models.activity_status = 0
      )
    )
  );

-- 管理员策略（所有权限）
CREATE POLICY "Admins can manage all brands" ON brands FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage all models" ON models FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage all series" ON series FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Admins can manage all model details" ON model_details FOR ALL USING (true) WITH CHECK (true);

-- ==========================================
-- 验证查询（执行完上面的 SQL 后运行这些检查）
-- ==========================================

-- 验证策略是否创建
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('brands', 'models', 'series', 'model_details')
ORDER BY tablename, policyname;

-- 检查 brands 表的分布
SELECT activity_status, COUNT(*) AS count FROM brands GROUP BY activity_status ORDER BY activity_status;
