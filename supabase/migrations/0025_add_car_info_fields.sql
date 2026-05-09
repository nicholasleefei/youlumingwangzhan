-- ==========================================
-- 为 car_pictures 表添加品牌、车系、车型信息字段
-- ==========================================

-- 添加品牌字段
ALTER TABLE car_pictures 
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS brand_jm_id INTEGER,
ADD COLUMN IF NOT EXISTS series_name TEXT,
ADD COLUMN IF NOT EXISTS series_jm_id INTEGER,
ADD COLUMN IF NOT EXISTS model_name TEXT;

-- 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_car_pictures_brand_jm_id ON car_pictures(brand_jm_id);
CREATE INDEX IF NOT EXISTS idx_car_pictures_series_jm_id ON car_pictures(series_jm_id);

-- 验证字段已添加
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'car_pictures'
AND column_name IN ('brand_name', 'brand_jm_id', 'series_name', 'series_jm_id', 'model_name')
ORDER BY ordinal_position;
