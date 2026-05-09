import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { normalizeLocale } from "@/i18n/locales";

export default function AdminRedirect() {
  const params = useParams();
  const locale = normalizeLocale(typeof params.locale === "string" ? params.locale : null) ?? "en";

  useEffect(() => {
    const url = new URL(window.location.href);
    url.pathname = "/admin/";
    url.searchParams.set("locale", locale);
    window.location.assign(url.toString());
  }, [locale]);

  return null;
}

