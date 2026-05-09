-- ================================================
-- 完整的聚美数据字段迁移
-- 将API返回的306个字段全部添加到数据库
-- ================================================

-- ================================================
-- 1. 基础信息字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "basic_electricfuelconsumption" TEXT,
ADD COLUMN IF NOT EXISTS "basic_userfuelconsumption" TEXT,
ADD COLUMN IF NOT EXISTS "basic_firstownerwarrantypolicy" TEXT,
ADD COLUMN IF NOT EXISTS "basic_testaccelerationtime100" TEXT,
ADD COLUMN IF NOT EXISTS "basic_lowchargefuelconsumption" TEXT;

-- ================================================
-- 2. 车身信息字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "body_dragcoefficient" TEXT,
ADD COLUMN IF NOT EXISTS "body_fronttrunkvolume" TEXT,
ADD COLUMN IF NOT EXISTS "body_trunkpositionmemory" TEXT,
ADD COLUMN IF NOT EXISTS "body_minturndiameter" TEXT;

-- ================================================
-- 3. 发动机/电机字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "engine_modelvin17" TEXT,
ADD COLUMN IF NOT EXISTS "engine_batterybrand" TEXT,
ADD COLUMN IF NOT EXISTS "engine_motorlayout" TEXT,
ADD COLUMN IF NOT EXISTS "engine_motornum" TEXT,
ADD COLUMN IF NOT EXISTS "engine_valvestructure" TEXT,
ADD COLUMN IF NOT EXISTS "engine_cylinderbodymaterial" TEXT,
ADD COLUMN IF NOT EXISTS "engine_cylinderheadmaterial" TEXT,
ADD COLUMN IF NOT EXISTS "engine_cylinderarrangetype" TEXT,
ADD COLUMN IF NOT EXISTS "engine_nedcmaxmileage" TEXT,
ADD COLUMN IF NOT EXISTS "engine_cltccomprehensivemileage" TEXT,
ADD COLUMN IF NOT EXISTS "engine_startstopsystem" TEXT,
ADD COLUMN IF NOT EXISTS "engine_modelsohu" TEXT,
ADD COLUMN IF NOT EXISTS "engine_modeleasyepc2" TEXT,
ADD COLUMN IF NOT EXISTS "engine_frontmaxpower" TEXT,
ADD COLUMN IF NOT EXISTS "engine_frontmaxtorque" TEXT,
ADD COLUMN IF NOT EXISTS "engine_rearmaxpower" TEXT,
ADD COLUMN IF NOT EXISTS "engine_rearmaxtorque" TEXT,
ADD COLUMN IF NOT EXISTS "engine_integratedpower" TEXT,
ADD COLUMN IF NOT EXISTS "engine_compressionratio" TEXT,
ADD COLUMN IF NOT EXISTS "engine_maxpowerspeed" TEXT,
ADD COLUMN IF NOT EXISTS "engine_maxtorquespeed" TEXT,
ADD COLUMN IF NOT EXISTS "engine_position" TEXT,
ADD COLUMN IF NOT EXISTS "engine_intakeform" TEXT,
ADD COLUMN IF NOT EXISTS "engine_fuelmethod" TEXT,
ADD COLUMN IF NOT EXISTS "engine_environmentalstandards" TEXT,
ADD COLUMN IF NOT EXISTS "engine_fueltankcapacity" TEXT,
ADD COLUMN IF NOT EXISTS "engine_fuelgrade" TEXT,
ADD COLUMN IF NOT EXISTS "engine_fueltype" TEXT,
ADD COLUMN IF NOT EXISTS "engine_displacementml" TEXT,
ADD COLUMN IF NOT EXISTS "engine_cylindernum" TEXT,
ADD COLUMN IF NOT EXISTS "engine_bore" TEXT,
ADD COLUMN IF NOT EXISTS "engine_stroke" TEXT,
ADD COLUMN IF NOT EXISTS "engine_valvetrain" TEXT,
ADD COLUMN IF NOT EXISTS "engine_motortype" TEXT,
ADD COLUMN IF NOT EXISTS "engine_motormaxhorsepower" TEXT,
ADD COLUMN IF NOT EXISTS "engine_motorpower" TEXT,
ADD COLUMN IF NOT EXISTS "engine_motortorque" TEXT,
ADD COLUMN IF NOT EXISTS "engine_integratedtorque" TEXT,
ADD COLUMN IF NOT EXISTS "engine_batterycapacity" TEXT,
ADD COLUMN IF NOT EXISTS "engine_powerconsumption" TEXT,
ADD COLUMN IF NOT EXISTS "engine_maxmileage" TEXT,
ADD COLUMN IF NOT EXISTS "engine_batterywarranty" TEXT,
ADD COLUMN IF NOT EXISTS "engine_batteryfastchargetime" TEXT,
ADD COLUMN IF NOT EXISTS "engine_batteryslowchargetime" TEXT;

-- ================================================
-- 4. 车载充电字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "incarcharge_wirelesscharge" TEXT,
ADD COLUMN IF NOT EXISTS "incarcharge_chargingport" TEXT,
ADD COLUMN IF NOT EXISTS "incarcharge_usbnum" TEXT,
ADD COLUMN IF NOT EXISTS "incarcharge_powersupply" TEXT,
ADD COLUMN IF NOT EXISTS "incarcharge_luggagepowersocket" TEXT,
ADD COLUMN IF NOT EXISTS "incarcharge_usbmaxchargingpower" TEXT,
ADD COLUMN IF NOT EXISTS "incarcharge_phonewirelesschargingpower" TEXT;

-- ================================================
-- 5. 被动安全字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "passivesafety_childseatfixdevice" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_esp" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_tractioncontrol" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_dooropeningwarning" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_fatiguereminder" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_ebd" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_ldws" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_forwardcollisionwarning" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_activebraking" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_abs" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_lowspeedwarning" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_roadrescue" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_drivingrecorder" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_brakeassist" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_tirepressuremonitoring" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_safetybeltprompt" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_rearcollisionwarning" TEXT,
ADD COLUMN IF NOT EXISTS "passivesafety_sentrymode" TEXT;

-- ================================================
-- 6. 驾驶控制字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "drivingcontrol_automaticparking" TEXT,
ADD COLUMN IF NOT EXISTS "drivingcontrol_hillstartassist" TEXT,
ADD COLUMN IF NOT EXISTS "drivingcontrol_hilldescent" TEXT,
ADD COLUMN IF NOT EXISTS "drivingcontrol_airsuspension" TEXT,
ADD COLUMN IF NOT EXISTS "drivingcontrol_energyrecovery" TEXT,
ADD COLUMN IF NOT EXISTS "drivingcontrol_startstopsystem" TEXT,
ADD COLUMN IF NOT EXISTS "drivingcontrol_drivemodechoose" TEXT,
ADD COLUMN IF NOT EXISTS "drivingcontrol_adjustablesuspension" TEXT;

-- ================================================
-- 7. 车轮制动字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "wheelbrake_hubmaterial" TEXT,
ADD COLUMN IF NOT EXISTS "wheelbrake_parkingbraketype" TEXT,
ADD COLUMN IF NOT EXISTS "wheelbrake_reartiresize" TEXT,
ADD COLUMN IF NOT EXISTS "wheelbrake_fronttiresize" TEXT,
ADD COLUMN IF NOT EXISTS "wheelbrake_rearbraketype" TEXT,
ADD COLUMN IF NOT EXISTS "wheelbrake_fronttrack" TEXT,
ADD COLUMN IF NOT EXISTS "wheelbrake_frontbraketype" TEXT,
ADD COLUMN IF NOT EXISTS "wheelbrake_reartrack" TEXT,
ADD COLUMN IF NOT EXISTS "wheelbrake_sparetiretype" TEXT;

-- ================================================
-- 8. 外观防盗字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "appearanceantitheft_remotecontrol" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_roofluggagerack" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_hubmaterial" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_discharge" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_engineantitheft" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_electricluggage" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_trunkpositionmemory" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_batterypreheating" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_hiddendoorhandle" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_keylessentry" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_remotekey" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_centrallocking" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_electricpulldoor" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_sidepedal" TEXT,
ADD COLUMN IF NOT EXISTS "appearanceantitheft_activeclosedgrille" TEXT;

-- ================================================
-- 9. 颜色字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "color_color" TEXT,
ADD COLUMN IF NOT EXISTS "color_interiorcolor" TEXT;

-- ================================================
-- 10. 屏幕系统字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "screensystem_wakeupwordfree" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_lcdscreensize" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_seeandsay" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_carsystemstorage" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_assistantwakeupword" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_carintelligentchip" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_facialrecognition" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_voicecontrol" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_carsystemmemory" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_wakeupregion" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_intelligentsystem" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_continuousspeech" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_bluetooth" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_phoneconnect" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_consolelcdscreen" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_privacyshield" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_multifingerscreen" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_carapp" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_voiceprintrecognition" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_rearmultimediacontrol" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_passengerscreentype" TEXT,
ADD COLUMN IF NOT EXISTS "screensystem_entertainmentscreensize" TEXT;

-- ================================================
-- 11. 驾驶功能字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "drivingfunction_lanekeep" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_reversesidewarning" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_lanecentering" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_driverassistancelevel" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_mapbrand" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_roadtrafficsignrecog" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_cruisecontrol" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_automaticparkingintoplace" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_satellitenavigationsystem" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_parallelaid" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_navigationtrafficinfo" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_remotesummon" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_trackingreverse" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_trafficlightrecog" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_remoteparking" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_memoryparking" TEXT,
ADD COLUMN IF NOT EXISTS "drivingfunction_driverassistancesystem" TEXT;

-- ================================================
-- 12. 智能配置字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "intelligentconfig_appremote" TEXT,
ADD COLUMN IF NOT EXISTS "intelligentconfig_internetofvehicle" TEXT,
ADD COLUMN IF NOT EXISTS "intelligentconfig_wifi" TEXT,
ADD COLUMN IF NOT EXISTS "intelligentconfig_4g" TEXT,
ADD COLUMN IF NOT EXISTS "intelligentconfig_5g" TEXT,
ADD COLUMN IF NOT EXISTS "intelligentconfig_ota" TEXT,
ADD COLUMN IF NOT EXISTS "intelligentconfig_ktv" TEXT;

-- ================================================
-- 13. 外后视镜字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "externalrearmirror_foldinglockingcar" TEXT,
ADD COLUMN IF NOT EXISTS "externalrearmirror_electricfolding" TEXT,
ADD COLUMN IF NOT EXISTS "externalrearmirror_reversingtiltdown" TEXT,
ADD COLUMN IF NOT EXISTS "externalrearmirror_rearviewmirrormemory" TEXT,
ADD COLUMN IF NOT EXISTS "externalrearmirror_heatedrearviewmirror" TEXT;

-- ================================================
-- 14. 驾驶硬件字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "drivinghardware_reversingradar" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_frontparkingradar" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_millimeterwaveradarnum" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_camerasnum" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_ultrasonicradarsnum" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_reverseimage" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_lidarnum" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_lidarbrand" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_lidarlinenum" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_camerasnumincar" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_frontperceptioncamera" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_frontperceptioncamerapixel" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_surroundviewcamerapixel" TEXT,
ADD COLUMN IF NOT EXISTS "drivinghardware_transparentchassis" TEXT;

-- ================================================
-- 15. 底盘转向字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "chassissteer_rearsuspensiontype" TEXT,
ADD COLUMN IF NOT EXISTS "chassissteer_centerdifferentiallock" TEXT,
ADD COLUMN IF NOT EXISTS "chassissteer_frontbraketype" TEXT,
ADD COLUMN IF NOT EXISTS "chassissteer_fourwheeldrive" TEXT,
ADD COLUMN IF NOT EXISTS "chassissteer_powersteering" TEXT,
ADD COLUMN IF NOT EXISTS "chassissteer_parkingbraketype" TEXT,
ADD COLUMN IF NOT EXISTS "chassissteer_bodystructure" TEXT,
ADD COLUMN IF NOT EXISTS "chassissteer_rearbraketype" TEXT,
ADD COLUMN IF NOT EXISTS "chassissteer_frontsuspensiontype" TEXT,
ADD COLUMN IF NOT EXISTS "chassissteer_airsuspension" TEXT,
ADD COLUMN IF NOT EXISTS "chassissteer_adjustablesuspension" TEXT,
ADD COLUMN IF NOT EXISTS "chassissteer_chassis" TEXT;

-- ================================================
-- 16. 天窗玻璃字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "sunroofglass_sunvisormirror" TEXT,
ADD COLUMN IF NOT EXISTS "sunroofglass_antipinchwindow" TEXT,
ADD COLUMN IF NOT EXISTS "sunroofglass_onetouchwindowlifting" TEXT,
ADD COLUMN IF NOT EXISTS "sunroofglass_rearwindowsunshade" TEXT,
ADD COLUMN IF NOT EXISTS "sunroofglass_skylightopeningmode" TEXT,
ADD COLUMN IF NOT EXISTS "sunroofglass_sidewindowsoundproofglass" TEXT,
ADD COLUMN IF NOT EXISTS "sunroofglass_rearwiper" TEXT,
ADD COLUMN IF NOT EXISTS "sunroofglass_privacyglass" TEXT,
ADD COLUMN IF NOT EXISTS "sunroofglass_sensingwiper" TEXT;

-- ================================================
-- 17. 电机字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "electricmotor_frontmaxpower" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_motorpower" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_batterycapacity" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_motormaxhorsepower" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_frontmaxtorque" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_rearmaxtorque" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_batterybrand" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_motorlayout" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_motornum" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_motortype" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_motortorque" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_powerconsumption" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_batterytype" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_fastcharging" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_fastchargingpercent" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_threeelectricwarranty" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_wltcmaxmileage" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_rearmodel" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_rearbrand" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_frontmodel" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_frontbrand" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_batteryfastchargetime" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_highvoltagecharging" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_cltccomprehensivemileage" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_highvoltagefastcharging" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_externalacdischargepower" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_fastchargingportlocation" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_slowchargingportlocation" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_wltccomprehensivemileage" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_slowchargingpercent" TEXT,
ADD COLUMN IF NOT EXISTS "electricmotor_batteryenergydensity" TEXT;

-- ================================================
-- 18. 主动安全字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "activesafety_childseatfixdevice" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_esp" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_tractioncontrol" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_dooropeningwarning" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_fatiguereminder" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_ebd" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_ldws" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_forwardcollisionwarning" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_activebraking" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_abs" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_lowspeedwarning" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_roadrescue" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_drivingrecorder" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_brakeassist" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_tirepressuremonitoring" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_safetybeltprompt" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_rearcollisionwarning" TEXT,
ADD COLUMN IF NOT EXISTS "activesafety_sentrymode" TEXT;

-- ================================================
-- 19. 音响内饰灯字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "soundinteriorlight_audiobrand" TEXT,
ADD COLUMN IF NOT EXISTS "soundinteriorlight_interiorairlight" TEXT,
ADD COLUMN IF NOT EXISTS "soundinteriorlight_speakernum" TEXT,
ADD COLUMN IF NOT EXISTS "soundinteriorlight_readinglight" TEXT,
ADD COLUMN IF NOT EXISTS "soundinteriorlight_activeinteriorairlight" TEXT;

-- ================================================
-- 20. 外部灯光字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "exteriorlight_daytimerunninglight" TEXT,
ADD COLUMN IF NOT EXISTS "exteriorlight_adaptivehighandlowbeam" TEXT,
ADD COLUMN IF NOT EXISTS "exteriorlight_headlightautomaticopen" TEXT,
ADD COLUMN IF NOT EXISTS "exteriorlight_lowbeamtype" TEXT,
ADD COLUMN IF NOT EXISTS "exteriorlight_headlighttype" TEXT,
ADD COLUMN IF NOT EXISTS "exteriorlight_lightfeature" TEXT,
ADD COLUMN IF NOT EXISTS "exteriorlight_headlightdelayoff" TEXT,
ADD COLUMN IF NOT EXISTS "exteriorlight_adjustableheadlight" TEXT,
ADD COLUMN IF NOT EXISTS "exteriorlight_frontfoglight" TEXT;

-- ================================================
-- 21. 座椅字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "seat_secondrowseatadjustment" TEXT,
ADD COLUMN IF NOT EXISTS "seat_sportseat" TEXT,
ADD COLUMN IF NOT EXISTS "seat_seatmaterial" TEXT,
ADD COLUMN IF NOT EXISTS "seat_driverseatlumbarsupportadjustment" TEXT,
ADD COLUMN IF NOT EXISTS "seat_childseatfixdevice" TEXT,
ADD COLUMN IF NOT EXISTS "seat_seatmassage" TEXT,
ADD COLUMN IF NOT EXISTS "seat_rearseatreclineproportion" TEXT,
ADD COLUMN IF NOT EXISTS "seat_rearseatangleadjustment" TEXT,
ADD COLUMN IF NOT EXISTS "seat_thirdrowseat" TEXT,
ADD COLUMN IF NOT EXISTS "seat_frontseatcenterarmrest" TEXT,
ADD COLUMN IF NOT EXISTS "seat_rearseatcenterarmrest" TEXT,
ADD COLUMN IF NOT EXISTS "seat_seatadjustablebutton" TEXT,
ADD COLUMN IF NOT EXISTS "seat_seatrecliningmethod" TEXT,
ADD COLUMN IF NOT EXISTS "seat_secondrowseatfunctions" TEXT;

-- ================================================
-- 22. 特色配置字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "featuredconfig_configname" TEXT,
ADD COLUMN IF NOT EXISTS "featuredconfig_configcontent" TEXT;

-- ================================================
-- 23. 四驱越野字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "4wdoffroad_towhook" TEXT;

-- ================================================
-- 24. 变速箱字段
-- ================================================
ALTER TABLE public.model_details 
ADD COLUMN IF NOT EXISTS "gearbox_fourwheeldrive" TEXT,
ADD COLUMN IF NOT EXISTS "gearbox_gearshifting" TEXT;

-- ================================================
-- 25. 数据完整性视图
-- ================================================
CREATE OR REPLACE VIEW public.model_details_field_check AS
SELECT 
    id,
    jm_id,
    name,
    (SELECT count(*) FROM information_schema.columns 
     WHERE table_name = 'model_details' AND column_name LIKE '%_%') as total_flat_fields,
    created_at,
    updated_at
FROM public.model_details;

-- ================================================
-- 26. 更新完成后的注释
-- ================================================
COMMENT ON TABLE public.model_details IS '聚美车型详情表 - 包含完整的306个字段';
