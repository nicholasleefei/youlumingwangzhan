-- ================================================
-- 车型详细信息表（扁平化结构，英文字段名）
-- ================================================

-- ================================================
-- 1. 车型详细信息基础表（扁平化）
-- ================================================
create table if not exists public.model_details_flat (
  id uuid primary key default gen_random_uuid(),
  jm_id int unique not null,
  model_jm_id int not null,
  model_id uuid references public.models_jumdata(id) on delete cascade,
  series_jm_id int not null,
  series_id uuid references public.series(id) on delete cascade,
  brand_jm_id int not null,
  brand_id uuid references public.brands(id) on delete cascade,
  
  -- 基础信息
  name text,
  brand_name text,
  series_name text,
  series_jm_id_ref int,
  group_id text,
  group_name text,
  environmental_standard text,
  environmental_standard_num text,
  displacement text,
  displacement_num text,
  drive_mode text,
  drive_mode_num int,
  size_type text,
  price text,
  logo_url text,
  initial text,
  production_state text,
  sale_state text,
  year_type text,
  list_date text,
  seat_num text,
  depth int,
  gear_type text,
  gear_type_num int,
  gear_num text,
  compartment_num int,
  
  -- basic_info
  basic_info_price text,
  basic_info_sale_price text,
  basic_info_seat_num text,
  basic_info_mix_fuel_consumption text,
  basic_info_com_fuel_consumption text,
  basic_info_displacement text,
  basic_info_gearbox text,
  basic_info_gear_type text,
  basic_info_gear_num text,
  basic_info_max_speed text,
  basic_info_official_acceleration_100 text,
  basic_info_warranty_policy text,
  
  -- body_info
  body_info_color text,
  body_info_length text,
  body_info_width text,
  body_info_height text,
  body_info_weight text,
  body_info_full_weight text,
  body_info_min_ground_clearance text,
  body_info_max_wading_depth text,
  body_info_approach_angle text,
  body_info_departure_angle text,
  body_info_ramp_angle text,
  body_info_front_track text,
  body_info_rear_track text,
  body_info_wheelbase text,
  body_info_min_turn_diameter text,
  body_info_sport_package text,
  body_info_roof_luggage_rack text,
  body_info_body_type text,
  body_info_toof_type text,
  body_info_hood_type text,
  body_info_door_num text,
  body_info_electric_luggage text,
  body_info_luggage_volume text,
  body_info_luggage_open_mode text,
  body_info_induction_luggage text,
  body_info_luggage_mode text,
  
  -- driving_auxiliary
  driving_auxiliary_reverse_image text,
  driving_auxiliary_panoramic_camera text,
  driving_auxiliary_reversing_radar text,
  driving_auxiliary_front_parking_radar text,
  driving_auxiliary_esp text,
  driving_auxiliary_eps text,
  driving_auxiliary_traction_control text,
  driving_auxiliary_hill_start_assist text,
  driving_auxiliary_remote_parking text,
  driving_auxiliary_active_braking text,
  driving_auxiliary_parallel_aid text,
  driving_auxiliary_lane_keep text,
  driving_auxiliary_cruise_control text,
  driving_auxiliary_night_vision_system text,
  driving_auxiliary_auto_drive_assist text,
  driving_auxiliary_automatic_parking text,
  driving_auxiliary_automatic_parking_into_place text,
  driving_auxiliary_integral_active_steering text,
  driving_auxiliary_blind_spot_detection text,
  driving_auxiliary_fatigue_reminder text,
  driving_auxiliary_ebd text,
  driving_auxiliary_brake_assist text,
  driving_auxiliary_ldws text,
  driving_auxiliary_hill_descent text,
  driving_auxiliary_drive_mode_choose text,
  driving_auxiliary_gps text,
  driving_auxiliary_adaptive_cruise text,
  driving_auxiliary_abs text,
  driving_auxiliary_variable_steering text,
  
  -- engine_info
  engine_info_displacement text,
  engine_info_displacement_ml text,
  engine_info_fuel_type text,
  engine_info_fuel_grade text,
  engine_info_fuel_tank_capacity text,
  engine_info_environmental_standards text,
  engine_info_fuel_method text,
  engine_info_intake_form text,
  engine_info_model text,
  engine_info_position text,
  engine_info_max_horsepower text,
  engine_info_compression_ratio text,
  engine_info_integrated_power text,
  engine_info_max_torque text,
  engine_info_max_torque_speed text,
  engine_info_max_power text,
  engine_info_max_power_speed text,
  engine_info_motor_power text,
  engine_info_front_max_power text,
  engine_info_rear_max_power text,
  engine_info_model_easy_epc_2 text,
  engine_info_model_sohu text,
  engine_info_stroke text,
  engine_info_start_stop_system text,
  engine_info_nedc_max_mileage text,
  engine_info_cltc_max_mileage text,
  engine_info_cylinder_arrange_type text,
  engine_info_cylinder_head_material text,
  engine_info_cylinder_body_material text,
  engine_info_bore text,
  engine_info_valve_structure text,
  engine_info_cylinder_num text,
  engine_info_valve_train text,
  engine_info_motor_num text,
  engine_info_motor_layout text,
  engine_info_motor_type text,
  engine_info_motor_max_horsepower text,
  engine_info_battery_type text,
  engine_info_battery_brand text,
  engine_info_motor_torque text,
  engine_info_integrated_torque text,
  engine_info_front_max_torque text,
  engine_info_rear_max_torque text,
  engine_info_battery_capacity text,
  engine_info_power_consumption text,
  engine_info_max_mileage text,
  engine_info_battery_warranty text,
  engine_info_battery_fast_charge_time text,
  engine_info_battery_slow_charge_time text,
  
  -- actual_test
  actual_test_acceleration_time_100 text,
  
  -- gearbox_info
  gearbox_info_gear_num text,
  gearbox_info_gear_type text,
  gearbox_info_gearbox_desc text,
  
  -- chassis_brake
  chassis_brake_drive_mode text,
  chassis_brake_chassis text,
  chassis_brake_body_structure text,
  chassis_brake_power_steering text,
  chassis_brake_center_differential_lock text,
  chassis_brake_front_brake_type text,
  chassis_brake_rear_brake_type text,
  chassis_brake_parking_brake_type text,
  chassis_brake_adjustable_suspension text,
  chassis_brake_air_suspension text,
  chassis_brake_front_suspension_type text,
  chassis_brake_rear_suspension_type text,
  
  -- aircond_refrigerator
  aircond_refrigerator_front_air_conditioning text,
  aircond_refrigerator_rear_air_conditioning text,
  aircond_refrigerator_rear_discharge_outlet text,
  aircond_refrigerator_temp_zone_control text,
  aircond_refrigerator_air_conditioning_control_mode text,
  aircond_refrigerator_car_refrigerator text,
  aircond_refrigerator_air_purifying_device text,
  aircond_refrigerator_fragrance text,
  aircond_refrigerator_air_conditioning text,
  
  -- wheel_info
  wheel_info_tire_num text,
  wheel_info_front_tire_size text,
  wheel_info_rear_tire_size text,
  wheel_info_hub_material text,
  wheel_info_spare_tire_type text,
  
  -- entertainment_communication
  entcom_full_lcd_dashboard text,
  entcom_console_lcd_screen text,
  entcom_lcd_screen_size text,
  entcom_rear_lcd_screen text,
  entcom_driving_recorder text,
  entcom_hud_display text,
  entcom_location_service text,
  entcom_builtin_hard_disk text,
  entcom_bluetooth text,
  entcom_4g text,
  entcom_cd text,
  entcom_dvd text,
  entcom_audio_brand text,
  entcom_speaker_num int,
  entcom_external_audio_interface text,
  entcom_phone_connect text,
  entcom_wireless_charge text,
  entcom_gesture_control text,
  entcom_car_tv text,
  entcom_car_app text,
  entcom_voice_control text,
  entcom_road_rescue text,
  
  -- door_mirror
  door_mirror_headlight_feature text,
  door_mirror_auto_headlight text,
  door_mirror_external_mirror_antiglare text,
  door_mirror_external_mirror_folding text,
  door_mirror_external_mirror_adjustment text,
  door_mirror_external_mirror_memory text,
  door_mirror_external_mirror_heating text,
  door_mirror_external_mirror_media text,
  door_mirror_rearview_mirror_media text,
  door_mirror_rearview_mirror_antiglare text,
  door_mirror_rear_mirror_with_turn_lamp text,
  door_mirror_open_style text,
  door_mirror_electric_pull_door text,
  door_mirror_electric_suction_door text,
  door_mirror_electric_sliding_door text,
  door_mirror_rear_side_sunshade text,
  door_mirror_rear_window_sunshade text,
  door_mirror_privacy_glass text,
  door_mirror_uv_intercepting_glass text,
  door_mirror_sensing_wiper text,
  door_mirror_front_wiper text,
  door_mirror_rear_wiper text,
  door_mirror_skylights_type text,
  door_mirror_skylight_opening_mode text,
  door_mirror_electric_window text,
  door_mirror_front_electric_window text,
  door_mirror_rear_electric_window text,
  door_mirror_antipinch_window text,
  door_mirror_sunvisor_mirror text,
  door_mirror_roof_rack text,
  door_mirror_rear_wing text,
  
  -- seat_info
  seat_info_front_seat_function text,
  seat_info_rear_seat_function text,
  seat_info_seat_height_adjustment text,
  seat_info_electric_seat_memory text,
  seat_info_driver_seat_electric_adjustment text,
  seat_info_driver_seat_adjustment_mode text,
  seat_info_front_seat_headrest_adjustment text,
  seat_info_driver_seat_shoulder_support_adjustment text,
  seat_info_auxiliary_seat_electric_adjustment text,
  seat_info_auxiliary_seat_adjustment_mode text,
  seat_info_rear_seat_adjustment_mode text,
  seat_info_second_row_seat_electric_adjustment text,
  seat_info_second_row_seat_adjustment text,
  seat_info_sport_seat text,
  seat_info_seat_material text,
  seat_info_driver_seat_lumbar_support_adjustment text,
  seat_info_child_seat_fix_device text,
  seat_info_seat_heating text,
  seat_info_seat_ventilation text,
  seat_info_seat_massage text,
  seat_info_rear_seat_recline_proportion text,
  seat_info_rear_seat_angle_adjustment text,
  seat_info_third_row_seat text,
  seat_info_front_seat_center_armrest text,
  seat_info_rear_seat_center_armrest text,
  
  -- internal_config
  internal_config_interior_color text,
  internal_config_interior_material text,
  internal_config_steering_wheel_material text,
  internal_config_steering_wheel_multifunction text,
  internal_config_steering_wheel_before_adjustment text,
  internal_config_steering_wheel_up_adjustment text,
  internal_config_steering_wheel_heating text,
  internal_config_steering_wheel_memory text,
  internal_config_steering_wheel_adjustment_mode text,
  internal_config_steering_wheel_shift text,
  internal_config_rear_cup_holder text,
  internal_config_supply_voltage text,
  internal_config_active_noise_reduction text,
  internal_config_computer_screen text,
  
  -- light_info
  light_info_headlight_type text,
  light_info_optional_headlight_type text,
  light_info_headlight_illumination_adjustment text,
  light_info_headlight_automatic_clean text,
  light_info_headlight_dynamic_steering text,
  light_info_headlight_automatic_open text,
  light_info_headlight_delay_off text,
  light_info_daytime_running_light text,
  light_info_led_daytime_running_light text,
  light_info_led_tail_light text,
  light_info_light_steering_assist text,
  light_info_headlight_dimming text,
  light_info_front_fog_light text,
  light_info_interior_air_light text,
  light_info_reading_light text,
  
  -- safety_info
  safety_info_airbag_driving_position text,
  safety_info_airbag_front_passenger text,
  safety_info_airbag_front_side text,
  safety_info_airbag_front_head text,
  safety_info_airbag_rear_side text,
  safety_info_rear_central_airbag text,
  safety_info_airbag_rear_head text,
  safety_info_side_air_curtain text,
  safety_info_airbag_knee text,
  safety_info_safety_belt_prompt text,
  safety_info_seatbelt_airbag text,
  safety_info_safety_belt_limiting text,
  safety_info_safety_belt_pretightening text,
  safety_info_front_safety_belt_adjustment text,
  safety_info_rear_safety_belt text,
  safety_info_brake_assist text,
  safety_info_tire_pressure_monitoring text,
  safety_info_zero_pressure_continued text,
  safety_info_keyless_entry text,
  safety_info_keyless_start text,
  safety_info_child_lock text,
  safety_info_smart_key text,
  safety_info_remote_key text,
  safety_info_remote_control text,
  safety_info_engine_antitheft text,
  safety_info_central_locking text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_model_details_flat_jm_id on public.model_details_flat(jm_id);
create index if not exists idx_model_details_flat_model_jm_id on public.model_details_flat(model_jm_id);
create index if not exists idx_model_details_flat_model_id on public.model_details_flat(model_id);
create index if not exists idx_model_details_flat_series_jm_id on public.model_details_flat(series_jm_id);
create index if not exists idx_model_details_flat_series_id on public.model_details_flat(series_id);
create index if not exists idx_model_details_flat_brand_jm_id on public.model_details_flat(brand_jm_id);
create index if not exists idx_model_details_flat_brand_id on public.model_details_flat(brand_id);

-- ================================================
-- 2. 触发器：自动更新 updated_at
-- ================================================
drop trigger if exists trg_model_details_flat_updated_at on public.model_details_flat;
create trigger trg_model_details_flat_updated_at
before update on public.model_details_flat
for each row execute function public.set_updated_at();

-- ================================================
-- 3. 启用行级安全策略
-- ================================================
alter table public.model_details_flat enable row level security;

-- ================================================
-- 4. RLS 策略
-- ================================================
drop policy if exists model_details_flat_select_all on public.model_details_flat;
create policy model_details_flat_select_all
on public.model_details_flat
for select
to anon
using (true);

drop policy if exists model_details_flat_all_for_admin on public.model_details_flat;
create policy model_details_flat_all_for_admin
on public.model_details_flat
for all
to authenticated
using (true)
with check (true);

-- ================================================
-- 5. 权限配置
-- ================================================
grant select on public.model_details_flat to anon;
grant all privileges on public.model_details_flat to authenticated;
