-- ==========================================
-- 完整的重置和修复脚本
-- ==========================================

-- 1. 先临时禁用 RLS
ALTER TABLE public.model_resources DISABLE ROW LEVEL SECURITY;

-- 2. 删除表（如果存在）
DROP TABLE IF EXISTS public.model_resources;

-- 3. 重新创建表
CREATE TABLE public.model_resources (
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

-- 4. 创建索引
CREATE INDEX IF NOT EXISTS idx_model_resources_model_id ON public.model_resources(model_id);
CREATE INDEX IF NOT EXISTS idx_model_resources_model_jm_id ON public.model_resources(model_jm_id);
CREATE INDEX IF NOT EXISTS idx_model_resources_resource_type ON public.model_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_model_resources_activity_status ON public.model_resources(activity_status);

-- 5. 创建 updated_at 触发器
DROP TRIGGER IF EXISTS trg_model_resources_updated_at ON public.model_resources;
CREATE TRIGGER trg_model_resources_updated_at
BEFORE UPDATE ON public.model_resources
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. 授予权限（暂时不启用 RLS）
GRANT ALL PRIVILEGES ON public.model_resources TO anon;
GRANT ALL PRIVILEGES ON public.model_resources TO authenticated;
GRANT ALL PRIVILEGES ON public.model_resources TO service_role;

-- 7. 确保存储桶存在（如果不存在）
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection)
VALUES (
  'model-images',
  'model-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::TEXT[],
  true
) ON CONFLICT (id) DO NOTHING;

-- 8. 删除所有存储桶策略
DROP POLICY IF EXISTS "Allow authenticated upload to model-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to model-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from model-images" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to model-images" ON storage.objects;
DROP POLICY IF EXISTS "Public access to model-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated access to model-images" ON storage.objects;

-- 9. 创建宽松的存储桶策略
CREATE POLICY "Public can read model-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'model-images');

CREATE POLICY "Authenticated can manage model-images"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'model-images')
WITH CHECK (bucket_id = 'model-images');

-- 10. 创建 RPC 函数
DROP FUNCTION IF EXISTS public.create_model_resources_table();
CREATE OR REPLACE FUNCTION public.create_model_resources_table()
RETURNS VOID AS $$
BEGIN
  RAISE NOTICE 'model_resources table is ready';
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.create_model_resources_table() TO anon;
GRANT EXECUTE ON FUNCTION public.create_model_resources_table() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_model_resources_table() TO service_role;

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
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_model_resources(INTEGER) TO anon;
GRANT EXECUTE ON FUNCTION public.get_model_resources(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_model_resources(INTEGER) TO service_role;

-- ==========================================
-- 完成！
-- ==========================================
SELECT '✅ 重置完成！RLS 已临时禁用，现在可以正常上传图片了！' AS result;
