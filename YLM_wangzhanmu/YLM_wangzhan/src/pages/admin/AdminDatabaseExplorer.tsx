import { useState, useEffect } from "react";
import { supabase } from "@/utils/supabaseClient";

type TableInfo = {
  id: number;
  schema: string;
  name: string;
  rls_enabled: boolean;
  live_rows_estimate: number;
};

type ColumnInfo = {
  ordinal_position: number;
  name: string;
  data_type: string;
  is_nullable: boolean;
  default_value: string | null;
  is_identity: boolean;
  is_unique: boolean;
};

type PrimaryKeyInfo = {
  schema: string;
  table_name: string;
  name: string;
};

export default function AdminDatabaseExplorer() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [tablesLoading, setTablesLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [primaryKeys, setPrimaryKeys] = useState<PrimaryKeyInfo[]>([]);
  const [columnsLoading, setColumnsLoading] = useState(false);
  const [tableData, setTableData] = useState<any[]>([]);
  const [tableDataLoading, setTableDataLoading] = useState(false);
  const [tableDataError, setTableDataError] = useState<string | null>(null);
  const [pageSize, setPageSize] = useState(50);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalRows, setTotalRows] = useState(0);
  const [activeTab, setActiveTab] = useState<'structure' | 'data'>('structure');
  const [apiJsonInput, setApiJsonInput] = useState("");
  const [apiJsonPreview, setApiJsonPreview] = useState<any>(null);
  const [generatedSql, setGeneratedSql] = useState("");
  const [generatingSql, setGeneratingSql] = useState(false);

  useEffect(() => {
    loadTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      loadTableColumns(selectedTable);
      loadTableData(selectedTable, 1, pageSize);
    }
  }, [selectedTable]);

  async function loadTables() {
    setTablesLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_tables_list');
      if (error) throw error;
      setTables(data || []);
    } catch (e) {
      console.error('加载表列表失败:', e);
    } finally {
      setTablesLoading(false);
    }
  }

  async function loadTableColumns(tableName: string) {
    setColumnsLoading(true);
    try {
      const [colsResult, pkResult] = await Promise.all([
        supabase.rpc('get_table_columns', { table_name: tableName }),
        supabase.rpc('get_table_primary_keys', { table_name: tableName })
      ]);
      
      if (colsResult.error) throw colsResult.error;
      if (pkResult.error) throw pkResult.error;
      
      setColumns(colsResult.data || []);
      setPrimaryKeys(pkResult.data || []);
    } catch (e) {
      console.error('加载表结构失败:', e);
    } finally {
      setColumnsLoading(false);
    }
  }

  async function loadTableData(tableName: string, page: number, size: number) {
    setTableDataLoading(true);
    setTableDataError(null);
    try {
      const from = (page - 1) * size;
      const to = from + size - 1;
      
      const { data, error, count } = await supabase
        .from(tableName)
        .select('*', { count: 'exact' })
        .range(from, to);
      
      if (error) throw error;
      
      setTableData(data || []);
      setTotalRows(count || 0);
      setCurrentPage(page);
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : '加载数据失败';
      setTableDataError(errorMsg);
      console.error('加载表数据失败:', e);
    } finally {
      setTableDataLoading(false);
    }
  }

  function parseApiJson() {
    try {
      const parsed = JSON.parse(apiJsonInput);
      setApiJsonPreview(parsed);
      generateTableSql(parsed);
    } catch (e) {
      alert('JSON解析失败: ' + (e instanceof Error ? e.message : '无效的JSON'));
    }
  }

  function generateTableSql(data: any) {
    setGeneratingSql(true);
    try {
      let sql = '';
      let sampleData: any = null;
      
      if (Array.isArray(data)) {
        sampleData = data[0];
      } else if (data.data && Array.isArray(data.data)) {
        sampleData = data.data[0];
      } else if (data.list && Array.isArray(data.list)) {
        sampleData = data.list[0];
      } else if (typeof data === 'object') {
        sampleData = data;
      }
      
      if (!sampleData) {
        setGeneratedSql('-- 无法解析数据结构，请提供有效的数组或对象');
        return;
      }
      
      const tableName = 'auto_generated_table';
      
      sql += `-- ================================================\n`;
      sql += `-- 自动生成的表结构\n`;
      sql += `-- ================================================\n\n`;
      
      sql += `create table if not exists public.${tableName} (\n`;
      sql += `  id uuid primary key default gen_random_uuid(),\n`;
      
      const columns = Object.keys(sampleData);
      columns.forEach((key, index) => {
        const value = sampleData[key];
        const dataType = inferDataType(value);
        const isLast = index === columns.length - 1;
        
        sql += `  ${key} ${dataType}`;
        if (!isLast) sql += ',';
        sql += '\n';
      });
      
      sql += `  created_at timestamptz not null default now(),\n`;
      sql += `  updated_at timestamptz not null default now()\n`;
      sql += `);\n\n`;
      
      sql += `-- ================================================\n`;
      sql += `-- 索引建议\n`;
      sql += `-- ================================================\n\n`;
      
      columns.forEach(key => {
        if (key.includes('id') || key.includes('_id')) {
          sql += `create index if not exists idx_${tableName}_${key} on public.${tableName}(${key});\n`;
        }
      });
      
      sql += `\n-- ================================================\n`;
      sql += `-- RLS和权限配置\n`;
      sql += `-- ================================================\n\n`;
      
      sql += `alter table public.${tableName} enable row level security;\n\n`;
      
      sql += `create policy ${tableName}_select_all\n`;
      sql += `on public.${tableName}\n`;
      sql += `for select\n`;
      sql += `to anon\n`;
      sql += `using (true);\n\n`;
      
      sql += `create policy ${tableName}_all_for_admin\n`;
      sql += `on public.${tableName}\n`;
      sql += `for all\n`;
      sql += `to authenticated\n`;
      sql += `using (true)\n`;
      sql += `with check (true);\n\n`;
      
      sql += `grant select on public.${tableName} to anon;\n`;
      sql += `grant all privileges on public.${tableName} to authenticated;\n`;
      
      setGeneratedSql(sql);
    } catch (e) {
      setGeneratedSql('-- 生成SQL失败: ' + (e instanceof Error ? e.message : '未知错误'));
    } finally {
      setGeneratingSql(false);
    }
  }

  function inferDataType(value: any): string {
    if (value === null || value === undefined) {
      return 'text';
    }
    if (typeof value === 'boolean') {
      return 'boolean';
    }
    if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        return 'integer';
      }
      return 'numeric';
    }
    if (typeof value === 'object') {
      return 'jsonb';
    }
    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return 'date';
      }
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) {
        return 'timestamptz';
      }
      if (value.length > 1000) {
        return 'text';
      }
      return 'text';
    }
    return 'text';
  }

  function formatValue(value: any): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }

  const totalPages = Math.ceil(totalRows / pageSize);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-bold text-zinc-900">数据库表管理器</h3>
          <p className="mt-2 text-base text-zinc-500">
            查看、管理数据库表，以及从API返回值自动生成表结构
          </p>
        </div>
        <button
          type="button"
          onClick={loadTables}
          disabled={tablesLoading}
          className="inline-flex items-center gap-2 rounded-xl bg-zinc-100 px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
        >
          {tablesLoading ? '刷新中...' : '刷新表列表'}
        </button>
      </div>

      <div className="flex gap-2 border-b border-zinc-200 pb-2 mb-6">
        <button
          type="button"
          onClick={() => setActiveTab('structure')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'structure'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          表结构管理
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('data')}
          className={`px-4 py-2 rounded-t-lg font-medium transition-colors ${
            activeTab === 'data'
              ? 'bg-blue-50 text-blue-600 border-b-2 border-blue-600'
              : 'text-zinc-500 hover:text-zinc-700'
          }`}
        >
          数据浏览器
        </button>
      </div>

      {activeTab === 'structure' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-2">
            <div>
              <h4 className="text-lg font-semibold text-zinc-900 mb-4">API JSON 输入</h4>
              <textarea
                value={apiJsonInput}
                onChange={(e) => setApiJsonInput(e.target.value)}
                placeholder="粘贴API返回的JSON数据..."
                className="w-full h-64 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-mono text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
              <div className="mt-4 flex gap-3">
                <button
                  type="button"
                  onClick={parseApiJson}
                  className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-6 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  解析并生成表结构
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setApiJsonInput("");
                    setApiJsonPreview(null);
                    setGeneratedSql("");
                  }}
                  className="inline-flex items-center justify-center rounded-xl bg-zinc-100 px-6 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 transition-colors"
                >
                  清空
                </button>
              </div>
            </div>

            <div>
              <h4 className="text-lg font-semibold text-zinc-900 mb-4">生成的 SQL</h4>
              <textarea
                value={generatedSql}
                readOnly
                className="w-full h-64 rounded-xl border border-zinc-200 px-4 py-3 text-sm font-mono text-zinc-900 bg-zinc-50"
              />
              {generatedSql && (
                <div className="mt-4">
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard.writeText(generatedSql);
                      alert('SQL已复制到剪贴板！');
                    }}
                    className="inline-flex items-center justify-center rounded-xl bg-green-600 px-6 py-2 text-sm font-semibold text-white hover:bg-green-700 transition-colors"
                  >
                    复制 SQL
                  </button>
                </div>
              )}
            </div>
          </div>

          {apiJsonPreview && (
            <div>
              <h4 className="text-lg font-semibold text-zinc-900 mb-4">解析的数据预览（二维表格式）</h4>
              <div className="max-h-64 overflow-auto rounded-xl border border-zinc-200">
                <table className="min-w-full divide-y divide-zinc-200">
                  <thead className="bg-zinc-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">字段名</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">值</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">数据类型</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100 bg-white">
                    {Object.entries(apiJsonPreview).map(([key, value]) => (
                      <tr key={key} className="hover:bg-zinc-50">
                        <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-zinc-900">{key}</td>
                        <td className="px-4 py-3 text-sm text-zinc-600 max-w-xs truncate" title={formatValue(value)}>
                          {formatValue(value)}
                        </td>
                        <td className="whitespace-nowrap px-4 py-3 text-sm text-zinc-500">{inferDataType(value)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === 'data' && (
        <div className="space-y-6">
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <h4 className="text-lg font-semibold text-zinc-900 mb-4">选择表</h4>
              <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
                {tablesLoading ? (
                  <div className="p-8 text-center text-sm text-zinc-500">加载中...</div>
                ) : tables.length === 0 ? (
                  <div className="p-8 text-center text-sm text-zinc-500">暂无表</div>
                ) : (
                  <ul className="divide-y divide-zinc-100">
                    {tables.map((table) => (
                      <li key={table.id}>
                        <button
                          type="button"
                          onClick={() => setSelectedTable(table.name)}
                          className={`w-full px-4 py-3 text-left transition-colors ${
                            selectedTable === table.name
                              ? 'bg-blue-50 text-blue-700'
                              : 'hover:bg-zinc-50 text-zinc-900'
                          }`}
                        >
                          <div className="font-medium">{table.name}</div>
                          <div className="text-xs text-zinc-500">
                            {table.schema} · {table.live_rows_estimate} 行
                            {table.rls_enabled && ' · RLS启用'}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            <div className="lg:col-span-2">
              {!selectedTable ? (
                <div className="p-12 text-center rounded-xl border border-zinc-200 border-dashed">
                  <div className="text-zinc-500">请从左侧选择一个表</div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-zinc-900">
                      {selectedTable}
                    </h4>
                    <div className="flex items-center gap-2">
                      <select
                        value={pageSize}
                        onChange={(e) => {
                          setPageSize(Number(e.target.value));
                          loadTableData(selectedTable, 1, Number(e.target.value));
                        }}
                        className="rounded-lg border border-zinc-200 px-3 py-1 text-sm text-zinc-900"
                      >
                        <option value={20}>20条/页</option>
                        <option value={50}>50条/页</option>
                        <option value={100}>100条/页</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => loadTableData(selectedTable, currentPage, pageSize)}
                        disabled={tableDataLoading}
                        className="inline-flex items-center gap-2 rounded-lg bg-zinc-100 px-3 py-1 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50 transition-colors"
                      >
                        {tableDataLoading ? '加载中...' : '刷新'}
                      </button>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        loadTableColumns(selectedTable);
                      }}
                      className="px-3 py-1 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                    >
                      表结构
                    </button>
                    <button
                      type="button"
                      onClick={() => loadTableData(selectedTable, currentPage, pageSize)}
                      className="px-3 py-1 text-sm rounded-lg bg-blue-50 text-blue-700 border border-blue-200"
                    >
                      数据
                    </button>
                  </div>

                  {columnsLoading ? (
                    <div className="p-8 text-center text-sm text-zinc-500 rounded-xl border border-zinc-200">
                      加载表结构中...
                    </div>
                  ) : columns.length > 0 && (
                    <div className="max-h-48 overflow-auto rounded-xl border border-zinc-200">
                      <table className="min-w-full divide-y divide-zinc-200">
                        <thead className="bg-zinc-50 sticky top-0">
                          <tr>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">#</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">列名</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">数据类型</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">可空</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">默认值</th>
                            <th className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500">主键</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 bg-white">
                          {columns.map((col) => {
                            const isPk = primaryKeys.some(pk => pk.name === col.name);
                            return (
                              <tr key={col.ordinal_position} className="hover:bg-zinc-50">
                                <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-500">{col.ordinal_position}</td>
                                <td className="whitespace-nowrap px-4 py-2 text-sm font-medium text-zinc-900">{col.name}</td>
                                <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-500">{col.data_type}</td>
                                <td className="whitespace-nowrap px-4 py-2 text-sm">
                                  <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
                                    col.is_nullable
                                      ? 'bg-yellow-100 text-yellow-800'
                                      : 'bg-red-100 text-red-800'
                                  }`}>
                                    {col.is_nullable ? '是' : '否'}
                                  </span>
                                </td>
                                <td className="whitespace-nowrap px-4 py-2 text-sm text-zinc-500">{col.default_value || '-'}</td>
                                <td className="whitespace-nowrap px-4 py-2 text-sm">
                                  {isPk && (
                                    <span className="inline-flex px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
                                      PK
                                    </span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {tableDataLoading ? (
                    <div className="p-8 text-center text-sm text-zinc-500 rounded-xl border border-zinc-200">
                      加载数据中...
                    </div>
                  ) : tableDataError ? (
                    <div className="p-8 text-center text-sm text-red-600 rounded-xl border border-red-200 bg-red-50">
                      {tableDataError}
                    </div>
                  ) : tableData.length > 0 && (
                    <>
                      <div className="max-h-96 overflow-auto rounded-xl border border-zinc-200">
                        <table className="min-w-full divide-y divide-zinc-200">
                          <thead className="bg-zinc-50 sticky top-0">
                            <tr>
                              {Object.keys(tableData[0]).map((key) => (
                                <th key={key} className="px-4 py-2 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500 whitespace-nowrap">
                                  {key}
                                </th>
                              ))}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-100 bg-white">
                            {tableData.map((row, rowIndex) => (
                              <tr key={rowIndex} className="hover:bg-zinc-50">
                                {Object.values(row).map((value, colIndex) => (
                                  <td key={colIndex} className="px-4 py-2 text-sm text-zinc-600 whitespace-nowrap max-w-xs truncate" title={formatValue(value)}>
                                    {formatValue(value)}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {totalPages > 1 && (
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-zinc-500">
                            共 {totalRows} 条记录，第 {currentPage}/{totalPages} 页
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => loadTableData(selectedTable, currentPage - 1, pageSize)}
                              disabled={currentPage === 1}
                              className="px-3 py-1 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              上一页
                            </button>
                            <button
                              type="button"
                              onClick={() => loadTableData(selectedTable, currentPage + 1, pageSize)}
                              disabled={currentPage === totalPages}
                              className="px-3 py-1 text-sm rounded-lg border border-zinc-200 text-zinc-600 hover:bg-zinc-50 disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              下一页
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
