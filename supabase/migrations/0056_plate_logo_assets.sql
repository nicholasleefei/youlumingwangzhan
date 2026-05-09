-- ==========================================
-- Plate logo assets library (for plate replacement)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.plate_logo_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  storage_bucket TEXT NOT NULL DEFAULT 'vehicle_resources',
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_plate_logo_assets_created_at ON public.plate_logo_assets(created_at DESC);

ALTER TABLE public.plate_logo_assets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plate_logo_assets_select_for_anon" ON public.plate_logo_assets;
CREATE POLICY "plate_logo_assets_select_for_anon"
ON public.plate_logo_assets
FOR SELECT
TO anon
USING (true);

DROP POLICY IF EXISTS "plate_logo_assets_all_for_admin" ON public.plate_logo_assets;
CREATE POLICY "plate_logo_assets_all_for_admin"
ON public.plate_logo_assets
FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

GRANT SELECT ON public.plate_logo_assets TO anon;
GRANT ALL PRIVILEGES ON public.plate_logo_assets TO authenticated;

