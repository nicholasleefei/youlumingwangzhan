import Modal from "@/components/ui/Modal";
import { inputCls, labelCls, secondaryButtonCls, smallButtonCls } from "@/admin/AdminApp";

export type ModelDeleteIntent =
  | { open: false }
  | {
      open: true;
      modelJmId: number;
      modelName: string;
      imageDeleteMode: "all" | "car_pictures" | "model_image_config";
    };

export default function DeleteModelImagesModal(props: {
  intent: ModelDeleteIntent;
  confirmText: string;
  busy: boolean;
  onChangeConfirmText: (v: string) => void;
  onChangeImageDeleteMode: (mode: "all" | "car_pictures" | "model_image_config") => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { intent, confirmText, busy, onChangeConfirmText, onChangeImageDeleteMode, onClose, onConfirm } = props;
  const ok = confirmText.trim().toUpperCase() === "DELETE";

  return (
    <Modal
      open={intent.open}
      title={intent.open ? `确认删除车型图片：${intent.modelName}（${intent.modelJmId}）` : "确认删除车型图片"}
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

          <div className="mb-4">
            <label className={labelCls()}>删除范围</label>
            <select value={intent.imageDeleteMode} onChange={(e) => onChangeImageDeleteMode(e.target.value as any)} className={inputCls()}>
              <option value="all">删除 car_pictures + model_image_config</option>
              <option value="car_pictures">仅删除 car_pictures</option>
              <option value="model_image_config">仅删除 model_image_config</option>
            </select>
          </div>

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

