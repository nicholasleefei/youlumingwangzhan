export type FlattenedParam = {
  path: string;
  value: string;
};

export type ParamGroup = {
  group: string;
  items: FlattenedParam[];
};

/**
 * 聚美 raw JSON 里的英文 key → 中文显示名映射
 * 覆盖 body/engine/basic/seat 等最常见字段
 */
const FIELD_LABEL_CN: Record<string, string> = {
  // basic
  price: "厂商指导价",
  saleprice: "参考价",
  warrantypolicy: "整车质保",
  firstownerwarrantypolicy: "首任车主质保",
  maxspeed: "最高车速(km/h)",
  officialaccelerationtime100: "0-100加速(s)",
  electricfuelconsumption: "综合电耗(kWh/100km)",
  gearnum: "挡位数",
  geartype: "变速箱类型",
  seatnum: "座位数",
  // body
  len: "车长(mm)",
  width: "车宽(mm)",
  height: "车高(mm)",
  weight: "整备质量(kg)",
  fullweight: "满载质量(kg)",
  wheelbase: "轴距(mm)",
  fronttrack: "前轮距(mm)",
  reartrack: "后轮距(mm)",
  doornum: "车门数",
  bodytype: "车身结构",
  luggagevolume: "行李厢容积(L)",
  fronttrunkvolume: "前备厢容积(L)",
  dragcoefficient: "风阻系数",
  approachangle: "接近角(°)",
  departureangle: "离去角(°)",
  electricluggage: "电动后备厢",
  roofluggagerack: "车顶行李架",
  trunkpositionmemory: "后备厢位置记忆",
  // engine / electricmotor
  fueltype: "能源类型",
  maxpower: "最大功率(kW)",
  maxtorque: "最大扭矩(N·m)",
  model: "型号",
  motorlayout: "电机布局",
  motornum: "电机数量",
  motortype: "电机类型",
  motorpower: "电机功率(kW)",
  motortorque: "电机扭矩(N·m)",
  motormaxhorsepower: "最大马力(Hp)",
  rearbrand: "后电机品牌",
  rearmodel: "后电机型号",
  rearmaxtorque: "后电机最大扭矩(N·m)",
  batterytype: "电池类型",
  batterybrand: "电池品牌",
  batterycapacity: "电池容量(kWh)",
  powerconsumption: "百公里电耗(kWh)",
  fastcharging: "快充支持",
  fastchargingpercent: "快充电量区间",
  fastchargingportlocation: "快充口位置",
  slowchargingportlocation: "慢充口位置",
  highvoltagecharging: "高压快充电压(V)",
  highvoltagefastcharging: "高压快充支持",
  batteryfastchargetime: "快充时间(h)",
  threeelectricwarranty: "三电质保",
  externalacdischargepower: "对外放电功率(kW)",
  // gearbox
  gearshifting: "换挡方式",
  // chassissteer
  drivemode: "驱动方式",
  bodystructure: "车身结构",
  powersteering: "助力转向",
  airsuspension: "空气悬架",
  frontsuspensiontype: "前悬架类型",
  rearsuspensiontype: "后悬架类型",
  adjustablesuspension: "可调悬架",
  // wheelbrake
  frontbraketype: "前制动器类型",
  rearbraketype: "后制动器类型",
  parkingbraketype: "驻车制动类型",
  fronttiresize: "前轮胎规格",
  reartiresize: "后轮胎规格",
  hubmaterial: "轮毂材料",
  // color
  color: "外观颜色",
  interiorcolor: "内饰颜色",
  // seat
  seatmaterial: "座椅材质",
  seatheating: "座椅加热",
  seatventilation: "座椅通风",
  seatmassage: "座椅按摩",
  driverseatadjustmentmode: "主驾座椅调节",
  auxiliaryseatadjustmentmode: "副驾座椅调节",
  secondrowseatadjustment: "第二排座椅调节",
  secondrowseatfunctions: "第二排座椅功能",
  rearseatcenterarmrest: "后排中央扶手",
  seatadjustablebutton: "座椅调节按钮",
  rearseatadjustmentmode: "后排座椅调节方式",
  seatrecliningmethod: "座椅放倒方式",
  childseatfixdevice: "儿童座椅接口",
  electricseatmemory: "电动座椅记忆",
  // activesafety
  abs: "ABS防抱死",
  ebd: "EBD制动力分配",
  esp: "ESP车身稳定控制",
  ldws: "车道偏离预警",
  brakeassist: "刹车辅助",
  tractioncontrol: "牵引力控制",
  forwardcollisionwarning: "前方碰撞预警",
  activebraking: "主动刹车",
  rearcollisionwarning: "后方碰撞预警",
  dooropeningwarning: "开门预警",
  fatiguereminder: "疲劳驾驶提醒",
  roadrescue: "道路救援",
  sentrymode: "哨兵模式",
  lowspeedwarning: "低速行车警告",
  tirepressuremonitoring: "胎压监测",
  safetybeltprompt: "安全带未系提示",
  drivingrecorder: "行车记录仪",
  // passivesafety
  airbagdrivingposition: "主驾安全气囊",
  airbagfrontpassenger: "副驾安全气囊",
  airbagfrontside: "前排侧气囊",
  airbagrearside: "后排侧气囊",
  airbagrearhead: "前后排头部气囊",
  // drivinghardware
  lidarnum: "激光雷达数量",
  lidarbrand: "激光雷达品牌",
  camerasnum: "摄像头数量",
  camerasnumincar: "车内摄像头数量",
  ultrasonicradarsnum: "超声波雷达数量",
  millimeterwaveradarnum: "毫米波雷达数量",
  reverseimage: "倒车影像",
  reversingradar: "倒车雷达",
  frontparkingradar: "前驻车雷达",
  transparentchassis: "透明底盘",
  assisteddrivingchip: "辅助驾驶芯片",
  totalchipcomputingpower: "芯片总算力(TOPS)",
  frontperceptioncamera: "前方感知摄像头",
  frontperceptioncamerapixel: "前方感知摄像头像素",
  environmentalawarenesscamerapixel: "环境感知摄像头像素",
  maxdetectiondistanceahead: "前方最大探测距离",
  // drivingfunction
  cruisecontrol: "巡航系统",
  lanekeep: "车道居中保持",
  lanecentering: "车道居中保持",
  parallelaid: "并线辅助",
  trafficlightrecog: "交通标志识别",
  roadtrafficsignrecog: "交通标志识别",
  driverassistancelevel: "辅助驾驶级别",
  driverassistancesystem: "辅助驾驶系统",
  automaticparking: "自动泊车入位",
  remoteparking: "远程挪车",
  memoryparking: "记忆泊车",
  startreminder: "起步提醒",
  navigationtrafficinfo: "导航路况信息",
  highprecisionmap: "高精地图",
  satelitenavigationsystem: "卫星导航系统",
  mapbrand: "地图品牌",
  handsoffdetection: "脱手检测",
  reversesidewarning: "倒车侧向预警",
  // drivingcontrol
  hilldescent: "陡坡缓降",
  hillstartassist: "上坡辅助",
  energyrecovery: "能量回收系统",
  drivemodechoose: "驾驶模式选择",
  // screensystem
  intelligentsystem: "车机系统",
  carintelligentchip: "车机芯片",
  consolelcdscreen: "中控屏幕",
  consolelcdscreenresolution: "中控屏幕分辨率",
  carsystemmemory: "车机运行内存(GB)",
  carsystemstorage: "车机存储(GB)",
  voicecontrol: "语音控制",
  assistantwakeupword: "语音唤醒词",
  wakeupregion: "语音分区唤醒",
  wakeupwordfree: "免唤醒",
  continuousspeech: "连续语音识别",
  seeandsay: "可见即可说",
  voiceprintrecognition: "声纹识别",
  facialrecognition: "人脸识别",
  bluetooth: "蓝牙",
  carapp: "车机APP",
  phoneconnect: "手机互联",
  rearlcdscreen: "后排液晶屏",
  rearlcdscreensize: "后排屏幕尺寸",
  rearscreensnum: "后排屏幕数量",
  rearmultimediacontrol: "后排多媒体控制",
  // intelligentconfig
  ota: "OTA升级",
  wifi: "WiFi热点",
  appremote: "手机APP远程控制",
  internetofvehicle: "车联网",
  simulatesoundwave: "模拟声浪",
  // exteriorlight
  headlighttype: "大灯类型",
  lowbeamtype: "近光灯类型",
  lightingfeature: "大灯功能",
  headlightautomaticopen: "自动大灯",
  headlightdelayoff: "大灯延时关闭",
  daytimerunninglight: "日间行车灯",
  // externalrearmirror
  electricfolding: "电动折叠",
  foldinglockingcar: "锁车自动折叠",
  reversingtiltdown: "倒车自动下翻",
  heatedrearviewmirror: "后视镜加热",
  rearviewmirrormemory: "后视镜记忆",
  // sunroofglass
  skylightopeningmode: "天窗类型",
  rearmirror: "后雨刷",
  sensingwiper: "感应雨刷",
  privacyglass: "隐私玻璃",
  sunvisormirror: "化妆镜",
  onetouchwindowlifting: "一键升降车窗",
  sidewindowsoundproofglass: "侧窗隔音玻璃",
  // soundinteriorlight
  speakernum: "扬声器数量",
  dolbyatmos: "杜比全景声",
  interiorairlight: "车内氛围灯",
  activeinteriorairlight: "主动式氛围灯",
  readinglight: "阅读灯",
  // aircondrefrigerator
  airconditioningcontrolmode: "空调控制方式",
  tempzonecontrol: "温度分区控制",
  reardischargeoutlet: "后排出风口",
  rearairconditioning: "后排独立空调",
  heatpumpairconditioner: "热泵空调",
  airpurifyingdevice: "空气净化装置",
  fragrance: "香氛系统",
  carrefrigerator: "车载冰箱",
  // appearanceantitheft
  keylessentry: "无钥匙进入",
  remotecontrol: "远程启动",
  centrallocking: "中控门锁",
  remotekey: "遥控钥匙类型",
  hiddendoorhandle: "隐藏式门把手",
  framelessdoor: "无框车门",
  electricpulldoor: "电动吸合门",
  activeclosedgrille: "主动闭合式进气格栅",
  batterypreheating: "电池预加热",
  discharge: "对外放电",
  // optionalpackage
  packagename: "选装包名称",
  packagecontent: "选装包内容",
  // incarcharge
  usbnum: "USB/Type-C接口数量",
  chargingport: "充电接口类型",
  wirelesscharge: "手机无线充电",
  phonewirelesschargingpower: "无线充电功率(W)",
  powersupply: "电源插座",
  luggagepowersocket: "行李厢电源接口",
  usbmaxchargingpower: "USB最大充电功率(W)",
  // 4wdoffroad — mostly empty, skip keys
  // fallback: just use the key as-is
};

/** 分组名中文映射 */
const GROUP_LABEL_CN: Record<string, string> = {
  basic: "基本参数",
  body: "车身尺寸",
  engine: "发动机/电机",
  electricmotor: "电动系统",
  gearbox: "变速箱",
  chassissteer: "底盘转向",
  wheelbrake: "车轮制动",
  color: "颜色",
  seat: "座椅配置",
  activesafety: "主动安全",
  passivesafety: "被动安全",
  drivinghardware: "辅助驾驶硬件",
  drivingfunction: "辅助驾驶功能",
  drivingcontrol: "驾驶操控",
  screensystem: "屏幕/车机系统",
  intelligentconfig: "智能互联",
  exteriorlight: "外部灯光",
  externalrearmirror: "外后视镜",
  sunroofglass: "天窗/玻璃",
  soundinteriorlight: "音响/氛围灯",
  aircondrefrigerator: "空调/冰箱",
  appearanceantitheft: "外观/防盗",
  optionalpackage: "选装包",
  incarcharge: "车内充电",
};

function translateKey(key: string): string {
  return FIELD_LABEL_CN[key] ?? key;
}

/**
 * 把 raw JSON 拍平成人可读的 key-value 列表。
 * key 自动翻译为中文。
 */
export function flattenParams(
  input: unknown,
  opts?: { maxItems?: number; maxDepth?: number },
): FlattenedParam[] {
  const maxItems = opts?.maxItems ?? 600;
  const maxDepth = opts?.maxDepth ?? 6;

  const out: FlattenedParam[] = [];

  function push(label: string, value: unknown) {
    if (out.length >= maxItems) return;
    if (value === null || value === undefined) return;
    if (typeof value === "string") {
      const v = value.trim();
      if (!v) return;
      out.push({ path: label, value: v });
      return;
    }
    if (typeof value === "number" || typeof value === "boolean") {
      out.push({ path: label, value: String(value) });
      return;
    }
  }

  function walk(node: unknown, keyLabel: string, keyRaw: string, depth: number) {
    if (out.length >= maxItems) return;
    if (depth > maxDepth) return;

    if (node === null || node === undefined) return;
    if (typeof node !== "object") {
      push(keyLabel, node);
      return;
    }

    if (Array.isArray(node)) {
      node.forEach((item, idx) => {
        if (out.length >= maxItems) return;
        walk(item, `${keyLabel}[${idx}]`, `${keyRaw}[${idx}]`, depth + 1);
      });
      return;
    }

    const rec = node as Record<string, unknown>;
    Object.keys(rec)
      .sort((a, b) => a.localeCompare(b))
      .forEach((key) => {
        if (out.length >= maxItems) return;
        const cn = translateKey(key);
        walk(rec[key], cn, key, depth + 1);
      });
  }

  walk(input, "", "", 0);
  return out;
}

/**
 * 把 raw JSON 按顶层嵌套对象分组展开。
 * 只展开嵌套对象（body, engine, basic…），忽略顶层标量字段。
 *
 * 例如 raw = { body: { wheelbase: "2925" }, engine: { maxpower: "370" }, price: "24.98万" }
 * → [{ group: "车身尺寸", items: [{轴距, 2925}] },
 *    { group: "发动机/电机", items: [{最大功率, 370}] }]
 * （price 等标量字段不在嵌套对象里，已被跳过）
 */
export function flattenParamsGrouped(
  input: unknown,
  opts?: { maxItems?: number; maxDepth?: number },
): ParamGroup[] {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    const flat = flattenParams(input, opts);
    return flat.length > 0 ? [{ group: "", items: flat }] : [];
  }

  const rec = input as Record<string, unknown>;
  const groups: ParamGroup[] = [];

  const preferredOrder = [
    "basic", "body", "engine", "electricmotor", "gearbox", "chassissteer",
    "wheelbrake", "color", "seat", "activesafety", "passivesafety",
    "drivinghardware", "drivingfunction", "drivingcontrol",
    "screensystem", "intelligentconfig",
    "exteriorlight", "externalrearmirror", "sunroofglass",
    "soundinteriorlight", "aircondrefrigerator",
    "appearanceantitheft", "incarcharge", "optionalpackage",
  ];
  const orderMap = new Map(preferredOrder.map((k, i) => [k, i]));

  const sortedKeys = Object.keys(rec).sort((a, b) => {
    const ao = orderMap.get(a) ?? 999;
    const bo = orderMap.get(b) ?? 999;
    if (ao !== bo) return ao - bo;
    return a.localeCompare(b);
  });

  for (const key of sortedKeys) {
    const val = rec[key];
    if (val === null || val === undefined) continue;
    // 只保留嵌套对象作为分组，跳过顶层标量字段（它们是冗余的）
    if (typeof val === "object" && !Array.isArray(val)) {
      const flat = flattenParams(val, opts);
      if (flat.length > 0) {
        groups.push({ group: GROUP_LABEL_CN[key] ?? key, items: flat });
      }
    }
    // 跳过字符串/数字/布尔/数组 — 这些已经在各个分组里了
  }

  return groups;
}
