import { useState } from "react";
import { supabase } from "@/utils/supabaseClient";

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
  const [dbBrands, setDbBrands] = useState<DbBrand[]>([]);
  const [dbBrandsLoading, setDbBrandsLoading] = useState(false);
  const [dbSeries, setDbSeries] = useState<DbSeries[]>([]);
  const [dbSeriesLoading, setDbSeriesLoading] = useState(false);
  const [dbModels, setDbModels] = useState<DbModel[]>([]);
  const [dbModelsLoading, setDbModelsLoading] = useState(false);
  const [selectedBrandId, setSelectedBrandId] = useState<number | null>(null);
  const [selectedSeriesId, setSelectedSeriesId] = useState<number | null>(null);
  const [selectedBrandDb, setSelectedBrandDb] = useState<DbBrand | null>(null);
  const [selectedSeriesDb, setSelectedSeriesDb] = useState<DbSeries | null>(null);
  const [brandSearchQuery, setBrandSearchQuery] = useState<string>("");
  const [seriesSearchQuery, setSeriesSearchQuery] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'import' | 'db-view' | 'log-view'>('import');
  const [changeLogs, setChangeLogs] = useState<ModelChangeLog[]>([]);

  async function loadDbBrands() {
    setDbBrandsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('brands')
        .select('*')
        .eq('depth', 1)
        .order('name', { ascending: true });
      
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
      const { data, error } = await supabase
        .from('series')
        .select('*')
        .eq('brand_jm_id', selectedBrandId)
        .order('name', { ascending: true });
      
      if (error) throw error;
      setDbSeries(data || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载车系数据库失败');
    } finally {
      setDbSeriesLoading(false);
    }
  }

  async function loadDbModels() {
    setDbModelsLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from('models_jumdata')
        .select('*')
        .order('jm_id', { ascending: true });
      
      if (error) throw error;
      setDbModels(data || []);
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

  async function queryModelsFromApi() {
    if (!jmAppId || !jmAppSecret) {
      setError("请先前往设置页面配置聚美智数的 App ID 和 App Secret");
      return;
    }
    if (!selectedSeriesId) {
      setError("请选择车系");
      return;
    }
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

    console.log('开始导入车型，总数:', total);

    try {
      for (let i = 0; i < allModels.length; i++) {
        const model = allModels[i];
        console.log(`处理车型 ${i+1}/${total}:`, model.name, model.id);

        try {
          const { data: existing, error: checkError } = await supabase
            .from("models_jumdata")
            .select("*")
            .eq("jm_id", model.id)
            .maybeSingle();

          if (checkError) {
            console.error('检查车型失败:', checkError);
            throw checkError;
          }

          if (!existing) {
            console.log('插入新车型:', model.name);
            const insertData = {
              jm_id: model.id,
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
              depth: 4,
            };
            console.log('插入数据:', insertData);
            const { error } = await supabase.from("models_jumdata").insert(insertData);

            if (error) {
              console.error('插入失败，详细错误:', error);
              console.error('错误消息:', error.message);
              console.error('错误代码:', error.code);
              console.error('错误详情:', error.details);
              console.error('错误提示:', error.hint);
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
              console.log('车型数据完全一致，跳过:', model.name);
              skipped++;
              logs.push({ action: 'skip', jm_id: model.id, name: model.name });
            } else {
              console.log('车型数据不一致，更新:', model.name, changes);
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
              console.log('更新数据:', updateData);
              const { error } = await supabase
                .from("models_jumdata")
                .update(updateData)
                .eq("jm_id", model.id);

              if (error) {
                console.error('更新失败:', error);
                console.error('错误消息:', error.message);
                console.error('错误代码:', error.code);
                console.error('错误详情:', error.details);
                console.error('错误提示:', error.hint);
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
          console.error(`处理车型 ${model.name} (${model.id}) 时出错:`, modelError);
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
      console.log('导入结果:', { inserted, updated, skipped, failed });

      if (inserted > 0 || updated > 0 || failed > 0) {
        setActiveTab('log-view');
        loadDbModels();
      }
    } catch (e) {
      console.error('导入出错:', e);
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
              
              <div className="mt-6 grid gap-6 sm:grid-cols-2">
                <div>
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
                                          src={brand.logo_url}
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
                        onClick={loadDbSeries}
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
                                          src={series.logo_url}
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
                        src={selectedSeriesDb.logo_url}
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
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">状态</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">ID</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100 bg-white">
                      {queryResult.list.map((model) => (
                        <tr key={model.id} className="hover:bg-zinc-50">
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                            {model.logo ? (
                              <img
                                src={model.logo}
                                alt={model.name}
                                className="h-8 w-8 rounded object-contain"
                                onError={(e) => {
                                  console.error('车型Logo加载失败', model.name, model.logo);
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
                            <div className="flex flex-col gap-1">
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                                model.productionstate === '在产' 
                                  ? 'bg-green-100 text-green-800'
                                  : model.productionstate === '停产'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {model.productionstate}
                              </span>
                              <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                                model.salestate === '在销' 
                                  ? 'bg-blue-100 text-blue-800'
                                  : model.salestate === '停销'
                                  ? 'bg-gray-100 text-gray-800'
                                  : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {model.salestate}
                              </span>
                            </div>
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
              数据库车型列表（共 {dbModels.length} 个车型）
            </h4>
            <button
              type="button"
              onClick={() => {
                loadDbBrands();
                loadDbSeries();
                loadDbModels();
              }}
              disabled={dbModelsLoading}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
            >
              {dbModelsLoading ? '加载中...' : '刷新'}
            </button>
          </div>
          <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
            <table className="min-w-full divide-y divide-zinc-200">
              <thead className="bg-zinc-50 sticky top-0">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">Logo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">聚美ID</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">车型名</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">年款</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">状态</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 bg-white">
                {dbModelsLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                      加载中...
                    </td>
                  </tr>
                ) : dbModels.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-sm text-zinc-500">
                      暂无数据
                    </td>
                  </tr>
                ) : (
                  dbModels.map((model) => (
                    <tr key={model.id} className="hover:bg-zinc-50">
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">
                        {model.logo_url ? (
                          <img
                            src={model.logo_url}
                            alt={model.name}
                            className="h-8 w-8 rounded object-contain"
                            onError={(e) => {
                              console.error('车型Logo加载失败', model.name, model.logo_url);
                              const target = e.target as HTMLImageElement;
                              target.style.display = 'none';
                            }}
                          />
                        ) : (
                          <span className="text-xs text-gray-400">-</span>
                        )}
                      </td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{model.id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{model.jm_id}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{model.name}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{model.yeartype || '-'}</td>
                      <td className="whitespace-nowrap px-4 py-3 text-sm">
                        <div className="flex flex-col gap-1">
                          {model.productionstate && (
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                              model.productionstate === '在产' 
                                ? 'bg-green-100 text-green-800'
                                : model.productionstate === '停产'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {model.productionstate}
                            </span>
                          )}
                          {model.salestate && (
                            <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold w-fit ${
                              model.salestate === '在销' 
                                ? 'bg-blue-100 text-blue-800'
                                : model.salestate === '停销'
                                ? 'bg-gray-100 text-gray-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }`}>
                              {model.salestate}
                            </span>
                          )}
                        </div>
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
    </div>
  );
}
