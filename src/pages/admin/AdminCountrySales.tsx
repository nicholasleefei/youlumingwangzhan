import { useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/utils/supabaseClient";
import { pageCardCls, pageTitleCls, pageDescCls } from "@/admin/AdminApp";
import { COUNTRY_LIST, matchCountryByName } from "@/data/countryList";
import * as XLSX from "xlsx";

type CountrySaleRow = {
  id: string;
  country_name: string;
  sales_volume: number;
  created_at: string;
  updated_at: string;
};

export default function AdminCountrySales() {
  const [rows, setRows] = useState<CountrySaleRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importPreview, setImportPreview] = useState<{ country_name: string; sales_volume: number }[]>([]);
  const [importOpen, setImportOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editCountry, setEditCountry] = useState("");
  const [editSales, setEditSales] = useState("");
  const [addCountry, setAddCountry] = useState("");
  const [addSales, setAddSales] = useState("");
  const [countrySearch, setCountrySearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCountryOptions = useMemo(() => {
    const q = countrySearch.trim().toLowerCase();
    if (!q) return COUNTRY_LIST;
    return COUNTRY_LIST.filter(
      (c) =>
        c.nameZh.includes(q) ||
        c.nameEn.toLowerCase().includes(q) ||
        c.code.toLowerCase().includes(q)
    );
  }, [countrySearch]);

  async function fetchRows() {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from("country_sales")
        .select("*")
        .order("sales_volume", { ascending: false });
      if (error) throw error;
      setRows(data || []);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRows();
  }, []);

  function showSuccess(msg: string) {
    setSuccess(msg);
    setTimeout(() => setSuccess(null), 3000);
  }

  async function handleUpsert(countryName: string, sales: number, id?: string) {
    if (!countryName.trim()) return;
    const normalized = matchCountryByName(countryName);
    const dbName = normalized ? `${normalized.nameZh} / ${normalized.nameEn}` : countryName.trim();
    const payload = {
      country_name: dbName,
      sales_volume: Math.max(0, parseInt(String(sales)) || 0),
      updated_at: new Date().toISOString(),
    };
    if (id) {
      const { error } = await supabase
        .from("country_sales")
        .update(payload)
        .eq("id", id);
      if (error) throw error;
      showSuccess("更新成功");
    } else {
      const { error } = await supabase
        .from("country_sales")
        .upsert([payload], { onConflict: "country_name" });
      if (error) throw error;
      showSuccess("添加成功");
    }
    setEditId(null);
    setEditCountry("");
    setEditSales("");
    setAddCountry("");
    setAddSales("");
    fetchRows();
  }

  async function handleDelete(id: string) {
    if (!confirm("确定删除这条数据？")) return;
    const { error } = await supabase.from("country_sales").delete().eq("id", id);
    if (error) { setError(error.message); return; }
    showSuccess("删除成功");
    fetchRows();
  }

  function handleDownloadTemplate() {
    const data = COUNTRY_LIST.map((c) => ({
      "国家(Country)": c.nameZh,
      "英文名(English)": c.nameEn,
      "销量(Sales Volume)": "",
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "国家销量");
    ws["!cols"] = [{ wch: 20 }, { wch: 30 }, { wch: 15 }];
    XLSX.writeFile(wb, "国家销量导入模板.xlsx");
  }

  async function handleBatchImport() {
    if (importPreview.length === 0) return;
    setSaving(true);
    setError(null);
    try {
      const payload = importPreview.map((item) => {
        const normalized = matchCountryByName(item.country_name);
        return {
          country_name: normalized ? `${normalized.nameZh} / ${normalized.nameEn}` : item.country_name.trim(),
          sales_volume: Math.max(0, parseInt(String(item.sales_volume)) || 0),
        };
      });
      const { error } = await supabase
        .from("country_sales")
        .upsert(payload, { onConflict: "country_name" });
      if (error) throw error;
      showSuccess(`成功导入 ${payload.length} 条数据`);
      setImportOpen(false);
      setImportPreview([]);
      fetchRows();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "导入失败");
    } finally {
      setSaving(false);
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const raw: unknown[][] = XLSX.utils.sheet_to_json(sheet, { header: 1 } as any) as unknown[][];

        if (!raw || raw.length < 2) {
          setError("Excel 文件内容为空或格式不对，请确保第一行是字段行（国家、销量），第二行起是数据");
          return;
        }
        const firstRow = raw[0];
        const colCount = firstRow.length;
        let countryCol = -1;
        let salesCol = -1;
        for (let i = 0; i < colCount; i++) {
          const header = String(firstRow[i] ?? "").trim().toLowerCase();
          if (header.includes("国家") || header.includes("country") || header.includes("中文") || header.includes("english")) countryCol = i;
          if (header.includes("销量") || header.includes("sales") || header.includes("volume")) salesCol = i;
        }
        if (countryCol === -1 || salesCol === -1) {
          setError("无法识别列：请确保 Excel 包含「国家」和「销量」两列（字段行为第一行）");
          return;
        }
        const parsed: { country_name: string; sales_volume: number }[] = [];
        for (let i = 1; i < raw.length; i++) {
          const row = raw[i];
          if (!row || row.length === 0) continue;
          const country = String(row[countryCol] ?? "").trim();
          const salesRaw = String(row[salesCol] ?? "").trim();
          const sales = parseInt(salesRaw) || 0;
          if (country) parsed.push({ country_name: country, sales_volume: sales });
        }
        if (parsed.length === 0) {
          setError("未找到有效数据（数据行从第二行开始，国家列不能为空）");
          return;
        }
        setImportPreview(parsed);
        setImportOpen(true);
        setError(null);
      } catch (err) {
        setError("Excel 解析失败：" + (err instanceof Error ? err.message : String(err)));
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = "";
  }

  const totalSales = useMemo(() => rows.reduce((sum, r) => sum + r.sales_volume, 0), [rows]);

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-6">
        <h3 className={pageTitleCls()}>国家销量管理</h3>
        <p className={pageDescCls()}>
          管理网站首页地球仪展示的各国销量数据，支持手动选择和 Excel 批量导入
        </p>
      </div>

      {success && (
        <div className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-base text-green-700">{success}</div>
      )}
      {error && (
        <div className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-base text-red-700">{error}</div>
      )}

      <div className="mb-6 flex flex-wrap items-end gap-4">
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <label className="text-xs font-medium text-zinc-500">国家</label>
          <select
            value={addCountry}
            onChange={(e) => setAddCountry(e.target.value)}
            className="rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
          >
            <option value="">选择国家...</option>
            {COUNTRY_LIST.map((c) => (
              <option key={c.code} value={c.nameZh}>
                {c.nameZh} / {c.nameEn}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1 rounded-xl border border-zinc-200 bg-white px-4 py-3 shadow-sm">
          <label className="text-xs font-medium text-zinc-500">销量（台）</label>
          <input
            type="number"
            value={addSales}
            onChange={(e) => setAddSales(e.target.value)}
            placeholder="如：1200"
            className="w-32 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none focus:ring-1 focus:ring-blue-200"
          />
        </div>
        <button
          type="button"
          onClick={() => {
            if (!addCountry) return;
            handleUpsert(addCountry, Number(addSales), undefined);
          }}
          disabled={saving || !addCountry}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          添加
        </button>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="rounded-lg border border-blue-600 px-4 py-2 text-sm font-medium text-blue-600 hover:bg-blue-50"
          >
            Excel 批量导入
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>

        <button
          type="button"
          onClick={handleDownloadTemplate}
          className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50"
        >
          下载导入模板
        </button>

        <div className="ml-auto flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm">
          <span className="text-zinc-500">共</span>
          <span className="font-semibold text-zinc-900">{rows.length}</span>
          <span className="text-zinc-500">个国家 · 合计</span>
          <span className="font-semibold text-blue-600">{totalSales.toLocaleString()}</span>
          <span className="text-zinc-500">台</span>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-zinc-200 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-200">
            <thead className="bg-gradient-to-r from-zinc-50 to-zinc-100">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-600">国家（中英文）</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">销量（台）</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-zinc-600">占比</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">更新时间</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wider text-zinc-600">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500">
                    加载中...
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-sm text-zinc-500">
                    暂无数据，请手动选择国家添加或使用 Excel 批量导入
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="hover:bg-zinc-50">
                    <td className="whitespace-nowrap px-6 py-4">
                      {editId === row.id ? (
                        <div className="flex items-center gap-1">
                          <select
                            value={editCountry}
                            onChange={(e) => setEditCountry(e.target.value)}
                            className="flex-1 rounded-lg border border-blue-400 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-blue-200"
                          >
                            <option value="">选择国家...</option>
                            {COUNTRY_LIST.map((c) => (
                              <option key={c.code} value={c.nameZh}>
                                {c.nameZh} / {c.nameEn}
                              </option>
                            ))}
                          </select>
                        </div>
                      ) : (
                        <span className="font-medium text-zinc-900">{row.country_name}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right">
                      {editId === row.id ? (
                        <input
                          type="number"
                          value={editSales}
                          onChange={(e) => setEditSales(e.target.value)}
                          className="w-32 rounded-lg border border-blue-400 px-2 py-1 text-sm text-right focus:outline-none focus:ring-1 focus:ring-blue-200"
                        />
                      ) : (
                        <span className="font-semibold text-zinc-900">{row.sales_volume.toLocaleString()}</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-sm text-zinc-500">
                      {totalSales > 0 ? ((row.sales_volume / totalSales) * 100).toFixed(1) : "0.0"}%
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center text-xs text-zinc-500">
                      {new Date(row.updated_at).toLocaleString("zh-CN")}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-center">
                      {editId === row.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              handleUpsert(editCountry, Number(editSales), row.id)
                            }
                            disabled={saving}
                            className="rounded-md bg-green-600 px-3 py-1 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            保存
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditId(null);
                              setEditCountry("");
                              setEditSales("");
                            }}
                            className="rounded-md border border-zinc-300 px-3 py-1 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
                          >
                            取消
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setEditId(row.id);
                              setEditCountry(row.country_name.split(" / ")[0] || row.country_name);
                              setEditSales(String(row.sales_volume));
                            }}
                            className="rounded-md border border-blue-200 px-3 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                          >
                            编辑
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(row.id)}
                            className="rounded-md border border-red-200 px-3 py-1 text-xs font-medium text-red-500 hover:bg-red-50"
                          >
                            删除
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {importOpen && importPreview.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => !saving && (setImportOpen(false), setImportPreview([]))} />
          <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-xl border border-zinc-200 overflow-hidden">
            <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-zinc-200">
              <div>
                <div className="text-lg font-semibold text-zinc-900">Excel 导入预览</div>
                <div className="mt-1 text-sm text-zinc-600">
                  共识别 {importPreview.length} 条数据，确认后将覆盖/新增对应国家的数据
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setImportOpen(false); setImportPreview([]); }}
                disabled={saving}
                className="rounded-lg p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600"
              >
                ✕
              </button>
            </div>
            <div className="max-h-80 overflow-y-auto">
              <table className="min-w-full">
                <thead className="bg-zinc-50 sticky top-0">
                  <tr>
                    <th className="px-6 py-2 text-left text-xs font-semibold text-zinc-600">国家</th>
                    <th className="px-6 py-2 text-right text-xs font-semibold text-zinc-600">销量（台）</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {importPreview.map((item, idx) => (
                    <tr key={idx}>
                      <td className="px-6 py-2 text-sm text-zinc-900">{item.country_name}</td>
                      <td className="px-6 py-2 text-right text-sm font-medium text-zinc-900">{item.sales_volume.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 bg-zinc-50">
              <button
                type="button"
                onClick={() => { setImportOpen(false); setImportPreview([]); }}
                disabled={saving}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
              >
                取消
              </button>
              <button
                type="button"
                onClick={handleBatchImport}
                disabled={saving}
                className="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? "导入中..." : `确认导入 ${importPreview.length} 条`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}