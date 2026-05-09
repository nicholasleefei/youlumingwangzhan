import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";

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
  const [dbBrands, setDbBrands] = useState<DbBrand[]>([]);
  const [dbBrandsLoading, setDbBrandsLoading] = useState(false);
  const [dbSeries, setDbSeries] = useState<DbSeries[]>([]);
  const [dbSeriesLoading, setDbSeriesLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedBrandDb, setSelectedBrandDb] = useState<DbBrand | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'import' | 'db-view' | 'log-view'>('import');
  const [changeLogs, setChangeLogs] = useState<SeriesChangeLog[]>([]);

  async function loadDbBrands() {
    setDbBrandsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('depth', 1)
        .order('name', { ascending: true })
        .limit(1000);  // Supabase默认只返回100条，设置更大限制

      if (error) throw error;
      setDbBrands(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载品牌数据库失败');
    } finally {
      setDbBrandsLoading(false);
    }
  }

  async function loadDbSeries() {
    setDbSeriesLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .order('jm_id', { ascending: true })
        .limit(1000);  // Supabase默认只返回100条，设置更大限制加载全部数据

      if (error) throw error;
      setDbSeries(data || []);
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

    console.log('开始导入车系，总数:', total);

    try {
      for (let i = 0; i < allSeries.length; i++) {
        const { subcompany, series } = allSeries[i];
        console.log(`处理车系 ${i+1}/${total}:`, series.name, series.id);

        const { data: existing, error: checkError } = await supabase
          .from("series")
          .select("*")
          .eq("jm_id", series.id)
          .maybeSingle();

        if (checkError) {
          console.error('检查车系失败:', checkError);
          if (!checkError.message?.includes('does not exist')) {
            throw checkError;
          }
        }

        if (!existing) {
          console.log('插入新车系:', series.name);
          const { error } = await supabase.from("series").insert({
            jm_id: series.id,
            brand_jm_id: selectedBrandDb.jm_id,
            brand_id: selectedBrandDb.id,
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
            console.error('插入失败:', error);
            skipped++;
          } else {
            inserted++;
            logs.push({ action: 'insert', jm_id: series.id, name: series.name });
          }
        } else {
          const { isEqual, changes } = compareSeriesData(existing, series, subcompany, selectedBrandDb.jm_id, selectedBrandDb.id);
          
          if (isEqual) {
            console.log('车系数据完全一致，跳过:', series.name);
            skipped++;
            logs.push({ action: 'skip', jm_id: series.id, name: series.name });
          } else {
            console.log('车系数据不一致，更新:', series.name, changes);
            const { error } = await supabase
              .from("series")
              .update({
                brand_jm_id: selectedBrandDb.jm_id,
                brand_id: selectedBrandDb.id,
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
              console.error('更新失败:', error);
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
      console.log('导入结果:', { inserted, updated, skipped });
      
      if (inserted > 0 || updated > 0) {
        setActiveTab('log-view');
        loadDbSeries();
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
      <h3 className="text-2xl font-bold text-zinc-900">聚美智数车系数据导入</h3>
      <p className="mt-2 text-base text-zinc-500">
        从聚美智数 API 查询车系数据，预览后再导入数据库
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
                      onClick={loadDbBrands}
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
                                        src={brand.logo_url}
                                        alt=""
                                        className="h-8 w-8 rounded object-contain"
                                        onError={(e) => {
                                          const img = e.target as HTMLImageElement;
                                          img.style.display = 'none';
                                        }}
                                        referrerPolicy="no-referrer"
                                        crossOrigin="anonymous"
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
                                      src={series.logo}
                                      alt={series.name}
                                      className="h-8 w-8 rounded object-contain"
                                      onError={(e) => {
                                        console.error('车系Logo加载失败', series.name, series.logo);
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
              数据库车系列表（共 {dbSeries.length} 个车系）
            </h4>
            <button
              type="button"
              onClick={() => {
                loadDbBrands();
                loadDbSeries();
              }}
              disabled={dbSeriesLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {dbSeriesLoading ? '加载中...' : '刷新'}
            </button>
          </div>
          <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Logo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">聚美ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">车系名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">所属公司</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">销售状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {dbSeriesLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                      加载中...
                    </td>
                  </tr>
                ) : dbSeries.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  dbSeries.map((series) => (
                    <tr key={series.id} className="hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                        {series.logo_url ? (
                          <img
                            src={series.logo_url}
                            alt={series.name}
                            className="h-8 w-8 rounded object-contain"
                            onError={(e) => {
                              console.error('车系Logo加载失败', series.name, series.logo_url);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{series.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{series.jm_id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{series.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{series.subcompany_name || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        {series.salestate && (
                          <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                            series.salestate === '在销' 
                              ? 'bg-green-100 text-green-800'
                              : series.salestate === '待销'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {series.salestate}
                          </span>
                        )}
                      </td>
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
