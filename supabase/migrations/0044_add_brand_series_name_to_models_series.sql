-- 添加品牌名称和车系名称字段到 models_jumdata 表
ALTER TABLE models_jumdata
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS series_name TEXT;

-- 为新字段添加注释
COMMENT ON COLUMN models_jumdata.brand_name IS '品牌名称（冗余存储，方便查询）';
COMMENT ON COLUMN models_jumdata.series_name IS '车系名称（冗余存储，方便查询）';

-- 更新现有数据
UPDATE models_jumdata md
SET brand_name = b.name
FROM brands b
WHERE md.brand_jm_id = b.jm_id
  AND md.brand_name IS NULL;

UPDATE models_jumdata md
SET series_name = s.name
FROM series s
WHERE md.series_jm_id = s.jm_id
  AND md.series_name IS NULL;

-- 添加品牌名称字段到 series 表
ALTER TABLE series
ADD COLUMN IF NOT EXISTS brand_name TEXT;

COMMENT ON COLUMN series.brand_name IS '品牌名称（冗余存储，方便查询）';

-- 更新现有数据
UPDATE series s
SET brand_name = b.name
FROM brands b
WHERE s.brand_jm_id = b.jm_id
  AND s.brand_name IS NULL;