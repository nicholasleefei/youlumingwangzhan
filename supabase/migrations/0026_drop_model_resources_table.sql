-- 删除旧的 model_resources 表
DROP TABLE IF EXISTS model_resources CASCADE;

-- 也删除旧的 model_images 表（如果有）
DROP TABLE IF EXISTS model_images CASCADE;

-- 验证表已删除
SELECT '已删除旧的 model_resources 表' AS status;
