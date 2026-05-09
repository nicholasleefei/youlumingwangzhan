ALTER TABLE public.model_details
  ADD COLUMN IF NOT EXISTS raw jsonb;

CREATE INDEX IF NOT EXISTS idx_model_details_raw_gin
  ON public.model_details
  USING gin (raw);
