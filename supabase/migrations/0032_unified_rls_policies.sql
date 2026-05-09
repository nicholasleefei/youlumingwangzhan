-- ================================================
-- 统一的 RLS 策略：确保前端只看到 activity_status = 0 的数据
-- ================================================

-- ================================================
-- 1. brands 表
-- ================================================
ALTER TABLE public.brands ENABLE ROW LEVEL SECURITY;

-- 删除所有旧策略
DROP POLICY IF EXISTS "brands_select_all" ON public.brands;
DROP POLICY IF EXISTS "Brands are visible with normal activity status" ON public.brands;
DROP POLICY IF EXISTS "brands_select_active_only" ON public.brands;
DROP POLICY IF EXISTS "brands_all_for_admin" ON public.brands;

-- 创建新策略：匿名用户只能看到 activity_status = 0 的数据
CREATE POLICY "brands_select_active_only"
ON public.brands
FOR SELECT
TO anon
USING (activity_status = 0);

-- 管理员可以操作所有数据
CREATE POLICY "brands_all_for_admin"
ON public.brands
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ================================================
-- 2. series 表
-- ================================================
ALTER TABLE public.series ENABLE ROW LEVEL SECURITY;

-- 删除所有旧策略
DROP POLICY IF EXISTS "series_select_all" ON public.series;
DROP POLICY IF EXISTS "Series are visible with normal activity status" ON public.series;
DROP POLICY IF EXISTS "series_select_active_only" ON public.series;
DROP POLICY IF EXISTS "series_all_for_admin" ON public.series;

-- 创建新策略：匿名用户只能看到 activity_status = 0 的数据
CREATE POLICY "series_select_active_only"
ON public.series
FOR SELECT
TO anon
USING (activity_status = 0);

-- 管理员可以操作所有数据
CREATE POLICY "series_all_for_admin"
ON public.series
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ================================================
-- 3. models_jumdata 表
-- ================================================
ALTER TABLE public.models_jumdata ENABLE ROW LEVEL SECURITY;

-- 为 models_jumdata 添加 activity_status 列（如果不存在）
ALTER TABLE public.models_jumdata 
ADD COLUMN IF NOT EXISTS activity_status INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_models_jumdata_activity_status 
ON public.models_jumdata(activity_status);

-- 删除所有旧策略
DROP POLICY IF EXISTS "models_jumdata_select_all" ON public.models_jumdata;
DROP POLICY IF EXISTS "Models are visible with normal activity status" ON public.models_jumdata;
DROP POLICY IF EXISTS "models_jumdata_select_active_only" ON public.models_jumdata;
DROP POLICY IF EXISTS "models_jumdata_all_for_admin" ON public.models_jumdata;

-- 创建新策略：匿名用户只能看到 activity_status = 0 的数据
CREATE POLICY "models_jumdata_select_active_only"
ON public.models_jumdata
FOR SELECT
TO anon
USING (activity_status = 0);

-- 管理员可以操作所有数据
CREATE POLICY "models_jumdata_all_for_admin"
ON public.models_jumdata
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ================================================
-- 4. model_details 表
-- ================================================
ALTER TABLE public.model_details ENABLE ROW LEVEL SECURITY;

-- 删除所有旧策略
DROP POLICY IF EXISTS "model_details_select_all" ON public.model_details;
DROP POLICY IF EXISTS "Model details are visible with normal activity status" ON public.model_details;
DROP POLICY IF EXISTS "model_details_select_active_only" ON public.model_details;
DROP POLICY IF EXISTS "model_details_all_for_admin" ON public.model_details;

-- 创建新策略：匿名用户只能看到 activity_status = 0 的数据
CREATE POLICY "model_details_select_active_only"
ON public.model_details
FOR SELECT
TO anon
USING (activity_status = 0);

-- 管理员可以操作所有数据
CREATE POLICY "model_details_all_for_admin"
ON public.model_details
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ================================================
-- 5. car_pictures 表
-- ================================================
ALTER TABLE public.car_pictures ENABLE ROW LEVEL SECURITY;

-- 删除所有旧策略
DROP POLICY IF EXISTS "car_pictures_select_active_only" ON public.car_pictures;
DROP POLICY IF EXISTS "car_pictures_all_for_admin" ON public.car_pictures;

-- 创建策略：匿名用户只能看到 activity_status = 0 的数据
CREATE POLICY "car_pictures_select_active_only"
ON public.car_pictures
FOR SELECT
TO anon
USING (activity_status = 0);

-- 管理员可以操作所有数据
CREATE POLICY "car_pictures_all_for_admin"
ON public.car_pictures
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ================================================
-- 6. country_sales 表（保持公开可读）
-- ================================================
ALTER TABLE public.country_sales ENABLE ROW LEVEL SECURITY;

-- 删除所有旧策略
DROP POLICY IF EXISTS "country_sales_select_all" ON public.country_sales;
DROP POLICY IF EXISTS "country_sales_all_for_admin" ON public.country_sales;

CREATE POLICY "country_sales_select_all"
ON public.country_sales
FOR SELECT
TO anon
USING (true);

CREATE POLICY "country_sales_all_for_admin"
ON public.country_sales
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ================================================
-- 7. inquiries 表（匿名可以插入，管理员可以操作）
-- ================================================
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- 删除所有旧策略
DROP POLICY IF EXISTS "inquiries_insert_for_anon" ON public.inquiries;
DROP POLICY IF EXISTS "inquiries_all_for_admin" ON public.inquiries;

CREATE POLICY "inquiries_insert_for_anon"
ON public.inquiries
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "inquiries_all_for_admin"
ON public.inquiries
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ================================================
-- 8. inquiry_items 表（匿名可以插入，管理员可以操作）
-- ================================================
ALTER TABLE public.inquiry_items ENABLE ROW LEVEL SECURITY;

-- 删除所有旧策略
DROP POLICY IF EXISTS "inquiry_items_insert_for_anon" ON public.inquiry_items;
DROP POLICY IF EXISTS "inquiry_items_all_for_admin" ON public.inquiry_items;

CREATE POLICY "inquiry_items_insert_for_anon"
ON public.inquiry_items
FOR INSERT
TO anon
WITH CHECK (true);

CREATE POLICY "inquiry_items_all_for_admin"
ON public.inquiry_items
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ================================================
-- 确保权限正确
-- ================================================
GRANT SELECT ON public.brands TO anon;
GRANT SELECT ON public.series TO anon;
GRANT SELECT ON public.models_jumdata TO anon;
GRANT SELECT ON public.model_details TO anon;
GRANT SELECT ON public.car_pictures TO anon;
GRANT SELECT ON public.country_sales TO anon;
GRANT INSERT ON public.inquiries TO anon;
GRANT INSERT ON public.inquiry_items TO anon;

GRANT ALL PRIVILEGES ON public.brands TO authenticated;
GRANT ALL PRIVILEGES ON public.series TO authenticated;
GRANT ALL PRIVILEGES ON public.models_jumdata TO authenticated;
GRANT ALL PRIVILEGES ON public.model_details TO authenticated;
GRANT ALL PRIVILEGES ON public.car_pictures TO authenticated;
GRANT ALL PRIVILEGES ON public.country_sales TO authenticated;
GRANT ALL PRIVILEGES ON public.inquiries TO authenticated;
GRANT ALL PRIVILEGES ON public.inquiry_items TO authenticated;
