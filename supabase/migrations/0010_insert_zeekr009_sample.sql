-- 插入极氪009示例数据
-- 参数来源: 极氪009公开参数

insert into public.models (
  slug, name, brand, vehicle_class, energy_type, year,
  fob_price_min, fob_price_max, currency,
  is_hot, is_active,
  manufacturer, level, cltc_range,
  charging_time_fast, charging_time_slow, fast_charge_percentage,
  motor_type, transmission, motor_horsepower, motor_total_power, motor_total_torque,
  body_type, length_mm, width_mm, height_mm, wheelbase_mm, max_speed, acceleration_0_100
) values (
  'zeekr-009',
  'ZEEKR 009',
  'ZEEKR',
  'MPV',
  'Pure Electric',
  2025,
  37990, 49990, 'USD',
  true, true,
  'Zeekr (Geely)',
  'Full-size Luxury MPV',
  702,
  '28 min', '5.5 h', 80,
  'Dual Motor AWD', 'Fixed Gear', 544, 400, 686,
  '5-door 6-seater MPV', 5209, 2024, 1848, 3205, 190, 8.3
)
on conflict (slug) do nothing;

-- 获取刚插入的model ID
with new_model as (
  select id from public.models where slug = 'zeekr-009'
)
-- 添加中文翻译
insert into public.model_translations (model_id, locale, name, summary, description)
select
  id,
  'zh-CN',
  '极氪009',
  '豪华纯电MPV，更大空间，更高配置',
  '极氪009是极氪品牌旗下豪华纯电MPV，采用一体式智驾设计，最大CLTC续航里程可达702公里，双电机全轮驱动，智能座舱搭配超大空间，适合商务接待与家庭出行。'
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
  'ZEEKR 009',
  'Luxury Pure Electric MPV, larger space, higher configuration',
  'The ZEEKR 009 is a luxury pure electric MPV from ZEEKR brand. It features integrated intelligent driving design, maximum CLTC range up to 702km, dual motor all-wheel drive, smart cockpit with huge space, perfect for business reception and family travel.'
from new_model
on conflict (model_id, locale) do update set
  name = excluded.name,
  summary = excluded.summary,
  description = excluded.description;

-- 添加示例图片
with new_model as (
  select id from public.models where slug = 'zeekr-009'
)
insert into public.model_images (model_id, path, alt, sort_order, is_cover)
select
  id,
  'https://images.unsplash.com/photo-1550745165-9bc0b25b32b6?w=1200&h=675&fit=crop',
  'ZEEKR 009 Front',
  1,
  true
from new_model
where not exists (
  select 1 from public.model_images where model_id = (select id from new_model) and sort_order = 1
);

with new_model as (
  select id from public.models where slug = 'zeekr-009'
)
insert into public.model_images (model_id, path, alt, sort_order, is_cover)
select
  id,
  'https://images.unsplash.com/photo-1520975954732-35dd22299614?w=1200&h=675&fit=crop',
  'ZEEKR 009 Side',
  2,
  false
from new_model
where not exists (
  select 1 from public.model_images where model_id = (select id from new_model) and sort_order = 2
);

with new_model as (
  select id from public.models where slug = 'zeekr-009'
)
insert into public.model_images (model_id, path, alt, sort_order, is_cover)
select
  id,
  'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=1200&h=675&fit=crop',
  'ZEEKR 009 Rear',
  3,
  false
from new_model
where not exists (
  select 1 from public.model_images where model_id = (select id from new_model) and sort_order = 3
);

with new_model as (
  select id from public.models where slug = 'zeekr-009'
)
insert into public.model_images (model_id, path, alt, sort_order, is_cover)
select
  id,
  'https://images.unsplash.com/photo-1503736334956-46256edb734a?w=1200&h=675&fit=crop',
  'ZEEKR 009 Interior',
  4,
  false
from new_model
where not exists (
  select 1 from public.model_images where model_id = (select id from new_model) and sort_order = 4
);
