-- 为 brands 表添加 activity_status 列
ALTER TABLE brands
ADD COLUMN IF NOT EXISTS activity_status INTEGER DEFAULT 0;

-- 为 models 表添加 activity_status 列
ALTER TABLE models
ADD COLUMN IF NOT EXISTS activity_status INTEGER DEFAULT 0;

-- 为 series 表添加 activity_status 列
ALTER TABLE series
ADD COLUMN IF NOT EXISTS activity_status INTEGER DEFAULT 0;

-- 为 model_details 表添加 activity_status 列
ALTER TABLE model_details
ADD COLUMN IF NOT EXISTS activity_status INTEGER DEFAULT 0;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_brands_activity_status ON brands(activity_status);
CREATE INDEX IF NOT EXISTS idx_models_activity_status ON models(activity_status);
CREATE INDEX IF NOT EXISTS idx_series_activity_status ON series(activity_status);
CREATE INDEX IF NOT EXISTS idx_model_details_activity_status ON model_details(activity_status);
