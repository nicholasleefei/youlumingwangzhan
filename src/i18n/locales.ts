export type Locale =
  | "zh-CN"
  | "en"
  | "ar"
  | "ru"
  | "th"
  | "ur"
  | "tr"
  | "pt-BR";

export const SUPPORTED_LOCALES: readonly Locale[] = [
  "zh-CN",
  "en",
  "ar",
  "ru",
  "th",
  "ur",
  "tr",
  "pt-BR",
];

export const DEFAULT_LOCALE: Locale = "en";

export const LOCALE_LABELS: Record<Locale, string> = {
  "zh-CN": "中文",
  en: "English",
  ar: "العربية",
  ru: "Русский",
  th: "ไทย",
  ur: "اردو",
  tr: "Türkçe",
  "pt-BR": "Português (Brasil)",
};

const RTL_LOCALES = new Set<Locale>(["ar", "ur"]);

export function isRtlLocale(locale: Locale) {
  return RTL_LOCALES.has(locale);
}

const LOCALE_MAPPINGS = new Map<string, Locale>([
  ['zh', 'zh-CN'],
  ['en', 'en'],
  ['ru', 'ru'],
  ['ar', 'ar'],
  ['th', 'th'],
  ['ur', 'ur'],
  ['tr', 'tr'],
  ['pt', 'pt-BR'],
  ['pt-BR', 'pt-BR'],
  ['br', 'pt-BR'],
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