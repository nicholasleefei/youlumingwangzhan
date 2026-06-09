import { useEffect, useRef, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import BatchOperations from '@/components/admin/BatchOperations';
import { activityStatusMap, getFieldLabel, tableFieldConfigs } from '@/utils/fieldLabels';
import StagedCrudToolbar from "@/components/admin/StagedCrudToolbar";
import BulkEditBar from "@/components/admin/BulkEditBar";
import type { StagedItem } from "@/utils/stagedCrud";
import { confirmJumdataQueryIfExists } from "@/utils/jumdataQueryGuard";
import BatchImportPlanModal, { type BatchImportPlanItem } from "@/components/admin/BatchImportPlanModal";
import { proxiedImageUrl } from "@/utils/proxyUrl";
import { useEntityTranslation, TARGET_LOCALES } from "@/utils/useEntityTranslation";
import { LOCALE_LABELS } from "@/i18n/locales";

type DbBrand = {
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

type DbSeries = {
  id: string;
  jm_id: number;
  brand_jm_id: number;
  brand_id: string | null;
  name: string;
  fullname: string | null;
  initial: string | null;
  logo_url: string | null;
  salestate: string | null;
  depth: number;
  subcompany_name: string | null;
  subcompany_jm_id: number | null;
  created_at: string;
  updated_at: string;
};

type JmModelSeriesData = {
  depth: number;
  initial: string;
  name: string;
  logo: string;
  id: number;
  fullname: string;
  salestate: string;
  list: JmModel[];
};

type JmModel = {
  name: string;
  id: number;
  groupid: string;
  groupname: string;
  sizetype: string;
  displacement2: string;
  displacement: string;
  geartype: string;
  geartype2: number;
  logo: string;
  yeartype: string;
  listdate: string;
  price: string;
  productionstate: string;
  salestate: string;
};

type DbModel = {
  id: string;
  jm_id: number;
  series_jm_id: number;
  series_id: string | null;
  series_name: string | null;
  brand_jm_id: number;
  brand_id: string | null;
  brand_name: string | null;
  name: string;
  groupid: string | null;
  groupname: string | null;
  sizetype: string | null;
  displacement2: string | null;
  displacement: string | null;
  geartype: string | null;
  geartype2: number | null;
  logo_url: string | null;
  yeartype: string | null;
  listdate: string | null;
  price: string | null;
  productionstate: string | null;
  salestate: string | null;
  depth: number;
  activity_status?: number;
  created_at: string;
  updated_at: string;
};

type ModelChangeLog = {
  action: 'insert' | 'update' | 'skip';
  jm_id: number;
  name: string;
  changes?: {
    field: string;
    old: string | null;
    new: string | null;
  }[];
};

export default function AdminModelsJumdata() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jmAppId = localStorage.getItem('jumdata_app_id') || "";
  const jmAppSecret = localStorage.getItem('jumdata_app_secret') || "";
  const [queryResult, setQueryResult] = useState<JmModelSeriesData | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [onlyNormalSeries, setOnlyNormalSeries] = useState<boolean>(() => {
    const v = localStorage.getItem('admin_models_only_normal_series');
    if (v === null) return true;
    return v === '1';
  });
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchCurrent, setBatchCurrent] = useState(0);
  const [batchCurrentName, setBatchCurrentName] = useState<string | null>(null);
  const [batchInserted, setBatchInserted] = useState(0);
  const [batchUpdated, setBatchUpdated] = useState(0);
  const [batchSkipped, setBatchSkipped] = useState(0);
  const [batchFailed, setBatchFailed] = useState(0);
  const [batchLastError, setBatchLastError] = useState<string | null>(null);
  const batchCancelRef = useRef(false);
  const [batchPlanOpen, setBatchPlanOpen] = useState(false);
  const [batchPlanLoading, setBatchPlanLoading] = useState(false);
  const [batchPlanItems, setBatchPlanItems] = useState<BatchImportPlanItem[]>([]);
  const [dbBrands, setDbBrands] = useState<DbBrand[]>([]);
  const [dbBrandsLoading, setDbBrandsLoading] = useState(false);
  const [dbSeries, setDbSeries] = useState<DbSeries[]>([]);
  const [dbSeriesLoading, setDbSeriesLoading] = useState(false);
  const [dbModels, setDbModels] = useState<DbModel[]>([]);
  const [viewModels, setViewModels] = useState<DbModel[]>([]);
  const [dbModelsLoading, setDbModelsLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedBrandDb, setSelectedBrandDb] = useState<DbBrand | null>(null);
  const [selectedSeriesDb, setSelectedSeriesDb] = useState<DbSeries | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");
  const [seriesSearchQuery, setSeriesSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'import' | 'db-view' | 'log-view'>('import');
  const [changeLogs, setChangeLogs] = useState<ModelChangeLog[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [commitBusy, setCommitBusy] = useState(false);

  // Entity translation
  const { translating: transModels, progress: transProgress, error: transError, setError: setTransError, translateEntities } = useEntityTranslation("model");
  const [transTargetLocales, setTransTargetLocales] = useState<string[]>([...TARGET_LOCALES]);
  const [showTransLocales, setShowTransLocales] = useState(false);

  function toggleTransLocale(loc: string) {
    setTransTargetLocales((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  }

  useEffect(() => {
    localStorage.setItem('admin_models_only_normal_series', onlyNormalSeries ? '1' : '0');
  }, [onlyNormalSeries]);

  // 计算是否全选
  const isAllSelected = viewModels.length > 0 && selectedIds.length === viewModels.length;

  useEffect(() => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(viewModels.map(m => m.id));
    setSelectedIds(prev => prev.filter(id => idSet.has(id)));
  }, [viewModels]);

  function isRowDeleted(id: string) {
    return stagedItems.some(it => it.tableName === 'models_jumdata' && it.op === 'delete' && it.id === id);
  }

  function applyStagedToModels(base: DbModel[], staged: StagedItem[]): DbModel[] {
    let rows = [...base];
    const inserts = staged.filter(it => it.tableName === 'models_jumdata' && it.op === 'insert');
    for (const it of inserts) {
      const data = it.data || {};
      rows.unshift({
        id: it.key,
        jm_id: Number(data.jm_id ?? 0),
        series_jm_id: Number(data.series_jm_id ?? 0),
        series_id: data.series_id ?? null,
        series_name: data.series_name ?? null,
        brand_jm_id: Number(data.brand_jm_id ?? 0),
        brand_id: data.brand_id ?? null,
        brand_name: data.brand_name ?? null,
        name: String(data.name ?? ''),
        groupid: data.groupid ?? null,
        groupname: data.groupname ?? null,
        sizetype: data.sizetype ?? null,
        displacement2: data.displacement2 ?? null,
        displacement: data.displacement ?? null,
        geartype: data.geartype ?? null,
        geartype2: data.geartype2 ?? null,
        logo_url: data.logo_url ?? null,
        yeartype: data.yeartype ?? null,
        listdate: data.listdate ?? null,
        price: data.price ?? null,
        productionstate: data.productionstate ?? null,
        salestate: data.salestate ?? null,
        depth: Number(data.depth ?? 4),
        activity_status: Number(data.activity_status ?? 0),
        created_at: '',
        updated_at: '',
      });
    }
    const updates = staged.filter(it => it.tableName === 'models_jumdata' && it.op === 'update' && it.id);
    for (const it of updates) {
      rows = rows.map(r => (r.id === it.id ? ({ ...r, ...(it.changes || {}) } as any) : r));
    }
    return rows;
  }

  function stageUpdate(rowId: string, field: keyof DbModel, value: any) {
    setViewModels(prev => prev.map(r => (r.id === rowId ? ({ ...r, [field]: value } as any) : r)));
    setStagedItems(prev => {
      const existing = prev.find(it => it.key === rowId && it.tableName === 'models_jumdata');
      const isTemp = rowId.startsWith('tmp_');
      if (isTemp) {
        const data = { ...(existing?.data || {}), [field]: value };
        const next: StagedItem = { key: rowId, op: 'insert', tableName: 'models_jumdata', data };
        return [...prev.filter(it => !(it.key === rowId && it.tableName === 'models_jumdata')), next];
      }

      const original = dbModels.find(m => m.id === rowId) as any;
      const originalValue = original ? original[field] : undefined;
      const changed = JSON.stringify(originalValue ?? null) !== JSON.stringify(value ?? null);

      if (!changed) {
        if (existing?.op === 'update') {
          const nextChanges = { ...(existing.changes || {}) };
          delete nextChanges[field as string];
          if (Object.keys(nextChanges).length === 0) {
            return prev.filter(it => !(it.key === rowId && it.tableName === 'models_jumdata'));
          }
          const next: StagedItem = { ...existing, changes: nextChanges };
          return [...prev.filter(it => !(it.key === rowId && it.tableName === 'models_jumdata')), next];
        }
        return prev;
      }

      const baseChanges = existing?.op === 'update' ? (existing.changes || {}) : {};
      const nextChanges: Record<string, any> = { ...baseChanges, [field]: value };
      if (field === 'activity_status') {
        nextChanges.activity_status_manual = true;
      }
      const next: StagedItem = { key: rowId, op: 'update', tableName: 'models_jumdata', id: rowId, changes: nextChanges };
      return [...prev.filter(it => !(it.key === rowId && it.tableName === 'models_jumdata')), next];
    });
  }

  function addNewRow() {
    const tempId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const row: DbModel = {
      id: tempId,
      jm_id: 0,
      series_jm_id: 0,
      series_id: null,
      series_name: null,
      brand_jm_id: 0,
      brand_id: null,
      brand_name: null,
      name: '',
      groupid: null,
      groupname: null,
      sizetype: null,
      displacement2: null,
      displacement: null,
      geartype: null,
      geartype2: null,
      logo_url: null,
      yeartype: null,
      listdate: null,
      price: null,
      productionstate: null,
      salestate: null,
      depth: 4,
      activity_status: 0,
      created_at: '',
      updated_at: '',
    };
    setViewModels(prev => [row, ...prev]);
    setStagedItems(prev => [...prev, { key: tempId, op: 'insert', tableName: 'models_jumdata', data: { ...row, id: undefined, created_at: undefined, updated_at: undefined, activity_status_manual: true } }]);
  }

  function toggleDeleteRow(rowId: string) {
    const isTemp = rowId.startsWith('tmp_');
    if (isTemp) {
      setViewModels(prev => prev.filter(r => r.id !== rowId));
      setStagedItems(prev => prev.filter(it => !(it.key === rowId && it.tableName === 'models_jumdata')));
      setSelectedIds(prev => prev.filter(id => id !== rowId));
      return;
    }

    setStagedItems(prev => {
      const existing = prev.find(it => it.tableName === 'models_jumdata' && it.key === rowId);
      if (existing?.op === 'delete') {
        return prev.filter(it => !(it.tableName === 'models_jumdata' && it.key === rowId));
      }
      return [...prev.filter(it => !(it.tableName === 'models_jumdata' && it.key === rowId)), { key: rowId, op: 'delete', tableName: 'models_jumdata', id: rowId }];
    });
  }

  function discardAllChanges() {
    if (stagedItems.length === 0) return;
    const ok = window.confirm('将撤销当前未提交的全部修改，是否继续？');
    if (!ok) return;
    setStagedItems([]);
    setSelectedIds([]);
    setViewModels([...dbModels]);
  }

  async function commitAllChanges() {
    if (stagedItems.length === 0) return;
    const ok = window.confirm(`将提交 ${stagedItems.length} 条变更到数据库，是否继续？`);
    if (!ok) return;
    setCommitBusy(true);
    setError(null);

    const items = stagedItems.filter(it => it.tableName === 'models_jumdata');
    const inserts = items.filter(it => it.op === 'insert');
    const updates = items.filter(it => it.op === 'update');
    const deletes = items.filter(it => it.op === 'delete');
    const failed: StagedItem[] = [];

    try {
      for (const it of inserts) {
        const data = it.data || {};
        const payload: any = {
          jm_id: Number(data.jm_id),
          series_jm_id: Number(data.series_jm_id),
          series_id: data.series_id || null,
          brand_jm_id: Number(data.brand_jm_id),
          brand_id: data.brand_id || null,
          name: String(data.name || ''),
          groupid: data.groupid || null,
          groupname: data.groupname || null,
          sizetype: data.sizetype || null,
          displacement2: data.displacement2 || null,
          displacement: data.displacement || null,
          geartype: data.geartype || null,
          geartype2: data.geartype2 ?? null,
          logo_url: data.logo_url || null,
          yeartype: data.yeartype || null,
          listdate: data.listdate || null,
          price: data.price || null,
          productionstate: data.productionstate || null,
          salestate: data.salestate || null,
          depth: Number(data.depth ?? 4),
          activity_status: Number(data.activity_status ?? 0),
          activity_status_manual: true,
        };
        if (!payload.jm_id || !payload.series_jm_id || !payload.brand_jm_id || !payload.name) {
          failed.push(it);
          continue;
        }
        const { error: insertError } = await supabase.from('models_jumdata').insert(payload);
        if (insertError) failed.push(it);
      }

      for (const it of updates) {
        const id = it.id;
        if (!id) {
          failed.push(it);
          continue;
        }
        const changes = it.changes || {};
        const { error: updateError } = await supabase.from('models_jumdata').update(changes).eq('id', id);
        if (updateError) failed.push(it);
      }

      for (const it of deletes) {
        const id = it.id;
        if (!id) {
          failed.push(it);
          continue;
        }
        const { error: deleteError } = await supabase.from('models_jumdata').delete().eq('id', id);
        if (deleteError) failed.push(it);
      }

      setStagedItems(failed);
      await loadDbModels(failed);
      if (failed.length === 0) {
        setImportResult('数据库更新成功');
      } else {
        setError(`有 ${failed.length} 条变更提交失败，请检查字段或权限后重试。`);
      }
    } finally {
      setCommitBusy(false);
    }
  }

  // 批量选择控制
  const handleSelectAll = () => {
    if (viewModels.length > 0 && selectedIds.length === viewModels.length) {
      handleClearSelection();
    } else {
      setSelectedIds(viewModels.map(s => s.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleSelectId = (id: string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev : [...prev, id]));
  };

  const handleUnselectId = (id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  const handleBatchUpdate = async (status: number) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      if (isRowDeleted(id)) continue;
      stageUpdate(id, 'activity_status', status);
    }
  };

  async function loadDbBrands(nextOnlyNormal: boolean = onlyNormalSeries) {
    setDbBrandsLoading(true);
    setError(null);
    try {
      const q = supabase
        .from('brands')
        .select('*')
        .eq('depth', 1)
        .order('name', { ascending: true });

      const { data, error } = nextOnlyNormal ? await q.eq('activity_status', 0) : await q;

      if (error) throw error;
      setDbBrands(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载品牌数据库失败');
    } finally {
      setDbBrandsLoading(false);
    }
  }

  async function loadDbSeries(nextOnlyNormalSeries: boolean = onlyNormalSeries) {
    if (!selectedBrandId) {
      setDbSeries([]);
      return;
    }
    setDbSeriesLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('series')
        .select('*')
        .eq('brand_jm_id', selectedBrandId);

      if (nextOnlyNormalSeries) {
        query = query.eq('activity_status', 0);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      setDbSeries(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载车系数据库失败');
    } finally {
      setDbSeriesLoading(false);
    }
  }

  async function loadDbModels(nextStaged?: StagedItem[], nextOnlyNormal: boolean = onlyNormalSeries) {
    setDbModelsLoading(true);
    setError(null);
    try {
      const { data: brandsData } = await supabase.from('brands').select('*').limit(500);
      const brandMap = new Map((brandsData || []).map(b => [b.jm_id, b.name]));

      const { data: seriesData } = await supabase.from('series').select('*').limit(500);
      const seriesMap = new Map((seriesData || []).map(s => [s.jm_id, s.name]));

      let q = supabase
        .from('models_jumdata')
        .select('*');

      if (nextOnlyNormal) {
        q = q.eq('activity_status', 0);
      }

      const { data, error } = await q.order('jm_id', { ascending: true });
      
      if (error) throw error;
      const modelsWithNames = (data || []).map(m => ({
        ...m,
        series_name: seriesMap.get(m.series_jm_id) || null,
        brand_name: brandMap.get(m.brand_jm_id) || null,
      }));
      setDbModels(modelsWithNames as any);
      setViewModels(applyStagedToModels(modelsWithNames as any, nextStaged ?? stagedItems));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载车型数据库失败');
    } finally {
      setDbModelsLoading(false);
    }
  }

  const filteredBrands = brandSearchQuery.trim() === ""
    ? dbBrands
    : dbBrands.filter(brand => 
        brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
      );

  const filteredSeries = seriesSearchQuery.trim() === ""
    ? dbSeries
    : dbSeries.filter(series => 
        series.name.toLowerCase().includes(seriesSearchQuery.toLowerCase())
      );

  async function fetchModelsFromApi(seriesId: number) {
    const timestamp = Date.now();
    const text = new TextEncoder().encode(jmAppId + jmAppSecret + timestamp);
    const digest = await crypto.subtle.digest("SHA-256", text);
    const hashArray = Array.from(new Uint8Array(digest));
    const signHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    const formData = new URLSearchParams();
    formData.append("appId", jmAppId);
    formData.append("timestamp", timestamp.toString());
    formData.append("sign", signHex);
    formData.append("productCode", "vehicle_type");
    formData.append("seriesId", seriesId.toString());
    formData.append("sort", "year");

    const response = await fetch("https://api.jumdata.com/vehicle/query/model", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });

    const result = await response.json();
    if (result.code !== 200) {
      throw new Error(result.msg || `请求失败 code=${result.code}`);
    }
    return result.data as JmModelSeriesData;
  }

  async function buildBatchPlanForSeries(seriesList: DbSeries[]) {
    if (!selectedBrandId) throw new Error('请先选择品牌');
    const existingSeriesIds = new Set<number>();
    let from = 0;
    const pageSize = 5000;
    while (true) {
      const { data, error } = await supabase
        .from('models_jumdata')
        .select('series_jm_id')
        .eq('brand_jm_id', selectedBrandId)
        .range(from, from + pageSize - 1);
      if (error) throw error;
      const rows = (data || []) as Array<{ series_jm_id: number }>;
      for (const r of rows) {
        if (typeof r.series_jm_id === 'number') existingSeriesIds.add(r.series_jm_id);
      }
      if (rows.length < pageSize) break;
      from += pageSize;
    }

    const items: BatchImportPlanItem[] = seriesList.map(s => {
      const exists = existingSeriesIds.has(s.jm_id);
      return {
        id: s.jm_id,
        title: s.name || String(s.jm_id),
        subtitle: selectedBrandDb?.name ? `品牌：${selectedBrandDb.name}` : undefined,
        exists,
        enabled: !exists,
      };
    });
    setBatchPlanItems(items);
  }

  async function batchQueryAndImportModels() {
    if (batchBusy) return;
    if (!jmAppId || !jmAppSecret) {
      setError("请先前往设置页面配置聚美智数的 App ID 和 App Secret");
      return;
    }
    if (!selectedBrandId) {
      setError("请先选择品牌");
      return;
    }
    if (!onlyNormalSeries) {
      setError("请先勾选“只查询状态为正常的车系”，再使用批量导入。");
      return;
    }
    if (dbSeriesLoading) {
      setError("车系列表加载中，请稍后再试");
      return;
    }

    const brandDb = dbBrands.find(b => b.jm_id === selectedBrandId);
    if (!brandDb) {
      setError("未找到选中的品牌");
      return;
    }

    const candidates = filteredSeries.filter(s => s && typeof (s as any).jm_id === 'number' && (s as any).jm_id > 0);
    if (candidates.length === 0) {
      setError("当前没有可批量查询的车系");
      return;
    }

    setError(null);
    setImportResult(null);
    setBatchPlanOpen(true);
    setBatchPlanLoading(true);
    setBatchPlanItems([]);
    try {
      await buildBatchPlanForSeries(candidates as DbSeries[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : '生成批量导入清单失败');
      setBatchPlanOpen(false);
    } finally {
      setBatchPlanLoading(false);
    }
  }

  function toggleBatchPlanItem(id: string | number) {
    setBatchPlanItems(prev => prev.map(it => (it.id === id ? { ...it, enabled: !it.enabled } : it)));
  }

  function setBatchPlanMany(ids: Array<string | number>, enabled: boolean) {
    const idSet = new Set(ids);
    setBatchPlanItems(prev => prev.map(it => (idSet.has(it.id) ? { ...it, enabled } : it)));
  }

  async function confirmBatchPlanAndStart() {
    if (batchBusy) return;
    const enabledItems = batchPlanItems.filter(i => i.enabled);
    if (enabledItems.length === 0) {
      setBatchPlanOpen(false);
      return;
    }
    const ok = window.confirm(`将导入 ${enabledItems.length} 个车系的车型数据（不预览），是否继续？`);
    if (!ok) return;

    setBatchPlanOpen(false);
    setBatchBusy(true);
    batchCancelRef.current = false;
    setBatchTotal(enabledItems.length);
    setBatchCurrent(0);
    setBatchCurrentName(null);
    setBatchInserted(0);
    setBatchUpdated(0);
    setBatchSkipped(0);
    setBatchFailed(0);
    setBatchLastError(null);

    const brandDb = dbBrands.find(b => b.jm_id === selectedBrandId);
    if (!brandDb) {
      setBatchBusy(false);
      setError('未找到选中的品牌');
      return;
    }

    const idSet = new Set(enabledItems.map(i => Number(i.id)));
    const candidates = filteredSeries.filter(s => idSet.has(Number(s.jm_id)));

    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;
    let processedSeries = 0;

    try {
      for (let si = 0; si < candidates.length; si++) {
        if (batchCancelRef.current) break;
        const series = candidates[si] as any;
        const seriesDb = dbSeries.find(s => s.jm_id === series.jm_id);
        processedSeries = si + 1;
        setBatchCurrent(processedSeries);
        setBatchCurrentName(series.name || String(series.jm_id));

        try {
          const seriesData = await fetchModelsFromApi(series.jm_id);
          const allModels = seriesData.list || [];

          for (const model of allModels) {
            if (batchCancelRef.current) break;
            try {
              const { data: existing, error: checkError } = await supabase
                .from("models_jumdata")
                .select("*")
                .eq("jm_id", model.id)
                .maybeSingle();
              if (checkError) throw checkError;

              if (!existing) {
                const insertData = {
                  jm_id: model.id,
                  series_jm_id: series.jm_id,
                  series_id: series.id,
                  series_name: seriesDb?.name ?? series.name ?? null,
                  brand_jm_id: brandDb.jm_id,
                  brand_id: brandDb.id,
                  brand_name: brandDb.name,
                  name: model.name,
                  groupid: model.groupid || null,
                  groupname: model.groupname || null,
                  sizetype: model.sizetype || null,
                  displacement2: model.displacement2 || null,
                  displacement: model.displacement || null,
                  geartype: model.geartype || null,
                  geartype2: model.geartype2 ? Number(model.geartype2) : null,
                  logo_url: series.logo_url || null,
                  yeartype: model.yeartype || null,
                  listdate: model.listdate || null,
                  price: model.price || null,
                  productionstate: model.productionstate || null,
                  salestate: model.salestate || null,
                  depth: 4,
                };
                const { error: insertErr } = await supabase.from("models_jumdata").insert(insertData);
                if (insertErr) throw insertErr;
                inserted++;
                setBatchInserted(inserted);
              } else {
                const { isEqual } = compareModelData(existing, model, series.jm_id, series.id, brandDb.jm_id, brandDb.id);
                if (isEqual) {
                  skipped++;
                  setBatchSkipped(skipped);
                } else {
                  const updateData = {
                    series_jm_id: series.jm_id,
                    series_id: series.id,
                    series_name: seriesDb?.name ?? series.name ?? null,
                    brand_jm_id: brandDb.jm_id,
                    brand_id: brandDb.id,
                    brand_name: brandDb.name,
                    name: model.name,
                    groupid: model.groupid || null,
                    groupname: model.groupname || null,
                    sizetype: model.sizetype || null,
                    displacement2: model.displacement2 || null,
                    displacement: model.displacement || null,
                    geartype: model.geartype || null,
                    geartype2: model.geartype2 ? Number(model.geartype2) : null,
                    logo_url: series.logo_url || null,
                    yeartype: model.yeartype || null,
                    listdate: model.listdate || null,
                    price: model.price || null,
                    productionstate: model.productionstate || null,
                    salestate: model.salestate || null,
                  };
                  const { error: updateErr } = await supabase
                    .from("models_jumdata")
                    .update(updateData)
                    .eq("jm_id", model.id);
                  if (updateErr) throw updateErr;
                  updated++;
                  setBatchUpdated(updated);
                }
              }
            } catch (e) {
              failed++;
              setBatchFailed(failed);
              const msg = e instanceof Error ? e.message : String(e);
              setBatchLastError(`${model.name || model.id}: ${msg}`);
            }
            await new Promise(r => setTimeout(r, 120));
          }
        } catch (e) {
          failed++;
          setBatchFailed(failed);
          const msg = e instanceof Error ? e.message : String(e);
          setBatchLastError(`${series.name || series.jm_id}: ${msg}`);
        }
      }

      const cancelled = batchCancelRef.current;
      const summary = `${cancelled ? '已取消' : '完成'}：车系 ${processedSeries}/${candidates.length}，新增 ${inserted}，更新 ${updated}，跳过 ${skipped}，失败 ${failed}`;
      setImportResult(summary);
      await loadDbModels();
    } finally {
      setBatchBusy(false);
      setBatchCurrentName(null);
    }
  }

  async function queryModelsFromApi() {
    if (!jmAppId || !jmAppSecret) {
      setError("请先前往设置页面配置聚美智数的 App ID 和 App Secret");
      return;
    }
    if (!selectedSeriesId) {
      setError("请选择车系");
      return;
    }

    const ok = await confirmJumdataQueryIfExists({
      supabase,
      table: 'models_jumdata',
      where: (q) => q.eq('series_jm_id', selectedSeriesId),
      subjectLabel: '车型',
      extraHint: '选择“取消”将停止本次查询。',
    });
    if (!ok) return;

    const selectedSeries = dbSeries.find(s => s.jm_id === selectedSeriesId);
    if (!selectedSeries) {
      setError("未找到选中的车系");
      return;
    }
    const selectedBrand = dbBrands.find(b => b.jm_id === selectedSeries.brand_jm_id);
    if (!selectedBrand) {
      setError("未找到对应的品牌");
      return;
    }
    setSelectedSeriesDb(selectedSeries);
    setSelectedBrandDb(selectedBrand);
    setQueryLoading(true);
    setQueryResult(null);
    setImportResult(null);
    setError(null);
    setChangeLogs([]);
    try {
      const timestamp = Date.now();
      const text = new TextEncoder().encode(jmAppId + jmAppSecret + timestamp);
      const digest = await crypto.subtle.digest("SHA-256", text);
      const hashArray = Array.from(new Uint8Array(digest));
      const signHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

      const formData = new URLSearchParams();
      formData.append("appId", jmAppId);
      formData.append("timestamp", timestamp.toString());
      formData.append("sign", signHex);
      formData.append("productCode", "vehicle_type");
      formData.append("seriesId", selectedSeriesId.toString());
      formData.append("sort", "year");

      const response = await fetch("https://api.jumdata.com/vehicle/query/model", {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const result = await response.json();
      if (result.code !== 200) {
        throw new Error(result.msg || `请求失败 code=${result.code}`);
      }

      const seriesData: JmModelSeriesData = result.data;
      setQueryResult(seriesData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "查询失败");
    } finally {
      setQueryLoading(false);
    }
  }

  function compareModelData(existing: DbModel, newData: JmModel, seriesJmId: number, seriesId: string, brandJmId: number, brandId: string): { isEqual: boolean; changes: ModelChangeLog['changes'] } {
    const changes: ModelChangeLog['changes'] = [];

    if (existing.name !== newData.name) {
      changes.push({ field: 'name', old: existing.name, new: newData.name });
    }
    if ((existing.groupid || null) !== (newData.groupid || null)) {
      changes.push({ field: 'groupid', old: existing.groupid, new: newData.groupid || null });
    }
    if ((existing.groupname || null) !== (newData.groupname || null)) {
      changes.push({ field: 'groupname', old: existing.groupname, new: newData.groupname || null });
    }
    if ((existing.sizetype || null) !== (newData.sizetype || null)) {
      changes.push({ field: 'sizetype', old: existing.sizetype, new: newData.sizetype || null });
    }
    if ((existing.displacement2 || null) !== (newData.displacement2 || null)) {
      changes.push({ field: 'displacement2', old: existing.displacement2, new: newData.displacement2 || null });
    }
    if ((existing.displacement || null) !== (newData.displacement || null)) {
      changes.push({ field: 'displacement', old: existing.displacement, new: newData.displacement || null });
    }
    if ((existing.geartype || null) !== (newData.geartype || null)) {
      changes.push({ field: 'geartype', old: existing.geartype, new: newData.geartype || null });
    }
    if ((existing.geartype2 || null) !== (newData.geartype2 || null)) {
      changes.push({ field: 'geartype2', old: String(existing.geartype2 || '').replace(/^0*$/, ''), new: String(newData.geartype2 || '').replace(/^0*$/, '') });
    }
    if ((existing.yeartype || null) !== (newData.yeartype || null)) {
      changes.push({ field: 'yeartype', old: existing.yeartype, new: newData.yeartype || null });
    }
    if ((existing.listdate || null) !== (newData.listdate || null)) {
      changes.push({ field: 'listdate', old: existing.listdate, new: newData.listdate || null });
    }
    if ((existing.price || null) !== (newData.price || null)) {
      changes.push({ field: 'price', old: existing.price, new: newData.price || null });
    }
    if ((existing.productionstate || null) !== (newData.productionstate || null)) {
      changes.push({ field: 'productionstate', old: existing.productionstate, new: newData.productionstate || null });
    }
    if ((existing.salestate || null) !== (newData.salestate || null)) {
      changes.push({ field: 'salestate', old: existing.salestate, new: newData.salestate || null });
    }
    if (existing.series_jm_id !== seriesJmId) {
      changes.push({ field: 'series_jm_id', old: String(existing.series_jm_id), new: String(seriesJmId) });
    }
    if (existing.series_id !== seriesId) {
      changes.push({ field: 'series_id', old: existing.series_id, new: seriesId });
    }
    if (existing.brand_jm_id !== brandJmId) {
      changes.push({ field: 'brand_jm_id', old: String(existing.brand_jm_id), new: String(brandJmId) });
    }
    if (existing.brand_id !== brandId) {
      changes.push({ field: 'brand_id', old: existing.brand_id, new: brandId });
    }

    return { isEqual: changes.length === 0, changes };
  }

  async function importModels() {
    if (!queryResult || !selectedSeriesDb || !selectedBrandDb) return;
    setLoading(true);
    setError(null);
    setImportProgress(0);
    setChangeLogs([]);

    const logs: ModelChangeLog[] = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    let failed = 0;

    const allModels = queryResult.list || [];
    const total = allModels.length;

    try {
      for (let i = 0; i < allModels.length; i++) {
        const model = allModels[i];

        try {
          const { data: existing, error: checkError } = await supabase
            .from("models_jumdata")
            .select("*")
            .eq("jm_id", model.id)
            .maybeSingle();

          if (checkError) {
            throw checkError;
          }

          if (!existing) {
            const insertData = {
              jm_id: model.id,
              series_jm_id: selectedSeriesDb.jm_id,
              series_id: selectedSeriesDb.id,
              series_name: selectedSeriesDb.name,
              brand_jm_id: selectedBrandDb.jm_id,
              brand_id: selectedBrandDb.id,
              brand_name: selectedBrandDb.name,
              name: model.name,
              groupid: model.groupid || null,
              groupname: model.groupname || null,
              sizetype: model.sizetype || null,
              displacement2: model.displacement2 || null,
              displacement: model.displacement || null,
              geartype: model.geartype || null,
              geartype2: model.geartype2 ? Number(model.geartype2) : null,
              logo_url: selectedSeriesDb.logo_url || null,
              yeartype: model.yeartype || null,
              listdate: model.listdate || null,
              price: model.price || null,
              productionstate: model.productionstate || null,
              salestate: model.salestate || null,
              depth: 4,
            };
            const { error } = await supabase.from("models_jumdata").insert(insertData);

            if (error) {
              failed++;
              let errorDetail = `${error.message} (${error.code})`;
              if (error.details) errorDetail += ` - ${error.details}`;
              if (error.hint) errorDetail += ` (提示: ${error.hint})`;
              logs.push({
                action: 'skip',
                jm_id: model.id,
                name: model.name,
                changes: [{ field: 'error', old: null, new: `插入失败: ${errorDetail}` }]
              });
            } else {
              inserted++;
              logs.push({ action: 'insert', jm_id: model.id, name: model.name });
            }
          } else {
            const { isEqual, changes } = compareModelData(existing, model, selectedSeriesDb.jm_id, selectedSeriesDb.id, selectedBrandDb.jm_id, selectedBrandDb.id);

            if (isEqual) {
              skipped++;
              logs.push({ action: 'skip', jm_id: model.id, name: model.name });
            } else {
              const updateData = {
                series_jm_id: selectedSeriesDb.jm_id,
                series_id: selectedSeriesDb.id,
                brand_jm_id: selectedBrandDb.jm_id,
                brand_id: selectedBrandDb.id,
                name: model.name,
                groupid: model.groupid || null,
                groupname: model.groupname || null,
                sizetype: model.sizetype || null,
                displacement2: model.displacement2 || null,
                displacement: model.displacement || null,
                geartype: model.geartype || null,
                geartype2: model.geartype2 ? Number(model.geartype2) : null,
                logo_url: selectedSeriesDb.logo_url || null,
                yeartype: model.yeartype || null,
                listdate: model.listdate || null,
                price: model.price || null,
                productionstate: model.productionstate || null,
                salestate: model.salestate || null,
              };
              const { error } = await supabase
                .from("models_jumdata")
                .update(updateData)
                .eq("jm_id", model.id);

              if (error) {
                failed++;
                let errorDetail = `${error.message} (${error.code})`;
                if (error.details) errorDetail += ` - ${error.details}`;
                if (error.hint) errorDetail += ` (提示: ${error.hint})`;
                logs.push({
                  action: 'skip',
                  jm_id: model.id,
                  name: model.name,
                  changes: [{ field: 'error', old: null, new: `更新失败: ${errorDetail}` }]
                });
              } else {
                updated++;
                logs.push({ action: 'update', jm_id: model.id, name: model.name, changes });
              }
            }
          }
        } catch (modelError) {
          failed++;
          const errorMsg = modelError instanceof Error ? modelError.message : String(modelError);
          logs.push({
            action: 'skip',
            jm_id: model.id,
            name: model.name,
            changes: [{ field: 'error', old: null, new: `处理失败: ${errorMsg}` }]
          });
        }

        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setChangeLogs(logs);
      let resultMsg = `导入完成: 新增 ${inserted} 个，更新 ${updated} 个，跳过 ${skipped} 个`;
      if (failed > 0) {
        resultMsg += `，失败 ${failed} 个`;
      }
      setImportResult(resultMsg);

      if (inserted > 0 || updated > 0 || failed > 0) {
        setActiveTab('log-view');
        loadDbModels();
      }
    } catch (e) {
      const errorMsg = e instanceof Error
        ? `${e.message}${e.stack ? '\n' + e.stack : ''}`
        : JSON.stringify(e, null, 2);
      setError(`导入失败: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="text-2xl font-bold text-zinc-900">聚美智数车型数据导入</h3>
      <p className="mt-2 text-base text-zinc-500">
        从聚美智数 API 查询车型数据，预览后再导入数据库
      </p>

      <div className="mt-6 flex items-end justify-between gap-3 border-b border-zinc-200 pb-2">
        <div className="flex gap-2">
          <button
          type="button"
          onClick={() => setActiveTab('import')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'import'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          数据导入
          </button>
          <button
          type="button"
          onClick={() => {
            setActiveTab('db-view');
            loadDbBrands();
            loadDbSeries();
            loadDbModels();
          }}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'db-view'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          数据库视图
          </button>
          {changeLogs.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveTab('log-view')}
              className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
                activeTab === 'log-view'
                  ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
                  : 'text-zinc-500 hover:text-zinc-700'
              }`}
            >
              变更日志
            </button>
          )}
        </div>

        <label className="flex items-center gap-3 text-sm text-zinc-600 select-none">
          <span>只加载正常</span>
          <button
            type="button"
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              onlyNormalSeries ? 'bg-blue-600' : 'bg-zinc-300'
            }`}
            onClick={() => {
              const next = !onlyNormalSeries;
              setOnlyNormalSeries(next);
              setSelectedBrandId(null);
              setSelectedSeriesId(null);
              setSelectedBrandDb(null);
              setSelectedSeriesDb(null);
              setDbSeries([]);
              loadDbBrands(next);
              loadDbModels(undefined, next);
            }}
            aria-pressed={onlyNormalSeries}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                onlyNormalSeries ? 'translate-x-5' : 'translate-x-1'
              }`}
            />
          </button>
        </label>
      </div>

      {activeTab === 'import' && (
        <>
          {!queryResult ? (
            <>
              {!jmAppId || !jmAppSecret ? (
                <div className="mt-8 p-6 bg-yellow-50 border border-yellow-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-yellow-700 font-medium">提示</span>
                  </div>
                  <p className="text-yellow-600 text-sm">
                    请先前往 <strong>设置</strong> 页面配置聚美智数的 App ID 和 App Secret
                  </p>
                </div>
              ) : null}
              
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
                  <label className="block text-lg font-medium text-zinc-700">选择品牌</label>
                  <div className="mt-2">
                    {!dbBrands.length && !dbBrandsLoading ? (
                      <button
                        type="button"
                        onClick={() => loadDbBrands()}
                        className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-6 py-3 text-lg font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors"
                      >
                        加载品牌列表
                      </button>
                    ) : (
                      <>
                        <input
                          type="text"
                          value={brandSearchQuery}
                          onChange={(e) => setBrandSearchQuery(e.target.value)}
                          placeholder="搜索品牌名称..."
                          className="block w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
                        />
                        <div className="max-h-40 overflow-auto rounded-xl border border-zinc-200">
                          {dbBrandsLoading ? (
                            <div className="p-8 text-center text-sm text-zinc-500">加载中...</div>
                          ) : filteredBrands.length === 0 ? (
                            <div className="p-8 text-center text-sm text-zinc-500">未找到匹配的品牌</div>
                          ) : (
                            <ul className="divide-y divide-zinc-100">
                              {filteredBrands.map((brand) => (
                                <li key={brand.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedBrandId(brand.jm_id);
                                      setBrandSearchQuery(brand.name);
                                      setSelectedSeriesId(null);
                                      setSelectedSeriesDb(null);
                                    }}
                                    className={`w-full px-4 py-3 text-left transition-colors ${
                                      selectedBrandId === brand.jm_id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'hover:bg-zinc-50 text-zinc-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {brand.logo_url && (
                                        <img
                                          src={proxiedImageUrl(brand.logo_url) || undefined}
                                          alt=""
                                          className="h-8 w-8 rounded object-contain"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div>
                                        <div className="font-medium">{brand.name}</div>
                                        <div className="text-sm text-zinc-500">
                                          {brand.initial ? `首字母: ${brand.initial}` : ''}
                                          {brand.initial && brand.jm_id ? ' · ' : ''}
                                          {brand.jm_id ? `ID: ${brand.jm_id}` : ''}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-lg font-medium text-zinc-700">选择车系</label>
                  <div className="mt-2">
                    {!selectedBrandId ? (
                      <div className="p-8 text-center text-sm text-zinc-500 rounded-xl border border-zinc-200">
                        请先选择品牌
                      </div>
                    ) : !dbSeries.length && !dbSeriesLoading ? (
                      <button
                        type="button"
                        onClick={() => loadDbSeries()}
                        className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-6 py-3 text-lg font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors"
                      >
                        加载车系列表
                      </button>
                    ) : (
                      <>
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <label className="inline-flex items-center gap-2 text-sm text-zinc-700 select-none">
                            <input
                              type="checkbox"
                              className="h-4 w-4 rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                              checked={onlyNormalSeries}
                              onChange={async (e) => {
                                const next = e.target.checked;
                                setOnlyNormalSeries(next);
                                setSelectedSeriesId(null);
                                setSelectedSeriesDb(null);
                                await loadDbSeries(next);
                              }}
                            />
                            只查询状态为正常的车系
                          </label>
                          <button
                            type="button"
                            onClick={batchQueryAndImportModels}
                            disabled={!onlyNormalSeries || batchBusy || dbSeriesLoading || !selectedBrandId || !jmAppId || !jmAppSecret}
                            className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            title={!onlyNormalSeries ? '请先勾选“只查询状态为正常的车系”' : undefined}
                          >
                            {batchBusy ? '批量导入中...' : '批量查询并导入'}
                          </button>
                        </div>

                        <input
                          type="text"
                          value={seriesSearchQuery}
                          onChange={(e) => setSeriesSearchQuery(e.target.value)}
                          placeholder="搜索车系名称..."
                          className="block w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
                        />
                        <div className="max-h-40 overflow-auto rounded-xl border border-zinc-200">
                          {dbSeriesLoading ? (
                            <div className="p-8 text-center text-sm text-zinc-500">加载中...</div>
                          ) : filteredSeries.length === 0 ? (
                            <div className="p-8 text-center text-sm text-zinc-500">未找到匹配的车系</div>
                          ) : (
                            <ul className="divide-y divide-zinc-100">
                              {filteredSeries.map((series) => (
                                <li key={series.id}>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setSelectedSeriesId(series.jm_id);
                                      setSeriesSearchQuery(series.name);
                                    }}
                                    className={`w-full px-4 py-3 text-left transition-colors ${
                                      selectedSeriesId === series.jm_id
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'hover:bg-zinc-50 text-zinc-900'
                                    }`}
                                  >
                                    <div className="flex items-center gap-3">
                                      {series.logo_url && (
                                        <img
                                          src={proxiedImageUrl(series.logo_url) || undefined}
                                          alt=""
                                          className="h-8 w-8 rounded object-contain"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div>
                                        <div className="font-medium">{series.name}</div>
                                        <div className="text-sm text-zinc-500">
                                          {series.subcompany_name ? series.subcompany_name : ''}
                                          {series.subcompany_name && series.jm_id ? ' · ' : ''}
                                          {series.jm_id ? `ID: ${series.jm_id}` : ''}
                                        </div>
                                      </div>
                                    </div>
                                  </button>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={queryModelsFromApi}
                  disabled={queryLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {queryLoading ? "查询中..." : "查询车型数据"}
                </button>
              </div>

              {batchBusy || batchTotal > 0 ? (
                <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-zinc-900">批量查询并导入进度</div>
                      <div className="mt-1 text-xs text-zinc-600">
                        {batchCurrent}/{batchTotal}
                        {batchCurrentName ? ` · 当前：${batchCurrentName}` : ''}
                        {` · 新增 ${batchInserted} / 更新 ${batchUpdated} / 跳过 ${batchSkipped} / 失败 ${batchFailed}`}
                      </div>
                      {batchLastError ? (
                        <div className="mt-1 text-xs text-red-600">最近失败：{batchLastError}</div>
                      ) : null}
                    </div>
                    {batchBusy ? (
                      <button
                        type="button"
                        onClick={() => {
                          batchCancelRef.current = true;
                        }}
                        className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200"
                      >
                        取消
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-3 h-3 w-full overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full bg-green-600 transition-all duration-300"
                      style={{ width: `${batchTotal > 0 ? Math.round((batchCurrent / batchTotal) * 100) : 0}%` }}
                    />
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <>
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-xl font-semibold text-zinc-900">
                    查询结果 - {selectedSeriesDb?.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    {selectedSeriesDb?.logo_url && (
                      <img
                        src={proxiedImageUrl(selectedSeriesDb.logo_url) || undefined}
                        alt=""
                        className="h-8 w-8 rounded object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    )}
                    <span className="text-sm text-zinc-500">
                      {selectedBrandDb?.name} / {selectedSeriesDb?.name}
                    </span>
                  </div>
                </div>
                <div className="max-h-80 overflow-auto rounded-xl border border-zinc-200">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Logo</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">名称</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">年款</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">排量</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">价格</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">销售状态</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">ID</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {queryResult.list.map((model) => (
                      <tr key={model.id} className="hover:bg-zinc-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                          {model.logo ? (
                            <img
                              src={proxiedImageUrl(model.logo) || undefined}
                              alt={model.name}
                              className="h-8 w-8 rounded object-contain"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">-</span>
                          )}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{model.name}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{model.yeartype}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{model.displacement}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{model.price}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm">
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            model.salestate === '在销' 
                              ? 'bg-green-100 text-green-800'
                              : model.salestate === '待销'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {model.salestate}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{model.id}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </div>

              {(loading || importProgress > 0) && (
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-zinc-700">导入进度</span>
                    <span className="text-sm font-semibold text-zinc-900">{importProgress}%</span>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-zinc-200">
                    <div
                      className="h-full bg-green-600 transition-all duration-300"
                      style={{ width: `${importProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setQueryResult(null);
                    setImportResult(null);
                    setError(null);
                    setImportProgress(0);
                    setChangeLogs([]);
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-6 py-3 text-lg font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors"
                >
                  重新查询
                </button>
                <button
                  type="button"
                  onClick={importModels}
                  disabled={loading}
                  className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-3 text-lg font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {loading ? "导入中..." : "确认导入"}
                </button>
              </div>
            </>
          )}
        </>
      )}

      {activeTab === 'db-view' && (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-zinc-900">
              数据库车型列表（共 {viewModels.length} 个车型）
            </h4>
            <button
              type="button"
              onClick={() => {
                (async () => {
                  if (stagedItems.length > 0) {
                    const ok = window.confirm('当前有未提交变更，刷新将丢失这些暂存修改，是否继续？');
                    if (!ok) return;
                    setStagedItems([]);
                    setSelectedIds([]);
                    await loadDbBrands();
                    await loadDbSeries();
                    await loadDbModels([]);
                    return;
                  }
                  await loadDbBrands();
                  await loadDbSeries();
                  await loadDbModels();
                })();
              }}
              disabled={dbModelsLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {dbModelsLoading ? '加载中...' : '刷新'}
            </button>
          </div>

          {/* 翻译按钮组 */}
          <div className="flex items-center gap-3 mb-4 flex-wrap">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowTransLocales(!showTransLocales)}
                className="inline-flex items-center gap-1 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
              >
                目标语言 ({transTargetLocales.length}/7)
                <span className="text-xs text-zinc-400">▼</span>
              </button>
              {showTransLocales && (
                <div className="absolute top-full left-0 mt-1 z-30 bg-white rounded-xl border border-zinc-200 shadow-lg p-3 w-52">
                  <div className="flex items-center justify-between mb-2 pb-2 border-b border-zinc-100">
                    <button type="button" onClick={() => setTransTargetLocales([...TARGET_LOCALES])} className="text-xs text-blue-600 hover:text-blue-800">全选</button>
                    <button type="button" onClick={() => setTransTargetLocales([])} className="text-xs text-zinc-400 hover:text-zinc-600">清除</button>
                  </div>
                  {TARGET_LOCALES.map((loc) => (
                    <label key={loc} className="flex items-center gap-2 py-1 cursor-pointer hover:bg-zinc-50 px-1 rounded">
                      <input
                        type="checkbox"
                        checked={transTargetLocales.includes(loc)}
                        onChange={() => toggleTransLocale(loc)}
                        className="rounded border-zinc-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-zinc-700">{LOCALE_LABELS[loc as keyof typeof LOCALE_LABELS] || loc}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              disabled={transModels || transTargetLocales.length === 0}
              onClick={async () => {
                const ids = viewModels.map(m => m.jm_id).filter(id => id > 0);
                await translateEntities(transTargetLocales, ids.length > 0 ? ids : undefined);
                await loadDbModels();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {transModels ? "翻译中..." : "翻译车型"}
            </button>
            {transProgress && (
              <span className="text-sm text-zinc-600">{transProgress}</span>
            )}
            {transError && (
              <span className="text-sm text-red-600">{transError}</span>
            )}
          </div>

          <StagedCrudToolbar
            title="本地暂存"
            stagedItems={stagedItems.filter(it => it.tableName === 'models_jumdata')}
            busy={commitBusy}
            onAdd={addNewRow}
            onDiscardAll={discardAllChanges}
            onConfirm={commitAllChanges}
          />

          <BatchOperations
            tableName="models_jumdata"
            selectedIds={selectedIds}
            totalCount={viewModels.length}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onBatchUpdate={handleBatchUpdate}
            loading={dbModelsLoading}
          />

          <BulkEditBar
            tableName="models_jumdata"
            selectedIds={selectedIds}
            rows={viewModels}
            fields={tableFieldConfigs.models_jumdata}
            busy={dbModelsLoading || commitBusy}
            getLabel={(field) => getFieldLabel(field, undefined, 'models_jumdata')}
            getRowId={(row) => (row as any).id}
            isRowDeleted={(id) => isRowDeleted(id)}
            onClearSelection={handleClearSelection}
            onStageUpdate={(rowId, field, value) => stageUpdate(rowId, field as any, value)}
            onToggleDeleteRow={toggleDeleteRow}
            onAddRow={addNewRow}
          />

          <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={(e) => e.target.checked ? handleSelectAll() : handleClearSelection()}
                      disabled={dbModelsLoading || viewModels.length === 0}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Logo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">聚美ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">品牌聚美ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">车系聚美ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">车型名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">年款</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">销售状态</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">活动状态</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {dbModelsLoading ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-zinc-500">
                      加载中...
                    </td>
                  </tr>
                ) : viewModels.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="px-4 py-8 text-center text-sm text-zinc-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  viewModels.map((model) => {
                    const deleted = isRowDeleted(model.id);
                    return (
                    <tr key={model.id} className={`hover:bg-zinc-50 ${deleted ? 'opacity-60' : ''}`}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(model.id)}
                          onChange={(e) => e.target.checked ? handleSelectId(model.id) : handleUnselectId(model.id)}
                          disabled={dbModelsLoading}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                        {model.logo_url ? (
                          <img
                            src={model.logo_url}
                            alt={model.name}
                            className="h-8 w-8 rounded object-contain"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                        {deleted || !model.id.startsWith('tmp_') ? (
                          String(model.jm_id)
                        ) : (
                          <input
                            type="number"
                            value={model.jm_id ?? 0}
                            onChange={(e) => stageUpdate(model.id, 'jm_id', Number(e.target.value))}
                            className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                          />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                        {deleted || !model.id.startsWith('tmp_') ? (
                          String(model.brand_jm_id)
                        ) : (
                          <input
                            type="number"
                            value={model.brand_jm_id ?? 0}
                            onChange={(e) => stageUpdate(model.id, 'brand_jm_id', Number(e.target.value))}
                            className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                          />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                        {deleted || !model.id.startsWith('tmp_') ? (
                          String(model.series_jm_id)
                        ) : (
                          <input
                            type="number"
                            value={model.series_jm_id ?? 0}
                            onChange={(e) => stageUpdate(model.id, 'series_jm_id', Number(e.target.value))}
                            className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                          />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">
                        {deleted ? (
                          model.name
                        ) : (
                          <input
                            value={model.name ?? ''}
                            onChange={(e) => stageUpdate(model.id, 'name', e.target.value)}
                            className="w-72 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                          />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                        {deleted ? (
                          model.yeartype || '-'
                        ) : (
                          <input
                            value={model.yeartype ?? ''}
                            onChange={(e) => stageUpdate(model.id, 'yeartype', e.target.value || null)}
                            className="w-24 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                          />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {deleted ? (
                          model.salestate ? (
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                              model.salestate === '在销' 
                                ? 'bg-green-100 text-green-800'
                                : model.salestate === '待销'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-gray-100 text-gray-800'
                            }`}>
                              {model.salestate}
                            </span>
                          ) : null
                        ) : (
                          <input
                            value={model.salestate ?? ''}
                            onChange={(e) => stageUpdate(model.id, 'salestate', e.target.value || null)}
                            className="w-32 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                            placeholder="销售状态"
                          />
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {deleted ? (
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            (model.activity_status ?? 0) === 0 
                              ? 'bg-green-100 text-green-800'
                              : (model.activity_status ?? 0) === 1
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {activityStatusMap[(model.activity_status ?? 0) as keyof typeof activityStatusMap] || '未知'}
                          </span>
                        ) : (
                          <select
                            value={model.activity_status ?? 0}
                            onChange={(e) => stageUpdate(model.id, 'activity_status', Number(e.target.value))}
                            className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                          >
                            <option value={0}>正常</option>
                            <option value={1}>不显示</option>
                            <option value={2}>不可用</option>
                          </select>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleDeleteRow(model.id)}
                          className={`text-sm font-semibold ${deleted ? 'text-zinc-600 hover:text-zinc-900' : 'text-red-600 hover:text-red-800'}`}
                        >
                          {deleted ? '撤销删除' : '删除'}
                        </button>
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'log-view' && changeLogs.length > 0 && (
        <div className="mt-6">
          <h4 className="text-xl font-semibold text-zinc-900 mb-4">
            数据变更日志
          </h4>
          <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">操作</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">聚美ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">车型名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">变更详情</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {changeLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-zinc-50">
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                        log.action === 'insert' 
                          ? 'bg-green-100 text-green-800'
                          : log.action === 'update'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {log.action === 'insert' ? '新增' : log.action === 'update' ? '更新' : '跳过'}
                      </span>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{log.jm_id}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{log.name}</td>
                    <td className="px-4 py-3 text-sm text-zinc-600">
                      {log.changes ? (
                        <div className="space-y-1">
                          {log.changes.map((change, i) => (
                            <div key={i} className="text-xs">
                              <span className="font-medium">{change.field}:</span>
                              <span className="text-red-600 line-through mx-1">{change.old || '空'}</span>
                              <span className="mx-1">→</span>
                              <span className="text-green-600">{change.new || '空'}</span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-400">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {importResult && (
        <div className="mt-4 rounded-xl bg-green-50 px-4 py-3 text-base text-green-700">
          {importResult}
        </div>
      )}
      {error && (
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">
          {error}
        </div>
      )}

      <BatchImportPlanModal
        open={batchPlanOpen}
        title={`批量导入清单（品牌：${selectedBrandDb?.name || selectedBrandId || '-'}）`}
        items={batchPlanItems}
        loading={batchPlanLoading || batchBusy}
        onClose={() => {
          if (batchPlanLoading) return;
          setBatchPlanOpen(false);
        }}
        onToggle={toggleBatchPlanItem}
        onSetMany={setBatchPlanMany}
        onConfirm={confirmBatchPlanAndStart}
      />
    </div>
  );
}
