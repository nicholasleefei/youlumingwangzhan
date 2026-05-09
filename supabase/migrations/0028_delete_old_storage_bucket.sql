-- ==========================================
-- 删除旧的 model-images 存储桶
-- ==========================================

-- 删除存储桶策略
DELETE FROM storage.policies WHERE bucket_id = 'model-images';

-- 删除存储桶
DELETE FROM storage.buckets WHERE id = 'model-images';

-- 验证删除结果
SELECT '已删除旧的 model-images 存储桶' AS status;
