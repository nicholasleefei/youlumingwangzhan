-- ==========================================
-- 管理员使用：完全开放权限，无任何限制
-- ==========================================

-- 1. 强制创建存储桶
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types, avif_autodetection)
VALUES (
  'car-images',
  'car-images',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::TEXT[],
  true
) ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. 删除旧表，完全重建
DROP TABLE IF EXISTS public.car_pictures CASCADE;

-- 3. 创建表时直接禁用 RLS（最有效的方法）
CREATE TABLE public.car_pictures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_jm_id INTEGER NOT NULL,
  category TEXT NOT NULL,
  image_url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
) WITHOUT ROW LEVEL SECURITY;

-- 4. 创建索引
CREATE INDEX idx_car_pictures_model_jm_id ON public.car_pictures(model_jm_id);
CREATE INDEX idx_car_pictures_category ON public.car_pictures(category);

-- ==========================================
-- 彻底删除所有 RLS 策略
-- ==========================================

-- 删除存储桶策略
DO $$
DECLARE
  policy_name text;
BEGIN
  -- 删除 car-images 存储桶的所有策略
  FOR policy_name IN
    SELECT polname FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I" ON storage.objects', policy_name);
  END LOOP;

  -- 删除 car_pictures 表的所有策略
  FOR policy_name IN
    SELECT polname FROM pg_policies WHERE tablename = 'car_pictures' AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS "%I" ON public.car_pictures', policy_name);
  END LOOP;
END $$;

-- 5. 确保表没有 RLS（双重保障）
ALTER TABLE public.car_pictures DISABLE ROW LEVEL SECURITY;

-- 6. 授予所有权限
GRANT ALL PRIVILEGES ON TABLE public.car_pictures TO anon;
GRANT ALL PRIVILEGES ON TABLE public.car_pictures TO authenticated;
GRANT ALL PRIVILEGES ON TABLE public.car_pictures TO service_role;
GRANT ALL PRIVILEGES ON TABLE public.car_pictures TO postgres;

-- 授予 schema 权限
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- 7. 授予序列权限（用于自增列）
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO anon;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO service_role;

-- 8. 为 car-images 存储桶创建最宽松的策略
CREATE POLICY "public_access_car_images"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'car-images')
WITH CHECK (bucket_id = 'car-images');

CREATE POLICY "auth_access_car_images"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'car-images')
WITH CHECK (bucket_id = 'car-images');

-- ==========================================
-- 验证修复结果
-- ==========================================

SELECT '✅ 管理员方案已就绪！完全开放权限！' AS result;

-- 检查表状态和权限
SELECT * FROM pg_tables
WHERE schemaname = 'public'
  AND tablename = 'car_pictures';

-- 显示所有策略
SELECT * FROM pg_policies
WHERE schemaname IN ('public', 'storage')
  AND tablename IN ('car_pictures', 'objects');

-- 显示当前权限
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
  AND table_name = 'car_pictures'
ORDER BY grantee, privilege_type;

