import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { normalizeLocale } from "@/i18n/locales";
import { useInquiryDraft } from "@/store/useInquiryDraft";

export default function InquiryFloatingButton() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();

  const rawLocale = typeof params.locale === "string" ? params.locale : null;
  const locale = normalizeLocale(rawLocale) ?? "en";

  const selectedCount = useInquiryDraft((s) => s.selectedModelIds.length);

  const isInquiryPage = useMemo(() => /\/inquiry(?:\/|$)/.test(location.pathname), [location.pathname]);
  if (isInquiryPage) return null;

  return (
    <button
      type="button"
      aria-label={t("nav.inquiry", "获取报价")}
      onClick={() => navigate(`/${locale}/inquiry`)}
      className="fixed bottom-24 right-5 z-50"
    >
      <span className="relative inline-flex items-center gap-2 rounded-full bg-accent-green px-4 py-3 font-semibold text-black/90 shadow-lg glow-hover-green active:scale-[0.99]">
        <ShoppingBag className="h-5 w-5" />
        <span className="hidden sm:inline">{t("nav.inquiry", "获取报价")}</span>
        {selectedCount > 0 ? (
          <span className="absolute -right-2 -top-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-red-500 px-1 text-xs font-bold text-white">
            {selectedCount > 99 ? "99+" : selectedCount}
          </span>
        ) : null}
      </span>
    </button>
  );
}
