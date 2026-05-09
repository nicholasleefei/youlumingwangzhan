-- ==========================================
-- 创建 model_resources 表
-- ==========================================

-- 创建 model_resources 表
CREATE TABLE IF NOT EXISTS public.model_resources (
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

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_model_resources_model_id ON public.model_resources(model_id);
CREATE INDEX IF NOT EXISTS idx_model_resources_model_jm_id ON public.model_resources(model_jm_id);
CREATE INDEX IF NOT EXISTS idx_model_resources_resource_type ON public.model_resources(resource_type);
CREATE INDEX IF NOT EXISTS idx_model_resources_activity_status ON public.model_resources(activity_status);

-- 创建 updated_at 触发器
DROP TRIGGER IF EXISTS trg_model_resources_updated_at ON public.model_resources;
CREATE TRIGGER trg_model_resources_updated_at
BEFORE UPDATE ON public.model_resources
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ==========================================
-- RLS 策略
-- ==========================================

-- 启用 RLS
ALTER TABLE public.model_resources ENABLE ROW LEVEL SECURITY;

-- 匿名用户读取策略：只能读取 activity_status = 0 的记录，且关联的车型也必须可访问
DROP POLICY IF EXISTS "model_resources_select_active_for_anon" ON public.model_resources;
CREATE POLICY "model_resources_select_active_for_anon"
ON public.model_resources
FOR SELECT
TO anon
USING (
  activity_status = 0 AND
  EXISTS (
    SELECT 1 FROM public.models m
    WHERE m.id = model_resources.model_id
    AND m.activity_status = 0
    AND m.is_active = true
  )
);

-- 已认证用户（管理员）完全访问
DROP POLICY IF EXISTS "model_resources_all_for_admin" ON public.model_resources;
CREATE POLICY "model_resources_all_for_admin"
ON public.model_resources
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ==========================================
-- 权限授予
-- ==========================================

GRANT SELECT ON public.model_resources TO anon;
GRANT ALL PRIVILEGES ON public.model_resources TO authenticated;

-- ==========================================
-- 创建 RPC 函数：create_model_resources_table
-- （用于向后兼容，实际表已经通过上面的 SQL 创建）
-- ==========================================

DROP FUNCTION IF EXISTS public.create_model_resources_table();
CREATE OR REPLACE FUNCTION public.create_model_resources_table()
RETURNS VOID AS $$
BEGIN
  -- 这个函数现在是一个空操作，因为表已经通过迁移创建了
  -- 保留它是为了向后兼容代码中可能的调用
  RAISE NOTICE 'model_resources table already exists';
END;
$$ LANGUAGE plpgsql;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION public.create_model_resources_table() TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_model_resources_table() TO anon;

-- ==========================================
-- 创建 RPC 函数：get_model_resources
-- 方便按车型和资源类型获取资源
-- ==========================================

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
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION public.get_model_resources(INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_model_resources(INTEGER) TO anon;
