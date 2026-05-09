import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";

const fieldLabels: Record<string, string> = {
  id: "车型id",
  name: "车型名称",
  brandname: "品牌名称",
  parentname: "车系名称",
  parentid: "车系id",
  groupid: "车型分组ID",
  groupname: "车型分组",
  environmentalstandards: "环保标准",
  environmentalstandards2: "环保标准数字",
  displacement: "排量",
  displacement2: "排量数字",
  drivemode: "驱动方式",
  drivemode2: "驱动方式数字",
  sizetype: "尺寸类型",
  price: "厂商指导价",
  logo: "图片",
  initial: "品牌首字母",
  productionstate: "生产状态",
  salestate: "销售状态",
  yeartype: "年款",
  listdate: "上市日期",
  seatnum: "乘员人数",
  depth: "层级",
  geartype: "变速箱类型",
  geartype2: "变速箱类型数字",
  gearnum: "档位数",
  compartnum: "车厢数",
  isnev: "是否新能源",
  basic: "基本信息",
  body: "车体",
  drivingauxiliary: "行车辅助",
  engine: "发动机",
  actualtest: "实际测试",
  gearbox: "变速箱",
  chassisbrake: "底盘制动",
  aircondrefrigerator: "空调/冰箱",
  wheel: "车轮",
  entcom: "娱乐通讯",
  doormirror: "门窗/后视镜",
  seat: "座椅",
  internalconfig: "内部配置",
  light: "灯光",
  safe: "安全配置",
  incarcharge: "车载充电",
  "4wdoffroad": "四驱越野",
  activesafety: "主动安全",
  drivingcontrol: "驾驶控制",
  wheelbrake: "车轮制动",
  appearanceantitheft: "外观防盗",
  color: "颜色",
  screensystem: "屏幕系统",
  drivingfunction: "驾驶功能",
  intelligentconfig: "智能配置",
  externalrearmirror: "外后视镜",
  drivinghardware: "驾驶硬件",
  chassissteer: "底盘转向",
  sunroofglass: "天窗玻璃",
  electricmotor: "电机",
  passivesafety: "被动安全",
  soundinteriorlight: "音响内饰灯",
  exteriorlight: "外部灯光"
};

const nestedFieldLabels: Record<string, Record<string, string>> = {
  basic: {
    price: "厂商指导价",
    saleprice: "商家报价",
    seatnum: "乘员人数",
    mixfuelconsumption: "混合工况油耗",
    comfuelconsumption: "综合工况油耗",
    displacement: "排量",
    gearbox: "变速箱",
    geartype: "变速箱类型",
    gearnum: "档位数",
    maxspeed: "最高车速",
    officialaccelerationtime100: "官方0-100公里加速时间",
    warrantypolicy: "保修政策",
    electricfuelconsumption: "电能消耗",
    userfuelconsumption: "车主实测油耗",
    firstownerwarrantypolicy: "首任车主保修政策",
    testaccelerationtime100: "实测0-100公里加速时间",
    lowchargefuelconsumption: "低电量油耗"
  },
  body: {
    color: "车身颜色",
    len: "车长",
    width: "车宽",
    height: "车高",
    weight: "整备质量",
    fullweight: "满载质量",
    mingroundclearance: "最小离地间隙",
    maxwadingdepth: "最大涉水深度",
    approachangle: "接近角",
    departureangle: "离去角",
    rampangle: "通过角",
    fronttrack: "前轮距",
    reartrack: "后轮距",
    wheelbase: "轴距",
    minturndiameter: "最小转弯直径",
    sportpackage: "运动外观套件",
    roofluggagerack: "车顶行李箱架",
    bodytype: "车身型式",
    tooftype: "车顶型式",
    hoodtype: "车篷型式",
    doornum: "车门数",
    electricluggage: "电动行李厢",
    luggagevolume: "行李厢容积",
    luggageopenmode: "行李厢打开方式",
    inductionluggage: "感应行李厢",
    luggagemode: "行李厢盖开合方式",
    dragcoefficient: "风阻系数",
    fronttrunkvolume: "前备厢容积",
    trunkpositionmemory: "行李厢位置记忆"
  },
  drivingauxiliary: {
    reverseimage: "倒车影像",
    panoramiccamera: "全景摄像头",
    reversingradar: "倒车雷达",
    frontparkingradar: "泊车雷达",
    esp: "动态稳定控制系统",
    eps: "随速助力转向调节",
    tractioncontrol: "牵引力控制",
    hillstartassist: "上坡辅助",
    remoteparking: "遥控泊车",
    activebraking: "主动刹车/主动安全系统",
    parallelaid: "并线辅助",
    lanekeep: "车道保持",
    cruisecontrol: "定速巡航",
    nightvisionsystem: "夜视系统",
    autodriveassist: "自动驾驶辅助",
    automaticparking: "自动驻车",
    automaticparkingintoplace: "自动泊车入位",
    integralactivesteering: "整体主动转向系统",
    blindspotdetection: "盲点检测",
    fatiguereminder: "疲劳提醒",
    ebd: "电子制动力分配系统",
    brakeassist: "刹车辅助",
    ldws: "车道偏离预警系统",
    hilldescent: "陡坡缓降",
    drivemodechoose: "驾驶模式选择",
    gps: "GPS导航系统",
    adaptivecruise: "自适应巡航",
    abs: "刹车防抱死",
    variablesteering: "可变齿比转向"
  },
  engine: {
    displacement: "排量",
    displacementml: "排量mL",
    fueltype: "燃料类型",
    fuelgrade: "燃油标号",
    fueltankcapacity: "燃油箱容积",
    environmentalstandards: "环保标准",
    fuelmethod: "供油方式",
    intakeform: "进气形式",
    model: "发动机型号",
    position: "发动机位置",
    maxhorsepower: "最大马力",
    compressionratio: "压缩比",
    integratedpower: "系统综合功率",
    maxtorque: "最大扭矩",
    maxtorquespeed: "最大扭矩转速",
    maxpower: "最大功率",
    maxpowerspeed: "最大功率转速",
    motorpower: "电动机总功率",
    frontmaxpower: "前电动机最大功率",
    rearmaxpower: "后电动机最大功率",
    modeleasyepc2: "发动机型号",
    modelsohu: "发动机型号",
    stroke: "行程",
    startstopsystem: "启停系统",
    nedcmaxmileage: "NEDC最大续航里程",
    cltcmaxmileage: "CLTC纯电续航",
    cylinderarrangetype: "气缸排列型式",
    cylinderheadmaterial: "缸盖材料",
    cylinderbodymaterial: "缸体材料",
    bore: "缸径",
    valvestructure: "气门结构",
    cylindernum: "气缸数",
    valvetrain: "每缸气门数",
    motornum: "驱动电机数",
    motorlayout: "电机布局",
    motortype: "电机类型",
    motormaxhorsepower: "电动机总马力",
    batterytype: "电池类型",
    batterybrand: "电芯品牌",
    motortorque: "电动机总扭矩",
    integratedtorque: "系统综合扭矩",
    frontmaxtorque: "前电动机最大扭矩",
    rearmaxtorque: "后电动机最大扭矩",
    batterycapacity: "电池容量",
    powerconsumption: "耗电量",
    maxmileage: "最大续航里程",
    batterywarranty: "电池组质保",
    batteryfastchargetime: "电池快充充电时间",
    batteryslowchargetime: "电池慢充充电时间",
    modelvin17: "VIN码"
  },
  actualtest: {
    accelerationtime100: "加速时间"
  },
  gearbox: {
    gearnum: "档位数",
    geartype: "变速箱类型",
    gearbox: "变速箱"
  },
  chassisbrake: {
    drivemode: "驱动方式",
    chassis: "底盘型号",
    bodystructure: "车体结构",
    powersteering: "转向助力",
    centerdifferentiallock: "中央差速器锁",
    frontbraketype: "前制动类型",
    rearbraketype: "后制动类型",
    parkingbraketype: "驻车制动类型",
    adjustablesuspension: "可调悬挂",
    airsuspension: "空气悬挂",
    frontsuspensiontype: "前悬挂类型",
    rearsuspensiontype: "后悬挂类型",
    "4wdoffroad": "四驱越野",
    chassisqixiubao: "底盘球头套"
  },
  aircondrefrigerator: {
    frontairconditioning: "前排空调",
    rearairconditioning: "后排独立空调",
    reardischargeoutlet: "后排出风口",
    tempzonecontrol: "温度分区控制",
    airconditioningcontrolmode: "空调控制方式",
    carrefrigerator: "车载冰箱",
    airpurifyingdevice: "车内空气净化装置",
    fragrance: "香氛系统",
    airconditioning: "空气调节/花粉过滤"
  },
  wheel: {
    tirenum: "轮胎个数",
    fronttiresize: "前轮胎规格",
    reartiresize: "后轮胎规格",
    hubmaterial: "轮毂材料",
    sparetiretype: "备胎类型"
  },
  entcom: {
    fulllcddashboard: "全液晶仪表盘",
    consolelcdscreen: "中控台液晶屏",
    lcdscreensize: "液晶屏尺寸",
    rearlcdscreen: "后排液晶屏",
    drivingrecorder: "车载行车记录仪",
    huddisplay: "HUD抬头数字显示",
    locationservice: "定位互动服务",
    builtinharddisk: "内置硬盘",
    bluetooth: "蓝牙系统",
    "4g": "4G",
    cd: "CD",
    dvd: "DVD",
    audiobrand: "音响品牌",
    speakernum: "扬声器数量",
    externalaudiointerface: "外接音源接口",
    phoneconnect: "手机互联",
    wirelesscharge: "手机无线充电",
    powersupply: "车载电源",
    luggagepowersocket: "行李厢电源接口",
    usbnum: "USB接口数量",
    gesturecontrol: "手势控制系统",
    cartv: "车载电视",
    carapp: "车载APP应用",
    voicecontrol: "语音控制",
    roadrescue: "紧急道路救援"
  },
  doormirror: {
    headlightfeature: "大灯功能",
    autoheadlight: "自动大灯",
    externalmirrorantiglare: "外后视镜自动防眩目",
    externalmirrorfolding: "外后视镜电动折叠功能",
    externalmirroradjustment: "外后视镜电动调节",
    externalmirrormemory: "外后视镜记忆功能",
    externalmirrorheating: "外后视镜加热功能",
    externalmirrormedia: "流媒体外后视镜",
    rearviewmirrormedia: "流媒体内后视镜",
    rearviewmirrorantiglare: "内后视镜防眩目功能",
    rearmirrorwithturnlamp: "后雨刷",
    openstyle: "开门方式",
    electricpulldoor: "电动吸合门",
    electricsuctiondoor: "电吸门",
    electricslidingdoor: "电动侧滑门",
    rearsidesunshade: "后排侧遮阳帘",
    rearwindowsunshade: "后窗遮阳帘",
    privacyglass: "隐私玻璃",
    uvinterceptingglass: "防紫外线/隔热玻璃",
    sensingwiper: "感应雨刷",
    frontwiper: "前雨刷器",
    rearwiper: "后雨刷器",
    skylightstype: "天窗型式",
    skylightopeningmode: "天窗开合方式",
    electricwindow: "电动车窗",
    frontelectricwindow: "前电动车窗",
    rearelectricwindow: "后电动车窗",
    antipinchwindow: "电动窗防夹功能",
    sunvisormirror: "遮阳板化妆镜",
    roofrack: "车顶行李架",
    rearwing: "尾翼/扰流板"
  },
  seat: {
    frontseatfunction: "前排座椅功能",
    rearseatfunction: "后排座椅功能",
    seatheightadjustment: "座椅高低调节",
    electricseatmemory: "电动座椅记忆",
    driverseatelectricadjustment: "主座椅电动调节",
    driverseatadjustmentmode: "驾驶座座椅调节方式",
    frontseatheadrestadjustment: "前座椅头枕调节",
    driverseatshouldersupportadjustment: "驾驶座肩部支撑调节",
    auxiliaryseatelectricadjustment: "副座椅电动调节",
    auxiliaryseatadjustmentmode: "副驾驶座椅调节方式",
    rearseatadjustmentmode: "后排座椅调节方式",
    secondrowseatelectricadjustment: "第二排座椅电动调节",
    secondrowseatadjustment: "第二排座椅调节方式",
    sportseat: "运动座椅",
    seatmaterial: "座椅材料",
    driverseatlumbarsupportadjustment: "驾驶座腰部支撑调节",
    childseatfixdevice: "儿童安全座椅固定装置",
    seatheating: "座椅加热",
    seatventilation: "座椅通风",
    seatmassage: "座椅按摩功能",
    rearseatreclineproportion: "后排座位放倒比例",
    rearseatangleadjustment: "后排座椅角度调节",
    thirdrowseat: "第三排座椅",
    frontseatcenterarmrest: "前座中央扶手",
    rearseatcenterarmrest: "后座中央扶手",
    seatadjustablebutton: "座椅调节按钮",
    seatrecliningmethod: "座椅放倒方式",
    secondrowseatfunctions: "第二排座椅功能"
  },
  internalconfig: {
    interiorcolor: "内饰颜色",
    interiormaterial: "内饰材质",
    steeringwheelmaterial: "方向盘表面材料",
    steeringwheelmultifunction: "多功能方向盘",
    steeringwheelbeforeadjustment: "方向盘前后调节",
    steeringwheelupadjustment: "方向盘上下调节",
    steeringwheelheating: "方向盘加热",
    steeringwheelmemory: "方向盘记忆设置",
    steeringwheeladjustmentmode: "方向盘调节方式",
    steeringwheelshift: "方向盘换挡",
    rearcupholder: "后排杯架",
    supplyvoltage: "车内电源电压",
    activenoisereduction: "主动降噪",
    computerscreen: "行车电脑显示屏"
  },
  light: {
    headlighttype: "前大灯类型",
    optionalheadlighttype: "选配前大灯类型",
    headlightilluminationadjustment: "前大灯照射范围调整",
    headlightautomaticclean: "前大灯自动清洗功能",
    headlightdynamicsteering: "前大灯随动转向",
    headlightautomaticopen: "前大灯自动开闭",
    headlightdelayoff: "前大灯延时关闭",
    daytimerunninglight: "日间行车灯",
    leddaytimerunninglight: "LED日间行车灯",
    ledtaillight: "LED尾灯",
    lightsteeringassist: "转向辅助灯",
    headlightdimming: "会车前灯防眩目功能",
    frontfoglight: "前雾灯",
    interiorairlight: "车内氛围灯",
    readinglight: "阅读灯",
    adjustableheadlight: "前大灯可调",
    lowbeamtype: "近光灯类型"
  },
  safe: {
    airbagdrivingposition: "驾驶位安全气囊",
    airbagfrontpassenger: "副驾驶位安全气囊",
    airbagfrontside: "前排侧安全气囊",
    airbagfronthead: "前排头部气囊",
    airbagrearside: "后排侧安全气囊",
    rearcentralairbag: "后排中央气囊",
    airbagrearhead: "后排头部气囊",
    sideaircurtain: "侧安全气帘",
    airbagknee: "膝部气囊",
    safetybeltprompt: "安全带未系提示",
    seatbeltairbag: "安全带气囊",
    safetybeltlimiting: "安全带限力功能",
    safetybeltpretightening: "安全带预收紧功能",
    frontsafetybeltadjustment: "前安全带调节",
    rearsafetybelt: "后排安全带",
    brakeassist: "刹车辅助",
    tirepressuremonitoring: "胎压监测装置",
    zeropressurecontinued: "零压续行",
    keylessentry: "无钥匙进入系统",
    keylessstart: "无钥匙启动系统",
    childlock: "儿童锁",
    smartkey: "智能钥匙",
    remotekey: "遥控钥匙",
    remotecontrol: "远程遥控功能",
    engineantitheft: "发动机电子防盗",
    centrallocking: "中控门锁"
  },
  incarcharge: {
    wirelesscharge: "无线充电",
    chargingport: "充电接口",
    usbnum: "USB数量",
    powersupply: "电源供应",
    luggagepowersocket: "行李厢电源插座"
  },
  activesafety: {
    childseatfixdevice: "儿童座椅固定装置",
    esp: "车身稳定控制",
    tractioncontrol: "牵引力控制",
    dooropeningwarning: "开门预警",
    fatiguereminder: "疲劳提醒",
    ebd: "电子制动力分配",
    ldws: "车道偏离预警",
    forwardcollisionwarning: "前方碰撞预警",
    activebraking: "主动刹车",
    abs: "防抱死制动",
    lowspeedwarning: "低速预警",
    roadrescue: "道路救援",
    drivingrecorder: "行车记录仪",
    brakeassist: "刹车辅助",
    tirepressuremonitoring: "胎压监测",
    safetybeltprompt: "安全带提醒"
  },
  drivingcontrol: {
    automaticparking: "自动驻车",
    hillstartassist: "上坡辅助",
    hilldescent: "陡坡缓降",
    airsuspension: "空气悬挂",
    energyrecovery: "能量回收",
    startstopsystem: "启停系统",
    drivemodechoose: "驾驶模式选择"
  },
  wheelbrake: {
    hubmaterial: "轮毂材料",
    parkingbraketype: "驻车制动类型",
    reartiresize: "后轮胎规格",
    fronttiresize: "前轮胎规格",
    rearbraketype: "后制动类型",
    fronttrack: "前轮距",
    frontbraketype: "前制动类型",
    reartrack: "后轮距",
    sparetiretype: "备胎类型"
  },
  appearanceantitheft: {
    remotecontrol: "远程控制",
    roofluggagerack: "车顶行李架",
    hubmaterial: "轮毂材料",
    discharge: "放电",
    engineantitheft: "发动机防盗",
    electricluggage: "电动行李厢",
    trunkpositionmemory: "行李厢位置记忆",
    batterypreheating: "电池预热",
    hiddendoorhandle: "隐藏式门把手",
    keylessentry: "无钥匙进入",
    remotekey: "遥控钥匙",
    centrallocking: "中控门锁"
  },
  color: {
    color: "车身颜色",
    interiorcolor: "内饰颜色"
  },
  screensystem: {
    wakeupwordfree: "免唤醒词",
    lcdscreensize: "液晶屏尺寸",
    seeandsay: "可见即可说",
    carsystemstorage: "车机存储",
    assistantwakeupword: "助手唤醒词",
    carintelligentchip: "车载智能芯片",
    facialrecognition: "人脸识别",
    voicecontrol: "语音控制",
    carsystemmemory: "车机内存",
    wakeupregion: "唤醒区域",
    intelligentsystem: "智能系统",
    continuousspeech: "连续对话",
    bluetooth: "蓝牙",
    phoneconnect: "手机互联",
    consolelcdscreen: "中控液晶屏"
  },
  drivingfunction: {
    lanekeep: "车道保持",
    reversesidewarning: "后方侧向预警",
    lanecentering: "车道居中",
    driverassistancelevel: "驾驶辅助级别",
    mapbrand: "地图品牌",
    roadtrafficsignrecog: "道路交通标志识别",
    cruisecontrol: "定速巡航",
    automaticparkingintoplace: "自动泊车入位",
    satellitenavigationsystem: "卫星导航系统",
    parallelaid: "并线辅助",
    navigationtrafficinfo: "导航路况信息"
  },
  intelligentconfig: {
    appremote: "APP远程控制",
    internetofvehicle: "车联网",
    "4g": "4G网络",
    ota: "OTA升级"
  },
  externalrearmirror: {
    foldinglockingcar: "外后视镜折叠锁车",
    electricfolding: "电动折叠",
    reversingtiltdown: "倒车下翻",
    rearviewmirrormemory: "后视镜记忆",
    heatedrearviewmirror: "后视镜加热"
  },
  drivinghardware: {
    reversingradar: "倒车雷达",
    frontparkingradar: "前驻车雷达",
    millimeterwaveradarnum: "毫米波雷达数量",
    camerasnum: "摄像头数量",
    ultrasonicradarsnum: "超声波雷达数量",
    reverseimage: "倒车影像"
  },
  chassissteer: {
    rearsuspensiontype: "后悬挂类型",
    centerdifferentiallock: "中央差速器锁",
    frontbraketype: "前制动类型",
    fourwheeldrive: "四驱",
    powersteering: "转向助力",
    parkingbraketype: "驻车制动类型",
    bodystructure: "车体结构",
    rearbraketype: "后制动类型",
    frontsuspensiontype: "前悬挂类型",
    airsuspension: "空气悬挂"
  },
  sunroofglass: {
    sunvisormirror: "遮阳板化妆镜",
    antipinchwindow: "车窗防夹",
    onetouchwindowlifting: "一键升降窗",
    rearwindowsunshade: "后窗遮阳帘",
    skylightopeningmode: "天窗开启方式",
    sidewindowsoundproofglass: "侧窗隔音玻璃",
    rearwiper: "后雨刮",
    privacyglass: "隐私玻璃",
    sensingwiper: "感应雨刮"
  },
  electricmotor: {
    frontmaxpower: "前电机最大功率",
    motorpower: "电机功率",
    batterycapacity: "电池容量",
    motormaxhorsepower: "电机最大马力",
    frontmaxtorque: "前电机最大扭矩",
    batterytype: "电池类型",
    batteryenergydensity: "电池能量密度",
    rearmaxtorque: "后电机最大扭矩",
    batterybrand: "电池品牌",
    motorlayout: "电机布局",
    fastcharging: "快充",
    motornum: "电机数量",
    fastchargingpercent: "快充百分比",
    threeelectricwarranty: "三电质保",
    wltcmaxmileage: "WLTC最大续航",
    motortype: "电机类型",
    motortorque: "电机扭矩",
    powerconsumption: "电耗"
  },
  passivesafety: {
    airbagknee: "膝部气囊",
    airbagfrontside: "前排侧气囊",
    airbagfrontpassenger: "副驾气囊",
    airbagrearside: "后排侧气囊",
    airbagrearhead: "后排头部气囊",
    airbagdrivingposition: "驾驶位气囊"
  },
  soundinteriorlight: {
    audiobrand: "音响品牌",
    interiorairlight: "内饰氛围灯",
    speakernum: "扬声器数量",
    readinglight: "阅读灯"
  },
  exteriorlight: {
    adjustableheadlight: "可调大灯",
    headlighttype: "大灯类型",
    headlightdelayoff: "大灯延时关闭",
    daytimerunninglight: "日间行车灯",
    frontfoglight: "前雾灯",
    lowbeamtype: "近光灯类型",
    lightsteeringassist: "转向辅助灯",
    adaptivehighandlowbeam: "自适应远近光灯",
    headlightautomaticopen: "自动大灯"
  }
};

function getFieldLabel(key: string, parentKey?: string): string {
  if (parentKey && nestedFieldLabels[parentKey]?.[key]) {
    return nestedFieldLabels[parentKey][key];
  }
  return fieldLabels[key] || key;
}

function renderFieldValue(value: any, parentKey?: string): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-zinc-400">-</span>;
  }
  
  if (typeof value === "object") {
    if (Array.isArray(value)) {
      return <span className="text-blue-600 text-xs font-mono">[数组 {value.length}项]</span>;
    }
    
    const entries = Object.entries(value).filter(([_, v]) => v !== null && v !== undefined && v !== "");
    if (entries.length === 0) {
      return <span className="text-zinc-400">-</span>;
    }
    
    return (
      <div className="space-y-1">
        {entries.map(([key, val]) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium text-zinc-700 text-xs">{getFieldLabel(key, parentKey)}:</span>
            <span className="text-zinc-600 text-xs">{renderFieldValue(val, key)}</span>
          </div>
        ))}
      </div>
    );
  }
  
  return String(value);
}

type DbBrand = {
  id: string;
  jm_id: number;
  name: string;
  initial: string | null;
  logo_url: string | null;
  parent_id: number;
  depth: number;
  created_at: string;
  updated_at: string;
};

type DbSeries = {
  id: string;
  jm_id: number;
  brand_jm_id: number;
  brand_id: string | null;
  name: string;
  fullname: string | null;
  initial: string | null;
  logo_url: string | null;
  salestate: string | null;
  depth: number;
  subcompany_name: string | null;
  subcompany_jm_id: number | null;
  created_at: string;
  updated_at: string;
};

type DbModel = {
  id: string;
  jm_id: number;
  series_jm_id: number;
  series_id: string | null;
  brand_jm_id: number;
  brand_id: string | null;
  name: string;
  groupid: string | null;
  groupname: string | null;
  sizetype: string | null;
  displacement2: string | null;
  displacement: string | null;
  geartype: string | null;
  geartype2: number | null;
  logo_url: string | null;
  yeartype: string | null;
  listdate: string | null;
  price: string | null;
  productionstate: string | null;
  salestate: string | null;
  depth: number;
  created_at: string;
  updated_at: string;
};

type DbModelDetail = {
  id: string;
  jm_id: number;
  model_jm_id: number;
  model_id: string | null;
  series_jm_id: number;
  series_id: string | null;
  brand_jm_id: number;
  brand_id: string | null;
  name: string;
  brandname: string | null;
  parentname: string | null;
  parentid: number | null;
  groupid: string | null;
  groupname: string | null;
  environmentalstandards: string | null;
  environmentalstandards2: string | null;
  displacement: string | null;
  displacement2: string | null;
  drivemode: string | null;
  drivemode2: number | null;
  sizetype: string | null;
  price: string | null;
  logo_url: string | null;
  initial: string | null;
  productionstate: string | null;
  salestate: string | null;
  yeartype: string | null;
  listdate: string | null;
  seatnum: string | null;
  depth: number;
  geartype: string | null;
  geartype2: number | null;
  gearnum: string | null;
  compartnum: number | null;
  isnev: string | null;
  basic: any;
  body: any;
  drivingauxiliary: any;
  engine: any;
  actualtest: any;
  gearbox: any;
  chassisbrake: any;
  aircondrefrigerator: any;
  wheel: any;
  entcom: any;
  doormirror: any;
  seat: any;
  internalconfig: any;
  light: any;
  safe: any;
  incarcharge: any;
  "4wdoffroad": any;
  activesafety: any;
  drivingcontrol: any;
  wheelbrake: any;
  appearanceantitheft: any;
  color: any;
  screensystem: any;
  drivingfunction: any;
  intelligentconfig: any;
  externalrearmirror: any;
  drivinghardware: any;
  chassissteer: any;
  passivesafety: any;
  soundinteriorlight: any;
  exteriorlight: any;
  electricmotor: any;
  sunroofglass: any;
  created_at: string;
  updated_at: string;
};

type ModelDetailChangeLog = {
  action: 'insert' | 'update' | 'skip';
  jm_id: number;
  name: string;
  changes?: {
    field: string;
    old: string | null;
    new: string | null;
  }[];
};

export default function AdminModelDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jmAppId = localStorage.getItem('jumdata_app_id') || "";
  const jmAppSecret = localStorage.getItem('jumdata_app_secret') || "";
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [dbBrands, setDbBrands] = useState<DbBrand[]>([]);
  const [dbBrandsLoading, setDbBrandsLoading] = useState(false);
  const [dbSeries, setDbSeries] = useState<DbSeries[]>([]);
  const [dbSeriesLoading, setDbSeriesLoading] = useState(false);
  const [dbModels, setDbModels] = useState<DbModel[]>([]);
  const [dbModelsLoading, setDbModelsLoading] = useState(false);
  const [dbModelDetails, setDbModelDetails] = useState<DbModelDetail[]>([]);
  const [dbModelDetailsLoading, setDbModelDetailsLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedBrandDb, setSelectedBrandDb] = useState<DbBrand | null>(null);
  const [selectedSeriesDb, setSelectedSeriesDb] = useState<DbSeries | null>(null);
  const [selectedModelDb, setSelectedModelDb] = useState<DbModel | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");
  const [seriesSearchQuery, setSeriesSearchQuery] = useState<string>("");
  const [modelSearchQuery, setModelSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'import' | 'db-view' | 'log-view'>('import');
  const [changeLogs, setChangeLogs] = useState<ModelDetailChangeLog[]>([]);

  async function loadDbBrands() {
    setDbBrandsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('depth', 1)
        .order('name', { ascending: true });
      
      if (error) throw error;
      setDbBrands(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载品牌数据库失败');
    } finally {
      setDbBrandsLoading(false);
    }
  }

  async function loadDbSeries() {
    if (!selectedBrandId) {
      setDbSeries([]);
      return;
    }
    setDbSeriesLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('brand_jm_id', selectedBrandId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      setDbSeries(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载车系数据库失败');
    } finally {
      setDbSeriesLoading(false);
    }
  }

  async function loadDbModels() {
    if (!selectedSeriesId) {
      setDbModels([]);
      return;
    }
    setDbModelsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('models_jumdata')
        .select('*')
        .eq('series_jm_id', selectedSeriesId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      setDbModels(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载车型数据库失败');
    } finally {
      setDbModelsLoading(false);
    }
  }

  async function loadDbModelDetails() {
    setDbModelDetailsLoading(true);
    setError(null);
    try {
      console.log('🔍 开始加载 model_details 表数据...');
      const { data, error } = await supabase
        .from('model_details')
        .select('*')
        .order('jm_id', { ascending: true });

      if (error) throw error;

      console.log('✅ model_details 表数据加载成功，共', data?.length || 0, '条');
      setDbModelDetails(data || []);
    } catch (e) {
      console.error('❌ 加载 model_details 表失败:', e);
      setError(e instanceof Error ? e.message : '加载车型详细信息数据库失败');
    } finally {
      setDbModelDetailsLoading(false);
    }
  }

  // 数据库诊断功能
  async function checkDatabaseStatus() {
    setError(null);
    try {
      console.log('🔍 开始全面数据库诊断...');

      const results: Record<string, string> = {};

      // 检查 brands 表
      try {
        const { count, error: brandsError } = await supabase
          .from('brands')
          .select('*', { count: 'exact', head: true });
        if (brandsError) {
          results['Brands'] = `❌ 错误: ${brandsError.message}`;
          console.error('Brands 表错误:', brandsError);
        } else {
          results['Brands'] = `✅ ${count || 0} 条`;
        }
      } catch (e) {
        results['Brands'] = `❌ 异常: ${e instanceof Error ? e.message : String(e)}`;
        console.error('Brands 表异常:', e);
      }

      // 检查 series 表
      try {
        const { count, error: seriesError } = await supabase
          .from('series')
          .select('*', { count: 'exact', head: true });
        if (seriesError) {
          results['Series'] = `❌ 错误: ${seriesError.message}`;
          console.error('Series 表错误:', seriesError);
        } else {
          results['Series'] = `✅ ${count || 0} 条`;
        }
      } catch (e) {
        results['Series'] = `❌ 异常: ${e instanceof Error ? e.message : String(e)}`;
        console.error('Series 表异常:', e);
      }

      // 检查 models_jumdata 表
      try {
        const { count, error: modelsError } = await supabase
          .from('models_jumdata')
          .select('*', { count: 'exact', head: true });
        if (modelsError) {
          results['Models'] = `❌ 错误: ${modelsError.message}`;
          console.error('Models 表错误:', modelsError);
        } else {
          results['Models'] = `✅ ${count || 0} 条`;
        }
      } catch (e) {
        results['Models'] = `❌ 异常: ${e instanceof Error ? e.message : String(e)}`;
        console.error('Models 表异常:', e);
      }

      // 检查 model_details 表
      try {
        const { count, error: detailsError } = await supabase
          .from('model_details')
          .select('*', { count: 'exact', head: true });
        if (detailsError) {
          results['Model_details'] = `❌ 错误: ${detailsError.message}`;
          console.error('Model_details 表错误:', detailsError);
        } else {
          results['Model_details'] = `✅ ${count || 0} 条`;
        }
      } catch (e) {
        results['Model_details'] = `❌ 异常: ${e instanceof Error ? e.message : String(e)}`;
        console.error('Model_details 表异常:', e);
      }

      // 格式化结果
      const statusMessage = `
🔍 数据库诊断结果:
${Object.entries(results)
  .map(([table, status]) => `- ${table} 表: ${status}`)
  .join('\n')}

📊 诊断完成时间: ${new Date().toLocaleString()}
      `.trim();

      console.log('📊', statusMessage);
      alert(statusMessage);

    } catch (e) {
      console.error('❌ 数据库诊断失败:', e);
      const errorMsg = `数据库诊断失败: ${e instanceof Error ? e.message : String(e)}`;
      setError(errorMsg);
      alert(errorMsg);
    }
  }

  const filteredBrands = brandSearchQuery.trim() === ""
    ? dbBrands
    : dbBrands.filter(brand => 
        brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
      );

  const filteredSeries = seriesSearchQuery.trim() === ""
    ? dbSeries
    : dbSeries.filter(series => 
        series.name.toLowerCase().includes(seriesSearchQuery.toLowerCase())
      );

  const filteredModels = modelSearchQuery.trim() === ""
    ? dbModels
    : dbModels.filter(model => 
        model.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
      );

  async function queryModelDetailsFromApi() {
    if (!jmAppId || !jmAppSecret) {
      setError("请先前往设置页面配置聚美智数的 App ID 和 App Secret");
      return;
    }
    if (!selectedModelId) {
      setError("请选择车型");
      return;
    }
    const selectedModel = dbModels.find(m => m.jm_id === selectedModelId);
    if (!selectedModel) {
      setError("未找到选中的车型");
      return;
    }
    const selectedSeries = dbSeries.find(s => s.jm_id === selectedModel.series_jm_id);
    if (!selectedSeries) {
      setError("未找到对应的车系");
      return;
    }
    const selectedBrand = dbBrands.find(b => b.jm_id === selectedModel.brand_jm_id);
    if (!selectedBrand) {
      setError("未找到对应的品牌");
      return;
    }
    setSelectedModelDb(selectedModel);
    setSelectedSeriesDb(selectedSeries);
    setSelectedBrandDb(selectedBrand);
    setQueryLoading(true);
    setQueryResult(null);
    setImportResult(null);
    setError(null);
    setChangeLogs([]);
    try {
      const timestamp = Date.now();
      const text = new TextEncoder().encode(jmAppId + jmAppSecret + timestamp);
      const digest = await crypto.subtle.digest("SHA-256", text);
      const hashArray = Array.from(new Uint8Array(digest));
      const signHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const formData = new URLSearchParams();
      formData.append("appId", jmAppId);
      formData.append("timestamp", timestamp.toString());
      formData.append("sign", signHex);
      formData.append("productCode", "vehicle_type");
      formData.append("modelId", selectedModelId.toString());

      const response = await fetch("https://api.jumdata.com/vehicle/query/detail", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const result = await response.json();
      if (result.code !== 200) {
        throw new Error(result.msg || `请求失败 code=${result.code}`);
      }

      const detailData: any = result.data;
      setQueryResult(detailData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "查询失败");
    } finally {
      setQueryLoading(false);
    }
  }

  async function importModelDetails() {
    if (!queryResult || !selectedModelDb || !selectedSeriesDb || !selectedBrandDb) return;
    setLoading(true);
    setError(null);
    setImportProgress(0);
    setChangeLogs([]);
    
    const logs: ModelDetailChangeLog[] = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    console.log('🚀 开始导入车型详细信息');
    console.log('📋 车型名称:', queryResult.name);
    console.log('🆔 车型ID:', queryResult.id);
    console.log('🔍 查询结果完整数据:', JSON.stringify(queryResult, null, 2));

    try {
      console.log('🔍 检查是否已存在该车型详细信息...');
      const { data: existing, error: checkError } = await supabase
        .from("model_details")
        .select("*")
        .eq("jm_id", queryResult.id)
        .maybeSingle();

      if (checkError) {
        console.error('❌ 检查车型详细信息失败:', checkError);
        throw checkError;
      }

      const insertData: any = {
        jm_id: queryResult.id,
        model_jm_id: selectedModelDb.jm_id,
        model_id: selectedModelDb.id,
        series_jm_id: selectedSeriesDb.jm_id,
        series_id: selectedSeriesDb.id,
        brand_jm_id: selectedBrandDb.jm_id,
        brand_id: selectedBrandDb.id,

        name: queryResult.name,
        brandname: queryResult.brandname,
        parentname: queryResult.parentname,
        parentid: queryResult.parentid,
        groupid: queryResult.groupid,
        groupname: queryResult.groupname,
        environmentalstandards: queryResult.environmentalstandards,
        environmentalstandards2: queryResult.environmentalstandards2,
        displacement: queryResult.displacement,
        displacement2: queryResult.displacement2,
        drivemode: queryResult.drivemode,
        drivemode2: queryResult.drivemode2,
        sizetype: queryResult.sizetype,
        price: queryResult.price,
        logo_url: selectedSeriesDb.logo_url,
        initial: queryResult.initial,
        productionstate: queryResult.productionstate,
        salestate: queryResult.salestate,
        yeartype: queryResult.yeartype,
        listdate: queryResult.listdate,
        seatnum: queryResult.seatnum,
        depth: queryResult.depth,
        geartype: queryResult.geartype,
        geartype2: queryResult.geartype2,
        gearnum: queryResult.gearnum,
        compartnum: queryResult.compartnum,
        isnev: queryResult.isnev,

        // 直接保存嵌套对象，而不是扁平化处理
        basic: queryResult.basic ? { ...queryResult.basic } : null,
        body: queryResult.body ? { ...queryResult.body } : null,
        drivingauxiliary: queryResult.drivingauxiliary ? { ...queryResult.drivingauxiliary } : null,
        engine: queryResult.engine ? { ...queryResult.engine } : null,
        actualtest: queryResult.actualtest ? { ...queryResult.actualtest } : null,
        gearbox: queryResult.gearbox ? { ...queryResult.gearbox } : null,
        chassisbrake: queryResult.chassisbrake ? { ...queryResult.chassisbrake } : null,
        aircondrefrigerator: queryResult.aircondrefrigerator ? { ...queryResult.aircondrefrigerator } : null,
        wheel: queryResult.wheel ? { ...queryResult.wheel } : null,
        entcom: queryResult.entcom ? { ...queryResult.entcom } : null,
        doormirror: queryResult.doormirror ? { ...queryResult.doormirror } : null,
        seat: queryResult.seat ? { ...queryResult.seat } : null,
        internalconfig: queryResult.internalconfig ? { ...queryResult.internalconfig } : null,
        light: queryResult.light ? { ...queryResult.light } : null,
        safe: queryResult.safe ? { ...queryResult.safe } : null,
        incarcharge: queryResult.incarcharge ? { ...queryResult.incarcharge } : null,
        "4wdoffroad": queryResult["4wdoffroad"] ? { ...queryResult["4wdoffroad"] } : null,
        activesafety: queryResult.activesafety ? { ...queryResult.activesafety } : null,
        drivingcontrol: queryResult.drivingcontrol ? { ...queryResult.drivingcontrol } : null,
        wheelbrake: queryResult.wheelbrake ? { ...queryResult.wheelbrake } : null,
        appearanceantitheft: queryResult.appearanceantitheft ? { ...queryResult.appearanceantitheft } : null,
        color: queryResult.color ? { ...queryResult.color } : null,
        screensystem: queryResult.screensystem ? { ...queryResult.screensystem } : null,
        drivingfunction: queryResult.drivingfunction ? { ...queryResult.drivingfunction } : null,
        intelligentconfig: queryResult.intelligentconfig ? { ...queryResult.intelligentconfig } : null,
        externalrearmirror: queryResult.externalrearmirror ? { ...queryResult.externalrearmirror } : null,
        drivinghardware: queryResult.drivinghardware ? { ...queryResult.drivinghardware } : null,
        chassissteer: queryResult.chassissteer ? { ...queryResult.chassissteer } : null,
        passivesafety: queryResult.passivesafety ? { ...queryResult.passivesafety } : null,
        soundinteriorlight: queryResult.soundinteriorlight ? { ...queryResult.soundinteriorlight } : null,
        exteriorlight: queryResult.exteriorlight ? { ...queryResult.exteriorlight } : null,
        electricmotor: queryResult.electricmotor ? { ...queryResult.electricmotor } : null,
        sunroofglass: queryResult.sunroofglass ? { ...queryResult.sunroofglass } : null
      };

      if (!existing) {
        console.log('🆕 准备插入新车型详细信息');
        console.log('📦 插入数据:', JSON.stringify(insertData, null, 2));

        // 验证必要字段
        const requiredFields = ['jm_id', 'model_jm_id', 'series_jm_id', 'brand_jm_id', 'name', 'depth'];
        const missingFields = requiredFields.filter(field => !insertData[field]);
        if (missingFields.length > 0) {
          console.error('❌ 缺少必要字段:', missingFields);
          throw new Error(`缺少必要字段: ${missingFields.join(', ')}`);
        }

        const { error } = await supabase.from("model_details").insert([insertData]);

        if (error) {
          console.error('❌ 插入失败，详细错误:', error);
          console.error('📄 错误消息:', error.message);
          console.error('🔢 错误代码:', error.code);
          console.error('📖 错误详情:', error.details);
          if (error.hint) console.error('💡 错误提示:', error.hint);

          setError(`插入失败: ${error.message} (${error.code}) - ${error.details}${error.hint ? ' 提示: ' + error.hint : ''}`);
          skipped++;
        } else {
          console.log('✅ 插入成功');
          inserted++;
          logs.push({ action: 'insert', jm_id: queryResult.id, name: queryResult.name });
        }
      } else {
        console.log('🔄 车型详细信息已存在，准备更新');
        console.log('📦 更新数据:', JSON.stringify(insertData, null, 2));

        const { error } = await supabase
          .from("model_details")
          .update(insertData)
          .eq("jm_id", queryResult.id);

        if (error) {
          console.error('❌ 更新失败:', error);
          setError(`更新失败: ${error.message} (${error.code}) - ${error.details}${error.hint ? ' 提示: ' + error.hint : ''}`);
          skipped++;
        } else {
          console.log('✅ 更新成功');
          updated++;
          logs.push({ action: 'update', jm_id: queryResult.id, name: queryResult.name });
        }
      }
      
      setImportProgress(100);

      setChangeLogs(logs);
      setImportResult(`导入完成: 新增 ${inserted} 个，更新 ${updated} 个，跳过 ${skipped} 个`);
      console.log('导入结果:', { inserted, updated, skipped });
      
      if (inserted > 0 || updated > 0) {
        setActiveTab('log-view');
        loadDbModelDetails();
      }
    } catch (e) {
      console.error('导入出错:', e);
      const errorMsg = e instanceof Error 
        ? `${e.message}${e.stack ? '\n' + e.stack : ''}`
        : JSON.stringify(e, null, 2);
      setError(`导入失败: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="text-2xl font-bold text-zinc-900">聚美智数车型详细信息导入</h3>
      <p className="mt-2 text-base text-zinc-500">
        从聚美智数 API 查询车型详细信息，预览后再导入数据库
      </p>

      <div className="mt-6 flex gap-2 border-b border-zinc-200 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'import'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          数据导入
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('db-view');
            loadDbBrands();
            loadDbSeries();
            loadDbModels();
            loadDbModelDetails();
          }}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'db-view'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          数据库视图
        </button>
        {changeLogs.length > 0 && (
          <button
            type="button"
            onClick={() => setActiveTab('log-view')}
            className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
              activeTab === 'log-view'
                ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                : 'text-zinc-500 hover:text-zinc-700'
            }`}
          >
            变更日志
          </button>
        )}
      </div>

      {activeTab === 'import' && (
        <>
          {!queryResult ? (
            <>
              {!jmAppId || !jmAppSecret ? (
                <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-700 font-medium">提示</span>
                  </div>
                  <p className="text-yellow-600 text-sm">
                    请先前往 <strong>设置</strong> 页面配置聚美智数的 App ID 和 App Secret
                  </p>
                </div>
              ) : null}
              
              <div className="mt-6 grid gap-6 sm:grid-cols-3">
                <div>
                  <label className="block text-lg font-medium text-zinc-700">选择品牌</label>
                  <div className="mt-2">
                    {!dbBrands.length && !dbBrandsLoading ? (
                      <button
                        type="button"
                        onClick={loadDbBrands}
                        className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-6 py-3 text-lg font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors"
                      >
                        加载品牌列表
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={brandSearchQuery}
                          onChange={(e) => setBrandSearchQuery(e.target.value)}
                          placeholder="搜索品牌名称..."
                          className="block w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
                        />
                        <div className="max-h-32 overflow-auto rounded-xl border border-zinc-200">
                          {dbBrandsLoading ? (
                            <div className="p-8 text-center text-sm text-zinc-500">加载中...</div>
                          ) : filteredBrands.length === 0 ? (
                            <div className="p-8 text-center text-sm text-zinc-500">未找到匹配的品牌</div>
                          ) : (
                            <ul className="divide-y divide-zinc-100">
                              {filteredBrands.map((brand) => (
                                <li key={brand.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBrandId(brand.jm_id);
                                      setBrandSearchQuery(brand.name);
                                      setSelectedSeriesId(null);
                                      setSelectedModelId(null);
                                      setSelectedSeriesDb(null);
                                      setSelectedModelDb(null);
                                    }}
                                    className={`w-full px-4 py-3 text-left transition-colors ${
                                      selectedBrandId === brand.jm_id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'hover:bg-zinc-50 text-zinc-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {brand.logo_url && (
                                        <img
                                          src={brand.logo_url}
                                          alt=""
                                          className="h-6 w-6 rounded object-contain"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div>
                                        <div className="font-medium text-sm">{brand.name}</div>
                                      </div>
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-zinc-700">选择车系</label>
                  <div className="mt-2">
                    {!selectedBrandId ? (
                      <div className="p-8 text-center text-sm text-zinc-500 rounded-xl border border-zinc-200">
                        请先选择品牌
                      </div>
                    ) : !dbSeries.length && !dbSeriesLoading ? (
                      <button
                        type="button"
                        onClick={loadDbSeries}
                        className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-6 py-3 text-lg font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors"
                      >
                        加载车系列表
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={seriesSearchQuery}
                          onChange={(e) => setSeriesSearchQuery(e.target.value)}
                          placeholder="搜索车系名称..."
                          className="block w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
                        />
                        <div className="max-h-32 overflow-auto rounded-xl border border-zinc-200">
                          {dbSeriesLoading ? (
                            <div className="p-8 text-center text-sm text-zinc-500">加载中...</div>
                          ) : filteredSeries.length === 0 ? (
                            <div className="p-8 text-center text-sm text-zinc-500">未找到匹配的车系</div>
                          ) : (
                            <ul className="divide-y divide-zinc-100">
                              {filteredSeries.map((series) => (
                                <li key={series.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSeriesId(series.jm_id);
                                      setSeriesSearchQuery(series.name);
                                      setSelectedModelId(null);
                                      setSelectedModelDb(null);
                                    }}
                                    className={`w-full px-4 py-3 text-left transition-colors ${
                                      selectedSeriesId === series.jm_id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'hover:bg-zinc-50 text-zinc-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {series.logo_url && (
                                        <img
                                          src={series.logo_url}
                                          alt=""
                                          className="h-6 w-6 rounded object-contain"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div>
                                        <div className="font-medium text-sm">{series.name}</div>
                                      </div>
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-zinc-700">选择车型</label>
                  <div className="mt-2">
                    {!selectedSeriesId ? (
                      <div className="p-8 text-center text-sm text-zinc-500 rounded-xl border border-zinc-200">
                        请先选择车系
                      </div>
                    ) : !dbModels.length && !dbModelsLoading ? (
                      <button
                        type="button"
                        onClick={loadDbModels}
                        className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-6 py-3 text-lg font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors"
                      >
                        加载车型列表
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={modelSearchQuery}
                          onChange={(e) => setModelSearchQuery(e.target.value)}
                          placeholder="搜索车型名称..."
                          className="block w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
                        />
                        <div className="max-h-32 overflow-auto rounded-xl border border-zinc-200">
                          {dbModelsLoading ? (
                            <div className="p-8 text-center text-sm text-zinc-500">加载中...</div>
                          ) : filteredModels.length === 0 ? (
                            <div className="p-8 text-center text-sm text-zinc-500">未找到匹配的车型</div>
                          ) : (
                            <ul className="divide-y divide-zinc-100">
                              {filteredModels.map((model) => (
                                <li key={model.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedModelId(model.jm_id);
                                      setModelSearchQuery(model.name);
                                    }}
                                    className={`w-full px-4 py-3 text-left transition-colors ${
                                      selectedModelId === model.jm_id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'hover:bg-zinc-50 text-zinc-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {model.logo_url && (
                                        <img
                                          src={model.logo_url}
                                          alt=""
                                          className="h-6 w-6 rounded object-contain"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div>
                                        <div className="font-medium text-sm">{model.name}</div>
                                      </div>
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={queryModelDetailsFromApi}
                  disabled={queryLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {queryLoading ? "查询中..." : "查询车型详细信息"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-zinc-900">
                    查询结果 - {queryResult.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    {queryResult.logo && (
                      <img
                        src={queryResult.logo}
                        alt=""
                        className="h-10 w-10 rounded object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                        referrerPolicy="no-referrer"
                        crossOrigin="anonymous"
                      />
                    )}
                    <div className="text-right">
                      <div className="text-sm text-zinc-500">
                        {selectedBrandDb?.name} / {selectedSeriesDb?.name}
                      </div>
                      <div className="text-sm text-zinc-400">
                        {queryResult.yeartype} · {queryResult.price}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
                    <table className="min-w-full divide-y divide-zinc-200">
                      <thead className="bg-zinc-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">字段</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">值</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {Object.entries(queryResult)
                          .filter(([key]) => typeof queryResult[key] !== 'object' || Array.isArray(queryResult[key]))
                          .map(([key, value]) => (
                            <tr key={key} className="hover:bg-zinc-50">
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{getFieldLabel(key)}</td>
                              <td className="px-4 py-3 text-sm text-zinc-600">
                                {key === 'logo' ? null : renderFieldValue(value)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                  
                  {Object.entries(queryResult)
                    .filter(([key]) => typeof queryResult[key] === 'object' && !Array.isArray(queryResult[key]))
                    .map(([key, value]) => {
                      const objValue = value as Record<string, any>;
                      const hasValue = Object.values(objValue).some(v => v !== null && v !== undefined && v !== '');
                      if (!hasValue) return null;
                      
                      return (
                        <div key={key} className="rounded-xl border border-zinc-200 overflow-hidden">
                          <div className="bg-zinc-50 px-4 py-3">
                            <h5 className="font-semibold text-zinc-900">{getFieldLabel(key)}</h5>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                              {Object.entries(objValue)
                                .filter(([_, v]) => v !== null && v !== undefined && v !== '')
                                .map(([subKey, subValue]) => (
                                  <div key={subKey} className="flex gap-2">
                                    <span className="font-medium text-zinc-700 text-sm whitespace-nowrap">{getFieldLabel(subKey, key)}:</span>
                                    <span className="text-zinc-600 text-sm">{renderFieldValue(subValue, subKey)}</span>
                                  </div>
                                ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

              {(loading || importProgress > 0) && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700">导入进度</span>
                    <span className="text-sm font-semibold text-zinc-900">{importProgress}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full bg-green-600 transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setQueryResult(null);
                    setImportResult(null);
                    setError(null);
                    setImportProgress(0);
                    setChangeLogs([]);
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-6 py-3 text-lg font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors"
                >
                  重新查询
                </button>
                <button
                  type="button"
                  onClick={importModelDetails}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-lg font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "导入中..." : "确认导入"}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'db-view' && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-zinc-900">
              数据库车型详细信息列表（共 {dbModelDetails.length} 条）
            </h4>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={checkDatabaseStatus}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-200 transition-colors"
              >
                🔍 数据库诊断
              </button>
              <button
                type="button"
                onClick={() => {
                  loadDbBrands();
                  loadDbSeries();
                  loadDbModels();
                  loadDbModelDetails();
                }}
                disabled={dbModelDetailsLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {dbModelDetailsLoading ? '加载中...' : '刷新'}
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Logo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">聚美ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">车型名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">品牌</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">年款</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">价格</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {dbModelDetailsLoading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
                      加载中...
                    </td>
                  </tr>
                ) : dbModelDetails.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-sm text-zinc-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  dbModelDetails.map((detail) => (
                    <tr key={detail.id} className="hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                          {detail.logo_url && (
                            <img
                              src={detail.logo_url}
                              alt=""
                              className="h-8 w-8 rounded object-contain"
                              onError={(e) => {
                                const img = e.target as HTMLImageElement;
                                img.style.display = 'none';
                              }}
                              referrerPolicy="no-referrer"
                              crossOrigin="anonymous"
                            />
                          )}
                        </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{detail.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{detail.jm_id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{detail.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{detail.brandname || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{detail.yeartype || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{detail.price || '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'log-view' && changeLogs.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xl font-semibold text-zinc-900 mb-4">
            数据变更日志
          </h4>
          <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">操作</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">聚美ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">车型名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">变更详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {changeLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-zinc-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        log.action === 'insert' 
                          ? 'bg-green-100 text-green-800'
                          : log.action === 'update'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action === 'insert' ? '新增' : log.action === 'update' ? '更新' : '跳过'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{log.jm_id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{log.name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {log.changes ? (
                        <div className="space-y-1">
                          {log.changes.map((change, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-medium">{change.field}:</span>
                              <span className="text-red-600 line-through mx-1">{change.old || '空'}</span>
                              <span className="mx-1">→</span>
                              <span className="text-green-600">{change.new || '空'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importResult && (
        <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-base text-green-700">
          {importResult}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700 whitespace-pre-wrap">
          {error}
        </div>
      )}
    </div>
  );
}
