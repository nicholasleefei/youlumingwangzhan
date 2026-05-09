import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";

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
  const [dbBrandsLoading, setDbBrandsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'import' | 'db-view' | 'log-view'>('import');
  const [changeLogs, setChangeLogs] = useState<BrandChangeLog[]>([]);

  async function loadDbBrands() {
    setDbBrandsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .order('jm_id', { ascending: true });

      if (error) throw error;

      // 调试：打印前几个品牌的数据
      if (data && data.length > 0) {
        console.log('品牌数据示例 (前5个):');
        data.slice(0, 5).forEach(brand => {
          console.log(`ID: ${brand.jm_id}, Name: ${brand.name}`);
          console.log(`Logo URL:`, brand.logo_url);
          console.log(`Logo URL Type:`, typeof brand.logo_url);
          console.log(`Logo URL Length:`, brand.logo_url ? brand.logo_url.length : 'undefined');
          console.log('---');
        });
      }

      setDbBrands(data || []);
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

    console.log('开始导入品牌，总数:', total);

    try {
      for (let i = 0; i < queryResult.length; i++) {
        const brand = queryResult[i];
        console.log(`处理品牌 ${i+1}/${total}:`, brand.name, brand.id);

        const { data: existing, error: checkError } = await supabase
          .from("brands")
          .select("*")
          .eq("jm_id", brand.id)
          .maybeSingle();

        if (checkError) {
          console.error('检查品牌失败:', checkError);
          if (!checkError.message?.includes('does not exist')) {
            throw checkError;
          }
        }

        if (!existing) {
          console.log('插入新品牌:', brand.name);
          const { error } = await supabase.from("brands").insert({
            jm_id: brand.id,
            name: brand.name,
            initial: brand.initial,
            logo_url: brand.logo,
            parent_id: brand.parentid,
            depth: brand.depth,
          });
          
          if (error) {
            console.error('插入失败:', error);
            skipped++;
          } else {
            inserted++;
            logs.push({ action: 'insert', jm_id: brand.id, name: brand.name });
          }
        } else {
          const { isEqual, changes } = compareBrandData(existing, brand);
          
          if (isEqual) {
            console.log('品牌数据完全一致，跳过:', brand.name);
            skipped++;
            logs.push({ action: 'skip', jm_id: brand.id, name: brand.name });
          } else {
            console.log('品牌数据不一致，更新:', brand.name, changes);
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
              console.error('更新失败:', error);
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
      console.log('导入结果:', { inserted, updated, skipped });
      
      if (inserted > 0 || updated > 0) {
        setActiveTab('log-view');
        loadDbBrands();
      }
    } catch (e) {
      console.error('导入出错:', e);
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
                                  console.error('查询结果Logo显示失败', brand.name, brand.logo);
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
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-xl font-semibold text-zinc-900">
              数据库品牌列表（共 {dbBrands.length} 个品牌）
            </h4>
            <button
              type="button"
              onClick={loadDbBrands}
              disabled={dbBrandsLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {dbBrandsLoading ? '加载中...' : '刷新'}
            </button>
          </div>
          <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Logo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">聚美ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">品牌名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">首字母</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">层级</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {dbBrandsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                      加载中...
                    </td>
                  </tr>
                ) : dbBrands.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  dbBrands.map((brand) => (
                    <tr key={brand.id} className="hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                        {/* 简单直接的logo显示 */}
                        {brand.logo_url ? (
                          <img
                            src={brand.logo_url}
                            alt={brand.name}
                            className="h-8 w-8 rounded object-contain"
                            onError={(e) => {
                              console.error('Logo显示失败', brand.name, brand.logo_url);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}

                        {/* 调试信息：在开发模式下显示实际值 */}
                        {brand.logo_url && (
                          <span className="sr-only">
                            Logo URL: {brand.logo_url}
                          </span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{brand.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{brand.jm_id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{brand.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{brand.initial || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{brand.depth}</td>
                    </tr>
                  ))
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
