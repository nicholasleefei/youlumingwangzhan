import { useState, useEffect } from 'react';
import { activityStatusMap, getActivityStatusLabel, getActivityStatusColor } from '@/utils/fieldLabels';

interface BatchOperationsProps {
  tableName: string;
  selectedIds: string[];
  totalCount: number;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onBatchUpdate: (status: number) => Promise<void>;
  loading?: boolean;
}

export default function BatchOperations({
  tableName,
  selectedIds,
  totalCount,
  onSelectAll,
  onClearSelection,
  onBatchUpdate,
  loading = false,
}: BatchOperationsProps) {
  // 获取上次设置的状态
  const getLastStatus = (): number => {
    const saved = localStorage.getItem(`lastActivityStatus_${tableName}`);
    return saved ? parseInt(saved, 10) : 0;
  };

  const [selectedStatus, setSelectedStatus] = useState<number>(getLastStatus());
  const [updating, setUpdating] = useState(false);

  // 保存上次设置的状态
  const saveLastStatus = (status: number) => {
    localStorage.setItem(`lastActivityStatus_${tableName}`, status.toString());
  };

  const handleBatchUpdate = async () => {
    if (selectedIds.length === 0) return;

    setUpdating(true);
    try {
      await onBatchUpdate(selectedStatus);
      saveLastStatus(selectedStatus);
    } finally {
      setUpdating(false);
    }
  };

  const isAllSelected = selectedIds.length === totalCount && totalCount > 0;
  const isPartiallySelected = selectedIds.length > 0 && selectedIds.length < totalCount;

  return (
    <div className="border border-zinc-200 rounded-xl bg-zinc-50 p-4 mb-4">
      <div className="flex flex-wrap items-center gap-4">
        {/* 选择控制 */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onSelectAll}
            disabled={loading}
            className="px-3 py-2 text-sm font-medium rounded-lg bg-blue-100 text-blue-700 hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isAllSelected ? '取消全选' : '全选'}
          </button>
          {selectedIds.length > 0 && (
            <button
              type="button"
              onClick={onClearSelection}
              disabled={loading}
              className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              清空选择
            </button>
          )}
        </div>

        {/* 选择状态显示 */}
        <div className="text-sm text-zinc-600">
          {selectedIds.length > 0 ? (
            <span>已选择 <strong>{selectedIds.length}</strong> / {totalCount} 项</span>
          ) : (
            <span>共 {totalCount} 项</span>
          )}
        </div>

        {/* 批量操作区域 - 仅当有选择时显示 */}
        {selectedIds.length > 0 && (
          <div className="flex items-center gap-2 ml-auto">
            <span className="text-sm font-medium text-zinc-700">设置为：</span>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(parseInt(e.target.value, 10))}
              disabled={loading || updating}
              className="px-3 py-2 text-sm border border-zinc-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed bg-white"
            >
              {Object.entries(activityStatusMap).map(([value, label]) => (
                <option key={value} value={parseInt(value, 10)}>
                  {label}
                </option>
              ))}
            </select>
            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getActivityStatusColor(selectedStatus)}`}>
              {getActivityStatusLabel(selectedStatus)}
            </span>
            <button
              type="button"
              onClick={handleBatchUpdate}
              disabled={loading || updating}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {updating ? (
                <>
                  <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span>
                  暂存中...
                </>
              ) : (
                '暂存设置'
              )}
            </button>
          </div>
        )}
      </div>

      {/* 提示信息 */}
      <div className="mt-2 text-xs text-zinc-500">
        <span>上次使用的设置为：</span>
        <span className={`inline-flex px-1.5 py-0.5 text-xs font-semibold rounded-full ml-1 ${getActivityStatusColor(getLastStatus())}`}>
          {getActivityStatusLabel(getLastStatus())}
        </span>
      </div>
    </div>
  );
}
