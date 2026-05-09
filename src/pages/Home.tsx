import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { normalizeLocale, type Locale } from '@/i18n/locales';
import { supabase } from '@/utils/supabaseClient';
import Globe from '@/components/Globe';
import ExportProcess from '@/components/ExportProcess';
import HeroBanner from '@/components/HeroBanner';
import SafeImage from '@/components/SafeImage';
import { proxiedImageUrl } from '@/utils/proxyUrl';
import { useInquiryDraft } from '@/store/useInquiryDraft';
import logoUrl from '../../logo/youluminglogo.png?url';

type CountrySale = { countryName: string; salesVolume: number };

type HotSaleModelDetail = {
  id: string;
  model_id: string;
  name: string;
  logo_url: string | null;
  yeartype: string | null;
  price: string | null;
  sizetype: string | null;
  brandname: string | null;
  parentname: string | null;
  salestate: string | null;
  brand_id: string | null;
  brand_jm_id: number | null;
  series_id: string | null;
  brand_logo_url: string | null;
  series_name: string | null;
  spec_a: string | null;
  spec_b: string | null;
  spec_c: string | null;
  cover_url?: string | null;
  updated_at: string;
};

function pickSpec(parts: Array<string | null | undefined>) {
  return parts.map((x) => String(x ?? '').trim()).filter(Boolean).join(' · ') || null;
}

function buildHotTitle(name: string, yeartype: string | null): string {
  const n = String(name ?? '').trim();
  const y = String(yeartype ?? '').trim();
  if (!n) return '';
  if (!y) return n;
  return n.includes(y) ? n : `${y} ${n}`;
}

function normStr(v: any) {
  return String(v ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s·•・.]+/g, '')
    .replace(/[()（）]/g, '');
}

function normUrl(v: any): string | null {
  const s = typeof v === 'string' ? v.trim() : '';
  return s ? s : null;
}

function extractNumbers(v: any): number[] {
  if (typeof v === 'number' && Number.isFinite(v) && v > 0) return [v];
  const txt = typeof v === 'string' ? v : '';
  const nums = txt.match(/\d+(?:\.\d+)?/g);
  if (!nums) return [];
  return nums.map((x) => Number(x)).filter((x) => Number.isFinite(x) && x > 0);
}

function pickRangeKmFromRaw(raw: any): { min: number; max: number } | null {
  const engine = (raw?.engine ?? {}) as any;
  const electricmotor = (raw?.electricmotor ?? {}) as any;
  const candidates = [
    engine?.cltcmaxmileage,
    engine?.cltccomprehensivemileage,
    electricmotor?.cltcmaxmileage,
    electricmotor?.cltccomprehensivemileage,
    raw?.engine_cltccomprehensivemileage,
    raw?.electricmotor_cltccomprehensivemileage,
    raw?.['engine.cltcmaxmileage'],
    raw?.['engine.cltccomprehensivemileage'],
    raw?.['electricmotor.cltcmaxmileage'],
    raw?.['electricmotor.cltccomprehensivemileage'],
  ];

  const values: number[] = [];
  for (const c of candidates) values.push(...extractNumbers(c));
  if (values.length === 0) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (!Number.isFinite(min) || !Number.isFinite(max)) return null;
  return { min, max };
}

export default function Home() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? 'en') as Locale;
  
  const [countrySales, setCountrySales] = useState<CountrySale[]>([]);
  const [hotSaleModels, setHotSaleModels] = useState<HotSaleModelDetail[]>([]);
  const [selectedSizeType, setSelectedSizeType] = useState<string>('全部');
  const [hotVisible, setHotVisible] = useState<Record<string, boolean>>({});
  const selectedModelIds = useInquiryDraft((s) => s.selectedModelIds);
  const toggleModelId = useInquiryDraft((s) => s.toggleModelId);

  // Fetch country sales data
  useEffect(() => {
    const fetchSales = async () => {
      try {
        const { data } = await supabase.from('country_sales').select('*');
        if (data && data.length > 0) {
          setCountrySales(data.map((d: any) => ({ 
            countryName: d.country_name, 
            salesVolume: d.sales_volume 
          })));
        } else {
          setCountrySales([
            { countryName: 'Saudi Arabia', salesVolume: 1200 },
            { countryName: 'UAE', salesVolume: 850 },
            { countryName: 'Egypt', salesVolume: 620 },
            { countryName: 'Chile', salesVolume: 480 },
          ]);
        }
      } catch (error) {
        setCountrySales([
          { countryName: 'Saudi Arabia', salesVolume: 1200 },
          { countryName: 'UAE', salesVolume: 850 },
          { countryName: 'Egypt', salesVolume: 620 },
          { countryName: 'Chile', salesVolume: 480 },
        ]);
      }
    };

    const handleFocus = () => fetchSales();
    window.addEventListener('focus', handleFocus);
    
    fetchSales();
    
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  useEffect(() => {
    const fetchHotSaleModels = async () => {
      try {
        const { data: details, error } = await supabase
          .from('model_details')
          .select('id, model_id, name, logo_url, yeartype, price, sizetype, brandname, parentname, salestate, updated_at, brand_id, brand_jm_id, series_id, hot_card_cover_url, raw')
          .eq('hot_sale', true)
          .eq('activity_status', 0)
          .not('model_id', 'is', null)
          .order('updated_at', { ascending: false });

        if (error) throw error;

        const { data: brandsData } = await supabase
          .from('brands')
          .select('id, jm_id, activity_status, logo_url, name, fullname');

        const { data: seriesData } = await supabase
          .from('series')
          .select('id, jm_id, logo_url, activity_status, name, fullname');

        const brandStatusMap = new Map<string, number>();
        (brandsData ?? []).forEach((b) => brandStatusMap.set(b.id, b.activity_status ?? 0));

        const seriesStatusMap = new Map<string, number>();
        (seriesData ?? []).forEach((s) => seriesStatusMap.set(s.id, s.activity_status ?? 0));

        const brandLogoById = new Map<string, string | null>();
        const brandLogoByJmId = new Map<number, string | null>();
        const brandNameIndex: Array<{ key: string; url: string | null }> = [];
        (brandsData ?? []).forEach((b: any) => {
          const url = normUrl(b.logo_url);
          brandLogoById.set(String(b.id), url);
          if (typeof b.jm_id === 'number') brandLogoByJmId.set(b.jm_id, url);
          const n1 = normStr(b.name);
          const n2 = normStr(b.fullname);
          if (n1) brandNameIndex.push({ key: n1, url });
          if (n2 && n2 !== n1) brandNameIndex.push({ key: n2, url });
        });

        function resolveBrandLogo(d: any): string | null {
          const byId = d.brand_id ? (brandLogoById.get(String(d.brand_id)) ?? null) : null;
          if (byId) return byId;
          const byJm = typeof d.brand_jm_id === 'number' ? (brandLogoByJmId.get(d.brand_jm_id) ?? null) : null;
          if (byJm) return byJm;
          const dn = d.brandname ? normStr(d.brandname) : '';
          if (!dn) return null;
          for (const it of brandNameIndex) {
            if (!it.key) continue;
            if (dn.includes(it.key) || it.key.includes(dn)) {
              if (it.url) return it.url;
            }
          }
          return null;
        }

        const seriesNameMap = new Map<string, string>();
        (seriesData ?? []).forEach((s: any) => {
          const name = String(s.fullname || s.name || '').trim();
          if (name) seriesNameMap.set(String(s.id), name);
        });

        const seriesIdToJmId = new Map<string, number>();
        const seriesIdToJumeLogo = new Map<string, string | null>();
        (seriesData ?? []).forEach((s: any) => {
          const id = typeof s?.id === 'string' ? s.id : null;
          const jmId = typeof s?.jm_id === 'number' ? s.jm_id : null;
          if (id && jmId) seriesIdToJmId.set(id, jmId);
          if (id) seriesIdToJumeLogo.set(id, normUrl(s.logo_url));
        });

        const valid = (details ?? []).filter((d) => {
          if (d.brand_id) {
            const bs = brandStatusMap.get(d.brand_id);
            if (bs !== undefined && bs !== 0) return false;
          }
          if (d.series_id) {
            const ss = seriesStatusMap.get(d.series_id);
            if (ss !== undefined && ss !== 0) return false;
          }
          return true;
        });

        const picked = valid.slice(0, 8);
        const pickedSeriesJmIds = Array.from(
          new Set(
            picked
              .map((d: any) => (d.series_id ? seriesIdToJmId.get(String(d.series_id)) : null))
              .filter((x: any) => typeof x === 'number' && Number.isFinite(x))
          )
        );
        const { data: seriesCfgRows, error: seriesCfgErr } = pickedSeriesJmIds.length
          ? await supabase.from('series_vr_config').select('series_jm_id, official_images').in('series_jm_id', pickedSeriesJmIds)
          : ({ data: [], error: null } as any);
        if (seriesCfgErr) throw seriesCfgErr;

        const seriesOfficialCoverByJmId = new Map<number, string | null>();
        (seriesCfgRows ?? []).forEach((r: any) => {
          const sid = typeof r?.series_jm_id === 'number' ? r.series_jm_id : null;
          const imgs = Array.isArray(r?.official_images) ? r.official_images.filter((u: any) => typeof u === 'string' && u.trim()) : [];
          if (sid) seriesOfficialCoverByJmId.set(sid, (imgs[0] as string | undefined) ?? null);
        });

        setHotSaleModels(picked.map((d: any) => {
          const modelId = String(d.model_id);
          const raw = (d.raw ?? {}) as any;

          const range = pickRangeKmFromRaw(raw);
          const rangeText = range
            ? range.min === range.max
              ? `${Math.round(range.max)}km`
              : `${Math.round(range.min)}-${Math.round(range.max)}km`
            : null;

          const specA = pickSpec([d.sizetype]);
          const specB = pickSpec([d.yeartype]);
          const specC = pickSpec([rangeText]);

          const seriesId = d.series_id ? String(d.series_id) : null;
          const seriesJmId = seriesId ? (seriesIdToJmId.get(seriesId) ?? null) : null;
          const seriesOfficialCover = seriesJmId ? (seriesOfficialCoverByJmId.get(seriesJmId) ?? null) : null;
          const seriesJumeCover = seriesId ? (seriesIdToJumeLogo.get(seriesId) ?? null) : null;
          const cover = normUrl(d.hot_card_cover_url) || seriesOfficialCover || seriesJumeCover || d.logo_url || null;

          return {
          id: String(d.id),
          model_id: modelId,
          name: String(d.name ?? ''),
          logo_url: d.logo_url ?? null,
          yeartype: d.yeartype ?? null,
          price: d.price ?? null,
          sizetype: d.sizetype ?? null,
          brandname: d.brandname ?? null,
          parentname: d.parentname ?? null,
          salestate: d.salestate ?? null,
          brand_id: d.brand_id ? String(d.brand_id) : null,
          brand_jm_id: typeof d.brand_jm_id === 'number' ? d.brand_jm_id : null,
          series_id: seriesId,
          brand_logo_url: resolveBrandLogo(d),
          series_name: seriesId ? (seriesNameMap.get(seriesId) ?? null) : null,
          spec_a: specA,
          spec_b: specB,
          spec_c: specC,
          cover_url: cover,
          updated_at: String(d.updated_at ?? ''),
          };
        }));
      } catch (e) {
        setHotSaleModels([]);
      }
    };

    fetchHotSaleModels();
  }, [locale]);

  const sizeTypeTabs = useMemo(() => {
    const set = new Set<string>();
    hotSaleModels.forEach((m) => {
      const s = (m.sizetype ?? '').trim();
      if (s) set.add(s);
    });
    return ['全部', ...Array.from(set).sort((a, b) => a.localeCompare(b, 'zh-CN'))];
  }, [hotSaleModels]);

  const filteredHotSaleModels = useMemo(() => {
    if (selectedSizeType === '全部') return hotSaleModels;
    return hotSaleModels.filter((m) => (m.sizetype ?? '').trim() === selectedSizeType);
  }, [hotSaleModels, selectedSizeType]);

  useEffect(() => {
    setHotVisible({});
  }, [selectedSizeType]);

  useEffect(() => {
    const els = Array.from(document.querySelectorAll('[data-hot-row="1"]')) as HTMLElement[];
    if (els.length === 0) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          const id = (e.target as HTMLElement).dataset.hotId || '';
          if (!id) continue;
          setHotVisible((prev) => (prev[id] ? prev : { ...prev, [id]: true }));
        }
      },
      { threshold: 0.25 }
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [filteredHotSaleModels.map((m) => m.id).join('|')]);

  return (
    <div className="min-h-screen bg-primary-dark text-text-primary">
      {/* Hero Section */}
      <section className="relative p-0">
        <HeroBanner
          title={t('hero.title')}
          subtitle={t('hero.subtitle', '以合规运营与高效服务为核心，为全球汽车商家及个人提供稳定可靠的中国汽车批量采购解决方案')}
        />
      </section>

      {/* Hot Models Section */}
      <section className="relative overflow-hidden bg-primary-dark pt-8 pb-16" id="models">

        <div className="container">
          <header className="mt-10 mb-2 relative z-10">
            <h2 className="text-4xl md:text-5xl font-black text-center mb-0 text-gradient uppercase tracking-tight">
              {t('models.hot')}
            </h2>
          </header>

          {hotSaleModels.length > 0 ? (
            <section className="relative z-10">
              <nav className="flex flex-wrap gap-3 mb-6 overflow-x-auto pb-2">
                {sizeTypeTabs.map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedSizeType(tab)}
                    className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-280 backdrop-blur-md
                      ${selectedSizeType === tab
                        ? 'bg-[rgba(255,126,0,0.16)] text-[#FF7E00] shadow-[0_10px_28px_-8px_rgba(255,126,0,0.28)] border border-[rgba(255,126,0,0.55)]'
                        : 'bg-[rgba(0,0,0,0.03)] text-text-secondary border border-[rgba(0,0,0,0.10)] hover:bg-[rgba(0,0,0,0.05)] hover:text-text-primary hover:translate-y-[-1px] hover:border-[rgba(255,126,0,0.55)]'}
                    `}
                  >
                    {tab}
                  </button>
                ))}
              </nav>
              <div className="space-y-10">
                {filteredHotSaleModels.map((m, idx) => {
                  const reverse = idx % 2 === 1;
                  const visible = !!hotVisible[m.id];
                  const brandSeries = [m.brandname, m.series_name || m.parentname].filter(Boolean).join(' · ') || 'HOT MODEL';
                  const hotTitle = buildHotTitle(m.name, m.yeartype);
                  const inInquiry = selectedModelIds.includes(m.model_id);
                  const panelBg = reverse
                    ? 'bg-[linear-gradient(180deg,#fff7ed_0%,#fff_55%,#f8fafc_100%)]'
                    : 'bg-[linear-gradient(180deg,#f8fafc_0%,#fff_55%,#fff7ed_100%)]';

                  return (
                    <article
                      key={m.id}
                      data-hot-row="1"
                      data-hot-id={m.id}
                      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-black/20 shadow-[0_30px_90px_-60px_rgba(0,0,0,0.9)]"
                    >
                      <div className={reverse ? 'grid grid-cols-1 lg:grid-cols-12' : 'grid grid-cols-1 lg:grid-cols-12'}>
                        <div className={reverse ? 'order-2 lg:order-2 lg:col-span-7' : 'order-2 lg:order-1 lg:col-span-7'}>
                          <div className="relative h-full min-h-[320px]">
                            {m.cover_url || m.logo_url ? (
                              <SafeImage
                                src={m.cover_url || m.logo_url || undefined}
                                alt={m.name}
                                className="absolute inset-0 h-full w-full object-cover"
                                usePlaceholder
                              />
                            ) : (
                              <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,126,0,0.25),transparent_55%),radial-gradient(circle_at_80%_70%,rgba(59,130,246,0.22),transparent_55%)]" />
                            )}
                            
                          </div>
                        </div>

                        <div className={reverse ? 'order-1 lg:order-1 lg:col-span-5' : 'order-1 lg:order-2 lg:col-span-5'}>
                          <div className={`h-full ${panelBg} p-6 md:p-8`}>
                            <div
                              className={
                                visible
                                  ? 'transition-all duration-700 ease-out opacity-100 translate-y-0'
                                  : 'opacity-0 translate-y-6'
                              }
                            >
                              <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-3 min-w-0">
                                  <div className="h-11 w-11 shrink-0 rounded-xl border border-black/10 bg-white/70 backdrop-blur flex items-center justify-center overflow-hidden">
                                    {m.brand_logo_url ? (
                                      <SafeImage
                                        src={proxiedImageUrl(m.brand_logo_url) || undefined}
                                        alt={String(m.brandname || 'brand')}
                                        className="h-8 w-8 object-contain"
                                        usePlaceholder
                                      />
                                    ) : (
                                      <div className="text-sm font-black text-black/60">
                                        {String(m.brandname || 'B').slice(0, 1).toUpperCase()}
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0">
                                    <div className="text-[11px] font-semibold tracking-[0.22em] text-black/50 uppercase truncate">
                                      THE NEW
                                    </div>
                                    <div className="mt-1 text-base font-black text-black truncate">
                                      {brandSeries}
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="mt-5">
                                <div className="text-2xl md:text-3xl font-black text-black tracking-tight">
                                  {hotTitle}
                                </div>
                              </div>

                              <div className="mt-5 flex items-center gap-6 text-sm font-semibold text-black">
                                <div className="text-center">
                                  <div className="text-xs text-black/45">级别</div>
                                  <div className="mt-1">{m.spec_a || m.sizetype || '—'}</div>
                                </div>
                                <div className="h-10 w-px bg-black/10" />
                                <div className="text-center">
                                  <div className="text-xs text-black/45">年款</div>
                                  <div className="mt-1">{m.spec_b || m.yeartype || '—'}</div>
                                </div>
                                <div className="h-10 w-px bg-black/10" />
                                <div className="text-center">
                                  <div className="text-xs text-black/45">续航</div>
                                  <div className="mt-1">{m.spec_c || '—'}</div>
                                </div>
                              </div>

                              <div className="mt-5 h-px bg-black/10" />

                              <div className="mt-6 flex flex-wrap items-center gap-3">
                                <Link
                                  to={`/${locale}/model/${m.model_id}`}
                                  className="inline-flex items-center justify-center rounded-xl border border-black/15 bg-white/80 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
                                >
                                  Explore
                                </Link>
                                {m.series_id ? (
                                  <Link
                                    to={`/${locale}/series/${m.series_id}`}
                                    className="inline-flex items-center justify-center rounded-xl border border-black/15 bg-white/80 px-4 py-2 text-sm font-semibold text-black hover:bg-white"
                                  >
                                    Series
                                  </Link>
                                ) : null}
                                <button
                                  type="button"
                                  onClick={() => toggleModelId(m.model_id)}
                                  className={
                                    inInquiry
                                      ? 'inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800'
                                      : 'inline-flex items-center justify-center rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-black/90'
                                  }
                                >
                                  {inInquiry ? '✓ 已加入报价单' : t('action.getQuote', '获取报价')}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          ) : null}

        </div>
      </section>

      {/* Export Process Section */}
      <section className="relative overflow-hidden bg-primary-dark">
        <ExportProcess />
      </section>

      {/* Global Market Coverage Section */}
      <section className="bg-primary-dark relative overflow-hidden py-12">

        <div className="container">
          <div className="text-center mb-8">
            <h2 className="text-4xl md:text-5xl font-black mb-2 text-gradient uppercase tracking-tight">
              {t('home.globe.title', '覆盖全球主要市场')}
            </h2>
            <p className="text-xl text-text-secondary leading-relaxed">
              {t('home.globe.subtitle', '我们的汽车出口业务已覆盖中东、中亚、东南亚、非洲、南美等全球多个区域')}
            </p>
          </div>

          <div className="relative h-[448px] overflow-hidden md:h-[588px]">
            <div className="absolute inset-0 z-20" style={{ pointerEvents: 'auto' }}>
              <Globe
                className="h-full w-full"
                accent="#FF7E00"
                ocean="rgba(255, 255, 255, 0.92)"
                land="rgba(0, 0, 0, 0.06)"
                highlight="rgba(255, 126, 0, 0.98)"
                graticule="rgba(255, 126, 0, 0.20)"
                borders="rgba(0, 0, 0, 0.18)"
                countrySales={countrySales}
                interactive
              />
            </div>

            <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-[rgba(0,0,0,0.10)] bg-[rgba(255,255,255,0.70)]/80 px-3 py-1 text-xs text-text-secondary backdrop-blur-md">
              {t('home.globe.hint')}
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="bg-primary-dark relative overflow-hidden py-12" id="contact">

        <div className="container">
          <article className="rounded-3xl overflow-hidden glass-card-strong">
            <div className="p-6 md:p-10">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* Avatar Area */}
                <div className="relative">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-[rgba(0,0,0,0.10)] shadow-lg">
                    <img
                      src={logoUrl}
                      alt={t('brand')}
                      className="w-full h-full object-contain p-4"
                    />
                  </div>

                  <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-[rgba(255,255,255,0.70)] rounded-full flex items-center justify-center shadow-lg border-4 border-[rgba(255,126,0,0.22)]">
                    <svg className="w-8 h-8 text-[#FF7E00]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21, 3 14.284, 3 6V5z" />
                    </svg>
                  </div>
                </div>

                {/* Text Content */}
                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl font-bold text-text-primary mb-4">
                    {t('contact.title', '不确定从哪里开始？')}
                  </h3>
                  <p className="text-xl text-text-secondary mb-6 leading-relaxed max-w-xl">
                    {t('contact.description', '预约 30 分钟的免费咨询。我们将分析您的需求，并为您提供最佳的汽车采购方案。')}
                  </p>
                  <Link
                    to={`/${locale}/inquiry`}
                    className="btn-inquiry inline-flex items-center gap-2"
                  >
                    <span>{t('action.getQuote', '获取报价')}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
