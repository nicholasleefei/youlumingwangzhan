/**
 * 聚美数据完整迁移工具
 * 确保所有API返回的字段都能正确映射到数据库
 */

// 完整的字段映射配置
export const JUMDATA_FIELD_MAPPING: Record<string, string> = {
  // 基础顶层字段
  'id': 'jm_id',
  'name': 'name',
  'brandname': 'brandname',
  'parentname': 'parentname',
  'parentid': 'parentid',
  'groupid': 'groupid',
  'groupname': 'groupname',
  'environmentalstandards': 'environmentalstandards',
  'environmentalstandards2': 'environmentalstandards2',
  'displacement': 'displacement',
  'displacement2': 'displacement2',
  'drivemode': 'drivemode',
  'drivemode2': 'drivemode2',
  'sizetype': 'sizetype',
  'price': 'price',
  'logo': 'logo_url',
  'initial': 'initial',
  'productionstate': 'productionstate',
  'salestate': 'salestate',
  'yeartype': 'yeartype',
  'listdate': 'listdate',
  'seatnum': 'seatnum',
  'depth': 'depth',
  'geartype': 'geartype',
  'geartype2': 'geartype2',
  'gearnum': 'gearnum',
  'compartnum': 'compartnum',
  'isnev': 'isnev',
  'color': 'color_data',
  'optionalpackage': 'optionalpackage',
  'featuredconfig': 'featuredconfig',

  // Basic 基础信息
  'basic.price': 'basic_price',
  'basic.saleprice': 'basic_saleprice',
  'basic.seatnum': 'basic_seatnum',
  'basic.mixfuelconsumption': 'basic_mixfuelconsumption',
  'basic.comfuelconsumption': 'basic_comfuelconsumption',
  'basic.displacement': 'basic_displacement',
  'basic.gearbox': 'basic_gearbox',
  'basic.geartype': 'basic_geartype',
  'basic.gearnum': 'basic_gearnum',
  'basic.maxspeed': 'basic_maxspeed',
  'basic.officialaccelerationtime100': 'basic_officialaccelerationtime100',
  'basic.warrantypolicy': 'basic_warrantypolicy',
  'basic.electricfuelconsumption': 'basic_electricfuelconsumption',
  'basic.userfuelconsumption': 'basic_userfuelconsumption',
  'basic.firstownerwarrantypolicy': 'basic_firstownerwarrantypolicy',
  'basic.testaccelerationtime100': 'basic_testaccelerationtime100',
  'basic.lowchargefuelconsumption': 'basic_lowchargefuelconsumption',

  // Body 车身信息
  'body.color': 'body_color',
  'body.len': 'body_len',
  'body.width': 'body_width',
  'body.height': 'body_height',
  'body.weight': 'body_weight',
  'body.fullweight': 'body_fullweight',
  'body.mingroundclearance': 'body_mingroundclearance',
  'body.maxwadingdepth': 'body_maxwadingdepth',
  'body.approachangle': 'body_approachangle',
  'body.departureangle': 'body_departureangle',
  'body.rampangle': 'body_rampangle',
  'body.fronttrack': 'body_fronttrack',
  'body.reartrack': 'body_reartrack',
  'body.wheelbase': 'body_wheelbase',
  'body.minturndiameter': 'body_minturndiameter',
  'body.sportpackage': 'body_sportpackage',
  'body.roofluggagerack': 'body_roofluggagerack',
  'body.bodytype': 'body_bodytype',
  'body.tooftype': 'body_tooftype',
  'body.hoodtype': 'body_hoodtype',
  'body.doornum': 'body_doornum',
  'body.electricluggage': 'body_electricluggage',
  'body.luggagevolume': 'body_luggagevolume',
  'body.luggageopenmode': 'body_luggageopenmode',
  'body.inductionluggage': 'body_inductionluggage',
  'body.luggagemode': 'body_luggagemode',
  'body.dragcoefficient': 'body_dragcoefficient',
  'body.fronttrunkvolume': 'body_fronttrunkvolume',
  'body.trunkpositionmemory': 'body_trunkpositionmemory',

  // Driving Auxiliary 驾驶辅助
  'drivingauxiliary.reverseimage': 'drivingauxiliary_reverseimage',
  'drivingauxiliary.panoramiccamera': 'drivingauxiliary_panoramiccamera',
  'drivingauxiliary.reversingradar': 'drivingauxiliary_reversingradar',
  'drivingauxiliary.frontparkingradar': 'drivingauxiliary_frontparkingradar',
  'drivingauxiliary.esp': 'drivingauxiliary_esp',
  'drivingauxiliary.eps': 'drivingauxiliary_eps',
  'drivingauxiliary.tractioncontrol': 'drivingauxiliary_tractioncontrol',
  'drivingauxiliary.hillstartassist': 'drivingauxiliary_hillstartassist',
  'drivingauxiliary.remoteparking': 'drivingauxiliary_remoteparking',
  'drivingauxiliary.activebraking': 'drivingauxiliary_activebraking',
  'drivingauxiliary.parallelaid': 'drivingauxiliary_parallelaid',
  'drivingauxiliary.lanekeep': 'drivingauxiliary_lanekeep',
  'drivingauxiliary.cruisecontrol': 'drivingauxiliary_cruisecontrol',
  'drivingauxiliary.nightvisionsystem': 'drivingauxiliary_nightvisionsystem',
  'drivingauxiliary.autodriveassist': 'drivingauxiliary_autodriveassist',
  'drivingauxiliary.automaticparking': 'drivingauxiliary_automaticparking',
  'drivingauxiliary.automaticparkingintoplace': 'drivingauxiliary_automaticparkingintoplace',
  'drivingauxiliary.integralactivesteering': 'drivingauxiliary_integralactivesteering',
  'drivingauxiliary.blindspotdetection': 'drivingauxiliary_blindspotdetection',
  'drivingauxiliary.fatiguereminder': 'drivingauxiliary_fatiguereminder',
  'drivingauxiliary.ebd': 'drivingauxiliary_ebd',
  'drivingauxiliary.brakeassist': 'drivingauxiliary_brakeassist',
  'drivingauxiliary.ldws': 'drivingauxiliary_ldws',
  'drivingauxiliary.hilldescent': 'drivingauxiliary_hilldescent',
  'drivingauxiliary.drivemodechoose': 'drivingauxiliary_drivemodechoose',
  'drivingauxiliary.gps': 'drivingauxiliary_gps',
  'drivingauxiliary.adaptivecruise': 'drivingauxiliary_adaptivecruise',
  'drivingauxiliary.abs': 'drivingauxiliary_abs',
  'drivingauxiliary.variablesteering': 'drivingauxiliary_variablesteering',

  // Engine 发动机
  'engine.displacement': 'engine_displacement',
  'engine.displacementml': 'engine_displacementml',
  'engine.fueltype': 'engine_fueltype',
  'engine.fuelgrade': 'engine_fuelgrade',
  'engine.fueltankcapacity': 'engine_fueltankcapacity',
  'engine.environmentalstandards': 'engine_environmentalstandards',
  'engine.fuelmethod': 'engine_fuelmethod',
  'engine.intakeform': 'engine_intakeform',
  'engine.model': 'engine_model',
  'engine.position': 'engine_position',
  'engine.maxhorsepower': 'engine_maxhorsepower',
  'engine.compressionratio': 'engine_compressionratio',
  'engine.integratedpower': 'engine_integratedpower',
  'engine.maxtorque': 'engine_maxtorque',
  'engine.maxtorquespeed': 'engine_maxtorquespeed',
  'engine.maxpower': 'engine_maxpower',
  'engine.maxpowerspeed': 'engine_maxpowerspeed',
  'engine.motorpower': 'engine_motorpower',
  'engine.frontmaxpower': 'engine_frontmaxpower',
  'engine.rearmaxpower': 'engine_rearmaxpower',
  'engine.modeleasyepc2': 'engine_modeleasyepc2',
  'engine.modelsohu': 'engine_modelsohu',
  'engine.stroke': 'engine_stroke',
  'engine.startstopsystem': 'engine_startstopsystem',
  'engine.nedcmaxmileage': 'engine_nedcmaxmileage',
  'engine.cltcmaxmileage': 'engine_cltcmaxmileage',
  'engine.cylinderarrangetype': 'engine_cylinderarrangetype',
  'engine.cylinderheadmaterial': 'engine_cylinderheadmaterial',
  'engine.cylinderbodymaterial': 'engine_cylinderbodymaterial',
  'engine.bore': 'engine_bore',
  'engine.valvestructure': 'engine_valvestructure',
  'engine.cylindernum': 'engine_cylindernum',
  'engine.valvetrain': 'engine_valvetrain',
  'engine.motornum': 'engine_motornum',
  'engine.motorlayout': 'engine_motorlayout',
  'engine.motortype': 'engine_motortype',
  'engine.motormaxhorsepower': 'engine_motormaxhorsepower',
  'engine.batterytype': 'engine_batterytype',
  'engine.batterybrand': 'engine_batterybrand',
  'engine.motortorque': 'engine_motortorque',
  'engine.integratedtorque': 'engine_integratedtorque',
  'engine.frontmaxtorque': 'engine_frontmaxtorque',
  'engine.rearmaxtorque': 'engine_rearmaxtorque',
  'engine.batterycapacity': 'engine_batterycapacity',
  'engine.powerconsumption': 'engine_powerconsumption',
  'engine.maxmileage': 'engine_maxmileage',
  'engine.batterywarranty': 'engine_batterywarranty',
  'engine.batteryfastchargetime': 'engine_batteryfastchargetime',
  'engine.batteryslowchargetime': 'engine_batteryslowchargetime',
  'engine.modelvin17': 'engine_modelvin17',

  // Actual Test 实际测试
  'actualtest.accelerationtime100': 'actualtest_accelerationtime100',

  // Gearbox 变速箱
  'gearbox.gearnum': 'gearbox_gearnum',
  'gearbox.geartype': 'gearbox_geartype',
  'gearbox.gearbox': 'gearbox_gearbox',

  // Chassis Brake 底盘制动
  'chassisbrake.drivemode': 'chassisbrake_drivemode',
  'chassisbrake.chassis': 'chassisbrake_chassis',
  'chassisbrake.bodystructure': 'chassisbrake_bodystructure',
  'chassisbrake.powersteering': 'chassisbrake_powersteering',
  'chassisbrake.centerdifferentiallock': 'chassisbrake_centerdifferentiallock',
  'chassisbrake.frontbraketype': 'chassisbrake_frontbraketype',
  'chassisbrake.rearbraketype': 'chassisbrake_rearbraketype',
  'chassisbrake.parkingbraketype': 'chassisbrake_parkingbraketype',
  'chassisbrake.adjustablesuspension': 'chassisbrake_adjustablesuspension',
  'chassisbrake.airsuspension': 'chassisbrake_airsuspension',
  'chassisbrake.frontsuspensiontype': 'chassisbrake_frontsuspensiontype',
  'chassisbrake.rearsuspensiontype': 'chassisbrake_rearsuspensiontype',
  'chassisbrake.fourwdoffroad': 'chassisbrake_fourwdoffroad',
  'chassisbrake.chassisqixiubao': 'chassisbrake_chassisqixiubao',

  // Aircond Refrigerator 空调冰箱
  'aircondrefrigerator.frontairconditioning': 'aircondrefrigerator_frontairconditioning',
  'aircondrefrigerator.rearairconditioning': 'aircondrefrigerator_rearairconditioning',
  'aircondrefrigerator.reardischargeoutlet': 'aircondrefrigerator_reardischargeoutlet',
  'aircondrefrigerator.tempzonecontrol': 'aircondrefrigerator_tempzonecontrol',
  'aircondrefrigerator.airconditioningcontrolmode': 'aircondrefrigerator_airconditioningcontrolmode',
  'aircondrefrigerator.carrefrigerator': 'aircondrefrigerator_carrefrigerator',
  'aircondrefrigerator.airpurifyingdevice': 'aircondrefrigerator_airpurifyingdevice',
  'aircondrefrigerator.fragrance': 'aircondrefrigerator_fragrance',
  'aircondrefrigerator.airconditioning': 'aircondrefrigerator_airconditioning',

  // Wheel 车轮
  'wheel.tirenum': 'wheel_tirenum',
  'wheel.fronttiresize': 'wheel_fronttiresize',
  'wheel.reartiresize': 'wheel_reartiresize',
  'wheel.hubmaterial': 'wheel_hubmaterial',
  'wheel.sparetiretype': 'wheel_sparetiretype',

  // Entcom 娱乐通讯
  'entcom.fulllcddashboard': 'entcom_fulllcddashboard',
  'entcom.consolelcdscreen': 'entcom_consolelcdscreen',
  'entcom.lcdscreensize': 'entcom_lcdscreensize',
  'entcom.rearlcdscreen': 'entcom_rearlcdscreen',
  'entcom.drivingrecorder': 'entcom_drivingrecorder',
  'entcom.huddisplay': 'entcom_huddisplay',
  'entcom.locationservice': 'entcom_locationservice',
  'entcom.builtinharddisk': 'entcom_builtinharddisk',
  'entcom.bluetooth': 'entcom_bluetooth',
  'entcom.4g': 'entcom_4g',
  'entcom.cd': 'entcom_cd',
  'entcom.dvd': 'entcom_dvd',
  'entcom.audiobrand': 'entcom_audiobrand',
  'entcom.speakernum': 'entcom_speakernum',
  'entcom.externalaudiointerface': 'entcom_externalaudiointerface',
  'entcom.phoneconnect': 'entcom_phoneconnect',
  'entcom.wirelesscharge': 'entcom_wirelesscharge',
  'entcom.powersupply': 'entcom_powersupply',
  'entcom.luggagepowersocket': 'entcom_luggagepowersocket',
  'entcom.usbnum': 'entcom_usbnum',
  'entcom.gesturecontrol': 'entcom_gesturecontrol',
  'entcom.cartv': 'entcom_cartv',
  'entcom.carapp': 'entcom_carapp',
  'entcom.voicecontrol': 'entcom_voicecontrol',
  'entcom.roadrescue': 'entcom_roadrescue',

  // Doormirror 门窗后视镜
  'doormirror.headlightfeature': 'doormirror_headlightfeature',
  'doormirror.autoheadlight': 'doormirror_autoheadlight',
  'doormirror.externalmirrorantiglare': 'doormirror_externalmirrorantiglare',
  'doormirror.externalmirrorfolding': 'doormirror_externalmirrorfolding',
  'doormirror.externalmirroradjustment': 'doormirror_externalmirroradjustment',
  'doormirror.externalmirrormemory': 'doormirror_externalmirrormemory',
  'doormirror.externalmirrorheating': 'doormirror_externalmirrorheating',
  'doormirror.externalmirrormedia': 'doormirror_externalmirrormedia',
  'doormirror.rearviewmirrormedia': 'doormirror_rearviewmirrormedia',
  'doormirror.rearviewmirrorantiglare': 'doormirror_rearviewmirrorantiglare',
  'doormirror.rearmirrorwithturnlamp': 'doormirror_rearmirrorwithturnlamp',
  'doormirror.openstyle': 'doormirror_openstyle',
  'doormirror.electricpulldoor': 'doormirror_electricpulldoor',
  'doormirror.electricsuctiondoor': 'doormirror_electricsuctiondoor',
  'doormirror.electricslidingdoor': 'doormirror_electricslidingdoor',
  'doormirror.rearsidesunshade': 'doormirror_rearsidesunshade',
  'doormirror.rearwindowsunshade': 'doormirror_rearwindowsunshade',
  'doormirror.privacyglass': 'doormirror_privacyglass',
  'doormirror.uvinterceptingglass': 'doormirror_uvinterceptingglass',
  'doormirror.sensingwiper': 'doormirror_sensingwiper',
  'doormirror.skylightstype': 'doormirror_skylightstype',
  'doormirror.skylightopeningmode': 'doormirror_skylightopeningmode',
  'doormirror.electricwindow': 'doormirror_electricwindow',
  'doormirror.frontelectricwindow': 'doormirror_frontelectricwindow',
  'doormirror.rearelectricwindow': 'doormirror_rearelectricwindow',
  'doormirror.antipinchwindow': 'doormirror_antipinchwindow',
  'doormirror.sunvisormirror': 'doormirror_sunvisormirror',
  'doormirror.roofrack': 'doormirror_roofrack',
  'doormirror.rearwing': 'doormirror_rearwing',

  // Seat 座椅
  'seat.frontseatfunction': 'seat_frontseatfunction',
  'seat.rearseatfunction': 'seat_rearseatfunction',
  'seat.seatheightadjustment': 'seat_seatheightadjustment',
  'seat.electricseatmemory': 'seat_electricseatmemory',
  'seat.driverseatelectricadjustment': 'seat_driverseatelectricadjustment',
  'seat.driverseatadjustmentmode': 'seat_driverseatadjustmentmode',
  'seat.frontseatheadrestadjustment': 'seat_frontseatheadrestadjustment',
  'seat.driverseatshouldersupportadjustment': 'seat_driverseatshouldersupportadjustment',
  'seat.auxiliaryseatelectricadjustment': 'seat_auxiliaryseatelectricadjustment',
  'seat.auxiliaryseatadjustmentmode': 'seat_auxiliaryseatadjustmentmode',
  'seat.rearseatadjustmentmode': 'seat_rearseatadjustmentmode',
  'seat.secondrowseatelectricadjustment': 'seat_secondrowseatelectricadjustment',
  'seat.secondrowseatadjustment': 'seat_secondrowseatadjustment',
  'seat.sportseat': 'seat_sportseat',
  'seat.seatmaterial': 'seat_seatmaterial',
  'seat.driverseatlumbarsupportadjustment': 'seat_driverseatlumbarsupportadjustment',
  'seat.childseatfixdevice': 'seat_childseatfixdevice',
  'seat.seatheating': 'seat_seatheating',
  'seat.seatventilation': 'seat_seatventilation',
  'seat.seatmassage': 'seat_seatmassage',
  'seat.rearseatreclineproportion': 'seat_rearseatreclineproportion',
  'seat.rearseatangleadjustment': 'seat_rearseatangleadjustment',
  'seat.thirdrowseat': 'seat_thirdrowseat',
  'seat.frontseatcenterarmrest': 'seat_frontseatcenterarmrest',
  'seat.rearseatcenterarmrest': 'seat_rearseatcenterarmrest',
  'seat.seatadjustablebutton': 'seat_seatadjustablebutton',
  'seat.seatrecliningmethod': 'seat_seatrecliningmethod',
  'seat.secondrowseatfunctions': 'seat_secondrowseatfunctions',

  // Internal Config 内部配置
  'internalconfig.interiorcolor': 'internalconfig_interiorcolor',
  'internalconfig.interiormaterial': 'internalconfig_interiormaterial',
  'internalconfig.steeringwheelmaterial': 'internalconfig_steeringwheelmaterial',
  'internalconfig.steeringwheelmultifunction': 'internalconfig_steeringwheelmultifunction',
  'internalconfig.steeringwheelbeforeadjustment': 'internalconfig_steeringwheelbeforeadjustment',
  'internalconfig.steeringwheelupadjustment': 'internalconfig_steeringwheelupadjustment',
  'internalconfig.steeringwheelheating': 'internalconfig_steeringwheelheating',
  'internalconfig.steeringwheelmemory': 'internalconfig_steeringwheelmemory',
  'internalconfig.steeringwheeladjustmentmode': 'internalconfig_steeringwheeladjustmentmode',
  'internalconfig.steeringwheelshift': 'internalconfig_steeringwheelshift',
  'internalconfig.rearcupholder': 'internalconfig_rearcupholder',
  'internalconfig.supplyvoltage': 'internalconfig_supplyvoltage',
  'internalconfig.activenoisereduction': 'internalconfig_activenoisereduction',
  'internalconfig.computerscreen': 'internalconfig_computerscreen',

  // Light 灯光
  'light.headlighttype': 'light_headlighttype',
  'light.optionalheadlighttype': 'light_optionalheadlighttype',
  'light.headlightilluminationadjustment': 'light_headlightilluminationadjustment',
  'light.headlightautomaticclean': 'light_headlightautomaticclean',
  'light.headlightdynamicsteering': 'light_headlightdynamicsteering',
  'light.headlightautomaticopen': 'light_headlightautomaticopen',
  'light.headlightdelayoff': 'light_headlightdelayoff',
  'light.daytimerunninglight': 'light_daytimerunninglight',
  'light.leddaytimerunninglight': 'light_leddaytimerunninglight',
  'light.ledtaillight': 'light_ledtaillight',
  'light.lightsteeringassist': 'light_lightsteeringassist',
  'light.headlightdimming': 'light_headlightdimming',
  'light.frontfoglight': 'light_frontfoglight',
  'light.interiorairlight': 'light_interiorairlight',
  'light.readinglight': 'light_readinglight',
  'light.adjustableheadlight': 'light_adjustableheadlight',
  'light.lowbeamtype': 'light_lowbeamtype',

  // Safe 安全
  'safe.airbagdrivingposition': 'safe_airbagdrivingposition',
  'safe.airbagfrontpassenger': 'safe_airbagfrontpassenger',
  'safe.airbagfrontside': 'safe_airbagfrontside',
  'safe.airbagfronthead': 'safe_airbagfronthead',
  'safe.airbagrearside': 'safe_airbagrearside',
  'safe.rearcentralairbag': 'safe_rearcentralairbag',
  'safe.airbagrearhead': 'safe_airbagrearhead',
  'safe.sideaircurtain': 'safe_sideaircurtain',
  'safe.airbagknee': 'safe_airbagknee',
  'safe.safetybeltprompt': 'safe_safetybeltprompt',
  'safe.seatbeltairbag': 'safe_seatbeltairbag',
  'safe.safetybeltlimiting': 'safe_safetybeltlimiting',
  'safe.safetybeltpretightening': 'safe_safetybeltpretightening',
  'safe.frontsafetybeltadjustment': 'safe_frontsafetybeltadjustment',
  'safe.rearsafetybelt': 'safe_rearsafetybelt',
  'safe.brakeassist': 'safe_brakeassist',
  'safe.tirepressuremonitoring': 'safe_tirepressuremonitoring',
  'safe.zeropressurecontinued': 'safe_zeropressurecontinued',
  'safe.keylessentry': 'safe_keylessentry',
  'safe.keylessstart': 'safe_keylessstart',
  'safe.childlock': 'safe_childlock',
  'safe.smartkey': 'safe_smartkey',
  'safe.remotekey': 'safe_remotekey',
  'safe.remotecontrol': 'safe_remotecontrol',
  'safe.engineantitheft': 'safe_engineantitheft',
  'safe.centrallocking': 'safe_centrallocking',

  // In-Car Charge 车载充电
  'incarcharge.wirelesscharge': 'incarcharge_wirelesscharge',
  'incarcharge.chargingport': 'incarcharge_chargingport',
  'incarcharge.usbnum': 'incarcharge_usbnum',
  'incarcharge.powersupply': 'incarcharge_powersupply',
  'incarcharge.luggagepowersocket': 'incarcharge_luggagepowersocket',

  // Passive Safety 被动安全
  'passivesafety.childseatfixdevice': 'passivesafety_childseatfixdevice',
  'passivesafety.esp': 'passivesafety_esp',
  'passivesafety.tractioncontrol': 'passivesafety_tractioncontrol',
  'passivesafety.dooropeningwarning': 'passivesafety_dooropeningwarning',
  'passivesafety.fatiguereminder': 'passivesafety_fatiguereminder',
  'passivesafety.ebd': 'passivesafety_ebd',
  'passivesafety.ldws': 'passivesafety_ldws',
  'passivesafety.forwardcollisionwarning': 'passivesafety_forwardcollisionwarning',
  'passivesafety.activebraking': 'passivesafety_activebraking',
  'passivesafety.abs': 'passivesafety_abs',
  'passivesafety.lowspeedwarning': 'passivesafety_lowspeedwarning',
  'passivesafety.roadrescue': 'passivesafety_roadrescue',
  'passivesafety.drivingrecorder': 'passivesafety_drivingrecorder',
  'passivesafety.brakeassist': 'passivesafety_brakeassist',
  'passivesafety.tirepressuremonitoring': 'passivesafety_tirepressuremonitoring',
  'passivesafety.safetybeltprompt': 'passivesafety_safetybeltprompt',

  // Driving Control 驾驶控制
  'drivingcontrol.automaticparking': 'drivingcontrol_automaticparking',
  'drivingcontrol.hillstartassist': 'drivingcontrol_hillstartassist',
  'drivingcontrol.hilldescent': 'drivingcontrol_hilldescent',
  'drivingcontrol.airsuspension': 'drivingcontrol_airsuspension',
  'drivingcontrol.energyrecovery': 'drivingcontrol_energyrecovery',
  'drivingcontrol.startstopsystem': 'drivingcontrol_startstopsystem',
  'drivingcontrol.drivemodechoose': 'drivingcontrol_drivemodechoose',

  // Wheel Brake 车轮制动
  'wheelbrake.hubmaterial': 'wheelbrake_hubmaterial',
  'wheelbrake.parkingbraketype': 'wheelbrake_parkingbraketype',
  'wheelbrake.reartiresize': 'wheelbrake_reartiresize',
  'wheelbrake.fronttiresize': 'wheelbrake_fronttiresize',
  'wheelbrake.rearbraketype': 'wheelbrake_rearbraketype',
  'wheelbrake.fronttrack': 'wheelbrake_fronttrack',
  'wheelbrake.frontbraketype': 'wheelbrake_frontbraketype',
  'wheelbrake.reartrack': 'wheelbrake_reartrack',
  'wheelbrake.sparetiretype': 'wheelbrake_sparetiretype',

  // Appearance Antitheft 外观防盗
  'appearanceantitheft.remotecontrol': 'appearanceantitheft_remotecontrol',
  'appearanceantitheft.roofluggagerack': 'appearanceantitheft_roofluggagerack',
  'appearanceantitheft.hubmaterial': 'appearanceantitheft_hubmaterial',
  'appearanceantitheft.discharge': 'appearanceantitheft_discharge',
  'appearanceantitheft.engineantitheft': 'appearanceantitheft_engineantitheft',
  'appearanceantitheft.electricluggage': 'appearanceantitheft_electricluggage',
  'appearanceantitheft.trunkpositionmemory': 'appearanceantitheft_trunkpositionmemory',
  'appearanceantitheft.batterypreheating': 'appearanceantitheft_batterypreheating',
  'appearanceantitheft.hiddendoorhandle': 'appearanceantitheft_hiddendoorhandle',
  'appearanceantitheft.keylessentry': 'appearanceantitheft_keylessentry',
  'appearanceantitheft.remotekey': 'appearanceantitheft_remotekey',
  'appearanceantitheft.centrallocking': 'appearanceantitheft_centrallocking',

  // Color 颜色
  'color.color': 'color_color',
  'color.interiorcolor': 'color_interiorcolor',

  // Screen System 屏幕系统
  'screensystem.wakeupwordfree': 'screensystem_wakeupwordfree',
  'screensystem.lcdscreensize': 'screensystem_lcdscreensize',
  'screensystem.seeandsay': 'screensystem_seeandsay',
  'screensystem.carsystemstorage': 'screensystem_carsystemstorage',
  'screensystem.assistantwakeupword': 'screensystem_assistantwakeupword',
  'screensystem.carintelligentchip': 'screensystem_carintelligentchip',
  'screensystem.facialrecognition': 'screensystem_facialrecognition',
  'screensystem.voicecontrol': 'screensystem_voicecontrol',
  'screensystem.carsystemmemory': 'screensystem_carsystemmemory',
  'screensystem.wakeupregion': 'screensystem_wakeupregion',
  'screensystem.intelligentsystem': 'screensystem_intelligentsystem',
  'screensystem.continuousspeech': 'screensystem_continuousspeech',
  'screensystem.bluetooth': 'screensystem_bluetooth',
  'screensystem.phoneconnect': 'screensystem_phoneconnect',
  'screensystem.consolelcdscreen': 'screensystem_consolelcdscreen',

  // Driving Function 驾驶功能
  'drivingfunction.lanekeep': 'drivingfunction_lanekeep',
  'drivingfunction.reversesidewarning': 'drivingfunction_reversesidewarning',
  'drivingfunction.lanecentering': 'drivingfunction_lanecentering',
  'drivingfunction.driverassistancelevel': 'drivingfunction_driverassistancelevel',
  'drivingfunction.mapbrand': 'drivingfunction_mapbrand',
  'drivingfunction.roadtrafficsignrecog': 'drivingfunction_roadtrafficsignrecog',
  'drivingfunction.cruisecontrol': 'drivingfunction_cruisecontrol',
  'drivingfunction.automaticparkingintoplace': 'drivingfunction_automaticparkingintoplace',
  'drivingfunction.satellitenavigationsystem': 'drivingfunction_satellitenavigationsystem',
  'drivingfunction.parallelaid': 'drivingfunction_parallelaid',
  'drivingfunction.navigationtrafficinfo': 'drivingfunction_navigationtrafficinfo',

  // Intelligent Config 智能配置
  'intelligentconfig.appremote': 'intelligentconfig_appremote',
  'intelligentconfig.internetofvehicle': 'intelligentconfig_internetofvehicle',
  'intelligentconfig.4g': 'intelligentconfig_4g',
  'intelligentconfig.ota': 'intelligentconfig_ota',

  // External Rear Mirror 外后视镜
  'externalrearmirror.foldinglockingcar': 'externalrearmirror_foldinglockingcar',
  'externalrearmirror.electricfolding': 'externalrearmirror_electricfolding',
  'externalrearmirror.reversingtiltdown': 'externalrearmirror_reversingtiltdown',
  'externalrearmirror.rearviewmirrormemory': 'externalrearmirror_rearviewmirrormemory',
  'externalrearmirror.heatedrearviewmirror': 'externalrearmirror_heatedrearviewmirror',

  // Driving Hardware 驾驶硬件
  'drivinghardware.reversingradar': 'drivinghardware_reversingradar',
  'drivinghardware.frontparkingradar': 'drivinghardware_frontparkingradar',
  'drivinghardware.millimeterwaveradarnum': 'drivinghardware_millimeterwaveradarnum',
  'drivinghardware.camerasnum': 'drivinghardware_camerasnum',
  'drivinghardware.ultrasonicradarsnum': 'drivinghardware_ultrasonicradarsnum',
  'drivinghardware.reverseimage': 'drivinghardware_reverseimage',

  // Chassis Steer 底盘转向
  'chassissteer.rearsuspensiontype': 'chassissteer_rearsuspensiontype',
  'chassissteer.centerdifferentiallock': 'chassissteer_centerdifferentiallock',
  'chassissteer.frontbraketype': 'chassissteer_frontbraketype',
  'chassissteer.fourwheeldrive': 'chassissteer_fourwheeldrive',
  'chassissteer.powersteering': 'chassissteer_powersteering',
  'chassissteer.parkingbraketype': 'chassissteer_parkingbraketype',
  'chassissteer.bodystructure': 'chassissteer_bodystructure',
  'chassissteer.rearbraketype': 'chassissteer_rearbraketype',
  'chassissteer.frontsuspensiontype': 'chassissteer_frontsuspensiontype',
  'chassissteer.airsuspension': 'chassissteer_airsuspension',

  // Sunroof Glass 天窗玻璃
  'sunroofglass.sunvisormirror': 'sunroofglass_sunvisormirror',
  'sunroofglass.antipinchwindow': 'sunroofglass_antipinchwindow',
  'sunroofglass.onetouchwindowlifting': 'sunroofglass_onetouchwindowlifting',
  'sunroofglass.rearwindowsunshade': 'sunroofglass_rearwindowsunshade',
  'sunroofglass.skylightopeningmode': 'sunroofglass_skylightopeningmode',
  'sunroofglass.sidewindowsoundproofglass': 'sunroofglass_sidewindowsoundproofglass',
  'sunroofglass.rearwiper': 'sunroofglass_rearwiper',
  'sunroofglass.privacyglass': 'sunroofglass_privacyglass',
  'sunroofglass.sensingwiper': 'sunroofglass_sensingwiper',

  // Electric Motor 电机
  'electricmotor.frontmaxpower': 'electricmotor_frontmaxpower',
  'electricmotor.motorpower': 'electricmotor_motorpower',
  'electricmotor.batterycapacity': 'electricmotor_batterycapacity',
  'electricmotor.motormaxhorsepower': 'electricmotor_motormaxhorsepower',
  'electricmotor.frontmaxtorque': 'electricmotor_frontmaxtorque',
  'electricmotor.batterytype': 'electricmotor_batterytype',
  'electricmotor.batteryenergydensity': 'electricmotor_batteryenergydensity',
  'electricmotor.rearmaxtorque': 'electricmotor_rearmaxtorque',
  'electricmotor.batterybrand': 'electricmotor_batterybrand',
  'electricmotor.motorlayout': 'electricmotor_motorlayout',
  'electricmotor.fastcharging': 'electricmotor_fastcharging',
  'electricmotor.motornum': 'electricmotor_motornum',
  'electricmotor.fastchargingpercent': 'electricmotor_fastchargingpercent',
  'electricmotor.threeelectricwarranty': 'electricmotor_threeelectricwarranty',
  'electricmotor.wltcmaxmileage': 'electricmotor_wltcmaxmileage',
  'electricmotor.motortype': 'electricmotor_motortype',
  'electricmotor.motortorque': 'electricmotor_motortorque',
  'electricmotor.powerconsumption': 'electricmotor_powerconsumption',

  // Active Safety 主动安全
  'activesafety.childseatfixdevice': 'activesafety_childseatfixdevice',
  'activesafety.esp': 'activesafety_esp',
  'activesafety.tractioncontrol': 'activesafety_tractioncontrol',
  'activesafety.dooropeningwarning': 'activesafety_dooropeningwarning',
  'activesafety.fatiguereminder': 'activesafety_fatiguereminder',
  'activesafety.ebd': 'activesafety_ebd',
  'activesafety.ldws': 'activesafety_ldws',
  'activesafety.forwardcollisionwarning': 'activesafety_forwardcollisionwarning',
  'activesafety.activebraking': 'activesafety_activebraking',
  'activesafety.abs': 'activesafety_abs',
  'activesafety.lowspeedwarning': 'activesafety_lowspeedwarning',
  'activesafety.roadrescue': 'activesafety_roadrescue',
  'activesafety.drivingrecorder': 'activesafety_drivingrecorder',
  'activesafety.brakeassist': 'activesafety_brakeassist',
  'activesafety.tirepressuremonitoring': 'activesafety_tirepressuremonitoring',
  'activesafety.safetybeltprompt': 'activesafety_safetybeltprompt',

  // Sound Interior Light 音响内饰灯
  'soundinteriorlight.audiobrand': 'soundinteriorlight_audiobrand',
  'soundinteriorlight.interiorairlight': 'soundinteriorlight_interiorairlight',
  'soundinteriorlight.speakernum': 'soundinteriorlight_speakernum',
  'soundinteriorlight.readinglight': 'soundinteriorlight_readinglight',

  // Exterior Light 外部灯光
  'exteriorlight.daytimerunninglight': 'exteriorlight_daytimerunninglight',
  'exteriorlight.adaptivehighandlowbeam': 'exteriorlight_adaptivehighandlowbeam',
  'exteriorlight.headlightautomaticopen': 'exteriorlight_headlightautomaticopen',
};

/**
 * 将聚美API数据转换为数据库格式
 */
export function transformJumdataToDatabase(apiData: any, options: {
  modelJmId: number;
  seriesJmId: number;
  brandJmId: number;
  modelId?: string;
  seriesId?: string;
  brandId?: string;
  logoUrl?: string;
}): Record<string, any> {
  const result: Record<string, any> = {};

  // 设置关联字段
  result.jm_id = apiData.id;
  result.model_jm_id = options.modelJmId;
  result.series_jm_id = options.seriesJmId;
  result.brand_jm_id = options.brandJmId;
  
  if (options.modelId) result.model_id = options.modelId;
  if (options.seriesId) result.series_id = options.seriesId;
  if (options.brandId) result.brand_id = options.brandId;
  if (options.logoUrl) result.logo_url = options.logoUrl;

  // 递归处理所有字段
  function processFields(data: any, prefix: string = '') {
    if (!data || typeof data !== 'object') return;

    for (const [key, value] of Object.entries(data)) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      
      // 查找映射
      const mappedField = JUMDATA_FIELD_MAPPING[fullKey];
      
      if (mappedField) {
        // 处理值
        if (value !== null && value !== undefined && value !== '') {
          result[mappedField] = value;
        }
      } else if (typeof value === 'object' && !Array.isArray(value)) {
        // 递归处理嵌套对象
        processFields(value, fullKey);
      }
    }
  }

  processFields(apiData);

  return result;
}

/**
 * 获取所有数据库字段列表
 */
export function getAllDatabaseFields(): string[] {
  return Object.values(JUMDATA_FIELD_MAPPING);
}

/**
 * 获取所有API字段路径
 */
export function getAllApiFieldPaths(): string[] {
  return Object.keys(JUMDATA_FIELD_MAPPING);
}

/**
 * 检查数据完整性
 */
export function validateDataCompleteness(apiData: any, dbData: any): {
  missingFields: string[];
  valueMismatches: { field: string; apiValue: any; dbValue: any }[];
  completenessScore: number;
} {
  const missingFields: string[] = [];
  const valueMismatches: { field: string; apiValue: any; dbValue: any }[] = [];
  let totalFields = 0;
  let matchedFields = 0;

  // 检查所有字段
  for (const [apiField, dbField] of Object.entries(JUMDATA_FIELD_MAPPING)) {
    totalFields++;
    
    const apiValue = getNestedValue(apiData, apiField);
    const dbValue = dbData[dbField];

    if (apiValue !== null && apiValue !== undefined && apiValue !== '') {
      if (dbValue === null || dbValue === undefined || dbValue === '') {
        missingFields.push(dbField);
      } else if (String(apiValue) !== String(dbValue)) {
        valueMismatches.push({
          field: dbField,
          apiValue,
          dbValue
        });
      } else {
        matchedFields++;
      }
    }
  }

  const completenessScore = totalFields > 0 ? (matchedFields / totalFields) * 100 : 0;

  return {
    missingFields,
    valueMismatches,
    completenessScore
  };
}

/**
 * 安全获取嵌套值
 */
function getNestedValue(obj: any, path: string): any {
  if (!obj) return undefined;
  
  const parts = path.split('.');
  let current = obj;
  
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    current = current[part];
  }
  
  return current;
}

/**
 * 生成字段对比报告
 */
export function generateFieldReport(apiData: any, dbData: any): string {
  const { missingFields, valueMismatches, completenessScore } = validateDataCompleteness(apiData, dbData);
  
  let report = `=== 聚美数据完整性报告 ===\n`;
  report += `完整性评分: ${completenessScore.toFixed(1)}%\n\n`;
  
  if (missingFields.length > 0) {
    report += `缺失字段 (${missingFields.length}):\n`;
    for (const field of missingFields) {
      report += `  - ${field}\n`;
    }
    report += '\n';
  }
  
  if (valueMismatches.length > 0) {
    report += `值不匹配 (${valueMismatches.length}):\n`;
    for (const mismatch of valueMismatches) {
      report += `  - ${mismatch.field}: API="${mismatch.apiValue}", DB="${mismatch.dbValue}"\n`;
    }
    report += '\n';
  }
  
  if (missingFields.length === 0 && valueMismatches.length === 0) {
    report += `✅ 数据完整！所有字段已正确保存。\n`;
  }
  
  return report;
}
