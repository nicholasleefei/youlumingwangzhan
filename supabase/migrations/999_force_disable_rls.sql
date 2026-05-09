-- ==========================================
-- 强制禁用 RLS 和所有安全限制
-- ==========================================

-- 1. 对 model_resources 禁用 RLS
ALTER TABLE public.model_resources DISABLE ROW LEVEL SECURITY;

-- 2. 授予完整权限
GRANT ALL PRIVILEGES ON public.model_resources TO anon;
GRANT ALL PRIVILEGES ON public.model_resources TO authenticated;
GRANT ALL PRIVILEGES ON public.model_resources TO service_role;
GRANT ALL PRIVILEGES ON public.model_resources TO postgres;

-- 3. 同时确保其他必要表也有合适权限（如果需要）
ALTER TABLE public.models DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.brands DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.series DISABLE ROW LEVEL SECURITY;

GRANT ALL PRIVILEGES ON public.models TO anon;
GRANT ALL PRIVILEGES ON public.models TO authenticated;
GRANT ALL PRIVILEGES ON public.brands TO anon;
GRANT ALL PRIVILEGES ON public.brands TO authenticated;
GRANT ALL PRIVILEGES ON public.series TO anon;
GRANT ALL PRIVILEGES ON public.series TO authenticated;

-- ==========================================
-- 验证查询
-- ==========================================
SELECT
  tablename,
  rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('model_resources', 'models', 'brands', 'series')
ORDER BY tablename;

-- 检查权限信息
SELECT *
FROM information_schema.table_privileges
WHERE table_schema = 'public'
AND table_name IN ('model_resources', 'models', 'brands', 'series');
