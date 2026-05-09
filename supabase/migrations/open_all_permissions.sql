-- 方案 B：不禁用 RLS，而是创建允许所有操作的策略
-- ==========================================

-- 1. 确保表存在
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection)
VALUES (
  'car-images',
  'car-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::TEXT[],
  true
) ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. 删除旧表重建
DROP TABLE IF EXISTS public.car_pictures CASCADE;

CREATE TABLE public.car_pictures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_jm_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_car_pictures_model_jm_id ON public.car_pictures(model_jm_id);
CREATE INDEX idx_car_pictures_category ON public.car_pictures(category);

-- ==========================================
-- 关键：不禁用 RLS，而是创建允许所有操作的策略
-- ==========================================

-- 启用 RLS
ALTER TABLE public.car_pictures ENABLE ROW LEVEL SECURITY;

-- 删除所有现有策略
DO $$
DECLARE
  policy_name text;
BEGIN
  FOR policy_name IN
    SELECT polname FROM pg_policies WHERE tablename = 'car_pictures' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I" ON public.car_pictures', policy_name);
  END LOOP;

  FOR policy_name IN
    SELECT polname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I" ON storage.objects', policy_name);
  END LOOP;
END $$;

-- 创建允许所有操作的策略
CREATE POLICY "allow_all_policy"
ON public.car_pictures
FOR ALL
TO public
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_authenticated"
ON public.car_pictures
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_anon"
ON public.car_pictures
FOR ALL
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "allow_all_service_role"
ON public.car_pictures
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- ==========================================
-- 存储桶策略
-- ==========================================

CREATE POLICY "allow_car_images_all"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'car-images')
WITH CHECK (bucket_id = 'car-images');

CREATE POLICY "allow_car_images_auth"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'car-images')
WITH CHECK (bucket_id = 'car-images');

-- ==========================================
-- 权限
-- ==========================================

GRANT ALL PRIVILEGES ON TABLE public.car_pictures TO anon;
GRANT ALL PRIVILEGES ON TABLE public.car_pictures TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.car_pictures TO service_role;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

-- ==========================================
-- 验证
-- ==========================================

SELECT '✅ 方案 B 已配置！允许所有操作！' AS result;

SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'car_pictures';

SELECT * FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'car_pictures';
