import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { secondaryButtonCls, primaryButtonCls, inputCls } from '@/admin/AdminApp';

type BrandRow = { jm_id: number; name: string };
type SeriesRow = { jm_id: number; name: string; brand_jm_id: number };
type ModelRow = { jm_id: number; name: string; series_jm_id: number };
type PictureItem = { id: string; image_url: string };
type CarPictureRow = { id: string; image_url: string; sort_order: number | null };
type ModelImageConfigRow = { official_images: string[] | null };
type SeriesVrConfigRow = { official_images: string[] | null };

export default function OfficialPickerModal(props: {
  open: boolean;
  onClose: () => void;
  onPick: (items: { url: string; meta: Record<string, unknown> }[]) => Promise<void> | void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brandQuery, setBrandQuery] = useState('');
  const [seriesQuery, setSeriesQuery] = useState('');
  const [modelQuery, setModelQuery] = useState('');

  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [series, setSeries] = useState<SeriesRow[]>([]);
  const [models, setModels] = useState<ModelRow[]>([]);
  const [pictures, setPictures] = useState<PictureItem[]>([]);

  const [brandId, setBrandId] = useState<number | null>(null);
  const [seriesId, setSeriesId] = useState<number | null>(null);
  const [modelId, setModelId] = useState<number | null>(null);
  const [selected, setSelected] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!props.open) return;
    setLoading(true);
    setError(null);
    supabase
      .from('brands')
      .select('jm_id,name')
      .eq('depth', 1)
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        setBrands((data as BrandRow[]) ?? []);
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '加载品牌失败');
      })
      .finally(() => setLoading(false));
  }, [props.open]);

  useEffect(() => {
    if (!props.open) return;
    if (!brandId) {
      setSeries([]);
      setModels([]);
      setPictures([]);
      setSeriesId(null);
      setModelId(null);
      setSelected({});
      return;
    }
    setLoading(true);
    setError(null);
    supabase
      .from('series')
      .select('jm_id,name,brand_jm_id')
      .eq('brand_jm_id', brandId)
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        setSeries((data as SeriesRow[]) ?? []);
        setModels([]);
        setPictures([]);
        setSeriesId(null);
        setModelId(null);
        setSelected({});
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '加载车系失败');
      })
      .finally(() => setLoading(false));
  }, [brandId, props.open]);

  useEffect(() => {
    if (!props.open) return;
    if (!seriesId) {
      setModels([]);
      setPictures([]);
      setModelId(null);
      setSelected({});
      return;
    }
    setLoading(true);
    setError(null);
    supabase
      .from('models_jumdata')
      .select('jm_id,name,series_jm_id')
      .eq('series_jm_id', seriesId)
      .order('name', { ascending: true })
      .then(({ data, error }) => {
        if (error) throw error;
        setModels((data as ModelRow[]) ?? []);
        setPictures([]);
        setModelId(null);
        setSelected({});
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '加载车型失败');
      })
      .finally(() => setLoading(false));
  }, [seriesId, props.open]);

  useEffect(() => {
    if (!props.open) return;
    if (!modelId) {
      setPictures([]);
      setSelected({});
      return;
    }
    setLoading(true);
    setError(null);
    Promise.all([
      supabase
        .from('car_pictures')
        .select('id,image_url,sort_order')
        .eq('model_jm_id', modelId)
        .eq('category', 'official')
        .order('sort_order', { ascending: true })
        .limit(96),
      supabase
        .from('model_image_config')
        .select('official_images')
        .eq('model_jm_id', modelId)
        .maybeSingle(),
      typeof seriesId === 'number'
        ? supabase
            .from('series_vr_config')
            .select('official_images')
            .eq('series_jm_id', seriesId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null } as unknown as { data: SeriesVrConfigRow | null; error: any }),
    ])
      .then(([picsRes, cfgRes, seriesRes]) => {
        if (picsRes.error) throw picsRes.error;
        if (cfgRes.error) throw cfgRes.error;
        if (seriesRes.error) throw seriesRes.error;

        const fromTable = ((picsRes.data as CarPictureRow[]) ?? [])
          .filter((p) => typeof p.image_url === 'string' && p.image_url.trim())
          .map((p) => ({ id: p.id, image_url: p.image_url }));

        const cfgUrls = (cfgRes.data as ModelImageConfigRow | null)?.official_images ?? [];
        const fromCfg = (Array.isArray(cfgUrls) ? cfgUrls : [])
          .filter((u) => typeof u === 'string' && u.trim())
          .map((u, idx) => ({ id: `cfg_${modelId}_${idx}`, image_url: u }));

        const seriesUrls = (seriesRes.data as SeriesVrConfigRow | null)?.official_images ?? [];
        const fromSeries = (Array.isArray(seriesUrls) ? seriesUrls : [])
          .filter((u) => typeof u === 'string' && u.trim())
          .map((u, idx) => ({ id: `series_${seriesId}_${idx}`, image_url: u }));

        const dedup = new Set<string>();
        const merged = [...fromTable, ...fromCfg, ...fromSeries].filter((p) => {
          const k = p.image_url.trim();
          if (dedup.has(k)) return false;
          dedup.add(k);
          return true;
        });

        setPictures(merged);
        setSelected({});
      })
      .catch((e: unknown) => {
        setError(e instanceof Error ? e.message : '加载官图失败');
      })
      .finally(() => setLoading(false));
  }, [modelId, seriesId, props.open]);

  const filteredBrands = useMemo(() => {
    const q = brandQuery.trim().toLowerCase();
    if (!q) return brands;
    return brands.filter((b) => b.name.toLowerCase().includes(q));
  }, [brands, brandQuery]);

  const filteredSeries = useMemo(() => {
    const q = seriesQuery.trim().toLowerCase();
    if (!q) return series;
    return series.filter((s) => s.name.toLowerCase().includes(q));
  }, [series, seriesQuery]);

  const filteredModels = useMemo(() => {
    const q = modelQuery.trim().toLowerCase();
    if (!q) return models;
    return models.filter((m) => m.name.toLowerCase().includes(q));
  }, [models, modelQuery]);

  const selectedItems = useMemo(() => {
    const urls = pictures.filter((p) => selected[p.id]).map((p) => p.image_url);
    return urls;
  }, [pictures, selected]);

  if (!props.open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-6xl rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
          <div className="text-base font-semibold text-zinc-900">从车型官图选择</div>
          <button type="button" onClick={props.onClose} className={secondaryButtonCls()}>
            关闭
          </button>
        </div>

        <div className="grid grid-cols-12 gap-4 p-6">
          <div className="col-span-12 md:col-span-3">
            <div className="text-xs font-semibold text-zinc-600">品牌</div>
            <input value={brandQuery} onChange={(e) => setBrandQuery(e.target.value)} className={inputCls() + ' mt-2'} placeholder="搜索品牌" />
            <div className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-zinc-200">
              {filteredBrands.map((b) => (
                <button
                  key={b.jm_id}
                  type="button"
                  onClick={() => setBrandId(b.jm_id)}
                  className={
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm ' +
                    (brandId === b.jm_id ? 'bg-amber-50 text-zinc-900' : 'hover:bg-zinc-50 text-zinc-700')
                  }
                >
                  <span className="truncate">{b.name}</span>
                  <span className="text-xs text-zinc-400">{b.jm_id}</span>
                </button>
              ))}
              {filteredBrands.length === 0 ? <div className="px-3 py-4 text-sm text-zinc-500">无结果</div> : null}
            </div>
          </div>

          <div className="col-span-12 md:col-span-3">
            <div className="text-xs font-semibold text-zinc-600">车系</div>
            <input value={seriesQuery} onChange={(e) => setSeriesQuery(e.target.value)} className={inputCls() + ' mt-2'} placeholder="搜索车系" />
            <div className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-zinc-200">
              {filteredSeries.map((s) => (
                <button
                  key={s.jm_id}
                  type="button"
                  onClick={() => setSeriesId(s.jm_id)}
                  disabled={!brandId}
                  className={
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm disabled:opacity-60 ' +
                    (seriesId === s.jm_id ? 'bg-amber-50 text-zinc-900' : 'hover:bg-zinc-50 text-zinc-700')
                  }
                >
                  <span className="truncate">{s.name}</span>
                  <span className="text-xs text-zinc-400">{s.jm_id}</span>
                </button>
              ))}
              {brandId && filteredSeries.length === 0 ? <div className="px-3 py-4 text-sm text-zinc-500">无结果</div> : null}
              {!brandId ? <div className="px-3 py-4 text-sm text-zinc-500">先选择品牌</div> : null}
            </div>
          </div>

          <div className="col-span-12 md:col-span-3">
            <div className="text-xs font-semibold text-zinc-600">车型</div>
            <input value={modelQuery} onChange={(e) => setModelQuery(e.target.value)} className={inputCls() + ' mt-2'} placeholder="搜索车型" />
            <div className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-zinc-200">
              {filteredModels.map((m) => (
                <button
                  key={m.jm_id}
                  type="button"
                  onClick={() => setModelId(m.jm_id)}
                  disabled={!seriesId}
                  className={
                    'flex w-full items-center justify-between px-3 py-2 text-left text-sm disabled:opacity-60 ' +
                    (modelId === m.jm_id ? 'bg-amber-50 text-zinc-900' : 'hover:bg-zinc-50 text-zinc-700')
                  }
                >
                  <span className="truncate">{m.name}</span>
                  <span className="text-xs text-zinc-400">{m.jm_id}</span>
                </button>
              ))}
              {seriesId && filteredModels.length === 0 ? <div className="px-3 py-4 text-sm text-zinc-500">无结果</div> : null}
              {!seriesId ? <div className="px-3 py-4 text-sm text-zinc-500">先选择车系</div> : null}
            </div>
          </div>

          <div className="col-span-12 md:col-span-3">
            <div className="flex items-center justify-between">
              <div className="text-xs font-semibold text-zinc-600">官图</div>
              <div className="text-xs text-zinc-500">已选 {selectedItems.length}</div>
            </div>
            <div className="mt-3 max-h-[420px] overflow-auto rounded-xl border border-zinc-200 p-3">
              <div className="grid grid-cols-2 gap-2">
                {pictures.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setSelected((prev) => ({ ...prev, [p.id]: !prev[p.id] }))}
                    className={
                      'relative overflow-hidden rounded-lg border transition-colors ' +
                      (selected[p.id] ? 'border-amber-500' : 'border-zinc-200 hover:border-zinc-300')
                    }
                  >
                    <img src={p.image_url} alt="" className="h-20 w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                    {selected[p.id] ? <div className="absolute right-1 top-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-semibold text-zinc-950">已选</div> : null}
                  </button>
                ))}
              </div>
              {modelId && pictures.length === 0 ? <div className="py-6 text-sm text-zinc-500">该车型暂无官图</div> : null}
              {!modelId ? <div className="py-6 text-sm text-zinc-500">先选择车型</div> : null}
            </div>
          </div>
        </div>

        {error ? <div className="px-6 pb-4 text-sm text-red-600">{error}</div> : null}

        <div className="flex items-center justify-between border-t border-zinc-200 px-6 py-4">
          <div className="text-xs text-zinc-500">{loading ? '加载中...' : '选择完成后添加为素材'}</div>
          <button
            type="button"
            disabled={loading || selectedItems.length === 0}
            className={primaryButtonCls()}
            onClick={async () => {
              const items = selectedItems.map((url) => ({
                url,
                meta: {
                  model_jm_id: modelId,
                  series_jm_id: seriesId,
                  brand_jm_id: brandId,
                },
              }));
              await props.onPick(items);
              props.onClose();
            }}
          >
            添加为素材
          </button>
        </div>
      </div>
    </div>
  );
}
