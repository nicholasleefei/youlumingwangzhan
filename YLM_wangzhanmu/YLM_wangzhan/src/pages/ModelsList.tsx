import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import { listModels, type ModelListItem } from "@/utils/db";
import { useInquiryDraft } from "@/store/useInquiryDraft";
import { ArrowLeft } from "lucide-react";

export default function ModelsList() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const base = `/${locale}`;
  const category = typeof params.category === "string" ? params.category : undefined;
  const [models, setModels] = useState<ModelListItem[]>([]);
  const [loading, setLoading] = useState(false);

  const toggle = useInquiryDraft((s) => s.toggleModelId);
  const selectedIds = useInquiryDraft((s) => s.selectedModelIds);

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
    if (model.vehicle_class) params.push({ label: t("model.vehicleClass", "车身类型"), value: model.vehicle_class });
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

  useEffect(() => {
    async function fetchModels() {
      setLoading(true);
      try {
          const allModels = await listModels({ locale, onlyHot: false });
          console.log('Fetched models:', allModels);
          // Filter by category if provided
          const filtered = category && category !== "all"
            ? allModels.filter(m => (m as any).category === category || m.vehicle_class === category)
            : allModels;
          console.log('Filtered models:', filtered);
          setModels(filtered);
        } catch (error) {
          console.error("Failed to fetch models:", error);
        } finally {
          setLoading(false);
        }
    }
    fetchModels();
  }, [locale, category]);

  const pageTitle = category
    ? t(`category.${category}`, `${category}`)
    : t("nav.models", "车型");

  return (
    <div className="min-h-[calc(100vh-160px)] relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(15,42,71,0.45)_0%,rgba(10,13,20,0.95)_100%)]"></div>
      <div className="star-field" />
      <div className="mx-auto max-w-7xl px-4 py-16 relative z-10">
        {/* Page Title */}
        <div className="py-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-text-primary">
            {pageTitle}
          </h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-accent border-t-transparent"></div>
            <span className="ml-3 text-text-secondary">{t("common.loading")}</span>
          </div>
        ) : models.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-card py-20 text-center">
            <svg className="h-16 w-16 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="mt-4 text-lg font-medium text-text-secondary">{t("models.empty")}</p>
          </div>
        ) : (
          <div className="series-model-list bg-bg-card/20 rounded-lg border border-border overflow-hidden">
            <div className="p-4 bg-accent-green/20 text-accent-green text-center">
              Found {models.length} models
            </div>
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
                    {model.is_hot && (
                      <span className="hot-badge-enhanced absolute top-3 right-3">
                        {t("models.hot", "热销")}
                      </span>
                    )}
                  </div>

                  {/* Right: Model Info */}
                  <div className="series-model-info">
                    {/* Model Name */}
                    <h3 className="series-model-name">
                      {model.display_name}
                      {model.is_hot && (
                        <span className="inline-block ml-3 px-3 py-1 text-xs font-semibold bg-accent-green/20 text-accent-green rounded-full border border-accent-green/30">
                          {t("models.hot", "热销")}
                        </span>
                      )}
                    </h3>

                    {/* Summary/Description */}
                    {model.summary && (
                      <p className="text-text-secondary text-sm mb-2">{model.summary}</p>
                    )}

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
    </div>
  );
}
