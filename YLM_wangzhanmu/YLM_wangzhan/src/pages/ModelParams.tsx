import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import { getModelBySlug } from "@/utils/db";
import { useInquiryDraft } from "@/store/useInquiryDraft";
import type { ModelRow } from "@/utils/db";

export default function ModelParams() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const slug = typeof params.slug === "string" ? params.slug : "";
  const base = `/${locale}`;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getModelBySlug>>>(null);

  const toggle = useInquiryDraft((s) => s.toggleModelId);
  const selectedIds = useInquiryDraft((s) => s.selectedModelIds);
  const selected = data?.model ? selectedIds.includes(data.model.id) : false;

  const query = useMemo(() => ({ slug, locale }), [slug, locale]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getModelBySlug(query)
      .then(async (d) => {
        if (!active) return;
        setData(d);
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

  function formatPrice(price: number | null, currency: string) {
    if (price == null) return null;
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currency || "GBP",
      maximumFractionDigits: 0,
    }).format(price);
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

  if (error || !data || !data.model) {
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
            <h3 className="text-2xl font-bold text-text-secondary mb-4">{t("common.notFound")}</h3>
            <Link to={`${base}/models/all`} className="btn-details mt-4 inline-flex">
              {t("action.back")}
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const model = data.model as ModelRow;
  const name = data.translation?.name ?? model.name;
  const description = data.translation?.description ?? data.translation?.summary ?? null;

  const hasPowerParams = !!(
    model.motor_total_power != null ||
    model.cltc_range != null ||
    model.motor_type ||
    model.motor_horsepower != null ||
    model.motor_total_torque != null ||
    model.transmission
  );

  const hasBodyParams = !!(
    model.level ||
    model.length_mm != null ||
    model.width_mm != null ||
    model.height_mm != null ||
    model.wheelbase_mm != null
  );

  const hasPerformanceParams = !!(
    model.max_speed != null ||
    model.acceleration_0_100 != null ||
    model.charging_time_fast ||
    model.charging_time_slow ||
    model.fast_charge_percentage != null
  );

  const priceDisplay =
    model.fob_price_min != null && model.fob_price_max != null
      ? `${formatPrice(model.fob_price_min, model.currency)} - ${formatPrice(model.fob_price_max, model.currency)}`
      : model.fob_price_min != null
      ? formatPrice(model.fob_price_min, model.currency)
      : null;

  const backUrl = `${base}/models/all`;

  return (
    <div className="min-h-screen bg-primary-dark text-text-primary relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(15,42,71,0.45)_0%,rgba(10,13,20,0.95)_100%)]"></div>
      <div className="star-field" />

      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-32 relative z-10">
        {/* Breadcrumb Navigation */}
        <div className="mb-8 flex items-center gap-2 text-sm">
          <Link to={`${base}/`} className="text-text-secondary hover:text-text-primary transition-colors">
            {t("nav.home")}
          </Link>
          <span className="text-text-tertiary">/</span>
          <Link to={`${base}/models/all`} className="text-text-secondary hover:text-text-primary transition-colors">
            {t("nav.models")}
          </Link>
          <span className="text-text-tertiary">/</span>
          <Link to={`${base}/models/${slug}`} className="text-text-secondary hover:text-text-primary transition-colors">
            {name}
          </Link>
          <span className="text-text-tertiary">/</span>
          <span className="text-text-primary">{t("model.parameters", "参数")}</span>
        </div>

        {/* Core Info Section */}
        <div className="mb-10 rounded-3xl border border-border bg-bg-card/60 p-8 shadow-xl shadow-blue-900/10 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-3 leading-tight">
                {name}
              </h1>
              {model.fullname && model.fullname !== name && (
                <p className="text-xl text-text-secondary mb-6">{model.fullname}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-6">
                {model.brand && (
                  <span className="rounded-full bg-bg-card border border-border px-4 py-2 text-sm text-text-secondary">
                    {model.brand}
                  </span>
                )}
                {model.vehicle_class && (
                  <span className="rounded-full bg-bg-card border border-border px-4 py-2 text-sm text-text-secondary">
                    {model.vehicle_class}
                  </span>
                )}
                {model.energy_type && (
                  <span className="rounded-full bg-bg-card border border-border px-4 py-2 text-sm text-text-secondary">
                    {model.energy_type}
                  </span>
                )}
                {model.motor_type && (
                  <span className="rounded-full bg-bg-card border border-border px-4 py-2 text-sm text-text-secondary">
                    {model.motor_type}
                  </span>
                )}
              </div>

              {priceDisplay && (
                <div className="mt-6">
                  <div className="text-sm text-text-tertiary mb-2">{t("model.fobPrice", "FOB 出口报价")}</div>
                  <div className="text-3xl font-bold text-text-primary">{priceDisplay}</div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Detailed Parameters - 3 modular cards */}
        {(hasPowerParams || hasBodyParams || hasPerformanceParams) && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-text-primary mb-6 px-1">{t("model.parameters", "详细参数")}</h2>
            <div className="grid gap-6 lg:grid-cols-3">
              {/* Power Parameters Card */}
              {hasPowerParams && (
                <div className="rounded-2xl border border-border bg-bg-card/60 p-6 shadow-lg shadow-blue-900/10 backdrop-blur-md">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">{t("model.powerPerformance", "动力参数")}</h3>
                  <dl className="space-y-3">
                    {model.motor_type && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.motorType", "电机类型")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.motor_type}</dd>
                      </div>
                    )}
                    {model.motor_total_power != null && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.motorTotalPower", "电机总功率")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.motor_total_power} kW</dd>
                      </div>
                    )}
                    {model.motor_horsepower != null && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.motorHorsepower", "马力")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.motor_horsepower} Ps</dd>
                      </div>
                    )}
                    {model.motor_total_torque != null && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.motorTotalTorque", "电机总扭矩")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.motor_total_torque} N·m</dd>
                      </div>
                    )}
                    {model.transmission && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.transmission", "变速箱")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.transmission}</dd>
                      </div>
                    )}
                    {model.cltc_range != null && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.cltcRange", "CLTC纯电续航")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.cltc_range} km</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Body Parameters Card */}
              {hasBodyParams && (
                <div className="rounded-2xl border border-border bg-bg-card/60 p-6 shadow-lg shadow-blue-900/10 backdrop-blur-md">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">{t("model.bodyDimensions", "车身参数")}</h3>
                  <dl className="space-y-3">
                    {model.level && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.level", "级别")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.level}</dd>
                      </div>
                    )}
                    {(model.length_mm != null || model.width_mm != null || model.height_mm != null) && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.dimensions", "尺寸")}</dt>
                        <dd className="text-sm font-medium text-text-primary">
                          {model.length_mm ?? "-"} × {model.width_mm ?? "-"} × {model.height_mm ?? "-"} mm
                        </dd>
                      </div>
                    )}
                    {model.wheelbase_mm != null && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.wheelbase", "轴距")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.wheelbase_mm} mm</dd>
                      </div>
                    )}
                    {model.body_type && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.bodyType", "车身类型")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.body_type}</dd>
                      </div>
                    )}
                    {model.seats && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.seats", "座位数")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.seats}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}

              {/* Performance & Charging Card */}
              {hasPerformanceParams && (
                <div className="rounded-2xl border border-border bg-bg-card/60 p-6 shadow-lg shadow-blue-900/10 backdrop-blur-md">
                  <h3 className="text-lg font-semibold text-text-primary mb-4">{t("model.performanceCharging", "性能充电")}</h3>
                  <dl className="space-y-3">
                    {model.max_speed != null && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.maxSpeed", "最高车速")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.max_speed} km/h</dd>
                      </div>
                    )}
                    {model.acceleration_0_100 != null && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.acceleration", "0-100km/h加速")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.acceleration_0_100} s</dd>
                      </div>
                    )}
                    {model.charging_time_fast && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.fastChargeTime", "快充时间")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.charging_time_fast}</dd>
                      </div>
                    )}
                    {model.charging_time_slow && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.slowChargeTime", "慢充时间")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.charging_time_slow}</dd>
                      </div>
                    )}
                    {model.fast_charge_percentage != null && (
                      <div className="flex justify-between">
                        <dt className="text-sm text-text-secondary">{t("model.fastChargePercentage", "快充百分比")}</dt>
                        <dd className="text-sm font-medium text-text-primary">{model.fast_charge_percentage}%</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Product Description */}
        {description && (
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-text-primary mb-6 px-1">{t("model.description", "产品简介")}</h2>
            <div className="rounded-2xl border border-border bg-bg-card/60 p-8 shadow-xl shadow-blue-900/10 backdrop-blur-md">
              <p className="text-base leading-relaxed text-text-secondary whitespace-pre-line">
                {description}
              </p>
            </div>
          </div>
        )}

        {/* Bottom Action Buttons */}
        <div className="mt-12 sticky bottom-6 bg-bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-xl shadow-blue-900/20">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate(backUrl)}
              className="btn-details"
            >
              {t("action.back", "返回列表")}
            </button>
            <button
              type="button"
              onClick={() => toggle(model.id)}
              className="btn-inquiry"
            >
              {selected ? "✓ " : ""}{t("action.addToInquiry", "加入报价单")}
            </button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
