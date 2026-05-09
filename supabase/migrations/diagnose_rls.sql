-- 诊断 RLS 问题
-- ==========================================

-- 1. 检查表是否存在
SELECT '=== 检查 car_pictures 表 ===' AS info;
SELECT EXISTS (
    SELECT FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'car_pictures'
);

-- 2. 检查表的 RLS 状态
SELECT '=== 表的 RLS 状态 ===' AS info;
SELECT
    tablename,
    rowsecurity AS rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'car_pictures';

-- 3. 检查表上的策略
SELECT '=== 表上的策略 ===' AS info;
SELECT *
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'car_pictures';

-- 4. 检查存储桶策略
SELECT '=== 存储桶策略 ===' AS info;
SELECT *
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects';

-- 5. 检查权限
SELECT '=== 表权限 ===' AS info;
SELECT grantee, privilege_type
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name = 'car_pictures';

-- 6. 尝试插入一条测试数据
SELECT '=== 尝试插入测试数据 ===' AS info;
BEGIN;
SAVEPOINT test_insert;
INSERT INTO public.car_pictures (
    model_jm_id,
    category,
    image_url,
    sort_order
) VALUES (
    99999,
    'test',
    'https://example.com/test.jpg',
    0
);
SELECT * FROM public.car_pictures WHERE model_jm_id = 99999;
ROLLBACK TO SAVEPOINT test_insert;
COMMIT;

SELECT '✅ 诊断完成！';
