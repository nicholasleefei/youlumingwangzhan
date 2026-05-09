-- ==========================================
-- 创建/修改资源配置表，添加 jm_id 关联
-- ==========================================

-- 创建 series_vr_config 表（如果不存在）
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
  UNIQUE(series_jm_id)
);

-- 创建 model_image_config 表（如果不存在）
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
  UNIQUE(model_jm_id)
);

-- 为 series_vr_config 创建索引
CREATE INDEX IF NOT EXISTS idx_series_vr_config_series_jm_id ON public.series_vr_config(series_jm_id);
CREATE INDEX IF NOT EXISTS idx_series_vr_config_brand_jm_id ON public.series_vr_config(brand_jm_id);

-- 为 model_image_config 创建索引
CREATE INDEX IF NOT EXISTS idx_model_image_config_model_jm_id ON public.model_image_config(model_jm_id);
CREATE INDEX IF NOT EXISTS idx_model_image_config_series_jm_id ON public.model_image_config(series_jm_id);
CREATE INDEX IF NOT EXISTS idx_model_image_config_brand_jm_id ON public.model_image_config(brand_jm_id);

-- 创建 updated_at 触发器
DROP TRIGGER IF EXISTS trg_series_vr_config_updated_at ON public.series_vr_config;
CREATE TRIGGER trg_series_vr_config_updated_at
BEFORE UPDATE ON public.series_vr_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS trg_model_image_config_updated_at ON public.model_image_config;
CREATE TRIGGER trg_model_image_config_updated_at
BEFORE UPDATE ON public.model_image_config
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================
-- RLS 策略
-- ==========================================

-- 启用 RLS
ALTER TABLE public.series_vr_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_image_config ENABLE ROW LEVEL SECURITY;

-- 匿名用户读取策略
DROP POLICY IF EXISTS "series_vr_config_select_for_anon" ON public.series_vr_config;
CREATE POLICY "series_vr_config_select_for_anon"
ON public.series_vr_config
FOR SELECT TO anon USING (true);

DROP POLICY IF EXISTS "model_image_config_select_for_anon" ON public.model_image_config;
CREATE POLICY "model_image_config_select_for_anon"
ON public.model_image_config
FOR SELECT TO anon USING (true);

-- 管理员完全访问
DROP POLICY IF EXISTS "series_vr_config_all_for_admin" ON public.series_vr_config;
CREATE POLICY "series_vr_config_all_for_admin"
ON public.series_vr_config
FOR ALL TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "model_image_config_all_for_admin" ON public.model_image_config;
CREATE POLICY "model_image_config_all_for_admin"
ON public.model_image_config
FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- ==========================================
-- 权限授予
-- ==========================================

GRANT SELECT ON public.series_vr_config TO anon;
GRANT ALL PRIVILEGES ON public.series_vr_config TO authenticated;

GRANT SELECT ON public.model_image_config TO anon;
GRANT ALL PRIVILEGES ON public.model_image_config TO authenticated;

-- ==========================================
-- 更新现有的 car-images 存储桶的文件结构
-- 注意：旧文件不会被自动移动，但新上传的文件会使用正确的路径
-- ==========================================

-- 创建 RPC 函数：get_series_vr_config
DROP FUNCTION IF EXISTS public.get_series_vr_config(p_series_jm_id INTEGER);
CREATE OR REPLACE FUNCTION public.get_series_vr_config(p_series_jm_id INTEGER)
RETURNS TABLE (
  id UUID,
  series_jm_id INTEGER,
  series_id UUID,
  series_name TEXT,
  brand_jm_id INTEGER,
  brand_name TEXT,
  exterior_vr JSONB,
  interior_vr JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id, s.series_jm_id, s.series_id, s.series_name, s.brand_jm_id, s.brand_name,
    s.exterior_vr, s.interior_vr, s.created_at, s.updated_at
  FROM public.series_vr_config s
  WHERE s.series_jm_id = p_series_jm_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_series_vr_config(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_series_vr_config(INTEGER) TO anon;

-- 创建 RPC 函数：get_model_image_config
DROP FUNCTION IF EXISTS public.get_model_image_config(p_model_jm_id INTEGER);
CREATE OR REPLACE FUNCTION public.get_model_image_config(p_model_jm_id INTEGER)
RETURNS TABLE (
  id UUID,
  model_jm_id INTEGER,
  model_id UUID,
  model_name TEXT,
  series_jm_id INTEGER,
  series_name TEXT,
  brand_jm_id INTEGER,
  brand_name TEXT,
  exterior_images JSONB,
  interior_images JSONB,
  official_images JSONB,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    m.id, m.model_jm_id, m.model_id, m.model_name, m.series_jm_id, m.series_name,
    m.brand_jm_id, m.brand_name, m.exterior_images, m.interior_images, m.official_images,
    m.created_at, m.updated_at
  FROM public.model_image_config m
  WHERE m.model_jm_id = p_model_jm_id;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_model_image_config(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_model_image_config(INTEGER) TO anon;