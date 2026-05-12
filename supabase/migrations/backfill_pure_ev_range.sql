-- Backfill pure EV range (CLTC) into model_details.raw

update public.model_details
set raw = jsonb_set(
  jsonb_set(
    coalesce(raw, '{}'::jsonb),
    '{electricmotor,cltcmaxmileage}',
    to_jsonb(substring(name from '(\d{2,4}(?:\.\d+)?)\s*(?:km|公里)')),
    true
  ),
  '{electricmotor,cltccomprehensivemileage}',
  to_jsonb(substring(name from '(\d{2,4}(?:\.\d+)?)\s*(?:km|公里)')),
  true
)
where activity_status = 0
  and coalesce(raw #>> '{engine,fueltype}', '') like '%纯电%'
  and substring(name from '(\d{2,4}(?:\.\d+)?)\s*(?:km|公里)') is not null
  and (
    nullif(btrim(coalesce(raw #>> '{electricmotor,cltcmaxmileage}', '')), '') is null
    or btrim(coalesce(raw #>> '{electricmotor,cltcmaxmileage}', '')) in ('-', '—')
    or nullif(btrim(coalesce(raw #>> '{electricmotor,cltccomprehensivemileage}', '')), '') is null
    or btrim(coalesce(raw #>> '{electricmotor,cltccomprehensivemileage}', '')) in ('-', '—')
  );

with calc as (
  select
    id,
    nullif(regexp_replace(coalesce(raw #>> '{electricmotor,batterycapacity}', ''), '[^0-9\.]', '', 'g'), '')::numeric as cap,
    nullif(regexp_replace(coalesce(raw #>> '{electricmotor,powerconsumption}', ''), '[^0-9\.]', '', 'g'), '')::numeric as cons
  from public.model_details
  where activity_status = 0
    and coalesce(raw #>> '{engine,fueltype}', '') like '%纯电%'
    and (
      nullif(btrim(coalesce(raw #>> '{electricmotor,cltcmaxmileage}', '')), '') is null
      or btrim(coalesce(raw #>> '{electricmotor,cltcmaxmileage}', '')) in ('-', '—')
      or nullif(btrim(coalesce(raw #>> '{electricmotor,cltccomprehensivemileage}', '')), '') is null
      or btrim(coalesce(raw #>> '{electricmotor,cltccomprehensivemileage}', '')) in ('-', '—')
    )
), est as (
  select
    id,
    round((cap * 100.0) / nullif(cons, 0))::int as km
  from calc
  where cap is not null and cons is not null and cons > 0
)
update public.model_details md
set raw = jsonb_set(
  jsonb_set(
    coalesce(md.raw, '{}'::jsonb),
    '{electricmotor,cltcmaxmileage}',
    to_jsonb(est.km::text),
    true
  ),
  '{electricmotor,cltccomprehensivemileage}',
  to_jsonb(est.km::text),
  true
)
from est
where md.id = est.id
  and est.km between 100 and 2000;

