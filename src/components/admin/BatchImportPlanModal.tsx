import { useMemo } from "react";

export type BatchImportPlanItem = {
  id: string | number;
  title: string;
  exists: boolean;
  enabled: boolean;
  subtitle?: string;
};

type Props = {
  open: boolean;
  title: string;
  items: BatchImportPlanItem[];
  loading?: boolean;
  onClose: () => void;
  onToggle: (id: string | number) => void;
  onSetMany: (ids: Array<string | number>, enabled: boolean) => void;
  onConfirm: () => void;
};

export default function BatchImportPlanModal({
  open,
  title,
  items,
  loading,
  onClose,
  onToggle,
  onSetMany,
  onConfirm,
}: Props) {
  const stats = useMemo(() => {
    const total = items.length;
    const exists = items.filter(i => i.exists).length;
    const enabled = items.filter(i => i.enabled).length;
    const willUpdate = items.filter(i => i.enabled && i.exists).length;
    const willInsert = items.filter(i => i.enabled && !i.exists).length;
    return { total, exists, enabled, willUpdate, willInsert };
  }, [items]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-xl border border-zinc-200 overflow-hidden">
        <div className="flex items-start justify-between gap-3 px-6 py-4 border-b border-zinc-200">
          <div className="min-w-0">
            <div className="text-lg font-semibold text-zinc-900 truncate">{title}</div>
            <div className="mt-1 text-sm text-zinc-600">
              共 {stats.total} 项 · 已存在 {stats.exists} · 将导入 {stats.enabled}（新增 {stats.willInsert} / 更新 {stats.willUpdate}）
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
          >
            关闭
          </button>
        </div>

        <div className="px-6 py-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => onSetMany(items.map(i => i.id), true)}
              disabled={loading || items.length === 0}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
            >
              全部导入
            </button>
            <button
              type="button"
              onClick={() => onSetMany(items.map(i => i.id), false)}
              disabled={loading || items.length === 0}
              className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
            >
              全部不导入
            </button>
            <button
              type="button"
              onClick={() => onSetMany(items.filter(i => !i.exists).map(i => i.id), true)}
              disabled={loading || items.length === 0}
              className="rounded-lg bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100 disabled:opacity-50"
            >
              仅导入不存在
            </button>
            <button
              type="button"
              onClick={() => onSetMany(items.filter(i => i.exists).map(i => i.id), true)}
              disabled={loading || items.length === 0}
              className="rounded-lg bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100 disabled:opacity-50"
            >
              也更新已存在
            </button>
          </div>
        </div>

        <div className="max-h-[55vh] overflow-auto border-y border-zinc-200">
          {items.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-zinc-500">暂无可导入项</div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {items.map((it) => (
                <div key={String(it.id)} className="flex items-center justify-between gap-4 px-6 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-zinc-900 truncate">{it.title}</div>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${it.exists ? 'bg-amber-50 text-amber-700' : 'bg-green-50 text-green-700'}`}>
                        {it.exists ? '已存在' : '不存在'}
                      </span>
                    </div>
                    {it.subtitle ? (
                      <div className="mt-1 text-xs text-zinc-600 truncate">{it.subtitle}</div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => onToggle(it.id)}
                    disabled={loading}
                    className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors ${it.enabled ? 'bg-blue-600' : 'bg-zinc-300'} disabled:opacity-50`}
                    aria-pressed={it.enabled}
                  >
                    <span
                      className={`inline-block h-6 w-6 transform rounded-full bg-white shadow transition-transform ${it.enabled ? 'translate-x-7' : 'translate-x-1'}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 px-6 py-4">
          <div className="text-xs text-zinc-500">默认：已存在的不导入，不存在的导入</div>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading || items.filter(i => i.enabled).length === 0}
            className="rounded-xl bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            开始导入
          </button>
        </div>
      </div>
    </div>
  );
}

