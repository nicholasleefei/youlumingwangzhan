import type { ModelDetails, ModelJumdata } from "./modelDetailData";

export type KeyParamItem = { key: string; label: string; value: string | null };

function pickFirstString(...candidates: Array<unknown>) {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
    if (typeof c === "number" && Number.isFinite(c)) return String(c);
  }
  return null;
}

export function buildKeyParams12(model: ModelJumdata | null, details: ModelDetails | null): KeyParamItem[] {
  const raw = (details?.raw ?? {}) as any;
  const engine = (raw?.engine ?? {}) as any;
  const body = (raw?.body ?? {}) as any;
  const basic = (raw?.basic ?? {}) as any;

  const items: KeyParamItem[] = [];
  const push = (key: string, label: string, value: string | null) => {
    items.push({ key, label, value });
  };

  push("yeartype", "年款", pickFirstString(model?.yeartype, details?.yeartype));
  push("price", "价格", pickFirstString(model?.price, details?.price));
  push("sizetype", "级别", pickFirstString(model?.sizetype, details?.sizetype));
  push("seatnum", "座位数", pickFirstString(details?.seatnum));
  push("drivemode", "驱动方式", pickFirstString(details?.drivemode));
  push("displacement", "排量", pickFirstString(model?.displacement2, model?.displacement, details?.displacement2));
  push("geartype", "变速箱", pickFirstString(model?.geartype, details?.geartype));
  push("maxspeed", "最高车速", pickFirstString(basic?.maxspeed, raw?.["basic.maxspeed"], raw?.basic_maxspeed));
  push(
    "acceleration_0_100",
    "0-100加速",
    pickFirstString(basic?.officialaccelerationtime100, raw?.actualtest?.accelerationtime100, raw?.basic_officialaccelerationtime100)
  );
  push("cltc_range", "CLTC续航", pickFirstString(engine?.cltcmaxmileage, engine?.cltccomprehensivemileage));
  push("batterycapacity", "电池容量", pickFirstString(engine?.batterycapacity));
  push("wheelbase", "轴距", pickFirstString(body?.wheelbase, raw?.["body.wheelbase"], raw?.body_wheelbase));

  return items.slice(0, 12);
}

