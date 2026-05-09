import { countStaged, type StagedItem } from "@/utils/stagedCrud";

type Props = {
  title?: string;
  stagedItems: StagedItem[];
  busy?: boolean;
  onAdd?: () => void;
  onDiscardAll: () => void;
  onConfirm: () => void;
  confirmText?: string;
};

export default function StagedCrudToolbar({
  title,
  stagedItems,
  busy,
  onAdd,
  onDiscardAll,
  onConfirm,
  confirmText = "确认更新",
}: Props) {
  const counts = countStaged(stagedItems);
  const hasChanges = counts.total > 0;

  return (
    <div className="mb-4 rounded-xl border border-zinc-200 bg-white p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          {title ? <div className="text-sm font-semibold text-zinc-900">{title}</div> : null}
          <div className="text-xs text-zinc-600">
            未提交变更：{counts.total}（新增 {counts.insert} / 修改 {counts.update} / 删除 {counts.delete}）
          </div>
        </div>
        <div className="flex items-center gap-2">
          {onAdd ? (
            <button
              type="button"
              onClick={onAdd}
              disabled={busy}
              className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              新增
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDiscardAll}
            disabled={busy || !hasChanges}
            className="rounded-lg bg-zinc-100 px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 disabled:opacity-50"
          >
            撤销全部
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy || !hasChanges}
            className="rounded-lg bg-green-600 px-3 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
          >
            {busy ? "提交中..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

