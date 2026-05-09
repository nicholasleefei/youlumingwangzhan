-- 车型详情：补齐聚美“分组”字段（按聚美分组建列，字段类型统一用 JSONB，保持结构一致）

ALTER TABLE public.model_details
  ADD COLUMN IF NOT EXISTS isnev text,
  ADD COLUMN IF NOT EXISTS incarcharge jsonb,
  ADD COLUMN IF NOT EXISTS "4wdoffroad" jsonb,
  ADD COLUMN IF NOT EXISTS activesafety jsonb,
  ADD COLUMN IF NOT EXISTS drivingcontrol jsonb,
  ADD COLUMN IF NOT EXISTS wheelbrake jsonb,
  ADD COLUMN IF NOT EXISTS appearanceantitheft jsonb,
  ADD COLUMN IF NOT EXISTS color jsonb,
  ADD COLUMN IF NOT EXISTS screensystem jsonb,
  ADD COLUMN IF NOT EXISTS drivingfunction jsonb,
  ADD COLUMN IF NOT EXISTS intelligentconfig jsonb,
  ADD COLUMN IF NOT EXISTS externalrearmirror jsonb,
  ADD COLUMN IF NOT EXISTS drivinghardware jsonb,
  ADD COLUMN IF NOT EXISTS chassissteer jsonb,
  ADD COLUMN IF NOT EXISTS passivesafety jsonb,
  ADD COLUMN IF NOT EXISTS soundinteriorlight jsonb,
  ADD COLUMN IF NOT EXISTS exteriorlight jsonb,
  ADD COLUMN IF NOT EXISTS electricmotor jsonb,
  ADD COLUMN IF NOT EXISTS sunroofglass jsonb;

CREATE INDEX IF NOT EXISTS idx_model_details_incarcharge_gin ON public.model_details USING gin (incarcharge);
CREATE INDEX IF NOT EXISTS idx_model_details_4wdoffroad_gin ON public.model_details USING gin ("4wdoffroad");
CREATE INDEX IF NOT EXISTS idx_model_details_activesafety_gin ON public.model_details USING gin (activesafety);
CREATE INDEX IF NOT EXISTS idx_model_details_drivingcontrol_gin ON public.model_details USING gin (drivingcontrol);
CREATE INDEX IF NOT EXISTS idx_model_details_wheelbrake_gin ON public.model_details USING gin (wheelbrake);
CREATE INDEX IF NOT EXISTS idx_model_details_appearanceantitheft_gin ON public.model_details USING gin (appearanceantitheft);
CREATE INDEX IF NOT EXISTS idx_model_details_color_gin ON public.model_details USING gin (color);
CREATE INDEX IF NOT EXISTS idx_model_details_screensystem_gin ON public.model_details USING gin (screensystem);
CREATE INDEX IF NOT EXISTS idx_model_details_drivingfunction_gin ON public.model_details USING gin (drivingfunction);
CREATE INDEX IF NOT EXISTS idx_model_details_intelligentconfig_gin ON public.model_details USING gin (intelligentconfig);
CREATE INDEX IF NOT EXISTS idx_model_details_externalrearmirror_gin ON public.model_details USING gin (externalrearmirror);
CREATE INDEX IF NOT EXISTS idx_model_details_drivinghardware_gin ON public.model_details USING gin (drivinghardware);
CREATE INDEX IF NOT EXISTS idx_model_details_chassissteer_gin ON public.model_details USING gin (chassissteer);
CREATE INDEX IF NOT EXISTS idx_model_details_passivesafety_gin ON public.model_details USING gin (passivesafety);
CREATE INDEX IF NOT EXISTS idx_model_details_soundinteriorlight_gin ON public.model_details USING gin (soundinteriorlight);
CREATE INDEX IF NOT EXISTS idx_model_details_exteriorlight_gin ON public.model_details USING gin (exteriorlight);
CREATE INDEX IF NOT EXISTS idx_model_details_electricmotor_gin ON public.model_details USING gin (electricmotor);
CREATE INDEX IF NOT EXISTS idx_model_details_sunroofglass_gin ON public.model_details USING gin (sunroofglass);
