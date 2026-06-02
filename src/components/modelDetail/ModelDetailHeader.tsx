import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronRight, Download, X } from "lucide-react";

type Variant = "page" | "modal";

type Props = {
  base: string;
  title: string;
  subtitle: string | null;
  seriesId?: string | null;
  seriesName?: string | null;
  brandId?: string | null;
  brandName?: string | null;
  inInquiry: boolean;
  onToggleInquiry: () => void;
  onOpenParams: () => void;
  onExportPdf: () => void;
  exporting: boolean;
  variant: Variant;
  onClose?: () => void;
  addToInquiryText: string;
};

export default function ModelDetailHeader({
  base,
  title,
  subtitle,
  seriesId,
  seriesName,
  brandId,
  brandName,
  inInquiry,
  onToggleInquiry,
  onOpenParams,
  onExportPdf,
  exporting,
  variant,
  onClose,
  addToInquiryText,
}: Props) {
  const { t } = useTranslation();
  const brandsTo = `${base}/brands${brandId ? `?brandId=${encodeURIComponent(brandId)}` : ""}`;
  const seriesTo = seriesId ? `${base}/series/${encodeURIComponent(seriesId)}` : "";
  const seriesLabelBase = (seriesName || "").trim();
  const seriesLabel = seriesLabelBase ? (seriesLabelBase.endsWith("车系") ? seriesLabelBase : `${seriesLabelBase} ${t("common.series")}`) : t("common.series");

  return (
    <div className="px-6 pb-6 pt-4 md:px-8 md:pb-8 md:pt-6">
      <div className="flex flex-wrap items-center gap-2 text-xs leading-5 text-zinc-500">
        <Link to={brandsTo} className="hover:text-zinc-800">
          {t("common.brand")}
        </Link>
        {seriesTo ? (
          <>
            <ChevronRight className="h-4 w-4" />
            <Link to={seriesTo} className="hover:text-zinc-800 truncate" title={seriesLabelBase || brandName || ""}>
              {seriesLabelBase ? seriesLabel : brandName ? `${brandName} ${t("common.series")}` : seriesLabel}
            </Link>
          </>
        ) : null}
        <ChevronRight className="h-4 w-4" />
        <span className="text-zinc-900 font-medium truncate">{title}</span>
      </div>

      <div className="mt-4 flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-900 md:text-4xl md:leading-[1.15]">{title}</h1>
          {subtitle ? <div className="mt-2 text-sm leading-6 text-zinc-500">{subtitle}</div> : null}
        </div>

        <div className="flex shrink-0 flex-wrap items-center gap-3 md:justify-end">
          <button
            type="button"
            onClick={onToggleInquiry}
            className={
              inInquiry
                ? "inline-flex items-center gap-2 rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800"
                : "inline-flex items-center gap-2 rounded-xl border border-transparent bg-transparent px-2 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
            }
          >
            {inInquiry ? `✓ ${addToInquiryText}` : addToInquiryText}
          </button>
          <button
            type="button"
            onClick={onOpenParams}
            className="inline-flex items-center gap-2 rounded-xl border border-transparent bg-transparent px-2 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-100"
          >
            {t("model.allParams")}
          </button>
          <button
            type="button"
            onClick={onExportPdf}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
          >
            <Download className="h-4 w-4" />
            {exporting ? t("model.generating") : t("model.exportPdf")}
          </button>
          {variant === "modal" ? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
            >
              <X className="h-4 w-4" />
              {t("common.close")}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
