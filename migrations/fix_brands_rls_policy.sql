
-- =============================================================================
-- 修复 RLS 策略 - 确保 brands 表筛选正确
-- =============================================================================

-- 1. 删除现有策略
DROP POLICY IF EXISTS "Brands are visible with normal activity status" ON brands;
DROP POLICY IF EXISTS "Models are visible with normal activity status" ON models;
DROP POLICY IF EXISTS "Series are visible with normal activity status" ON series;
DROP POLICY IF EXISTS "Model details are visible with normal activity status" ON model_details;

-- 2. 重新创建筛选策略

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

-- 车型详情策略：只允许查询 activity_status = 0 且关联品牌或车型正常的车型详情
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

-- 管理员策略
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

-- 3. 验证策略是否正确创建
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE tablename IN ('brands', 'models', 'series', 'model_details')
ORDER BY tablename, policyname;

-- 4. 检查 brands 表的 activity_status 分布
SELECT
  activity_status,
  COUNT(*) AS count
FROM brands
GROUP BY activity_status
ORDER BY activity_status;

-- 5. 验证查询是否正常工作
-- 这应该只返回 20 条记录（如果统计结果正确）
SELECT COUNT(*) AS filtered_count
FROM brands
WHERE activity_status = 0;

-- =============================================================================
-- 执行步骤说明：
-- 1. 复制整个内容到 Supabase SQL 编辑器
-- 2. 点击 Run 按钮执行
-- 3. 检查第 4 和第 5 步的输出是否一致
-- =============================================================================
