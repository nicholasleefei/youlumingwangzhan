import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import { getModelBySlug, type ModelRow } from "@/utils/db";
import { useInquiryDraft } from "@/store/useInquiryDraft";
import ModelDetailContent from "@/components/modelDetail/ModelDetailContent";

type ModelData = Awaited<ReturnType<typeof getModelBySlug>>;

const DEMO_EXTERIOR_IMAGES = [
  "/tech-car-bg.jpg",
  "/tech-car-bg.jpg",
  "/tech-car-bg.jpg",
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
  const [data, setData] = useState<ModelData>(null);

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

  const model: ModelRow & { [key: string]: unknown } = (data?.model as ModelRow) || {
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
    activity_status: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const name = data?.translation?.name ?? model.name;
  const fullname = model.fullname ?? name;
  const coverImage = data?.images?.[0]?.path ?? DEMO_EXTERIOR_IMAGES[0];

  const priceText =
    model.fob_price_min != null && model.fob_price_max != null
      ? `${formatPrice(model.fob_price_min, model.currency)} - ${formatPrice(model.fob_price_max, model.currency)}`
      : model.fob_price_min != null
      ? formatPrice(model.fob_price_min, model.currency)
      : null;

  const backUrl = `${base}/brands`;

  const selectedIds = useInquiryDraft((s) => s.selectedModelIds);
  const selected = data?.model ? selectedIds.includes(data.model.id) : false;

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
            <Link to={`${base}/brands`} className="btn-details mt-4 inline-flex">
              {t("action.back")}
            </Link>
          </div>
        </div>
      )}

      {!loading && data && (
        <main className="relative z-10">
          <section className="relative h-[70vh] min-h-[300px] sm:min-h-[500px] overflow-hidden">
            <img
              src={coverImage}
              alt={name}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-primary-dark via-primary-dark/70 to-primary-dark/30"></div>

            <div className="absolute inset-0 flex items-end">
              <div className="mx-auto max-w-7xl w-full px-4 pb-16">
                <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
                  <div>
                    {model.is_hot && (
                      <span className="inline-block mb-4 px-4 py-2 rounded-full text-sm font-semibold bg-accent-green text-white shadow-glow-green">
                        {t("models.hot", "热销")}
                      </span>
                    )}
                    <h1 className="text-4xl md:text-6xl font-bold text-white tracking-tight leading-tight">{fullname}</h1>
                    {String(model.fullname) !== String(name) && model.fullname && (
                      <p className="mt-3 text-xl md:text-2xl text-white/80">{name}</p>
                    )}
                  </div>
                </div>

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
                        <div className="text-sm text-text-tertiary mb-1">{t("model.level", "级别")}</div>
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

          <div className="mx-auto max-w-7xl px-4 py-6">
            <div className="flex items-center gap-2 text-sm">
              <Link to={`${base}/`} className="text-text-secondary hover:text-text-primary transition-colors">
                {t("nav.home")}
              </Link>
              <span className="text-text-tertiary">/</span>
              <Link to={`${base}/brands`} className="text-text-secondary hover:text-text-primary transition-colors">
                {t("nav.brands")}
              </Link>
              <span className="text-text-tertiary">/</span>
              <span className="text-text-primary">{name}</span>
            </div>
          </div>

          <section className="mx-auto max-w-7xl px-4 pb-12">
            <div className="rounded-3xl border border-border bg-bg-card/60 p-8 shadow-xl shadow-blue-900/10 backdrop-blur-md">
              <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
                <div className="flex-1">
                  <div className="flex flex-wrap gap-3 mb-6">
                    {model.brand && (
                      <span className="rounded-full bg-bg-card border border-border px-4 py-2 text-sm text-text-secondary">{model.brand}</span>
                    )}
                    {model.vehicle_class && (
                      <span className="rounded-full bg-bg-card border border-border px-4 py-2 text-sm text-text-secondary">{model.vehicle_class}</span>
                    )}
                    {model.energy_type && (
                      <span className="rounded-full bg-bg-card border border-border px-4 py-2 text-sm text-text-secondary">{model.energy_type}</span>
                    )}
                    {model.motor_type && (
                      <span className="rounded-full bg-bg-card border border-border px-4 py-2 text-sm text-text-secondary">{model.motor_type}</span>
                    )}
                  </div>

                  <div>
                    <div className="text-sm text-text-tertiary mb-2">{t("model.fobPrice", "FOB 出口报价")}</div>
                    <div className="text-4xl font-bold text-text-primary">{priceText || t("model.noPrice", "暂无报价")}</div>
                  </div>
                </div>

                <div className="flex-none">
                  <button type="button" onClick={() => toggle(model.id)} className="btn-inquiry px-12 py-4 text-lg">
                    {selected ? "✓ " : ""}{t("action.addToInquiry", "加入报价单")}
                  </button>
                </div>
              </div>
            </div>
          </section>

          <section className="bg-zinc-50">
            <ModelDetailContent locale={locale} modelId={data.model.id} variant="page" />
          </section>
        </main>
      )}
    </div>
  );
}
