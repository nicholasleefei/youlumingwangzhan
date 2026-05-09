-- ================================================
-- 确保 models_jumdata 表的 activity_status 有默认值
-- ================================================

-- 更新现有 NULL 值为 0
UPDATE public.models_jumdata 
SET activity_status = 0 
WHERE activity_status IS NULL;

-- 确保列有默认值约束
ALTER TABLE public.models_jumdata 
ALTER COLUMN activity_status SET DEFAULT 0;

-- 确保列不允许为 NULL
ALTER TABLE public.models_jumdata 
ALTER COLUMN activity_status SET NOT NULL;
