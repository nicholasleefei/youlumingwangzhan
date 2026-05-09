ALTER TABLE public.model_details
ADD COLUMN IF NOT EXISTS hot_sale boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_model_details_hot_sale_true
ON public.model_details (updated_at DESC)
WHERE hot_sale = true;
