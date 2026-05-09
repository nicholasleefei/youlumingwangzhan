-- ==========================================
-- 修复 RLS 策略 - 运行此脚本
-- ==========================================

-- 删除旧的 RLS 策略
DROP POLICY IF EXISTS "model_resources_select_active_for_anon" ON public.model_resources;
DROP POLICY IF EXISTS "model_resources_all_for_admin" ON public.model_resources;

-- 为所有人（包括 anon）提供完全访问权限（用于调试）
CREATE POLICY "model_resources_allow_all"
ON public.model_resources
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 或者更严格的版本（只允许 authenticated）
-- CREATE POLICY "model_resources_admin_full_access"
-- ON public.model_resources
-- FOR ALL
-- TO authenticated
-- USING (true)
-- WITH CHECK (true);

-- ==========================================
-- 同时修复存储桶的 RLS 策略
-- ==========================================

-- 为 model-images 存储桶添加宽松的策略
DROP POLICY IF EXISTS "Allow authenticated upload to model-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update to model-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete from model-images" ON storage.objects;
DROP POLICY IF EXISTS "Give public access to model-images" ON storage.objects;

-- 允许所有人读取
CREATE POLICY "Public access to model-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'model-images');

-- 允许 authenticated 用户上传/更新/删除
CREATE POLICY "Authenticated access to model-images"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'model-images')
WITH CHECK (bucket_id = 'model-images');

-- ==========================================
-- 验证查询
-- ==========================================
SELECT 'RLS 策略修复完成！';
SELECT * FROM pg_policies WHERE tablename = 'model_resources' OR policyname LIKE '%model-images%';
