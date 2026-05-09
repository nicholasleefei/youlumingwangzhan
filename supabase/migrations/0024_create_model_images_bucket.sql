-- ==========================================
-- 创建 model-images 存储桶
-- ==========================================

-- 创建 model-images 存储桶
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
