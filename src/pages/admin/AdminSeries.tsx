import { useEffect, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import BatchOperations from "@/components/admin/BatchOperations";
import StagedCrudToolbar from "@/components/admin/StagedCrudToolbar";
import BulkEditBar from "@/components/admin/BulkEditBar";
import { confirmJumdataQueryIfExists } from "@/utils/jumdataQueryGuard";
import { fieldLabels, tableFieldConfigs, getFieldLabel, getActivityStatusLabel, getActivityStatusColor } from "@/utils/fieldLabels";
import type { StagedItem } from "@/utils/stagedCrud";
import { proxiedImageUrl } from "@/utils/proxyUrl";
import { useEntityTranslation, TARGET_LOCALES } from "@/utils/useEntityTranslation";
import { LOCALE_LABELS } from "@/i18n/locales";

type JmSubcompany = {
  initial: string;
  name: string;
  id: number;
  list: JmSeries[];
};

type JmSeries = {
  depth: number;
  name: string;
  logo: string;
  id: number;
  fullname: string;
  salestate: string;
};

type DbBrand = {
  id: string;
  jm_id: number;
  name: string;
  initial: string | null;
  logo_url: string | null;
  parent_id: number;
  depth: number;
  activity_status?: number;
  created_at: string;
  updated_at: string;
};

type DbSeries = {
  id: string;
  jm_id: number;
  brand_jm_id: number;
  brand_id: string | null;
  brand_name: string | null;
  name: string;
  fullname: string | null;
  initial: string | null;
  logo_url: string | null;
  salestate: string | null;
  depth: number;
  subcompany_name: string | null;
  subcompany_jm_id: number | null;
  activity_status: number;
  created_at: string;
  updated_at: string;
};

type SeriesChangeLog = {
  action: 'insert' | 'update' | 'skip';
  jm_id: number;
  name: string;
  changes?: {
    field: string;
    old: string | null;
    new: string | null;
  }[];
};

export default function AdminSeries() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jmAppId = localStorage.getItem('jumdata_app_id') || "";
  const jmAppSecret = localStorage.getItem('jumdata_app_secret') || "";
  const [queryResult, setQueryResult] = useState<JmSubcompany[] | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [onlyNormalSeries, setOnlyNormalSeries] = useState<boolean>(() => {
    const v = localStorage.getItem('admin_series_only_normal');
    if (v === null) return true;
    return v === '1';
  });
  const [dbBrands, setDbBrands] = useState<DbBrand[]>([]);
  const [dbBrandsLoading, setDbBrandsLoading] = useState(false);
  const [dbSeries, setDbSeries] = useState<DbSeries[]>([]);
  const [viewSeries, setViewSeries] = useState<DbSeries[]>([]);
  const [dbSeriesLoading, setDbSeriesLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedBrandDb, setSelectedBrandDb] = useState<DbBrand | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'import' | 'db-view' | 'log-view'>('import');
  const [changeLogs, setChangeLogs] = useState<SeriesChangeLog[]>([]);

  useEffect(() => {
    localStorage.setItem('admin_series_only_normal', onlyNormalSeries ? '1' : '0');
  }, [onlyNormalSeries]);

  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [commitBusy, setCommitBusy] = useState(false);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Entity translation
  const { translating: transSeries, progress: transProgress, error: transError, setError: setTransError, translateEntities } = useEntityTranslation("series");
  const [transTargetLocales, setTransTargetLocales] = useState<string[]>([...TARGET_LOCALES]);
  const [showTransLocales, setShowTransLocales] = useState(false);

  function toggleTransLocale(loc: string) {
    setTransTargetLocales((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  }

  // 批量选择控制
  const handleSelectAll = () => {
    if (viewSeries.length > 0 && selectedIds.length === viewSeries.length) {
      handleClearSelection();
    } else {
      setSelectedIds(viewSeries.map(s => s.id));
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

  // 批量更新操作
  const handleBatchUpdate = async (status: number) => {
    if (selectedIds.length === 0) return;

    try {
      setError(null);

      // 首先检查该列是否存在，方法是尝试选择该列
      const { data: testData, error: testError } = await supabase
        .from('series')
        .select('id, activity_status')
        .limit(1);

      if (testError) {
        setError('批量更新功能需要数据库升级。请联系管理员添加 activity_status 列到数据库表中。');
        return;
      }

      const { data, error: updateErr } = await supabase
        .from('series')
        .update({ activity_status: status, activity_status_manual: true })
        .in('id', selectedIds)
        .select();

      if (updateErr) {
        if (updateErr.message?.includes('column') && updateErr.message?.includes('does not exist')) {
          setError(`数据库缺少 activity_status 列。请运行数据库迁移脚本添加该列。错误: ${updateErr.message}`);
        } else {
          throw updateErr;
        }
        return;
      }

      // 重新从数据库加载数据
      await loadDbSeries();

      setImportResult(`批量更新成功：已将 ${selectedIds.length} 个车系设置为"${getActivityStatusLabel(status)}"`);
      setActiveTab('log-view');
      handleClearSelection();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '批量更新失败';
      setError(errorMessage);
      // 不要向外抛出错误，避免组件崩溃
    }
  };

  const isAllSelectedView = viewSeries.length > 0 && selectedIds.length === viewSeries.length;

  useEffect(() => {
    if (selectedIds.length === 0) return;
    const idSet = new Set(viewSeries.map(s => s.id));
    setSelectedIds(prev => prev.filter(id => idSet.has(id)));
  }, [viewSeries]);

  function isRowDeleted(id: string) {
    return stagedItems.some(it => it.tableName === 'series' && it.op === 'delete' && it.id === id);
  }

  function applyStagedToSeries(base: DbSeries[], staged: StagedItem[]): DbSeries[] {
    let rows = [...base];
    const inserts = staged.filter(it => it.tableName === 'series' && it.op === 'insert');
    for (const it of inserts) {
      const data = it.data || {};
      rows.unshift({
        id: it.key,
        jm_id: Number(data.jm_id ?? 0),
        brand_jm_id: Number(data.brand_jm_id ?? 0),
        brand_id: (data.brand_id ?? null) as any,
        brand_name: data.brand_name ?? null,
        name: String(data.name ?? ''),
        fullname: data.fullname ?? null,
        initial: data.initial ?? null,
        logo_url: data.logo_url ?? null,
        salestate: data.salestate ?? null,
        depth: Number(data.depth ?? 3),
        subcompany_name: data.subcompany_name ?? null,
        subcompany_jm_id: data.subcompany_jm_id ?? null,
        activity_status: Number(data.activity_status ?? 0),
        created_at: '',
        updated_at: '',
      });
    }
    const updates = staged.filter(it => it.tableName === 'series' && it.op === 'update' && it.id);
    for (const it of updates) {
      rows = rows.map(r => (r.id === it.id ? ({ ...r, ...(it.changes || {}) } as any) : r));
    }
    return rows;
  }

  function stageUpdate(rowId: string, field: keyof DbSeries, value: any) {
    setViewSeries(prev => prev.map(r => (r.id === rowId ? ({ ...r, [field]: value } as any) : r)));
    setStagedItems(prev => {
      const existing = prev.find(it => it.key === rowId && it.tableName === 'series');
      const isTemp = rowId.startsWith('tmp_');
      if (isTemp) {
        const data = { ...(existing?.data || {}), [field]: value };
        const next: StagedItem = { key: rowId, op: 'insert', tableName: 'series', data };
        return [...prev.filter(it => !(it.key === rowId && it.tableName === 'series')), next];
      }

      const original = dbSeries.find(s => s.id === rowId) as any;
      const originalValue = original ? original[field] : undefined;
      const changed = JSON.stringify(originalValue ?? null) !== JSON.stringify(value ?? null);

      if (!changed) {
        if (existing?.op === 'update') {
          const nextChanges = { ...(existing.changes || {}) };
          delete nextChanges[field as string];
          if (Object.keys(nextChanges).length === 0) {
            return prev.filter(it => !(it.key === rowId && it.tableName === 'series'));
          }
          const next: StagedItem = { ...existing, changes: nextChanges };
          return [...prev.filter(it => !(it.key === rowId && it.tableName === 'series')), next];
        }
        return prev;
      }

      const baseChanges = existing?.op === 'update' ? (existing.changes || {}) : {};
      const nextChanges: Record<string, any> = { ...baseChanges, [field]: value };
      if (field === 'activity_status') {
        nextChanges.activity_status_manual = true;
      }
      const next: StagedItem = { key: rowId, op: 'update', tableName: 'series', id: rowId, changes: nextChanges };
      return [...prev.filter(it => !(it.key === rowId && it.tableName === 'series')), next];
    });
  }

  function addNewRow() {
    const tempId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const row: DbSeries = {
      id: tempId,
      jm_id: 0,
      brand_jm_id: 0,
      brand_id: null,
      brand_name: null,
      name: '',
      fullname: null,
      initial: null,
      logo_url: null,
      salestate: null,
      depth: 3,
      subcompany_name: null,
      subcompany_jm_id: null,
      activity_status: 0,
      created_at: '',
      updated_at: '',
    };
    setViewSeries(prev => [row, ...prev]);
    setStagedItems(prev => [...prev, { key: tempId, op: 'insert', tableName: 'series', data: { ...row, id: undefined, created_at: undefined, updated_at: undefined, activity_status_manual: true } }]);
  }

  function toggleDeleteRow(rowId: string) {
    const isTemp = rowId.startsWith('tmp_');
    if (isTemp) {
      setViewSeries(prev => prev.filter(r => r.id !== rowId));
      setStagedItems(prev => prev.filter(it => !(it.key === rowId && it.tableName === 'series')));
      setSelectedIds(prev => prev.filter(id => id !== rowId));
      return;
    }

    setStagedItems(prev => {
      const existing = prev.find(it => it.tableName === 'series' && it.key === rowId);
      if (existing?.op === 'delete') {
        return prev.filter(it => !(it.tableName === 'series' && it.key === rowId));
      }
      return [...prev.filter(it => !(it.tableName === 'series' && it.key === rowId)), { key: rowId, op: 'delete', tableName: 'series', id: rowId }];
    });
  }

  function discardAllChanges() {
    if (stagedItems.length === 0) return;
    const ok = window.confirm('将撤销当前未提交的全部修改，是否继续？');
    if (!ok) return;
    setStagedItems([]);
    setSelectedIds([]);
    setViewSeries([...dbSeries]);
  }

  async function commitAllChanges() {
    if (stagedItems.length === 0) return;
    const ok = window.confirm(`将提交 ${stagedItems.length} 条变更到数据库，是否继续？`);
    if (!ok) return;
    setCommitBusy(true);
    setError(null);

    const items = stagedItems.filter(it => it.tableName === 'series');
    const inserts = items.filter(it => it.op === 'insert');
    const updates = items.filter(it => it.op === 'update');
    const deletes = items.filter(it => it.op === 'delete');
    const failed: StagedItem[] = [];

    try {
      for (const it of inserts) {
        const data = it.data || {};
        const payload: any = {
          jm_id: Number(data.jm_id),
          brand_jm_id: Number(data.brand_jm_id),
          brand_id: data.brand_id || null,
          name: String(data.name || ''),
          fullname: data.fullname || null,
          initial: data.initial || null,
          logo_url: data.logo_url || null,
          salestate: data.salestate || null,
          depth: Number(data.depth ?? 3),
          subcompany_name: data.subcompany_name || null,
          subcompany_jm_id: data.subcompany_jm_id ?? null,
          activity_status: Number(data.activity_status ?? 0),
          activity_status_manual: true,
        };
        if (!payload.jm_id || !payload.brand_jm_id || !payload.name) {
          failed.push(it);
          continue;
        }
        const { error: insertError } = await supabase.from('series').insert(payload);
        if (insertError) failed.push(it);
      }

      for (const it of updates) {
        const id = it.id;
        if (!id) {
          failed.push(it);
          continue;
        }
        const changes = it.changes || {};
        const { error: updateError } = await supabase.from('series').update(changes).eq('id', id);
        if (updateError) failed.push(it);
      }

      for (const it of deletes) {
        const id = it.id;
        if (!id) {
          failed.push(it);
          continue;
        }
        const { error: deleteError } = await supabase.from('series').delete().eq('id', id);
        if (deleteError) failed.push(it);
      }

      setStagedItems(failed);
      await loadDbSeries(failed);
      if (failed.length === 0) {
        setImportResult('数据库更新成功');
      } else {
        setError(`有 ${failed.length} 条变更提交失败，请检查字段或权限后重试。`);
      }
    } finally {
      setCommitBusy(false);
    }
  }

  async function loadDbBrands(nextOnlyNormal: boolean = onlyNormalSeries) {
    setDbBrandsLoading(true);
    setError(null);
    try {
      const q = supabase
        .from('brands')
        .select('*')
        .eq('depth', 1)
        .order('name', { ascending: true })
        .limit(1000);

      const { data, error } = nextOnlyNormal ? await q.eq('activity_status', 0) : await q;

      if (error) throw error;
      setDbBrands(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载品牌数据库失败');
    } finally {
      setDbBrandsLoading(false);
    }
  }

  async function loadDbSeries(nextStaged?: StagedItem[], nextOnlyNormal: boolean = onlyNormalSeries) {
    setDbSeriesLoading(true);
    setError(null);
    try {
      const { data: brandsData, error: brandsError } = await supabase.from('brands').select('*').limit(500);
      const brandMap = new Map((brandsData || []).map(b => [b.jm_id, b.name]));

      const q = supabase
        .from('series')
        .select('*')
        .order('jm_id', { ascending: true })
        .limit(1000);

      const { data, error } = nextOnlyNormal ? await q.eq('activity_status', 0) : await q;

      if (error) throw error;
      const seriesWithBrandName = (data || []).map(series => ({
        ...series,
        brand_name: brandMap.get(series.brand_jm_id) || null,
        activity_status: series.activity_status ?? 0
      }));
      setDbSeries(seriesWithBrandName as any);
      setViewSeries(applyStagedToSeries(seriesWithBrandName as any, nextStaged ?? stagedItems));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载车系数据库失败');
    } finally {
      setDbSeriesLoading(false);
    }
  }

  const filteredBrands = brandSearchQuery.trim() === ""
    ? dbBrands
    : dbBrands.filter(brand => 
        brand.name.toLowerCase().includes(brandSearchQuery.toLowerCase())
      );

  async function querySeriesFromApi() {
    if (!jmAppId || !jmAppSecret) {
      setError("请先前往设置页面配置聚美智数的 App ID 和 App Secret");
      return;
    }
    if (!selectedBrandId) {
      setError("请选择品牌");
      return;
    }

    const ok = await confirmJumdataQueryIfExists({
      supabase,
      table: 'series',
      where: (q) => q.eq('brand_jm_id', selectedBrandId),
      subjectLabel: '车系',
      extraHint: '选择“取消”将停止本次查询。',
    });
    if (!ok) return;

    const selectedBrand = dbBrands.find(b => b.jm_id === selectedBrandId);
    if (!selectedBrand) {
      setError("未找到选中的品牌");
      return;
    }
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
      formData.append("brandId", selectedBrandId.toString());

      const response = await fetch("https://api.jumdata.com/vehicle/query/series", {
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

      const subcompanies: JmSubcompany[] = result.data || [];
      setQueryResult(subcompanies);
    } catch (e) {
      setError(e instanceof Error ? e.message : "查询失败");
    } finally {
      setQueryLoading(false);
    }
  }

  function compareSeriesData(existing: DbSeries, newData: JmSeries, subcompany: JmSubcompany, brandJmId: number, brandId: string): { isEqual: boolean; changes: SeriesChangeLog['changes'] } {
    const changes: SeriesChangeLog['changes'] = [];

    if (existing.name !== newData.name) {
      changes.push({ field: 'name', old: existing.name, new: newData.name });
    }
    if ((existing.fullname || '') !== newData.fullname) {
      changes.push({ field: 'fullname', old: existing.fullname, new: newData.fullname });
    }
    if ((existing.initial || '') !== subcompany.initial) {
      changes.push({ field: 'initial', old: existing.initial, new: subcompany.initial });
    }
    if ((existing.logo_url || '') !== newData.logo) {
      changes.push({ field: 'logo_url', old: existing.logo_url, new: newData.logo });
    }
    if ((existing.salestate || '') !== newData.salestate) {
      changes.push({ field: 'salestate', old: existing.salestate, new: newData.salestate });
    }
    if (existing.depth !== newData.depth) {
      changes.push({ field: 'depth', old: String(existing.depth), new: String(newData.depth) });
    }
    if ((existing.subcompany_name || '') !== subcompany.name) {
      changes.push({ field: 'subcompany_name', old: existing.subcompany_name, new: subcompany.name });
    }
    if (existing.subcompany_jm_id !== subcompany.id) {
      changes.push({ field: 'subcompany_jm_id', old: String(existing.subcompany_jm_id), new: String(subcompany.id) });
    }
    if (existing.brand_jm_id !== brandJmId) {
      changes.push({ field: 'brand_jm_id', old: String(existing.brand_jm_id), new: String(brandJmId) });
    }
    if (existing.brand_id !== brandId) {
      changes.push({ field: 'brand_id', old: existing.brand_id, new: brandId });
    }

    return { isEqual: changes.length === 0, changes };
  }

  async function importSeries() {
    if (!queryResult || !selectedBrandDb) return;
    setLoading(true);
    setError(null);
    setImportProgress(0);
    setChangeLogs([]);
    
    const logs: SeriesChangeLog[] = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    
    const allSeries: { subcompany: JmSubcompany; series: JmSeries }[] = [];
    for (const subcompany of queryResult) {
      for (const series of subcompany.list) {
        allSeries.push({ subcompany, series });
      }
    }
    const total = allSeries.length;

    try {
      for (let i = 0; i < allSeries.length; i++) {
        const { subcompany, series } = allSeries[i];

        const { data: existing, error: checkError } = await supabase
          .from("series")
          .select("*")
          .eq("jm_id", series.id)
          .maybeSingle();

        if (checkError) {
          if (!checkError.message?.includes('does not exist')) {
            throw checkError;
          }
        }

        if (!existing) {
          const { error } = await supabase.from("series").insert({
            jm_id: series.id,
            brand_jm_id: selectedBrandDb.jm_id,
            brand_id: selectedBrandDb.id,
            brand_name: selectedBrandDb.name,
            name: series.name,
            fullname: series.fullname,
            initial: subcompany.initial,
            logo_url: series.logo,
            salestate: series.salestate,
            depth: series.depth,
            subcompany_name: subcompany.name,
            subcompany_jm_id: subcompany.id,
          });
          
          if (error) {
            skipped++;
          } else {
            inserted++;
            logs.push({ action: 'insert', jm_id: series.id, name: series.name });
          }
        } else {
          const { isEqual, changes } = compareSeriesData(existing, series, subcompany, selectedBrandDb.jm_id, selectedBrandDb.id);
          
          if (isEqual) {
            skipped++;
            logs.push({ action: 'skip', jm_id: series.id, name: series.name });
          } else {
            const { error } = await supabase
              .from("series")
              .update({
                brand_jm_id: selectedBrandDb.jm_id,
                brand_id: selectedBrandDb.id,
                brand_name: selectedBrandDb.name,
                name: series.name,
                fullname: series.fullname,
                initial: subcompany.initial,
                logo_url: series.logo,
                salestate: series.salestate,
                depth: series.depth,
                subcompany_name: subcompany.name,
                subcompany_jm_id: subcompany.id,
              })
              .eq("jm_id", series.id);
            
            if (error) {
              skipped++;
            } else {
              updated++;
              logs.push({ action: 'update', jm_id: series.id, name: series.name, changes });
            }
          }
        }
        
        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setChangeLogs(logs);
      setImportResult(`导入完成: 新增 ${inserted} 个，更新 ${updated} 个，跳过 ${skipped} 个`);
      
      if (inserted > 0 || updated > 0) {
        setActiveTab('log-view');
        loadDbSeries();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="text-2xl font-bold text-zinc-900">聚美智数车系数据导入</h3>
      <p className="mt-2 text-base text-zinc-500">
        从聚美智数 API 查询车系数据，预览后再导入数据库
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
              loadDbBrands(next);
              loadDbSeries(undefined, next);
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
              
              <div className="mt-6">
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
                      <div className="max-h-60 overflow-auto rounded-xl border border-zinc-200">
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

              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={querySeriesFromApi}
                  disabled={queryLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {queryLoading ? "查询中..." : "查询车系数据"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-6">
                <div className="flex items-center justify-between">
                  <h4 className="text-xl font-semibold text-zinc-900">
                    查询结果 - {selectedBrandDb?.name}
                  </h4>
                </div>
                <div className="mt-4 space-y-6">
                  {queryResult.map((subcompany) => (
                    <div key={subcompany.id} className="border border-zinc-200 rounded-xl overflow-hidden">
                      <div className="bg-zinc-50 px-4 py-3 border-b border-zinc-200">
                        <div className="font-semibold text-zinc-900">
                          {subcompany.name} ({subcompany.initial})
                        </div>
                        <div className="text-sm text-zinc-500">
                          ID: {subcompany.id} · 车系数: {subcompany.list.length}
                        </div>
                      </div>
                      <div className="max-h-48 overflow-auto">
                        <table className="min-w-full divide-y divide-zinc-200">
                          <thead className="bg-white sticky top-0">
                            <tr>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Logo</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">名称</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">全称</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">销售状态</th>
                              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">ID</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 bg-white">
                            {subcompany.list.map((series) => (
                              <tr key={series.id} className="hover:bg-zinc-50">
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                                  {series.logo ? (
                                    <img
                                      src={proxiedImageUrl(series.logo) || undefined}
                                      alt={series.name}
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
                                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{series.name}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{series.fullname}</td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                    series.salestate === '在销' 
                                      ? 'bg-green-100 text-green-800'
                                      : series.salestate === '待销'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {series.salestate}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{series.id}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  ))}
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
                  onClick={importSeries}
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
              数据库车系列表（共 {viewSeries.length} 个车系）
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
                    await loadDbSeries([]);
                    return;
                  }
                  await loadDbBrands();
                  await loadDbSeries();
                })();
              }}
              disabled={dbSeriesLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {dbSeriesLoading ? '加载中...' : '刷新'}
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
              disabled={transSeries || transTargetLocales.length === 0}
              onClick={async () => {
                const ids = viewSeries.map(s => s.jm_id).filter(id => id > 0);
                await translateEntities(transTargetLocales, ids.length > 0 ? ids : undefined);
                await loadDbSeries();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {transSeries ? "翻译中..." : "翻译车系"}
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
            stagedItems={stagedItems.filter(it => it.tableName === 'series')}
            busy={commitBusy}
            onAdd={addNewRow}
            onDiscardAll={discardAllChanges}
            onConfirm={commitAllChanges}
          />

          {/* 批量操作组件 */}
          <BatchOperations
            tableName="series"
            selectedIds={selectedIds}
            totalCount={viewSeries.length}
            onSelectAll={handleSelectAll}
            onClearSelection={handleClearSelection}
            onBatchUpdate={async (status) => {
              if (selectedIds.length === 0) return;
              for (const id of selectedIds) {
                if (isRowDeleted(id)) continue;
                stageUpdate(id, 'activity_status', status);
              }
            }}
            loading={dbSeriesLoading}
          />

          <BulkEditBar
            tableName="series"
            selectedIds={selectedIds}
            rows={viewSeries}
            fields={tableFieldConfigs.series}
            busy={dbSeriesLoading || commitBusy}
            getLabel={(field) => getFieldLabel(field, undefined, 'series')}
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
                      checked={isAllSelectedView}
                      onChange={(e) => e.target.checked ? handleSelectAll() : handleClearSelection()}
                      disabled={dbSeriesLoading || viewSeries.length === 0}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {tableFieldConfigs.series.map((field) => (
                    <th key={field} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {getFieldLabel(field, undefined, 'series')}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {dbSeriesLoading ? (
                  <tr>
                    <td colSpan={tableFieldConfigs.series.length + 2} className="px-4 py-8 text-center text-sm text-zinc-500">
                      加载中...
                    </td>
                  </tr>
                ) : viewSeries.length === 0 ? (
                  <tr>
                    <td colSpan={tableFieldConfigs.series.length + 2} className="px-4 py-8 text-center text-sm text-zinc-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  viewSeries.map((series) => {
                    const deleted = isRowDeleted(series.id);
                    return (
                    <tr key={series.id} className={`hover:bg-zinc-50 ${deleted ? 'opacity-60' : ''}`}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(series.id)}
                          onChange={(e) => e.target.checked ? handleSelectId(series.id) : handleUnselectId(series.id)}
                          disabled={dbSeriesLoading}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      {tableFieldConfigs.series.map((field) => {
                        if (field === 'salestate') {
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3 text-sm">
                              {deleted ? (
                                series.salestate ? (
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                    series.salestate === '在销'
                                      ? 'bg-green-100 text-green-800'
                                      : series.salestate === '待销'
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-gray-100 text-gray-800'
                                  }`}>
                                    {series.salestate}
                                  </span>
                                ) : null
                              ) : (
                                <input
                                  value={series.salestate ?? ''}
                                  onChange={(e) => stageUpdate(series.id, 'salestate', e.target.value || null)}
                                  className="w-32 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                                  placeholder="销售状态"
                                />
                              )}
                            </td>
                          );
                        }

                        if (field === 'activity_status') {
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3">
                              {deleted ? (
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getActivityStatusColor(series.activity_status)}`}>
                                  {getActivityStatusLabel(series.activity_status)}
                                </span>
                              ) : (
                                <select
                                  value={series.activity_status ?? 0}
                                  onChange={(e) => stageUpdate(series.id, 'activity_status', Number(e.target.value))}
                                  className="rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm text-zinc-800"
                                >
                                  <option value={0}>正常</option>
                                  <option value={1}>不显示</option>
                                  <option value={2}>不可用</option>
                                </select>
                              )}
                            </td>
                          );
                        }

                        if (field === 'logo_url') {
                          return (
                            <td key={field} className="px-4 py-3 text-sm text-zinc-600">
                              <div className="flex items-center gap-2">
                                {series.logo_url ? (
                                  <img
                                    src={proxiedImageUrl(series.logo_url) || undefined}
                                    alt=""
                                    className="h-8 w-8 rounded object-contain"
                                    onError={(e) => {
                                      const target = e.target as HTMLImageElement;
                                      target.style.display = 'none';
                                    }}
                                  />
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                                {deleted ? (
                                  <span className="truncate text-xs text-zinc-500">{series.logo_url || '-'}</span>
                                ) : (
                                  <input
                                    value={series.logo_url || ''}
                                    onChange={(e) => stageUpdate(series.id, 'logo_url', e.target.value || null)}
                                    className="w-64 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                                    placeholder="Logo URL"
                                  />
                                )}
                              </div>
                            </td>
                          );
                        }

                        if (field === 'jm_id' || field === 'brand_jm_id') {
                          const value = (series as any)[field];
                          const editable = series.id.startsWith('tmp_');
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                              {deleted || !editable ? (
                                value === null || value === undefined ? '-' : String(value)
                              ) : (
                                <input
                                  type="number"
                                  value={value ?? 0}
                                  onChange={(e) => stageUpdate(series.id, field as any, Number(e.target.value))}
                                  className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                                />
                              )}
                            </td>
                          );
                        }

                        if (field === 'name' || field === 'fullname' || field === 'initial' || field === 'subcompany_name') {
                          const value = (series as any)[field];
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                              {deleted ? (
                                value === null || value === undefined || value === '' ? '-' : String(value)
                              ) : (
                                <input
                                  value={value ?? ''}
                                  onChange={(e) => stageUpdate(series.id, field as any, e.target.value || null)}
                                  className={`rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm ${field === 'name' ? 'w-64' : field === 'fullname' ? 'w-72' : field === 'initial' ? 'w-20' : 'w-56'}`}
                                />
                              )}
                            </td>
                          );
                        }

                        // 普通字段直接显示
                        const value = series[field as keyof DbSeries];
                        return (
                          <td key={field} className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                            {value === null || value === undefined ? '-' : String(value)}
                          </td>
                        );
                      })}
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleDeleteRow(series.id)}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">车系名</th>
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
    </div>
  );
}
