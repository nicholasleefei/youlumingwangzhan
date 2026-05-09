import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import BatchOperations from "@/components/admin/BatchOperations";
import StagedCrudToolbar from "@/components/admin/StagedCrudToolbar";
import BulkEditBar from "@/components/admin/BulkEditBar";
import { fieldLabels, nestedFieldLabels, tableFieldConfigs, getFieldLabel, getActivityStatusLabel, getActivityStatusColor, modelDetailsFieldGroups, getNestedFieldValue } from "@/utils/fieldLabels";
import type { StagedItem } from "@/utils/stagedCrud";
import { confirmJumdataQueryIfExists } from "@/utils/jumdataQueryGuard";
import BatchImportPlanModal, { type BatchImportPlanItem } from "@/components/admin/BatchImportPlanModal";
import { proxiedImageUrl } from "@/utils/proxyUrl";

function renderFieldValue(value: any, parentKey?: string): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-zinc-400">-</span>;
  }

  if (typeof value === "object") {
    if (Array.isArray(value)) {
      if (value.length === 0) return <span className="text-zinc-400">-</span>;

      return (
        <div className="space-y-1">
          {value.map((item, idx) => (
            <div key={idx} className="flex gap-2">
              <span className="font-medium text-zinc-700 text-xs whitespace-nowrap">[{idx}]</span>
              <span className="text-zinc-600 text-xs">{renderFieldValue(item, parentKey)}</span>
            </div>
          ))}
        </div>
      );
    }

    const entries = Object.entries(value);
    if (entries.length === 0) return <span className="text-zinc-400">-</span>;

    return (
      <div className="space-y-1">
        {entries.map(([key, val]) => (
          <div key={key} className="flex gap-2">
            <span className="font-medium text-zinc-700 text-xs">{getFieldLabel(key, parentKey)}:</span>
            <span className="text-zinc-600 text-xs">{renderFieldValue(val, key)}</span>
          </div>
        ))}
      </div>
    );
  }

  return String(value);
}

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

type DbModel = {
  id: string;
  jm_id: number;
  series_jm_id: number;
  series_id: string | null;
  brand_jm_id: number;
  brand_id: string | null;
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
  created_at: string;
  updated_at: string;
};

type DbModelDetail = {
  id: string;
  jm_id: number;
  model_jm_id: number;
  model_id: string | null;
  series_jm_id: number;
  series_id: string | null;
  brand_jm_id: number;
  brand_id: string | null;
  brand_name: string | null;
  series_name: string | null;
  name: string;
  brandname: string | null;
  parentname: string | null;
  parentid: number | null;
  groupid: string | null;
  groupname: string | null;
  environmentalstandards: string | null;
  environmentalstandards2: string | null;
  displacement: string | null;
  displacement2: string | null;
  drivemode: string | null;
  drivemode2: number | null;
  sizetype: string | null;
  price: string | null;
  logo_url: string | null;
  initial: string | null;
  productionstate: string | null;
  salestate: string | null;
  yeartype: string | null;
  listdate: string | null;
  seatnum: string | null;
  depth: number;
  geartype: string | null;
  geartype2: number | null;
  gearnum: string | null;
  compartnum: number | null;
  activity_status: number;
  activity_status_manual: boolean;
  hot_sale?: boolean | null;
  raw: Record<string, any> | null;

  created_at: string;
  updated_at: string;
};

type ModelDetailChangeLog = {
  action: 'insert' | 'update' | 'skip';
  jm_id: number;
  name: string;
  changes?: {
    field: string;
    old: string | null;
    new: string | null;
  }[];
};

export default function AdminModelDetails() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jmAppId = localStorage.getItem('jumdata_app_id') || "";
  const jmAppSecret = localStorage.getItem('jumdata_app_secret') || "";
  const [queryResult, setQueryResult] = useState<any | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [batchBusy, setBatchBusy] = useState(false);
  const [batchCancelRequested, setBatchCancelRequested] = useState(false);
  const [batchTotal, setBatchTotal] = useState(0);
  const [batchCurrent, setBatchCurrent] = useState(0);
  const [batchCurrentName, setBatchCurrentName] = useState<string | null>(null);
  const [batchInserted, setBatchInserted] = useState(0);
  const [batchUpdated, setBatchUpdated] = useState(0);
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
  const [dbModelsLoading, setDbModelsLoading] = useState(false);
  const [dbModelDetails, setDbModelDetails] = useState<DbModelDetail[]>([]);
  const [viewModelDetails, setViewModelDetails] = useState<DbModelDetail[]>([]);
  const [dbModelDetailsLoading, setDbModelDetailsLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedModelId, setSelectedModelId] = useState<number | null>(null);
  const [selectedBrandDb, setSelectedBrandDb] = useState<DbBrand | null>(null);
  const [selectedSeriesDb, setSelectedSeriesDb] = useState<DbSeries | null>(null);
  const [selectedModelDb, setSelectedModelDb] = useState<DbModel | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");
  const [seriesSearchQuery, setSeriesSearchQuery] = useState<string>("");
  const [modelSearchQuery, setModelSearchQuery] = useState<string>("");
  const [modelDetailsSearchQuery, setModelDetailsSearchQuery] = useState<string>(() => {
    return localStorage.getItem('admin_model_details_search') || '';
  });
  const [onlyNormalModels, setOnlyNormalModels] = useState<boolean>(() => {
    const v = localStorage.getItem('admin_model_details_only_normal_models');
    if (v === null) return true;
    return v === '1';
  });
  const [activeTab, setActiveTab] = useState<'import' | 'db-view' | 'log-view'>('import');
  const [changeLogs, setChangeLogs] = useState<ModelDetailChangeLog[]>([]);

  useEffect(() => {
    localStorage.setItem('admin_model_details_only_normal_models', onlyNormalModels ? '1' : '0');
  }, [onlyNormalModels]);

  useEffect(() => {
    if (activeTab !== "import" && activeTab !== "db-view") return;
    loadDbBrands();
    loadDbSeries();
    loadDbModels(onlyNormalModels);
  }, [onlyNormalModels]);

  useEffect(() => {
    if (activeTab !== "import" && activeTab !== "db-view") return;
    setSelectedSeriesId(null);
    setSelectedModelId(null);
    setSelectedSeriesDb(null);
    setSelectedModelDb(null);
    setSeriesSearchQuery("");
    setModelSearchQuery("");
    setDbSeries([]);
    setDbModels([]);
    if (selectedBrandId) {
      loadDbSeries();
    }
  }, [selectedBrandId]);

  useEffect(() => {
    if (activeTab !== "import" && activeTab !== "db-view") return;
    setSelectedModelId(null);
    setSelectedModelDb(null);
    setModelSearchQuery("");
    setDbModels([]);
    if (selectedSeriesId) {
      loadDbModels(onlyNormalModels);
    }
  }, [selectedSeriesId]);

  useEffect(() => {
    localStorage.setItem('admin_model_details_search', modelDetailsSearchQuery);
  }, [modelDetailsSearchQuery]);

  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [commitBusy, setCommitBusy] = useState(false);

  // 详情弹窗状态
  const [selectedDetail, setSelectedDetail] = useState<DbModelDetail | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 基础字段 - 使用 tableFieldConfigs 配置的所有字段
  const basicTableFields = tableFieldConfigs.model_details.filter(f => f !== 'created_at' && f !== 'updated_at');

  const visibleModelDetails = useMemo(() => {
    const q = modelDetailsSearchQuery.trim().toLowerCase();
    if (!q) return viewModelDetails;
    return viewModelDetails.filter((d) => {
      const name = (d.name ?? '').toLowerCase();
      const jm = String(d.jm_id ?? '');
      const modelJm = String(d.model_jm_id ?? '');
      const seriesJm = String(d.series_jm_id ?? '');
      return name.includes(q) || jm.includes(q) || modelJm.includes(q) || seriesJm.includes(q);
    });
  }, [modelDetailsSearchQuery, viewModelDetails]);

  // 批量操作状态
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // 批量选择控制
  const handleSelectAll = () => {
    if (selectedIds.length === visibleModelDetails.length) {
      handleClearSelection();
    } else {
      setSelectedIds(visibleModelDetails.map(d => d.id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleSelectId = (id: string) => {
    setSelectedIds(prev => [...prev, id]);
  };

  const handleUnselectId = (id: string) => {
    setSelectedIds(prev => prev.filter(i => i !== id));
  };

  // 批量更新操作
  const handleBatchUpdate = async (status: number) => {
    if (selectedIds.length === 0) return;
    for (const id of selectedIds) {
      stageUpdate(id, 'activity_status' as any, status);
    }
  };

  // 计算是否全选
  const isAllSelected = visibleModelDetails.length > 0 && selectedIds.length === visibleModelDetails.length;

  function isRowDeleted(id: string) {
    return stagedItems.some(it => it.tableName === 'model_details' && it.op === 'delete' && it.id === id);
  }

  function applyStagedToModelDetails(base: DbModelDetail[], staged: StagedItem[]): DbModelDetail[] {
    let rows = [...base];
    const inserts = staged.filter(it => it.tableName === 'model_details' && it.op === 'insert');
    for (const it of inserts) {
      const data = it.data || {};
      rows.unshift({
        id: it.key,
        jm_id: Number(data.jm_id ?? 0),
        model_jm_id: Number(data.model_jm_id ?? 0),
        model_id: data.model_id ?? null,
        series_jm_id: Number(data.series_jm_id ?? 0),
        series_id: data.series_id ?? null,
        brand_jm_id: Number(data.brand_jm_id ?? 0),
        brand_id: data.brand_id ?? null,
        brand_name: data.brand_name ?? null,
        series_name: data.series_name ?? null,
        name: String(data.name ?? ''),
        brandname: data.brandname ?? null,
        parentname: data.parentname ?? null,
        parentid: data.parentid ?? null,
        groupid: data.groupid ?? null,
        groupname: data.groupname ?? null,
        environmentalstandards: data.environmentalstandards ?? null,
        environmentalstandards2: data.environmentalstandards2 ?? null,
        displacement: data.displacement ?? null,
        displacement2: data.displacement2 ?? null,
        drivemode: data.drivemode ?? null,
        drivemode2: data.drivemode2 ?? null,
        sizetype: data.sizetype ?? null,
        price: data.price ?? null,
        logo_url: data.logo_url ?? null,
        initial: data.initial ?? null,
        productionstate: data.productionstate ?? null,
        salestate: data.salestate ?? null,
        yeartype: data.yeartype ?? null,
        listdate: data.listdate ?? null,
        seatnum: data.seatnum ?? null,
        depth: Number(data.depth ?? 4),
        geartype: data.geartype ?? null,
        geartype2: data.geartype2 ?? null,
        gearnum: data.gearnum ?? null,
        compartnum: data.compartnum ?? null,
        activity_status: Number(data.activity_status ?? 0),
        activity_status_manual: true,
        raw: data.raw ?? null,
        created_at: '',
        updated_at: '',
      });
    }
    const updates = staged.filter(it => it.tableName === 'model_details' && it.op === 'update' && it.id);
    for (const it of updates) {
      rows = rows.map(r => (r.id === it.id ? ({ ...r, ...(it.changes || {}) } as any) : r));
    }
    return rows;
  }

  function stageUpdate(rowId: string, field: keyof DbModelDetail, value: any) {
    setViewModelDetails(prev => prev.map(r => (r.id === rowId ? ({ ...r, [field]: value } as any) : r)));
    setStagedItems(prev => {
      const existing = prev.find(it => it.key === rowId && it.tableName === 'model_details');
      const isTemp = rowId.startsWith('tmp_');
      if (isTemp) {
        const data = { ...(existing?.data || {}), [field]: value };
        const next: StagedItem = { key: rowId, op: 'insert', tableName: 'model_details', data };
        return [...prev.filter(it => !(it.key === rowId && it.tableName === 'model_details')), next];
      }

      const original = dbModelDetails.find(d => d.id === rowId) as any;
      const originalValue = original ? original[field] : undefined;
      const changed = JSON.stringify(originalValue ?? null) !== JSON.stringify(value ?? null);

      if (!changed) {
        if (existing?.op === 'update') {
          const nextChanges = { ...(existing.changes || {}) };
          delete nextChanges[field as string];
          if (Object.keys(nextChanges).length === 0) {
            return prev.filter(it => !(it.key === rowId && it.tableName === 'model_details'));
          }
          const next: StagedItem = { ...existing, changes: nextChanges };
          return [...prev.filter(it => !(it.key === rowId && it.tableName === 'model_details')), next];
        }
        return prev;
      }

      const baseChanges = existing?.op === 'update' ? (existing.changes || {}) : {};
      const nextChanges: Record<string, any> = { ...baseChanges, [field]: value };
      if (field === 'activity_status') {
        nextChanges.activity_status_manual = true;
      }
      const next: StagedItem = { key: rowId, op: 'update', tableName: 'model_details', id: rowId, changes: nextChanges };
      return [...prev.filter(it => !(it.key === rowId && it.tableName === 'model_details')), next];
    });
  }

  function addNewRow() {
    const tempId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const row: DbModelDetail = {
      id: tempId,
      jm_id: 0,
      model_jm_id: 0,
      model_id: null,
      series_jm_id: 0,
      series_id: null,
      brand_jm_id: 0,
      brand_id: null,
      brand_name: null,
      series_name: null,
      name: '',
      brandname: null,
      parentname: null,
      parentid: null,
      groupid: null,
      groupname: null,
      environmentalstandards: null,
      environmentalstandards2: null,
      displacement: null,
      displacement2: null,
      drivemode: null,
      drivemode2: null,
      sizetype: null,
      price: null,
      logo_url: null,
      initial: null,
      productionstate: null,
      salestate: null,
      yeartype: null,
      listdate: null,
      seatnum: null,
      depth: 4,
      geartype: null,
      geartype2: null,
      gearnum: null,
      compartnum: null,
      activity_status: 0,
      activity_status_manual: true,
      hot_sale: false,
      raw: null,
      created_at: '',
      updated_at: '',
    };
    setViewModelDetails(prev => [row, ...prev]);
    setStagedItems(prev => [...prev, { key: tempId, op: 'insert', tableName: 'model_details', data: { ...row, id: undefined, created_at: undefined, updated_at: undefined, activity_status_manual: true } }]);
  }

  function toggleDeleteRow(rowId: string) {
    const isTemp = rowId.startsWith('tmp_');
    if (isTemp) {
      setViewModelDetails(prev => prev.filter(r => r.id !== rowId));
      setStagedItems(prev => prev.filter(it => !(it.key === rowId && it.tableName === 'model_details')));
      setSelectedIds(prev => prev.filter(id => id !== rowId));
      return;
    }

    setStagedItems(prev => {
      const existing = prev.find(it => it.tableName === 'model_details' && it.key === rowId);
      if (existing?.op === 'delete') {
        return prev.filter(it => !(it.tableName === 'model_details' && it.key === rowId));
      }
      return [...prev.filter(it => !(it.tableName === 'model_details' && it.key === rowId)), { key: rowId, op: 'delete', tableName: 'model_details', id: rowId }];
    });
  }

  function discardAllChanges() {
    if (stagedItems.length === 0) return;
    const ok = window.confirm('将撤销当前未提交的全部修改，是否继续？');
    if (!ok) return;
    setStagedItems([]);
    setSelectedIds([]);
    setViewModelDetails([...dbModelDetails]);
  }

  async function commitAllChanges() {
    if (stagedItems.length === 0) return;
    const ok = window.confirm(`将提交 ${stagedItems.length} 条变更到数据库，是否继续？`);
    if (!ok) return;
    setCommitBusy(true);
    setError(null);

    const items = stagedItems.filter(it => it.tableName === 'model_details');
    const inserts = items.filter(it => it.op === 'insert');
    const updates = items.filter(it => it.op === 'update');
    const deletes = items.filter(it => it.op === 'delete');
    const failed: StagedItem[] = [];

    try {
      for (const it of inserts) {
        const data = it.data || {};
        const payload: any = {
          jm_id: Number(data.jm_id),
          model_jm_id: Number(data.model_jm_id),
          model_id: data.model_id || null,
          series_jm_id: Number(data.series_jm_id),
          series_id: data.series_id || null,
          brand_jm_id: Number(data.brand_jm_id),
          brand_id: data.brand_id || null,
          name: String(data.name || ''),
          yeartype: data.yeartype || null,
          price: data.price || null,
          salestate: data.salestate || null,
          productionstate: data.productionstate || null,
          depth: Number(data.depth ?? 4),
          activity_status: Number(data.activity_status ?? 0),
          activity_status_manual: true,
          hot_sale: Boolean(data.hot_sale ?? false),
          raw: data.raw ?? null,
        };
        if (!payload.jm_id || !payload.model_jm_id || !payload.series_jm_id || !payload.brand_jm_id || !payload.name) {
          failed.push(it);
          continue;
        }
        const { error: insertError } = await supabase.from('model_details').insert(payload);
        if (insertError) failed.push(it);
      }

      for (const it of updates) {
        const id = it.id;
        if (!id) {
          failed.push(it);
          continue;
        }
        const changes = it.changes || {};
        const { error: updateError } = await supabase.from('model_details').update(changes).eq('id', id);
        if (updateError) failed.push(it);
      }

      for (const it of deletes) {
        const id = it.id;
        if (!id) {
          failed.push(it);
          continue;
        }
        const { error: deleteError } = await supabase.from('model_details').delete().eq('id', id);
        if (deleteError) failed.push(it);
      }

      setStagedItems(failed);
      await loadDbModelDetails(failed);
      if (failed.length === 0) {
        setImportResult('数据库更新成功');
      } else {
        setError(`有 ${failed.length} 条变更提交失败，请检查字段或权限后重试。`);
      }
    } finally {
      setCommitBusy(false);
    }
  }

  async function loadDbBrands() {
    setDbBrandsLoading(true);
    setError(null);
    try {
      let query = supabase.from('brands').select('*').eq('depth', 1);
      if (onlyNormalModels) {
        query = query.eq('activity_status', 0);
      }
      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      setDbBrands(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载品牌数据库失败');
    } finally {
      setDbBrandsLoading(false);
    }
  }

  async function loadDbSeries() {
    if (!selectedBrandId) {
      setDbSeries([]);
      return;
    }
    setDbSeriesLoading(true);
    setError(null);
    try {
      let query = supabase.from('series').select('*').eq('brand_jm_id', selectedBrandId);
      if (onlyNormalModels) {
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

  async function loadDbModels(nextOnlyNormalModels: boolean = onlyNormalModels) {
    if (!selectedSeriesId) {
      setDbModels([]);
      return;
    }
    setDbModelsLoading(true);
    setError(null);
    try {
      let query = supabase
        .from('models_jumdata')
        .select('*')
        .eq('series_jm_id', selectedSeriesId);

      if (nextOnlyNormalModels) {
        query = query.eq('activity_status', 0);
      }

      const { data, error } = await query.order('name', { ascending: true });

      if (error) throw error;
      setDbModels(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载车型数据库失败');
    } finally {
      setDbModelsLoading(false);
    }
  }

  async function loadDbModelDetails(nextStaged?: StagedItem[]) {
    setDbModelDetailsLoading(true);
    setError(null);
    try {
      const { data: brandsData } = await supabase.from('brands').select('*').limit(500);
      const brandMap = new Map((brandsData || []).map(b => [b.jm_id, b.name]));

      const { data: seriesData } = await supabase.from('series').select('*').limit(500);
      const seriesMap = new Map((seriesData || []).map(s => [s.jm_id, s.name]));

      const { data, error } = await supabase
        .from('model_details')
        .select('*')
        .order('jm_id', { ascending: true });

      if (error) throw error;
      const detailsWithNames = (data || []).map(detail => ({
        ...detail,
        brand_name: brandMap.get(detail.brand_jm_id) || null,
        series_name: seriesMap.get(detail.series_jm_id) || null,
        activity_status: detail.activity_status ?? 0,
        hot_sale: detail.hot_sale ?? false,
      }));
      setDbModelDetails(detailsWithNames);
      setViewModelDetails(applyStagedToModelDetails(detailsWithNames as any, nextStaged ?? stagedItems));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载车型详细信息数据库失败');
    } finally {
      setDbModelDetailsLoading(false);
    }
  }

  // 数据库诊断功能
  async function checkDatabaseStatus() {
    setError(null);
    try {
      const results: Record<string, string> = {};

      // 检查 brands 表
      try {
        const { count, error: brandsError } = await supabase
          .from('brands')
          .select('*', { count: 'exact', head: true });
        if (brandsError) {
          results['Brands'] = `❌ 错误: ${brandsError.message}`;
        } else {
          results['Brands'] = `✅ ${count || 0} 条`;
        }
      } catch (e) {
        results['Brands'] = `❌ 异常: ${e instanceof Error ? e.message : String(e)}`;
      }

      // 检查 series 表
      try {
        const { count, error: seriesError } = await supabase
          .from('series')
          .select('*', { count: 'exact', head: true });
        if (seriesError) {
          results['Series'] = `❌ 错误: ${seriesError.message}`;
        } else {
          results['Series'] = `✅ ${count || 0} 条`;
        }
      } catch (e) {
        results['Series'] = `❌ 异常: ${e instanceof Error ? e.message : String(e)}`;
      }

      // 检查 models_jumdata 表
      try {
        const { count, error: modelsError } = await supabase
          .from('models_jumdata')
          .select('*', { count: 'exact', head: true });
        if (modelsError) {
          results['Models'] = `❌ 错误: ${modelsError.message}`;
        } else {
          results['Models'] = `✅ ${count || 0} 条`;
        }
      } catch (e) {
        results['Models'] = `❌ 异常: ${e instanceof Error ? e.message : String(e)}`;
      }

      // 检查 model_details 表
      try {
        const { count, error: detailsError } = await supabase
          .from('model_details')
          .select('*', { count: 'exact', head: true });
        if (detailsError) {
          results['Model_details'] = `❌ 错误: ${detailsError.message}`;
        } else {
          results['Model_details'] = `✅ ${count || 0} 条`;
        }
      } catch (e) {
        results['Model_details'] = `❌ 异常: ${e instanceof Error ? e.message : String(e)}`;
      }

      // 格式化结果
      const statusMessage = `
🔍 数据库诊断结果:
${Object.entries(results)
  .map(([table, status]) => `- ${table} 表: ${status}`)
  .join('\n')}

📊 诊断完成时间: ${new Date().toLocaleString()}
      `.trim();

      alert(statusMessage);

    } catch (e) {
      const errorMsg = `数据库诊断失败: ${e instanceof Error ? e.message : String(e)}`;
      setError(errorMsg);
      alert(errorMsg);
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

  const filteredModels = modelSearchQuery.trim() === ""
    ? dbModels
    : dbModels.filter(model =>
        model.name.toLowerCase().includes(modelSearchQuery.toLowerCase())
      );

  async function fetchModelDetailsFromApi(modelId: number) {
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
    formData.append("modelId", modelId.toString());

    const response = await fetch("https://api.jumdata.com/vehicle/query/detail", {
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
    return result.data as any;
  }

  async function upsertModelDetailsToDb(detailData: any, modelDb: DbModel, seriesDb: DbSeries, brandDb: DbBrand) {
    const { data: existing, error: checkErr } = await supabase
      .from("model_details")
      .select("id")
      .eq("jm_id", detailData.id)
      .maybeSingle();
    if (checkErr) throw checkErr;

    let validFields: string[] = [
      'id', 'jm_id', 'model_jm_id', 'model_id', 'series_jm_id', 'series_id', 'brand_jm_id', 'brand_id',
      'brand_name', 'series_name',
      'name', 'brandname', 'parentname', 'parentid', 'groupid', 'groupname', 'environmentalstandards',
      'environmentalstandards2', 'displacement', 'displacement2', 'drivemode', 'drivemode2', 'sizetype',
      'price', 'logo_url', 'initial', 'productionstate', 'salestate', 'yeartype', 'listdate', 'seatnum',
      'depth', 'geartype', 'geartype2', 'gearnum', 'compartnum', 'activity_status',
      'activity_status_manual', 'raw'
    ];

    try {
      const { data: dbFields } = await supabase.rpc('get_table_columns', { table_name: 'model_details' });
      if (dbFields && dbFields.length > 0) {
        validFields = dbFields.map((f: any) => f.column_name);
      }
    } catch {
    }

    const pick = (obj: any, keys: string[]) => {
      for (const k of keys) {
        if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
      }
      return null;
    };

    const insertData: any = {
      jm_id: detailData.id,
      model_jm_id: modelDb.jm_id,
      model_id: modelDb.id,
      series_jm_id: seriesDb.jm_id,
      series_id: seriesDb.id,
      brand_jm_id: brandDb.jm_id,
      brand_id: brandDb.id,
      brand_name: brandDb.name,
      series_name: seriesDb.name,
      name: detailData.name,
      brandname: detailData.brandname,
      parentname: detailData.parentname,
      parentid: detailData.parentid,
      groupid: detailData.groupid,
      groupname: detailData.groupname,
      environmentalstandards: detailData.environmentalstandards,
      environmentalstandards2: detailData.environmentalstandards2,
      displacement: detailData.displacement,
      displacement2: detailData.displacement2,
      drivemode: detailData.drivemode,
      drivemode2: detailData.drivemode2,
      sizetype: detailData.sizetype,
      price: detailData.price,
      logo_url: (() => {
        const v = String(pick(detailData, ['logo', '图片']) || seriesDb.logo_url || '').replace(/`/g, '').trim();
        return v.length > 0 ? v : null;
      })(),
      initial: detailData.initial,
      productionstate: detailData.productionstate,
      salestate: detailData.salestate,
      yeartype: detailData.yeartype,
      listdate: detailData.listdate,
      seatnum: detailData.seatnum,
      depth: detailData.depth,
      geartype: detailData.geartype,
      geartype2: detailData.geartype2,
      gearnum: detailData.gearnum,
      compartnum: detailData.compartnum,
      raw: detailData,
    };

    const requiredFields = ['jm_id', 'model_jm_id', 'series_jm_id', 'brand_jm_id', 'name'];
    const missingFields = requiredFields.filter(field => insertData[field] === null || insertData[field] === undefined);
    if (missingFields.length > 0) {
      throw new Error(`缺少必要字段: ${missingFields.join(', ')}`);
    }

    const filteredData: any = {};
    Object.keys(insertData).forEach(key => {
      const value = insertData[key];
      if (value !== undefined && value !== null && validFields.includes(key)) {
        filteredData[key] = value;
      }
    });

    if (!existing) {
      const { error: insertErr } = await supabase.from("model_details").insert([filteredData]);
      if (insertErr) throw insertErr;
      return 'insert' as const;
    }

    const { error: updateErr } = await supabase
      .from("model_details")
      .update(filteredData)
      .eq("jm_id", detailData.id);
    if (updateErr) throw updateErr;
    return 'update' as const;
  }

  async function batchQueryAndImport() {
    if (batchBusy) return;
    if (!jmAppId || !jmAppSecret) {
      setError("请先前往设置页面配置聚美智数的 App ID 和 App Secret");
      return;
    }
    if (!onlyNormalModels) {
      setError("请先开启顶部“只加载正常”，再使用批量查询并导入。");
      return;
    }
    if (!selectedSeriesId || !selectedBrandId) {
      setError("请先选择品牌和车系");
      return;
    }

    if (dbModelsLoading) {
      setError("车型列表加载中，请稍后再试");
      return;
    }

    const candidates = filteredModels.filter(m => m && typeof m.jm_id === 'number' && m.jm_id > 0);
    if (candidates.length === 0) {
      setError("当前没有可批量查询的车型");
      return;
    }

    setError(null);
    setImportResult(null);
    setBatchPlanOpen(true);
    setBatchPlanLoading(true);
    setBatchPlanItems([]);

    try {
      const existingIds = new Set<number>();
      let from = 0;
      const pageSize = 5000;
      while (true) {
        const { data, error } = await supabase
          .from('model_details')
          .select('jm_id')
          .eq('series_jm_id', selectedSeriesId)
          .range(from, from + pageSize - 1);
        if (error) throw error;
        const rows = (data || []) as Array<{ jm_id: number }>;
        for (const r of rows) {
          if (typeof r.jm_id === 'number') existingIds.add(r.jm_id);
        }
        if (rows.length < pageSize) break;
        from += pageSize;
      }

      const items: BatchImportPlanItem[] = candidates.map(m => {
        const exists = existingIds.has(m.jm_id);
        return {
          id: m.jm_id,
          title: m.name || String(m.jm_id),
          subtitle: selectedSeriesDb?.name ? `车系：${selectedSeriesDb.name}` : undefined,
          exists,
          enabled: !exists,
        };
      });
      setBatchPlanItems(items);
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
    if (enabledItems.length === 0) return;

    const ok = window.confirm(`将导入 ${enabledItems.length} 个车型的详细信息（不预览），是否继续？`);
    if (!ok) return;

    setBatchPlanOpen(false);
    setBatchBusy(true);
    setBatchCancelRequested(false);
    batchCancelRef.current = false;
    setBatchTotal(enabledItems.length);
    setBatchCurrent(0);
    setBatchCurrentName(null);
    setBatchInserted(0);
    setBatchUpdated(0);
    setBatchFailed(0);
    setBatchLastError(null);

    const idSet = new Set(enabledItems.map(i => Number(i.id)));
    const candidates = filteredModels.filter(m => idSet.has(Number(m.jm_id)));

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    try {
      let processed = 0;
      for (let i = 0; i < candidates.length; i++) {
        if (batchCancelRef.current) break;
        const model = candidates[i];
        processed = i + 1;
        setBatchCurrent(i + 1);
        setBatchCurrentName(model.name || String(model.jm_id));

        const seriesDb = dbSeries.find(s => s.jm_id === model.series_jm_id);
        const brandDb = dbBrands.find(b => b.jm_id === model.brand_jm_id);
        if (!seriesDb || !brandDb) {
          failed++;
          setBatchFailed(failed);
          setBatchLastError(`缺少品牌/车系数据: model_jm_id=${model.jm_id}`);
          continue;
        }

        try {
          const detailData = await fetchModelDetailsFromApi(model.jm_id);
          const res = await upsertModelDetailsToDb(detailData, model, seriesDb, brandDb);
          if (res === 'insert') {
            inserted++;
            setBatchInserted(inserted);
          } else {
            updated++;
            setBatchUpdated(updated);
          }
        } catch (e) {
          failed++;
          setBatchFailed(failed);
          const msg = e instanceof Error ? e.message : String(e);
          setBatchLastError(`${model.name || model.jm_id}: ${msg}`);
        }

        await new Promise(r => setTimeout(r, 120));
      }

      const cancelled = batchCancelRef.current;
      const summary = `${cancelled ? '已取消' : '完成'}：共 ${processed}/${candidates.length}，新增 ${inserted}，更新 ${updated}，失败 ${failed}`;
      setImportResult(summary);
      await loadDbModelDetails();
      await loadDbModels();
    } finally {
      setBatchBusy(false);
      setBatchCurrentName(null);
    }
  }

  async function queryModelDetailsFromApi() {
    if (!jmAppId || !jmAppSecret) {
      setError("请先前往设置页面配置聚美智数的 App ID 和 App Secret");
      return;
    }
    if (!selectedModelId) {
      setError("请选择车型");
      return;
    }

    const ok = await confirmJumdataQueryIfExists({
      supabase,
      table: 'model_details',
      where: (q) => q.eq('jm_id', selectedModelId),
      subjectLabel: '车型详情',
      extraHint: '选择“取消”将停止本次查询。',
    });
    if (!ok) return;

    const selectedModel = dbModels.find(m => m.jm_id === selectedModelId);
    if (!selectedModel) {
      setError("未找到选中的车型");
      return;
    }
    const selectedSeries = dbSeries.find(s => s.jm_id === selectedModel.series_jm_id);
    if (!selectedSeries) {
      setError("未找到对应的车系");
      return;
    }
    const selectedBrand = dbBrands.find(b => b.jm_id === selectedModel.brand_jm_id);
    if (!selectedBrand) {
      setError("未找到对应的品牌");
      return;
    }
    setSelectedModelDb(selectedModel);
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
      formData.append("modelId", selectedModelId.toString());

      const response = await fetch("https://api.jumdata.com/vehicle/query/detail", {
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

      const detailData: any = result.data;
      setQueryResult(detailData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "查询失败");
    } finally {
      setQueryLoading(false);
    }
  }

  // 检查数据库中实际存在的字段
  async function checkDatabaseFields() {
    try {
      const { data, error } = await supabase
        .rpc('get_table_columns', { table_name: 'model_details' });
      
      if (error) {
        return null;
      }
      
      return data;
    } catch (err) {
      return null;
    }
  }

  async function importModelDetails() {
    if (!queryResult || !selectedModelDb || !selectedSeriesDb || !selectedBrandDb) return;
    setLoading(true);
    setError(null);
    setImportProgress(0);
    setChangeLogs([]);

    const logs: ModelDetailChangeLog[] = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;

    try {
      const { data: existing, error: checkErr } = await supabase
        .from("model_details")
        .select("*")
        .eq("jm_id", queryResult.id)
        .maybeSingle();

      if (checkErr) {
        throw checkErr;
      }

      // 预定义的数据库字段列表（后备方案）
      let validFields: string[] = [
        'id', 'jm_id', 'model_jm_id', 'model_id', 'series_jm_id', 'series_id', 'brand_jm_id', 'brand_id',
        'name', 'brandname', 'parentname', 'parentid', 'groupid', 'groupname', 'environmentalstandards',
        'environmentalstandards2', 'displacement', 'displacement2', 'drivemode', 'drivemode2', 'sizetype',
        'price', 'logo_url', 'initial', 'productionstate', 'salestate', 'yeartype', 'listdate', 'seatnum',
        'depth', 'geartype', 'geartype2', 'gearnum', 'compartnum', 'activity_status',
        'activity_status_manual', 'raw'
      ];
      
      try {
        const { data: dbFields } = await supabase.rpc('get_table_columns', { table_name: 'model_details' });
        if (dbFields && dbFields.length > 0) {
          validFields = dbFields.map((f: any) => f.column_name);
        } else {
        }
      } catch (err) {
      }

      const pick = (obj: any, keys: string[]) => {
        for (const k of keys) {
          if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
        }
        return null;
      };
      
      // 从 queryResult 提取并组织数据
      const insertData: any = {
        jm_id: queryResult.id,
        model_jm_id: selectedModelDb.jm_id,
        model_id: selectedModelDb.id,
        series_jm_id: selectedSeriesDb.jm_id,
        series_id: selectedSeriesDb.id,
        brand_jm_id: selectedBrandDb.jm_id,
        brand_id: selectedBrandDb.id,
        name: queryResult.name,
        brandname: queryResult.brandname,
        parentname: queryResult.parentname,
        parentid: queryResult.parentid,
        groupid: queryResult.groupid,
        groupname: queryResult.groupname,
        environmentalstandards: queryResult.environmentalstandards,
        environmentalstandards2: queryResult.environmentalstandards2,
        displacement: queryResult.displacement,
        displacement2: queryResult.displacement2,
        drivemode: queryResult.drivemode,
        drivemode2: queryResult.drivemode2,
        sizetype: queryResult.sizetype,
        price: queryResult.price,
        logo_url: (() => {
          const v = String(pick(queryResult, ['logo', '图片']) || selectedSeriesDb.logo_url || '').replace(/`/g, '').trim();
          return v.length > 0 ? v : null;
        })(),
        initial: queryResult.initial,
        productionstate: queryResult.productionstate,
        salestate: queryResult.salestate,
        yeartype: queryResult.yeartype,
        listdate: queryResult.listdate,
        seatnum: queryResult.seatnum,
        depth: queryResult.depth,
        geartype: queryResult.geartype,
        geartype2: queryResult.geartype2,
        gearnum: queryResult.gearnum,
        compartnum: queryResult.compartnum,
        raw: queryResult,
      };

      // 验证必要字段
      const requiredFields = ['jm_id', 'model_jm_id', 'series_jm_id', 'brand_jm_id', 'name'];
      const missingFields = requiredFields.filter(field => insertData[field] === null || insertData[field] === undefined);
      if (missingFields.length > 0) {
        throw new Error(`缺少必要字段: ${missingFields.join(', ')}`);
      }

      // 只保留数据库中实际存在且有值的字段
      const filteredData: any = {};
      Object.keys(insertData).forEach(key => {
        const value = insertData[key];
        // 只保留不为 undefined、null，且在 validFields 中的字段
        if (value !== undefined && value !== null && validFields.includes(key)) {
          filteredData[key] = value;
        }
      });
      
      // 清理原始数据，只保留过滤后的字段
      Object.keys(insertData).forEach(key => delete insertData[key]);
      Object.assign(insertData, filteredData);

      if (!existing) {
        const { error: insertErr } = await supabase.from("model_details").insert([insertData]);

        if (insertErr) {
          setError(`插入失败: ${insertErr.message} (${insertErr.code}) - ${insertErr.details}${insertErr.hint ? ' 提示: ' + insertErr.hint : ''}`);
          skipped++;
        } else {
          inserted++;
          logs.push({ action: 'insert', jm_id: queryResult.id, name: queryResult.name });
        }
      } else {
        const { error: updateErr } = await supabase
          .from("model_details")
          .update(insertData)
          .eq("jm_id", queryResult.id);

        if (updateErr) {
          setError(`更新失败: ${updateErr.message} (${updateErr.code}) - ${updateErr.details}${updateErr.hint ? ' 提示: ' + updateErr.hint : ''}`);
          skipped++;
        } else {
          updated++;
          logs.push({ action: 'update', jm_id: queryResult.id, name: queryResult.name });
        }
      }

      setImportProgress(100);

      setChangeLogs(logs);
      setImportResult(`导入完成: 新增 ${inserted} 个，更新 ${updated} 个，跳过 ${skipped} 个`);

      if (inserted > 0 || updated > 0) {
        setActiveTab('log-view');
        loadDbModelDetails();
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
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h3 className="text-2xl font-bold text-zinc-900">聚美智数车型详细信息导入</h3>
          <p className="mt-2 text-base text-zinc-500">
            从聚美智数 API 查询车型详细信息，预览后再导入数据库
          </p>
        </div>
        <label className="shrink-0 inline-flex items-center gap-3 select-none">
          <span className="text-sm text-zinc-600">只加载正常</span>
          <button
            type="button"
            onClick={async () => {
              const next = !onlyNormalModels;
              setOnlyNormalModels(next);
              setSelectedBrandId(null);
              setSelectedSeriesId(null);
              setSelectedModelId(null);
              setSelectedBrandDb(null);
              setSelectedSeriesDb(null);
              setSelectedModelDb(null);
              setDbSeries([]);
              setDbModels([]);
              await loadDbBrands();
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
              onlyNormalModels ? "bg-blue-600" : "bg-zinc-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${
                onlyNormalModels ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </label>
      </div>

      <div className="mt-6 flex gap-2 border-b border-zinc-200 pb-2">
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
            loadDbModelDetails();
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

              <div className="mt-6 grid gap-6 sm:grid-cols-3">
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
                        <div className="max-h-32 overflow-auto rounded-xl border border-zinc-200">
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
                                      setSelectedModelId(null);
                                      setSelectedSeriesDb(null);
                                      setSelectedModelDb(null);
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
                                          className="h-6 w-6 rounded object-contain"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div>
                                        <div className="font-medium text-sm">{brand.name}</div>
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
                        <input
                          type="text"
                          value={seriesSearchQuery}
                          onChange={(e) => setSeriesSearchQuery(e.target.value)}
                          placeholder="搜索车系名称..."
                          className="block w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
                        />
                        <div className="max-h-32 overflow-auto rounded-xl border border-zinc-200">
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
                                      setSelectedModelId(null);
                                      setSelectedModelDb(null);
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
                                          className="h-6 w-6 rounded object-contain"
                                          onError={(e) => {
                                            const img = e.target as HTMLImageElement;
                                            img.style.display = 'none';
                                          }}
                                        />
                                      )}
                                      <div>
                                        <div className="font-medium text-sm">{series.name}</div>
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
                  <div className="flex items-center justify-between gap-3">
                    <label className="block text-lg font-medium text-zinc-700">选择车型</label>
                    <button
                      type="button"
                      onClick={batchQueryAndImport}
                      disabled={!onlyNormalModels || batchBusy || dbModelsLoading || !selectedSeriesId || !jmAppId || !jmAppSecret}
                      className="inline-flex items-center justify-center rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                      title={!onlyNormalModels ? '请先开启顶部“只加载正常”' : undefined}
                    >
                      {batchBusy ? '批量导入中...' : '批量查询并导入'}
                    </button>
                  </div>
                  <div className="mt-2">
                    {!selectedSeriesId ? (
                      <div className="p-8 text-center text-sm text-zinc-500 rounded-xl border border-zinc-200">
                        请先选择车系
                      </div>
                    ) : (
                      <>
                        {!dbModels.length && !dbModelsLoading ? (
                          <button
                            type="button"
                            onClick={() => loadDbModels()}
                            className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-6 py-3 text-lg font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors"
                          >
                            加载车型列表
                          </button>
                        ) : (
                          <>
                            <input
                              type="text"
                              value={modelSearchQuery}
                              onChange={(e) => setModelSearchQuery(e.target.value)}
                              placeholder="搜索车型名称..."
                              className="block w-full rounded-xl border border-zinc-200 px-4 py-3 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 mb-3"
                            />
                            <div className="max-h-32 overflow-auto rounded-xl border border-zinc-200">
                              {dbModelsLoading ? (
                                <div className="p-8 text-center text-sm text-zinc-500">加载中...</div>
                              ) : filteredModels.length === 0 ? (
                                <div className="p-8 text-center text-sm text-zinc-500">未找到匹配的车型</div>
                              ) : (
                                <ul className="divide-y divide-zinc-100">
                                  {filteredModels.map((model) => (
                                    <li key={model.id}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setSelectedModelId(model.jm_id);
                                          setModelSearchQuery(model.name);
                                        }}
                                        className={`w-full px-4 py-3 text-left transition-colors ${
                                          selectedModelId === model.jm_id
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'hover:bg-zinc-50 text-zinc-900'
                                        }`}
                                      >
                                        <div className="flex items-center gap-3">
                                          {model.logo_url && (
                                            <img
                                              src={proxiedImageUrl(model.logo_url) || undefined}
                                              alt=""
                                              className="h-6 w-6 rounded object-contain"
                                              onError={(e) => {
                                                const img = e.target as HTMLImageElement;
                                                img.style.display = 'none';
                                              }}
                                            />
                                          )}
                                          <div>
                                            <div className="font-medium text-sm">{model.name}</div>
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
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={queryModelDetailsFromApi}
                  disabled={queryLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {queryLoading ? "查询中..." : "查询车型详细信息"}
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
                        {` · 新增 ${batchInserted} / 更新 ${batchUpdated} / 失败 ${batchFailed}`}
                      </div>
                      {batchLastError ? (
                        <div className="mt-1 text-xs text-red-600">最近失败：{batchLastError}</div>
                      ) : null}
                    </div>
                    {batchBusy ? (
                      <button
                        type="button"
                        onClick={() => {
                          setBatchCancelRequested(true);
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
                    查询结果 - {queryResult.name}
                  </h4>
                  <div className="flex items-center gap-2">
                    {queryResult.logo && (
                      <img
                        src={proxiedImageUrl(queryResult.logo) || undefined}
                        alt=""
                        className="h-10 w-10 rounded object-contain"
                        onError={(e) => {
                          const img = e.target as HTMLImageElement;
                          img.style.display = 'none';
                        }}
                      />
                    )}
                    <div className="text-right">
                      <div className="text-sm text-zinc-500">
                        {selectedBrandDb?.name} / {selectedSeriesDb?.name}
                      </div>
                      <div className="text-sm text-zinc-400">
                        {queryResult.yeartype} · {queryResult.price}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <details className="rounded-xl border border-zinc-200 overflow-hidden">
                    <summary className="cursor-pointer bg-zinc-50 px-4 py-3 font-semibold text-zinc-900">
                      原始 JSON（全部字段）
                    </summary>
                    <div className="p-4">
                      <pre className="whitespace-pre-wrap break-words text-xs text-zinc-700">{JSON.stringify(queryResult, null, 2)}</pre>
                    </div>
                  </details>

                  <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
                    <table className="min-w-full divide-y divide-zinc-200">
                      <thead className="bg-zinc-50 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">字段</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">值</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100 bg-white">
                        {Object.entries(queryResult)
                          .filter(([key]) => typeof queryResult[key] !== 'object' || queryResult[key] === null)
                          .map(([key, value]) => (
                            <tr key={key} className="hover:bg-zinc-50">
                              <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{getFieldLabel(key)}</td>
                              <td className="px-4 py-3 text-sm text-zinc-600">
                                {key === 'logo' ? null : renderFieldValue(value)}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>

                  {Object.entries(queryResult)
                    .filter(([key]) => typeof queryResult[key] === 'object' && queryResult[key] !== null)
                    .map(([key, value]) => {
                      const isArray = Array.isArray(value);
                      const entries = isArray
                        ? (value as any[]).map((item, idx) => [String(idx), item] as const)
                        : Object.entries(value as Record<string, any>);

                      return (
                        <div key={key} className="rounded-xl border border-zinc-200 overflow-hidden">
                          <div className="bg-zinc-50 px-4 py-3">
                            <h5 className="font-semibold text-zinc-900">{getFieldLabel(key)}</h5>
                          </div>
                          <div className="p-4">
                            <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                              {entries.map(([subKey, subValue]) => (
                                <div key={subKey} className="flex gap-2">
                                  <span className="font-medium text-zinc-700 text-sm whitespace-nowrap">
                                    {isArray ? `[${subKey}]` : `${getFieldLabel(subKey, key)}:`}
                                  </span>
                                  <span className="text-zinc-600 text-sm">{renderFieldValue(subValue, isArray ? key : subKey)}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
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
                  onClick={importModelDetails}
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
              数据库车型详细信息列表（共 {visibleModelDetails.length} 条）
            </h4>
            <div className="flex items-center gap-2">
              <input
                value={modelDetailsSearchQuery}
                onChange={(e) => setModelDetailsSearchQuery(e.target.value)}
                placeholder="搜索车型名 / JM ID / 车型JMID / 车系JMID"
                className="w-72 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={checkDatabaseStatus}
                className="inline-flex items-center gap-2 rounded-xl bg-purple-100 px-4 py-2 text-sm font-semibold text-purple-700 hover:bg-purple-200 transition-colors"
              >
                🔍 数据库诊断
              </button>
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
                      await loadDbModels();
                      await loadDbModelDetails([]);
                      return;
                    }
                    await loadDbBrands();
                    await loadDbSeries();
                    await loadDbModels();
                    await loadDbModelDetails();
                  })();
                }}
                disabled={dbModelDetailsLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {dbModelDetailsLoading ? '加载中...' : '刷新'}
              </button>
            </div>
          </div>

          <StagedCrudToolbar
            title="本地暂存"
            stagedItems={stagedItems.filter(it => it.tableName === 'model_details')}
            busy={commitBusy}
            onAdd={addNewRow}
            onDiscardAll={discardAllChanges}
            onConfirm={commitAllChanges}
          />

          {/* 批量操作组件 */}
          <BatchOperations
            tableName="model_details"
            selectedIds={selectedIds}
            totalCount={visibleModelDetails.length}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onBatchUpdate={handleBatchUpdate}
            loading={dbModelDetailsLoading}
          />

          <BulkEditBar
            tableName="model_details"
            selectedIds={selectedIds}
            rows={visibleModelDetails}
            fields={tableFieldConfigs.model_details}
            busy={dbModelDetailsLoading || commitBusy}
            getLabel={(field) => getFieldLabel(field, undefined, 'model_details')}
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
                      disabled={dbModelDetailsLoading || dbModelDetails.length === 0}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {basicTableFields.map((field) => (
                    <th key={field} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {getFieldLabel(field, undefined, 'model_details')}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    操作
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {dbModelDetailsLoading ? (
                  <tr>
                    <td colSpan={basicTableFields.length + 2} className="px-4 py-8 text-center text-sm text-zinc-500">
                      加载中...
                    </td>
                  </tr>
                ) : visibleModelDetails.length === 0 ? (
                  <tr>
                    <td colSpan={basicTableFields.length + 2} className="px-4 py-8 text-center text-sm text-zinc-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  visibleModelDetails.map((detail) => {
                    const deleted = isRowDeleted(detail.id);
                    return (
                    <tr key={detail.id} className={`hover:bg-zinc-50 ${deleted ? 'opacity-60' : ''}`}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(detail.id)}
                          onChange={(e) => e.target.checked ? handleSelectId(detail.id) : handleUnselectId(detail.id)}
                          disabled={dbModelDetailsLoading}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      {basicTableFields.map((field) => {
                        // 特殊处理某些字段的显示
                        if (field === 'activity_status') {
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3">
                              {deleted ? (
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getActivityStatusColor(detail.activity_status)}`}>
                                  {getActivityStatusLabel(detail.activity_status)}
                                </span>
                              ) : (
                                <select
                                  value={detail.activity_status ?? 0}
                                  onChange={(e) => stageUpdate(detail.id, 'activity_status', Number(e.target.value))}
                                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                                >
                                  <option value={0}>正常</option>
                                  <option value={1}>不显示</option>
                                  <option value={2}>不可用</option>
                                </select>
                              )}
                            </td>
                          );
                        }

                        if (field === 'hot_sale') {
                          const checked = Boolean((detail as any).hot_sale);
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3">
                              {deleted ? (
                                <span className="text-sm text-zinc-600">{checked ? '是' : '否'}</span>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => stageUpdate(detail.id, 'hot_sale', !checked)}
                                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${checked ? 'bg-blue-600' : 'bg-zinc-200'}`}
                                  aria-pressed={checked}
                                >
                                  <span
                                    className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
                                  />
                                </button>
                              )}
                            </td>
                          );
                        }

                        if (field === 'jm_id' || field === 'brand_jm_id' || field === 'series_jm_id' || field === 'model_jm_id') {
                          const value = (detail as any)[field];
                          const editable = detail.id.startsWith('tmp_');
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                              {deleted || !editable ? (
                                value === null || value === undefined ? '-' : String(value)
                              ) : (
                                <input
                                  type="number"
                                  value={value ?? 0}
                                  onChange={(e) => stageUpdate(detail.id, field as any, Number(e.target.value))}
                                  className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                                />
                              )}
                            </td>
                          );
                        }

                        if (field === 'name') {
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3 text-sm text-zinc-900">
                              {deleted ? (
                                detail.name
                              ) : (
                                <input
                                  value={detail.name ?? ''}
                                  onChange={(e) => stageUpdate(detail.id, 'name', e.target.value)}
                                  className="w-72 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                                />
                              )}
                            </td>
                          );
                        }

                        if (field === 'yeartype' || field === 'price' || field === 'salestate' || field === 'productionstate') {
                          const value = (detail as any)[field];
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                              {deleted ? (
                                value === null || value === undefined || value === '' ? '-' : String(value)
                              ) : (
                                <input
                                  value={value ?? ''}
                                  onChange={(e) => stageUpdate(detail.id, field as any, e.target.value || null)}
                                  className={`rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm ${field === 'price' ? 'w-28' : 'w-24'}`}
                                />
                              )}
                            </td>
                          );
                        }

                        // 普通字段直接显示
                        // 优先从 detail 本身获取（已展平的字段），再从 raw 数据中获取嵌套字段
                        const value = (detail as any)[field];
                        const rawValue = value === null || value === undefined
                          ? ((detail as any).raw ? (detail as any).raw[field] ?? getNestedFieldValue((detail as any).raw, field) : undefined)
                          : undefined;
                        const displayValue = value ?? rawValue;
                        return (
                          <td key={field} className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                            {displayValue === null || displayValue === undefined ? '-' : typeof displayValue === 'object' ? JSON.stringify(displayValue) : String(displayValue)}
                          </td>
                        );
                      })}
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedDetail(detail);
                            setIsModalOpen(true);
                          }}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                        >
                          查看详情
                        </button>
                        <span className="mx-2 text-zinc-300">|</span>
                        <button
                          type="button"
                          onClick={() => toggleDeleteRow(detail.id)}
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
        <div className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {/* 详情弹窗 */}
      {isModalOpen && selectedDetail && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-6xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-zinc-200">
              <h3 className="text-xl font-bold text-zinc-900">
                车型详情 - {selectedDetail.name}
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedDetail(null);
                }}
                className="text-zinc-400 hover:text-zinc-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {(() => {
                const nestedData = (selectedDetail.raw ?? selectedDetail) as any;

                // 获取相关的品牌和车系信息用于显示
                const relatedBrand = dbBrands.find(b => b.jm_id === selectedDetail.brand_jm_id);
                const relatedSeries = dbSeries.find(s => s.jm_id === selectedDetail.series_jm_id);

                return (
                  <div className="space-y-4">
                    {/* 顶部信息展示 */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        {(nestedData.logo_url || nestedData.logo || nestedData['图片']) && (
                          <img
                            src={proxiedImageUrl(String(nestedData.logo_url || nestedData.logo || nestedData['图片']).replace(/`/g, '').trim()) || undefined}
                            alt=""
                            className="h-10 w-10 rounded object-contain"
                            onError={(e) => {
                              const img = e.target as HTMLImageElement;
                              img.style.display = 'none';
                            }}
                          />
                        )}
                        <div>
                          <div className="text-lg font-semibold text-zinc-900">
                            {selectedDetail.name}
                          </div>
                          <div className="text-sm text-zinc-500">
                            {relatedBrand?.name || selectedDetail.brandname || ''}
                            {relatedBrand?.name && relatedSeries?.name ? ' / ' : ''}
                            {relatedSeries?.name || selectedDetail.parentname || ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-zinc-500">
                          {selectedDetail.yeartype || '-'} · {selectedDetail.price || '-'}
                        </div>
                        <div className="text-sm text-zinc-400">
                          JM ID: {selectedDetail.jm_id}
                        </div>
                      </div>
                    </div>

                    {/* 基础字段表格 */}
                    <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
                      <table className="min-w-full divide-y divide-zinc-200">
                        <thead className="bg-zinc-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">字段</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">值</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {Object.entries(nestedData)
                            .filter(([key]) => typeof nestedData[key] !== 'object' || nestedData[key] === null)
                            .map(([key, value]) => (
                              <tr key={key} className="hover:bg-zinc-50">
                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{getFieldLabel(key)}</td>
                                <td className="px-4 py-3 text-sm text-zinc-600">
                                  {key === 'logo_url' ? null : renderFieldValue(value)}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>

                    {/* 嵌套对象/数组分组显示 */}
                    {Object.entries(nestedData)
                      .filter(([key]) => typeof nestedData[key] === 'object' && nestedData[key] !== null)
                      .map(([key, value]) => {
                        const isArray = Array.isArray(value);
                        const entries = isArray
                          ? (value as any[]).map((item, idx) => [String(idx), item] as const)
                          : Object.entries(value as Record<string, any>);

                        return (
                          <div key={key} className="rounded-xl border border-zinc-200 overflow-hidden">
                            <div className="bg-zinc-50 px-4 py-3">
                              <h5 className="font-semibold text-zinc-900">{getFieldLabel(key)}</h5>
                            </div>
                            <div className="p-4">
                              <div className="grid grid-cols-2 gap-x-6 gap-y-3">
                                {entries.map(([subKey, subValue]) => (
                                  <div key={subKey} className="flex gap-2">
                                    <span className="font-medium text-zinc-700 text-sm whitespace-nowrap">
                                      {isArray ? `[${subKey}]` : `${getFieldLabel(subKey, key)}:`}
                                    </span>
                                    <span className="text-zinc-600 text-sm">{renderFieldValue(subValue, isArray ? key : subKey)}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                );
              })()}
            </div>
            <div className="p-6 border-t border-zinc-200 flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedDetail(null);
                }}
                className="px-6 py-2 bg-zinc-100 text-zinc-700 rounded-lg hover:bg-zinc-200 transition-colors"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}

      <BatchImportPlanModal
        open={batchPlanOpen}
        title={`批量导入清单（车系：${selectedSeriesDb?.name || selectedSeriesId || '-'}）`}
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
