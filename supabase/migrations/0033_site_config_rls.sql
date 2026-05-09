-- 为 site_config 表启用 RLS
ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "site_config_select_for_anon" ON public.site_config;
DROP POLICY IF EXISTS "site_config_all_for_admin" ON public.site_config;

-- 创建策略：匿名用户可以读取
CREATE POLICY "site_config_select_for_anon"
ON public.site_config
FOR SELECT
TO anon
USING (true);

-- 管理员可以操作所有数据
CREATE POLICY "site_config_all_for_admin"
ON public.site_config
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- 确保权限正确
GRANT SELECT ON public.site_config TO anon;
GRANT ALL PRIVILEGES ON public.site_config TO authenticated;
