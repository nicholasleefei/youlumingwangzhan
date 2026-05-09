-- 添加品牌名称和车系名称字段到 model_details 表
ALTER TABLE model_details
ADD COLUMN IF NOT EXISTS brand_name TEXT,
ADD COLUMN IF NOT EXISTS series_name TEXT;

-- 为新字段添加注释
COMMENT ON COLUMN model_details.brand_name IS '品牌名称（冗余存储，方便查询）';
COMMENT ON COLUMN model_details.series_name IS '车系名称（冗余存储，方便查询）';

-- 更新现有数据：用 brand_jm_id 和 series_jm_id 关联查询填充这些字段
UPDATE model_details md
SET brand_name = b.name
FROM brands b
WHERE md.brand_jm_id = b.jm_id
  AND md.brand_name IS NULL;

UPDATE model_details md
SET series_name = s.name
FROM series s
WHERE md.series_jm_id = s.jm_id
  AND md.series_name IS NULL;

-- 为非空字段添加 NOT NULL（可选，如果需要）
-- ALTER TABLE model_details ALTER COLUMN brand_name SET NOT NULL;
-- ALTER TABLE model_details ALTER COLUMN series_name SET NOT NULL;