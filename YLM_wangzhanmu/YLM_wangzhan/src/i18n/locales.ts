export type Locale =
  | "zh-CN"
  | "en"
  | "ru"
  | "ar"
  | "th"
  | "lo"
  | "fa"
  | "tr"
  | "ckb"
  | "uz"
  | "kk"
  | "ky"
  | "tg"
  | "tk"
  | "ps"
  | "ur"
  | "he"
  | "hy"
  | "ka";

export const SUPPORTED_LOCALES: readonly Locale[] = [
  "zh-CN",
  "en",
  "ru",
  "ar",
  "th",
  "lo",
  "fa",
  "tr",
  "ckb",
  "uz",
  "kk",
  "ky",
  "tg",
  "tk",
  "ps",
  "ur",
  "he",
  "hy",
  "ka",
];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "中文",
  en: "English",
  ru: "Русский",
  ar: "العربية",
  th: "ไทย",
  lo: "ລາວ",
  fa: "فارسی",
  tr: "Türkçe",
  ckb: "کوردی",
  uz: "Oʻzbekcha",
  kk: "Қазақша",
  ky: "Кыргызча",
  tg: "Тоҷикӣ",
  tk: "Türkmençe",
  ps: "پښتو",
  ur: "اردو",
  he: "עברית",
  hy: "Հայերեն",
  ka: "ქართული",
};

const RTL_LOCALES = new Set<Locale>(["ar", "fa", "ps", "ur", "he", "ckb"]);

export function isRtlLocale(locale: Locale) {
  return RTL_LOCALES.has(locale);
}

const LOCALE_MAPPINGS = new Map<string, Locale>([
  ['zh', 'zh-CN'],
  ['en', 'en'],
  ['ru', 'ru'],
  ['ar', 'ar'],
  ['th', 'th'],
  ['lo', 'lo'],
  ['fa', 'fa'],
  ['tr', 'tr'],
  ['ckb', 'ckb'],
  ['ku', 'ckb'],
  ['uz', 'uz'],
  ['kk', 'kk'],
  ['ky', 'ky'],
  ['tg', 'tg'],
  ['tk', 'tk'],
  ['ps', 'ps'],
  ['ur', 'ur'],
  ['he', 'he'],
  ['iw', 'he'],
  ['hy', 'hy'],
  ['ka', 'ka'],
]);

export function normalizeLocale(input: string | null | undefined): Locale | null {
  if (!input) return null;

  const raw = input.trim();
  if (!raw) return null;

  const lowered = raw.toLowerCase();

  for (const [prefix, locale] of LOCALE_MAPPINGS) {
    if (lowered === prefix || lowered.startsWith(`${prefix}-`)) {
      return locale;
    }
  }

  const exact = SUPPORTED_LOCALES.find((l) => l.toLowerCase() === lowered);
  return exact ?? null;
}

export function detectDefaultLocale(): Locale {
  const navLang = typeof navigator !== "undefined" ? navigator.language : null;
  return normalizeLocale(navLang) ?? DEFAULT_LOCALE;
}

