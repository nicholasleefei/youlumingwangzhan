import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import { getModelBySlug, type ModelRow } from "@/utils/db";
import { useInquiryDraft } from "@/store/useInquiryDraft";
import { cn } from "@/lib/utils";

type ModelProfessionalDetailData = Awaited<ReturnType<typeof getModelBySlug>>;

const DEMO_EXTERIOR_IMAGES = [
  "/tech-car-bg.jpg",
  "/tech-car-bg.jpg",
  "/tech-car-bg.jpg",
];

const DEMO_INTERIOR_IMAGES = [
  "/tech-car-bg.jpg",
  "/tech-car-bg.jpg",
];

const DEFAULT_HIGHLIGHTS = [
  "纯电新能源动力，零排放符合欧美环保标准",
  "L2+级智能驾驶辅助系统，出口适配海外地图",
  "大容量电池，长续航满足长途出行需求",
  "智能网联系统，支持OTA远程升级",
  "专业出口质检，满足目标国认证标准",
  "工厂直供价格，优势货源保证交期",
];

export default function ModelProfessionalDetail() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const slug = typeof params.slug === "string" ? params.slug : "";
  const base = `/${locale}`;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<ModelProfessionalDetailData>(null);
  const [activeTab, setActiveTab] = useState<"params" | "exterior" | "interior">("params");
  const [currentExteriorIndex, setCurrentExteriorIndex] = useState(0);
  const [currentInteriorIndex, setCurrentInteriorIndex] = useState(0);

  const toggle = useInquiryDraft((s) => s.toggleModelId);

  const query = useMemo(() => ({ slug, locale }), [slug, locale]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getModelBySlug(query)
      .then((d) => {
        if (active) setData(d);
      })
      .catch((e: unknown) => {
        if (active) setError(e instanceof Error ? e.message : t("common.loadFailed"));
      })
      .finally(() => {
        if (active) setLoading(false);
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

  // Get model with defaults
  const model: ModelRow & { [key: string]: unknown } = data?.model || {
    id: "demo",
    name: slug || "Demo Model",
    fullname: null,
    slug: slug || "demo",
    brand: "Demo Brand",
    vehicle_class: "Mid-size Sedan",
    energy_type: "Pure Electric",
    is_hot: true,
    is_active: true,
    fob_price_min: 30000,
    fob_price_max: 40000,
    currency: "GBP",
    cltc_range: 550,
    motor_total_power: 200,
    motor_horsepower: 272,
    motor_total_torque: 400,
    motor_type: "Single Motor",
    transmission: "Fixed Gear",
    level: "B-class",
    length_mm: 4700,
    width_mm: 1850,
    height_mm: 1480,
    wheelbase_mm: 2800,
    body_type: "Sedan",
    seats: 5,
    max_speed: 180,
    acceleration_0_100: 5.8,
    charging_time_fast: "0.5h",
    charging_time_slow: null,
    fast_charge_percentage: 80,
    year: null,
    manufacturer: null,
    series_id: null,
    specs: {},
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  } as ModelRow;

  const name = data?.translation?.name ?? model.name;
  const fullname = model.fullname ?? name;
  const description = data?.translation?.description ?? data?.translation?.summary ?? null;
  const coverImage = data?.images?.[0]?.path ?? DEMO_EXTERIOR_IMAGES[0];

  // Get images with fallback
  const getExteriorImages = (): string[] => {
    if (data?.images && data.images.length > 0) {
      const images = data.images.map(img => img.path);
      if (images.length > 0) return images;
    }
    // @ts-ignore
    if (model.exterior_images && Array.isArray(model.exterior_images) && model.exterior_images.length > 0) {
      // @ts-ignore
      return model.exterior_images.filter((img: unknown) => typeof img === "string" && img.trim());
    }
    return DEMO_EXTERIOR_IMAGES;
  };

  const getInteriorImages = (): string[] => {
    if (data?.images && data.images.length > 0) {
      // Return extra images if available
      const extra = data.images.slice(1).map(img => img.path);
      if (extra.length > 0) return extra;
    }
    // @ts-ignore
    if (model.interior_images && Array.isArray(model.interior_images) && model.interior_images.length > 0) {
      // @ts-ignore
      return model.interior_images.filter((img: unknown) => typeof img === "string" && img.trim());
    }
    return DEMO_INTERIOR_IMAGES;
  };

  const exteriorImages = getExteriorImages();
  const interiorImages = getInteriorImages();

  const priceDisplay =
    model.fob_price_min != null && model.fob_price_max != null
      ? `${formatPrice(model.fob_price_min, model.currency)} - ${formatPrice(model.fob_price_max, model.currency)}`
      : model.fob_price_min != null
      ? formatPrice(model.fob_price_min, model.currency)
      : null;

  const backUrl = `${base}/models/all`;

  // Check parameters availability
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
    model.wheelbase_mm != null ||
    model.seats != null
  );

  const hasPerformanceParams = !!(
    model.max_speed != null ||
    model.acceleration_0_100 != null ||
    model.charging_time_fast ||
    model.charging_time_slow ||
    model.fast_charge_percentage != null
  );

  const hasAnyParams = hasPowerParams || hasBodyParams || hasPerformanceParams;

  // Navigation
  const nextExterior = () => {
    setCurrentExteriorIndex((prev) => (prev + 1) % exteriorImages.length);
  };
  const prevExterior = () => {
    setCurrentExteriorIndex((prev) => (prev - 1 + exteriorImages.length) % exteriorImages.length);
  };
  const goToExterior = (index: number) => setCurrentExteriorIndex(index);

  const nextInterior = () => {
    setCurrentInteriorIndex((prev) => (prev + 1) % interiorImages.length);
  };
  const prevInterior = () => {
    setCurrentInteriorIndex((prev) => (prev - 1 + interiorImages.length) % interiorImages.length);
  };
  const goToInterior = (index: number) => setCurrentInteriorIndex(index);

  const selectedIds = useInquiryDraft((s) => s.selectedModelIds);
  const selected = data?.model ? selectedIds.includes(data.model.id) : false;

  const highlights = description
    ? description.split("\n").filter(line => line.trim())
    : DEFAULT_HIGHLIGHTS.map(text => t(`model.${text.toLowerCase().replace(/\s+/g, '')}`, text));

  return (
    <div className="relative overflow-hidden min-h-[calc(100vh-80px)]">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(15,42,71,0.45)_0%,rgba(10,13,20,0.95)_100%)]"></div>
      <div className="star-field" />

      {loading && (
        <div className="mx-auto max-w-7xl px-4 py-32 relative z-10">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-accent border-t-transparent"></div>
            <span className="ml-3 text-text-secondary">{t("common.loading")}</span>
          </div>
        </div>
      )}

      {!loading && (error || !data) && (
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
      )}

      {!loading && data && (
        <main className="relative z-10">
          {/* 1. Hero Panorama Main Image */}
          <section className="relative h-[70vh] min-h-[500px] overflow-hidden">
            <img
              src={coverImage}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/70 to-primary-dark/30" />

            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto max-w-7xl w-full px-4 pb-16">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div>
                    {model.is_hot && (
                      <span className="inline-block mb-4 px-4 py-2 rounded-full text-sm font-semibold bg-accent-green text-white shadow-glow-green">
                        {t("models.hot", "热销")}
                      </span>
                    )}
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">
                      {fullname}
                    </h1>
                    {model.fullname !== name && model.fullname && (
                      <p className="mt-3 text-xl md:text-2xl text-white/80">{name}</p>
                    )}
                  </div>
                </div>

                {/* Core Quick Preview Bar */}
                {(model.cltc_range != null || model.motor_total_power != null || model.level || model.seats != null) && (
                  <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 bg-bg-card/60 backdrop-blur-md rounded-2xl border border-border p-6 shadow-xl shadow-blue-900/10">
                    {model.cltc_range != null && (
                      <div className="text-center">
                        <div className="text-sm text-text-tertiary mb-1">{t("model.cltcRange", "CLTC续航")}</div>
                        <div className="text-xl font-bold text-text-primary">{model.cltc_range} <span className="text-sm font-normal text-text-secondary">km</span></div>
                      </div>
                    )}
                    {model.motor_total_power != null && (
                      <div className="text-center">
                        <div className="text-sm text-text-tertiary mb-1">{t("model.motorTotalPower", "电机功率")}</div>
                        <div className="text-xl font-bold text-text-primary">{model.motor_total_power} <span className="text-sm font-normal text-text-secondary">kW</span></div>
                      </div>
                    )}
                    {model.level && (
                      <div className="text-center">
                        <div className="text-sm text-text-tertiary mb-1">{t("model.level", "车身级别")}</div>
                        <div className="text-xl font-bold text-text-primary">{model.level}</div>
                      </div>
                    )}
                    {model.seats != null && (
                      <div className="text-center">
                        <div className="text-sm text-text-tertiary mb-1">{t("model.seats", "座位数")}</div>
                        <div className="text-xl font-bold text-text-primary">{model.seats} <span className="text-sm font-normal text-text-secondary">座</span></div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* Breadcrumb Navigation */}
          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex items-center gap-2 text-sm">
              <Link to={`${base}/`} className="text-text-secondary hover:text-text-primary transition-colors">
                {t("nav.home")}
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link to={`${base}/models/all`} className="text-text-secondary hover:text-text-primary transition-colors">
                {t("nav.models")}
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary">{name}</span>
            </div>
          </div>

          {/* 2. Core Info & Price Section */}
          <section className="mx-auto max-w-7xl px-4 pb-12">
            <div className="rounded-3xl border border-border bg-bg-card/60 p-8 shadow-xl shadow-blue-900/10 backdrop-blur-md">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                <div className="flex-1">
                  {/* Attribute Tags */}
                  <div className="flex flex-wrap gap-3 mb-6">
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

                  {/* Price */}
                  <div>
                    <div className="text-sm text-text-tertiary mb-2">{t("model.fobPrice", "FOB 出口报价")}</div>
                    <div className="text-4xl font-bold text-text-primary">
                      {priceDisplay || t("model.noPrice", "暂无报价")}
                    </div>
                  </div>
                </div>

                <div className="flex-none">
                  <button
                    type="button"
                    onClick={() => toggle(model.id)}
                    className="btn-inquiry px-12 py-4 text-lg"
                  >
                    {selected ? "✓ " : ""}{t("action.addToInquiry", "加入报价单")}
                  </button>
                </div>
              </div>
            </div>
          </section>

          {/* 3. Tab Content Section */}
          <section className="mx-auto max-w-7xl px-4 pb-12">
            {/* Tab Buttons */}
            <div className="flex gap-2 mb-8 border-b border-border">
              <button
                type="button"
                onClick={() => setActiveTab("params")}
                className={cn(
                  "px-6 py-3 text-base font-medium transition-all border-b-2 -mb-px",
                  activeTab === "params"
                    ? "border-accent-green text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                {t("model.parameters", "车型参数")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("exterior")}
                className={cn(
                  "px-6 py-3 text-base font-medium transition-all border-b-2 -mb-px",
                  activeTab === "exterior"
                    ? "border-accent-green text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                {t("model.exteriorGallery", "外观图集")}
              </button>
              <button
                type="button"
                onClick={() => setActiveTab("interior")}
                className={cn(
                  "px-6 py-3 text-base font-medium transition-all border-b-2 -mb-px",
                  activeTab === "interior"
                    ? "border-accent-green text-text-primary"
                    : "border-transparent text-text-secondary hover:text-text-primary"
                )}
              >
                {t("model.interiorGallery", "内饰图集")}
              </button>
            </div>

            {/* Tab Content */}
            <div className="rounded-2xl border border-border bg-bg-card/60 p-6 shadow-xl shadow-blue-900/10 backdrop-blur-md">
              {/* Parameters Tab */}
              {activeTab === "params" && (
                hasAnyParams ? (
                  <div className="grid gap-6 lg:grid-cols-3">
                    {/* Power Parameters Card */}
                    {hasPowerParams && (
                      <div className="rounded-xl border border-border bg-bg-card/60 p-6 shadow-lg shadow-blue-900/10 backdrop-blur-md">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("model.powerPerformance", "动力性能")}</h3>
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
                              <dt className="text-sm text-text-secondary">{t("model.motorHorsepower", "最大马力")}</dt>
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
                      <div className="rounded-xl border border-border bg-bg-card/60 p-6 shadow-lg shadow-blue-900/10 backdrop-blur-md">
                        <h3 className="text-lg font-semibold text-text-primary mb-4">{t("model.bodyDimensions", "车身规格")}</h3>
                        <dl className="space-y-3">
                          {model.level && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-text-secondary">{t("model.level", "车身级别")}</dt>
                              <dd className="text-sm font-medium text-text-primary">{model.level}</dd>
                            </div>
                          )}
                          {(model.length_mm != null || model.width_mm != null || model.height_mm != null) && (
                            <div className="flex justify-between">
                              <dt className="text-sm text-text-secondary">{t("model.dimensions", "外观尺寸")}</dt>
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
                          {model.seats != null && (
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
                      <div className="rounded-xl border border-border bg-bg-card/60 p-6 shadow-lg shadow-blue-900/10 backdrop-blur-md">
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
                ) : (
                  <div className="py-12 text-center">
                    <p className="text-text-secondary">{t("model.noParams", "暂无参数数据")}</p>
                  </div>
                )
              )}

              {/* Exterior Gallery Tab */}
              {activeTab === "exterior" && (
                <div className="relative">
                  {/* Main Image */}
                  <div className="relative overflow-hidden rounded-xl aspect-[16/9] bg-bg-card/80 border border-border">
                    <img
                      src={exteriorImages[currentExteriorIndex]}
                      alt={`${name} ${t("model.exterior")} ${currentExteriorIndex + 1}`}
                      className="h-full w-full object-contain bg-bg-hover"
                    />
                    {exteriorImages.length > 1 && (
                      <>
                        <button
                          onClick={prevExterior}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-bg-card/80 text-text-primary hover:bg-bg-card backdrop-blur-sm border border-border transition-colors"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={nextExterior}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-bg-card/80 text-text-primary hover:bg-bg-card backdrop-blur-sm border border-border transition-colors"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {exteriorImages.length > 1 && (
                    <div className="mt-4 grid grid-cols-6 gap-3">
                      {exteriorImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => goToExterior(index)}
                          className={cn(
                            "overflow-hidden rounded-lg aspect-video border-2 transition-all duration-200",
                            index === currentExteriorIndex
                              ? "border-blue-400 shadow-lg shadow-blue-500/30"
                              : "border-transparent bg-bg-card/60 hover:border-border"
                          )}
                        >
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Interior Gallery Tab */}
              {activeTab === "interior" && (
                <div className="relative">
                  {/* Main Image */}
                  <div className="relative overflow-hidden rounded-xl aspect-[16/9] bg-bg-card/80 border border-border">
                    <img
                      src={interiorImages[currentInteriorIndex]}
                      alt={`${name} ${t("model.interior")} ${currentInteriorIndex + 1}`}
                      className="h-full w-full object-contain bg-bg-hover"
                    />
                    {interiorImages.length > 1 && (
                      <>
                        <button
                          onClick={prevInterior}
                          className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-bg-card/80 text-text-primary hover:bg-bg-card backdrop-blur-sm border border-border transition-colors"
                        >
                          <ChevronLeft size={24} />
                        </button>
                        <button
                          onClick={nextInterior}
                          className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-bg-card/80 text-text-primary hover:bg-bg-card backdrop-blur-sm border border-border"
                        >
                          <ChevronRight size={24} />
                        </button>
                      </>
                    )}
                  </div>

                  {/* Thumbnails */}
                  {interiorImages.length > 1 && (
                    <div className="mt-4 grid grid-cols-6 gap-3">
                      {interiorImages.map((img, index) => (
                        <button
                          key={index}
                          onClick={() => goToInterior(index)}
                          className={cn(
                            "overflow-hidden rounded-lg aspect-video border-2 transition-all duration-200",
                            index === currentInteriorIndex
                              ? "border-blue-400 shadow-lg shadow-blue-500/30"
                              : "border-transparent bg-bg-card/60 hover:border-border"
                          )}
                        >
                          <img
                            src={img}
                            alt=""
                            className="h-full w-full object-cover"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* 4. Product Highlights & Export Advantages */}
          <section className="mx-auto max-w-7xl px-4 pb-16">
            <h2 className="text-2xl font-bold text-text-primary mb-6 px-1">{t("model.productHighlights", "产品亮点 & 出口优势")}</h2>
            <div className="rounded-3xl border border-border bg-bg-card/60 p-8 shadow-xl shadow-blue-900/10 backdrop-blur-md">
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {highlights.map((highlight, index) => (
                  <li key={index} className="flex items-start gap-3 p-4 rounded-xl bg-bg-card/60 border border-border">
                    <div className="mt-1 w-2 h-2 rounded-full bg-accent-green shrink-0"></div>
                    <p className="text-base text-text-secondary leading-relaxed">{highlight}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>

          {/* 5. Bottom Fixed CTA */}
          <section className="mx-auto max-w-7xl px-4 pb-16">
            <div className="sticky bottom-6 bg-bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-xl shadow-blue-900/20">
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => navigate(backUrl)}
                  className="btn-details"
                >
                  {t("action.backToList", "返回车型列表")}
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
          </section>
        </main>
      )}
    </div>
  );
}
