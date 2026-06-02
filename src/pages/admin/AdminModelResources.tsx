import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/utils/supabaseClient";
import type { StagedItem } from "@/utils/stagedCrud";
import { pageCardCls, pageTitleCls, pageDescCls, subTabCls, primaryButtonCls, secondaryButtonCls, inputCls, labelCls } from "@/admin/AdminApp";
import { downloadExteriorVRForSeries, downloadInteriorVRForSeries, downloadImagesForModelCategory, downloadOfficialImagesForSeries, type ModelImageCategory, VRDownloadProgress, VRColorGroup, VRInteriorColorGroup, VRInteriorPositionGroup } from "@/utils/vrDownloader";
import { formatFileSize, compressImage } from "@/utils/imageCompression";
import ResourceOverviewTable from "@/components/admin/resourceOverview/ResourceOverviewTable";
import { useBrandVrBatch } from "@/store/useBrandVrBatch";
import { asyncPool } from "@/utils/asyncPool";
import { normalizeSeriesVrConfig } from "@/utils/seriesVrNormalize";
import { type InteriorVrPosition } from "@/utils/interiorVrVisibility";
import type { MaterialResourceJump, MaterialResourceSection } from "@/pages/admin/materialResourceJump";

type ResourceSection = MaterialResourceSection;
type VrCategory = "exterior" | "interior";
type InteriorPosition = "driver" | "passenger" | "rear" | "third_row" | "trunk";

type ColorGroup = {
  id: string;
  color_code: string;
  color_name: string;
  images: string[];
};

type InteriorPositionGroup = {
  id: string;
  position: InteriorPosition;
  position_name: string;
  images: string[];
};

type InteriorColorGroup = {
  id: string;
  color_name: string;
  color_value?: string;
  positions: InteriorPositionGroup[];
};

type SeriesVrConfig = {
  id: string;
  series_jm_id: number;
  series_id: string;
  series_name: string;
  brand_jm_id: number;
  brand_name: string;
  official_images: string[];
  exterior_vr: ColorGroup[];
  interior_vr: InteriorColorGroup[];
  created_at: string;
  updated_at: string;
};

type InteriorVrVisibilitySettings = {
  hidden_positions: InteriorVrPosition[];
};

type ModelImageConfig = {
  id: string;
  model_jm_id: number;
  model_id: string;
  model_name: string;
  series_jm_id: number;
  series_name: string;
  brand_jm_id: number;
  brand_name: string;
  exterior_images: string[];
  interior_images: string[];
  official_images: string[];
  created_at: string;
  updated_at: string;
};

type DbBrand = {
  id: string;
  jm_id: number;
  name: string;
  activity_status: number;
};

type DbSeries = {
  id: string;
  jm_id: number;
  brand_jm_id: number;
  name: string;
  fullname: string | null;
  activity_status: number;
};

type DbModel = {
  id: string;
  jm_id: number;
  series_jm_id: number;
  name: string;
  logo_url: string | null;
  activity_status: number;
};

type ColorOption = {
  code: string;
  name: string;
};

function parseColorString(colorStr: string | null): ColorOption[] {
  if (!colorStr) return [];
  const parts = colorStr.split('|');
  return parts.map(part => {
    const colorPart = part.trim();
    if (!colorPart) return null;

    const commaIdx = colorPart.indexOf(',');
    if (commaIdx === -1) return null;

    const code = colorPart.substring(0, commaIdx).trim();
    const name = colorPart.substring(commaIdx + 1).trim();

    return { code, name };
  }).filter((c): c is ColorOption => c !== null && c.name.length > 0);
}

const defaultColorOptions: ColorOption[] = [];

const interiorPositionOptions: { value: InteriorPosition; label: string }[] = [
  { value: "driver", label: "驾驶位" },
  { value: "passenger", label: "副驾驶位" },
  { value: "rear", label: "第二排座位" },
  { value: "third_row", label: "第三排座位" },
  { value: "trunk", label: "后备箱" },
];

function generateId() {
  return `tmp_${Date.now()}_${Math.random().toString(16).slice(2, 8)}`;
}

  function extFromDataUrl(dataUrl: string): string {
    const m = String(dataUrl || "").match(/^data:image\/([a-z0-9.+-]+);/i);
    const t = (m?.[1] || "").toLowerCase();
    if (t === "jpeg") return "jpg";
    if (t === "png") return "png";
    if (t === "webp") return "webp";
    return "jpg";
  }

function colorPreviewStyle(colorCode: string) {
  if (!colorCode) {
    return { backgroundColor: '#ccc', border: "1px solid #999" };
  }
  const isWhite = colorCode.toUpperCase().trim() === "#FFFFFF";
  return {
    backgroundColor: isWhite ? '#F5F5F5' : colorCode,
    border: isWhite ? "2px solid #999" : "1px solid #d1d5db",
  };
}

function ImageGallery({ images, onDelete, title }: { images: string[]; onDelete: (idx: number) => void; title?: string }) {
  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-zinc-200 bg-zinc-50">
        <svg className="w-8 h-8 text-zinc-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        <span className="text-sm text-zinc-400">暂无图片</span>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {images.map((url, idx) => (
        <div key={idx} className="relative group aspect-square rounded-lg overflow-hidden border border-zinc-200">
          <img src={url} alt={`${title || ''} ${idx + 1}`} className="w-full h-full object-cover" loading="lazy" decoding="async" />
          <button
            type="button"
            onClick={() => onDelete(idx)}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-sm hover:bg-red-600"
            title="删除图片"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}

function ColorGroupCard({ group, onUpdateColor, onDeleteImage, colorOptions }: { group: ColorGroup; onUpdateColor: (code: string, name: string) => void; onDeleteImage: (idx: number) => void; colorOptions: ColorOption[] }) {
  const [showPicker, setShowPicker] = useState(false);
  const currentColor = colorOptions.find(c => c.code === group.color_code);
  
  const rawColorCode = group.color_code || '#ccc';
  const normalizedColorCode = rawColorCode.startsWith('#') ? rawColorCode : `#${rawColorCode}`;
  const isLightColor = () => {
    if (!normalizedColorCode || normalizedColorCode.length < 7) return false;
    const hex = normalizedColorCode.replace('#', '').toUpperCase();
    if (!/^[0-9A-F]{6}$/.test(hex)) return false;
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    const brightness = (r * 299 + g * 587 + b * 114) / 1000;
    return brightness > 200;
  };

  return (
    <div className="border border-zinc-200 rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-md flex items-center justify-center text-xs font-bold"
            style={{ 
              backgroundColor: normalizedColorCode,
              border: isLightColor() ? "3px solid #999" : "3px solid #333",
              color: isLightColor() ? '#333' : '#fff',
            }}
            onClick={() => setShowPicker(!showPicker)}
            title={`颜色: ${group.color_name} (${rawColorCode})`}
          >
            {!rawColorCode || rawColorCode === '#ccc' ? '?' : ''}
          </div>
          {showPicker && (
            <div className="flex items-center gap-2">
              <select
                value={group.color_code || ''}
                onChange={(e) => {
                  const opt = colorOptions.find(c => c.code === e.target.value);
                  if (opt) onUpdateColor(opt.code, opt.name);
                  setShowPicker(false);
                }}
                className="text-sm border border-zinc-300 rounded-lg px-2 py-1"
              >
                {colorOptions.length === 0 ? (
                  <option value="">暂无颜色选项</option>
                ) : (
                  colorOptions.map(c => (
                    <option key={c.code} value={c.code}>{c.name} ({c.code})</option>
                  ))
                )}
              </select>
              <span className="text-xs text-zinc-400">{colorOptions.length} 个颜色</span>
            </div>
          )}
          {!showPicker && (
            <div className="text-sm">
              <span className="font-medium text-zinc-800">{currentColor?.name || group.color_name}</span>
              <span className="text-zinc-400 ml-1 text-xs">({group.color_code})</span>
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={() => onDeleteImage(-1)}
          className="text-red-500 hover:text-red-700 text-xs"
        >
          删除整组
        </button>
      </div>
      <ImageGallery images={group.images} onDelete={onDeleteImage} title={group.color_name} />
    </div>
  );
}

function PositionGroupCard({ group, onChangePosition, onDeleteImage }: { group: InteriorPositionGroup; onChangePosition: (pos: InteriorPosition) => void; onDeleteImage: (idx: number) => void }) {
  return (
    <div className="border border-zinc-200 rounded-xl p-4 bg-white">
      <div className="flex items-center justify-between mb-3">
        <select
          value={group.position}
          onChange={(e) => onChangePosition(e.target.value as InteriorPosition)}
          className="text-sm border border-zinc-300 rounded-lg px-2 py-1"
        >
          {interiorPositionOptions.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => onDeleteImage(-1)}
          className="text-red-500 hover:text-red-700 text-xs"
        >
          删除整组
        </button>
      </div>
      <ImageGallery images={group.images} onDelete={onDeleteImage} title={group.position_name} />
    </div>
  );
}

export default function AdminModelResources(props: { jump?: MaterialResourceJump | null; onJumpConsumed?: () => void }) {
  const [section, setSection] = useState<ResourceSection>("series-vr");
  const [dbBrands, setDbBrands] = useState<DbBrand[]>([]);
  const [dbSeries, setDbSeries] = useState<DbSeries[]>([]);
  const [dbModels, setDbModels] = useState<DbModel[]>([]);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [seriesVrConfig, setSeriesVrConfig] = useState<SeriesVrConfig | null>(null);
  const [modelImageConfig, setModelImageConfig] = useState<ModelImageConfig | null>(null);
  const [colorOptions, setColorOptions] = useState<ColorOption[]>(defaultColorOptions);

  const [brandSearch, setBrandSearch] = useState("");
  const [seriesSearch, setSeriesSearch] = useState("");
  const [modelSearch, setModelSearch] = useState("");

  const [uploading, setUploading] = useState(false);

  const [onlyNormalSelection, setOnlyNormalSelection] = useState<boolean>(() => {
    const v = localStorage.getItem("admin_model_resources_only_normal_selection");
    if (v === null) return true;
    return v === "1";
  });

  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<VRDownloadProgress | null>(null);
  const [downloadedColorGroups, setDownloadedColorGroups] = useState<VRColorGroup[]>([]);
  const [downloadLogs, setDownloadLogs] = useState<string[]>([]);

  const [modelDownloading, setModelDownloading] = useState(false);
  const [modelDownloadProgress, setModelDownloadProgress] = useState<VRDownloadProgress | null>(null);
  const [modelDownloadLogs, setModelDownloadLogs] = useState<string[]>([]);

  const [allSeriesOfficialBatching, setAllSeriesOfficialBatching] = useState(false);
  const [allSeriesOfficialBatchProgress, setAllSeriesOfficialBatchProgress] = useState<{ current: number; total: number; message: string } | null>(null);
  const [allSeriesOfficialBatchLogs, setAllSeriesOfficialBatchLogs] = useState<string[]>([]);
  const [allSeriesOfficialSkipIfExists, setAllSeriesOfficialSkipIfExists] = useState(true);
  const [allSeriesOfficialOverwrite, setAllSeriesOfficialOverwrite] = useState(false);
  const [allSeriesOfficialLimit, setAllSeriesOfficialLimit] = useState(60);
  const allSeriesOfficialCancelRef = useRef(false);

  const brandVrBatchRunning = useBrandVrBatch((s) => s.running);
  const brandVrBatchSaving = useBrandVrBatch((s) => s.saving);
  const brandVrBatchProgress = useBrandVrBatch((s) => s.progress);
  const brandVrBatchLogs = useBrandVrBatch((s) => s.logs);
  const brandVrBatchDrafts = useBrandVrBatch((s) => s.drafts);
  const startBrandVrBatchDownload = useBrandVrBatch((s) => s.startDownload);
  const cancelBrandVrBatch = useBrandVrBatch((s) => s.cancel);
  const saveBrandVrBatch = useBrandVrBatch((s) => s.saveAll);

  const [interiorVrVisBusy, setInteriorVrVisBusy] = useState(false);
  const [interiorVrVisError, setInteriorVrVisError] = useState<string | null>(null);
  const [interiorVrVisMessage, setInteriorVrVisMessage] = useState<string | null>(null);
  const [interiorVrVisibility, setInteriorVrVisibility] = useState<InteriorVrVisibilitySettings>({ hidden_positions: ['driver'] });

  

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setDownloadLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const addModelLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setModelDownloadLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };

  const addAllSeriesOfficialLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString();
    setAllSeriesOfficialBatchLogs(prev => [...prev, `[${timestamp}] ${message}`]);
  };


  useEffect(() => {
    localStorage.setItem("admin_model_resources_only_normal_selection", onlyNormalSelection ? "1" : "0");
    loadBrands();
    if (selectedBrandId) {
      loadSeries(selectedBrandId);
    } else {
      setDbSeries([]);
    }
    if (selectedSeriesId) {
      loadModels(selectedSeriesId);
    } else {
      setDbModels([]);
    }
  }, [onlyNormalSelection]);

  useEffect(() => {
    setSelectedSeriesId(null);
    setSelectedModelId(null);
    setSeriesSearch("");
    setModelSearch("");
    setDbModels([]);
    setSeriesVrConfig(null);
    setModelImageConfig(null);

    if (selectedBrandId) {
      loadSeries(selectedBrandId);
    } else {
      setDbSeries([]);
    }
  }, [selectedBrandId]);

  useEffect(() => {
    setSelectedModelId(null);
    setModelSearch("");
    setModelImageConfig(null);

    if (selectedSeriesId) {
      loadModels(selectedSeriesId);
    } else {
      setDbModels([]);
    }
  }, [selectedSeriesId]);

  useEffect(() => {
    const j = props.jump;
    if (!j) return;
    setSection(j.section);
    setSelectedBrandId(j.brandJmId);
  }, [props.jump]);

  useEffect(() => {
    const j = props.jump;
    if (!j) return;
    if (j.section !== "series-vr" && j.section !== "model-images") return;
    if (selectedBrandId !== j.brandJmId) return;
    if (!j.seriesJmId || !j.seriesName) return;
    if (selectedSeriesId === j.seriesJmId && section === j.section) return;
    handleSeriesSelect(j.seriesJmId, j.seriesName);
  }, [props.jump, section, selectedBrandId, selectedSeriesId]);

  useEffect(() => {
    const j = props.jump;
    if (!j) return;
    if (j.section !== "model-images") return;
    if (selectedBrandId !== j.brandJmId) return;
    if (!j.seriesJmId || !j.modelJmId || !j.modelName) return;
    if (selectedSeriesId !== j.seriesJmId) return;
    if (selectedModelId === j.modelJmId) return;
    handleModelSelect(j.modelJmId, j.modelName);
    props.onJumpConsumed?.();
  }, [props.jump, selectedBrandId, selectedModelId, selectedSeriesId]);

  useEffect(() => {
    const j = props.jump;
    if (!j) return;
    if (j.section !== "series-vr") return;
    if (selectedBrandId !== j.brandJmId) return;
    if (!j.seriesJmId) return;
    if (selectedSeriesId !== j.seriesJmId) return;
    props.onJumpConsumed?.();
  }, [props.jump, selectedBrandId, selectedSeriesId]);

  useEffect(() => {
    void refreshInteriorVrVisibility();
  }, []);

  async function refreshInteriorVrVisibility() {
    try {
      const { data, error } = await supabase
        .from('site_config')
        .select('value')
        .eq('key', 'interior_vr_visibility')
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setInteriorVrVisibility({ hidden_positions: ['driver'] });
        return;
      }

      const v = (data?.value || {}) as any;
      const hidden = Array.isArray(v.hidden_positions) ? v.hidden_positions.map((x: any) => String(x)) : [];
      const allowed: InteriorVrPosition[] = ['driver', 'passenger', 'rear', 'third_row', 'trunk'];
      const normalized = hidden.filter((x: string) => allowed.includes(x as InteriorVrPosition)) as InteriorVrPosition[];
      const unique = Array.from(new Set(normalized));
      setInteriorVrVisibility({ hidden_positions: unique.length ? unique : ['driver'] });
    } catch {
    }
  }

  async function saveInteriorVrVisibility(next: InteriorVrVisibilitySettings) {
    setInteriorVrVisBusy(true);
    setInteriorVrVisError(null);
    setInteriorVrVisMessage(null);
    try {
      const { error } = await supabase
        .from('site_config')
        .upsert({
          key: 'interior_vr_visibility',
          value: next,
        }, { onConflict: 'key' });
      if (error) throw error;
      setInteriorVrVisibility(next);
      setInteriorVrVisMessage('已保存内饰VR位置显示设置');
    } catch (e: any) {
      setInteriorVrVisError(e?.message || '保存失败');
    } finally {
      setInteriorVrVisBusy(false);
    }
  }

  function toggleInteriorHiddenPosition(pos: InteriorVrPosition, checked: boolean) {
    const current = interiorVrVisibility.hidden_positions || [];
    const nextHidden = checked ? Array.from(new Set([...current, pos])) : current.filter((p) => p !== pos);
    void saveInteriorVrVisibility({ hidden_positions: nextHidden });
  }

  async function loadBrands() {
    setLoading(true);
    try {
      let q = supabase.from('brands').select('*').eq('depth', 1);
      if (onlyNormalSelection) q = q.eq('activity_status', 0);
      const { data } = await q.order('name');
      setDbBrands(data || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  async function loadSeries(brandJmId: number) {
    setLoading(true);
    try {
      let q = supabase.from('series').select('*').eq('brand_jm_id', brandJmId);
      if (onlyNormalSelection) q = q.eq('activity_status', 0);
      const { data } = await q.order('name');
      setDbSeries(data || []);
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  async function loadModels(seriesJmId: number) {
    setLoading(true);
    try {
      let q = supabase.from('models_jumdata').select('*').eq('series_jm_id', seriesJmId);
      if (onlyNormalSelection) q = q.eq('activity_status', 0);
      const { data } = await q.order('name');
      setDbModels(data || []);

      if (data && data.length > 0) {
        const modelJmIds = data.map(m => m.jm_id);
        const { data: detailsData } = await supabase
          .from('model_details')
          .select('raw')
          .in('model_jm_id', modelJmIds)
          .limit(10);

        if (detailsData && detailsData.length > 0) {
          const allColors: ColorOption[] = [];
          for (const detail of detailsData) {
            let colorSource = '';
            if (detail.raw) {
              colorSource = detail.raw.body?.color || '';
            }
            if (colorSource) {
              const parsed = parseColorString(colorSource);
              allColors.push(...parsed);
            }
          }
          const uniqueColors = allColors.filter((c, i, arr) => 
            arr.findIndex(x => x.code === c.code) === i
          );
          if (uniqueColors.length > 0) {
            setColorOptions(uniqueColors);
          }
        }
      }
    } catch (e) {
    } finally {
      setLoading(false);
    }
  }

  async function loadSeriesVrConfig(seriesJmId: number) {
    setLoading(true);
    setError(null);
    try {
      const { data: seriesData } = await supabase.from('series').select('*').eq('jm_id', seriesJmId).single();
      const { data: brandData } = await supabase.from('brands').select('name').eq('jm_id', seriesData?.brand_jm_id).single();

      const { data: modelsData, error: modelsError } = await supabase
        .from('models_jumdata')
        .select('jm_id, name')
        .eq('series_jm_id', seriesJmId)
        .limit(20);

      if (modelsData && modelsData.length > 0) {
        const modelJmIds = modelsData.map(m => m.jm_id);

        const { data: detailsData, error: detailsError } = await supabase
          .from('model_details')
          .select('model_jm_id, raw')
          .in('model_jm_id', modelJmIds)
          .limit(10);

        if (detailsData && detailsData.length > 0) {
          const allColors: ColorOption[] = [];
          for (const detail of detailsData) {
            let colorSource = '';
            if (detail.raw) {
              colorSource = detail.raw.body?.color || '';
            }
            
            if (colorSource) {
              const parsed = parseColorString(colorSource);
              allColors.push(...parsed);
            }
          }
          const uniqueColors = allColors.filter((c, i, arr) => 
            arr.findIndex(x => x.code === c.code) === i
          );
          if (uniqueColors.length > 0) {
            setColorOptions(uniqueColors);
          }
        }
      }

      const { data: vrData } = await supabase.from('series_vr_config').select('*').eq('series_jm_id', seriesJmId).single();

      if (vrData) {
        setSeriesVrConfig(normalizeSeriesVrConfig({
          ...vrData,
          official_images: (vrData as any).official_images || [],
          exterior_vr: vrData.exterior_vr || [],
          interior_vr: vrData.interior_vr || [],
        } as any) as any);
      } else {
        setSeriesVrConfig({
          id: '',
          series_jm_id: seriesJmId,
          series_id: seriesData?.id || null,
          series_name: seriesData?.name || '',
          brand_jm_id: seriesData?.brand_jm_id || 0,
          brand_name: brandData?.name || '',
          official_images: [],
          exterior_vr: [],
          interior_vr: [],
          created_at: '',
          updated_at: '',
        });
      }
    } catch (e) {
      setError('加载车系VR配置失败');
    } finally {
      setLoading(false);
    }
  }

  async function loadModelImageConfig(modelJmId: number) {
    setLoading(true);
    setError(null);
    try {
      const { data: modelData } = await supabase.from('models_jumdata').select('*').eq('jm_id', modelJmId).single();
      const { data: seriesData } = await supabase.from('series').select('name').eq('jm_id', modelData?.series_jm_id).single();
      const { data: brandData } = await supabase.from('brands').select('name').eq('jm_id', modelData?.brand_jm_id).single();

      const { data: imgData } = await supabase.from('model_image_config').select('*').eq('model_jm_id', modelJmId).single();

      if (imgData) {
        setModelImageConfig({
          ...imgData,
          exterior_images: imgData.exterior_images || [],
          interior_images: imgData.interior_images || [],
          official_images: imgData.official_images || [],
        });
      } else {
        setModelImageConfig({
          id: '',
          model_jm_id: modelJmId,
          model_id: modelData?.id || null,
          model_name: modelData?.name || '',
          series_jm_id: modelData?.series_jm_id || 0,
          series_name: seriesData?.name || '',
          brand_jm_id: modelData?.brand_jm_id || 0,
          brand_name: brandData?.name || '',
          exterior_images: [],
          interior_images: [],
          official_images: [],
          created_at: '',
          updated_at: '',
        });
      }
    } catch (e) {
      setError('加载车型图片配置失败');
    } finally {
      setLoading(false);
    }
  }

  function handleSeriesSelect(seriesJmId: number, seriesName: string) {
    setSelectedSeriesId(seriesJmId);
    setSeriesSearch(seriesName);
    loadSeriesVrConfig(seriesJmId);
  }

  function handleModelSelect(modelJmId: number, modelName: string) {
    setSelectedModelId(modelJmId);
    setModelSearch(modelName);
    loadModelImageConfig(modelJmId);
  }

  function addExteriorColorGroup() {
    if (!seriesVrConfig) return;
    
    const defaultColor = colorOptions.length > 0 
      ? colorOptions[0] 
      : { code: "#FFFFFF", name: "默认白色" };
    
    const newGroup: ColorGroup = {
      id: generateId(),
      color_code: defaultColor.code,
      color_name: defaultColor.name,
      images: [],
    };
    setSeriesVrConfig({
      ...seriesVrConfig,
      exterior_vr: [...seriesVrConfig.exterior_vr, newGroup],
    });
  }

  function updateExteriorColorGroup(groupId: string, colorCode: string, colorName: string) {
    if (!seriesVrConfig) return;
    setSeriesVrConfig({
      ...seriesVrConfig,
      exterior_vr: seriesVrConfig.exterior_vr.map(g =>
        g.id === groupId ? { ...g, color_code: colorCode, color_name: colorName } : g
      ),
    });
  }

  function deleteExteriorColorGroup(groupId: string) {
    if (!seriesVrConfig) return;
    setSeriesVrConfig({
      ...seriesVrConfig,
      exterior_vr: seriesVrConfig.exterior_vr.filter(g => g.id !== groupId),
    });
  }

  function addInteriorColorGroup() {
    if (!seriesVrConfig) return;
    const newColorGroup: InteriorColorGroup = {
      id: generateId(),
      color_name: "默认颜色",
      positions: []
    };
    setSeriesVrConfig({
      ...seriesVrConfig,
      interior_vr: [...seriesVrConfig.interior_vr, newColorGroup],
    });
  }

  function addInteriorPositionGroup(colorGroupId: string) {
    if (!seriesVrConfig) return;
    const newGroup: InteriorPositionGroup = {
      id: generateId(),
      position: "driver",
      position_name: "驾驶位",
      images: [],
    };
    setSeriesVrConfig({
      ...seriesVrConfig,
      interior_vr: seriesVrConfig.interior_vr.map(cg =>
        cg.id === colorGroupId ? { ...cg, positions: [...cg.positions, newGroup] } : cg
      ),
    });
  }

  function updateInteriorPositionGroup(colorGroupId: string, posGroupId: string, position: InteriorPosition) {
    if (!seriesVrConfig) return;
    const posLabel = interiorPositionOptions.find(p => p.value === position)?.label || position;
    setSeriesVrConfig({
      ...seriesVrConfig,
      interior_vr: seriesVrConfig.interior_vr.map(cg =>
        cg.id === colorGroupId ? {
          ...cg,
          positions: cg.positions.map(pg => pg.id === posGroupId ? { ...pg, position, position_name: posLabel } : pg)
        } : cg
      ),
    });
  }

  function updateInteriorColorGroup(colorGroupId: string, colorName: string) {
    if (!seriesVrConfig) return;
    setSeriesVrConfig({
      ...seriesVrConfig,
      interior_vr: seriesVrConfig.interior_vr.map(cg =>
        cg.id === colorGroupId ? { ...cg, color_name: colorName } : cg
      ),
    });
  }

  function deleteInteriorColorGroup(colorGroupId: string) {
    if (!seriesVrConfig) return;
    setSeriesVrConfig({
      ...seriesVrConfig,
      interior_vr: seriesVrConfig.interior_vr.filter(cg => cg.id !== colorGroupId),
    });
  }

  function deleteInteriorPositionGroup(colorGroupId: string, posGroupId: string) {
    if (!seriesVrConfig) return;
    setSeriesVrConfig({
      ...seriesVrConfig,
      interior_vr: seriesVrConfig.interior_vr.map(cg =>
        cg.id === colorGroupId ? {
          ...cg,
          positions: cg.positions.filter(pg => pg.id !== posGroupId)
        } : cg
      ),
    });
  }

  const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

  function formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  }

  async function uploadImagesToBucket(
    files: File[],
    target: "series-vr" | "model-images",
    extraId?: string
  ) {
    setUploading(true);
    setError(null);
    try {
      const oversizedFiles = files.filter(file => file.size > MAX_FILE_SIZE);
      if (oversizedFiles.length > 0) {
        const fileList = oversizedFiles.map(f => `${f.name} (${formatFileSize(f.size)})`).join(', ');
        setError(`文件过大：${fileList}。单文件大小不能超过 ${formatFileSize(MAX_FILE_SIZE)}`);
        return [];
      }
      const concurrency = 3;
      const results = new Array<string>(files.length);

      await asyncPool(concurrency, files, async (file, idx) => {
        let ext = file.name.split('.').pop() || 'jpg';
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        let path = '';
        if (target === "series-vr") {
          path = `vr/series_${selectedSeriesId}/${extraId || 'misc'}/${timestamp}_${random}.${ext}`;
        } else {
          path = `images/models/${selectedModelId}/${extraId || 'misc'}/${timestamp}_${random}.${ext}`;
        }

        const compressed = await compressImage(file, {
          maxSizeMB: 0.6,
          maxWidthOrHeight: 2048,
        });

        const uploadBlob = compressed.blob;

        const { error: uploadError } = await supabase.storage.from('car-images').upload(path, uploadBlob, {
          upsert: true,
          cacheControl: '3600',
          contentType: uploadBlob.type || file.type
        });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('car-images').getPublicUrl(path);
        results[idx] = urlData.publicUrl;
      });

      return results.filter(Boolean);
    } catch (e: any) {
      if (e?.message?.includes('exceeded the maximum allowed size')) {
        setError(`上传失败：文件超过了服务器允许的最大限制 (${formatFileSize(MAX_FILE_SIZE)})。请尝试压缩图片后重试。`);
      } else {
        setError(e?.message || '图片上传失败');
      }
      return [];
    } finally {
      setUploading(false);
    }
  }

  async function handleUploadExteriorVrImages(groupId: string, files: FileList) {
    if (!seriesVrConfig) return;
    const urls = await uploadImagesToBucket(Array.from(files), "series-vr", groupId);
    if (urls.length > 0) {
      setSeriesVrConfig({
        ...seriesVrConfig,
        exterior_vr: seriesVrConfig.exterior_vr.map(g =>
          g.id === groupId ? { ...g, images: [...g.images, ...urls] } : g
        ),
      });
    }
  }

  async function handleUploadInteriorVrImages(colorGroupId: string, posGroupId: string, files: FileList) {
    if (!seriesVrConfig) return;
    const urls = await uploadImagesToBucket(Array.from(files), "series-vr", posGroupId);
    if (urls.length > 0) {
      setSeriesVrConfig({
        ...seriesVrConfig,
        interior_vr: seriesVrConfig.interior_vr.map(cg =>
          cg.id === colorGroupId ? {
            ...cg,
            positions: cg.positions.map(pg =>
              pg.id === posGroupId ? { ...pg, images: [...pg.images, ...urls] } : pg
            )
          } : cg
        ),
      });
    }
  }

  async function handleUploadModelImages(type: "exterior" | "interior" | "official", files: FileList) {
    if (!modelImageConfig) return;
    const urls = await uploadImagesToBucket(Array.from(files), "model-images", type);
    if (urls.length > 0) {
      setModelImageConfig({
        ...modelImageConfig,
        [`${type}_images`]: [...modelImageConfig[`${type}_images` as keyof ModelImageConfig] as string[], ...urls],
      });
    }
  }

  function deleteExteriorVrImage(groupId: string, imageIdx: number) {
    if (!seriesVrConfig) return;
    if (imageIdx === -1) {
      deleteExteriorColorGroup(groupId);
      return;
    }
    setSeriesVrConfig({
      ...seriesVrConfig,
      exterior_vr: seriesVrConfig.exterior_vr.map(g =>
        g.id === groupId ? { ...g, images: g.images.filter((_, i) => i !== imageIdx) } : g
      ),
    });
  }

  function deleteInteriorVrImage(colorGroupId: string, posGroupId: string, imageIdx: number) {
    if (!seriesVrConfig) return;
    if (imageIdx === -1) {
      deleteInteriorPositionGroup(colorGroupId, posGroupId);
      return;
    }
    setSeriesVrConfig({
      ...seriesVrConfig,
      interior_vr: seriesVrConfig.interior_vr.map(cg =>
        cg.id === colorGroupId ? {
          ...cg,
          positions: cg.positions.map(pg =>
            pg.id === posGroupId ? { ...pg, images: pg.images.filter((_, i) => i !== imageIdx) } : pg
          )
        } : cg
      ),
    });
  }

  function deleteModelImage(type: "exterior" | "interior" | "official", imageIdx: number) {
    if (!modelImageConfig) return;
    const key = `${type}_images` as keyof ModelImageConfig;
    const images = modelImageConfig[key] as string[];
    setModelImageConfig({
      ...modelImageConfig,
      [key]: images.filter((_, i) => i !== imageIdx),
    });
  }

  async function saveSeriesVrConfig() {
    if (!seriesVrConfig) return;
    setLoading(true);
    setError(null);
    setDownloadLogs([]); // Clear logs before saving
    addLog(`开始保存并上传图片...`);
    
    try {
      // 1. Process base64 images and upload to Supabase Storage
      const newExteriorVr = JSON.parse(JSON.stringify(seriesVrConfig.exterior_vr));
      const newInteriorVr = JSON.parse(JSON.stringify(seriesVrConfig.interior_vr));
      const newOfficialImages = [...(seriesVrConfig.official_images || [])];
      
      type UploadTask = {
        groupType: 'exterior' | 'interior' | 'series_official';
        groupIndex?: number;
        colorGroupIndex?: number;
        posGroupIndex?: number;
        imageIndex: number;
        base64Url: string;
        path: string;
      };
      
      const tasks: UploadTask[] = [];
      
      newExteriorVr.forEach((group: any, gIdx: number) => {
        const safeColorCode = (group.color_code || 'default').replace(/#/g, '');
        group.images.forEach((img: string, iIdx: number) => {
          if (img.startsWith('data:image')) {
            const ext = extFromDataUrl(img);
            tasks.push({
              groupType: 'exterior',
              groupIndex: gIdx,
              imageIndex: iIdx,
              base64Url: img,
              path: `vr/${seriesVrConfig.brand_jm_id}/${seriesVrConfig.series_jm_id}/exterior/${safeColorCode}/${iIdx}.${ext}`
            });
          }
        });
      });
      
      newInteriorVr.forEach((colorGroup: InteriorColorGroup, cgIdx: number) => {
        // Supabase storage paths shouldn't contain Chinese characters or special symbols as it might cause Invalid Key errors
        const safeColorName = (colorGroup.color_name || 'default')
          .replace(/[/\\?%*:|"<>]/g, '-')
          .replace(/[\u4e00-\u9fa5]/g, (match) => encodeURIComponent(match).replace(/%/g, ''));
          
        colorGroup.positions.forEach((posGroup: InteriorPositionGroup, pgIdx: number) => {
          const safePosition = (posGroup.position || posGroup.id || 'default').replace(/#/g, '');
          posGroup.images.forEach((img: string, iIdx: number) => {
            if (img.startsWith('data:image')) {
              const ext = extFromDataUrl(img);
              tasks.push({
                groupType: 'interior',
                colorGroupIndex: cgIdx,
                posGroupIndex: pgIdx,
                imageIndex: iIdx,
                base64Url: img,
                path: `vr/${seriesVrConfig.brand_jm_id}/${seriesVrConfig.series_jm_id}/interior/color_${safeColorName}/${safePosition}/${iIdx}.${ext}`
              });
            }
          });
        });
      });

      newOfficialImages.forEach((img: string, iIdx: number) => {
        if (typeof img === 'string' && img.startsWith('data:image')) {
          const ext = extFromDataUrl(img);
          const timestamp = Date.now();
          const random = Math.random().toString(36).slice(2, 8);
          tasks.push({
            groupType: 'series_official',
            imageIndex: iIdx,
            base64Url: img,
            path: `official/${seriesVrConfig.brand_jm_id}/${seriesVrConfig.series_jm_id}/${timestamp}_${random}_${iIdx}.${ext}`,
          });
        }
      });

      if (tasks.length > 0) {
        addLog(`共检测到 ${tasks.length} 张新图片需要上传至云存储，顺序上传，间隔400ms...`);
        let completed = 0;

        for (const task of tasks) {
          try {
            let retries = 3;
            let lastError: any = null;
            while (retries > 0) {
              try {
                const res = await fetch(task.base64Url);
                const blob = await res.blob();

                const { error: uploadError } = await supabase.storage
                  .from('vehicle_resources')
                  .upload(task.path, blob, {
                    contentType: blob.type,
                    upsert: true
                  });

                if (uploadError) throw uploadError;

                const { data: publicUrlData } = supabase.storage
                  .from('vehicle_resources')
                  .getPublicUrl(task.path);

                if (task.groupType === 'exterior') {
                  newExteriorVr[task.groupIndex!].images[task.imageIndex] = publicUrlData.publicUrl;
                } else if (task.groupType === 'interior') {
                  newInteriorVr[task.colorGroupIndex!].positions[task.posGroupIndex!].images[task.imageIndex] = publicUrlData.publicUrl;
                } else {
                  newOfficialImages[task.imageIndex] = publicUrlData.publicUrl;
                }
                break;
              } catch (err: any) {
                lastError = err;
                retries--;
                if (retries > 0) {
                  addLog(`[${task.path}] 上传失败，剩余 ${retries} 次重试机会，等待1秒后重试... (${err.message || err})`);
                  await new Promise(resolve => setTimeout(resolve, 1000));
                  continue;
                }
              }
            }
            if (retries === 0) {
              throw new Error(`图片上传失败 [${task.path}]: ${lastError?.message || lastError}`);
            }
          } finally {
            completed++;
            if (completed % 10 === 0 || completed === tasks.length) {
              addLog(`已上传 ${completed} / ${tasks.length} 张...`);
            }
            await new Promise(resolve => setTimeout(resolve, 400));
          }
        }
        addLog(`所有图片上传完成。`);
      }

      // 2. Save the updated config to Database
      const payload = {
        series_jm_id: seriesVrConfig.series_jm_id,
        series_id: seriesVrConfig.series_id,
        series_name: seriesVrConfig.series_name,
        brand_jm_id: seriesVrConfig.brand_jm_id,
        brand_name: seriesVrConfig.brand_name,
        official_images: newOfficialImages,
        exterior_vr: newExteriorVr,
        interior_vr: newInteriorVr,
      };

      if (seriesVrConfig.id) {
        await supabase.from('series_vr_config').update(payload).eq('id', seriesVrConfig.id);
        setSeriesVrConfig({ ...seriesVrConfig, official_images: newOfficialImages, exterior_vr: newExteriorVr, interior_vr: newInteriorVr });
      } else {
        const { data } = await supabase.from('series_vr_config').upsert(payload).select().single();
        if (data) setSeriesVrConfig(data);
      }
      
      addLog(`配置已保存到数据库。`);
      setError("保存成功");
    } catch (e: any) {
      addLog(`保存失败: ${e.message || e}`);
      setError(`保存失败: ${e.message || e}`);
    } finally {
      setLoading(false);
    }
  }

  function deleteSeriesOfficialImage(imageIdx: number) {
    if (!seriesVrConfig) return;
    const images = seriesVrConfig.official_images || [];
    setSeriesVrConfig({
      ...seriesVrConfig,
      official_images: images.filter((_, i) => i !== imageIdx),
    });
  }

  async function handleUploadSeriesOfficialImages(files: FileList) {
    if (!seriesVrConfig) return;
    setUploading(true);
    setError(null);
    try {
      const list = Array.from(files);
      const concurrency = 3;
      const next = await asyncPool(concurrency, list, async (f) => {
        const compressed = await compressImage(f, { maxSizeMB: 0.6, maxWidthOrHeight: 2048, initialQuality: 0.85, step: 0.15 });
        return compressed.dataUrl;
      });
      setSeriesVrConfig({
        ...seriesVrConfig,
        official_images: [...(seriesVrConfig.official_images || []), ...next],
      });
      setError(`已添加 ${next.length} 张官图（请点击“保存配置”上传并落库）`);
    } catch (e: any) {
      setError(e?.message || '上传失败');
    } finally {
      setUploading(false);
    }
  }

  async function handleDownloadSeriesOfficialImages() {
    if (!seriesVrConfig) return;

    setDownloading(true);
    setDownloadProgress(null);
    setError(null);
    setDownloadLogs([]);
    addLog(`开始下载车系官图: ${seriesVrConfig.series_name} (jm_id: ${seriesVrConfig.series_jm_id})`);

    try {
      const result = await downloadOfficialImagesForSeries(
        seriesVrConfig.series_jm_id,
        seriesVrConfig.brand_name,
        seriesVrConfig.series_name,
        { limit: 60, concurrency: 4 },
        (progress) => {
          setDownloadProgress(progress);
          addLog(progress.message);
        }
      );

      if (result.images.length > 0) {
        setSeriesVrConfig({
          ...seriesVrConfig,
          official_images: [...(seriesVrConfig.official_images || []), ...result.images],
        });
        addLog(`官图下载完成：新增 ${result.images.length} 张`);
        setError(`下载成功：新增 ${result.images.length} 张官图（请点击“保存配置”上传并落库）`);
      } else {
        addLog('未找到官图');
        setError('未找到官图，请检查车系名称是否正确');
      }

      if (result.errors.length > 0) {
        addLog(`错误: ${result.errors.slice(0, 3).join(', ')}`);
      }
    } catch (e: any) {
      addLog(`官图下载失败: ${e?.message || e}`);
      setError(`官图下载失败: ${e?.message || e}`);
    } finally {
      setDownloading(false);
    }
  }

  async function uploadSeriesOfficialDataUrl(seriesJmId: number, brandJmId: number, dataUrl: string, index: number): Promise<string> {
    let success = false;
    let retries = 3;
    let lastError: any = null;
    const maxSizeBytes = 0.6 * 1024 * 1024;

    while (!success && retries > 0) {
      try {
        const res = await fetch(dataUrl);
        const blob = await res.blob();

        let uploadBlob = blob;
        let uploadDataUrl = dataUrl;
        if (blob.size > maxSizeBytes) {
          const compressed = await compressImage(blob, { maxSizeMB: 0.6, maxWidthOrHeight: 2048, initialQuality: 0.85, step: 0.15 });
          uploadBlob = compressed.blob;
          uploadDataUrl = compressed.dataUrl;
        }
        const timestamp = Date.now();
        const random = Math.random().toString(36).slice(2, 8);
        const ext = extFromDataUrl(uploadDataUrl);
        const path = `official/${brandJmId}/${seriesJmId}/${timestamp}_${random}_${index}.${ext}`;

        const { error: uploadError } = await supabase.storage
          .from('vehicle_resources')
          .upload(path, uploadBlob, {
            contentType: uploadBlob.type,
            upsert: true,
          });
        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage.from('vehicle_resources').getPublicUrl(path);
        success = true;
        return urlData.publicUrl;
      } catch (err: any) {
        lastError = err;
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    throw new Error(`图片上传失败: ${lastError?.message || lastError}`);
  }

  async function handleBatchDownloadAllSeriesOfficialImages() {
    if (allSeriesOfficialBatching) return;

    allSeriesOfficialCancelRef.current = false;
    setAllSeriesOfficialBatching(true);
    setAllSeriesOfficialBatchLogs([]);
    setAllSeriesOfficialBatchProgress({ current: 0, total: 0, message: '准备开始...' });
    setError(null);

    try {
      if (!selectedBrandId) {
        setError('请先选择品牌（该按钮只批量下载当前品牌下的车系官图）');
        return;
      }

      const bid = Number(selectedBrandId);
      let seriesQuery = supabase.from('series').select('id, jm_id, name, brand_jm_id, activity_status').eq('brand_jm_id', bid);
      if (onlyNormalSelection) seriesQuery = seriesQuery.eq('activity_status', 0);
      const { data: seriesRows, error: seriesErr } = await seriesQuery.order('brand_jm_id', { ascending: true }).order('name', { ascending: true });
      if (seriesErr) throw seriesErr;

      let seriesList = (seriesRows || []).filter((s: any) => Number(s?.jm_id) > 0) as any[];
      if (seriesList.length === 0) {
        setError('没有可处理的车系');
        return;
      }

      const brandJmIds = Array.from(new Set(seriesList.map((s) => Number(s.brand_jm_id || 0)).filter((x) => x > 0)));
      const { data: brandRows, error: brandErr } = await supabase.from('brands').select('jm_id, name').in('jm_id', brandJmIds);
      if (brandErr) throw brandErr;
      const brandNameMap = new Map<number, string>();
      (brandRows || []).forEach((b: any) => {
        brandNameMap.set(Number(b.jm_id), String(b.name || ''));
      });

      const brandName = brandNameMap.get(bid) || '';
      addAllSeriesOfficialLog(`开始批量下载并入库当前品牌车系官图：${brandName}，共 ${seriesList.length} 个车系`);
      setAllSeriesOfficialBatchProgress({ current: 0, total: seriesList.length, message: '开始...' });

      let ok = 0;
      let skipped = 0;
      let failed = 0;
      let imported = 0;

      for (let i = 0; i < seriesList.length; i++) {
        const s = seriesList[i];
        const seriesJmId = Number(s.jm_id);
        const brandJmId = Number(s.brand_jm_id || 0);
        const seriesName = String(s.name || '');
        const brandName = brandNameMap.get(brandJmId) || '';
        const seriesId = s.id ? String(s.id) : null;

        if (allSeriesOfficialCancelRef.current) {
          addAllSeriesOfficialLog('已取消');
          break;
        }

        setAllSeriesOfficialBatchProgress({ current: i + 1, total: seriesList.length, message: `处理车系：${brandName} ${seriesName}` });

        try {
          const { data: existingCfg, error: cfgErr } = await supabase
            .from('series_vr_config')
            .select('id, official_images')
            .eq('series_jm_id', seriesJmId)
            .maybeSingle();
          if (cfgErr) throw cfgErr;

          const existingCount = Array.isArray((existingCfg as any)?.official_images) ? ((existingCfg as any).official_images as any[]).length : 0;
          if (!allSeriesOfficialOverwrite && allSeriesOfficialSkipIfExists && existingCount > 0) {
            skipped++;
            addAllSeriesOfficialLog(`跳过：${brandName} ${seriesName}（已有官图 ${existingCount} 张）`);
            continue;
          }

          const dl = await downloadOfficialImagesForSeries(
            seriesJmId,
            brandName,
            seriesName,
            { limit: Math.max(10, Math.min(120, allSeriesOfficialLimit)), concurrency: 4 },
            (p) => {
              setAllSeriesOfficialBatchProgress({
                current: i + 1,
                total: seriesList.length,
                message: `${seriesName} - ${p.message}`,
              });
            }
          );

          if (dl.images.length === 0) {
            failed++;
            addAllSeriesOfficialLog(`失败：${brandName} ${seriesName}（未抓到官图）`);
            continue;
          }

          const dataUrls = dl.images.filter((x) => typeof x === 'string' && x.startsWith('data:image'));
          const uploaded: string[] = [];
          const uploadConcurrency = 4;

          await asyncPool(uploadConcurrency, dataUrls, async (dataUrl, idx) => {
            const url = await uploadSeriesOfficialDataUrl(seriesJmId, brandJmId, dataUrl, idx);
            uploaded[idx] = url;
          });

          const nextImages = allSeriesOfficialOverwrite ? uploaded.filter(Boolean) : [];
          if (!allSeriesOfficialOverwrite && existingCount > 0 && Array.isArray((existingCfg as any)?.official_images)) {
            nextImages.push(...(((existingCfg as any).official_images || []) as string[]));
          }
          if (!allSeriesOfficialOverwrite) nextImages.push(...uploaded.filter(Boolean));

          const payload: any = {
            series_jm_id: seriesJmId,
            series_id: seriesId,
            series_name: seriesName,
            brand_jm_id: brandJmId,
            brand_name: brandName,
            official_images: nextImages,
          };

          if (existingCfg?.id) {
            const up = await supabase.from('series_vr_config').update(payload).eq('id', (existingCfg as any).id);
            if (up.error) throw up.error;
          } else {
            const ins = await supabase.from('series_vr_config').upsert({ ...payload, exterior_vr: [], interior_vr: [] }, { onConflict: 'series_jm_id' });
            if (ins.error) throw ins.error;
          }

          ok++;
          imported += uploaded.filter(Boolean).length;
          addAllSeriesOfficialLog(`完成：${brandName} ${seriesName}（入库 ${uploaded.filter(Boolean).length} 张）`);
        } catch (e: any) {
          failed++;
          addAllSeriesOfficialLog(`失败：${brandName} ${seriesName} - ${e?.message || e}`);
        }
      }

      const cancelled = allSeriesOfficialCancelRef.current;
      setError(`${cancelled ? '已取消：' : '完成：'}成功 ${ok}，跳过 ${skipped}，失败 ${failed}，入库官图 ${imported} 张`);
      addAllSeriesOfficialLog(`${cancelled ? '批量任务已取消' : '批量任务完成'}：成功 ${ok}，跳过 ${skipped}，失败 ${failed}，入库官图 ${imported} 张`);
    } catch (e: any) {
      setError(`批量下载官图失败: ${e?.message || e}`);
      addAllSeriesOfficialLog(`批量下载官图失败: ${e?.message || e}`);
    } finally {
      setAllSeriesOfficialBatching(false);
      setAllSeriesOfficialBatchProgress(null);
    }
  }

  function cancelBatchDownloadAllSeriesOfficialImages() {
    allSeriesOfficialCancelRef.current = true;
  }


  async function handleDownloadInteriorVR() {
    if (!seriesVrConfig) return;

    setDownloading(true);
    setDownloadProgress(null);
    setError(null);
    setDownloadLogs([]);

    addLog(`开始下载内饰VR: ${seriesVrConfig.series_name} (jm_id: ${seriesVrConfig.series_jm_id})`);

    try {
      const result = await downloadInteriorVRForSeries(
        seriesVrConfig.series_jm_id,
        seriesVrConfig.brand_name,
        seriesVrConfig.series_name,
        (progress) => {
          setDownloadProgress(progress);
          addLog(progress.message);
        }
      );

      addLog(`内饰下载完成: 找到 ${result.colorGroups.length} 种颜色分组`);

      if (result.colorGroups.length > 0) {
        const updatedInteriorVr = [...seriesVrConfig.interior_vr];
        let addedColorCount = 0;
        let addedPositionCount = 0;
        let updatedPositionCount = 0;

        for (const cg of result.colorGroups) {
          let existingColorIndex = updatedInteriorVr.findIndex(g => g.color_name === cg.color_name);
          
          if (existingColorIndex === -1) {
            updatedInteriorVr.push({
              id: generateId(),
              color_name: cg.color_name,
              color_value: cg.color_value,
              positions: []
            });
            existingColorIndex = updatedInteriorVr.length - 1;
            addedColorCount++;
          }

          const targetColorGroup = updatedInteriorVr[existingColorIndex];

          for (const pg of cg.positions) {
            const existingPosIndex = targetColorGroup.positions.findIndex(p => p.position === pg.position);
            if (existingPosIndex !== -1) {
              targetColorGroup.positions[existingPosIndex] = {
                ...targetColorGroup.positions[existingPosIndex],
                images: pg.images,
              };
              updatedPositionCount++;
            } else {
              targetColorGroup.positions.push({
                id: generateId(),
                position: pg.position,
                position_name: pg.position_name,
                images: pg.images,
              });
              addedPositionCount++;
            }
          }
        }

        if (addedColorCount > 0 || addedPositionCount > 0 || updatedPositionCount > 0) {
          setSeriesVrConfig({
            ...seriesVrConfig,
            interior_vr: updatedInteriorVr,
          });
          addLog(`更新成功：新增了 ${addedColorCount} 种颜色分组，新增 ${addedPositionCount} 个位置，更新 ${updatedPositionCount} 个位置`);
        } else {
          addLog(`内饰分组未发生变化`);
        }
      } else {
        addLog(`未找到内饰VR图片`);
      }

      if (result.errors.length > 0) {
        setError(`下载完成但有错误:\n${result.errors.join('\n')}`);
        addLog(`错误: ${result.errors.join(', ')}`);
      }

    } catch (e: any) {
      addLog(`内饰下载失败: ${e.message || e}`);
      setError(`下载失败: ${e.message || e}`);
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadExteriorVR() {
    if (!seriesVrConfig) return;

    setDownloading(true);
    setDownloadProgress(null);
    setDownloadedColorGroups([]);
    setError(null);
    setDownloadLogs([]);

    addLog(`开始下载: ${seriesVrConfig.series_name} (jm_id: ${seriesVrConfig.series_jm_id})`);

    try {
      const result = await downloadExteriorVRForSeries(
        seriesVrConfig.series_jm_id,
        seriesVrConfig.brand_name,
        seriesVrConfig.series_name,
        (progress) => {
          setDownloadProgress(progress);
          addLog(progress.message);
        }
      );

      addLog(`下载完成: 找到 ${result.colorGroups.length} 个颜色分组`);

      if (result.colorGroups.length > 0) {
        setDownloadedColorGroups(result.colorGroups);

        const existingColorCodes = seriesVrConfig.exterior_vr.map(g => g.color_code);

        const newGroups: ColorGroup[] = result.colorGroups
          .filter(cg => !existingColorCodes.includes(cg.color_code))
          .map(cg => ({
            id: generateId(),
            color_code: cg.color_code,
            color_name: cg.color_name,
            images: cg.images,
          }));

        if (newGroups.length > 0) {
          setSeriesVrConfig({
            ...seriesVrConfig,
            exterior_vr: [...seriesVrConfig.exterior_vr, ...newGroups],
          });
          const totalImages = newGroups.reduce((sum, g) => sum + g.images.length, 0);
          addLog(`添加了 ${newGroups.length} 个颜色分组，共 ${totalImages} 张图片`);
          setError(`下载成功！添加了 ${newGroups.length} 个颜色分组，共 ${totalImages} 张图片`);
        } else {
          addLog("所有颜色分组已存在");
          setError("下载完成，但所有颜色分组已存在");
        }
      } else {
        addLog("未找到外观VR图片");
        setError("未找到外观VR图片，请检查车系名称是否正确");
      }

      if (result.errors.length > 0) {
        addLog(`错误: ${result.errors.join(', ')}`);
        setError(`下载完成但有错误:\n${result.errors.join('\n')}`);
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      addLog(`下载失败: ${msg}`);
      setError(`下载失败: ${msg}`);
    } finally {
      setDownloading(false);
    }
  }

  async function handleDownloadModelImages(category: ModelImageCategory) {
    if (!modelImageConfig) return;

    setModelDownloading(true);
    setModelDownloadProgress(null);
    setError(null);
    setModelDownloadLogs([]);

    const label = category === "exterior" ? "外观图" : category === "interior" ? "内饰图" : "官方图";
    addModelLog(`开始下载${label}: ${modelImageConfig.model_name} (jm_id: ${modelImageConfig.model_jm_id})`);

    try {
      const result = await downloadImagesForModelCategory(
        modelImageConfig.series_jm_id,
        modelImageConfig.brand_name,
        modelImageConfig.series_name,
        modelImageConfig.model_name,
        category,
        { limit: 24 },
        (progress) => {
          setModelDownloadProgress(progress);
          addModelLog(progress.message);
        }
      );

      if (result.images.length > 0) {
        if (category === "exterior") {
          setModelImageConfig({
            ...modelImageConfig,
            exterior_images: [...(modelImageConfig.exterior_images || []), ...result.images],
          });
        } else if (category === "interior") {
          setModelImageConfig({
            ...modelImageConfig,
            interior_images: [...(modelImageConfig.interior_images || []), ...result.images],
          });
        } else {
          setModelImageConfig({
            ...modelImageConfig,
            official_images: [...(modelImageConfig.official_images || []), ...result.images],
          });
        }

        addModelLog(`${label}下载完成：新增 ${result.images.length} 张`);
        setError(`下载成功：新增 ${result.images.length} 张${label}（请点击“保存配置”上传并落库）`);
      } else {
        addModelLog(`未找到${label}`);
        setError(`未找到${label}，请检查车型名称/车系名称是否正确`);
      }

      if (result.errors.length > 0) {
        addModelLog(`错误: ${result.errors.join(', ')}`);
      }
    } catch (e: any) {
      addModelLog(`下载失败: ${e?.message || e}`);
      setError(`下载失败: ${e?.message || e}`);
    } finally {
      setModelDownloading(false);
    }
  }

  async function handleBatchDownloadModelImages() {
    if (!selectedSeriesId || dbModels.length === 0) return;

    setModelDownloading(true);
    setModelDownloadProgress(null);
    setError(null);
    setModelDownloadLogs([]);

    const seriesName = dbSeries.find(s => s.jm_id === selectedSeriesId)?.name || '';
    addModelLog(`批量下载：${seriesName} 下 ${dbModels.length} 个车型的外观图和内饰图`);

    try {
      for (let i = 0; i < dbModels.length; i++) {
        const model = dbModels[i];
        const modelName = model.name || '';
        const modelJmId = model.jm_id;
        const seriesJmId = model.series_jm_id;
        const brandJmId = (model as any).brand_jm_id || 0;

        // Resolve brand name
        let brandName = '';
        const { data: brandData } = await supabase.from('brands').select('name').eq('jm_id', brandJmId).single();
        if (brandData) brandName = brandData.name || '';

        for (const category of ["exterior", "interior"] as const) {
          const label = category === "exterior" ? "外观图" : "内饰图";
          addModelLog(`[${i + 1}/${dbModels.length}] ${modelName}: 开始下载${label}`);

          try {
            const result = await downloadImagesForModelCategory(
              seriesJmId,
              brandName,
              seriesName,
              modelName,
              category,
              { limit: 24 },
              (progress) => {
                setModelDownloadProgress({
                  ...progress,
                  message: `[${i + 1}/${dbModels.length}] ${modelName} ${label}: ${progress.message}`,
                });
              }
            );

            if (result.images.length > 0) {
              // Upload images to storage and save to model_image_config
              const uploadedUrls: string[] = [];
              for (let j = 0; j < result.images.length; j++) {
                const dataUrl = result.images[j];
                try {
                  const res = await fetch(dataUrl);
                  const blob = await res.blob();
                  const ext = blob.type === 'image/png' ? 'png' : 'jpg';
                  const path = `images/models/${modelJmId}/${category}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;
                  const { error: upErr } = await supabase.storage.from('car-images').upload(path, blob, {
                    upsert: true,
                    contentType: blob.type,
                  });
                  if (upErr) throw upErr;
                  const { data: urlData } = supabase.storage.from('car-images').getPublicUrl(path);
                  uploadedUrls.push(urlData.publicUrl);
                } catch {
                  // skip failed uploads
                }
              }

              if (uploadedUrls.length > 0) {
                // Upsert into model_image_config
                const { data: existingCfg } = await supabase.from('model_image_config').select('id').eq('model_jm_id', modelJmId).maybeSingle();
                if (existingCfg) {
                  const existingKey = category === "exterior" ? "exterior_images" : "interior_images";
                  const { data: row } = await supabase.from('model_image_config').select(existingKey).eq('model_jm_id', modelJmId).single();
                  const existing = (row as any)?.[existingKey] || [];
                  await supabase.from('model_image_config').update({
                    [existingKey]: [...existing, ...uploadedUrls],
                  }).eq('model_jm_id', modelJmId);
                } else {
                  await supabase.from('model_image_config').insert({
                    model_jm_id: modelJmId,
                    model_id: model.id || null,
                    model_name: modelName,
                    series_jm_id: seriesJmId,
                    series_name: seriesName,
                    brand_jm_id: brandJmId,
                    brand_name: brandName,
                    exterior_images: category === "exterior" ? uploadedUrls : [],
                    interior_images: category === "interior" ? uploadedUrls : [],
                    official_images: [],
                  });
                }
              }

              addModelLog(`[${i + 1}/${dbModels.length}] ${modelName} ${label}: 完成，${uploadedUrls.length}/${result.images.length} 张上传成功`);
            } else {
              addModelLog(`[${i + 1}/${dbModels.length}] ${modelName} ${label}: 未找到图片`);
            }
          } catch (e: any) {
            addModelLog(`[${i + 1}/${dbModels.length}] ${modelName} ${label}: 失败 - ${e?.message || e}`);
          }
        }
      }
      addModelLog('批量下载完成');
      setError('批量下载完成，已自动保存到数据库');
    } catch (e: any) {
      addModelLog(`批量下载失败: ${e?.message || e}`);
      setError(`批量下载失败: ${e?.message || e}`);
    } finally {
      setModelDownloading(false);
    }
  }

  async function saveModelImageConfig() {
    if (!modelImageConfig) return;
    setLoading(true);
    setError(null);
    try {
      const newExteriorImages = [...(modelImageConfig.exterior_images || [])];
      const newInteriorImages = [...(modelImageConfig.interior_images || [])];
      const newOfficialImages = [...(modelImageConfig.official_images || [])];

      type UploadTask = {
        type: "exterior" | "interior" | "official";
        index: number;
        base64Url: string;
      };

      const tasks: UploadTask[] = [];
      newExteriorImages.forEach((img, idx) => {
        if (typeof img === "string" && img.startsWith("data:image")) tasks.push({ type: "exterior", index: idx, base64Url: img });
      });
      newInteriorImages.forEach((img, idx) => {
        if (typeof img === "string" && img.startsWith("data:image")) tasks.push({ type: "interior", index: idx, base64Url: img });
      });
      newOfficialImages.forEach((img, idx) => {
        if (typeof img === "string" && img.startsWith("data:image")) tasks.push({ type: "official", index: idx, base64Url: img });
      });

      if (tasks.length > 0) {
        const concurrency = 3;
        await asyncPool(concurrency, tasks, async (task) => {
          let retries = 3;
          let lastError: any = null;

          while (retries > 0) {
            try {
              const res = await fetch(task.base64Url);
              const blob = await res.blob();

              const timestamp = Date.now();
              const random = Math.random().toString(36).slice(2, 8);
              const ext = extFromDataUrl(task.base64Url);
              const path = `images/models/${modelImageConfig.model_jm_id}/${task.type}/${timestamp}_${random}.${ext}`;

              const { error: uploadError } = await supabase.storage
                .from("car-images")
                .upload(path, blob, {
                  contentType: blob.type,
                  upsert: true,
                });

              if (uploadError) throw uploadError;

              const { data: urlData } = supabase.storage.from("car-images").getPublicUrl(path);
              const publicUrl = urlData.publicUrl;

              if (task.type === "exterior") newExteriorImages[task.index] = publicUrl;
              if (task.type === "interior") newInteriorImages[task.index] = publicUrl;
              if (task.type === "official") newOfficialImages[task.index] = publicUrl;

              return;
            } catch (err: any) {
              lastError = err;
              retries--;
              if (retries > 0) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            }
          }

          throw new Error(`图片上传失败: ${lastError?.message || lastError}`);
        });
      }

      const payload = {
        model_jm_id: modelImageConfig.model_jm_id,
        model_id: modelImageConfig.model_id,
        model_name: modelImageConfig.model_name,
        series_jm_id: modelImageConfig.series_jm_id,
        series_name: modelImageConfig.series_name,
        brand_jm_id: modelImageConfig.brand_jm_id,
        brand_name: modelImageConfig.brand_name,
        exterior_images: newExteriorImages,
        interior_images: newInteriorImages,
        official_images: newOfficialImages,
      };

      if (modelImageConfig.id) {
        await supabase.from('model_image_config').update(payload).eq('id', modelImageConfig.id);
        setModelImageConfig({
          ...modelImageConfig,
          exterior_images: newExteriorImages,
          interior_images: newInteriorImages,
          official_images: newOfficialImages,
        });
      } else {
        const { data } = await supabase.from('model_image_config').upsert(payload).select().single();
        if (data) setModelImageConfig(data);
      }
      setError("保存成功");
    } catch (e) {
      setError('保存失败');
    } finally {
      setLoading(false);
    }
  }

  const filteredBrands = dbBrands.filter(b => b.name.toLowerCase().includes(brandSearch.toLowerCase()));
  const filteredSeries = dbSeries.filter(s => s.name.toLowerCase().includes(seriesSearch.toLowerCase()));
  const filteredModels = dbModels.filter(m => m.name.toLowerCase().includes(modelSearch.toLowerCase()));

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className={pageTitleCls()}>资源配置</h3>
            <p className={pageDescCls()}>
              配置车系VR资源（外观VR颜色分组、内饰VR位置分组）和车型图片资源（外观图、内饰图、官方图）
            </p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-4">
              <label className="shrink-0 inline-flex items-center gap-3 select-none">
                <span className="text-sm text-zinc-600">只加载正常</span>
                <button
                  type="button"
                  onClick={() => setOnlyNormalSelection((v) => !v)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    onlyNormalSelection ? "bg-blue-600" : "bg-zinc-300"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                      onlyNormalSelection ? "translate-x-5" : "translate-x-1"
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => setSection("overview")}
            className={subTabCls(section === "overview")}
          >
            总览表
          </button>
          <button
            type="button"
            onClick={() => setSection("series-vr")}
            className={subTabCls(section === "series-vr")}
          >
            配置车系
          </button>
          <button
            type="button"
            onClick={() => setSection("model-images")}
            className={subTabCls(section === "model-images")}
          >
            配置车型
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {section !== "overview" && (
          <div className="lg:col-span-1">
            <div className="border border-zinc-200 rounded-xl p-4 bg-zinc-50">
              <h4 className="text-sm font-semibold text-zinc-700 mb-3">选择目标</h4>
              
              <div className="space-y-4">
                <div>
                  <label className={labelCls()}>品牌</label>
                <input
                  type="text"
                  value={brandSearch}
                  onChange={(e) => setBrandSearch(e.target.value)}
                  placeholder="搜索品牌"
                  className={inputCls()}
                />
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {filteredBrands.map(brand => (
                    <button
                      key={brand.jm_id}
                      type="button"
                      onClick={() => {
                        setSelectedBrandId(brand.jm_id);
                        setBrandSearch(brand.name);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedBrandId === brand.jm_id
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      {brand.name}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className={labelCls()}>车系</label>
                <input
                  type="text"
                  value={seriesSearch}
                  onChange={(e) => setSeriesSearch(e.target.value)}
                  placeholder="搜索车系"
                  disabled={!selectedBrandId}
                  className={inputCls() + " disabled:bg-zinc-100"}
                />
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                  {filteredSeries.map(series => (
                    <button
                      key={series.jm_id}
                      type="button"
                      onClick={() => handleSeriesSelect(series.jm_id, series.name)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                        selectedSeriesId === series.jm_id
                          ? 'bg-blue-50 text-blue-600 border border-blue-200'
                          : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                      }`}
                    >
                      {series.name}
                    </button>
                  ))}
                </div>
              </div>

              {section === "model-images" && (
                <div>
                  <label className={labelCls()}>车型</label>
                  <input
                    type="text"
                    value={modelSearch}
                    onChange={(e) => setModelSearch(e.target.value)}
                    placeholder="搜索车型"
                    disabled={!selectedSeriesId}
                    className={inputCls() + " disabled:bg-zinc-100"}
                  />
                  <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                    {filteredModels.map(model => (
                      <button
                        key={model.jm_id}
                        type="button"
                        onClick={() => handleModelSelect(model.jm_id, model.name)}
                        className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                          selectedModelId === model.jm_id
                            ? 'bg-blue-50 text-blue-600 border border-blue-200'
                            : 'bg-white text-zinc-700 hover:bg-zinc-100 border border-zinc-200'
                        }`}
                      >
                        {model.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          </div>
        )}

        <div className={`lg:col-span-${section === "overview" ? "4" : "3"}`}>
          {error && (
            <div className={`mb-4 p-4 rounded-lg ${error.includes('成功') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
              {error}
            </div>
          )}

          {uploading && (
            <div className="mb-4 p-4 rounded-lg bg-blue-50 text-blue-700">
              上传中，请稍候...
            </div>
          )}

          {section === "series-vr" && (
            selectedSeriesId ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h4 className="text-lg font-semibold text-zinc-800">
                      车系VR配置：{seriesVrConfig?.series_name || ''}
                    </h4>
                    {seriesVrConfig && (
                      <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          (seriesVrConfig.exterior_vr?.length || 0) > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {(seriesVrConfig.exterior_vr?.length || 0) > 0 ? '✓' : '○'}
                          外观VR: {seriesVrConfig.exterior_vr?.length || 0} 组
                        </span>
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                          (seriesVrConfig.interior_vr?.length || 0) > 0
                            ? 'bg-green-100 text-green-700'
                            : 'bg-amber-100 text-amber-700'
                        }`}>
                          {(seriesVrConfig.interior_vr?.length || 0) > 0 ? '✓' : '○'}
                          内饰VR: {seriesVrConfig.interior_vr?.length || 0} 组
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {selectedBrandId ? (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            if (brandVrBatchRunning) {
                              cancelBrandVrBatch();
                              return;
                            }
                            if (!selectedBrandId) return;
                            const brand = dbBrands.find((b) => b.jm_id === selectedBrandId) || null;
                            const brandName = brand?.name || '品牌';
                            const seriesPool = dbSeries
                              .filter((s) => s.brand_jm_id === selectedBrandId)
                              .map((s) => ({ id: s.id ?? null, jm_id: s.jm_id, name: s.name, activity_status: s.activity_status }));

                            void startBrandVrBatchDownload({
                              brandJmId: selectedBrandId,
                              brandName,
                              seriesPool,
                              onlyNormal: onlyNormalSelection,
                            }).catch((e: any) => {
                              setError(e?.message || String(e) || '批量下载失败');
                            });
                          }}
                          disabled={downloading || loading || brandVrBatchSaving}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                            brandVrBatchRunning
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200'
                              : 'bg-zinc-50 text-zinc-700 hover:bg-zinc-100 border-zinc-200'
                          }`}
                        >
                          {brandVrBatchRunning ? '取消批量下载' : '批量下载品牌VR'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            void saveBrandVrBatch().then(() => {
                              setError('批量保存成功');
                            }).catch((e: any) => {
                              setError(e?.message || String(e) || '批量保存失败');
                            });
                          }}
                          disabled={downloading || loading || brandVrBatchRunning || brandVrBatchSaving || brandVrBatchDrafts.length === 0}
                          className={`px-4 py-2 rounded-lg font-medium transition-colors border ${
                            brandVrBatchSaving
                              ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed border-zinc-300'
                              : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200'
                          }`}
                        >
                          {brandVrBatchSaving ? '批量保存中...' : `批量保存配置(${brandVrBatchDrafts.length})`}
                        </button>
                      </>
                    ) : null}
                    <button
                      type="button"
                      onClick={handleDownloadExteriorVR}
                      disabled={downloading || !selectedSeriesId}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        downloading
                          ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                          : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                      }`}
                    >
                      {downloading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          下载中...
                        </span>
                      ) : (
                        "外观VR下载"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadInteriorVR}
                      disabled={downloading || !selectedSeriesId}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        downloading
                          ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      {downloading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          下载中...
                        </span>
                      ) : (
                        "内饰VR下载"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadSeriesOfficialImages}
                      disabled={downloading || !selectedSeriesId}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        downloading
                          ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                          : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      {downloading ? (
                        <span className="flex items-center gap-2">
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                          </svg>
                          下载中...
                        </span>
                      ) : (
                        "官图下载"
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={saveSeriesVrConfig}
                      disabled={loading}
                      className={primaryButtonCls()}
                    >
                      {loading ? '保存中...' : '保存配置'}
                    </button>
                  </div>
                </div>

                {seriesVrConfig ? (
                  <div className="p-4 rounded-lg border border-zinc-200 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <div className="text-sm font-semibold text-zinc-800">车系官图</div>
                        <div className="text-xs text-zinc-500 mt-1">按车系统一维护官方图片（支持从汽车之家一键抓取后保存入库）</div>
                      </div>
                      <label className="relative inline-flex items-center justify-center cursor-pointer">
                        <span className={`text-sm px-3 py-1.5 rounded-lg border ${
                          uploading
                            ? 'bg-zinc-200 text-zinc-500 border-zinc-200 cursor-not-allowed'
                            : 'bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100'
                        }`}>
                          {uploading ? '上传中...' : '上传官图'}
                        </span>
                        <input
                          type="file"
                          multiple
                          accept="image/*"
                          disabled={uploading}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const fs = e.target.files;
                            e.currentTarget.value = '';
                            if (fs && fs.length > 0) void handleUploadSeriesOfficialImages(fs);
                          }}
                        />
                      </label>
                    </div>

                    <ImageGallery
                      images={seriesVrConfig.official_images || []}
                      onDelete={(idx) => deleteSeriesOfficialImage(idx)}
                      title="官图"
                    />
                    <div className="mt-2 text-xs text-zinc-400 text-center">
                      {(seriesVrConfig.official_images || []).length} 张图片
                    </div>
                  </div>
                ) : null}

                {selectedBrandId ? (
                  <div className="p-4 rounded-lg border border-zinc-200 bg-white">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center justify-between gap-3">
                        <div className="text-sm font-semibold text-zinc-800">批量任务（当前品牌）</div>
                        <div className="text-xs text-zinc-600">
                          草稿：{brandVrBatchDrafts.length} 个车系
                        </div>
                      </div>
                      {brandVrBatchProgress ? (
                        <div className="text-sm text-zinc-700">{brandVrBatchProgress.message}</div>
                      ) : (
                        <div className="text-sm text-zinc-500">支持批量下载该品牌下全部车系的外观VR/内饰VR，下载阶段只生成草稿，点击“批量保存配置”才会上传并写入数据库。</div>
                      )}
                      {brandVrBatchLogs.length > 0 ? (
                        <div className="mt-2 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700 space-y-1">
                          {brandVrBatchLogs.slice(-120).map((l, idx) => (
                            <div key={idx} className="break-all">{l}</div>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>
                ) : null}

                <div className="p-4 rounded-lg border border-zinc-200 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-800">批量下载当前品牌车系官图</div>
                      <div className="text-xs text-zinc-500 mt-1">仅对当前选中品牌下的车系执行：抓取汽车之家官图并上传入库到 `series_vr_config.official_images`</div>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={handleBatchDownloadAllSeriesOfficialImages}
                        disabled={allSeriesOfficialBatching || loading || downloading || !selectedBrandId}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          allSeriesOfficialBatching
                            ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                            : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200'
                        }`}
                      >
                        {allSeriesOfficialBatching ? '批量入库中...' : '开始批量下载官图'}
                      </button>
                      {allSeriesOfficialBatching ? (
                        <button
                          type="button"
                          onClick={() => {
                            cancelBatchDownloadAllSeriesOfficialImages();
                            addAllSeriesOfficialLog('请求取消（将在当前车系处理完成后停止）');
                          }}
                          className={secondaryButtonCls()}
                        >
                          取消
                        </button>
                      ) : null}
                    </div>
                  </div>

                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-zinc-700">
                    <label className="flex items-center gap-2">
                      <span className="text-xs text-zinc-600">每车系张数</span>
                      <input
                        type="number"
                        min={10}
                        max={120}
                        value={allSeriesOfficialLimit}
                        disabled={allSeriesOfficialBatching}
                        onChange={(e) => setAllSeriesOfficialLimit(Number(e.target.value) || 60)}
                        className="w-20 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                      />
                    </label>

                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allSeriesOfficialSkipIfExists}
                        disabled={allSeriesOfficialOverwrite || allSeriesOfficialBatching}
                        onChange={(e) => setAllSeriesOfficialSkipIfExists(e.target.checked)}
                      />
                      已有官图则跳过
                    </label>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allSeriesOfficialOverwrite}
                        disabled={allSeriesOfficialBatching}
                        onChange={(e) => {
                          const next = e.target.checked;
                          setAllSeriesOfficialOverwrite(next);
                          if (next) setAllSeriesOfficialSkipIfExists(false);
                        }}
                      />
                      覆盖已有官图
                    </label>
                  </div>

                  {allSeriesOfficialBatching && allSeriesOfficialBatchProgress ? (
                    <div className="mt-3">
                      <div className="flex items-center justify-between text-xs text-zinc-600">
                        <span>
                          进度：{allSeriesOfficialBatchProgress.current}/{allSeriesOfficialBatchProgress.total}
                        </span>
                        <span className="text-zinc-500">{allSeriesOfficialBatchProgress.message}</span>
                      </div>
                      <div className="mt-2 w-full bg-zinc-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                          style={{
                            width: `${
                              allSeriesOfficialBatchProgress.total > 0
                                ? Math.round((allSeriesOfficialBatchProgress.current / allSeriesOfficialBatchProgress.total) * 100)
                                : 0
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  ) : null}

                  {allSeriesOfficialBatchLogs.length > 0 ? (
                    <div className="mt-3 p-3 bg-zinc-900 rounded-lg border border-zinc-700">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-zinc-300">📋 批量日志</span>
                        <button
                          type="button"
                          onClick={() => navigator.clipboard.writeText(allSeriesOfficialBatchLogs.join('\n'))}
                          className="text-xs text-zinc-400 hover:text-zinc-200"
                        >
                          复制日志
                        </button>
                      </div>
                      <div className="max-h-48 overflow-y-auto">
                        {allSeriesOfficialBatchLogs.slice(-160).map((log, idx) => (
                          <div key={idx} className="text-xs text-zinc-400 font-mono leading-relaxed">
                            {log}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>

                <div className="p-4 rounded-lg border border-zinc-200 bg-white">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-800">内饰VR位置显示（全站）</div>
                      <div className="text-xs text-zinc-500 mt-1">
                        用于统一控制前台「内饰VR」哪些视角显示/隐藏。
                      </div>
                    </div>
                    <button
                      type="button"
                      className={secondaryButtonCls()}
                      disabled={interiorVrVisBusy}
                      onClick={() => void refreshInteriorVrVisibility()}
                    >
                      刷新
                    </button>
                  </div>

                  {interiorVrVisError ? (
                    <div className="mt-3 p-2 rounded bg-red-50 text-red-700 text-sm">{interiorVrVisError}</div>
                  ) : null}
                  {interiorVrVisMessage ? (
                    <div className="mt-3 p-2 rounded bg-green-50 text-green-700 text-sm">{interiorVrVisMessage}</div>
                  ) : null}

                  <div className="mt-4 flex flex-wrap gap-4 text-sm text-zinc-700">
                    {([
                      { key: 'driver', label: '驾驶位' },
                      { key: 'passenger', label: '副驾驶位' },
                      { key: 'rear', label: '第二排座位' },
                      { key: 'third_row', label: '第三排座位' },
                      { key: 'trunk', label: '后备箱' },
                    ] as Array<{ key: InteriorVrPosition; label: string }>).map((x) => {
                      const checked = !(interiorVrVisibility.hidden_positions || []).includes(x.key);
                      return (
                        <label key={x.key} className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={checked}
                            disabled={interiorVrVisBusy}
                            onChange={(e) => toggleInteriorHiddenPosition(x.key, !e.target.checked)}
                          />
                          显示{x.label}
                        </label>
                      );
                    })}
                  </div>
                </div>

                {downloading && downloadProgress && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">
                        {downloadProgress.stage === "searching" && "🔍 搜索车系中"}
                        {downloadProgress.stage === "collecting" && "📡 收集图片中"}
                        {downloadProgress.stage === "downloading" && "⬇️ 下载图片中"}
                        {downloadProgress.stage === "compressing" && "🗜️ 压缩图片中"}
                        {downloadProgress.stage === "done" && "✅ 下载完成"}
                        {downloadProgress.stage === "error" && "❌ 下载失败"}
                      </span>
                      <span className="text-sm text-green-600">{downloadProgress.current}%</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${downloadProgress.current}%` }}
                      />
                    </div>
                    <p className="text-xs text-green-700 mt-2">{downloadProgress.message}</p>
                    {downloadProgress.colorGroup && (
                      <p className="text-xs text-green-600 mt-1">
                        当前分组: {downloadProgress.colorGroup.color_name} ({downloadProgress.colorGroup.images.length} 张)
                      </p>
                    )}
                  </div>
                )}

                {downloadLogs.length > 0 && (
                  <div className="mb-4 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-300">📋 下载日志</span>
                      <button
                        type="button"
                        onClick={() => {
                          const logText = downloadLogs.join('\n');
                          navigator.clipboard.writeText(logText);
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        复制日志
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {downloadLogs.map((log, idx) => (
                        <div key={idx} className="text-xs text-zinc-400 font-mono leading-relaxed">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="border border-zinc-200 rounded-xl p-5 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-zinc-800 flex items-center gap-2">
                        <span className="text-xl">🚗</span> 外观VR
                      </h5>
                      <button
                        type="button"
                        onClick={addExteriorColorGroup}
                        className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                        title="添加颜色分组"
                      >
                        + 添加颜色分组
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">每个分组对应一种车身颜色，需记录色号</p>
                    <div className="space-y-3">
                      {seriesVrConfig?.exterior_vr.length === 0 ? (
                        <div className="text-center py-8 text-zinc-400 text-sm">
                          暂无颜色分组，点击上方按钮添加
                        </div>
                      ) : (
                        seriesVrConfig?.exterior_vr.map(group => (
                          <div key={group.id}>
                            <ColorGroupCard
                              group={group}
                              onUpdateColor={(code, name) => updateExteriorColorGroup(group.id, code, name)}
                              onDeleteImage={(idx) => deleteExteriorVrImage(group.id, idx)}
                              colorOptions={colorOptions}
                            />
                            <div className="mt-2">
                              <label className="relative inline-flex items-center justify-center cursor-pointer">
                                <span className="text-xs bg-zinc-100 text-zinc-600 px-3 py-1.5 rounded-lg hover:bg-zinc-200">
                                  + 上传图片
                                </span>
                                <input
                                  type="file"
                                  multiple
                                  accept="image/*"
                                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                  onChange={(e) => {
                                    if (e.target.files && e.target.files.length > 0) {
                                      handleUploadExteriorVrImages(group.id, e.target.files);
                                    }
                                  }}
                                />
                              </label>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="border border-zinc-200 rounded-xl p-5 bg-white">
                    <div className="flex items-center justify-between mb-4">
                      <h5 className="font-semibold text-zinc-800 flex items-center gap-2">
                        <span className="text-xl">🪑</span> 内饰VR
                      </h5>
                      <button
                        type="button"
                        onClick={addInteriorColorGroup}
                        className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100"
                      >
                        + 添加颜色大组
                      </button>
                    </div>
                    <p className="text-xs text-zinc-500 mb-4">先按颜色分大组，每个大组内按位置分小组（如：驾驶位、后排）</p>
                    <div className="space-y-6">
                      {seriesVrConfig?.interior_vr.length === 0 ? (
                        <div className="text-center py-8 text-zinc-400 text-sm border border-dashed border-zinc-200 rounded-lg">
                          暂无内饰数据，点击上方按钮添加
                        </div>
                      ) : (
                        seriesVrConfig?.interior_vr.map((colorGroup) => (
                          <div key={colorGroup.id} className="border border-zinc-300 rounded-xl bg-zinc-50 overflow-hidden">
                            {/* 颜色大组头部 */}
                            <div className="bg-zinc-100 border-b border-zinc-300 px-4 py-3 flex items-center justify-between">
                              <div className="flex items-center gap-3">
                                <span className="font-semibold text-zinc-800">颜色大组:</span>
                                <input 
                                  type="text"
                                  value={colorGroup.color_name}
                                  onChange={(e) => updateInteriorColorGroup(colorGroup.id, e.target.value)}
                                  className="text-sm border border-zinc-300 rounded px-2 py-1 w-48"
                                  placeholder="例如：黑色|雀羽红"
                                />
                              </div>
                              <div className="flex gap-3">
                                <button
                                  type="button"
                                  onClick={() => addInteriorPositionGroup(colorGroup.id)}
                                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200"
                                >
                                  + 添加位置
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteInteriorColorGroup(colorGroup.id)}
                                  className="text-xs text-red-500 hover:text-red-700"
                                >
                                  删除此颜色
                                </button>
                              </div>
                            </div>
                            
                            {/* 位置小组列表 */}
                            <div className="p-4 space-y-4">
                              {colorGroup.positions.length === 0 ? (
                                <div className="text-center py-4 text-zinc-400 text-xs">
                                  该颜色下暂无位置数据，点击上方添加
                                </div>
                              ) : (
                                colorGroup.positions.map((posGroup) => (
                                  <div key={posGroup.id}>
                                    <PositionGroupCard
                                      group={posGroup}
                                      onChangePosition={(pos) => updateInteriorPositionGroup(colorGroup.id, posGroup.id, pos)}
                                      onDeleteImage={(idx) => deleteInteriorVrImage(colorGroup.id, posGroup.id, idx)}
                                    />
                                    <div className="mt-2">
                                      <label className="relative inline-flex items-center justify-center cursor-pointer">
                                        <span className="text-xs bg-white border border-zinc-200 text-zinc-600 px-3 py-1.5 rounded-lg hover:bg-zinc-50 shadow-sm">
                                          + 上传图片至【{posGroup.position_name}】
                                        </span>
                                        <input
                                          type="file"
                                          multiple
                                          accept="image/*"
                                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                          onChange={(e) => {
                                            if (e.target.files && e.target.files.length > 0) {
                                              handleUploadInteriorVrImages(colorGroup.id, posGroup.id, e.target.files);
                                            }
                                          }}
                                        />
                                      </label>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border border-zinc-200 rounded-xl p-12 text-center bg-zinc-50">
                <div className="text-zinc-400">请先在左侧选择车系</div>
              </div>
            )
          )}

          {section === "model-images" && (
            selectedModelId ? (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-lg font-semibold text-zinc-800">
                    车型图片配置：{modelImageConfig?.model_name || ''}
                  </h4>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleDownloadModelImages("exterior")}
                      disabled={modelDownloading || loading}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        modelDownloading
                          ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                          : 'bg-green-50 text-green-600 hover:bg-green-100 border border-green-200'
                      }`}
                    >
                      {modelDownloading ? '下载中...' : '外观图下载'}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDownloadModelImages("interior")}
                      disabled={modelDownloading || loading}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        modelDownloading
                          ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                          : 'bg-blue-50 text-blue-600 hover:bg-blue-100 border border-blue-200'
                      }`}
                    >
                      {modelDownloading ? '下载中...' : '内饰图下载'}
                    </button>
                    <button
                      type="button"
                      onClick={handleBatchDownloadModelImages}
                      disabled={modelDownloading || loading}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        modelDownloading
                          ? 'bg-zinc-300 text-zinc-500 cursor-not-allowed'
                          : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'
                      }`}
                    >
                      {modelDownloading ? '下载中...' : '批量下载本车系'}
                    </button>
                    <button
                      type="button"
                      onClick={saveModelImageConfig}
                      disabled={loading || modelDownloading}
                      className={primaryButtonCls()}
                    >
                      {loading ? '保存中...' : '保存配置'}
                    </button>
                  </div>
                </div>

                {modelDownloading && modelDownloadProgress && (
                  <div className="mb-4 p-4 bg-green-50 rounded-lg border border-green-200">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-800">
                        {modelDownloadProgress.stage === "searching" && "🔍 搜索中"}
                        {modelDownloadProgress.stage === "collecting" && "📡 收集中"}
                        {modelDownloadProgress.stage === "downloading" && "⬇️ 下载中"}
                        {modelDownloadProgress.stage === "compressing" && "🗜️ 压缩中"}
                        {modelDownloadProgress.stage === "done" && "✅ 完成"}
                        {modelDownloadProgress.stage === "error" && "❌ 失败"}
                      </span>
                      <span className="text-sm text-green-600">{modelDownloadProgress.current}%</span>
                    </div>
                    <div className="w-full bg-green-200 rounded-full h-2">
                      <div
                        className="bg-green-600 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${modelDownloadProgress.current}%` }}
                      />
                    </div>
                    <p className="text-xs text-green-700 mt-2">{modelDownloadProgress.message}</p>
                  </div>
                )}

                {modelDownloadLogs.length > 0 && (
                  <div className="mb-4 p-4 bg-zinc-900 rounded-lg border border-zinc-700">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-zinc-300">📋 下载日志</span>
                      <button
                        type="button"
                        onClick={() => {
                          const logText = modelDownloadLogs.join('\n');
                          navigator.clipboard.writeText(logText);
                        }}
                        className="text-xs text-zinc-400 hover:text-zinc-200"
                      >
                        复制日志
                      </button>
                    </div>
                    <div className="max-h-60 overflow-y-auto">
                      {modelDownloadLogs.map((log, idx) => (
                        <div key={idx} className="text-xs text-zinc-400 font-mono leading-relaxed">
                          {log}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {(["exterior", "interior"] as const).map(type => {
                    const labels = {
                      exterior: { title: "外观图", icon: "🚗" },
                      interior: { title: "内饰图", icon: "🪑" },
                    };
                    const images = modelImageConfig?.[`${type}_images` as keyof ModelImageConfig] as string[] || [];

                    return (
                      <div key={type} className="border border-zinc-200 rounded-xl p-5 bg-white">
                        <div className="flex items-center justify-between mb-4">
                          <h5 className="font-semibold text-zinc-800 flex items-center gap-2">
                            <span className="text-xl">{labels[type].icon}</span> {labels[type].title}
                          </h5>
                          <label className="relative inline-flex items-center justify-center cursor-pointer">
                            <span className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg hover:bg-blue-100">
                              上传图片
                            </span>
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                              onChange={(e) => {
                                if (e.target.files && e.target.files.length > 0) {
                                  handleUploadModelImages(type, e.target.files);
                                }
                              }}
                            />
                          </label>
                        </div>
                        <ImageGallery
                          images={images}
                          onDelete={(idx) => deleteModelImage(type, idx)}
                          title={labels[type].title}
                        />
                        <div className="mt-2 text-xs text-zinc-400 text-center">
                          {images.length} 张图片
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : section === "model-images" ? (
              <div className="border border-zinc-200 rounded-xl p-12 text-center bg-zinc-50">
                <div className="text-zinc-400">请先在左侧选择车型</div>
              </div>
            ) : (
              <div className="border border-zinc-200 rounded-xl p-12 text-center bg-zinc-50">
                <div className="text-zinc-400">请先在左侧选择车型</div>
              </div>
            )
          )}

          {section === "overview" && (
            <ResourceOverviewTable />
          )}
        </div>
      </div>
    </div>
  );
}
