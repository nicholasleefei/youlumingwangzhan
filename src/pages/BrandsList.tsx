import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { Link, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import { supabase } from "@/utils/supabaseClient";
import { listBrands, listModelsBySeriesId, listSeries, type BrandRow, type SeriesRow } from "@/utils/db";
import { Search } from "lucide-react";
import SafeImage from "@/components/SafeImage";
import { proxiedImageUrl } from "@/utils/proxyUrl";
import { useInquiryDraft } from "@/store/useInquiryDraft";

export default function BrandsList() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const [searchParams] = useSearchParams();
  const initBrandId = searchParams.get("brandId");
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const base = `/${locale}`;

  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedInitial, setSelectedInitial] = useState<string | null>(null);
  const [selectedBrand, setSelectedBrand] = useState<BrandRow | null>(null);
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [loadingSeries, setLoadingSeries] = useState(false);
  const [addingSeriesId, setAddingSeriesId] = useState<string | null>(null);
  const [seriesMeta, setSeriesMeta] = useState<
    Record<
      number,
      {
        coverUrl: string | null;
        officialCount: number;
        exteriorVrGroups: number;
        interiorVrColors: number;
        sizeType: string | null;
        rangeMinKm: number | null;
        rangeMaxKm: number | null;
        exteriorSwatches: string[];
      }
    >
  >({});
  const brandsNavRef = useRef<HTMLDivElement>(null);

  const addModelIds = useInquiryDraft((s) => s.addModelIds);

  const HERO_FALLBACK = "/tech-car-bg.jpg";
  const CAROUSEL_INTERVAL_MS = 15000;
  const CAROUSEL_TRANSITION_MS = 700;

  type BrandCarouselSlide = {
    brandId: string;
    brandJmId: number;
    brandName: string;
    seriesId: string | null;
    seriesJmId: number | null;
    seriesName: string | null;
    imageUrl: string;
  };

  const [carouselSlides, setCarouselSlides] = useState<BrandCarouselSlide[]>([]);

  const [visibleSlideIndex, setVisibleSlideIndex] = useState(0);
  const visibleSlideIndexRef = useRef(0);
  const [targetSlideIndex, setTargetSlideIndex] = useState(0);
  const [isCarouselTransitioning, setIsCarouselTransitioning] = useState(false);
  const isCarouselTransitioningRef = useRef(false);
  const [carouselShowTarget, setCarouselShowTarget] = useState(false);
  const carouselSlidesRef = useRef<BrandCarouselSlide[]>([]);
  const carouselTimersRef = useRef<{ showTarget?: number; commit?: number }>({});

  useEffect(() => {
    carouselSlidesRef.current = carouselSlides;
  }, [carouselSlides]);

  useEffect(() => {
    visibleSlideIndexRef.current = visibleSlideIndex;
  }, [visibleSlideIndex]);

  useEffect(() => {
    isCarouselTransitioningRef.current = isCarouselTransitioning;
  }, [isCarouselTransitioning]);

  const clearCarouselTimers = () => {
    if (carouselTimersRef.current.showTarget) window.clearTimeout(carouselTimersRef.current.showTarget);
    if (carouselTimersRef.current.commit) window.clearTimeout(carouselTimersRef.current.commit);
    carouselTimersRef.current = {};
  };

  const addSeriesToInquiry = async (seriesId: string) => {
    if (!seriesId) return;
    setAddingSeriesId(seriesId);
    try {
      const models = await listModelsBySeriesId({ seriesId, locale });
      const ids = (models ?? []).map((m: any) => String(m?.id ?? "")).filter(Boolean);
      addModelIds(ids);
    } catch {
    } finally {
      setAddingSeriesId((prev) => (prev === seriesId ? null : prev));
    }
  };

  useEffect(() => {
    return () => clearCarouselTimers();
  }, []);

  const requestSlide = (nextIndex: number) => {
    const slides = carouselSlidesRef.current;
    const n = slides.length;
    if (n <= 1) return;
    if (isCarouselTransitioningRef.current) return;

    const cur = visibleSlideIndexRef.current;
    const normalized = ((nextIndex % n) + n) % n;
    if (normalized === cur) return;

    clearCarouselTimers();
    setTargetSlideIndex(normalized);
    setIsCarouselTransitioning(true);
    setCarouselShowTarget(false);

    carouselTimersRef.current.showTarget = window.setTimeout(() => {
      setCarouselShowTarget(true);
    }, 30);

    carouselTimersRef.current.commit = window.setTimeout(() => {
      setVisibleSlideIndex(normalized);
      setIsCarouselTransitioning(false);
      setCarouselShowTarget(false);
    }, CAROUSEL_TRANSITION_MS);
  };

  useEffect(() => {
    const n = carouselSlides.length;
    if (n === 0) {
      clearCarouselTimers();
      setVisibleSlideIndex(0);
      setTargetSlideIndex(0);
      setIsCarouselTransitioning(false);
      setCarouselShowTarget(false);
      return;
    }
    if (visibleSlideIndex >= n) setVisibleSlideIndex(0);
    if (targetSlideIndex >= n) setTargetSlideIndex(0);
  }, [carouselSlides.length, targetSlideIndex, visibleSlideIndex]);

  useEffect(() => {
    if (carouselSlides.length <= 1) return;

    const interval = window.setInterval(() => {
      const slides = carouselSlidesRef.current;
      const n = slides.length;
      if (n <= 1) return;
      const cur = visibleSlideIndexRef.current;
      const next = (cur + 1) % n;
      requestSlide(next);
    }, CAROUSEL_INTERVAL_MS);

    return () => window.clearInterval(interval);
  }, [carouselSlides.length]);

  useEffect(() => {
    async function fetchBrands() {
      setLoading(true);
      try {
        const [brandData, seriesData] = await Promise.all([listBrands(), listSeries({})]);
        const rootBrands = brandData.filter((b) => b.depth === 1);
        setBrands(rootBrands);

        if (initBrandId) {
          const target = rootBrands.find((b) => b.id === initBrandId);
          if (target) {
            setTimeout(() => loadBrandModels(target), 0);
            setTimeout(() => {
              document.getElementById("series-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }, 500);
          }
        }

        const seriesByJmId = new Map<number, SeriesRow>();
        for (const s of seriesData) {
          if (typeof s.jm_id === "number") seriesByJmId.set(s.jm_id, s);
        }

        const { data: cfg, error: cfgError } = await supabase
          .from("series_vr_config")
          .select("brand_jm_id, series_jm_id, series_name, official_images")
          .limit(5000);

        if (cfgError) throw cfgError;

        type UploadedOfficialRow = { brandJmId: number; seriesJmId: number; seriesName: string | null; imgs: string[] };

        const usable: UploadedOfficialRow[] = (Array.isArray(cfg) ? cfg : [])
          .map((x: any) => {
            const brandJmId = typeof x.brand_jm_id === "number" ? x.brand_jm_id : null;
            const seriesJmId = typeof x.series_jm_id === "number" ? x.series_jm_id : null;
            const seriesName = typeof x.series_name === "string" ? x.series_name : null;
            const imgs = Array.isArray(x.official_images) ? x.official_images.filter((u: any) => typeof u === "string" && u.trim()) : [];
            return { brandJmId, seriesJmId, seriesName, imgs };
          })
          .filter((x): x is UploadedOfficialRow => typeof x.brandJmId === "number" && typeof x.seriesJmId === "number" && x.imgs.length > 0);

        const byBrand = new Map<number, UploadedOfficialRow[]>();
        for (const item of usable) {
          const key = item.brandJmId;
          if (!byBrand.has(key)) byBrand.set(key, []);
          byBrand.get(key)!.push(item);
        }

        const slides: BrandCarouselSlide[] = rootBrands
          .map((b) => {
            const pool = byBrand.get(b.jm_id) ?? [];
            if (pool.length === 0) return null;
            const picked = pool[Math.floor(Math.random() * pool.length)]!;
            const seriesRow = seriesByJmId.get(picked.seriesJmId as number) ?? null;
            if (!seriesRow?.id) return null;
            const img = picked.imgs[Math.floor(Math.random() * picked.imgs.length)]!;
            return {
              brandId: b.id,
              brandJmId: b.jm_id,
              brandName: b.fullname || b.name,
              seriesId: seriesRow.id,
              seriesJmId: picked.seriesJmId as number,
              seriesName: picked.seriesName || seriesRow.fullname || seriesRow.name,
              imageUrl: img,
            };
          })
          .filter((x): x is BrandCarouselSlide => !!x && !!x.imageUrl?.trim());

        setCarouselSlides(slides);
      } catch (error) {
        setCarouselSlides([]);
      } finally {
        setLoading(false);
      }
    }
    fetchBrands();
  }, [t]);

  const activeSlide = carouselSlides[visibleSlideIndex] ?? null;
  const targetSlide = carouselSlides[targetSlideIndex] ?? null;

  const canOpenActiveSeries = !!(activeSlide?.seriesId && activeSlide.seriesId.trim());

  const openActiveSeries = () => {
    if (!canOpenActiveSeries) return;
    navigate(`${base}/series/${activeSlide!.seriesId}`);
  };

  async function loadBrandModels(brand: BrandRow) {
    setSelectedBrand(brand);
    setLoadingSeries(true);
    try {
      // 加载该品牌下的所有车系
      const brandSeries = await listSeries({ brandId: brand.id, brandJmId: brand.jm_id });
      setSeries(brandSeries);

      const seriesJmIds = brandSeries.map((s) => s.jm_id).filter((x) => typeof x === "number" && Number.isFinite(x));
      if (seriesJmIds.length === 0) {
        setSeriesMeta({});
        return;
      }

      const [vrRes, mdRes] = await Promise.all([
        supabase
          .from("series_vr_config")
          .select("series_jm_id, exterior_vr, interior_vr, official_images")
          .in("series_jm_id", seriesJmIds)
          .limit(5000),
        supabase
          .from("model_details")
          .select("series_jm_id, sizetype, raw, activity_status")
          .in("series_jm_id", seriesJmIds)
          .or("activity_status.is.null,activity_status.eq.0")
          .limit(10000),
      ]);

      const mdRows = Array.isArray(mdRes.data) ? (mdRes.data as any[]) : [];
      const sizetypeCountBySeries = new Map<number, Map<string, number>>();
      const rangeMinBySeries = new Map<number, number>();
      const rangeMaxBySeries = new Map<number, number>();

      const addRange = (sid: number, v: number) => {
        if (!Number.isFinite(v) || v <= 0) return;
        const curMin = rangeMinBySeries.get(sid);
        const curMax = rangeMaxBySeries.get(sid);
        rangeMinBySeries.set(sid, typeof curMin === "number" ? Math.min(curMin, v) : v);
        rangeMaxBySeries.set(sid, typeof curMax === "number" ? Math.max(curMax, v) : v);
      };

      const extractNumbers = (s: any): number[] => {
        if (typeof s === "number" && Number.isFinite(s) && s > 0) return [s];
        const txt = typeof s === "string" ? s : "";
        const nums = txt.match(/\d+(?:\.\d+)?/g);
        if (!nums) return [];
        return nums.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0);
      };

      const extractRangeNumbersFromModelDetails = (row: any): number[] => {
        const raw = (row?.raw ?? {}) as any;
        const engine = (raw?.engine ?? {}) as any;
        const electricmotor = (raw?.electricmotor ?? {}) as any;

        const candidates = [
          engine?.cltcmaxmileage,
          engine?.cltccomprehensivemileage,
          electricmotor?.cltcmaxmileage,
          electricmotor?.cltccomprehensivemileage,
          raw?.engine_cltccomprehensivemileage,
          raw?.electricmotor_cltccomprehensivemileage,
          raw?.["engine.cltcmaxmileage"],
          raw?.["engine.cltccomprehensivemileage"],
          raw?.["electricmotor.cltcmaxmileage"],
          raw?.["electricmotor.cltccomprehensivemileage"],
        ];

        const out: number[] = [];
        for (const c of candidates) out.push(...extractNumbers(c));
        return out;
      };

      for (const r of mdRows) {
        const sid = typeof r.series_jm_id === "number" ? r.series_jm_id : null;
        if (!sid) continue;

        const st = typeof r.sizetype === "string" ? r.sizetype.trim() : "";
        if (st) {
          if (!sizetypeCountBySeries.has(sid)) sizetypeCountBySeries.set(sid, new Map());
          const m = sizetypeCountBySeries.get(sid)!;
          m.set(st, (m.get(st) ?? 0) + 1);
        }

        const nums = extractRangeNumbersFromModelDetails(r);
        for (const v of nums) addRange(sid, v);
      }

      const meta: Record<number, any> = {};
      for (const sid of seriesJmIds) {
        meta[sid] = {
          coverUrl: null,
          officialCount: 0,
          exteriorVrGroups: 0,
          interiorVrColors: 0,
          sizeType: null,
          rangeMinKm: null,
          rangeMaxKm: null,
          exteriorSwatches: [],
        };
      }

      const vr = Array.isArray(vrRes.data) ? (vrRes.data as any[]) : [];
      for (const row of vr) {
        const sid = typeof row.series_jm_id === "number" ? row.series_jm_id : null;
        if (!sid || !meta[sid]) continue;
        const official = Array.isArray(row.official_images) ? row.official_images.filter((u: any) => typeof u === "string" && u.trim()) : [];
        meta[sid].officialCount += official.length;
        if (!meta[sid].coverUrl) meta[sid].coverUrl = (official[0] ?? null) as any;

        const swatches = Array.isArray(row.exterior_vr)
          ? (row.exterior_vr as any[])
              .map((g) => String(g?.color_code || "").trim())
              .filter((x) => x)
              .map((x) => (x.startsWith("#") ? x : /^([0-9a-fA-F]{6}|[0-9a-fA-F]{3})$/.test(x) ? `#${x}` : x))
          : [];
        const uniq: string[] = [];
        const seen = new Set<string>();
        for (const c of swatches) {
          const k = c.toLowerCase();
          if (seen.has(k)) continue;
          seen.add(k);
          uniq.push(c);
        }
        meta[sid].exteriorSwatches = uniq;

        const ex = Array.isArray(row.exterior_vr) ? row.exterior_vr.length : 0;
        const it = Array.isArray(row.interior_vr) ? row.interior_vr.length : 0;
        meta[sid].exteriorVrGroups = ex;
        meta[sid].interiorVrColors = it;
      }

      for (const sid of seriesJmIds) {
        const stMap = sizetypeCountBySeries.get(sid);
        if (stMap && stMap.size > 0) {
          let best: string | null = null;
          let bestN = 0;
          for (const [k, v] of stMap.entries()) {
            if (v > bestN) {
              best = k;
              bestN = v;
            }
          }
          meta[sid].sizeType = best;
        }

        meta[sid].rangeMinKm = rangeMinBySeries.has(sid) ? (rangeMinBySeries.get(sid) as number) : null;
        meta[sid].rangeMaxKm = rangeMaxBySeries.has(sid) ? (rangeMaxBySeries.get(sid) as number) : null;
      }

      for (const s of brandSeries) {
        const sid = s.jm_id;
        if (!meta[sid]) continue;
        if (!meta[sid].coverUrl && s.logo_url) meta[sid].coverUrl = s.logo_url;
      }

      setSeriesMeta(meta);
    } catch (error) {
      setSeriesMeta({});
    } finally {
      setLoadingSeries(false);
    }
  }

  const initials = useMemo(() => {
    return Array.from(new Set(brands.map((b) => b.initial).filter(Boolean) as string[]))
      .map((x) => x.toUpperCase())
      .sort();
  }, [brands]);

  const filteredBrands = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return brands.filter((brand) => {
      const matchesSearch = !q || brand.name.toLowerCase().includes(q) || String(brand.fullname || "").toLowerCase().includes(q);
      const matchesInitial = !selectedInitial || String(brand.initial || "").toUpperCase() === selectedInitial;
      return matchesSearch && matchesInitial;
    });
  }, [brands, searchQuery, selectedInitial]);

  const selectedBrandName = selectedBrand ? (selectedBrand.fullname || selectedBrand.name) : null;

  return (
    <div className="bg-zinc-50">
      <div className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="absolute inset-0">
          <div className="absolute -top-28 -left-20 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-10">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5">
              <h1
                className={
                  isCarouselTransitioning
                    ? "mt-4 text-3xl font-semibold tracking-tight text-zinc-900 opacity-0 transition-opacity duration-500 md:text-4xl"
                    : "mt-4 text-3xl font-semibold tracking-tight text-zinc-900 opacity-100 transition-opacity duration-500 md:text-4xl"
                }
              >
                {activeSlide?.brandName ? (
                  <span>
                    {activeSlide.brandName}
                    {activeSlide.seriesName ? ` · ${activeSlide.seriesName}` : ""}
                  </span>
                ) : (
                  t("brands.title", "汽车品牌")
                )}
              </h1>
            </div>

            <div className="lg:col-span-7">
              <div
                className={canOpenActiveSeries ? "group cursor-pointer" : "group"}
                role={canOpenActiveSeries ? "link" : undefined}
                tabIndex={canOpenActiveSeries ? 0 : undefined}
                onClick={openActiveSeries}
                onKeyDown={(e) => {
                  if (!canOpenActiveSeries) return;
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    openActiveSeries();
                  }
                }}
              >
                <div className="relative overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-sm">
                  <div className="aspect-[16/9]">
                    <div className="relative h-full w-full">
                      <img
                        src={activeSlide?.imageUrl || HERO_FALLBACK}
                        alt=""
                        className={
                          carouselShowTarget
                            ? "absolute inset-0 h-full w-full object-cover opacity-0 transition-[opacity,transform] duration-700 ease-in-out group-hover:scale-[1.02]"
                            : "absolute inset-0 h-full w-full object-cover opacity-100 transition-[opacity,transform] duration-700 ease-in-out group-hover:scale-[1.02]"
                        }
                        loading="lazy"
                        decoding="async"
                      />
                      {isCarouselTransitioning ? (
                        <img
                          src={targetSlide?.imageUrl || HERO_FALLBACK}
                          alt=""
                          className={
                            carouselShowTarget
                              ? "absolute inset-0 h-full w-full object-cover opacity-100 transition-[opacity,transform] duration-700 ease-in-out group-hover:scale-[1.02]"
                              : "absolute inset-0 h-full w-full object-cover opacity-0 transition-[opacity,transform] duration-700 ease-in-out group-hover:scale-[1.02]"
                          }
                          loading="lazy"
                          decoding="async"
                        />
                      ) : null}
                    </div>
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/70 via-zinc-950/15 to-transparent" />

                  <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between gap-3">
                    <div
                      className={
                        isCarouselTransitioning
                          ? "min-w-0 opacity-0 transition-opacity duration-500"
                          : "min-w-0 opacity-100 transition-opacity duration-500"
                      }
                    >
                      <div className="mt-1 truncate text-lg font-semibold text-white">
                        {activeSlide?.brandName ? `${activeSlide.brandName}${activeSlide.seriesName ? ` · ${activeSlide.seriesName}` : ""}` : "—"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4" ref={brandsNavRef}>
            <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-zinc-900">{t("brands.hotBrands", "品牌")}</div>

              <div className="mt-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={t("brands.searchPlaceholder", "搜索品牌名称...")}
                    className="w-full rounded-xl border border-zinc-200 bg-zinc-50 py-2.5 pl-10 pr-3 text-sm text-zinc-900 outline-none focus:border-blue-300 focus:bg-white"
                  />
                </div>
              </div>

              {initials.length > 0 ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedInitial(null);
                      if (brandsNavRef.current) brandsNavRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                    }}
                    className={
                      !selectedInitial
                        ? "rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                        : "rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    }
                  >
                    {t("brands.all", "全部")}
                  </button>
                  {initials.map((initial) => (
                    <button
                      key={initial}
                      type="button"
                      onClick={() => {
                        setSelectedInitial(initial);
                        if (brandsNavRef.current) brandsNavRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
                      }}
                      className={
                        selectedInitial === initial
                          ? "rounded-full bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white"
                          : "rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      }
                    >
                      {initial}
                    </button>
                  ))}
                </div>
              ) : null}

              <div className="mt-4 max-h-[60vh] overflow-auto pr-1">
                {loading ? (
                  <div className="py-6 text-center text-sm text-zinc-600">{t("common.loading")}</div>
                ) : filteredBrands.length === 0 ? (
                  <div className="py-6 text-center text-sm text-zinc-600">暂无匹配品牌</div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {filteredBrands.map((brand) => {
                      const active = selectedBrand?.id === brand.id;
                      return (
                        <button
                          key={brand.id}
                          type="button"
                          onClick={() => loadBrandModels(brand)}
                          className={
                            active
                              ? "group rounded-xl border border-blue-200 bg-blue-50 p-2 text-left"
                              : "group rounded-xl border border-zinc-200 bg-white p-2 text-left hover:bg-zinc-50"
                          }
                        >
                          <div className="flex items-center gap-2">
                            <div className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-lg border border-zinc-200 bg-white">
                              {brand.logo_url ? (
                                <img
                                  src={brand.logo_url}
                                  alt={brand.name}
                                  className="h-7 w-7 object-contain"
                                  onError={(e) => {
                                    (e.target as HTMLImageElement).style.display = "none";
                                  }}
                                />
                              ) : (
                                <div className="text-sm font-semibold text-zinc-600">{(brand.initial || brand.name.charAt(0)).toUpperCase()}</div>
                              )}
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className={active ? "text-xs font-semibold whitespace-nowrap text-blue-700" : "text-xs font-semibold whitespace-nowrap text-zinc-900"}>
                                {brand.name}
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="lg:col-span-8">
            {!selectedBrand ? (
              <div className="rounded-2xl border border-zinc-200 bg-white p-10 text-center text-sm text-zinc-600 shadow-sm">
                请选择左侧品牌查看车系
              </div>
            ) : (
              <div className="space-y-4">
                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl border border-zinc-200 bg-white">
                        {selectedBrand.logo_url ? (
                          <img src={selectedBrand.logo_url} alt={selectedBrand.name} className="h-9 w-9 object-contain" />
                        ) : (
                          <div className="text-base font-semibold text-zinc-600">{(selectedBrand.initial || selectedBrand.name.charAt(0)).toUpperCase()}</div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs text-zinc-500">品牌</div>
                        <div className="truncate text-lg font-semibold text-zinc-900">{selectedBrandName}</div>
                      </div>
                    </div>

                    <div className="text-sm text-zinc-600">共 {series.length} 个车系</div>
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between gap-3">
                    <div className="text-sm font-semibold text-zinc-900" id="series-section">{t("brands.allModels", "全部车系")}</div>
                    <Link to={`${base}/brands`} className="text-xs font-semibold text-blue-700 hover:underline">返回全部品牌</Link>
                  </div>

                  {loadingSeries ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-transparent" />
                      <span className="ml-3 text-sm text-zinc-600">{t("common.loading")}</span>
                    </div>
                  ) : series.length === 0 ? (
                    <div className="py-12 text-center text-sm text-zinc-600">{t("series.empty", "当前没有车系数据，请先在管理后台添加。")}</div>
                  ) : (
                    <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {series.map((item) => {
                        const meta = seriesMeta[item.jm_id] || {
                          coverUrl: item.logo_url || null,
                          officialCount: 0,
                          exteriorVrGroups: 0,
                          interiorVrColors: 0,
                          sizeType: null,
                          rangeMinKm: null,
                          rangeMaxKm: null,
                          exteriorSwatches: [],
                        };

                        const cover = meta.coverUrl ? (proxiedImageUrl(meta.coverUrl) || undefined) : undefined;
                        const seriesName = item.fullname || item.name;

                        const rangeText =
                          typeof meta.rangeMinKm === 'number' && typeof meta.rangeMaxKm === 'number'
                            ? meta.rangeMinKm === meta.rangeMaxKm
                              ? `${meta.rangeMinKm}公里`
                              : `${meta.rangeMinKm}-${meta.rangeMaxKm}公里`
                            : null;

                        const isAdding = addingSeriesId === item.id;

                        return (
                          <div
                            key={item.id}
                            className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                          >
                            <Link to={`${base}/series/${item.id}`} className="block">
                              <div className="relative aspect-[16/9] bg-zinc-100">
                                {cover ? (
                                  <SafeImage src={cover} alt={seriesName} className="absolute inset-0 h-full w-full object-cover" usePlaceholder />
                                ) : (
                                  <div className="absolute inset-0 bg-gradient-to-br from-zinc-200 to-zinc-50" />
                                )}
                                <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0)_0%,rgba(0,0,0,0.28)_60%,rgba(0,0,0,0.55)_100%)]" />
                                <div className="absolute bottom-0 left-0 right-0 p-4">
                                  <div className="text-base font-semibold text-white drop-shadow-sm line-clamp-1">{seriesName}</div>
                                  <div className="mt-1 text-xs text-white/80">{item.subcompany_name ? `${item.subcompany_name}` : ""}</div>
                                </div>
                              </div>

                              <div className="p-4">
                                <div className="text-sm text-zinc-600">
                                  级别/续航里程：
                                  <span className="text-zinc-900">{meta.sizeType || "—"}</span>
                                  <span className="text-zinc-400"> / </span>
                                  <span className="text-zinc-900">{rangeText || "—"}</span>
                                </div>

                                {Array.isArray(meta.exteriorSwatches) && meta.exteriorSwatches.length > 0 ? (
                                  <div className="mt-2 flex items-center gap-2">
                                    <div className="text-sm text-zinc-600">颜色：</div>
                                    <div className="flex items-center gap-1.5">
                                      {meta.exteriorSwatches.slice(0, 9).map((c: string) => (
                                        <span key={c} className="h-4 w-4 rounded bg-zinc-200" style={{ background: c }} />
                                      ))}
                                      {meta.exteriorSwatches.length > 9 ? (
                                        <span className="text-xs text-zinc-500">+{meta.exteriorSwatches.length - 9}</span>
                                      ) : null}
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            </Link>

                            <div className="flex items-center justify-between gap-3 px-4 pb-4">
                              <Link to={`${base}/series/${item.id}`} className="text-sm font-semibold text-zinc-900 hover:text-blue-700">
                                查看车系
                              </Link>
                              <button
                                type="button"
                                disabled={isAdding}
                                onClick={() => addSeriesToInquiry(item.id)}
                                className={
                                  isAdding
                                    ? "inline-flex items-center justify-center rounded-xl bg-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700"
                                    : "inline-flex items-center justify-center rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-700"
                                }
                              >
                                {isAdding ? t("common.loading") : t("action.addToInquiry")}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {!loading && brands.length > 0 ? (
          <div className="mt-10 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm" id="brands-marquee">
            <div
              className="flex items-center gap-4 w-max brand-marquee-track"
              onMouseEnter={() => {
                document.querySelectorAll(".brand-marquee-track").forEach((el) => el.classList.add("animation-paused"));
              }}
              onMouseLeave={() => {
                document.querySelectorAll(".brand-marquee-track").forEach((el) => el.classList.remove("animation-paused"));
              }}
            >
              {[...brands, ...brands].map((brand, idx) => (
                <button
                  key={`${brand.id}-${idx}`}
                  type="button"
                  onClick={() => {
                    loadBrandModels(brand);
                    const section = document.getElementById("series-section");
                    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-zinc-200 bg-white hover:bg-zinc-50"
                >
                  {brand.logo_url ? (
                    <img
                      src={brand.logo_url}
                      alt={brand.name}
                      className="h-8 w-8 object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  ) : (
                    <span className="text-sm font-semibold text-zinc-600">{(brand.initial || brand.name.charAt(0)).toUpperCase()}</span>
                  )}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
