import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import { useInquiryModal } from "@/store/useInquiryModal";

export default function Inquiry() {
  const navigate = useNavigate();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const openModal = useInquiryModal((s) => s.openModal);

  useEffect(() => {
    openModal();
    navigate(`/${locale}`, { replace: true });
  }, [locale, navigate, openModal]);

  return null;
}
