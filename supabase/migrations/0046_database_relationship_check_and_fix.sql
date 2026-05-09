-- ==========================================
-- 数据库关联链路检查和修复
-- 执行此脚本确保所有表关联正确
-- ==========================================

-- ==========================================
-- 1. 检查并添加缺失的 brand_name 字段到各表
-- ==========================================

-- model_details 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'model_details' AND column_name = 'brand_name'
  ) THEN
    ALTER TABLE model_details ADD COLUMN brand_name TEXT;
    RAISE NOTICE 'Added brand_name to model_details';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'model_details' AND column_name = 'series_name'
  ) THEN
    ALTER TABLE model_details ADD COLUMN series_name TEXT;
    RAISE NOTICE 'Added series_name to model_details';
  END IF;
END $$;

-- models_jumdata 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'models_jumdata' AND column_name = 'brand_name'
  ) THEN
    ALTER TABLE models_jumdata ADD COLUMN brand_name TEXT;
    RAISE NOTICE 'Added brand_name to models_jumdata';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'models_jumdata' AND column_name = 'series_name'
  ) THEN
    ALTER TABLE models_jumdata ADD COLUMN series_name TEXT;
    RAISE NOTICE 'Added series_name to models_jumdata';
  END IF;
END $$;

-- series 表
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'series' AND column_name = 'brand_name'
  ) THEN
    ALTER TABLE series ADD COLUMN brand_name TEXT;
    RAISE NOTICE 'Added brand_name to series';
  END IF;
END $$;

-- ==========================================
-- 2. 确保 series_vr_config 表存在并有正确的字段
-- ==========================================

CREATE TABLE IF NOT EXISTS public.series_vr_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  series_jm_id INTEGER NOT NULL,
  series_id UUID,
  series_name TEXT,
  brand_jm_id INTEGER,
  brand_name TEXT,
  exterior_vr JSONB DEFAULT '[]'::jsonb,
  interior_vr JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT series_vr_config_series_jm_id_unique UNIQUE(series_jm_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_series_vr_config_series_jm_id ON public.series_vr_config(series_jm_id);
CREATE INDEX IF NOT EXISTS idx_series_vr_config_brand_jm_id ON public.series_vr_config(brand_jm_id);

-- 创建 updated_at 触发器
DROP TRIGGER IF EXISTS trg_series_vr_config_updated_at ON public.series_vr_config;
CREATE TRIGGER trg_series_vr_config_updated_at
BEFORE UPDATE ON public.series_vr_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================
-- 3. 确保 model_image_config 表存在并有正确的字段
-- ==========================================

CREATE TABLE IF NOT EXISTS public.model_image_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_jm_id INTEGER NOT NULL,
  model_id UUID,
  model_name TEXT,
  series_jm_id INTEGER,
  series_name TEXT,
  brand_jm_id INTEGER,
  brand_name TEXT,
  exterior_images JSONB DEFAULT '[]'::jsonb,
  interior_images JSONB DEFAULT '[]'::jsonb,
  official_images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT model_image_config_model_jm_id_unique UNIQUE(model_jm_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_model_image_config_model_jm_id ON public.model_image_config(model_jm_id);
CREATE INDEX IF NOT EXISTS idx_model_image_config_series_jm_id ON public.model_image_config(series_jm_id);
CREATE INDEX IF NOT EXISTS idx_model_image_config_brand_jm_id ON public.model_image_config(brand_jm_id);

-- 创建 updated_at 触发器
DROP TRIGGER IF EXISTS trg_model_image_config_updated_at ON public.model_image_config;
CREATE TRIGGER trg_model_image_config_updated_at
BEFORE UPDATE ON public.model_image_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================
-- 4. 确保 model_resources 表有正确的字段
-- ==========================================

CREATE TABLE IF NOT EXISTS public.model_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID,
  model_jm_id INTEGER,
  series_id UUID,
  series_jm_id INTEGER,
  brand_id UUID,
  brand_jm_id INTEGER,
  resource_type TEXT NOT NULL CHECK (resource_type IN ('vr_exterior', 'vr_interior', 'official', 'exterior', 'interior')),
  image_url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  activity_status INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_model_resources_model_id ON public.model_resources(model_id);
CREATE INDEX IF NOT EXISTS idx_model_resources_model_jm_id ON public.model_resources(model_jm_id);
CREATE INDEX IF NOT EXISTS idx_model_resources_series_jm_id ON public.model_resources(series_jm_id);
CREATE INDEX IF NOT EXISTS idx_model_resources_brand_jm_id ON public.model_resources(brand_jm_id);
CREATE INDEX IF NOT EXISTS idx_model_resources_resource_type ON public.model_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_model_resources_activity_status ON public.model_resources(activity_status);

-- 创建 updated_at 触发器
DROP TRIGGER IF EXISTS trg_model_resources_updated_at ON public.model_resources;
CREATE TRIGGER trg_model_resources_updated_at
BEFORE UPDATE ON public.model_resources
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================
-- 5. RLS 策略
-- ==========================================

-- 启用 RLS
ALTER TABLE public.series_vr_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_image_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_resources ENABLE ROW LEVEL SECURITY;

-- series_vr_config 策略
DROP POLICY IF EXISTS "series_vr_config_select_for_anon" ON public.series_vr_config;
CREATE POLICY "series_vr_config_select_for_anon"
ON public.series_vr_config
FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "series_vr_config_all_for_admin" ON public.series_vr_config;
CREATE POLICY "series_vr_config_all_for_admin"
ON public.series_vr_config
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- model_image_config 策略
DROP POLICY IF EXISTS "model_image_config_select_for_anon" ON public.model_image_config;
CREATE POLICY "model_image_config_select_for_anon"
ON public.model_image_config
FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "model_image_config_all_for_admin" ON public.model_image_config;
CREATE POLICY "model_image_config_all_for_admin"
ON public.model_image_config
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- model_resources 策略
DROP POLICY IF EXISTS "model_resources_select_active_for_anon" ON public.model_resources;
CREATE POLICY "model_resources_select_active_for_anon"
ON public.model_resources
FOR SELECT TO anon USING (activity_status = 0);

DROP POLICY IF EXISTS "model_resources_all_for_admin" ON public.model_resources;
CREATE POLICY "model_resources_all_for_admin"
ON public.model_resources
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 6. 权限授予
-- ==========================================

GRANT SELECT ON public.series_vr_config TO anon;
GRANT ALL PRIVILEGES ON public.series_vr_config TO authenticated;

GRANT SELECT ON public.model_image_config TO anon;
GRANT ALL PRIVILEGES ON public.model_image_config TO authenticated;

GRANT SELECT ON public.model_resources TO anon;
GRANT ALL PRIVILEGES ON public.model_resources TO authenticated;

-- ==========================================
-- 7. 填充冗余字段（brand_name, series_name）
-- ==========================================

-- 更新 series 表的 brand_name
UPDATE series s
SET brand_name = b.name
FROM brands b
WHERE s.brand_jm_id = b.jm_id
  AND (s.brand_name IS NULL OR s.brand_name = '');

-- 更新 models_jumdata 表的 brand_name 和 series_name
UPDATE models_jumdata m
SET 
  brand_name = b.name,
  series_name = ser.name
FROM brands b
JOIN series ser ON m.series_jm_id = ser.jm_id
WHERE m.brand_jm_id = b.jm_id
  AND m.series_jm_id = ser.jm_id
  AND (m.brand_name IS NULL OR m.brand_name = '' OR m.series_name IS NULL OR m.series_name = '');

-- 更新 model_details 表的 brand_name 和 series_name
UPDATE model_details d
SET 
  brand_name = b.name,
  series_name = ser.name
FROM brands b
JOIN series ser ON d.series_jm_id = ser.jm_id
WHERE d.brand_jm_id = b.jm_id
  AND d.series_jm_id = ser.jm_id
  AND (d.brand_name IS NULL OR d.brand_name = '' OR d.series_name IS NULL OR d.series_name = '');

-- 更新 series_vr_config 表的 brand_name（如果有 series_id）
UPDATE series_vr_config svc
SET 
  brand_name = b.name,
  brand_jm_id = COALESCE(svc.brand_jm_id, s.brand_jm_id)
FROM series s
LEFT JOIN brands b ON s.brand_jm_id = b.jm_id
WHERE svc.series_jm_id = s.jm_id
  AND (svc.brand_name IS NULL OR svc.brand_name = '');

-- 更新 model_image_config 表的 brand_name 和 series_name
UPDATE model_image_config mic
SET 
  brand_name = b.name,
  series_name = ser.name,
  series_jm_id = COALESCE(mic.series_jm_id, mj.series_jm_id),
  brand_jm_id = COALESCE(mic.brand_jm_id, mj.brand_jm_id)
FROM models_jumdata mj
LEFT JOIN brands b ON mj.brand_jm_id = b.jm_id
LEFT JOIN series ser ON mj.series_jm_id = ser.jm_id
WHERE mic.model_jm_id = mj.jm_id
  AND (mic.brand_name IS NULL OR mic.brand_name = '' OR mic.series_name IS NULL OR mic.series_name = '');

-- ==========================================
-- 8. 验证查询
-- ==========================================

SELECT 
  '检查结果:' AS info,
  (SELECT COUNT(*) FROM brands) AS brands_count,
  (SELECT COUNT(*) FROM series) AS series_count,
  (SELECT COUNT(*) FROM models_jumdata) AS models_jumdata_count,
  (SELECT COUNT(*) FROM model_details) AS model_details_count,
  (SELECT COUNT(*) FROM series_vr_config) AS series_vr_config_count,
  (SELECT COUNT(*) FROM model_image_config) AS model_image_config_count,
  (SELECT COUNT(*) FROM model_resources) AS model_resources_count;

-- ==========================================
-- 完成！
-- ==========================================
SELECT '✅ 数据库关联链路检查和修复完成！' AS result;
