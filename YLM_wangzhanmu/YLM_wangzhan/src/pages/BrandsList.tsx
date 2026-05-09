import { useEffect, useState, useRef } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import { supabase } from "@/utils/supabaseClient";
import { listModels, listSeries, listModelsBySeriesId, type ModelListItem, type SeriesRow } from "@/utils/db";
import { useInquiryDraft } from "@/store/useInquiryDraft";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

type BrandRow = {
  id: string;
  jm_id: number;
  name: string;
  initial: string | null;
  logo_url: string | null;
  parent_id: number;
  depth: number;
  created_at: string;
  updated_at: string;
};

type EnergyFilter = "all" | "electric" | "fuel";
type BodyFilter = "all" | "sedan" | "suv" | "mpv" | "pickup";

export default function BrandsList() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const base = `/${locale}`;

  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingModels, setLoadingModels] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandRow | null>(null);
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [models, setModels] = useState<ModelListItem[]>([]);
  const [seriesModels, setSeriesModels] = useState<Record<string, ModelListItem>>({});
  const [energyFilter, setEnergyFilter] = useState<EnergyFilter>("all");
  const [bodyFilter, setBodyFilter] = useState<BodyFilter>("all");
  const brandsNavRef = useRef<HTMLDivElement>(null);
  const selectedModelIds = useInquiryDraft(s => s.selectedModelIds);

  // Hero carousel images - premium Chinese auto showcase
  const carouselImages = [
    "/tech-car-bg.jpg",
  ];

  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % carouselImages.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + carouselImages.length) % carouselImages.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  // Auto-play carousel
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextSlide, 5000);
    return () => clearInterval(interval);
  }, [isPaused]);

  useEffect(() => {
    async function fetchBrands() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("brands")
          .select("*")
          .eq("depth", 1)
          .order("initial", { ascending: true });

        if (error) throw error;
        setBrands(data || []);
      } catch (error) {
        console.error("Failed to fetch brands:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchBrands();
  }, []);

  async function loadBrandModels(brand: BrandRow) {
    setSelectedBrand(brand);
    setLoadingSeries(true);
    try {
      // 加载该品牌下的所有车系 - 匹配 brandId 或 brandJmId 任意一个
      let brandSeries: SeriesRow[] = [];
      // 尝试两种匹配方式：brand_id 和 brand_jm_id
      const [resultById, resultByJmId] = await Promise.all([
        supabase
          .from("series")
          .select("*")
          .eq("brand_id", brand.id)
          .order("name", { ascending: true }),
        supabase
          .from("series")
          .select("*")
          .eq("brand_jm_id", brand.jm_id)
          .order("name", { ascending: true })
      ]);

      // Combine both results and deduplicate
      const combined = [...(resultById.data || []), ...(resultByJmId.data || [])];
      const seen = new Set<string>();
      brandSeries = combined.filter(item => {
        if (seen.has(item.id)) return false;
        seen.add(item.id);
        return true;
      });

      setSeries(brandSeries);

      // 为每个车系加载第一个车型数据用于显示参数
      const newSeriesModels: Record<string, ModelListItem> = {};
      await Promise.all(
        brandSeries.map(async (series) => {
          const models = await listModelsBySeriesId({ seriesId: series.id, locale });
          if (models.length > 0) {
            newSeriesModels[series.id] = models[0];
          }
        })
      );
      setSeriesModels(newSeriesModels);
    } catch (error) {
      console.error("Failed to fetch series:", error);
      setSeries([]);
      setSeriesModels({});
    } finally {
      setLoadingSeries(false);
    }
  }

  const initials = Array.from(new Set(brands.map(b => b.initial).filter(Boolean) as string[])).filter(initial => initial.charCodeAt(0) <= 'p'.charCodeAt(0)).sort();

  const filteredBrands = brands.filter(brand => {
    const matchesSearch = !searchQuery ||
      brand.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesInitial = !selectedInitial || brand.initial === selectedInitial;
    return matchesSearch && matchesInitial;
  });

  const filteredModels = models.filter(model => {
    const matchEnergy = energyFilter === "all" ||
      (energyFilter === "electric" ? model.fuel_type === "electric" : model.fuel_type !== "electric");
    const matchBody = bodyFilter === "all" || model.body_type === bodyFilter;
    return matchEnergy && matchBody;
  });

  const bodyTypes = [
    { value: "sedan", label: t("category.sedan", "轿车") },
    { value: "suv", label: t("category.suv", "SUV") },
    { value: "mpv", label: t("category.mpv", "MPV") },
    { value: "pickup", label: t("category.pickup", "皮卡") },
  ];

  return (
    <div className="min-h-[calc(100vh-160px)] text-text-primary relative overflow-hidden">
      {/* Center radial gradient background - match homepage style */}
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(15,42,71,0.45)_0%,rgba(10,13,20,0.95)_100%)]"></div>
      <div className="star-field" />
      <section className="relative min-h-[400px] flex items-center justify-center overflow-hidden rounded-3xl mx-4 mt-4 border border-border shadow-xl shadow-blue-900/15 overflow-hidden">
        {/* Background Carousel - Full width background */}
        <div className="absolute inset-0 z-0">
          {carouselImages.map((img, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                currentSlide === index ? 'opacity-60' : 'opacity-0 pointer-events-none'
              }`}
            >
              <img
                src={img}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary-dark/85 via-primary-dark/40 to-primary-dark/60" />
            </div>
          ))}

          {/* Navigation Arrows */}
          <button
            onClick={prevSlide}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-bg-card/70 text-text-primary hover:bg-bg-card backdrop-blur-sm border border-border transition-all duration-300 z-10 hover:scale-110"
          >
            <ChevronLeft size={24} />
          </button>
          <button
            onClick={nextSlide}
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full bg-bg-card/70 text-text-primary hover:bg-bg-card backdrop-blur-sm border border-border transition-all duration-300 z-10 hover:scale-110"
          >
            <ChevronRight size={24} />
          </button>

          {/* Indicators */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                onMouseEnter={() => setIsPaused(true)}
                onMouseLeave={() => setIsPaused(false)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  currentSlide === index
                    ? 'bg-blue-400 w-8 rounded'
                    : 'bg-bg-card/70 border border-border'
                }`}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Original Text Content - stays on top */}
        <div className="relative z-10 mx-auto max-w-6xl px-4 py-24 text-center">
          <h1 className="text-balance text-4xl font-extrabold tracking-tight text-text-primary md:text-5xl md:tracking-tight">
            {t("brands.title", "汽车品牌")}
          </h1>
          <p className="mx-auto mt-4 text-xl font-medium text-blue-300/90 tracking-wide uppercase">
            {t("brands.titleEn", "Car Brands")}
          </p>
          <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg leading-relaxed text-text-secondary/90 font-normal">
            {t("brands.subtitle", "我们提供来自中国的优质汽车品牌，满足您的各种需求")}
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 relative">
        <div className="mb-10">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-center">
            <div className="relative w-full md:w-[480px]">
              <Search className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-white/80" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={t("brands.searchPlaceholder", "搜索品牌名称...")}
                className="w-full rounded-[1rem] border-0 bg-gradient-to-r from-primary-accent to-primary-blue pl-14 pr-6 py-5 text-lg font-semibold text-white placeholder:text-white/70 shadow-[0_10px_28px_-8px_var(--color-primary-accent-glow)] focus:outline-none focus:ring-2 focus:ring-primary-accent/40 focus:translate-y-[-2px] transition-all duration-300 backdrop-blur-sm"
              />
            </div>
          </div>
        </div>

        {initials.length > 0 && (
          <div className="mt-10 flex flex-wrap gap-3 justify-center px-4 pb-4">
            <button
              type="button"
              onClick={() => {
                setSelectedInitial(null);
                if (brandsNavRef.current) {
                  brandsNavRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                !selectedInitial
                  ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25"
                  : "bg-bg-card/60 border border-border text-text-secondary hover:bg-bg-hover hover:border-blue-400/60 hover:text-text-primary backdrop-blur-sm"
              }`}
            >
              {t("brands.all", "全部")}
            </button>
            {initials.map((initial) => (
              <button
                key={initial}
                type="button"
                onClick={() => {
                  setSelectedInitial(initial);
                  if (brandsNavRef.current) {
                    brandsNavRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  }
                }}
                className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  selectedInitial === initial
                    ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-600/25"
                    : "bg-bg-card/60 border border-border text-text-secondary hover:bg-bg-hover hover:border-blue-400/60 hover:text-text-primary backdrop-blur-sm"
                }`}
              >
                {initial.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Main Content - Left Brand Nav + Right Models Display */}
      <div className="mx-auto max-w-7xl px-4 pb-20 relative">
        <div className="flex flex-col lg:flex-row gap-6">
          {/* Left: Fixed Brand Navigation */}
          <div className="lg:w-[28%] lg:sticky lg:top-24" ref={brandsNavRef}>
            <div className="bg-bg-card/60 rounded-2xl border border-border shadow-xl shadow-blue-900/15 backdrop-blur-md p-5 max-h-[calc(100vh-120px)] overflow-y-auto">
              {/* Hot Brands Title */}
              <h3 className="text-xl font-bold text-text-primary mb-5 px-1">
                {t("brands.hotBrands", "热卖品牌")}
              </h3>
              {/* Brand Grid - Only show top 20 brands */}
              <div className="grid grid-cols-3 gap-3">
                {filteredBrands.slice(0, 20).map((brand) => (
                  <div
                    key={brand.id}
                    onClick={() => loadBrandModels(brand)}
                    className={`cursor-pointer group flex flex-col items-center justify-center gap-2 rounded-xl p-3 border transition-all duration-300 ${
                      selectedBrand?.id === brand.id
                        ? "bg-blue-600/25 border-blue-400 shadow-lg shadow-blue-500/30"
                        : "bg-bg-card/70 border-border hover:border-blue-300/70 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1"
                    }`}
                  >
                    <div className="w-12 h-12 flex items-center justify-center">
                      {brand.logo_url ? (
                        <img
                          src={brand.logo_url}
                          alt={brand.name}
                          className="h-9 w-9 object-contain"
                          onError={(e) => {
                            const img = e.target as HTMLImageElement;
                            img.style.display = 'none';
                          }}
                        />
                      ) : (
                        <span className={`text-lg font-bold ${selectedBrand?.id === brand.id ? 'text-blue-300' : 'text-text-tertiary'}`}>
                          {(brand.initial || brand.name.charAt(0)).toUpperCase()}
                        </span>
                      )}
                    </div>
                    <span className={`text-xs font-medium line-clamp-1 ${selectedBrand?.id === brand.id ? 'text-blue-100' : 'text-text-secondary'}`}>
                      {brand.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Models Content */}
          <div className="lg:w-[72%]">
            {!selectedBrand ? (
              <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-border bg-bg-card/40 shadow-xl shadow-blue-900/10 backdrop-blur-md text-center">
                <svg className="w-20 h-20 text-text-tertiary mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h8m0 0v8m0-8l8 4m-8-4l8-4m-8 4l8 4m-8 4l8-4" />
                </svg>
                <h3 className="text-2xl font-bold text-text-secondary mb-2">
                  {t("brands.selectBrand", "Select a car brand")}
                </h3>
                <p className="text-text-tertiary max-w-md">
                  {t("brands.selectHint", "Please select a brand from the left to view all available models")}
                </p>
              </div>
            ) : (
              <>
                {/* Brand Header Info */}
                <div className="mb-6">
                  <div className="bg-bg-card/60 rounded-2xl border border-border shadow-xl shadow-blue-900/10 backdrop-blur-md p-6">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                      <div className="w-24 h-24 flex items-center justify-center bg-bg-card/80 rounded-2xl border border-border">
                        {selectedBrand.logo_url ? (
                          <img
                            src={selectedBrand.logo_url}
                            alt={selectedBrand.name}
                            className="h-16 w-16 object-contain"
                          />
                        ) : (
                          <span className="text-3xl font-bold text-text-tertiary">
                            {(selectedBrand.initial || selectedBrand.name.charAt(0)).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 text-center md:text-left">
                        <h2 className="text-2xl font-bold text-text-primary mb-2">
                          {selectedBrand.name}
                        </h2>
                        <p className="text-text-tertiary mb-3">
                          {t("brands.totalSeries", "{count} series", { count: series.length })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* All Series Title */}
                <div className="mb-6 text-center">
                  <h3 className="text-2xl font-bold text-text-primary">
                    {t("brands.allModels", "全部车系")}
                  </h3>
                </div>

                {/* Series List - Grid layout with logo */}
                {loadingSeries ? (
                  <div className="flex items-center justify-center py-20">
                    <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-accent border-t-transparent"></div>
                    <span className="ml-3 text-text-secondary">{t("common.loading")}</span>
                  </div>
                ) : series.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 rounded-xl border border-border bg-bg-card/60 shadow-xl shadow-blue-900/10 text-center backdrop-blur-md">
                    <svg className="h-16 w-16 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-4 text-lg font-medium text-text-secondary">{t("series.empty", "当前没有车系数据，请先在管理后台添加。")}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4">
                    {series.map((item) => {
                      // Get the first model for this series from loaded data
                      const firstModel = seriesModels[item.id];
                      return (
                        <Link
                          key={item.id}
                          to={firstModel?.slug ? `${base}/models/${firstModel.slug}` : `${base}/brands`}
                          className="cursor-pointer grid grid-cols-1 md:grid-cols-[280px_1fr] gap-6 p-6 rounded-xl border border-border bg-bg-card/60 shadow-lg shadow-blue-900/10 backdrop-blur-sm transition-all duration-300 hover:border-blue-300/80 hover:shadow-xl hover:shadow-blue-500/20 hover:-translate-y-1"
                        >
                          {/* Vehicle Image */}
                          <div className="relative overflow-hidden rounded-xl bg-bg-card/80 aspect-[4/3] border border-border flex items-center justify-center">
                            {firstModel?.cover_image ? (
                              <img
                                src={firstModel.cover_image}
                                alt={item.name}
                                className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                              />
                            ) : item.logo_url ? (
                              <img
                                src={item.logo_url}
                                alt={item.name}
                                className="max-h-16 max-w-[80%] object-contain"
                              />
                            ) : (
                              <span className="text-3xl font-bold text-text-tertiary">
                                {(item.initial || item.name.charAt(0)).toUpperCase()}
                              </span>
                            )}
                            {item.salestate && (
                              <span className="absolute top-3 right-3 inline-flex px-3 py-1 rounded-full text-xs font-semibold bg-accent-green text-white shadow-glow-green">
                                {item.salestate}
                              </span>
                            )}
                          </div>

                          {/* Vehicle Info & Parameters */}
                          <div className="flex flex-col justify-center">
                            <h3 className="text-2xl font-bold text-text-primary mb-6">
                              {item.fullname || item.name}
                            </h3>
                            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-4">
                              <div className="flex justify-between">
                                <dt className="text-sm text-text-secondary">{t("model.level", "级别")}</dt>
                                <dd className="text-sm font-semibold text-text-primary">{firstModel?.vehicle_class || ''}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-text-secondary">{t("model.energyType", "能源类型")}</dt>
                                <dd className="text-sm font-semibold text-text-primary">{firstModel?.energy_type || ''}</dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-text-secondary">{t("model.motorTotalPower", "电动机总功率(kW)")}</dt>
                                <dd className="text-sm font-semibold text-text-primary">
                                  {firstModel?.motor_total_power != null ? `${firstModel.motor_total_power} kW` : ''}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-text-secondary">{t("model.cltcRange", "CLTC纯电续航(km)")}</dt>
                                <dd className="text-sm font-semibold text-text-primary">
                                  {firstModel?.cltc_range != null ? `${firstModel.cltc_range} km` : ''}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-text-secondary">{t("model.motorHorsepower", "最大马力(Ps)")}</dt>
                                <dd className="text-sm font-semibold text-text-primary">
                                  {firstModel?.motor_horsepower != null ? `${firstModel.motor_horsepower} Ps` : ''}
                                </dd>
                              </div>
                              <div className="flex justify-between">
                                <dt className="text-sm text-text-secondary">{t("model.seats", "座位数")}</dt>
                                <dd className="text-sm font-semibold text-text-primary">
                                  {firstModel?.seats != null ? `${firstModel.seats}` : ''}
                                </dd>
                              </div>
                            </dl>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Brands Infinite Scroll Marquee - 3 Rows Alternating Direction */}
      {!loading && brands.length > 0 && (
        <div className="mx-auto max-w-full px-0 mt-10 mb-10 overflow-hidden">
          <div className="bg-bg-card/40 py-3 rounded-3xl border border-border/40 shadow-xl shadow-blue-900/10 backdrop-blur-md overflow-hidden">
            {/* Split brands into 3 non-overlapping groups */}
            {(() => {
              const total = brands.length;
              const group1 = brands.slice(0, Math.ceil(total / 3));
              const group2 = brands.slice(Math.ceil(total / 3), Math.ceil(total * 2 / 3));
              const group3 = brands.slice(Math.ceil(total * 2 / 3));
              return (
                <>
                  {/* Row 1 - Left to Right */}
                  <div
                    className="flex items-center gap-3 w-max infinite-scroll-marquee-ltr mb-2"
                    onMouseEnter={() => {
                      document.querySelectorAll('.infinite-scroll-marquee-ltr, .infinite-scroll-marquee-rtl').forEach(el => {
                        el.classList.add('animation-paused');
                      });
                    }}
                    onMouseLeave={() => {
                      document.querySelectorAll('.infinite-scroll-marquee-ltr, .infinite-scroll-marquee-rtl').forEach(el => {
                        el.classList.remove('animation-paused');
                      });
                    }}
                  >
                    {/* 复制两份实现无缝循环 */}
                    {[...group1, ...group1].map((brand, index) => (
                      <div
                        key={`${brand.id}-${index}-1`}
                        className="flex-shrink-0 w-28 h-10 flex items-center justify-center rounded-xl border border-border bg-bg-card/80 transition-all duration-300 hover:border-blue-300/80 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1"
                      >
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="h-7 max-w-28 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-base font-bold text-text-tertiary">
                            {(brand.initial || brand.name.charAt(0)).toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Row 2 - Right to Left (Reverse) */}
                  <div
                    className="flex items-center gap-3 w-max infinite-scroll-marquee-rtl mb-2"
                  >
                    {/* 复制两份实现无缝循环 */}
                    {[...group2, ...group2].reverse().map((brand, index) => (
                      <div
                        key={`${brand.id}-${index}-2`}
                        className="flex-shrink-0 w-28 h-10 flex items-center justify-center rounded-xl border border-border bg-bg-card/80 transition-all duration-300 hover:border-blue-300/80 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1"
                      >
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="h-7 max-w-28 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-base font-bold text-text-tertiary">
                            {(brand.initial || brand.name.charAt(0)).toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Row 3 - Left to Right */}
                  <div
                    className="flex items-center gap-3 w-max infinite-scroll-marquee-ltr"
                  >
                    {/* 复制两份实现无缝循环 */}
                    {[...group3, ...group3].map((brand, index) => (
                      <div
                        key={`${brand.id}-${index}-3`}
                        className="flex-shrink-0 w-28 h-10 flex items-center justify-center rounded-xl border border-border bg-bg-card/80 transition-all duration-300 hover:border-blue-300/80 hover:shadow-lg hover:shadow-blue-500/20 hover:-translate-y-1"
                      >
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="h-7 max-w-28 object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-base font-bold text-text-tertiary">
                            {(brand.initial || brand.name.charAt(0)).toUpperCase()}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
