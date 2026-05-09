import { Navigate } from "react-router-dom";
import { DEFAULT_LOCALE, normalizeLocale } from "@/i18n/locales";

const STORAGE_KEY = "ylm_locale";

export default function RootRedirect() {
  const saved = typeof window !== "undefined" ? window.localStorage.getItem(STORAGE_KEY) : null;
  const locale = normalizeLocale(saved) ?? DEFAULT_LOCALE;
  return <Navigate to={`/${locale}`} replace />;
}
