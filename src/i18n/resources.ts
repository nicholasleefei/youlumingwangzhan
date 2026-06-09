import type { Locale } from "./locales";

import en from "./messages/en.json";
import zhCN from "./messages/zh-CN.json";
import ru from "./messages/ru.json";
import ar from "./messages/ar.json";
import th from "./messages/th.json";
import tr from "./messages/tr.json";
import ur from "./messages/ur.json";
import ptBR from "./messages/pt-BR.json";

export type I18nNamespace = "common";
export type CommonDict = Record<string, string>;

export const resources: Record<Locale, { common: CommonDict }> = {
  "zh-CN": { common: zhCN as CommonDict },
  en: { common: en as CommonDict },
  ru: { common: ru as CommonDict },
  ar: { common: ar as CommonDict },
  th: { common: th as CommonDict },
  tr: { common: tr as CommonDict },
  ur: { common: ur as CommonDict },
  "pt-BR": { common: ptBR as CommonDict },
};