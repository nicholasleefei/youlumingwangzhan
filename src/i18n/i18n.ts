import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { DEFAULT_LOCALE, type Locale, isRtlLocale } from "./locales";
import { resources } from "./resources";

export function setDocumentLocale(locale: Locale) {
  document.documentElement.lang = locale;
  document.documentElement.dir = isRtlLocale(locale) ? "rtl" : "ltr";
}

i18n.use(initReactI18next).init({
  resources,
  lng: DEFAULT_LOCALE,
  fallbackLng: DEFAULT_LOCALE,
  defaultNS: "common",
  interpolation: { escapeValue: false },
});

// Lazy-load UI translations per locale from DB
const uiLoaded = new Set<string>();
const UI_STORAGE_PREFIX = "ui_tr_";
const UI_STORAGE_TTL = 10 * 60 * 1000;

export async function ensureUiTranslationsForLocale(locale: string) {
  if (locale === "zh-CN" || uiLoaded.has(locale)) return;

  // Check localStorage first
  try {
    const raw = localStorage.getItem(UI_STORAGE_PREFIX + locale);
    if (raw) {
      const parsed = JSON.parse(raw) as { data: Record<string, string>; ts: number };
      if (Date.now() - parsed.ts < UI_STORAGE_TTL) {
        const bundle = i18n.getResourceBundle(locale, "common") as Record<string, string>;
        if (bundle) {
          Object.assign(bundle, parsed.data);
          uiLoaded.add(locale);
          return;
        }
      }
    }
  } catch { /* ignore */ }

  try {
    const { supabase } = await import("@/utils/supabaseClient");
    const { data, error } = await supabase
      .from("ui_translations")
      .select("key, value")
      .eq("locale", locale);

    if (error || !data?.length) {
      uiLoaded.add(locale);
      return;
    }

    const bundle = i18n.getResourceBundle(locale, "common") as Record<string, string> | undefined;
    if (bundle) {
      const patch: Record<string, string> = {};
      for (const row of data) {
        if (row.key && row.value) {
          bundle[row.key] = row.value;
          patch[row.key] = row.value;
        }
      }
      // Persist to localStorage
      try {
        localStorage.setItem(UI_STORAGE_PREFIX + locale, JSON.stringify({ data: patch, ts: Date.now() }));
      } catch { /* ignore */ }
    }
    uiLoaded.add(locale);
  } catch {
    // Silent — DB translations are optional
  }
}

export default i18n;
