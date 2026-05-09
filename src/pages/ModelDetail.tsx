import { useParams } from "react-router-dom";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import ModelDetailContent from "@/components/modelDetail/ModelDetailContent";

export default function ModelDetail() {
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const modelId = typeof params.id === "string" ? params.id : "";

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <ModelDetailContent locale={locale} modelId={modelId} variant="page" />
    </div>
  );
}
