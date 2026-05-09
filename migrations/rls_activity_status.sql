-- 为 brands 表创建 RLS 策略：只允许查询 activity_status = 0 的品牌
DROP POLICY IF EXISTS "Brands are visible with normal activity status" ON brands;
CREATE POLICY "Brands are visible with normal activity status"
  ON brands
  FOR SELECT
  USING (activity_status = 0);

-- 为 models 表创建 RLS 策略：只允许查询 activity_status = 0 的车型
DROP POLICY IF EXISTS "Models are visible with normal activity status" ON models;
CREATE POLICY "Models are visible with normal activity status"
  ON models
  FOR SELECT
  USING (activity_status = 0);

-- 为 series 表创建 RLS 策略：只允许查询 activity_status = 0 的车系
DROP POLICY IF EXISTS "Series are visible with normal activity status" ON series;
CREATE POLICY "Series are visible with normal activity status"
  ON series
  FOR SELECT
  USING (activity_status = 0);

-- 为 model_details 表创建 RLS 策略：只允许查询 activity_status = 0 的车型详情
DROP POLICY IF EXISTS "Model details are visible with normal activity status" ON model_details;
CREATE POLICY "Model details are visible with normal activity status"
  ON model_details
  FOR SELECT
  USING (activity_status = 0);
