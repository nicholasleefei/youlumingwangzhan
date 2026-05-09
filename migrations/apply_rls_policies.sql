
-- =============================================================================
-- RLS 策略应用脚本 - 在 Supabase SQL 编辑器中执行
-- =============================================================================

-- 删除旧策略
DROP POLICY IF EXISTS "Brands are visible with normal activity status" ON brands;
DROP POLICY IF EXISTS "Models are visible with normal activity status" ON models;
DROP POLICY IF EXISTS "Series are visible with normal activity status" ON series;
DROP POLICY IF EXISTS "Model details are visible with normal activity status" ON model_details;
DROP POLICY IF EXISTS "Admins can manage all brands" ON brands;
DROP POLICY IF EXISTS "Admins can manage all models" ON models;
DROP POLICY IF EXISTS "Admins can manage all series" ON series;
DROP POLICY IF EXISTS "Admins can manage all model details" ON model_details;

-- 启用 RLS（如果还没启用）
ALTER TABLE brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE series ENABLE ROW LEVEL SECURITY;
ALTER TABLE model_details ENABLE ROW LEVEL SECURITY;

-- 为 brands 表创建 RLS 策略：只允许查询 activity_status = 0 的品牌
CREATE POLICY "Brands are visible with normal activity status"
  ON brands
  FOR SELECT
  USING (activity_status = 0);

-- 为 series 表创建 RLS 策略：
-- 只允许查询 activity_status = 0 且关联的品牌也是正常的车系
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

-- 为 models 表创建 RLS 策略：
-- 只允许查询 activity_status = 0 且关联的品牌也是正常的车型
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

-- 为 model_details 表创建 RLS 策略：
-- 只允许查询 activity_status = 0 且关联的品牌和车型也是正常的车型详情
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

-- 为管理员（service_role）创建策略，允许看到所有状态
CREATE POLICY "Admins can manage all brands"
  ON brands
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage all models"
  ON models
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage all series"
  ON series
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admins can manage all model details"
  ON model_details
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 更新 NULL 值的记录
UPDATE brands SET activity_status = 0 WHERE activity_status IS NULL;
UPDATE models SET activity_status = 0 WHERE activity_status IS NULL;
UPDATE series SET activity_status = 0 WHERE activity_status IS NULL;
UPDATE model_details SET activity_status = 0 WHERE activity_status IS NULL;

-- 验证策略是否成功创建
SELECT
  schemaname,
  tablename,
  policyname
FROM pg_policies
WHERE tablename IN ('brands', 'models', 'series', 'model_details');

-- 验证 NULL 值是否已更新
SELECT
  'brands' as table_name,
  COUNT(*) as null_count
FROM brands
WHERE activity_status IS NULL
UNION ALL
SELECT
  'models' as table_name,
  COUNT(*) as null_count
FROM models
WHERE activity_status IS NULL
UNION ALL
SELECT
  'series' as table_name,
  COUNT(*) as null_count
FROM series
WHERE activity_status IS NULL
UNION ALL
SELECT
  'model_details' as table_name,
  COUNT(*) as null_count
FROM model_details
WHERE activity_status IS NULL;

-- 检查 activity_status 分布
SELECT
  'brands' as table_name,
  activity_status,
  COUNT(*) as count
FROM brands
GROUP BY activity_status
UNION ALL
SELECT
  'models' as table_name,
  activity_status,
  COUNT(*) as count
FROM models
GROUP BY activity_status
UNION ALL
SELECT
  'series' as table_name,
  activity_status,
  COUNT(*) as count
FROM series
GROUP BY activity_status
UNION ALL
SELECT
  'model_details' as table_name,
  activity_status,
  COUNT(*) as count
FROM model_details
GROUP BY activity_status
ORDER BY table_name, activity_status;

-- =============================================================================
-- 执行完毕！
-- =============================================================================
--
-- 功能说明:
--  - activity_status = 0: 正常显示 ✅
--  - activity_status = 1: 不显示 ❌
--  - activity_status = 2: 不可用 ❌
--  - 品牌不显示时，其下的车系、车型、车型详情也不显示 🔗
--
