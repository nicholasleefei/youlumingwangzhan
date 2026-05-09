import React from 'react';

type AdminTableProps<T> = {
  columns: {
    key: string;
    label: string;
    render: (row: T) => React.ReactNode;
  }[];
  data: T[];
  loading: boolean;
  emptyText?: string;
  className?: string;
};

export default function AdminTable<T>({
  columns,
  data,
  loading,
  emptyText = '暂无数据',
  className = '',
}: AdminTableProps<T>) {
  return (
    <div className={`max-h-96 overflow-auto rounded-xl border border-zinc-200 ${className}`}>
      <table className="min-w-full divide-y divide-zinc-200">
        <thead className="bg-zinc-50 sticky top-0">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-zinc-500"
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-100 bg-white">
          {loading ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-zinc-500">
                加载中...
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="px-4 py-8 text-center text-sm text-zinc-500">
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr key={index} className="hover:bg-zinc-50">
                {columns.map((column) => (
                  <td key={column.key} className="whitespace-nowrap px-4 py-3 text-sm">
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
