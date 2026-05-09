import type { Locale } from "./locales";

import en from "./messages/en.json";
import zhCN from "./messages/zh-CN.json";
import ru from "./messages/ru.json";
import ar from "./messages/ar.json";
import th from "./messages/th.json";
import lo from "./messages/lo.json";
import fa from "./messages/fa.json";
import tr from "./messages/tr.json";
import ckb from "./messages/ckb.json";
import uz from "./messages/uz.json";
import kk from "./messages/kk.json";
import ky from "./messages/ky.json";
import tg from "./messages/tg.json";
import tk from "./messages/tk.json";
import ps from "./messages/ps.json";
import ur from "./messages/ur.json";
import he from "./messages/he.json";
import hy from "./messages/hy.json";
import ka from "./messages/ka.json";

export type I18nNamespace = "common";
export type CommonDict = Record<string, string>;

export const resources: Record<Locale, { common: CommonDict }> = {
  "zh-CN": { common: zhCN as CommonDict },
  en: { common: en as CommonDict },
  ru: { common: ru as CommonDict },
  ar: { common: ar as CommonDict },
  th: { common: th as CommonDict },
  lo: { common: lo as CommonDict },
  fa: { common: fa as CommonDict },
  tr: { common: tr as CommonDict },
  ckb: { common: ckb as CommonDict },
  uz: { common: uz as CommonDict },
  kk: { common: kk as CommonDict },
  ky: { common: ky as CommonDict },
  tg: { common: tg as CommonDict },
  tk: { common: tk as CommonDict },
  ps: { common: ps as CommonDict },
  ur: { common: ur as CommonDict },
  he: { common: he as CommonDict },
  hy: { common: hy as CommonDict },
  ka: { common: ka as CommonDict },
};

