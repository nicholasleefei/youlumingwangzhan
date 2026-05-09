import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useInquiryDraft } from "@/store/useInquiryDraft";

const ZEEKR_007_DATA = {
  name: "ZEEKR 007",
  name_zh: "极氪007",
  brand: "ZEEKR",
  manufacturer: "Zeekr (Geely)",
  level: "Mid-size Sedan",
  energy_type: "Pure Electric",
  year: 2025,
  fob_price_min: 24990,
  fob_price_max: 30990,
  currency: "USD",
  is_hot: true,
  cltc_range: 688,
  charging_time_fast: "10 min",
  charging_time_slow: "35 min",
  fast_charge_percentage: 80,
  motor_type: "Single Motor",
  transmission: "Fixed Gear",
  motor_horsepower: 415,
  motor_total_power: 310,
  motor_total_torque: 440,
  body_type: "4-door Sedan",
  length_mm: 4865,
  width_mm: 1901,
  height_mm: 1459,
  wheelbase_mm: 2920,
  max_speed: 205,
  acceleration_0_100: 5.6,
  summary_zh: "纯电中型轿车，颠覆设计，真智驾，真续航",
  description_zh: "极氪007是极氪品牌旗下纯电中型轿车，采用一体式智驾设计，最大CLTC续航里程可达688公里，搭载骁龙8295智能座舱芯片，加速0-100km/h仅需5.6秒。",
  summary_en: "Pure Electric Mid-size Sedan, revolutionary design, true autonomous driving, true range",
  description_en: "The ZEEKR 007 is a pure electric mid-size sedan from ZEEKR brand. It features integrated intelligent driving design, maximum CLTC range up to 688km, powered by Snapdragon 8295 cockpit chip, accelerates from 0-100km/h in just 5.6 seconds.",
  images: [
    "https://images.unsplash.com/photo-1549399542-760feb95d450?w=1200&h=675&fit=crop",
    "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&h=675&fit=crop",
    "https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=1200&h=675&fit=crop",
    "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=675&fit=crop",
  ],
};

export default function Zeekr007Demo() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language;
  const isZh = locale.startsWith("zh");
  const base = `/${locale}`;

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const modelId = "demo-zeekr-007";

  const add = useInquiryDraft((s) => s.toggleModelId);
  const selected = useInquiryDraft((s) => s.selectedModelIds.includes(modelId));

  const name = isZh ? ZEEKR_007_DATA.name_zh : ZEEKR_007_DATA.name;
  const desc = isZh ? ZEEKR_007_DATA.description_zh : ZEEKR_007_DATA.description_en;
  const summary = isZh ? ZEEKR_007_DATA.summary_zh : ZEEKR_007_DATA.summary_en;

  function nextImage() {
    setCurrentImageIndex((prev) => (prev + 1) % ZEEKR_007_DATA.images.length);
  }

  function prevImage() {
    setCurrentImageIndex((prev) => (prev - 1 + ZEEKR_007_DATA.images.length) % ZEEKR_007_DATA.images.length);
  }

  function goToImage(index: number) {
    setCurrentImageIndex(index);
  }

  const currentImage = ZEEKR_007_DATA.images[currentImageIndex];

  const hasAnyBasicParams = !!(
    ZEEKR_007_DATA.manufacturer ||
    ZEEKR_007_DATA.level ||
    ZEEKR_007_DATA.body_type ||
    ZEEKR_007_DATA.cltc_range != null ||
    ZEEKR_007_DATA.charging_time_fast ||
    ZEEKR_007_DATA.motor_type ||
    ZEEKR_007_DATA.motor_horsepower != null ||
    ZEEKR_007_DATA.length_mm != null ||
    ZEEKR_007_DATA.max_speed != null ||
    ZEEKR_007_DATA.acceleration_0_100 != null
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex items-center gap-2 text-sm">
        <Link to={`${base}/models`} className="text-zinc-600 hover:text-zinc-900">
          {t("nav.models")}
        </Link>
        <span className="text-zinc-300">/</span>
        <span className="text-zinc-800">{t("model.detail")}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="relative overflow-hidden rounded-2xl bg-zinc-900 aspect-[4/3]">
            <img src={currentImage} alt={name} className="h-full w-full object-cover" />
            {ZEEKR_007_DATA.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-zinc-800 hover:bg-white backdrop-blur-sm"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/80 text-zinc-800 hover:bg-white backdrop-blur-sm"
                >
                  <ChevronRight size={20} />
                </button>
              </>
            )}
          </div>
          {ZEEKR_007_DATA.images.length > 1 && (
            <div className="grid grid-cols-6 gap-2">
              {ZEEKR_007_DATA.images.map((img, index) => (
                <button
                  key={index}
                  onClick={() => goToImage(index)}
                  className={cn(
                    "overflow-hidden rounded-lg aspect-video border-2",
                    index === currentImageIndex ? "border-amber-500" : "border-transparent"
                  )}
                >
                  <img src={img} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <h1 className="truncate text-3xl font-semibold text-zinc-900 mb-3">{name}</h1>
                <div className="flex flex-wrap items-center gap-2">
                  {ZEEKR_007_DATA.is_hot ? (
                    <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-medium text-red-700">{t("models.hot")}</span>
                  ) : null}
                  {ZEEKR_007_DATA.brand && (
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">{ZEEKR_007_DATA.brand}</span>
                  )}
                  {ZEEKR_007_DATA.energy_type && (
                    <span className="rounded-full bg-zinc-100 px-3 py-1 text-sm text-zinc-700">{ZEEKR_007_DATA.energy_type}</span>
                  )}
                </div>
              </div>
            </div>

            {desc && <p className="mt-4 text-base leading-relaxed text-zinc-600">{desc}</p>}

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="text-xs text-zinc-500">{t("model.fob")}</div>
                <div className="mt-1 text-lg font-semibold text-zinc-800">
                  {ZEEKR_007_DATA.fob_price_min ?? "-"} ~ {ZEEKR_007_DATA.fob_price_max ?? "-"}
                  <span className="text-sm ml-1 font-normal">{ZEEKR_007_DATA.currency}</span>
                </div>
              </div>
              <div className="rounded-xl bg-zinc-50 p-4">
                <div className="text-xs text-zinc-500">{t("model.year")}</div>
                <div className="mt-1 text-lg font-semibold text-zinc-800">{ZEEKR_007_DATA.year ?? "-"}</div>
              </div>
            </div>

            {ZEEKR_007_DATA.cltc_range != null && (
              <div className="mt-6">
                <div className="text-xs text-zinc-500 mb-1">{t("model.cltcRange")}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-900">{ZEEKR_007_DATA.cltc_range}</span>
                  <span className="text-sm text-zinc-500">km</span>
                </div>
              </div>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to={`${base}/inquiry`}
                className="inline-flex flex-1 items-center justify-center rounded-xl bg-amber-500 px-6 py-3.5 text-base font-medium text-zinc-950 hover:bg-amber-400"
              >
                {t("action.requestQuote")}
              </Link>
              <button
                type="button"
                onClick={() => add(modelId)}
                className={cn(
                  "inline-flex flex-1 items-center justify-center rounded-xl px-6 py-3.5 text-base font-medium",
                  selected
                    ? "bg-amber-500 text-zinc-950 hover:bg-amber-400"
                    : "bg-zinc-100 text-zinc-900 hover:bg-zinc-200"
                )}
              >
                {t("action.addToInquiry")}
              </button>
            </div>
          </div>
        </div>
      </div>

      {hasAnyBasicParams && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-zinc-900 mb-6">{t("model.basicParameters")}</h2>
          <div className="grid gap-6 lg:grid-cols-3">
            {(ZEEKR_007_DATA.manufacturer || ZEEKR_007_DATA.level || ZEEKR_007_DATA.body_type || ZEEKR_007_DATA.energy_type) && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-medium text-zinc-900 mb-4">{isZh ? "基本信息" : t("model.basicInfo")}</h3>
                <dl className="space-y-3">
                  {ZEEKR_007_DATA.manufacturer && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.manufacturer")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.manufacturer}</dd>
                    </div>
                  )}
                  {ZEEKR_007_DATA.level && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.level")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.level}</dd>
                    </div>
                  )}
                  {ZEEKR_007_DATA.body_type && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.bodyType")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.body_type}</dd>
                    </div>
                  )}
                  {ZEEKR_007_DATA.energy_type && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.energyType")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.energy_type}</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {(ZEEKR_007_DATA.cltc_range != null || ZEEKR_007_DATA.charging_time_fast || ZEEKR_007_DATA.charging_time_slow || ZEEKR_007_DATA.fast_charge_percentage != null) && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-medium text-zinc-900 mb-4">{isZh ? "电池充电" : t("model.batteryCharging")}</h3>
                <dl className="space-y-3">
                  {ZEEKR_007_DATA.cltc_range != null && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.cltcRange")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.cltc_range} km</dd>
                    </div>
                  )}
                  {(ZEEKR_007_DATA.charging_time_fast || ZEEKR_007_DATA.charging_time_slow) && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.chargingTime")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">
                        {ZEEKR_007_DATA.charging_time_fast && `${ZEEKR_007_DATA.charging_time_fast} ${isZh ? "快充" : "fast"}`}
                        {ZEEKR_007_DATA.charging_time_fast && ZEEKR_007_DATA.charging_time_slow && " / "}
                        {ZEEKR_007_DATA.charging_time_slow && `${ZEEKR_007_DATA.charging_time_slow} ${isZh ? "慢充" : "slow"}`}
                      </dd>
                    </div>
                  )}
                  {ZEEKR_007_DATA.fast_charge_percentage != null && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.fastChargePercentage")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.fast_charge_percentage}%</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {(ZEEKR_007_DATA.motor_type || ZEEKR_007_DATA.transmission || ZEEKR_007_DATA.motor_horsepower != null || ZEEKR_007_DATA.motor_total_power != null || ZEEKR_007_DATA.motor_total_torque != null) && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-medium text-zinc-900 mb-4">{isZh ? "动力性能" : t("model.powerPerformance")}</h3>
                <dl className="space-y-3">
                  {ZEEKR_007_DATA.motor_type && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.motor")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.motor_type}</dd>
                    </div>
                  )}
                  {ZEEKR_007_DATA.transmission && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.transmission")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.transmission}</dd>
                    </div>
                  )}
                  {ZEEKR_007_DATA.motor_horsepower != null && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.motorHorsepower")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.motor_horsepower} Ps</dd>
                    </div>
                  )}
                  {ZEEKR_007_DATA.motor_total_power != null && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.motorTotalPower")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.motor_total_power} kW</dd>
                    </div>
                  )}
                  {ZEEKR_007_DATA.motor_total_torque != null && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.motorTotalTorque")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.motor_total_torque} N・m</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}

            {(ZEEKR_007_DATA.length_mm != null || ZEEKR_007_DATA.width_mm != null || ZEEKR_007_DATA.height_mm != null || ZEEKR_007_DATA.wheelbase_mm != null || ZEEKR_007_DATA.max_speed != null || ZEEKR_007_DATA.acceleration_0_100 != null) && (
              <div className="rounded-2xl border border-zinc-200 bg-white p-6">
                <h3 className="text-sm font-medium text-zinc-900 mb-4">{isZh ? "车身尺寸" : t("model.bodyDimensions")}</h3>
                <dl className="space-y-3">
                  {(ZEEKR_007_DATA.length_mm != null || ZEEKR_007_DATA.width_mm != null || ZEEKR_007_DATA.height_mm != null) && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.dimensions")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">
                        {ZEEKR_007_DATA.length_mm ?? "-"} × {ZEEKR_007_DATA.width_mm ?? "-"} × {ZEEKR_007_DATA.height_mm ?? "-"} mm
                      </dd>
                    </div>
                  )}
                  {ZEEKR_007_DATA.wheelbase_mm != null && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.wheelbase")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.wheelbase_mm} mm</dd>
                    </div>
                  )}
                  {ZEEKR_007_DATA.max_speed != null && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.maxSpeed")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.max_speed} km/h</dd>
                    </div>
                  )}
                  {ZEEKR_007_DATA.acceleration_0_100 != null && (
                    <div className="flex justify-between">
                      <dt className="text-sm text-zinc-500">{t("model.acceleration")}</dt>
                      <dd className="text-sm font-medium text-zinc-800">{ZEEKR_007_DATA.acceleration_0_100} s</dd>
                    </div>
                  )}
                </dl>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
