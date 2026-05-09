-- ================================================
-- 添加缺失的字段到 models 表
-- ================================================

-- 1. 添加 series_id 列（用于关联车系）
ALTER TABLE public.models 
ADD COLUMN IF NOT EXISTS series_id uuid references public.series(id) on delete cascade;

-- 2. 添加 seats 列（座位数）
ALTER TABLE public.models 
ADD COLUMN IF NOT EXISTS seats int;

-- 3. 添加 activity_status 列（活动状态）
ALTER TABLE public.models 
ADD COLUMN IF NOT EXISTS activity_status int not null default 0;

-- 4. 创建索引以优化查询
CREATE INDEX IF NOT EXISTS idx_models_series_id ON public.models(series_id);
CREATE INDEX IF NOT EXISTS idx_models_activity_status ON public.models(activity_status);

-- ================================================
-- 验证字段已添加
-- ================================================
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'models'
AND column_name IN ('series_id', 'seats', 'activity_status')
ORDER BY ordinal_position;
