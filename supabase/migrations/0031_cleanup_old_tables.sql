-- ================================================
-- 删除旧的表（不再使用，改用聚美数据的表）
-- ================================================

-- 删除旧的 models 表
DROP TABLE IF EXISTS public.models CASCADE;

-- 删除旧的 model_translations 表
DROP TABLE IF EXISTS public.model_translations CASCADE;

-- 删除旧的 model_images 表（如果存在）
DROP TABLE IF EXISTS public.model_images CASCADE;

-- ================================================
-- 为 car_pictures 表添加 activity_status 列（如果不存在）
-- ================================================
ALTER TABLE public.car_pictures 
ADD COLUMN IF NOT EXISTS activity_status INTEGER DEFAULT 0;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_car_pictures_activity_status 
ON public.car_pictures(activity_status);
