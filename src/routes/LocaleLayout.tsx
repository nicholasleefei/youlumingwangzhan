import { useEffect } from "react";
import { Navigate, Outlet, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import InquiryFloatingButton from "@/components/InquiryFloatingButton";
import InquiryModal from "@/components/InquiryModal";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import { ensureUiTranslationsForLocale, setDocumentLocale } from "@/i18n/i18n";
import { useInquiryModal } from "@/store/useInquiryModal";

export default function LocaleLayout() {
  const { i18n } = useTranslation();
  const params = useParams();
  const raw = typeof params.locale === "string" ? params.locale : null;
  const normalized = normalizeLocale(raw);
  const locale = (normalized ?? "en") as Locale;

  const inquiryOpen = useInquiryModal((s) => s.open);
  const closeInquiry = useInquiryModal((s) => s.closeModal);

  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
    ensureUiTranslationsForLocale(locale);
    window.localStorage.setItem("ylm_locale", locale);
    setDocumentLocale(locale);
  }, [i18n, locale]);

  if (!normalized) {
    return <Navigate to={`/en`} replace />;
  }

  return (
    <div className="min-h-screen bg-primary-dark text-text-primary">
      <SiteHeader />
      <main>
        <Outlet />
      </main>
      <InquiryFloatingButton />
      <InquiryModal open={inquiryOpen} onClose={closeInquiry} locale={locale} />
      <SiteFooter />
    </div>
  );
}
