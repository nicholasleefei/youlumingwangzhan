-- 规则：销售状态（salestate）不是“在销”时，默认将 activity_status 设为“不显示”(1)
-- 默认计算：activity_status_manual = false 时自动计算；管理员手动调整时将 activity_status_manual 置为 true

-- 1) 为三张表增加“手动覆盖”开关
ALTER TABLE public.series
  ADD COLUMN IF NOT EXISTS activity_status_manual boolean NOT NULL DEFAULT false;

ALTER TABLE public.models_jumdata
  ADD COLUMN IF NOT EXISTS activity_status_manual boolean NOT NULL DEFAULT false;

ALTER TABLE public.model_details
  ADD COLUMN IF NOT EXISTS activity_status_manual boolean NOT NULL DEFAULT false;

-- 2) 计算函数：在销 -> 0(正常)；非在销 -> 1(不显示)
CREATE OR REPLACE FUNCTION public.compute_activity_status_from_salestate(salestate text)
RETURNS integer
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE WHEN COALESCE($1, '') = '在销' THEN 0 ELSE 1 END;
$$;

-- 3) 触发器函数：仅在未手动覆盖时写入默认 activity_status
CREATE OR REPLACE FUNCTION public.trg_set_activity_status_from_salestate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(NEW.activity_status_manual, false) = false THEN
    NEW.activity_status := public.compute_activity_status_from_salestate(NEW.salestate);
  END IF;
  RETURN NEW;
END;
$$;

-- 4) 为三张表挂载触发器
DROP TRIGGER IF EXISTS set_activity_status_from_salestate ON public.series;
CREATE TRIGGER set_activity_status_from_salestate
BEFORE INSERT OR UPDATE OF salestate, activity_status_manual
ON public.series
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_activity_status_from_salestate();

DROP TRIGGER IF EXISTS set_activity_status_from_salestate ON public.models_jumdata;
CREATE TRIGGER set_activity_status_from_salestate
BEFORE INSERT OR UPDATE OF salestate, activity_status_manual
ON public.models_jumdata
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_activity_status_from_salestate();

DROP TRIGGER IF EXISTS set_activity_status_from_salestate ON public.model_details;
CREATE TRIGGER set_activity_status_from_salestate
BEFORE INSERT OR UPDATE OF salestate, activity_status_manual
ON public.model_details
FOR EACH ROW
EXECUTE FUNCTION public.trg_set_activity_status_from_salestate();

-- 5) 回填历史数据：仅对未手动覆盖的数据生效
UPDATE public.series
SET activity_status = public.compute_activity_status_from_salestate(salestate)
WHERE activity_status_manual = false;

UPDATE public.models_jumdata
SET activity_status = public.compute_activity_status_from_salestate(salestate)
WHERE activity_status_manual = false;

UPDATE public.model_details
SET activity_status = public.compute_activity_status_from_salestate(salestate)
WHERE activity_status_manual = false;
