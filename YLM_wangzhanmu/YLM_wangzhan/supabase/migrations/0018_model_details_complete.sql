-- ================================================
-- 车型详细信息表（完整版本 - 基于聚美智数API）
-- ================================================

-- ================================================
-- 1. 删除旧表并重建
-- ================================================
drop table if exists public.model_details cascade;

create table public.model_details (
  id uuid primary key default gen_random_uuid(),
  jm_id int unique not null,
  model_jm_id int not null,
  model_id uuid references public.models_jumdata(id) on delete cascade,
  series_jm_id int not null,
  series_id uuid references public.series(id) on delete cascade,
  brand_jm_id int not null,
  brand_id uuid references public.brands(id) on delete cascade,
  
  -- 基础信息 - 顶层字段
  name text not null,
  brandname text,
  parentname text,
  parentid int,
  groupid text,
  groupname text,
  environmentalstandards text,
  environmentalstandards2 text,
  displacement text,
  displacement2 text,
  drivemode text,
  drivemode2 int,
  sizetype text,
  price text,
  logo_url text,
  initial text,
  productionstate text,
  salestate text,
  yeartype text,
  listdate text,
  seatnum text,
  depth int not null,
  geartype text,
  geartype2 int,
  gearnum text,
  compartnum int,
  
  -- basic - 基本信息
  basic jsonb,
  "basic.price" text,
  "basic.saleprice" text,
  "basic.seatnum" text,
  "basic.mixfuelconsumption" text,
  "basic.comfuelconsumption" text,
  "basic.displacement" text,
  "basic.gearbox" text,
  "basic.geartype" text,
  "basic.gearnum" text,
  "basic.maxspeed" text,
  "basic.officialaccelerationtime100" text,
  "basic.warrantypolicy" text,
  
  -- body - 车体
  body jsonb,
  "body.color" text,
  "body.len" text,
  "body.width" text,
  "body.height" text,
  "body.weight" text,
  "body.fullweight" text,
  "body.mingroundclearance" text,
  "body.maxwadingdepth" text,
  "body.approachangle" text,
  "body.departureangle" text,
  "body.rampangle" text,
  "body.fronttrack" text,
  "body.reartrack" text,
  "body.wheelbase" text,
  "body.minturndiameter" text,
  "body.sportpackage" text,
  "body.roofluggagerack" text,
  "body.bodytype" text,
  "body.tooftype" text,
  "body.hoodtype" text,
  "body.doornum" text,
  "body.electricluggage" text,
  "body.luggagevolume" text,
  "body.luggageopenmode" text,
  "body.inductionluggage" text,
  "body.luggagemode" text,
  
  -- drivingauxiliary - 行车辅助
  drivingauxiliary jsonb,
  "drivingauxiliary.reverseimage" text,
  "drivingauxiliary.panoramiccamera" text,
  "drivingauxiliary.reversingradar" text,
  "drivingauxiliary.frontparkingradar" text,
  "drivingauxiliary.esp" text,
  "drivingauxiliary.eps" text,
  "drivingauxiliary.tractioncontrol" text,
  "drivingauxiliary.hillstartassist" text,
  "drivingauxiliary.remoteparking" text,
  "drivingauxiliary.activebraking" text,
  "drivingauxiliary.parallelaid" text,
  "drivingauxiliary.lanekeep" text,
  "drivingauxiliary.cruisecontrol" text,
  "drivingauxiliary.nightvisionsystem" text,
  "drivingauxiliary.autodriveassist" text,
  "drivingauxiliary.automaticparking" text,
  "drivingauxiliary.automaticparkingintoplace" text,
  "drivingauxiliary.integralactivesteering" text,
  "drivingauxiliary.blindspotdetection" text,
  "drivingauxiliary.fatiguereminder" text,
  "drivingauxiliary.ebd" text,
  "drivingauxiliary.brakeassist" text,
  "drivingauxiliary.ldws" text,
  "drivingauxiliary.hilldescent" text,
  "drivingauxiliary.drivemodechoose" text,
  "drivingauxiliary.gps" text,
  "drivingauxiliary.adaptivecruise" text,
  "drivingauxiliary.abs" text,
  "drivingauxiliary.variablesteering" text,
  
  -- engine - 发动机
  engine jsonb,
  "engine.displacement" text,
  "engine.displacementml" text,
  "engine.fueltype" text,
  "engine.fuelgrade" text,
  "engine.fueltankcapacity" text,
  "engine.environmentalstandards" text,
  "engine.fuelmethod" text,
  "engine.intakeform" text,
  "engine.model" text,
  "engine.position" text,
  "engine.maxhorsepower" text,
  "engine.compressionratio" text,
  "engine.integratedpower" text,
  "engine.maxtorque" text,
  "engine.maxtorquespeed" text,
  "engine.maxpower" text,
  "engine.maxpowerspeed" text,
  "engine.motorpower" text,
  "engine.frontmaxpower" text,
  "engine.rearmaxpower" text,
  "engine.modeleasyepc2" text,
  "engine.modelsohu" text,
  "engine.stroke" text,
  "engine.startstopsystem" text,
  "engine.nedcmaxmileage" text,
  "engine.cltcmaxmileage" text,
  "engine.cylinderarrangetype" text,
  "engine.cylinderheadmaterial" text,
  "engine.cylinderbodymaterial" text,
  "engine.bore" text,
  "engine.valvestructure" text,
  "engine.cylindernum" text,
  "engine.valvetrain" text,
  "engine.motornum" text,
  "engine.motorlayout" text,
  "engine.motortype" text,
  "engine.motormaxhorsepower" text,
  "engine.batterytype" text,
  "engine.batterybrand" text,
  "engine.motortorque" text,
  "engine.integratedtorque" text,
  "engine.frontmaxtorque" text,
  "engine.rearmaxtorque" text,
  "engine.batterycapacity" text,
  "engine.powerconsumption" text,
  "engine.maxmileage" text,
  "engine.batterywarranty" text,
  "engine.batteryfastchargetime" text,
  "engine.batteryslowchargetime" text,
  
  -- actualtest - 实际测试
  actualtest jsonb,
  "actualtest.accelerationtime100" text,
  
  -- gearbox - 变速箱
  gearbox jsonb,
  "gearbox.gearnum" text,
  "gearbox.geartype" text,
  "gearbox.gearbox" text,
  
  -- chassisbrake - 底盘制动
  chassisbrake jsonb,
  "chassisbrake.drivemode" text,
  "chassisbrake.chassis" text,
  "chassisbrake.bodystructure" text,
  "chassisbrake.powersteering" text,
  "chassisbrake.centerdifferentiallock" text,
  "chassisbrake.frontbraketype" text,
  "chassisbrake.rearbraketype" text,
  "chassisbrake.parkingbraketype" text,
  "chassisbrake.adjustablesuspension" text,
  "chassisbrake.airsuspension" text,
  "chassisbrake.frontsuspensiontype" text,
  "chassisbrake.rearsuspensiontype" text,
  
  -- aircondrefrigerator - 空调/冰箱
  aircondrefrigerator jsonb,
  "aircondrefrigerator.fronvairconditioning" text,
  "aircondrefrigerator.rearairconditioning" text,
  "aircondrefrigerator.reardischargeoutlet" text,
  "aircondrefrigerator.tempzonecontrol" text,
  "aircondrefrigerator.airconditioningcontrolmode" text,
  "aircondrefrigerator.carrefrigerator" text,
  "aircondrefrigerator.airpurifyingdevice" text,
  "aircondrefrigerator.fragrance" text,
  "aircondrefrigerator.airconditioning" text,
  
  -- wheel - 车轮
  wheel jsonb,
  "wheel.tirenum" text,
  "wheel.fronttiresize" text,
  "wheel.reartiresize" text,
  "wheel.hubmaterial" text,
  "wheel.sparetiretype" text,
  
  -- entcom - 娱乐通讯
  entcom jsonb,
  "entcom.fulllcddashboard" text,
  "entcom.consolelcdscreen" text,
  "entcom.lcdscreensize" text,
  "entcom.rearlcdscreen" text,
  "entcom.drivingrecorder" text,
  "entcom.huddisplay" text,
  "entcom.locationservice" text,
  "entcom.builinharddisk" text,
  "entcom.bluetooth" text,
  "entcom.4g" text,
  "entcom.cd" text,
  "entcom.dvd" text,
  "entcom.audiobrand" text,
  "entcom.speakernum" int,
  "entcom.externalaudiointerface" text,
  "entcom.phoneconnect" text,
  "entcom.wirelesscharge" text,
  "entcom.gesturecontrol" text,
  "entcom.cartv" text,
  "entcom.carapp" text,
  "entcom.voicecontrol" text,
  "entcom.roadrescue" text,
  
  -- doormirror - 门窗/后视镜
  doormirror jsonb,
  "doormirror.headlightfeature" text,
  "doormirror.autoheadlight" text,
  "doormirror.externalmirrorantiglare" text,
  "doormirror.externalmirrorfolding" text,
  "doormirror.externalmirroradjustment" text,
  "doormirror.externalmirrormemory" text,
  "doormirror.externalmirrorheating" text,
  "doormirror.externalmirrormedia" text,
  "doormirror.rearviewmirrormedia" text,
  "doormirror.rearviewmirrorantiglare" text,
  "doormirror.rearmirrorwithturnlamp" text,
  "doormirror.openstyle" text,
  "doormirror.electricpulldoor" text,
  "doormirror.electricsuctiondoor" text,
  "doormirror.electricslidingdoor" text,
  "doormirror.rearsidesunshade" text,
  "doormirror.rearwindowsunshade" text,
  "doormirror.privacyglass" text,
  "doormirror.uvinterceptingglass" text,
  "doormirror.sensingwiper" text,
  "doormirror.frontwiper" text,
  "doormirror.rearwiper" text,
  "doormirror.skylightstype" text,
  "doormirror.skylightopeningmode" text,
  "doormirror.electricwindow" text,
  "doormirror.frontelectricwindow" text,
  "doormirror.rearelectricwindow" text,
  "doormirror.antipinchwindow" text,
  "doormirror.sunvisormirror" text,
  "doormirror.roofrack" text,
  "doormirror.rearwing" text,
  
  -- seat - 座椅
  seat jsonb,
  "seat.frontseatfunction" text,
  "seat.rearseatfunction" text,
  "seat.seatheightadjustment" text,
  "seat.electricseatmemory" text,
  "seat.driverseatelectricadjustment" text,
  "seat.driverseatadjustmentmode" text,
  "seat.frontseatheadrestadjustment" text,
  "seat.driverseatshouldersupportadjustment" text,
  "seat.auxiliaryseatelectricadjustment" text,
  "seat.auxiliaryseatadjustmentmode" text,
  "seat.rearseatadjustmentmode" text,
  "seat.secondrowseatelectricadjustment" text,
  "seat.secondrowseatadjustment" text,
  "seat.sportseat" text,
  "seat.seatmaterial" text,
  "seat.driverseatlumbarsupportadjustment" text,
  "seat.childseatfixdevice" text,
  "seat.seatheating" text,
  "seat.seatventilation" text,
  "seat.seatmassage" text,
  "seat.rearseatreclineproportion" text,
  "seat.rearseatangleadjustment" text,
  "seat.thirdrowseat" text,
  "seat.frontseatcenterarmrest" text,
  "seat.rearseatcenterarmrest" text,
  
  -- internalconfig - 内部配置
  internalconfig jsonb,
  "internalconfig.interiorcolor" text,
  "internalconfig.interiormaterial" text,
  "internalconfig.steeringwheelmaterial" text,
  "internalconfig.steeringwheelmultifunction" text,
  "internalconfig.steeringwheelbeforeadjustment" text,
  "internalconfig.steeringwheelupadjustment" text,
  "internalconfig.steeringwheelheating" text,
  "internalconfig.steeringwheelmemory" text,
  "internalconfig.steeringwheeladjustmentmode" text,
  "internalconfig.steeringwheelshift" text,
  "internalconfig.rearcupholder" text,
  "internalconfig.supplyvoltage" text,
  "internalconfig.activenoisereduction" text,
  "internalconfig.computerscreen" text,
  
  -- light - 灯光
  light jsonb,
  "light.headlighttype" text,
  "light.optionalheadlighttype" text,
  "light.headlightilluminationadjustment" text,
  "light.headlightautomaticclean" text,
  "light.headlightdynamicsteering" text,
  "light.headlightautomaticopen" text,
  "light.headlightdelayoff" text,
  "light.daytimerunninglight" text,
  "light.leddaytimerunninglight" text,
  "light.ledtaillight" text,
  "light.lightsteeringassist" text,
  "light.headlightdimming" text,
  "light.frontfoglight" text,
  "light.interiorairlight" text,
  "light.readinglight" text,
  
  -- safe - 安全配置
  safe jsonb,
  "safe.airbagdrivingposition" text,
  "safe.airbagfrontpassenger" text,
  "safe.airbagfrontside" text,
  "safe.airbagfronthead" text,
  "safe.airbagrearside" text,
  "safe.rearcentralairbag" text,
  "safe.airbagrearhead" text,
  "safe.sideaircurtain" text,
  "safe.airbagknee" text,
  "safe.safetybeltprompt" text,
  "safe.seatbeltairbag" text,
  "safe.safetybeltlimiting" text,
  "safe.safetybeltpretightening" text,
  "safe.frontsafetybeltadjustment" text,
  "safe.rearsafetybelt" text,
  "safe.brakeassist" text,
  "safe.tirepressuremonitoring" text,
  "safe.zeropressurecontinued" text,
  "safe.keylessentry" text,
  "safe.keylessstart" text,
  "safe.childlock" text,
  "safe.smartkey" text,
  "safe.remotekey" text,
  "safe.remotecontrol" text,
  "safe.engineantitheft" text,
  "safe.centrallocking" text,
  
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_model_details_jm_id on public.model_details(jm_id);
create index if not exists idx_model_details_model_jm_id on public.model_details(model_jm_id);
create index if not exists idx_model_details_model_id on public.model_details(model_id);
create index if not exists idx_model_details_series_jm_id on public.model_details(series_jm_id);
create index if not exists idx_model_details_series_id on public.model_details(series_id);
create index if not exists idx_model_details_brand_jm_id on public.model_details(brand_jm_id);
create index if not exists idx_model_details_brand_id on public.model_details(brand_id);

-- ================================================
-- 2. 触发器：自动更新 updated_at
-- ================================================
drop trigger if exists trg_model_details_updated_at on public.model_details;
create trigger trg_model_details_updated_at
before update on public.model_details
for each row execute function public.set_updated_at();

-- ================================================
-- 3. 启用行级安全策略
-- ================================================
alter table public.model_details enable row level security;

-- ================================================
-- 4. RLS 策略
-- ================================================
drop policy if exists model_details_select_all on public.model_details;
create policy model_details_select_all
on public.model_details
for select
to anon
using (true);

drop policy if exists model_details_all_for_admin on public.model_details;
create policy model_details_all_for_admin
on public.model_details
for all
to authenticated
using (true)
with check (true);

-- ================================================
-- 5. 权限配置
-- ================================================
grant select on public.model_details to anon;
grant all privileges on public.model_details to authenticated;
