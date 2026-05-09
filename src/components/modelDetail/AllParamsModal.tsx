import Modal from "@/components/ui/Modal";
import { flattenParams } from "@/utils/paramFlatten";

type Props = {
  open: boolean;
  title: string;
  payload: unknown;
  onClose: () => void;
};

export default function AllParamsModal({ open, title, payload, onClose }: Props) {
  const items = flattenParams(payload, { maxItems: 800, maxDepth: 8 });

  return (
    <Modal open={open} onClose={onClose} className="relative w-full max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div className="min-w-0 text-sm font-semibold text-zinc-900 truncate">{title}</div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          关闭
        </button>
      </div>
      <div className="max-h-[78vh] overflow-auto px-5 py-4">
        {items.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">暂无可展示的参数</div>
        ) : (
          <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
            <div className="grid grid-cols-12 gap-0 border-b border-zinc-200 px-4 py-3 text-xs font-semibold text-zinc-500">
              <div className="col-span-5">参数</div>
              <div className="col-span-7">值</div>
            </div>
            <div className="divide-y divide-zinc-200">
              {items.map((it) => (
                <div key={it.path} className="grid grid-cols-12 gap-0 px-4 py-3">
                  <div className="col-span-5 text-xs text-zinc-600 break-all pr-3">{it.path}</div>
                  <div className="col-span-7 text-sm text-zinc-900 break-words">{it.value}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}
