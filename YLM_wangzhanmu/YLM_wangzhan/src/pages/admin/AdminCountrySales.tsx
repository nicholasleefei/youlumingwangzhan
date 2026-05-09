import { useEffect, useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/utils/supabaseClient";
import type { CountrySalesRow } from "@/utils/db";
import countriesTopo from "world-atlas/countries-110m.json";
import { feature } from "topojson-client";
import { primaryButtonCls, tableContainerCls } from "@/admin/AdminApp";

export default function AdminCountrySales() {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<CountrySalesRow[]>([]);
  const [editing, setEditing] = useState<CountrySalesRow | null>(null);
  const [newCountry, setNewCountry] = useState("");
  const [newSales, setNewSales] = useState("");

  const availableCountries = useMemo(() => {
    const topo: any = countriesTopo as any;
    const obj = topo.objects?.countries;
    if (!obj) return [];
    const features = feature(topo, obj);
    return (features as any).features
      .map((f: any) => f.properties?.name)
      .filter(Boolean)
      .sort();
  }, []);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const { data, error: qErr } = await supabase
        .from("country_sales")
        .select("*")
        .order("sales_volume", { ascending: false });
      if (qErr) throw qErr;
      setItems((data ?? []) as CountrySalesRow[]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  async function addCountry() {
    if (!newCountry.trim()) return;
    const sales = parseInt(newSales) || 0;
    setLoading(true);
    setError(null);
    try {
      const { error: insErr } = await supabase
        .from("country_sales")
        .insert({ country_name: newCountry.trim(), sales_volume: sales });
      if (insErr) throw insErr;
      setNewCountry("");
      setNewSales("");
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "添加失败");
    } finally {
      setLoading(false);
    }
  }

  async function updateCountry(item: CountrySalesRow) {
    setLoading(true);
    setError(null);
    try {
      const { error: upErr } = await supabase
        .from("country_sales")
        .update({ country_name: item.country_name, sales_volume: item.sales_volume })
        .eq("id", item.id);
      if (upErr) throw upErr;
      setEditing(null);
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "更新失败");
    } finally {
      setLoading(false);
    }
  }

  async function deleteCountry(id: string) {
    if (!confirm("确定要删除这个国家的销量数据吗？")) return;
    setLoading(true);
    setError(null);
    try {
      const { error: delErr } = await supabase.from("country_sales").delete().eq("id", id);
      if (delErr) throw delErr;
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "删除失败");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <div className="flex items-center justify-between">
          <div className="text-lg font-bold text-zinc-900">国家销量管理</div>
          <button
            type="button"
            onClick={refresh}
            className={primaryButtonCls()}
            disabled={loading}
          >
            {loading ? "加载中..." : "刷新"}
          </button>
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-base text-zinc-500">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600"></div>
            <span>加载中...</span>
          </div>
        ) : null}
        {error ? (
          <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-base text-red-700">
            {error}
          </div>
        ) : null}

        <div className="mt-4 space-y-3 rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-white to-zinc-50 p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-12">
            <div className="sm:col-span-5">
              <label className="text-sm font-semibold text-zinc-700 mb-1.5 block">国家名称</label>
              <select
                value={newCountry}
                onChange={(e) => setNewCountry(e.target.value)}
                className="h-11 w-full rounded-2xl border border-zinc-200/60 bg-white px-4 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              >
                <option value="">请选择一个国家</option>
                {availableCountries.map((name) => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-4">
              <label className="text-sm font-semibold text-zinc-700 mb-1.5 block">销售量</label>
              <input
                type="number"
                value={newSales}
                onChange={(e) => setNewSales(e.target.value)}
                placeholder="例如：100"
                min="0"
                className="h-11 w-full rounded-2xl border border-zinc-200/60 bg-white px-4 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
              />
            </div>
            <div className="sm:col-span-3 flex items-end">
              <button
                type="button"
                disabled={loading || !newCountry}
                onClick={addCountry}
                className="h-11 w-full rounded-2xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                添加
              </button>
            </div>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="mt-4 rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-8 text-center text-base text-zinc-600">
            暂无销量数据
          </div>
        ) : (
          <div className={tableContainerCls()}>
            <div className="grid grid-cols-12 gap-2 bg-gradient-to-r from-zinc-50 to-zinc-100 px-4 py-3 text-xs font-semibold text-zinc-600">
              <div className="col-span-6">国家名称</div>
              <div className="col-span-3">销售量</div>
              <div className="col-span-3">操作</div>
            </div>
            {items.map((it) => (
              <div
                key={it.id}
                className="grid w-full grid-cols-12 gap-2 border-t border-zinc-200/60 px-4 py-3 text-sm hover:bg-zinc-50/80 transition-colors duration-200"
              >
                {editing?.id === it.id ? (
                  <>
                    <div className="col-span-6">
                      <select
                        value={editing.country_name}
                        onChange={(e) => setEditing({ ...editing, country_name: e.target.value })}
                        className="h-9 w-full rounded-xl border border-zinc-200/60 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      >
                        <option value="">请选择一个国家</option>
                        {availableCountries.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                    </div>
                    <div className="col-span-3">
                      <input
                        type="number"
                        value={editing.sales_volume}
                        onChange={(e) => setEditing({ ...editing, sales_volume: parseInt(e.target.value) || 0 })}
                        min="0"
                        className="h-9 w-full rounded-xl border border-zinc-200/60 bg-white px-3 text-sm text-zinc-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200"
                      />
                    </div>
                    <div className="col-span-3 flex gap-2">
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => updateCountry(editing)}
                        className="h-9 flex-1 rounded-xl bg-gradient-to-r from-green-600 to-green-700 px-3 text-xs font-semibold text-white shadow-sm shadow-green-500/20 hover:from-green-700 hover:to-green-800 transition-all duration-200 disabled:opacity-50"
                      >
                        保存
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditing(null)}
                        className="h-9 flex-1 rounded-xl bg-zinc-200 px-3 text-xs font-semibold text-zinc-700 hover:bg-zinc-300 transition-all duration-200"
                      >
                        取消
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="col-span-6 truncate text-base text-zinc-900">{it.country_name}</div>
                    <div className="col-span-3 truncate text-sm text-zinc-600">{it.sales_volume.toLocaleString()}</div>
                    <div className="col-span-3 flex gap-2">
                      <button
                        type="button"
                        onClick={() => setEditing(it)}
                        className="h-9 flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-3 text-xs font-semibold text-white shadow-sm shadow-blue-500/20 hover:from-blue-700 hover:to-blue-800 transition-all duration-200"
                      >
                        编辑
                      </button>
                      <button
                        type="button"
                        disabled={loading}
                        onClick={() => deleteCountry(it.id)}
                        className="h-9 flex-1 rounded-xl bg-gradient-to-r from-red-600 to-red-700 px-3 text-xs font-semibold text-white shadow-sm shadow-red-500/20 hover:from-red-700 hover:to-red-800 transition-all duration-200 disabled:opacity-50"
                      >
                        删除
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
