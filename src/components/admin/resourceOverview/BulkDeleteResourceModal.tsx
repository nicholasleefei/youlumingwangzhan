import Modal from "@/components/ui/Modal";
import { inputCls, labelCls, secondaryButtonCls, smallButtonCls, statusBadgeCls } from "@/admin/AdminApp";

export type BulkDeleteIntent =
  | { open: false }
  | {
      open: true;
      scope: "vr" | "images";
      seriesIds: number[];
      seriesNames: string[];
      imageDeleteMode: "all" | "car_pictures" | "model_image_config";
    };

export default function BulkDeleteResourceModal(props: {
  intent: BulkDeleteIntent;
  confirmText: string;
  busy: boolean;
  onChangeConfirmText: (v: string) => void;
  onChangeImageDeleteMode: (mode: "all" | "car_pictures" | "model_image_config") => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { intent, confirmText, busy, onChangeConfirmText, onChangeImageDeleteMode, onClose, onConfirm } = props;
  const ok = confirmText.trim().toUpperCase() === "DELETE";

  const count = intent.open ? intent.seriesIds.length : 0;
  const preview = intent.open ? intent.seriesNames.slice(0, 10) : [];
  const more = intent.open ? Math.max(0, intent.seriesNames.length - preview.length) : 0;

  return (
    <Modal
      open={intent.open}
      title={intent.open ? `确认批量删除：${count} 个车系` : "确认批量删除"}
      onClose={() => {
        if (busy) return;
        onClose();
      }}
      className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
    >
      {intent.open ? (
        <div className="p-6">
          <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            此操作不可恢复。请输入 <span className="font-semibold">DELETE</span> 以确认。
          </div>

          <div className="mb-4 flex flex-wrap items-center gap-2 text-xs text-zinc-600">
            <span className={statusBadgeCls("default")}>车系数：{count}</span>
            <span className={statusBadgeCls("default")}>类型：{intent.scope === "vr" ? "VR" : "图片"}</span>
          </div>

          <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
            <div className="mb-2 text-xs font-semibold text-zinc-600">将删除以下车系（展示前 10 个）</div>
            <div className="flex flex-wrap gap-1">
              {preview.map((n) => (
                <span key={n} className={statusBadgeCls("default")}>
                  {n}
                </span>
              ))}
              {more > 0 ? <span className={statusBadgeCls("default")}>+{more}</span> : null}
            </div>
          </div>

          {intent.scope === "images" ? (
            <div className="mb-4">
              <label className={labelCls()}>删除范围</label>
              <select value={intent.imageDeleteMode} onChange={(e) => onChangeImageDeleteMode(e.target.value as any)} className={inputCls()}>
                <option value="all">删除 car_pictures + model_image_config</option>
                <option value="car_pictures">仅删除 car_pictures</option>
                <option value="model_image_config">仅删除 model_image_config</option>
              </select>
              <div className="mt-2 text-xs text-zinc-500">图片展示以 car_pictures 为主，缺失时回退 model_image_config。</div>
            </div>
          ) : null}

          <div className="mb-6">
            <label className={labelCls()}>确认文本</label>
            <input value={confirmText} onChange={(e) => onChangeConfirmText(e.target.value)} placeholder="输入 DELETE" className={inputCls()} />
          </div>

          <div className="flex items-center justify-end gap-2">
            <button type="button" onClick={onClose} disabled={busy} className={secondaryButtonCls()}>
              取消
            </button>
            <button type="button" onClick={onConfirm} disabled={busy || !ok} className={smallButtonCls("danger") + " px-4 py-2"}>
              {busy ? "删除中..." : "确认删除"}
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}

