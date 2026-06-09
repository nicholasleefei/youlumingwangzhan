import { useState } from "react";
import { Search } from "lucide-react";
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

type JmBrand = {
  depth: number;
  initial: string;
  name: string;
  logo: string;
  id: number;
  parentid: number;
};

type DbBrand = {
  id: string;
  jm_id: number;
  name: string;
  initial: string | null;
  logo_url: string | null;
  parent_id: number;
  depth: number;
  activity_status: number;
  created_at: string;
  updated_at: string;
};

type BrandChangeLog = {
  action: 'insert' | 'update' | 'skip';
  jm_id: number;
  name: string;
  changes?: {
    field: string;
    old: string | null;
    new: string | null;
  }[];
};

export default function AdminBrands() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const jmAppId = localStorage.getItem('jumdata_app_id') || "";
  const jmAppSecret = localStorage.getItem('jumdata_app_secret') || "";
  const [queryResult, setQueryResult] = useState<JmBrand[] | null>(null);
  const [importResult, setImportResult] = useState<string | null>(null);
  const [queryLoading, setQueryLoading] = useState(false);
  const [importProgress, setImportProgress] = useState<number>(0);
  const [dbBrands, setDbBrands] = useState<DbBrand[]>([]);
  const [viewBrands, setViewBrands] = useState<DbBrand[]>([]);
  const [dbBrandsLoading, setDbBrandsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'db-view' | 'log-view'>('import');
  const [changeLogs, setChangeLogs] = useState<BrandChangeLog[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [stagedItems, setStagedItems] = useState<StagedItem[]>([]);
  const [commitBusy, setCommitBusy] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Entity translation
  const { translating: transBrands, progress: transProgress, error: transError, setError: setTransError, translateEntities } = useEntityTranslation("brand");
  const [transTargetLocales, setTransTargetLocales] = useState<string[]>([...TARGET_LOCALES]);
  const [showTransLocales, setShowTransLocales] = useState(false);

  function toggleTransLocale(loc: string) {
    setTransTargetLocales((prev) =>
      prev.includes(loc) ? prev.filter((l) => l !== loc) : [...prev, loc]
    );
  }

  const handleSelectAll = () => {
    if (selectedIds.length === dbBrands.length) {
      handleClearSelection();
    } else {
      setSelectedIds(dbBrands.map(b => b.id));
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

    try {
      setError(null);

      // 首先检查该列是否存在，方法是尝试选择该列
      const { data: testData, error: testError } = await supabase
        .from('brands')
        .select('id, activity_status')
        .limit(1);

      if (testError) {
        setError('批量更新功能需要数据库升级。请联系管理员添加 activity_status 列到数据库表中。');
        return;
      }

      const { data, error: updateErr } = await supabase
        .from('brands')
        .update({ activity_status: status })
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
      await loadDbBrands();

      setImportResult(`批量更新成功：已将 ${selectedIds.length} 个品牌设置为"${getActivityStatusLabel(status)}"`);
      setActiveTab('log-view');
      handleClearSelection();
    } catch (e) {
      const errorMessage = e instanceof Error ? e.message : '批量更新失败';
      setError(errorMessage);
      // 不要向外抛出错误，避免组件崩溃
    }
  };

  // 计算是否全选
  const isAllSelected = dbBrands.length > 0 && selectedIds.length === dbBrands.length;

  // 搜索过滤逻辑
  const filteredDbBrands = dbBrands.filter(brand => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      brand.name.toLowerCase().includes(query) ||
      (brand.initial && brand.initial.toLowerCase().includes(query)) ||
      String(brand.jm_id).includes(query)
    );
  });

  const filteredViewBrands = viewBrands.filter(brand => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      String(brand.name || '').toLowerCase().includes(query) ||
      String(brand.initial || '').toLowerCase().includes(query) ||
      String(brand.jm_id || '').includes(query)
    );
  });

  // 计算过滤后的全选状态
  const isAllSelectedFiltered = filteredDbBrands.length > 0 &&
    filteredDbBrands.every(brand => selectedIds.includes(brand.id));

  const isAllSelectedFilteredView = filteredViewBrands.length > 0 &&
    filteredViewBrands.every(brand => selectedIds.includes(brand.id));

  // 批量选择控制（针对过滤后的列表）
  const handleSelectAllFiltered = () => {
    if (isAllSelectedFilteredView) {
      const filteredIds = filteredViewBrands.map(b => b.id);
      setSelectedIds(prev => prev.filter(id => !filteredIds.includes(id)));
    } else {
      const filteredIds = filteredViewBrands.map(b => b.id);
      setSelectedIds(prev => [...new Set([...prev, ...filteredIds])]);
    }
  };

  function isRowDeleted(id: string) {
    return stagedItems.some(it => it.tableName === 'brands' && it.op === 'delete' && it.id === id);
  }

  function applyStagedToBrands(base: DbBrand[], staged: StagedItem[]): DbBrand[] {
    let rows = [...base];
    const inserts = staged.filter(it => it.tableName === 'brands' && it.op === 'insert');
    for (const it of inserts) {
      const data = it.data || {};
      rows.unshift({
        id: it.key,
        jm_id: Number(data.jm_id ?? 0),
        name: String(data.name ?? ''),
        initial: data.initial ?? null,
        logo_url: data.logo_url ?? null,
        parent_id: Number(data.parent_id ?? 0),
        depth: Number(data.depth ?? 1),
        activity_status: Number(data.activity_status ?? 0),
        created_at: '',
        updated_at: '',
      });
    }
    const updates = staged.filter(it => it.tableName === 'brands' && it.op === 'update' && it.id);
    for (const it of updates) {
      rows = rows.map(r => (r.id === it.id ? ({ ...r, ...(it.changes || {}) } as any) : r));
    }
    return rows;
  }

  function stageUpdate(rowId: string, field: keyof DbBrand, value: any) {
    setViewBrands(prev => prev.map(r => (r.id === rowId ? ({ ...r, [field]: value } as any) : r)));
    setStagedItems(prev => {
      const existing = prev.find(it => it.key === rowId && it.tableName === 'brands');
      const isTemp = rowId.startsWith('tmp_');
      if (isTemp) {
        const data = { ...(existing?.data || {}), [field]: value };
        const next: StagedItem = { key: rowId, op: 'insert', tableName: 'brands', data };
        return [...prev.filter(it => !(it.key === rowId && it.tableName === 'brands')), next];
      }

      const original = dbBrands.find(b => b.id === rowId) as any;
      const originalValue = original ? original[field] : undefined;
      const changed = JSON.stringify(originalValue ?? null) !== JSON.stringify(value ?? null);

      if (!changed) {
        if (existing?.op === 'update') {
          const nextChanges = { ...(existing.changes || {}) };
          delete nextChanges[field as string];
          if (Object.keys(nextChanges).length === 0) {
            return prev.filter(it => !(it.key === rowId && it.tableName === 'brands'));
          }
          const next: StagedItem = { ...existing, changes: nextChanges };
          return [...prev.filter(it => !(it.key === rowId && it.tableName === 'brands')), next];
        }
        return prev;
      }

      const nextChanges = { ...(existing?.op === 'update' ? (existing.changes || {}) : {}), [field]: value };
      const next: StagedItem = { key: rowId, op: 'update', tableName: 'brands', id: rowId, changes: nextChanges };
      return [...prev.filter(it => !(it.key === rowId && it.tableName === 'brands')), next];
    });
  }

  function addNewRow() {
    const tempId = `tmp_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const row: DbBrand = {
      id: tempId,
      jm_id: 0,
      name: '',
      initial: null,
      logo_url: null,
      parent_id: 0,
      depth: 1,
      activity_status: 0,
      created_at: '',
      updated_at: '',
    };
    setViewBrands(prev => [row, ...prev]);
    setStagedItems(prev => [...prev, { key: tempId, op: 'insert', tableName: 'brands', data: { ...row, id: undefined, created_at: undefined, updated_at: undefined } }]);
  }

  function toggleDeleteRow(rowId: string) {
    const isTemp = rowId.startsWith('tmp_');
    if (isTemp) {
      setViewBrands(prev => prev.filter(r => r.id !== rowId));
      setStagedItems(prev => prev.filter(it => !(it.key === rowId && it.tableName === 'brands')));
      setSelectedIds(prev => prev.filter(id => id !== rowId));
      return;
    }

    setStagedItems(prev => {
      const existing = prev.find(it => it.tableName === 'brands' && it.key === rowId);
      if (existing?.op === 'delete') {
        return prev.filter(it => !(it.tableName === 'brands' && it.key === rowId));
      }
      return [...prev.filter(it => !(it.tableName === 'brands' && it.key === rowId)), { key: rowId, op: 'delete', tableName: 'brands', id: rowId }];
    });
  }

  function discardAllChanges() {
    if (stagedItems.length === 0) return;
    const ok = window.confirm('将撤销当前未提交的全部修改，是否继续？');
    if (!ok) return;
    setStagedItems([]);
    setSelectedIds([]);
    setViewBrands([...dbBrands]);
  }

  async function commitAllChanges() {
    if (stagedItems.length === 0) return;
    const ok = window.confirm(`将提交 ${stagedItems.length} 条变更到数据库，是否继续？`);
    if (!ok) return;
    setCommitBusy(true);
    setError(null);

    const items = stagedItems.filter(it => it.tableName === 'brands');
    const inserts = items.filter(it => it.op === 'insert');
    const updates = items.filter(it => it.op === 'update');
    const deletes = items.filter(it => it.op === 'delete');
    const failed: StagedItem[] = [];

    try {
      for (const it of inserts) {
        const data = it.data || {};
        const payload = {
          jm_id: Number(data.jm_id),
          name: String(data.name || ''),
          initial: data.initial || null,
          logo_url: data.logo_url || null,
          parent_id: Number(data.parent_id ?? 0),
          depth: Number(data.depth ?? 1),
          activity_status: Number(data.activity_status ?? 0),
        };
        if (!payload.jm_id || !payload.name) {
          failed.push(it);
          continue;
        }
        const { error: insertError } = await supabase.from('brands').insert(payload);
        if (insertError) failed.push(it);
      }

      for (const it of updates) {
        const id = it.id;
        if (!id) {
          failed.push(it);
          continue;
        }
        const changes = it.changes || {};
        const { error: updateError } = await supabase.from('brands').update(changes).eq('id', id);
        if (updateError) failed.push(it);
      }

      for (const it of deletes) {
        const id = it.id;
        if (!id) {
          failed.push(it);
          continue;
        }
        const { error: deleteError } = await supabase.from('brands').delete().eq('id', id);
        if (deleteError) failed.push(it);
      }

      setStagedItems(failed);
      await loadDbBrands(failed);

      if (failed.length === 0) {
        setImportResult('数据库更新成功');
      } else {
        setError(`有 ${failed.length} 条变更提交失败，请检查字段或权限后重试。`);
      }
    } finally {
      setCommitBusy(false);
    }
  }

  async function loadDbBrands(nextStaged?: StagedItem[]) {
    setDbBrandsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('jm_id', { ascending: true });

      if (error) throw error;

      // 确保数据包含 activity_status 字段，设置默认值 0
      const brandsWithStatus = (data || []).map(brand => ({
        ...brand,
        activity_status: brand.activity_status ?? 0
      }));
      setDbBrands(brandsWithStatus);
      setViewBrands(applyStagedToBrands(brandsWithStatus as any, nextStaged ?? stagedItems));
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载品牌数据库失败');
    } finally {
      setDbBrandsLoading(false);
    }
  }

  async function queryBrandsFromApi() {
    if (!jmAppId || !jmAppSecret) {
      setError("请先前往设置页面配置聚美智数的 App ID 和 App Secret");
      return;
    }

    const ok = await confirmJumdataQueryIfExists({
      supabase,
      table: 'brands',
      where: (q) => q.eq('depth', 1),
      subjectLabel: '品牌',
      extraHint: '选择“取消”将停止本次查询。',
    });
    if (!ok) return;

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

      const response = await fetch("https://api.jumdata.com/vehicle/query/brand", {
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

      const brands: JmBrand[] = result.data || [];
      setQueryResult(brands.filter(b => b.depth === 1));
    } catch (e) {
      setError(e instanceof Error ? e.message : "查询失败");
    } finally {
      setQueryLoading(false);
    }
  }

  function compareBrandData(existing: DbBrand, newData: JmBrand): { isEqual: boolean; changes: BrandChangeLog['changes'] } {
    const changes: BrandChangeLog['changes'] = [];

    if (existing.name !== newData.name) {
      changes.push({ field: 'name', old: existing.name, new: newData.name });
    }
    if ((existing.initial || '') !== newData.initial) {
      changes.push({ field: 'initial', old: existing.initial, new: newData.initial });
    }
    if ((existing.logo_url || '') !== newData.logo) {
      changes.push({ field: 'logo_url', old: existing.logo_url, new: newData.logo });
    }
    if (existing.parent_id !== newData.parentid) {
      changes.push({ field: 'parent_id', old: String(existing.parent_id), new: String(newData.parentid) });
    }
    if (existing.depth !== newData.depth) {
      changes.push({ field: 'depth', old: String(existing.depth), new: String(newData.depth) });
    }

    return { isEqual: changes.length === 0, changes };
  }

  async function importBrands() {
    if (!queryResult) return;
    setLoading(true);
    setError(null);
    setImportProgress(0);
    setChangeLogs([]);
    
    const logs: BrandChangeLog[] = [];
    let inserted = 0;
    let updated = 0;
    let skipped = 0;
    const total = queryResult.length;

    try {
      for (let i = 0; i < queryResult.length; i++) {
        const brand = queryResult[i];

        const { data: existing, error: checkError } = await supabase
          .from("brands")
          .select("*")
          .eq("jm_id", brand.id)
          .maybeSingle();

        if (checkError) {
          if (!checkError.message?.includes('does not exist')) {
            throw checkError;
          }
        }

        if (!existing) {
          const { error } = await supabase.from("brands").insert({
            jm_id: brand.id,
            name: brand.name,
            initial: brand.initial,
            logo_url: brand.logo,
            parent_id: brand.parentid,
            depth: brand.depth,
            activity_status: 0,
          });
          
          if (error) {
            skipped++;
          } else {
            inserted++;
            logs.push({ action: 'insert', jm_id: brand.id, name: brand.name });
          }
        } else {
          const { isEqual, changes } = compareBrandData(existing, brand);
          
          if (isEqual) {
            skipped++;
            logs.push({ action: 'skip', jm_id: brand.id, name: brand.name });
          } else {
            const { error } = await supabase
              .from("brands")
              .update({
                name: brand.name,
                initial: brand.initial,
                logo_url: brand.logo,
                parent_id: brand.parentid,
                depth: brand.depth,
              })
              .eq("jm_id", brand.id);
            
            if (error) {
              skipped++;
            } else {
              updated++;
              logs.push({ action: 'update', jm_id: brand.id, name: brand.name, changes });
            }
          }
        }
        
        setImportProgress(Math.round(((i + 1) / total) * 100));
      }

      setChangeLogs(logs);
      setImportResult(`导入完成: 新增 ${inserted} 个，更新 ${updated} 个，跳过 ${skipped} 个`);
      
      if (inserted > 0 || updated > 0) {
        setActiveTab('log-view');
        loadDbBrands();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "导入失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <h3 className="text-2xl font-bold text-zinc-900">聚美智数品牌数据导入</h3>
      <p className="mt-2 text-base text-zinc-500">
        从聚美智数 API 查询品牌数据，预览后再导入数据库
      </p>

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
              <div className="mt-6 flex items-center gap-3">
                <button
                  type="button"
                  onClick={queryBrandsFromApi}
                  disabled={queryLoading}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-3 text-lg font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {queryLoading ? "查询中..." : "查询品牌数据"}
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="mt-6">
                <h4 className="text-xl font-semibold text-zinc-900">
                  查询结果（共 {queryResult.length} 个品牌）
                </h4>
                <div className="mt-4 max-h-80 overflow-auto rounded-xl border border-zinc-200">
                  <table className="min-w-full divide-y divide-zinc-200">
                    <thead className="bg-zinc-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">ID</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">品牌名</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">首字母</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Logo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {queryResult.map((brand) => (
                        <tr key={brand.id} className="hover:bg-zinc-50">
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{brand.id}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{brand.name}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{brand.initial}</td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                            {/* 简单直接的logo显示 */}
                            {brand.logo ? (
                              <img
                                src={brand.logo}
                                alt={brand.name}
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
                  onClick={importBrands}
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
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 gap-4">
            <h4 className="text-xl font-semibold text-zinc-900">
              数据库品牌列表（共 {filteredViewBrands.length} 个品牌{searchQuery ? `，搜索"${searchQuery}"` : ''}）
            </h4>
            <div className="flex items-center gap-3">
              <div className="relative flex-1 md:w-80">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索品牌名称、首字母或聚美ID..."
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 transition-all"
                />
              </div>
              <button
                type="button"
                onClick={async () => {
                  if (stagedItems.length > 0) {
                    const ok = window.confirm('当前有未提交变更，刷新将丢失这些暂存修改，是否继续？');
                    if (!ok) return;
                    setStagedItems([]);
                    setSelectedIds([]);
                    await loadDbBrands([]);
                    return;
                  }
                  await loadDbBrands();
                }}
                disabled={dbBrandsLoading}
                className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
              >
                {dbBrandsLoading ? '加载中...' : '刷新'}
              </button>
            </div>
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
              disabled={transBrands || transTargetLocales.length === 0}
              onClick={async () => {
                const ids = filteredViewBrands.map(b => b.jm_id).filter(id => id > 0);
                await translateEntities(transTargetLocales, ids.length > 0 ? ids : undefined);
                await loadDbBrands();
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {transBrands ? "翻译中..." : "翻译品牌"}
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
            stagedItems={stagedItems.filter(it => it.tableName === 'brands')}
            busy={commitBusy}
            onAdd={addNewRow}
            onDiscardAll={discardAllChanges}
            onConfirm={commitAllChanges}
          />

          {/* 批量操作组件 */}
          <BatchOperations
            tableName="brands"
            selectedIds={selectedIds}
            totalCount={filteredViewBrands.length}
            onSelectAll={handleSelectAllFiltered}
            onClearSelection={handleClearSelection}
            onBatchUpdate={async (status) => {
              if (selectedIds.length === 0) return;
              for (const id of selectedIds) {
                stageUpdate(id, 'activity_status', status);
              }
            }}
            loading={dbBrandsLoading}
          />

          <BulkEditBar
            tableName="brands"
            selectedIds={selectedIds}
            rows={filteredViewBrands}
            fields={tableFieldConfigs.brands}
            busy={dbBrandsLoading || commitBusy}
            getLabel={(field) => getFieldLabel(field, undefined, 'brands')}
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
                      checked={isAllSelectedFilteredView}
                      onChange={(e) => e.target.checked ? handleSelectAllFiltered() : handleClearSelection()}
                      disabled={dbBrandsLoading || filteredViewBrands.length === 0}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                  </th>
                  {tableFieldConfigs.brands.map((field) => (
                    <th key={field} className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      {getFieldLabel(field, undefined, 'brands')}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {dbBrandsLoading ? (
                  <tr>
                    <td colSpan={tableFieldConfigs.brands.length + 2} className="px-4 py-8 text-center text-sm text-zinc-500">
                      加载中...
                    </td>
                  </tr>
                ) : filteredViewBrands.length === 0 ? (
                  <tr>
                    <td colSpan={tableFieldConfigs.brands.length + 2} className="px-4 py-8 text-center text-sm text-zinc-500">
                      {searchQuery ? '未找到匹配的品牌' : '暂无数据'}
                    </td>
                  </tr>
                ) : (
                  filteredViewBrands.map((brand) => {
                    const deleted = isRowDeleted(brand.id);
                    return (
                    <tr key={brand.id} className={`hover:bg-zinc-50 ${deleted ? 'opacity-60' : ''}`}>
                      <td className="whitespace-nowrap px-4 py-3">
                        <input
                          type="checkbox"
                          checked={selectedIds.includes(brand.id)}
                          onChange={(e) => e.target.checked ? handleSelectId(brand.id) : handleUnselectId(brand.id)}
                          disabled={dbBrandsLoading}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      {tableFieldConfigs.brands.map((field) => {
                        if (field === 'activity_status') {
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3">
                              {deleted ? (
                                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${getActivityStatusColor(brand.activity_status)}`}>
                                  {getActivityStatusLabel(brand.activity_status)}
                                </span>
                              ) : (
                                <select
                                  value={brand.activity_status ?? 0}
                                  onChange={(e) => stageUpdate(brand.id, 'activity_status', Number(e.target.value))}
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
                                {brand.logo_url ? (
                                  <img
                                    src={proxiedImageUrl(brand.logo_url) || undefined}
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
                                  <span className="truncate text-xs text-zinc-500">{brand.logo_url || '-'}</span>
                                ) : (
                                  <input
                                    value={brand.logo_url || ''}
                                    onChange={(e) => stageUpdate(brand.id, 'logo_url', e.target.value || null)}
                                    className="w-64 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                                    placeholder="Logo URL"
                                  />
                                )}
                              </div>
                            </td>
                          );
                        }

                        if (field === 'jm_id' || field === 'parent_id' || field === 'depth') {
                          const value = (brand as any)[field];
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                              {deleted || field === 'depth' && !brand.id.startsWith('tmp_') ? (
                                value === null || value === undefined ? '-' : String(value)
                              ) : (
                                <input
                                  type="number"
                                  value={value ?? 0}
                                  onChange={(e) => stageUpdate(brand.id, field as any, Number(e.target.value))}
                                  className="w-28 rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm"
                                />
                              )}
                            </td>
                          );
                        }

                        if (field === 'name' || field === 'initial') {
                          const value = (brand as any)[field];
                          return (
                            <td key={field} className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                              {deleted ? (
                                value === null || value === undefined || value === '' ? '-' : String(value)
                              ) : (
                                <input
                                  value={value ?? ''}
                                  onChange={(e) => stageUpdate(brand.id, field as any, e.target.value)}
                                  className={`rounded-lg border border-zinc-200 bg-white px-2 py-1 text-sm ${field === 'name' ? 'w-64' : 'w-20'}`}
                                />
                              )}
                            </td>
                          );
                        }

                        // 普通字段直接显示
                        const value = brand[field as keyof DbBrand];
                        return (
                          <td key={field} className="whitespace-nowrap px-4 py-3 text-sm text-zinc-600">
                            {value === null || value === undefined ? '-' : String(value)}
                          </td>
                        );
                      })}
                      <td className="whitespace-nowrap px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleDeleteRow(brand.id)}
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
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">品牌名</th>
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
