-- 插入极氪007示例数据
-- 参数来源: https://www.zeekrlife.com/global/vehicles/007

insert into public.models (
  slug, name, brand, vehicle_class, energy_type, year,
  fob_price_min, fob_price_max, currency,
  is_hot, is_active,
  manufacturer, level, cltc_range,
  charging_time_fast, charging_time_slow, fast_charge_percentage,
  motor_type, transmission, motor_horsepower, motor_total_power, motor_total_torque,
  body_type, length_mm, width_mm, height_mm, wheelbase_mm, max_speed, acceleration_0_100
) values (
  'zeekr-007',
  'ZEEKR 007',
  'ZEEKR',
  'Sedan',
  'Pure Electric',
  2025,
  24990, 30990, 'USD',
  true, true,
  'Zeekr (Geely)',
  'Mid-size Sedan',
  688,
  '10 min', '35 min', 80,
  'Single Motor', 'Fixed Gear', 415, 310, 440,
  '4-door Sedan', 4865, 1901, 1459, 2920, 205, 5.6
)
on conflict (slug) do nothing;

-- 获取刚插入的model ID
with new_model as (
  select id from public.models where slug = 'zeekr-007'
)
-- 添加中文翻译
insert into public.model_translations (model_id, locale, name, summary, description)
select
  id,
  'zh-CN',
  '极氪007',
  '纯电中型轿车，颠覆设计，真智驾，真续航',
  '极氪007是极氪品牌旗下纯电中型轿车，采用一体式智驾设计，最大CLTC续航里程可达688公里，搭载骁龙8295智能座舱芯片，加速0-100km/h仅需5.6秒。'
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
  'ZEEKR 007',
  'Pure Electric Mid-size Sedan, revolutionary design, true autonomous driving, true range',
  'The ZEEKR 007 is a pure electric mid-size sedan from ZEEKR brand. It features integrated intelligent driving design, maximum CLTC range up to 688km, powered by Snapdragon 8295 cockpit chip, accelerates from 0-100km/h in just 5.6 seconds.'
from new_model
on conflict (model_id, locale) do update set
  name = excluded.name,
  summary = excluded.summary,
  description = excluded.description;

-- 添加示例图片（使用公开示例图片）
with new_model as (
  select id from public.models where slug = 'zeekr-007'
)
insert into public.model_images (model_id, path, alt, sort_order, is_cover)
select
  id,
  'https://images.unsplash.com/photo-1549399542-760feb95d450?w=1200&h=675&fit=crop',
  'ZEEKR 007 Front',
  1,
  true
from new_model
where not exists (
  select 1 from public.model_images where model_id = (select id from new_model) and sort_order = 1
);

with new_model as (
  select id from public.models where slug = 'zeekr-007'
)
insert into public.model_images (model_id, path, alt, sort_order, is_cover)
select
  id,
  'https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=675&fit=crop',
  'ZEEKR 007 Side',
  2,
  false
from new_model
where not exists (
  select 1 from public.model_images where model_id = (select id from new_model) and sort_order = 2
);

with new_model as (
  select id from public.models where slug = 'zeekr-007'
)
insert into public.model_images (model_id, path, alt, sort_order, is_cover)
select
  id,
  'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=675&fit=crop',
  'ZEEKR 007 Rear',
  3,
  false
from new_model
where not exists (
  select 1 from public.model_images where model_id = (select id from new_model) and sort_order = 3
);

with new_model as (
  select id from public.models where slug = 'zeekr-007'
)
insert into public.model_images (model_id, path, alt, sort_order, is_cover)
select
  id,
  'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=675&fit=crop',
  'ZEEKR 007 Interior',
  4,
  false
from new_model
where not exists (
  select 1 from public.model_images where model_id = (select id from new_model) and sort_order = 4
);
