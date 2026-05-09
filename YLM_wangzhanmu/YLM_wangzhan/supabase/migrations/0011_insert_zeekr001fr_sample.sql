-- 插入极氪001 FR示例数据
-- 参数来源: 极氪官网

insert into public.models (
  slug, name, brand, vehicle_class, energy_type, year,
  fob_price_min, fob_price_max, currency,
  is_hot, is_active,
  manufacturer, level, cltc_range,
  charging_time_fast, charging_time_slow, fast_charge_percentage,
  motor_type, transmission, motor_horsepower, motor_total_power, motor_total_torque,
  body_type, length_mm, width_mm, height_mm, wheelbase_mm, max_speed, acceleration_0_100
) values (
  'zeekr-001-fr',
  'ZEEKR 001 FR',
  'ZEEKR',
  'Shooting Brake',
  'Pure Electric',
  2025,
  49990, 58990, 'USD',
  true, true,
  'Zeekr (Geely)',
  'Pure Electric Shooting Brake',
  630,
  '30 min', 'unknown', 80,
  'Quad Motor AWD',
  'Fixed Gear',
  1265,
  900,
  1280,
  '5-door Shooting Brake',
  5209,
  1999,
  1548,
  3110,
  250,
  2.36
)
on conflict (slug) do nothing;

-- 获取刚插入的model ID
with new_model as (
  select id from public.models where slug = 'zeekr-001-fr'
)
-- 添加中文翻译
insert into public.model_translations (model_id, locale, name, summary, description)
select
  id,
  'zh-CN',
  '极氪001 FR',
  '纯电猎装超跑',
  '极氪001 FR是极氪品牌旗下纯电猎装超跑，搭载四电机驱动，百公里加速仅需2.36秒，赛道级操控体验带来极致驾驶乐趣。'
from new_model
on conflict (model_id, locale) do update set
  name = excluded.name,
  summary = excluded.summary,
  description = excluded.description;

-- 添加英文翻译
insert into public.model_translations (model_id, locale, name, summary, description)
select
  id,
  'en',
  'ZEEKR 001 FR',
  'Pure Electric Shooting Brake',
  'The ZEEKR 001 FR is a pure electric shooting brake from ZEEKR brand. Featuring quad-motor drive, 0-100km/h acceleration in just 2.36 seconds, track-level handling brings extreme driving fun.'
from new_model
on conflict (model_id, locale) do update set
  name = excluded.name,
  summary = excluded.summary,
  description = excluded.description;

-- 添加示例图片
with new_model as (
  select id from public.models where slug = 'zeekr-001-fr'
)
insert into public.model_images (model_id, path, alt, sort_order, is_cover)
select
  id,
  'https://files.zeekr.com.cn/www2/images/zt/2023/08/zeekr-001-fr-1.jpg',
  'ZEEKR 001 FR',
  1,
  true
from new_model
where not exists (
  select 1 from public.model_images where model_id = (select id from new_model) and sort_order = 1
);

with new_model as (
  select id from public.models where slug = 'zeekr-001-fr'
)
insert into public.model_images (model_id, path, alt, sort_order, is_cover)
select
  id,
  'https://files.zeekr.com.cn/www2/images/zt/2023/08/zeekr-001-fr-2.jpg',
  'ZEEKR 001 FR Side',
  2,
  false
from new_model
where not exists (
  select 1 from public.model_images where model_id = (select id from new_model) and sort_order = 2
);

with new_model as (
  select id from public.models where slug = 'zeekr-001-fr'
)
insert into public.model_images (model_id, path, alt, sort_order, is_cover)
select
  id,
  'https://files.zeekr.com.cn/www2/images/zt/2023/08/zeekr-001-fr-3.jpg',
  'ZEEKR 001 FR Interior',
  3,
  false
from new_model
where not exists (
  select 1 from public.model_images where model_id = (select id from new_model) and sort_order = 3
);
