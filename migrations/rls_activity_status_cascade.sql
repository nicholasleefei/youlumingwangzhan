-- 删除旧的策略
DROP POLICY IF EXISTS "Brands are visible with normal activity status" ON brands;
DROP POLICY IF EXISTS "Models are visible with normal activity status" ON models;
DROP POLICY IF EXISTS "Series are visible with normal activity status" ON series;
DROP POLICY IF EXISTS "Model details are visible with normal activity status" ON model_details;

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
      -- 如果有品牌关联，检查品牌状态
      brand IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM brands
        WHERE brands.name = models.brand
        AND brands.activity_status = 0
      )
      -- 如果没有品牌关联，只检查自己的状态
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
      -- 如果有品牌关联，检查品牌状态
      brandname IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM brands
        WHERE brands.name = model_details.brandname
        AND brands.activity_status = 0
      )
      -- 如果有车型关联，检查车型状态
      OR model_id IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM models
        WHERE models.id = model_details.model_id
        AND models.activity_status = 0
      )
    )
  );
