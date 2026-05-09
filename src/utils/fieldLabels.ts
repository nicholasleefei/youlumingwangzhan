// 数据库字段中文字段名映射
export const fieldLabels = {
  // 通用字段
  id: 'ID',
  jm_id: '聚美ID',
  created_at: '创建时间',
  updated_at: '更新时间',

  // 品牌表字段
  name: '品牌名',
  initial: '首字母',
  logo_url: 'Logo',
  parent_id: '父级ID',
  depth: '层级',

  // 车系表字段
  brand_jm_id: '品牌聚美ID',
  brand_id: '品牌ID',
  fullname: '全称',
  salestate: '销售状态',
  subcompany_name: '所属公司',
  subcompany_jm_id: '子公司聚美ID',

  // 车型表字段
  series_jm_id: '车系聚美ID',
  series_id: '车系ID',
  series_name: '车系名称',
  brand_name: '品牌名称',
  groupid: '分组ID',
  groupname: '分组名',
  sizetype: '尺寸类型',
  displacement2: '排量数值',
  displacement: '排量',
  geartype: '变速箱类型',
  geartype2: '变速箱类型数值',
  yeartype: '年款',
  listdate: '上市日期',
  price: '价格',
  productionstate: '生产状态',

  // 车型详情表字段
  brandname: '品牌名',
  parentname: '车系名称',
  parentid: '车系id',
  environmentalstandards: '环保标准',
  environmentalstandards2: '环保标准数字',
  drivemode: '驱动方式',
  drivemode2: '驱动方式数值',
  gearnum: '档位数',
  compartnum: '车厢数',
  isnev: '是否新能源',
  basic: '基本信息',
  body: '车体',
  drivingauxiliary: '行车辅助',
  engine: '发动机',
  actualtest: '实际测试',
  gearbox: '变速箱',
  chassisbrake: '底盘制动',
  aircondrefrigerator: '空调/冰箱',
  wheel: '车轮',
  entcom: '娱乐通讯',
  doormirror: '门窗/后视镜',
  seat: '座椅',
  internalconfig: '内部配置',
  light: '灯光',
  safe: '安全配置',
  incarcharge: '车载充电',
  fourwdoffroad: '四驱越野',
  activesafety: '主动安全',
  drivingcontrol: '驾驶控制',
  wheelbrake: '车轮制动',
  appearanceantitheft: '外观防盗',
  color: '颜色',
  screensystem: '屏幕系统',
  drivingfunction: '驾驶功能',
  intelligentconfig: '智能配置',
  externalrearmirror: '外后视镜',
  drivinghardware: '驾驶硬件',
  chassissteer: '底盘转向',
  passivesafety: '被动安全',
  soundinteriorlight: '音响内饰灯',
  exteriorlight: '外部灯光',
  electricmotor: '电机',
  sunroofglass: '天窗玻璃',

  // 平铺字段标签
  basic_price: '厂商指导价',
  basic_saleprice: '商家报价',
  basic_seatnum: '乘员人数',
  basic_mixfuelconsumption: '混合工况油耗',
  basic_comfuelconsumption: '综合工况油耗',
  basic_displacement: '排量',
  basic_gearbox: '变速箱',
  basic_geartype: '变速箱类型',
  basic_gearnum: '档位数',
  basic_maxspeed: '最高车速',
  basic_officialaccelerationtime100: '官方0-100公里加速时间',
  basic_warrantypolicy: '保修政策',
  basic_electricfuelconsumption: '电能消耗',
  basic_userfuelconsumption: '车主实测油耗',
  basic_firstownerwarrantypolicy: '首任车主保修政策',
  basic_testaccelerationtime100: '实测0-100公里加速时间',
  basic_lowchargefuelconsumption: '低电量油耗',

  body_color: '车身颜色',
  body_len: '车长',
  body_width: '车宽',
  body_height: '车高',
  body_weight: '整备质量',
  body_fullweight: '满载质量',
  body_mingroundclearance: '最小离地间隙',
  body_maxwadingdepth: '最大涉水深度',
  body_approachangle: '接近角',
  body_departureangle: '离去角',
  body_rampangle: '通过角',
  body_fronttrack: '前轮距',
  body_reartrack: '后轮距',
  body_wheelbase: '轴距',
  body_minturndiameter: '最小转弯直径',
  body_sportpackage: '运动外观套件',
  body_roofluggagerack: '车顶行李箱架',
  body_bodytype: '车身型式',
  body_tooftype: '车顶型式',
  body_hoodtype: '车篷型式',
  body_doornum: '车门数',
  body_electricluggage: '电动行李厢',
  body_luggagevolume: '行李厢容积',
  body_luggageopenmode: '行李厢打开方式',
  body_inductionluggage: '感应行李厢',
  body_luggagemode: '行李厢盖开合方式',
  body_dragcoefficient: '风阻系数',
  body_fronttrunkvolume: '前备厢容积',
  body_trunkpositionmemory: '行李厢位置记忆',

  drivingauxiliary_reverseimage: '倒车影像',
  drivingauxiliary_panoramiccamera: '全景摄像头',
  drivingauxiliary_reversingradar: '倒车雷达',
  drivingauxiliary_frontparkingradar: '泊车雷达',
  drivingauxiliary_esp: '动态稳定控制系统',
  drivingauxiliary_eps: '随速助力转向调节',
  drivingauxiliary_tractioncontrol: '牵引力控制',
  drivingauxiliary_hillstartassist: '上坡辅助',
  drivingauxiliary_remoteparking: '遥控泊车',
  drivingauxiliary_activebraking: '主动刹车/主动安全系统',
  drivingauxiliary_parallelaid: '并线辅助',
  drivingauxiliary_lanekeep: '车道保持',
  drivingauxiliary_cruisecontrol: '定速巡航',
  drivingauxiliary_nightvisionsystem: '夜视系统',
  drivingauxiliary_autodriveassist: '自动驾驶辅助',
  drivingauxiliary_automaticparking: '自动驻车',
  drivingauxiliary_automaticparkingintoplace: '自动泊车入位',
  drivingauxiliary_integralactivesteering: '整体主动转向系统',
  drivingauxiliary_blindspotdetection: '盲点检测',
  drivingauxiliary_fatiguereminder: '疲劳提醒',
  drivingauxiliary_ebd: '电子制动力分配系统',
  drivingauxiliary_brakeassist: '刹车辅助',
  drivingauxiliary_ldws: '车道偏离预警系统',
  drivingauxiliary_hilldescent: '陡坡缓降',
  drivingauxiliary_drivemodechoose: '驾驶模式选择',
  drivingauxiliary_gps: 'GPS导航系统',
  drivingauxiliary_adaptivecruise: '自适应巡航',
  drivingauxiliary_abs: '刹车防抱死',
  drivingauxiliary_variablesteering: '可变齿比转向',

  engine_displacement: '排量',
  engine_displacementml: '排量mL',
  engine_fueltype: '燃料类型',
  engine_fuelgrade: '燃油标号',
  engine_fueltankcapacity: '燃油箱容积',
  engine_environmentalstandards: '环保标准',
  engine_fuelmethod: '供油方式',
  engine_intakeform: '进气形式',
  engine_model: '发动机型号',
  engine_position: '发动机位置',
  engine_maxhorsepower: '最大马力',
  engine_compressionratio: '压缩比',
  engine_integratedpower: '系统综合功率',
  engine_maxtorque: '最大扭矩',
  engine_maxtorquespeed: '最大扭矩转速',
  engine_maxpower: '最大功率',
  engine_maxpowerspeed: '最大功率转速',
  engine_motorpower: '电动机总功率',
  engine_frontmaxpower: '前电动机最大功率',
  engine_rearmaxpower: '后电动机最大功率',
  engine_modeleasyepc2: '发动机型号',
  engine_modelsohu: '发动机型号',
  engine_stroke: '行程',
  engine_startstopsystem: '启停系统',
  engine_nedcmaxmileage: 'NEDC最大续航里程',
  engine_cltcmaxmileage: 'CLTC纯电续航',
  engine_cylinderarrangetype: '气缸排列型式',
  engine_cylinderheadmaterial: '缸盖材料',
  engine_cylinderbodymaterial: '缸体材料',
  engine_bore: '缸径',
  engine_valvestructure: '气门结构',
  engine_cylindernum: '气缸数',
  engine_valvetrain: '每缸气门数',
  engine_motornum: '驱动电机数',
  engine_motorlayout: '电机布局',
  engine_motortype: '电机类型',
  engine_motormaxhorsepower: '电动机总马力',
  engine_batterytype: '电池类型',
  engine_batterybrand: '电芯品牌',
  engine_motortorque: '电动机总扭矩',
  engine_integratedtorque: '系统综合扭矩',
  engine_frontmaxtorque: '前电动机最大扭矩',
  engine_rearmaxtorque: '后电动机最大扭矩',
  engine_batterycapacity: '电池容量',
  engine_powerconsumption: '耗电量',
  engine_maxmileage: '最大续航里程',
  engine_batterywarranty: '电池组质保',
  engine_batteryfastchargetime: '电池快充充电时间',
  engine_batteryslowchargetime: '电池慢充充电时间',
  engine_modelvin17: 'VIN码',

  actualtest_accelerationtime100: '加速时间',

  gearbox_gearnum: '档位数',
  gearbox_geartype: '变速箱类型',
  gearbox_gearbox: '变速箱',

  chassisbrake_drivemode: '驱动方式',
  chassisbrake_chassis: '底盘型号',
  chassisbrake_bodystructure: '车体结构',
  chassisbrake_powersteering: '转向助力',
  chassisbrake_centerdifferentiallock: '中央差速器锁',
  chassisbrake_frontbraketype: '前制动类型',
  chassisbrake_rearbraketype: '后制动类型',
  chassisbrake_parkingbraketype: '驻车制动类型',
  chassisbrake_adjustablesuspension: '可调悬挂',
  chassisbrake_airsuspension: '空气悬挂',
  chassisbrake_frontsuspensiontype: '前悬挂类型',
  chassisbrake_rearsuspensiontype: '后悬挂类型',
  chassisbrake_fourwdoffroad: '四驱越野',
  chassisbrake_chassisqixiubao: '底盘球头套',

  aircondrefrigerator_frontairconditioning: '前排空调',
  aircondrefrigerator_rearairconditioning: '后排独立空调',
  aircondrefrigerator_reardischargeoutlet: '后排出风口',
  aircondrefrigerator_tempzonecontrol: '温度分区控制',
  aircondrefrigerator_airconditioningcontrolmode: '空调控制方式',
  aircondrefrigerator_carrefrigerator: '车载冰箱',
  aircondrefrigerator_airpurifyingdevice: '车内空气净化装置',
  aircondrefrigerator_fragrance: '香氛系统',
  aircondrefrigerator_airconditioning: '空气调节/花粉过滤',

  wheel_tirenum: '轮胎个数',
  wheel_fronttiresize: '前轮胎规格',
  wheel_reartiresize: '后轮胎规格',
  wheel_hubmaterial: '轮毂材料',
  wheel_sparetiretype: '备胎类型',

  entcom_fulllcddashboard: '全液晶仪表盘',
  entcom_consolelcdscreen: '中控台液晶屏',
  entcom_lcdscreensize: '液晶屏尺寸',
  entcom_rearlcdscreen: '后排液晶屏',
  entcom_drivingrecorder: '车载行车记录仪',
  entcom_huddisplay: 'HUD抬头数字显示',
  entcom_locationservice: '定位互动服务',
  entcom_builtinharddisk: '内置硬盘',
  entcom_bluetooth: '蓝牙系统',
  entcom_4g: '4G',
  entcom_cd: 'CD',
  entcom_dvd: 'DVD',
  entcom_audiobrand: '音响品牌',
  entcom_speakernum: '扬声器数量',
  entcom_externalaudiointerface: '外接音源接口',
  entcom_phoneconnect: '手机互联',
  entcom_wirelesscharge: '手机无线充电',
  entcom_powersupply: '车载电源',
  entcom_luggagepowersocket: '行李厢电源接口',
  entcom_usbnum: 'USB接口数量',
  entcom_gesturecontrol: '手势控制系统',
  entcom_cartv: '车载电视',
  entcom_carapp: '车载APP应用',
  entcom_voicecontrol: '语音控制',
  entcom_roadrescue: '紧急道路救援',

  doormirror_headlightfeature: '大灯功能',
  doormirror_autoheadlight: '自动大灯',
  doormirror_externalmirrorantiglare: '外后视镜自动防眩目',
  doormirror_externalmirrorfolding: '外后视镜电动折叠功能',
  doormirror_externalmirroradjustment: '外后视镜电动调节',
  doormirror_externalmirrormemory: '外后视镜记忆功能',
  doormirror_externalmirrorheating: '外后视镜加热功能',
  doormirror_externalmirrormedia: '流媒体外后视镜',
  doormirror_rearviewmirrormedia: '流媒体内后视镜',
  doormirror_rearviewmirrorantiglare: '内后视镜防眩目功能',
  doormirror_rearmirrorwithturnlamp: '后雨刷',
  doormirror_openstyle: '开门方式',
  doormirror_electricpulldoor: '电动吸合门',
  doormirror_electricsuctiondoor: '电吸门',
  doormirror_electricslidingdoor: '电动侧滑门',
  doormirror_rearsidesunshade: '后排侧遮阳帘',
  doormirror_rearwindowsunshade: '后窗遮阳帘',
  doormirror_privacyglass: '隐私玻璃',
  doormirror_uvinterceptingglass: '防紫外线/隔热玻璃',
  doormirror_sensingwiper: '感应雨刷',
  doormirror_skylightstype: '天窗型式',
  doormirror_skylightopeningmode: '天窗开合方式',
  doormirror_electricwindow: '电动车窗',
  doormirror_frontelectricwindow: '前电动车窗',
  doormirror_rearelectricwindow: '后电动车窗',
  doormirror_antipinchwindow: '电动窗防夹功能',
  doormirror_sunvisormirror: '遮阳板化妆镜',
  doormirror_roofrack: '车顶行李架',
  doormirror_rearwing: '尾翼/扰流板',

  seat_frontseatfunction: '前排座椅功能',
  seat_rearseatfunction: '后排座椅功能',
  seat_seatheightadjustment: '座椅高低调节',
  seat_electricseatmemory: '电动座椅记忆',
  seat_driverseatelectricadjustment: '主座椅电动调节',
  seat_driverseatadjustmentmode: '驾驶座座椅调节方式',
  seat_frontseatheadrestadjustment: '前座椅头枕调节',
  seat_driverseatshouldersupportadjustment: '驾驶座肩部支撑调节',
  seat_auxiliaryseatelectricadjustment: '副座椅电动调节',
  seat_auxiliaryseatadjustmentmode: '副驾驶座椅调节方式',
  seat_rearseatadjustmentmode: '后排座椅调节方式',
  seat_secondrowseatelectricadjustment: '第二排座椅电动调节',
  seat_secondrowseatadjustment: '第二排座椅调节方式',
  seat_sportseat: '运动座椅',
  seat_seatmaterial: '座椅材料',
  seat_driverseatlumbarsupportadjustment: '驾驶座腰部支撑调节',
  seat_childseatfixdevice: '儿童安全座椅固定装置',
  seat_seatheating: '座椅加热',
  seat_seatventilation: '座椅通风',
  seat_seatmassage: '座椅按摩功能',
  seat_rearseatreclineproportion: '后排座位放倒比例',
  seat_rearseatangleadjustment: '后排座椅角度调节',
  seat_thirdrowseat: '第三排座椅',
  seat_frontseatcenterarmrest: '前座中央扶手',
  seat_rearseatcenterarmrest: '后座中央扶手',
  seat_seatadjustablebutton: '座椅调节按钮',
  seat_seatrecliningmethod: '座椅放倒方式',
  seat_secondrowseatfunctions: '第二排座椅功能',

  internalconfig_interiorcolor: '内饰颜色',
  internalconfig_interiormaterial: '内饰材质',
  internalconfig_steeringwheelmaterial: '方向盘表面材料',
  internalconfig_steeringwheelmultifunction: '多功能方向盘',
  internalconfig_steeringwheelbeforeadjustment: '方向盘前后调节',
  internalconfig_steeringwheelupadjustment: '方向盘上下调节',
  internalconfig_steeringwheelheating: '方向盘加热',
  internalconfig_steeringwheelmemory: '方向盘记忆设置',
  internalconfig_steeringwheeladjustmentmode: '方向盘调节方式',
  internalconfig_steeringwheelshift: '方向盘换挡',
  internalconfig_rearcupholder: '后排杯架',
  internalconfig_supplyvoltage: '车内电源电压',
  internalconfig_activenoisereduction: '主动降噪',
  internalconfig_computerscreen: '行车电脑显示屏',

  light_headlighttype: '前大灯类型',
  light_optionalheadlighttype: '选配前大灯类型',
  light_headlightilluminationadjustment: '前大灯照射范围调整',
  light_headlightautomaticclean: '前大灯自动清洗功能',
  light_headlightdynamicsteering: '前大灯随动转向',
  light_headlightautomaticopen: '前大灯自动开闭',
  light_headlightdelayoff: '前大灯延时关闭',
  light_daytimerunninglight: '日间行车灯',
  light_leddaytimerunninglight: 'LED日间行车灯',
  light_ledtaillight: 'LED尾灯',
  light_lightsteeringassist: '转向辅助灯',
  light_headlightdimming: '会车前灯防眩目功能',
  light_frontfoglight: '前雾灯',
  light_interiorairlight: '车内氛围灯',
  light_readinglight: '阅读灯',
  light_adjustableheadlight: '前大灯可调',
  light_lowbeamtype: '近光灯类型',

  safe_airbagdrivingposition: '驾驶位安全气囊',
  safe_airbagfrontpassenger: '副驾驶位安全气囊',
  safe_airbagfrontside: '前排侧安全气囊',
  safe_airbagfronthead: '前排头部气囊',
  safe_airbagrearside: '后排侧安全气囊',
  safe_rearcentralairbag: '后排中央气囊',
  safe_airbagrearhead: '后排头部气囊',
  safe_sideaircurtain: '侧安全气帘',
  safe_airbagknee: '膝部气囊',
  safe_safetybeltprompt: '安全带未系提示',
  safe_seatbeltairbag: '安全带气囊',
  safe_safetybeltlimiting: '安全带限力功能',
  safe_safetybeltpretightening: '安全带预收紧功能',
  safe_frontsafetybeltadjustment: '前安全带调节',
  safe_rearsafetybelt: '后排安全带',
  safe_brakeassist: '刹车辅助',
  safe_tirepressuremonitoring: '胎压监测装置',
  safe_zeropressurecontinued: '零压续行',
  safe_keylessentry: '无钥匙进入系统',
  safe_keylessstart: '无钥匙启动系统',
  safe_childlock: '儿童锁',
  safe_smartkey: '智能钥匙',
  safe_remotekey: '遥控钥匙',
  safe_remotecontrol: '远程遥控功能',
  safe_engineantitheft: '发动机电子防盗',
  safe_centrallocking: '中控门锁',
// 车载充电字段
  incarcharge_wirelesscharge: '无线充电',
  incarcharge_chargingport: '充电接口',
  incarcharge_usbnum: 'USB数量',
  incarcharge_powersupply: '电源供应',
  incarcharge_luggagepowersocket: '行李厢电源插座',
  incarcharge_usbmaxchargingpower: 'USB最大充电功率',
  incarcharge_phonewirelesschargingpower: '手机无线充电功率',

  passivesafety_childseatfixdevice: '儿童座椅固定装置',
  passivesafety_esp: '车身稳定控制',
  passivesafety_tractioncontrol: '牵引力控制',
  passivesafety_dooropeningwarning: '开门预警',
  passivesafety_fatiguereminder: '疲劳提醒',
  passivesafety_ebd: '电子制动力分配',
  passivesafety_ldws: '车道偏离预警',
  passivesafety_forwardcollisionwarning: '前方碰撞预警',
  passivesafety_activebraking: '主动刹车',
  passivesafety_abs: '防抱死制动',
  passivesafety_lowspeedwarning: '低速预警',
  passivesafety_roadrescue: '道路救援',
  passivesafety_drivingrecorder: '行车记录仪',
  passivesafety_brakeassist: '刹车辅助',
  passivesafety_tirepressuremonitoring: '胎压监测',
  passivesafety_safetybeltprompt: '安全带提醒',
  passivesafety_rearcollisionwarning: '后方碰撞预警',
  passivesafety_sentrymode: '哨兵模式',

  drivingcontrol_automaticparking: '自动驻车',
  drivingcontrol_hillstartassist: '上坡辅助',
  drivingcontrol_hilldescent: '陡坡缓降',
  drivingcontrol_airsuspension: '空气悬挂',
  drivingcontrol_energyrecovery: '能量回收',
  drivingcontrol_startstopsystem: '启停系统',
  drivingcontrol_drivemodechoose: '驾驶模式选择',
  drivingcontrol_adjustablesuspension: '可调悬挂',

  wheelbrake_hubmaterial: '轮毂材料',
  wheelbrake_parkingbraketype: '驻车制动类型',
  wheelbrake_reartiresize: '后轮胎规格',
  wheelbrake_fronttiresize: '前轮胎规格',
  wheelbrake_rearbraketype: '后制动类型',
  wheelbrake_fronttrack: '前轮距',
  wheelbrake_frontbraketype: '前制动类型',
  wheelbrake_reartrack: '后轮距',
  wheelbrake_sparetiretype: '备胎类型',

  appearanceantitheft_remotecontrol: '远程控制',
  appearanceantitheft_roofluggagerack: '车顶行李架',
  appearanceantitheft_hubmaterial: '轮毂材料',
  appearanceantitheft_discharge: '放电',
  appearanceantitheft_engineantitheft: '发动机防盗',
  appearanceantitheft_electricluggage: '电动行李厢',
  appearanceantitheft_trunkpositionmemory: '行李厢位置记忆',
  appearanceantitheft_batterypreheating: '电池预热',
  appearanceantitheft_hiddendoorhandle: '隐藏式门把手',
  appearanceantitheft_keylessentry: '无钥匙进入',
  appearanceantitheft_remotekey: '遥控钥匙',
  appearanceantitheft_centrallocking: '中控门锁',
  appearanceantitheft_electricpulldoor: '电动拉门',
  appearanceantitheft_sidepedal: '侧踏板',
  appearanceantitheft_activeclosedgrille: '主动闭合格栅',

  color_color: '车身颜色',
  color_interiorcolor: '内饰颜色',

  screensystem_wakeupwordfree: '免唤醒词',
  screensystem_lcdscreensize: '液晶屏尺寸',
  screensystem_seeandsay: '可见即可说',
  screensystem_carsystemstorage: '车机存储',
  screensystem_assistantwakeupword: '助手唤醒词',
  screensystem_carintelligentchip: '车载智能芯片',
  screensystem_facialrecognition: '人脸识别',
  screensystem_voicecontrol: '语音控制',
  screensystem_carsystemmemory: '车机内存',
  screensystem_wakeupregion: '唤醒区域',
  screensystem_intelligentsystem: '智能系统',
  screensystem_continuousspeech: '连续对话',
  screensystem_bluetooth: '蓝牙',
  screensystem_phoneconnect: '手机互联',
  screensystem_consolelcdscreen: '中控液晶屏',
  screensystem_privacyshield: '隐私屏蔽',
  screensystem_multifingerscreen: '多指操作',
  screensystem_carapp: '车载应用',
  screensystem_voiceprintrecognition: '声纹识别',
  screensystem_rearmultimediacontrol: '后排多媒体控制',
  screensystem_passengerscreentype: '乘客屏幕类型',
  screensystem_entertainmentscreensize: '娱乐屏幕尺寸',

  drivingfunction_lanekeep: '车道保持',
  drivingfunction_reversesidewarning: '后方侧向预警',
  drivingfunction_lanecentering: '车道居中',
  drivingfunction_driverassistancelevel: '驾驶辅助级别',
  drivingfunction_mapbrand: '地图品牌',
  drivingfunction_roadtrafficsignrecog: '道路交通标志识别',
  drivingfunction_cruisecontrol: '定速巡航',
  drivingfunction_automaticparkingintoplace: '自动泊车入位',
  drivingfunction_satellitenavigationsystem: '卫星导航系统',
  drivingfunction_parallelaid: '并线辅助',
  drivingfunction_navigationtrafficinfo: '导航路况信息',
  drivingfunction_remotesummon: '远程召唤',
  drivingfunction_trackingreverse: '轨迹倒车',
  drivingfunction_trafficlightrecog: '交通灯识别',
  drivingfunction_remoteparking: '远程泊车',
  drivingfunction_memoryparking: '记忆泊车',
  drivingfunction_driverassistancesystem: '驾驶辅助系统',

  intelligentconfig_appremote: 'APP远程控制',
  intelligentconfig_internetofvehicle: '车联网',
  intelligentconfig_wifi: 'WiFi',
  intelligentconfig_4g: '4G网络',
  intelligentconfig_5g: '5G网络',
  intelligentconfig_ota: 'OTA升级',
  intelligentconfig_ktv: 'KTV',

  externalrearmirror_foldinglockingcar: '外后视镜折叠锁车',
  externalrearmirror_electricfolding: '电动折叠',
  externalrearmirror_reversingtiltdown: '倒车下翻',
  externalrearmirror_rearviewmirrormemory: '后视镜记忆',
  externalrearmirror_heatedrearviewmirror: '后视镜加热',

  drivinghardware_reversingradar: '倒车雷达',
  drivinghardware_frontparkingradar: '前驻车雷达',
  drivinghardware_millimeterwaveradarnum: '毫米波雷达数量',
  drivinghardware_camerasnum: '摄像头数量',
  drivinghardware_ultrasonicradarsnum: '超声波雷达数量',
  drivinghardware_reverseimage: '倒车影像',
  drivinghardware_lidarnum: '激光雷达数量',
  drivinghardware_lidarbrand: '激光雷达品牌',
  drivinghardware_lidarlinenum: '激光雷达线数',
  drivinghardware_camerasnumincar: '车内摄像头数量',
  drivinghardware_frontperceptioncamera: '前感知摄像头',
  drivinghardware_frontperceptioncamerapixel: '前感知摄像头像素',
  drivinghardware_surroundviewcamerapixel: '环视摄像头像素',
  drivinghardware_transparentchassis: '透明底盘',

  chassissteer_rearsuspensiontype: '后悬挂类型',
  chassissteer_centerdifferentiallock: '中央差速器锁',
  chassissteer_frontbraketype: '前制动类型',
  chassissteer_fourwheeldrive: '四驱',
  chassissteer_powersteering: '转向助力',
  chassissteer_parkingbraketype: '驻车制动类型',
  chassissteer_bodystructure: '车体结构',
  chassissteer_rearbraketype: '后制动类型',
  chassissteer_frontsuspensiontype: '前悬挂类型',
  chassissteer_airsuspension: '空气悬挂',
  chassissteer_adjustablesuspension: '可调悬挂',
  chassissteer_chassis: '底盘',

  sunroofglass_sunvisormirror: '遮阳板化妆镜',
  sunroofglass_antipinchwindow: '车窗防夹',
  sunroofglass_onetouchwindowlifting: '一键升降窗',
  sunroofglass_rearwindowsunshade: '后窗遮阳帘',
  sunroofglass_skylightopeningmode: '天窗开启方式',
  sunroofglass_sidewindowsoundproofglass: '侧窗隔音玻璃',
  sunroofglass_rearwiper: '后雨刮',
  sunroofglass_privacyglass: '隐私玻璃',
  sunroofglass_sensingwiper: '感应雨刮',

  electricmotor_frontmaxpower: '前电机最大功率',
  electricmotor_motorpower: '电机功率',
  electricmotor_batterycapacity: '电池容量',
  electricmotor_motormaxhorsepower: '电机最大马力',
  electricmotor_frontmaxtorque: '前电机最大扭矩',
  electricmotor_batterytype: '电池类型',
  electricmotor_batteryenergydensity: '电池能量密度',
  electricmotor_rearmaxtorque: '后电机最大扭矩',
  electricmotor_batterybrand: '电池品牌',
  electricmotor_motorlayout: '电机布局',
  electricmotor_motornum: '电机数量',
  electricmotor_motortype: '电机类型',
  electricmotor_motortorque: '电机扭矩',
  electricmotor_powerconsumption: '电耗',
  electricmotor_fastcharging: '快充',
  electricmotor_fastchargingpercent: '快充百分比',
  electricmotor_threeelectricwarranty: '三电质保',
  electricmotor_wltcmaxmileage: 'WLTC最大续航',
  electricmotor_wltccomprehensivemileage: 'WLTC综合续航',
  electricmotor_rearmodel: '后电机型号',
  electricmotor_rearbrand: '后电机品牌',
  electricmotor_frontmodel: '前电机型号',
  electricmotor_frontbrand: '前电机品牌',
  electricmotor_batteryfastchargetime: '电池快充时间',
  electricmotor_highvoltagecharging: '高压充电',
  electricmotor_cltccomprehensivemileage: 'CLTC综合续航',
  electricmotor_highvoltagefastcharging: '高压快充',
  electricmotor_externalacdischargepower: '外放电功率',
  electricmotor_fastchargingportlocation: '快充口位置',
  electricmotor_slowchargingportlocation: '慢充口位置',
  electricmotor_slowchargingpercent: '慢充百分比',

  activesafety_childseatfixdevice: '儿童座椅固定装置',
  activesafety_esp: '车身稳定控制',
  activesafety_tractioncontrol: '牵引力控制',
  activesafety_dooropeningwarning: '开门预警',
  activesafety_fatiguereminder: '疲劳提醒',
  activesafety_ebd: '电子制动力分配',
  activesafety_ldws: '车道偏离预警',
  activesafety_forwardcollisionwarning: '前方碰撞预警',
  activesafety_activebraking: '主动刹车',
  activesafety_abs: '防抱死制动',
  activesafety_lowspeedwarning: '低速预警',
  activesafety_roadrescue: '道路救援',
  activesafety_drivingrecorder: '行车记录仪',
  activesafety_brakeassist: '刹车辅助',
  activesafety_tirepressuremonitoring: '胎压监测',
  activesafety_safetybeltprompt: '安全带提醒',
  activesafety_rearcollisionwarning: '后方碰撞预警',
  activesafety_sentrymode: '哨兵模式',

  soundinteriorlight_audiobrand: '音响品牌',
  soundinteriorlight_interiorairlight: '内饰氛围灯',
  soundinteriorlight_speakernum: '扬声器数量',
  soundinteriorlight_readinglight: '阅读灯',
  soundinteriorlight_activeinteriorairlight: '主动内饰氛围灯',

  exteriorlight_daytimerunninglight: '日间行车灯',
  exteriorlight_adaptivehighandlowbeam: '自适应远近光灯',
  exteriorlight_headlightautomaticopen: '自动大灯',
  exteriorlight_lowbeamtype: '近光灯类型',
  exteriorlight_headlighttype: '前大灯类型',
  exteriorlight_lightfeature: '大灯功能',
  exteriorlight_headlightdelayoff: '大灯延迟关闭',
  exteriorlight_adjustableheadlight: '大灯可调',
  exteriorlight_frontfoglight: '前雾灯',

  // AdminModelDetails独有的字段标签
  logo: '图片',
  seatnum: '乘员人数',

  // 特色配置字段
  featuredconfig_configname: '配置名称',
  featuredconfig_configcontent: '配置内容',
  '4wdoffroad_towhook': '拖钩',
  gearbox_fourwheeldrive: '四驱',
  gearbox_gearshifting: '换挡方式',

  // 活跃度字段
  activity_status: '状态',
  hot_sale: '热销状态',
};

// 特定表的字段标签覆盖
export const tableSpecificLabels: Record<string, Record<string, string>> = {
  series: {
    name: '车系名',
  },
  models_jumdata: {
    name: '车型名',
  },
  model_details: {
    name: '车型名',
  },
  models: {
    name: '车型名',
  },
};

// 活跃度状态映射
export const activityStatusMap = {
  0: '正常',
  1: '不显示',
  2: '不可用',
};

// 嵌套字段标签 - 用于车型详情表的嵌套对象字段
export const nestedFieldLabels: Record<string, Record<string, string>> = {
  basic: {
    price: '厂商指导价',
    saleprice: '商家报价',
    seatnum: '乘员人数',
    mixfuelconsumption: '混合工况油耗',
    comfuelconsumption: '综合工况油耗',
    displacement: '排量',
    gearbox: '变速箱',
    geartype: '变速箱类型',
    gearnum: '档位数',
    maxspeed: '最高车速',
    officialaccelerationtime100: '官方0-100公里加速时间',
    warrantypolicy: '保修政策',
    electricfuelconsumption: '电能消耗',
    userfuelconsumption: '车主实测油耗',
    firstownerwarrantypolicy: '首任车主保修政策',
    testaccelerationtime100: '实测0-100公里加速时间',
    lowchargefuelconsumption: '低电量油耗'
  },
  body: {
    color: '车身颜色',
    len: '车长',
    width: '车宽',
    height: '车高',
    weight: '整备质量',
    fullweight: '满载质量',
    mingroundclearance: '最小离地间隙',
    maxwadingdepth: '最大涉水深度',
    approachangle: '接近角',
    departureangle: '离去角',
    rampangle: '通过角',
    fronttrack: '前轮距',
    reartrack: '后轮距',
    wheelbase: '轴距',
    minturndiameter: '最小转弯直径',
    sportpackage: '运动外观套件',
    roofluggagerack: '车顶行李箱架',
    bodytype: '车身型式',
    tooftype: '车顶型式',
    hoodtype: '车篷型式',
    doornum: '车门数',
    electricluggage: '电动行李厢',
    luggagevolume: '行李厢容积',
    luggageopenmode: '行李厢打开方式',
    inductionluggage: '感应行李厢',
    luggagemode: '行李厢盖开合方式',
    dragcoefficient: '风阻系数',
    fronttrunkvolume: '前备厢容积',
    trunkpositionmemory: '行李厢位置记忆'
  },
  drivingauxiliary: {
    reverseimage: '倒车影像',
    panoramiccamera: '全景摄像头',
    reversingradar: '倒车雷达',
    frontparkingradar: '泊车雷达',
    esp: '动态稳定控制系统',
    eps: '随速助力转向调节',
    tractioncontrol: '牵引力控制',
    hillstartassist: '上坡辅助',
    remoteparking: '遥控泊车',
    activebraking: '主动刹车/主动安全系统',
    parallelaid: '并线辅助',
    lanekeep: '车道保持',
    cruisecontrol: '定速巡航',
    nightvisionsystem: '夜视系统',
    autodriveassist: '自动驾驶辅助',
    automaticparking: '自动驻车',
    automaticparkingintoplace: '自动泊车入位',
    integralactivesteering: '整体主动转向系统',
    blindspotdetection: '盲点检测',
    fatiguereminder: '疲劳提醒',
    ebd: '电子制动力分配系统',
    brakeassist: '刹车辅助',
    ldws: '车道偏离预警系统',
    hilldescent: '陡坡缓降',
    drivemodechoose: '驾驶模式选择',
    gps: 'GPS导航系统',
    adaptivecruise: '自适应巡航',
    abs: '刹车防抱死',
    variablesteering: '可变齿比转向'
  },
  engine: {
    displacement: '排量',
    displacementml: '排量mL',
    fueltype: '燃料类型',
    fuelgrade: '燃油标号',
    fueltankcapacity: '燃油箱容积',
    environmentalstandards: '环保标准',
    fuelmethod: '供油方式',
    intakeform: '进气形式',
    model: '发动机型号',
    position: '发动机位置',
    maxhorsepower: '最大马力',
    compressionratio: '压缩比',
    integratedpower: '系统综合功率',
    maxtorque: '最大扭矩',
    maxtorquespeed: '最大扭矩转速',
    maxpower: '最大功率',
    maxpowerspeed: '最大功率转速',
    motorpower: '电动机总功率',
    frontmaxpower: '前电动机最大功率',
    rearmaxpower: '后电动机最大功率',
    modeleasyepc2: '发动机型号',
    modelsohu: '发动机型号',
    stroke: '行程',
    startstopsystem: '启停系统',
    nedcmaxmileage: 'NEDC最大续航里程',
    cltcmaxmileage: 'CLTC纯电续航',
    cylinderarrangetype: '气缸排列型式',
    cylinderheadmaterial: '缸盖材料',
    cylinderbodymaterial: '缸体材料',
    bore: '缸径',
    valvestructure: '气门结构',
    cylindernum: '气缸数',
    valvetrain: '每缸气门数',
    motornum: '驱动电机数',
    motorlayout: '电机布局',
    motortype: '电机类型',
    motormaxhorsepower: '电动机总马力',
    batterytype: '电池类型',
    batterybrand: '电芯品牌',
    motortorque: '电动机总扭矩',
    integratedtorque: '系统综合扭矩',
    frontmaxtorque: '前电动机最大扭矩',
    rearmaxtorque: '后电动机最大扭矩',
    batterycapacity: '电池容量',
    powerconsumption: '耗电量',
    maxmileage: '最大续航里程',
    batterywarranty: '电池组质保',
    batteryfastchargetime: '电池快充充电时间',
    batteryslowchargetime: '电池慢充充电时间',
    modelvin17: 'VIN码'
  },
  actualtest: {
    accelerationtime100: '加速时间'
  },
  gearbox: {
    gearnum: '档位数',
    geartype: '变速箱类型',
    gearbox: '变速箱'
  },
  chassisbrake: {
    drivemode: '驱动方式',
    chassis: '底盘型号',
    bodystructure: '车体结构',
    powersteering: '转向助力',
    centerdifferentiallock: '中央差速器锁',
    frontbraketype: '前制动类型',
    rearbraketype: '后制动类型',
    parkingbraketype: '驻车制动类型',
    adjustablesuspension: '可调悬挂',
    airsuspension: '空气悬挂',
    frontsuspensiontype: '前悬挂类型',
    rearsuspensiontype: '后悬挂类型',
    fourwdoffroad: '四驱越野',
    chassisqixiubao: '底盘球头套'
  },
  aircondrefrigerator: {
    frontairconditioning: '前排空调',
    rearairconditioning: '后排独立空调',
    reardischargeoutlet: '后排出风口',
    tempzonecontrol: '温度分区控制',
    airconditioningcontrolmode: '空调控制方式',
    carrefrigerator: '车载冰箱',
    airpurifyingdevice: '车内空气净化装置',
    fragrance: '香氛系统',
    airconditioning: '空气调节/花粉过滤'
  },
  wheel: {
    tirenum: '轮胎个数',
    fronttiresize: '前轮胎规格',
    reartiresize: '后轮胎规格',
    hubmaterial: '轮毂材料',
    sparetiretype: '备胎类型'
  },
  entcom: {
    fulllcddashboard: '全液晶仪表盘',
    consolelcdscreen: '中控台液晶屏',
    lcdscreensize: '液晶屏尺寸',
    rearlcdscreen: '后排液晶屏',
    drivingrecorder: '车载行车记录仪',
    huddisplay: 'HUD抬头数字显示',
    locationservice: '定位互动服务',
    builtinharddisk: '内置硬盘',
    bluetooth: '蓝牙系统',
    '4g': '4G',
    cd: 'CD',
    dvd: 'DVD',
    audiobrand: '音响品牌',
    speakernum: '扬声器数量',
    externalaudiointerface: '外接音源接口',
    phoneconnect: '手机互联',
    wirelesscharge: '手机无线充电',
    powersupply: '车载电源',
    luggagepowersocket: '行李厢电源接口',
    usbnum: 'USB接口数量',
    gesturecontrol: '手势控制系统',
    cartv: '车载电视',
    carapp: '车载APP应用',
    voicecontrol: '语音控制',
    roadrescue: '紧急道路救援'
  },
  doormirror: {
    headlightfeature: '大灯功能',
    autoheadlight: '自动大灯',
    externalmirrorantiglare: '外后视镜自动防眩目',
    externalmirrorfolding: '外后视镜电动折叠功能',
    externalmirroradjustment: '外后视镜电动调节',
    externalmirrormemory: '外后视镜记忆功能',
    externalmirrorheating: '外后视镜加热功能',
    externalmirrormedia: '流媒体外后视镜',
    rearviewmirrormedia: '流媒体内后视镜',
    rearviewmirrorantiglare: '内后视镜防眩目功能',
    rearmirrorwithturnlamp: '后雨刷',
    openstyle: '开门方式',
    electricpulldoor: '电动吸合门',
    electricsuctiondoor: '电吸门',
    electricslidingdoor: '电动侧滑门',
    rearsidesunshade: '后排侧遮阳帘',
    rearwindowsunshade: '后窗遮阳帘',
    privacyglass: '隐私玻璃',
    uvinterceptingglass: '防紫外线/隔热玻璃',
    sensingwiper: '感应雨刷',
    skylightstype: '天窗型式',
    skylightopeningmode: '天窗开合方式',
    electricwindow: '电动车窗',
    frontelectricwindow: '前电动车窗',
    rearelectricwindow: '后电动车窗',
    antipinchwindow: '电动窗防夹功能',
    sunvisormirror: '遮阳板化妆镜',
    roofrack: '车顶行李架',
    rearwing: '尾翼/扰流板'
  },
  seat: {
    frontseatfunction: '前排座椅功能',
    rearseatfunction: '后排座椅功能',
    seatheightadjustment: '座椅高低调节',
    electricseatmemory: '电动座椅记忆',
    driverseatelectricadjustment: '主座椅电动调节',
    driverseatadjustmentmode: '驾驶座座椅调节方式',
    frontseatheadrestadjustment: '前座椅头枕调节',
    driverseatshouldersupportadjustment: '驾驶座肩部支撑调节',
    auxiliaryseatelectricadjustment: '副座椅电动调节',
    auxiliaryseatadjustmentmode: '副驾驶座椅调节方式',
    rearseatadjustmentmode: '后排座椅调节方式',
    secondrowseatelectricadjustment: '第二排座椅电动调节',
    secondrowseatadjustment: '第二排座椅调节方式',
    sportseat: '运动座椅',
    seatmaterial: '座椅材料',
    driverseatlumbarsupportadjustment: '驾驶座腰部支撑调节',
    childseatfixdevice: '儿童安全座椅固定装置',
    seatheating: '座椅加热',
    seatventilation: '座椅通风',
    seatmassage: '座椅按摩功能',
    rearseatreclineproportion: '后排座位放倒比例',
    rearseatangleadjustment: '后排座椅角度调节',
    thirdrowseat: '第三排座椅',
    frontseatcenterarmrest: '前座中央扶手',
    rearseatcenterarmrest: '后座中央扶手',
    seatadjustablebutton: '座椅调节按钮',
    seatrecliningmethod: '座椅放倒方式',
    secondrowseatfunctions: '第二排座椅功能'
  },
  internalconfig: {
    interiorcolor: '内饰颜色',
    interiormaterial: '内饰材质',
    steeringwheelmaterial: '方向盘表面材料',
    steeringwheelmultifunction: '多功能方向盘',
    steeringwheelbeforeadjustment: '方向盘前后调节',
    steeringwheelupadjustment: '方向盘上下调节',
    steeringwheelheating: '方向盘加热',
    steeringwheelmemory: '方向盘记忆设置',
    steeringwheeladjustmentmode: '方向盘调节方式',
    steeringwheelshift: '方向盘换挡',
    rearcupholder: '后排杯架',
    supplyvoltage: '车内电源电压',
    activenoisereduction: '主动降噪',
    computerscreen: '行车电脑显示屏'
  },
  light: {
    headlighttype: '前大灯类型',
    optionalheadlighttype: '选配前大灯类型',
    headlightilluminationadjustment: '前大灯照射范围调整',
    headlightautomaticclean: '前大灯自动清洗功能',
    headlightdynamicsteering: '前大灯随动转向',
    headlightautomaticopen: '前大灯自动开闭',
    headlightdelayoff: '前大灯延时关闭',
    daytimerunninglight: '日间行车灯',
    leddaytimerunninglight: 'LED日间行车灯',
    ledtaillight: 'LED尾灯',
    lightsteeringassist: '转向辅助灯',
    headlightdimming: '会车前灯防眩目功能',
    frontfoglight: '前雾灯',
    interiorairlight: '车内氛围灯',
    readinglight: '阅读灯',
    adjustableheadlight: '前大灯可调',
    lowbeamtype: '近光灯类型'
  },
  safe: {
    airbagdrivingposition: '驾驶位安全气囊',
    airbagfrontpassenger: '副驾驶位安全气囊',
    airbagfrontside: '前排侧安全气囊',
    airbagfronthead: '前排头部气囊',
    airbagrearside: '后排侧安全气囊',
    rearcentralairbag: '后排中央气囊',
    airbagrearhead: '后排头部气囊',
    sideaircurtain: '侧安全气帘',
    airbagknee: '膝部气囊',
    safetybeltprompt: '安全带未系提示',
    seatbeltairbag: '安全带气囊',
    safetybeltlimiting: '安全带限力功能',
    safetybeltpretightening: '安全带预收紧功能',
    frontsafetybeltadjustment: '前安全带调节',
    rearsafetybelt: '后排安全带',
    brakeassist: '刹车辅助',
    tirepressuremonitoring: '胎压监测装置',
    zeropressurecontinued: '零压续行',
    keylessentry: '无钥匙进入系统',
    keylessstart: '无钥匙启动系统',
    childlock: '儿童锁',
    smartkey: '智能钥匙',
    remotekey: '遥控钥匙',
    remotecontrol: '远程遥控功能',
    engineantitheft: '发动机电子防盗',
    centrallocking: '中控门锁'
  },
  incarcharge: {
    wirelesscharge: '无线充电',
    chargingport: '充电接口',
    usbnum: 'USB数量',
    powersupply: '电源供应',
    luggagepowersocket: '行李厢电源插座'
  },
  activesafety: {
    childseatfixdevice: '儿童座椅固定装置',
    esp: '车身稳定控制',
    tractioncontrol: '牵引力控制',
    dooropeningwarning: '开门预警',
    fatiguereminder: '疲劳提醒',
    ebd: '电子制动力分配',
    ldws: '车道偏离预警',
    forwardcollisionwarning: '前方碰撞预警',
    activebraking: '主动刹车',
    abs: '防抱死制动',
    lowspeedwarning: '低速预警',
    roadrescue: '道路救援',
    drivingrecorder: '行车记录仪',
    brakeassist: '刹车辅助',
    tirepressuremonitoring: '胎压监测',
    safetybeltprompt: '安全带提醒'
  },
  drivingcontrol: {
    automaticparking: '自动驻车',
    hillstartassist: '上坡辅助',
    hilldescent: '陡坡缓降',
    airsuspension: '空气悬挂',
    energyrecovery: '能量回收',
    startstopsystem: '启停系统',
    drivemodechoose: '驾驶模式选择'
  },
  wheelbrake: {
    hubmaterial: '轮毂材料',
    parkingbraketype: '驻车制动类型',
    reartiresize: '后轮胎规格',
    fronttiresize: '前轮胎规格',
    rearbraketype: '后制动类型',
    fronttrack: '前轮距',
    frontbraketype: '前制动类型',
    reartrack: '后轮距',
    sparetiretype: '备胎类型'
  },
  appearanceantitheft: {
    remotecontrol: '远程控制',
    roofluggagerack: '车顶行李架',
    hubmaterial: '轮毂材料',
    discharge: '放电',
    engineantitheft: '发动机防盗',
    electricluggage: '电动行李厢',
    trunkpositionmemory: '行李厢位置记忆',
    batterypreheating: '电池预热',
    hiddendoorhandle: '隐藏式门把手',
    keylessentry: '无钥匙进入',
    remotekey: '遥控钥匙',
    centrallocking: '中控门锁'
  },
  color: {
    color: '车身颜色',
    interiorcolor: '内饰颜色'
  },
  screensystem: {
    wakeupwordfree: '免唤醒词',
    lcdscreensize: '液晶屏尺寸',
    seeandsay: '可见即可说',
    carsystemstorage: '车机存储',
    assistantwakeupword: '助手唤醒词',
    carintelligentchip: '车载智能芯片',
    facialrecognition: '人脸识别',
    voicecontrol: '语音控制',
    carsystemmemory: '车机内存',
    wakeupregion: '唤醒区域',
    intelligentsystem: '智能系统',
    continuousspeech: '连续对话',
    bluetooth: '蓝牙',
    phoneconnect: '手机互联',
    consolelcdscreen: '中控液晶屏'
  },
  drivingfunction: {
    lanekeep: '车道保持',
    reversesidewarning: '后方侧向预警',
    lanecentering: '车道居中',
    driverassistancelevel: '驾驶辅助级别',
    mapbrand: '地图品牌',
    roadtrafficsignrecog: '道路交通标志识别',
    cruisecontrol: '定速巡航',
    automaticparkingintoplace: '自动泊车入位',
    satellitenavigationsystem: '卫星导航系统',
    parallelaid: '并线辅助',
    navigationtrafficinfo: '导航路况信息'
  },
  intelligentconfig: {
    appremote: 'APP远程控制',
    internetofvehicle: '车联网',
    '4g': '4G网络',
    ota: 'OTA升级'
  },
  externalrearmirror: {
    foldinglockingcar: '外后视镜折叠锁车',
    electricfolding: '电动折叠',
    reversingtiltdown: '倒车下翻',
    rearviewmirrormemory: '后视镜记忆',
    heatedrearviewmirror: '后视镜加热'
  },
  drivinghardware: {
    reversingradar: '倒车雷达',
    frontparkingradar: '前驻车雷达',
    millimeterwaveradarnum: '毫米波雷达数量',
    camerasnum: '摄像头数量',
    ultrasonicradarsnum: '超声波雷达数量',
    reverseimage: '倒车影像'
  },
  chassissteer: {
    rearsuspensiontype: '后悬挂类型',
    centerdifferentiallock: '中央差速器锁',
    frontbraketype: '前制动类型',
    fourwheeldrive: '四驱',
    powersteering: '转向助力',
    parkingbraketype: '驻车制动类型',
    bodystructure: '车体结构',
    rearbraketype: '后制动类型',
    frontsuspensiontype: '前悬挂类型',
    airsuspension: '空气悬挂'
  },
  sunroofglass: {
    sunvisormirror: '遮阳板化妆镜',
    antipinchwindow: '车窗防夹',
    onetouchwindowlifting: '一键升降窗',
    rearwindowsunshade: '后窗遮阳帘',
    skylightopeningmode: '天窗开启方式',
    sidewindowsoundproofglass: '侧窗隔音玻璃',
    rearwiper: '后雨刮',
    privacyglass: '隐私玻璃',
    sensingwiper: '感应雨刮'
  },
  electricmotor: {
    frontmaxpower: '前电机最大功率',
    motorpower: '电机功率',
    batterycapacity: '电池容量',
    motormaxhorsepower: '电机最大马力',
    frontmaxtorque: '前电机最大扭矩',
    batterytype: '电池类型',
    batteryenergydensity: '电池能量密度',
    rearmaxtorque: '后电机最大扭矩',
    batterybrand: '电池品牌',
    motorlayout: '电机布局',
    fastcharging: '快充',
    motornum: '电机数量',
    fastchargingpercent: '快充百分比',
    threeelectricwarranty: '三电质保',
    wltcmaxmileage: 'WLTC最大续航',
    motortype: '电机类型',
    motortorque: '电机扭矩',
    powerconsumption: '电耗'
  },
  passivesafety: {
    airbagknee: '膝部气囊',
    airbagfrontside: '前排侧气囊',
    airbagfrontpassenger: '副驾气囊',
    airbagrearside: '后排侧气囊',
    airbagrearhead: '后排头部气囊',
    airbagdrivingposition: '驾驶位气囊'
  },
  soundinteriorlight: {
    audiobrand: '音响品牌',
    interiorairlight: '内饰氛围灯',
    speakernum: '扬声器数量',
    readinglight: '阅读灯'
  },
  exteriorlight: {
    adjustableheadlight: '可调大灯',
    headlighttype: '大灯类型',
    headlightdelayoff: '大灯延时关闭',
    daytimerunninglight: '日间行车灯',
    frontfoglight: '前雾灯',
    lowbeamtype: '近光灯类型',
    lightsteeringassist: '转向辅助灯',
    adaptivehighandlowbeam: '自适应远近光灯',
    headlightautomaticopen: '自动大灯'
  }
};

// 获取字段显示名称（支持嵌套字段和表特定标签）
export function getFieldLabel(field: string, parentKey?: string, tableName?: string): string {
  if (parentKey && nestedFieldLabels[parentKey]?.[field]) {
    return nestedFieldLabels[parentKey][field];
  }
  if (tableName && tableSpecificLabels[tableName]?.[field]) {
    return tableSpecificLabels[tableName][field];
  }
  return fieldLabels[field] || field;
}
// model_details 字段分组配置
export const modelDetailsFieldGroups = {
  '基础信息': ['id', 'jm_id', 'model_jm_id', 'model_id', 'series_jm_id', 'series_id', 'brand_jm_id', 'brand_id', 'brand_name', 'series_name', 'name', 'brandname', 'parentname', 'parentid', 'groupid', 'groupname', 'sizetype', 'displacement', 'displacement2', 'drivemode', 'drivemode2', 'geartype', 'geartype2', 'gearnum', 'compartnum', 'isnev', 'yeartype', 'listdate', 'price', 'logo_url', 'initial', 'productionstate', 'salestate', 'depth', 'activity_status', 'hot_sale'],
  '基本配置': ['basic_price', 'basic_saleprice', 'basic_seatnum', 'basic_mixfuelconsumption', 'basic_comfuelconsumption', 'basic_displacement', 'basic_gearbox', 'basic_geartype', 'basic_gearnum', 'basic_maxspeed', 'basic_officialaccelerationtime100', 'basic_warrantypolicy', 'basic_electricfuelconsumption', 'basic_userfuelconsumption', 'basic_firstownerwarrantypolicy', 'basic_testaccelerationtime100', 'basic_lowchargefuelconsumption'],
  '车身配置': ['body_color', 'body_len', 'body_width', 'body_height', 'body_weight', 'body_fullweight', 'body_mingroundclearance', 'body_maxwadingdepth', 'body_approachangle', 'body_departureangle', 'body_rampangle', 'body_fronttrack', 'body_reartrack', 'body_wheelbase', 'body_minturndiameter', 'body_sportpackage', 'body_roofluggagerack', 'body_bodytype', 'body_tooftype', 'body_hoodtype', 'body_doornum', 'body_electricluggage', 'body_luggagevolume', 'body_luggageopenmode', 'body_inductionluggage', 'body_luggagemode', 'body_dragcoefficient', 'body_fronttrunkvolume', 'body_trunkpositionmemory'],
  '发动机/电机': ['engine_displacement', 'engine_displacementml', 'engine_fueltype', 'engine_fuelgrade', 'engine_fueltankcapacity', 'engine_environmentalstandards', 'engine_fuelmethod', 'engine_intakeform', 'engine_model', 'engine_position', 'engine_maxhorsepower', 'engine_compressionratio', 'engine_integratedpower', 'engine_maxtorque', 'engine_maxtorquespeed', 'engine_maxpower', 'engine_maxpowerspeed', 'engine_motorpower', 'engine_frontmaxpower', 'engine_rearmaxpower', 'engine_modeleasyepc2', 'engine_modelsohu', 'engine_stroke', 'engine_startstopsystem', 'engine_nedcmaxmileage', 'engine_cltcmaxmileage', 'engine_cylinderarrangetype', 'engine_cylinderheadmaterial', 'engine_cylinderbodymaterial', 'engine_bore', 'engine_valvestructure', 'engine_cylindernum', 'engine_valvetrain', 'engine_motornum', 'engine_motorlayout', 'engine_motortype', 'engine_motormaxhorsepower', 'engine_batterytype', 'engine_batterybrand', 'engine_motortorque', 'engine_integratedtorque', 'engine_frontmaxtorque', 'engine_rearmaxtorque', 'engine_batterycapacity', 'engine_powerconsumption', 'engine_maxmileage', 'engine_batterywarranty', 'engine_batteryfastchargetime', 'engine_batteryslowchargetime', 'engine_modelvin17'],
  '电机配置': ['electricmotor_frontmaxpower', 'electricmotor_motorpower', 'electricmotor_batterycapacity', 'electricmotor_motormaxhorsepower', 'electricmotor_frontmaxtorque', 'electricmotor_batterytype', 'electricmotor_batteryenergydensity', 'electricmotor_rearmaxtorque', 'electricmotor_batterybrand', 'electricmotor_motorlayout', 'electricmotor_fastcharging', 'electricmotor_fastchargingpercent', 'electricmotor_threeelectricwarranty', 'electricmotor_wltcmaxmileage', 'electricmotor_motortype', 'electricmotor_motortorque', 'electricmotor_powerconsumption', 'electricmotor_wltccomprehensivemileage', 'electricmotor_rearmodel', 'electricmotor_rearbrand', 'electricmotor_frontmodel', 'electricmotor_frontbrand', 'electricmotor_batteryfastchargetime', 'electricmotor_highvoltagecharging', 'electricmotor_cltccomprehensivemileage', 'electricmotor_highvoltagefastcharging', 'electricmotor_externalacdischargepower', 'electricmotor_fastchargingportlocation', 'electricmotor_slowchargingportlocation', 'electricmotor_slowchargingpercent', 'electricmotor_motornum'],
  '实际测试': ['actualtest_accelerationtime100'],
  '变速箱': ['gearbox_gearnum', 'gearbox_geartype', 'gearbox_gearbox', 'gearbox_fourwheeldrive', 'gearbox_gearshifting'],
  '底盘制动': ['chassisbrake_drivemode', 'chassisbrake_chassis', 'chassisbrake_bodystructure', 'chassisbrake_powersteering', 'chassisbrake_centerdifferentiallock', 'chassisbrake_frontbraketype', 'chassisbrake_rearbraketype', 'chassisbrake_parkingbraketype', 'chassisbrake_adjustablesuspension', 'chassisbrake_airsuspension', 'chassisbrake_frontsuspensiontype', 'chassisbrake_rearsuspensiontype', 'chassisbrake_fourwdoffroad', 'chassisbrake_chassisqixiubao', 'chassissteer_rearsuspensiontype', 'chassissteer_centerdifferentiallock', 'chassissteer_frontbraketype', 'chassissteer_fourwheeldrive', 'chassissteer_powersteering', 'chassissteer_parkingbraketype', 'chassissteer_bodystructure', 'chassissteer_rearbraketype', 'chassissteer_frontsuspensiontype', 'chassissteer_airsuspension', 'chassissteer_adjustablesuspension', 'chassissteer_chassis', 'wheelbrake_hubmaterial', 'wheelbrake_parkingbraketype', 'wheelbrake_reartiresize', 'wheelbrake_fronttiresize', 'wheelbrake_rearbraketype', 'wheelbrake_fronttrack', 'wheelbrake_frontbraketype', 'wheelbrake_reartrack', 'wheelbrake_sparetiretype'],
  '车轮': ['wheel_tirenum', 'wheel_fronttiresize', 'wheel_reartiresize', 'wheel_hubmaterial', 'wheel_sparetiretype'],
  '驾驶辅助': ['drivingauxiliary_reverseimage', 'drivingauxiliary_panoramiccamera', 'drivingauxiliary_reversingradar', 'drivingauxiliary_frontparkingradar', 'drivingauxiliary_esp', 'drivingauxiliary_eps', 'drivingauxiliary_tractioncontrol', 'drivingauxiliary_hillstartassist', 'drivingauxiliary_remoteparking', 'drivingauxiliary_activebraking', 'drivingauxiliary_parallelaid', 'drivingauxiliary_lanekeep', 'drivingauxiliary_cruisecontrol', 'drivingauxiliary_nightvisionsystem', 'drivingauxiliary_autodriveassist', 'drivingauxiliary_automaticparking', 'drivingauxiliary_automaticparkingintoplace', 'drivingauxiliary_integralactivesteering', 'drivingauxiliary_blindspotdetection', 'drivingauxiliary_fatiguereminder', 'drivingauxiliary_ebd', 'drivingauxiliary_brakeassist', 'drivingauxiliary_ldws', 'drivingauxiliary_hilldescent', 'drivingauxiliary_drivemodechoose', 'drivingauxiliary_gps', 'drivingauxiliary_adaptivecruise', 'drivingauxiliary_abs', 'drivingauxiliary_variablesteering', 'drivingcontrol_automaticparking', 'drivingcontrol_hillstartassist', 'drivingcontrol_hilldescent', 'drivingcontrol_airsuspension', 'drivingcontrol_energyrecovery', 'drivingcontrol_startstopsystem', 'drivingcontrol_drivemodechoose', 'drivingcontrol_adjustablesuspension', 'drivingfunction_lanekeep', 'drivingfunction_reversesidewarning', 'drivingfunction_lanecentering', 'drivingfunction_driverassistancelevel', 'drivingfunction_mapbrand', 'drivingfunction_roadtrafficsignrecog', 'drivingfunction_cruisecontrol', 'drivingfunction_automaticparkingintoplace', 'drivingfunction_satellitenavigationsystem', 'drivingfunction_parallelaid', 'drivingfunction_navigationtrafficinfo', 'drivingfunction_remotesummon', 'drivingfunction_trackingreverse', 'drivingfunction_trafficlightrecog', 'drivingfunction_remoteparking', 'drivingfunction_memoryparking', 'drivingfunction_driverassistancesystem'],
  '驾驶硬件': ['drivinghardware_reversingradar', 'drivinghardware_frontparkingradar', 'drivinghardware_millimeterwaveradarnum', 'drivinghardware_camerasnum', 'drivinghardware_ultrasonicradarsnum', 'drivinghardware_reverseimage', 'drivinghardware_lidarnum', 'drivinghardware_lidarbrand', 'drivinghardware_lidarlinenum', 'drivinghardware_camerasnumincar', 'drivinghardware_frontperceptioncamera', 'drivinghardware_frontperceptioncamerapixel', 'drivinghardware_surroundviewcamerapixel', 'drivinghardware_transparentchassis'],
  '空调冰箱': ['aircondrefrigerator_frontairconditioning', 'aircondrefrigerator_rearairconditioning', 'aircondrefrigerator_reardischargeoutlet', 'aircondrefrigerator_tempzonecontrol', 'aircondrefrigerator_airconditioningcontrolmode', 'aircondrefrigerator_carrefrigerator', 'aircondrefrigerator_airpurifyingdevice', 'aircondrefrigerator_fragrance', 'aircondrefrigerator_airconditioning'],
  '娱乐通讯': ['entcom_fulllcddashboard', 'entcom_consolelcdscreen', 'entcom_lcdscreensize', 'entcom_rearlcdscreen', 'entcom_drivingrecorder', 'entcom_huddisplay', 'entcom_locationservice', 'entcom_builtinharddisk', 'entcom_bluetooth', 'entcom_4g', 'entcom_cd', 'entcom_dvd', 'entcom_audiobrand', 'entcom_speakernum', 'entcom_externalaudiointerface', 'entcom_phoneconnect', 'entcom_wirelesscharge', 'entcom_powersupply', 'entcom_luggagepowersocket', 'entcom_usbnum', 'entcom_gesturecontrol', 'entcom_cartv', 'entcom_carapp', 'entcom_voicecontrol', 'entcom_roadrescue'],
  '屏幕系统': ['screensystem_wakeupwordfree', 'screensystem_lcdscreensize', 'screensystem_seeandsay', 'screensystem_carsystemstorage', 'screensystem_assistantwakeupword', 'screensystem_carintelligentchip', 'screensystem_facialrecognition', 'screensystem_voicecontrol', 'screensystem_carsystemmemory', 'screensystem_wakeupregion', 'screensystem_intelligentsystem', 'screensystem_continuousspeech', 'screensystem_bluetooth', 'screensystem_phoneconnect', 'screensystem_consolelcdscreen', 'screensystem_privacyshield', 'screensystem_multifingerscreen', 'screensystem_carapp', 'screensystem_voiceprintrecognition', 'screensystem_rearmultimediacontrol', 'screensystem_passengerscreentype', 'screensystem_entertainmentscreensize'],
  '门窗后视镜': ['doormirror_headlightfeature', 'doormirror_autoheadlight', 'doormirror_externalmirrorantiglare', 'doormirror_externalmirrorfolding', 'doormirror_externalmirroradjustment', 'doormirror_externalmirrormemory', 'doormirror_externalmirrorheating', 'doormirror_externalmirrormedia', 'doormirror_rearviewmirrormedia', 'doormirror_rearviewmirrorantiglare', 'doormirror_rearmirrorwithturnlamp', 'doormirror_openstyle', 'doormirror_electricpulldoor', 'doormirror_electricsuctiondoor', 'doormirror_electricslidingdoor', 'doormirror_rearsidesunshade', 'doormirror_rearwindowsunshade', 'doormirror_privacyglass', 'doormirror_uvinterceptingglass', 'doormirror_sensingwiper', 'doormirror_skylightstype', 'doormirror_skylightopeningmode', 'doormirror_electricwindow', 'doormirror_frontelectricwindow', 'doormirror_rearelectricwindow', 'doormirror_antipinchwindow', 'doormirror_sunvisormirror', 'doormirror_roofrack', 'doormirror_rearwing', 'externalrearmirror_foldinglockingcar', 'externalrearmirror_electricfolding', 'externalrearmirror_reversingtiltdown', 'externalrearmirror_rearviewmirrormemory', 'externalrearmirror_heatedrearviewmirror'],
  '天窗玻璃': ['sunroofglass_sunvisormirror', 'sunroofglass_antipinchwindow', 'sunroofglass_onetouchwindowlifting', 'sunroofglass_rearwindowsunshade', 'sunroofglass_skylightopeningmode', 'sunroofglass_sidewindowsoundproofglass', 'sunroofglass_rearwiper', 'sunroofglass_privacyglass', 'sunroofglass_sensingwiper'],
  '座椅': ['seat_frontseatfunction', 'seat_rearseatfunction', 'seat_seatheightadjustment', 'seat_electricseatmemory', 'seat_driverseatelectricadjustment', 'seat_driverseatadjustmentmode', 'seat_frontseatheadrestadjustment', 'seat_driverseatshouldersupportadjustment', 'seat_auxiliaryseatelectricadjustment', 'seat_auxiliaryseatadjustmentmode', 'seat_rearseatadjustmentmode', 'seat_secondrowseatelectricadjustment', 'seat_secondrowseatadjustment', 'seat_sportseat', 'seat_seatmaterial', 'seat_driverseatlumbarsupportadjustment', 'seat_childseatfixdevice', 'seat_seatheating', 'seat_seatventilation', 'seat_seatmassage', 'seat_rearseatreclineproportion', 'seat_rearseatangleadjustment', 'seat_thirdrowseat', 'seat_frontseatcenterarmrest', 'seat_rearseatcenterarmrest', 'seat_seatadjustablebutton', 'seat_seatrecliningmethod', 'seat_secondrowseatfunctions'],
  '内部配置': ['internalconfig_interiorcolor', 'internalconfig_interiormaterial', 'internalconfig_steeringwheelmaterial', 'internalconfig_steeringwheelmultifunction', 'internalconfig_steeringwheelbeforeadjustment', 'internalconfig_steeringwheelupadjustment', 'internalconfig_steeringwheelheating', 'internalconfig_steeringwheelmemory', 'internalconfig_steeringwheeladjustmentmode', 'internalconfig_steeringwheelshift', 'internalconfig_rearcupholder', 'internalconfig_supplyvoltage', 'internalconfig_activenoisereduction', 'internalconfig_computerscreen'],
  '灯光': ['light_headlighttype', 'light_optionalheadlighttype', 'light_headlightilluminationadjustment', 'light_headlightautomaticclean', 'light_headlightdynamicsteering', 'light_headlightautomaticopen', 'light_headlightdelayoff', 'light_daytimerunninglight', 'light_leddaytimerunninglight', 'light_ledtaillight', 'light_lightsteeringassist', 'light_headlightdimming', 'light_frontfoglight', 'light_interiorairlight', 'light_readinglight', 'light_adjustableheadlight', 'light_lowbeamtype', 'exteriorlight_daytimerunninglight', 'exteriorlight_adaptivehighandlowbeam', 'exteriorlight_headlightautomaticopen', 'exteriorlight_lowbeamtype', 'exteriorlight_headlighttype', 'exteriorlight_lightfeature', 'exteriorlight_headlightdelayoff', 'exteriorlight_adjustableheadlight', 'exteriorlight_frontfoglight'],
  '安全': ['safe_airbagdrivingposition', 'safe_airbagfrontpassenger', 'safe_airbagfrontside', 'safe_airbagfronthead', 'safe_airbagrearside', 'safe_rearcentralairbag', 'safe_airbagrearhead', 'safe_sideaircurtain', 'safe_airbagknee', 'safe_safetybeltprompt', 'safe_seatbeltairbag', 'safe_safetybeltlimiting', 'safe_safetybeltpretightening', 'safe_frontsafetybeltadjustment', 'safe_rearsafetybelt', 'safe_brakeassist', 'safe_tirepressuremonitoring', 'safe_zeropressurecontinued', 'safe_keylessentry', 'safe_keylessstart', 'safe_childlock', 'safe_smartkey', 'safe_remotekey', 'safe_remotecontrol', 'safe_engineantitheft', 'safe_centrallocking'],
  '被动安全': ['passivesafety_childseatfixdevice', 'passivesafety_esp', 'passivesafety_tractioncontrol', 'passivesafety_dooropeningwarning', 'passivesafety_fatiguereminder', 'passivesafety_ebd', 'passivesafety_ldws', 'passivesafety_forwardcollisionwarning', 'passivesafety_activebraking', 'passivesafety_abs', 'passivesafety_lowspeedwarning', 'passivesafety_roadrescue', 'passivesafety_drivingrecorder', 'passivesafety_brakeassist', 'passivesafety_tirepressuremonitoring', 'passivesafety_safetybeltprompt', 'passivesafety_rearcollisionwarning', 'passivesafety_sentrymode'],
  '主动安全': ['activesafety_childseatfixdevice', 'activesafety_esp', 'activesafety_tractioncontrol', 'activesafety_dooropeningwarning', 'activesafety_fatiguereminder', 'activesafety_ebd', 'activesafety_ldws', 'activesafety_forwardcollisionwarning', 'activesafety_activebraking', 'activesafety_abs', 'activesafety_lowspeedwarning', 'activesafety_roadrescue', 'activesafety_drivingrecorder', 'activesafety_brakeassist', 'activesafety_tirepressuremonitoring', 'activesafety_safetybeltprompt', 'activesafety_rearcollisionwarning', 'activesafety_sentrymode'],
  '车载充电': ['incarcharge_wirelesscharge', 'incarcharge_chargingport', 'incarcharge_usbnum', 'incarcharge_powersupply', 'incarcharge_luggagepowersocket', 'incarcharge_usbmaxchargingpower', 'incarcharge_phonewirelesschargingpower'],
  '外观防盗': ['appearanceantitheft_remotecontrol', 'appearanceantitheft_roofluggagerack', 'appearanceantitheft_hubmaterial', 'appearanceantitheft_discharge', 'appearanceantitheft_engineantitheft', 'appearanceantitheft_electricluggage', 'appearanceantitheft_trunkpositionmemory', 'appearanceantitheft_batterypreheating', 'appearanceantitheft_hiddendoorhandle', 'appearanceantitheft_keylessentry', 'appearanceantitheft_remotekey', 'appearanceantitheft_centrallocking', 'appearanceantitheft_electricpulldoor', 'appearanceantitheft_sidepedal', 'appearanceantitheft_activeclosedgrille'],
  '颜色': ['color_color', 'color_interiorcolor'],
  '智能配置': ['intelligentconfig_appremote', 'intelligentconfig_internetofvehicle', 'intelligentconfig_wifi', 'intelligentconfig_4g', 'intelligentconfig_5g', 'intelligentconfig_ota', 'intelligentconfig_ktv'],
  '音响内饰灯': ['soundinteriorlight_audiobrand', 'soundinteriorlight_interiorairlight', 'soundinteriorlight_speakernum', 'soundinteriorlight_readinglight', 'soundinteriorlight_activeinteriorairlight'],
  '特色配置': ['featuredconfig_configname', 'featuredconfig_configcontent', '4wdoffroad_towhook', '4wdoffroad', 'fourwdoffroad'],
  '系统字段': ['created_at', 'updated_at']
};

// 获取所有 model_details 字段（展平分组）
export function getAllModelDetailsFields(): string[] {
  const fields: string[] = ['brand_name', 'series_name'];
  Object.values(modelDetailsFieldGroups).forEach(groupFields => {
    fields.push(...groupFields);
  });
  return [...new Set(fields)];
}

// 将 API 返回的嵌套对象转换为展平的数据库字段
export function flattenApiData(apiData: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};

  // 处理基础字段
  const basicMappings: Record<string, string> = {
    'id': 'jm_id',
    'logo': 'logo_url'
  };

  for (const [key, value] of Object.entries(apiData)) {
    if (value !== null && value !== undefined && typeof value !== 'object' && !Array.isArray(value)) {
      const dbKey = basicMappings[key] || key;
      result[dbKey] = value;
    }
  }

  // 处理嵌套对象
  for (const [prefix, value] of Object.entries(apiData)) {
    if (value !== null && value !== undefined && typeof value === 'object' && !Array.isArray(value)) {
      // 特殊处理 featuredconfig
      if (prefix === 'featuredconfig') {
        result['featuredconfig'] = value;
        // 也处理内部字段
        for (const [subKey, subValue] of Object.entries(value)) {
          if (subValue !== null && subValue !== undefined && typeof subValue !== 'object' && !Array.isArray(subValue)) {
            result[`featuredconfig_${subKey}`] = subValue;
          }
        }
        continue;
      }

      // 特殊处理 4wdoffroad
      if (prefix === '4wdoffroad') {
        result['fourwdoffroad'] = value;
        // 也处理内部字段
        for (const [subKey, subValue] of Object.entries(value)) {
          if (subValue !== null && subValue !== undefined && typeof subValue !== 'object' && !Array.isArray(subValue)) {
            result[`fourwdoffroad_${subKey}`] = subValue;
          }
        }
        continue;
      }

      // 常规嵌套对象
      for (const [subKey, subValue] of Object.entries(value)) {
        if (subValue !== null && subValue !== undefined && typeof subValue !== 'object' && !Array.isArray(subValue)) {
          result[`${prefix}_${subKey}`] = subValue;
        }
      }
    }
  }

  return result;
}

// 将展平的数据库字段转换为嵌套对象结构
export function buildNestedObject(data: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  const basicFields = ['id', 'jm_id', 'model_jm_id', 'model_id', 'series_jm_id', 'series_id', 'brand_jm_id', 'brand_id',
    'name', 'brandname', 'parentname', 'parentid', 'groupid', 'groupname', 'sizetype', 'displacement', 'displacement2',
    'drivemode', 'drivemode2', 'geartype', 'geartype2', 'logo_url', 'initial', 'productionstate', 'salestate',
    'yeartype', 'listdate', 'price', 'activity_status', 'created_at', 'updated_at', 'seatnum', 'gearnum',
    'compartnum', 'isnev', 'environmentalstandards', 'environmentalstandards2'];

  // 处理基础字段
  for (const field of basicFields) {
    if (field in data && data[field] !== null && data[field] !== undefined) {
      // 特殊处理 logo_url → logo
      if (field === 'logo_url') {
        result.logo = data[field];
      } else {
        result[field] = data[field];
      }
    }
  }

  // 处理嵌套字段
  const prefixes = ['basic', 'body', 'engine', 'actualtest', 'gearbox', 'chassisbrake',
    'aircondrefrigerator', 'wheel', 'entcom', 'doormirror', 'seat', 'internalconfig', 'light',
    'safe', 'incarcharge', 'drivingcontrol', 'appearanceantitheft', 'color', 'intelligentconfig',
    'drivinghardware', 'drivingauxiliary', 'drivingfunction', 'screensystem', 'electricmotor',
    'passivesafety', 'activesafety', 'soundinteriorlight', 'exteriorlight', 'externalrearmirror',
    'chassissteer', 'wheelbrake', 'sunroofglass', 'featuredconfig', 'fourwdoffroad'];

  for (const prefix of prefixes) {
    const prefixWithUnderscore = prefix + '_';
    const nestedObj: Record<string, any> = {};
    let hasValues = false;

    for (const [key, value] of Object.entries(data)) {
      if (key.startsWith(prefixWithUnderscore)) {
        const subKey = key.slice(prefixWithUnderscore.length);
        if (value !== null && value !== undefined && value !== '') {
          nestedObj[subKey] = value;
          hasValues = true;
        }
      }
    }

    // 特殊处理 featuredconfig 字段（可能有顶层字段）
    if (prefix === 'featuredconfig') {
      if ('featuredconfig' in data && data.featuredconfig !== null && data.featuredconfig !== undefined) {
        hasValues = true;
      }
    }

    // 特殊处理 4wdoffroad
    if (prefix === 'fourwdoffroad') {
      if ('fourwdoffroad' in data && data.fourwdoffroad !== null && data.fourwdoffroad !== undefined) {
        hasValues = true;
      }
    }

    if (hasValues) {
      // 特殊处理 fourwdoffroad → 4wdoffroad
      const finalKey = prefix === 'fourwdoffroad' ? '4wdoffroad' : prefix;
      result[finalKey] = nestedObj;

      // 特殊处理顶层字段
      if (prefix === 'featuredconfig' && 'featuredconfig' in data) {
        if (data.featuredconfig !== null && data.featuredconfig !== undefined) {
          result['featuredconfig'] = data.featuredconfig;
        }
      }
    }
  }

  return result;
}

export const tableFieldConfigs = {
  brands: [
    'id', 'jm_id', 'name', 'initial', 'logo_url', 'parent_id', 'depth', 'activity_status', 'created_at', 'updated_at'
  ],
  series: [
    'id', 'jm_id', 'brand_jm_id', 'brand_id', 'brand_name', 'name', 'fullname', 'initial', 'logo_url', 'salestate', 'depth',
    'subcompany_name', 'subcompany_jm_id', 'activity_status', 'created_at', 'updated_at'
  ],
  models_jumdata: [
    'id', 'jm_id', 'series_jm_id', 'series_id', 'series_name', 'brand_jm_id', 'brand_id', 'brand_name', 'name', 'groupid', 'groupname',
    'sizetype', 'displacement2', 'displacement', 'geartype', 'geartype2', 'logo_url', 'yeartype', 'listdate',
    'price', 'salestate', 'depth', 'activity_status', 'created_at', 'updated_at'
  ],
  model_details: getAllModelDetailsFields(),
  models: [
    'name', 'brand', 'year', 'activity_status', 'id', 'slug', 'vehicle_class', 'energy_type', 'fob_price_min',
    'fob_price_max', 'currency', 'is_hot', 'is_active', 'manufacturer', 'level', 'cltc_range', 'charging_time_fast',
    'charging_time_slow', 'fast_charge_percentage', 'motor_type', 'transmission', 'motor_horsepower',
    'motor_total_power', 'motor_total_torque', 'body_type', 'length_mm', 'width_mm', 'height_mm', 'wheelbase_mm',
    'max_speed', 'acceleration_0_100', 'created_at', 'updated_at'
  ]
};

// 获取活跃度显示文本
export function getActivityStatusLabel(status: number): string {
  return activityStatusMap[status] || '未知';
}

// 获取活跃度状态的颜色
export function getActivityStatusColor(status: number): string {
  switch (status) {
    case 0:
      return 'text-green-700 bg-green-100';
    case 1:
      return 'text-yellow-700 bg-yellow-100';
    case 2:
      return 'text-red-700 bg-red-100';
    default:
      return 'text-gray-700 bg-gray-100';
  }
}

// 从嵌套对象中获取展平的字段值（如 basic_price 从 basic: { price: xxx } 中获取）
export function getNestedFieldValue(rawData: Record<string, any>, field: string): any {
  if (!rawData) return undefined;

  // 检查是否是嵌套字段（格式如 prefix_subfield）
  const underscoreIndex = field.indexOf('_');
  if (underscoreIndex > 0) {
    const prefix = field.substring(0, underscoreIndex);
    const subKey = field.substring(underscoreIndex + 1);

    if (rawData[prefix] && typeof rawData[prefix] === 'object' && !Array.isArray(rawData[prefix])) {
      return (rawData[prefix] as Record<string, any>)[subKey];
    }
  }

  // 处理 featuredconfig 和 4wdoffroad 的特殊情况
  if (field === 'featuredconfig' || field === 'fourwdoffroad') {
    return rawData[field];
  }

  return undefined;
}
