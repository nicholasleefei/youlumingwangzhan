-- ==========================================
-- 完整的快速修复 SQL - 运行此脚本
-- 一次性创建所有必需的表和存储桶
-- ==========================================

-- 1. 创建 model_resources 表（如果还没创建）
CREATE TABLE IF NOT EXISTS public.model_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_id UUID REFERENCES public.models(id) ON DELETE CASCADE,
  model_jm_id INTEGER,
  series_id UUID REFERENCES public.series(id) ON DELETE CASCADE,
  series_jm_id INTEGER,
  brand_id UUID REFERENCES public.brands(id) ON DELETE CASCADE,
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
CREATE INDEX IF NOT EXISTS idx_model_resources_resource_type ON public.model_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_model_resources_activity_status ON public.model_resources(activity_status);

-- 创建 updated_at 触发器
DROP TRIGGER IF EXISTS trg_model_resources_updated_at ON public.model_resources;
CREATE TRIGGER trg_model_resources_updated_at
BEFORE UPDATE ON public.model_resources
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================
-- RLS 策略
-- ==========================================

-- 启用 RLS
ALTER TABLE public.model_resources ENABLE ROW LEVEL SECURITY;

-- 匿名用户读取策略：只能读取 activity_status = 0 的记录，且关联的车型也必须可访问
DROP POLICY IF EXISTS "model_resources_select_active_for_anon" ON public.model_resources;
CREATE POLICY "model_resources_select_active_for_anon"
ON public.model_resources
FOR SELECT
TO anon
USING (
  activity_status = 0 AND
  EXISTS (
    SELECT 1 FROM public.models m
    WHERE m.id = model_resources.model_id
    AND m.activity_status = 0
    AND m.is_active = true
  )
);

-- 已认证用户（管理员）完全访问
DROP POLICY IF EXISTS "model_resources_all_for_admin" ON public.model_resources;
CREATE POLICY "model_resources_all_for_admin"
ON public.model_resources
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ==========================================
-- 权限授予
-- ==========================================

GRANT SELECT ON public.model_resources TO anon;
GRANT ALL PRIVILEGES ON public.model_resources TO authenticated;

-- ==========================================
-- 创建 RPC 函数
-- ==========================================

DROP FUNCTION IF EXISTS public.create_model_resources_table();
CREATE OR REPLACE FUNCTION public.create_model_resources_table()
RETURNS VOID AS $$
BEGIN
  RAISE NOTICE 'model_resources table is ready';
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.create_model_resources_table() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_model_resources_table() TO anon;

DROP FUNCTION IF EXISTS public.get_model_resources(p_model_jm_id INTEGER);
CREATE OR REPLACE FUNCTION public.get_model_resources(p_model_jm_id INTEGER)
RETURNS TABLE (
  id UUID,
  model_id UUID,
  model_jm_id INTEGER,
  series_id UUID,
  series_jm_id INTEGER,
  brand_id UUID,
  brand_jm_id INTEGER,
  resource_type TEXT,
  image_url TEXT,
  order_index INTEGER,
  activity_status INTEGER,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    mr.id, mr.model_id, mr.model_jm_id, mr.series_id, mr.series_jm_id,
    mr.brand_id, mr.brand_jm_id, mr.resource_type, mr.image_url,
    mr.order_index, mr.activity_status, mr.created_at, mr.updated_at
  FROM public.model_resources mr
  WHERE mr.model_jm_id = p_model_jm_id
    AND mr.activity_status = 0
  ORDER BY mr.resource_type, mr.order_index;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_model_resources(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_model_resources(INTEGER) TO anon;

-- ==========================================
-- 2. 创建 model-images 存储桶
-- ==========================================

-- 检查并创建 model-images 存储桶
INSERT INTO storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  avif_autodetection
) VALUES (
  'model-images',
  'model-images',
  true,
  10485760,  -- 10MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[],
  true
)
ON CONFLICT (id) DO NOTHING;

-- 删除可能已存在的策略后重新创建
DROP POLICY IF EXISTS "Allow authenticated upload to model-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to model-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from model-images" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to model-images" ON storage.objects;

-- 为 authenticated (admin) 开启上传权限
CREATE POLICY "Allow authenticated upload to model-images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'model-images');

-- 为 authenticated (admin) 开启更新权限
CREATE POLICY "Allow authenticated update to model-images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'model-images');

-- 为 authenticated (admin) 开启删除权限
CREATE POLICY "Allow authenticated delete from model-images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'model-images');

-- 公开访问
CREATE POLICY "Give public access to model-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'model-images');

-- ==========================================
-- 验证查询：
-- ==========================================
SELECT 'Setup complete!' AS result;
