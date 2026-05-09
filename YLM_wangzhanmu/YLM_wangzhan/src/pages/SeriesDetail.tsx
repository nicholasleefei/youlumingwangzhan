import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import * as DB from "@/utils/db";
import { useInquiryDraft } from "@/store/useInquiryDraft";
import type { SeriesRow } from "@/utils/db";
import type { ModelListItem } from "@/utils/db";

const { getSeriesById, listModelsBySeriesId } = DB;

export default function SeriesDetail() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const base = `/${locale}`;
  const seriesId = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<SeriesRow & { brands: { name: string; logo_url: string | null } } | null>(null);
  const [models, setModels] = useState<ModelListItem[]>([]);

  const toggle = useInquiryDraft((s) => s.toggleModelId);
  const selectedIds = useInquiryDraft((s) => s.selectedModelIds);

  const query = useMemo(() => ({ seriesId, locale }), [seriesId, locale]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      getSeriesById(seriesId),
      listModelsBySeriesId({ seriesId, locale }),
    ])
      .then(([s, m]) => {
        if (!active) return;
        setSeries(s as SeriesRow & { brands: { name: string; logo_url: string | null } });
        setModels(m);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : t("common.loadFailed"));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  // Extract key parameters for display (matches official website layout)
  function getModelParams(model: ModelListItem) {
    const params: { label: string; value: string }[] = [];
    if (model.level) params.push({ label: t("model.level", "级别"), value: model.level });
    if ("motor_horsepower" in model && model.motor_horsepower != null) {
      params.push({ label: t("model.motorHorsepower", "最大马力(Ps)"), value: String(model.motor_horsepower) });
    }
    if ("motor_total_power" in model && model.motor_total_power != null) {
      params.push({ label: t("model.motorTotalPower", "电动机总功率(kW)"), value: String(model.motor_total_power) });
    }
    if ("cltc_range" in model && model.cltc_range != null) {
      params.push({ label: t("model.cltcRange", "CLTC纯电续航(km)"), value: String(model.cltc_range) });
    }
    if ("combined_consumption" in model && model.combined_consumption != null) {
      params.push({ label: t("model.combinedConsumption", "WLTC综合油耗(L/100km)"), value: String(model.combined_consumption) });
    }
    if ("seats" in model && model.seats != null) {
      params.push({ label: t("model.seats", "座位数"), value: String(model.seats) });
    }
    if (model.fuel_type) params.push({ label: t("model.energyType", "能源类型"), value: model.fuel_type });
    return params;
  }

  function formatPrice(model: ModelListItem) {
    if (model.fob_price_min == null && model.fob_price_max == null) {
      return t("model.noPrice", "暂无报价");
    }
    if (model.fob_price_min != null && model.fob_price_max != null) {
      const currency = "currency" in model ? (model as any).currency : "GBP";
      return `${model.fob_price_min} - ${model.fob_price_max} ${currency}`;
    }
    if (model.fob_price_min != null) {
      const currency = "currency" in model ? (model as any).currency : "GBP";
      return `${model.fob_price_min} ${currency}`;
    }
    return t("model.noPrice", "暂无报价");
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-dark text-text-primary relative overflow-hidden">
        <SiteHeader />
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(15,42,71,0.45)_0%,rgba(10,13,20,0.95)_100%)]"></div>
        <div className="star-field" />
        <div className="mx-auto max-w-7xl px-4 py-32 relative z-10">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-accent border-t-transparent"></div>
            <span className="ml-3 text-text-secondary">{t("common.loading")}</span>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="min-h-screen bg-primary-dark text-text-primary relative overflow-hidden">
        <SiteHeader />
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(15,42,71,0.45)_0%,rgba(10,13,20,0.95)_100%)]"></div>
        <div className="star-field" />
        <div className="mx-auto max-w-7xl px-4 py-32 relative z-10">
          <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-border bg-bg-card/40 backdrop-blur-md text-center">
            <svg className="w-20 h-20 text-text-tertiary mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-lg font-medium text-red-300">{error || t("common.notFound")}</p>
            <div className="mt-6">
              <Link to={`${base}/brands`} className="btn-details">
                {t("action.back")}
              </Link>
            </div>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const seriesFullName = series.fullname || series.name;
  const brandName = series.brands.name;
  const bannerImage = series.brands.logo_url || "/tech-car-bg.jpg";

  return (
    <div className="min-h-screen bg-primary-dark text-text-primary relative overflow-hidden">
      {/* Center radial gradient background - match homepage style */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(15,42,71,0.45)_0%,rgba(10,13,20,0.95)_100%)]"></div>
      <div className="star-field" />

      <SiteHeader />

      <main className="relative z-10 pt-20">
        {/* 1. Top Brand Banner - full width, matches official website style */}
        <div className="relative w-full h-[280px] md:h-[400px] overflow-hidden">
          <img
            src={bannerImage}
            alt={seriesFullName}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/90 via-primary-dark/40 to-primary-dark/20"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight drop-shadow-lg">
              {brandName} {seriesFullName}
            </h1>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 pb-16">
          {/* 2. Section Title - "全部车系" */}
          <div className="py-10 text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
              {t("series.allModels", "全部车系")}
            </h2>
          </div>

          {/* 3. Model List - one per row, matches official layout */}
          {models.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-border bg-bg-card/60 shadow-xl shadow-blue-900/10 text-center backdrop-blur-md">
              <svg className="h-16 w-16 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 5 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-lg font-medium text-text-secondary">{t("models.empty", "当前没有车型数据")}</p>
              <div className="mt-6">
                <Link to={`${base}/brands`} className="btn-details">
                  {t("action.back")}
                </Link>
              </div>
            </div>
          ) : (
            <div className="series-model-list">
              {models.map((model) => {
                const detailUrl = model.slug ? `${base}/detail/${model.slug}` : `${base}/admin`;
                const modelParams = getModelParams(model);
                const priceText = formatPrice(model);
                const selected = selectedIds.includes(model.id);

                return (
                  <div key={model.id} className="series-model-item">
                    {/* Left: Model Image */}
                    <div className="series-model-image">
                      {model.cover_image ? (
                        <img
                          src={model.cover_image}
                          alt={model.display_name}
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-bg-card/60">
                          <div className="text-text-tertiary">{t("common.noImage")}</div>
                        </div>
                      )}
                    </div>

                    {/* Right: Model Info */}
                    <div className="series-model-info">
                      {/* Model Name */}
                      <h3 className="series-model-name">
                        {model.display_name}
                      </h3>

                      {/* Parameters - two column layout like official site */}
                      <div className="series-model-params">
                        {modelParams.length > 0 ? (
                          <div className="params-grid">
                            {modelParams.map((param, i) => (
                              <div key={i} className="param-row">
                                <span className="param-label">{param.label}</span>
                                <span className="param-value">{param.value}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-text-secondary text-sm">{t("model.noParams", "暂无参数信息")}</p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="series-model-price">
                        {priceText}
                      </div>

                      {/* Action Buttons */}
                      <div className="series-model-actions">
                        <Link to={detailUrl} className="btn-details">
                          {t("action.viewDetails", "查看详情")}
                        </Link>
                        <button
                          type="button"
                          onClick={() => toggle(model.id)}
                          className="btn-inquiry"
                        >
                          {selected ? "✓ " : ""}{t("action.addToInquiry")}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
