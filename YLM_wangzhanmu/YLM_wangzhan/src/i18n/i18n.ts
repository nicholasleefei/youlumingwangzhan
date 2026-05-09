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

export default i18n;
