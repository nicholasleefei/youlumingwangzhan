-- ==========================================
-- Add series official images to series_vr_config
-- ==========================================

ALTER TABLE public.series_vr_config
ADD COLUMN IF NOT EXISTS official_images JSONB NOT NULL DEFAULT '[]'::jsonb;

