import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { useTranslation } from "react-i18next";
import AllParamsModal from "@/components/modelDetail/AllParamsModal";
import ExportAllParamsCard from "@/components/modelDetail/ExportAllParamsCard";
import ImageLightbox from "@/components/modelDetail/ImageLightbox";
import ModelDetailHeader from "@/components/modelDetail/ModelDetailHeader";
import ModelDetailThreeColumn from "@/components/modelDetail/ModelDetailThreeColumn";
import {
  loadModelDetailData,
  loadSeriesModels,
  normalizePictures,
  type ModelDetails,
  type ModelJumdata,
  type SeriesModelListItem,
} from "@/components/modelDetail/modelDetailData";
import { supabase } from "@/utils/supabaseClient";
import { getSeriesById } from "@/utils/db";
import type { Locale } from "@/i18n/locales";
import { flattenParams } from "@/utils/paramFlatten";
import { useInquiryDraft } from "@/store/useInquiryDraft";
import { fetchEntityTranslations, getTranslatedField, mergeRawTranslations } from "@/utils/entityTranslation";
import type { EntityTranslationData } from "@/utils/entityTranslation";

type Variant = "page" | "modal";

type Props = {
  locale: string;
  modelId: string;
  variant: Variant;
  onClose?: () => void;
};

function pickFirstString(...candidates: Array<unknown>) {
  for (const c of candidates) {
    if (typeof c === "string" && c.trim()) return c.trim();
    if (typeof c === "number" && Number.isFinite(c)) return String(c);
  }
  return null;
}

function getErrorMessage(e: unknown) {
  if (e instanceof Error) return e.message;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && "message" in e && typeof (e as any).message === "string") return (e as any).message;
  return "加载失败";
}

export default function ModelDetailContent({ locale, modelId, variant, onClose }: Props) {
  const { t } = useTranslation();
  const base = `/${locale}`;
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const exportRef = useRef<HTMLDivElement | null>(null);

  const toggleModelId = useInquiryDraft((s) => s.toggleModelId);
  const inInquiry = useInquiryDraft((s) => s.selectedModelIds.includes(modelId));

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [model, setModel] = useState<ModelJumdata | null>(null);
  const [details, setDetails] = useState<ModelDetails | null>(null);
  const [pictures, setPictures] = useState<Array<{ category: string; image_url: string; sort_order: number }>>([]);

  const [seriesLoading, setSeriesLoading] = useState(false);
  const [seriesModels, setSeriesModels] = useState<SeriesModelListItem[]>([]);

  const [seriesInfo, setSeriesInfo] = useState<{ id: string; name: string | null; fullname: string | null; brandId: string | null; brandName: string | null } | null>(
    null
  );

  const [imageTab, setImageTab] = useState<"official" | "exterior" | "interior" | "detail">("official");
  const [compareId, setCompareId] = useState("");
  const [compareModel, setCompareModel] = useState<ModelJumdata | null>(null);
  const [compareDetails, setCompareDetails] = useState<ModelDetails | null>(null);

  const [paramsOpen, setParamsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [lightbox, setLightbox] = useState<{ open: boolean; title: string; images: string[]; index: number }>({
    open: false,
    title: "",
    images: [],
    index: 0,
  });

  const [modelTr, setModelTr] = useState<Map<string, EntityTranslationData>>(new Map());

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    setModel(null);
    setDetails(null);
    setPictures([]);
    setSeriesModels([]);
    setSeriesInfo(null);
    setCompareId("");
    setCompareModel(null);
    setCompareDetails(null);

    loadModelDetailData(modelId)
      .then((res) => {
        if (!active) return;
        setModel(res.model);
        setDetails(res.details);
        setPictures(res.pictures as any);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(getErrorMessage(e));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [modelId]);

  useEffect(() => {
    if (!model || locale === "zh-CN") return;
    let active = true;
    const jmIds: number[] = [model.jm_id];
    if (compareModel?.jm_id) jmIds.push(compareModel.jm_id);
    fetchEntityTranslations("model_detail", jmIds, locale as Locale)
      .then((tr) => { if (active) setModelTr(tr); })
      .catch(() => {});
    return () => { active = false; };
  }, [model?.jm_id, compareModel?.jm_id, locale]);

  const fromSeriesId = useMemo(() => {
    const st: any = location.state;
    const fromState = typeof st?.fromSeriesId === "string" ? st.fromSeriesId : "";
    const fromQuery = String(searchParams.get("seriesId") || "");
    return (fromState || fromQuery).trim() || null;
  }, [location.state, searchParams]);

  const effectiveSeriesId = useMemo(() => {
    const sid = typeof (model as any)?.series_id === "string" ? String((model as any).series_id) : "";
    return (sid || fromSeriesId || "").trim() || null;
  }, [String((model as any)?.series_id || ""), fromSeriesId]);

  useEffect(() => {
    let active = true;
    if (!effectiveSeriesId) {
      setSeriesInfo(null);
      return;
    }

    getSeriesById(effectiveSeriesId, locale as Locale)
      .then((s) => {
        if (!active) return;
        if (!s) {
          setSeriesInfo(null);
          return;
        }
        setSeriesInfo({
          id: String(s.id),
          name: (s as any).name ?? null,
          fullname: (s as any).fullname ?? null,
          brandId: (s as any).brand_id ?? null,
          brandName: (s as any).brands?.name ?? null,
        });
      })
      .catch(() => {
        if (!active) return;
        setSeriesInfo(null);
      });

    return () => {
      active = false;
    };
  }, [effectiveSeriesId]);

  useEffect(() => {
    let active = true;
    const sid = String((model as any)?.series_id || "").trim();
    if (!sid) {
      setSeriesModels([]);
      return;
    }

    setSeriesLoading(true);
    loadSeriesModels(sid)
      .then((rows) => {
        if (!active) return;
        setSeriesModels(rows);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setSeriesModels([]);
        setError((prev) => prev ?? getErrorMessage(e));
      })
      .finally(() => {
        if (!active) return;
        setSeriesLoading(false);
      });

    return () => {
      active = false;
    };
  }, [String((model as any)?.series_id || "")]);

  useEffect(() => {
    if (!compareId) return;
    if (compareId === modelId) {
      setCompareId("");
      return;
    }
    if (seriesModels.length > 0 && !seriesModels.some((m) => m.id === compareId)) setCompareId("");
  }, [compareId, modelId, seriesModels.map((m) => m.id).join("|")]);

  useEffect(() => {
    let active = true;
    const id = String(compareId || "").trim();
    if (!id) {
      setCompareModel(null);
      setCompareDetails(null);
      return;
    }

    Promise.all([
      supabase.from("models_jumdata").select("*").eq("id", id).eq("activity_status", 0).maybeSingle(),
      supabase
        .from("model_details")
        .select("id, model_id, model_jm_id, name, yeartype, price, sizetype, seatnum, drivemode, displacement2, geartype, raw")
        .eq("model_id", id)
        .maybeSingle(),
    ])
      .then(([mRes, dRes]: any[]) => {
        if (!active) return;
        if (mRes?.error) throw mRes.error;
        if (dRes?.error) throw dRes.error;
        setCompareModel((mRes?.data as ModelJumdata) ?? null);
        setCompareDetails((dRes?.data as ModelDetails) ?? null);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setCompareModel(null);
        setCompareDetails(null);
        setError((prev) => prev ?? getErrorMessage(e));
      });

    return () => {
      active = false;
    };
  }, [compareId]);

  const pictureMap = useMemo(() => normalizePictures(pictures as any), [pictures]);
  const official = pictureMap.official ?? [];
  const exterior = pictureMap.exterior ?? [];
  const interior = pictureMap.interior ?? [];
  const detail = pictureMap.detail ?? [];

  const availableTabs = useMemo(() => {
    const out: Array<{ key: "official" | "exterior" | "interior" | "detail"; label: string; images: string[] }> = [];
    if (official.length) out.push({ key: "official", label: t("model.officialImages"), images: official });
    if (exterior.length) out.push({ key: "exterior", label: t("model.exteriorImages"), images: exterior });
    if (interior.length) out.push({ key: "interior", label: t("model.interiorImages"), images: interior });
    if (detail.length) out.push({ key: "detail", label: t("model.detailImages"), images: detail });
    return out;
  }, [official.join("|"), exterior.join("|"), interior.join("|"), detail.join("|")]);

  useEffect(() => {
    const first = availableTabs[0]?.key;
    if (!first) return;
    setImageTab((prev) => (availableTabs.some((t) => t.key === prev) ? prev : first));
  }, [availableTabs.map((t) => t.key).join("|")]);

  const activeGallery = useMemo(() => {
    const m = new Map(availableTabs.map((t) => [t.key, t] as const));
    return m.get(imageTab) ?? availableTabs[0] ?? { key: "official" as const, label: t("model.imageGallery"), images: [] as string[] };
  }, [imageTab, availableTabs]);

  const title = getTranslatedField(modelTr, model?.jm_id, "name", model?.name ?? "") || model?.name || t("model.modelDetail");
  const subtitle = pickFirstString(model?.yeartype, details?.yeartype, model?.salestate) ?? null;

  const translatedDetails = useMemo(() => {
    if (!details) return null;
    const tr = modelTr.get(String(model?.jm_id ?? ""));
    const mergedRaw = mergeRawTranslations(details.raw as Record<string, unknown> | null | undefined, tr?.raw as any);
    if (mergedRaw === details.raw) return details;
    return { ...details, raw: mergedRaw };
  }, [details, modelTr, model?.jm_id]);

  const translatedCompareDetails = useMemo(() => {
    if (!compareDetails) return null;
    const tr = modelTr.get(String(compareModel?.jm_id ?? ""));
    const mergedRaw = mergeRawTranslations(compareDetails.raw, tr?.raw as Record<string, unknown> | undefined);
    if (mergedRaw === compareDetails.raw) return compareDetails;
    return { ...compareDetails, raw: mergedRaw };
  }, [compareDetails, modelTr, compareModel?.jm_id]);

  const allParamsPayload = useMemo(() => translatedDetails?.raw ?? {}, [translatedDetails]);
  const inlineAllParams = useMemo(() => flattenParams(allParamsPayload, { maxItems: 320, maxDepth: 6 }), [allParamsPayload]);

  const openLightbox = (t: string, images: string[], index: number) => {
    setLightbox({ open: true, title: t, images, index });
  };

  const startExportPdf = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    setError(null);

    try {
      await new Promise((r) => setTimeout(r, 80));
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: exportRef.current.scrollWidth,
      });

      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();

      const imgW = pdfW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let pos = 0;

      pdf.addImage(imgData, "JPEG", 0, pos, imgW, imgH);
      let heightLeft = imgH - pdfH;
      while (heightLeft > 0) {
        pos -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, pos, imgW, imgH);
        heightLeft -= pdfH;
      }

      pdf.save(`${title}-${t("model.modelDetail")}.pdf`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("model.exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className={variant === "modal" ? "p-6" : "mx-auto max-w-7xl px-4 py-14"}>
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
          <div className="flex items-center justify-center py-16">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-transparent" />
            <span className="ml-3 text-sm text-zinc-600">{t('model.loading')}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !model) {
    const fallbackSeriesId = fromSeriesId;
    return (
      <div className={variant === "modal" ? "p-6" : "mx-auto max-w-7xl px-4 py-14"}>
        <div className="rounded-3xl border border-zinc-200 bg-white p-10 shadow-sm">
          <div className="text-sm font-semibold text-zinc-900">{t("model.notFound")}</div>
          <div className="mt-2 text-sm text-zinc-600">{error ?? ""}</div>
          <div className="mt-6">
            {variant === "modal" ? (
              <button
                type="button"
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                {t("common.close")}
              </button>
            ) : (
              <Link
                to={fallbackSeriesId ? `${base}/series/${encodeURIComponent(fallbackSeriesId)}` : `${base}/brands`}
                className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                {fallbackSeriesId ? t("model.backToSeries") : t("model.back")}
                <ChevronRight className="h-4 w-4" />
              </Link>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <ImageLightbox
        open={lightbox.open}
        title={lightbox.title}
        images={lightbox.images}
        index={lightbox.index}
        onChangeIndex={(next) => setLightbox((p) => ({ ...p, index: next }))}
        onClose={() => setLightbox((p) => ({ ...p, open: false }))}
      />
      <AllParamsModal open={paramsOpen} title={`${t("model.allParams")} - ${title}`} payload={allParamsPayload} onClose={() => setParamsOpen(false)} />

      <div className={variant === "modal" ? "p-6" : "mx-auto max-w-screen-2xl px-6 py-8 lg:py-12"}>
        <div ref={exportRef} className="bg-transparent">
          <ModelDetailHeader
            base={base}
            title={title}
            subtitle={subtitle}
            seriesId={effectiveSeriesId}
            seriesName={seriesInfo?.fullname ?? seriesInfo?.name ?? (model as any)?.series_name ?? null}
            brandId={seriesInfo?.brandId ?? (model as any)?.brand_id ?? null}
            brandName={seriesInfo?.brandName ?? (model as any)?.brand_name ?? null}
            inInquiry={inInquiry}
            onToggleInquiry={() => toggleModelId(modelId)}
            onOpenParams={() => setParamsOpen(true)}
            onExportPdf={startExportPdf}
            exporting={exporting}
            variant={variant}
            onClose={onClose}
            addToInquiryText={t("action.addToInquiry")}
          />

          <div className="pt-4">
            <ModelDetailThreeColumn
              base={base}
              modelId={modelId}
              seriesLoading={seriesLoading}
              seriesModels={seriesModels}
              availableTabs={availableTabs}
              imageTab={imageTab}
              onChangeImageTab={setImageTab}
              activeGallery={activeGallery}
              onOpenLightbox={openLightbox}
              currentModel={model}
              currentDetails={translatedDetails}
              compareId={compareId}
              onChangeCompareId={setCompareId}
              compareModel={compareModel}
              compareDetails={translatedCompareDetails}
            />

            {exporting ? (
              <div className="mt-6">
                <ExportAllParamsCard items={inlineAllParams} />
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </>
  );
}
