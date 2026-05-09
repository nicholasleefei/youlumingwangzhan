CREATE TABLE IF NOT EXISTS public.hero_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_type TEXT NOT NULL CHECK (media_type IN ('image','video')),
  source TEXT NOT NULL CHECK (source IN ('upload','official')),
  external_url TEXT,
  storage_bucket TEXT,
  storage_path TEXT,
  title TEXT,
  alt_text TEXT,
  meta JSONB NOT NULL DEFAULT '{}'::jsonb,
  disabled BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hero_assets_created_at ON public.hero_assets(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_hero_assets_disabled ON public.hero_assets(disabled);

CREATE TABLE IF NOT EXISTS public.hero_publish_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_note TEXT,
  published_by UUID NOT NULL,
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  rollback_from_version_id UUID
);

CREATE INDEX IF NOT EXISTS idx_hero_publish_versions_published_at ON public.hero_publish_versions(published_at DESC);

CREATE TABLE IF NOT EXISTS public.hero_published_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  publish_version_id UUID NOT NULL,
  display_order INT NOT NULL,
  asset_id UUID NOT NULL,
  headline TEXT,
  subheadline TEXT,
  cta_text TEXT,
  cta_url TEXT,
  link_url TEXT,
  start_at TIMESTAMPTZ,
  end_at TIMESTAMPTZ,
  enabled BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_hero_published_slots_version_order ON public.hero_published_slots(publish_version_id, display_order);
CREATE INDEX IF NOT EXISTS idx_hero_published_slots_asset ON public.hero_published_slots(asset_id);

CREATE TABLE IF NOT EXISTS public.hero_runtime_state (
  id INT PRIMARY KEY DEFAULT 1,
  current_publish_version_id UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

INSERT INTO public.hero_runtime_state (id, current_publish_version_id)
VALUES (1, NULL)
ON CONFLICT (id) DO NOTHING;

CREATE TABLE IF NOT EXISTS public.hero_audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id UUID NOT NULL,
  action TEXT NOT NULL,
  target_type TEXT NOT NULL,
  target_id UUID,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_hero_audit_logs_created_at ON public.hero_audit_logs(created_at DESC);

ALTER TABLE public.hero_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_publish_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_published_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_runtime_state ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hero_audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage hero_assets" ON public.hero_assets;
CREATE POLICY "Admins manage hero_assets" ON public.hero_assets
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
);

DROP POLICY IF EXISTS "Public read hero_assets" ON public.hero_assets;
CREATE POLICY "Public read hero_assets" ON public.hero_assets
FOR SELECT
USING (
  disabled = FALSE
  AND EXISTS (
    SELECT 1
    FROM public.hero_runtime_state r
    JOIN public.hero_published_slots s
      ON s.publish_version_id = r.current_publish_version_id
    WHERE r.id = 1
      AND s.asset_id = hero_assets.id
      AND s.enabled = TRUE
      AND (s.start_at IS NULL OR s.start_at <= now())
      AND (s.end_at IS NULL OR s.end_at > now())
  )
);

DROP POLICY IF EXISTS "Admins manage hero_publish_versions" ON public.hero_publish_versions;
CREATE POLICY "Admins manage hero_publish_versions" ON public.hero_publish_versions
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
);

DROP POLICY IF EXISTS "Admins manage hero_published_slots" ON public.hero_published_slots;
CREATE POLICY "Admins manage hero_published_slots" ON public.hero_published_slots
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
);

DROP POLICY IF EXISTS "Public read hero_published_slots" ON public.hero_published_slots;
CREATE POLICY "Public read hero_published_slots" ON public.hero_published_slots
FOR SELECT
USING (
  enabled = TRUE
  AND publish_version_id = (
    SELECT current_publish_version_id
    FROM public.hero_runtime_state
    WHERE id = 1
    LIMIT 1
  )
  AND (start_at IS NULL OR start_at <= now())
  AND (end_at IS NULL OR end_at > now())
);

DROP POLICY IF EXISTS "Public read hero_runtime_state" ON public.hero_runtime_state;
CREATE POLICY "Public read hero_runtime_state" ON public.hero_runtime_state
FOR SELECT
USING (id = 1);

DROP POLICY IF EXISTS "Admins update hero_runtime_state" ON public.hero_runtime_state;
CREATE POLICY "Admins update hero_runtime_state" ON public.hero_runtime_state
FOR UPDATE
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
);

DROP POLICY IF EXISTS "Admins manage hero_audit_logs" ON public.hero_audit_logs;
CREATE POLICY "Admins manage hero_audit_logs" ON public.hero_audit_logs
FOR ALL
USING (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
);

DROP VIEW IF EXISTS public.hero_public_slots_view;
CREATE VIEW public.hero_public_slots_view WITH (security_invoker = true) AS
SELECT
  s.id AS slot_id,
  s.display_order,
  s.headline,
  s.subheadline,
  s.cta_text,
  s.cta_url,
  s.link_url,
  s.start_at,
  s.end_at,
  a.id AS asset_id,
  a.media_type,
  a.source,
  a.external_url,
  a.storage_bucket,
  a.storage_path,
  a.title,
  a.alt_text,
  a.meta
FROM public.hero_runtime_state r
JOIN public.hero_published_slots s
  ON s.publish_version_id = r.current_publish_version_id
JOIN public.hero_assets a
  ON a.id = s.asset_id
WHERE r.id = 1
  AND s.enabled = TRUE
  AND a.disabled = FALSE
  AND (s.start_at IS NULL OR s.start_at <= now())
  AND (s.end_at IS NULL OR s.end_at > now());

GRANT SELECT ON public.hero_public_slots_view TO anon;
GRANT SELECT ON public.hero_public_slots_view TO authenticated;

GRANT SELECT ON public.hero_runtime_state TO anon;
GRANT SELECT ON public.hero_published_slots TO anon;
GRANT SELECT ON public.hero_assets TO anon;

GRANT ALL PRIVILEGES ON public.hero_assets TO authenticated;
GRANT ALL PRIVILEGES ON public.hero_publish_versions TO authenticated;
GRANT ALL PRIVILEGES ON public.hero_published_slots TO authenticated;
GRANT ALL PRIVILEGES ON public.hero_runtime_state TO authenticated;
GRANT ALL PRIVILEGES ON public.hero_audit_logs TO authenticated;

INSERT INTO storage.buckets (id, name, public)
VALUES ('hero_assets', 'hero_assets', TRUE)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

CREATE POLICY "Public read hero_assets bucket" ON storage.objects
FOR SELECT
USING (bucket_id = 'hero_assets');

CREATE POLICY "Admins manage hero_assets bucket" ON storage.objects
FOR ALL
USING (
  bucket_id = 'hero_assets'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
)
WITH CHECK (
  bucket_id = 'hero_assets'
  AND EXISTS (
    SELECT 1
    FROM public.admin_users au
    WHERE au.id = auth.uid()
      AND au.is_approved = TRUE
  )
);
