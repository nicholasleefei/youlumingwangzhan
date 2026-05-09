-- Fix RLS policy for series_vr_config to allow anon insert
DROP POLICY IF EXISTS "series_vr_config_insert_for_anon" ON public.series_vr_config;
CREATE POLICY "series_vr_config_insert_for_anon"
ON public.series_vr_config
FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "series_vr_config_update_for_anon" ON public.series_vr_config;
CREATE POLICY "series_vr_config_update_for_anon"
ON public.series_vr_config
FOR UPDATE TO anon USING (true) WITH CHECK (true);

-- Also fix model_image_config
DROP POLICY IF EXISTS "model_image_config_insert_for_anon" ON public.model_image_config;
CREATE POLICY "model_image_config_insert_for_anon"
ON public.model_image_config
FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "model_image_config_update_for_anon" ON public.model_image_config;
CREATE POLICY "model_image_config_update_for_anon"
ON public.model_image_config
FOR UPDATE TO anon USING (true) WITH CHECK (true);