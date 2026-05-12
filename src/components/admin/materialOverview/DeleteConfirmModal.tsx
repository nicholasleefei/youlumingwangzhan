import Modal from "@/components/ui/Modal";
import { inputCls, labelCls, secondaryButtonCls, smallButtonCls } from "@/admin/AdminApp";

export default function DeleteConfirmModal(props: {
  open: boolean;
  title: string;
  description: string;
  confirmText: string;
  busy: boolean;
  onChangeConfirmText: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const { open, title, description, confirmText, busy, onChangeConfirmText, onClose, onConfirm } = props;
  const ok = confirmText.trim().toUpperCase() === "DELETE";

  return (
    <Modal
      open={open}
      title={title}
      onClose={() => {
        if (busy) return;
        onClose();
      }}
      className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl"
    >
      <div className="p-6">
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          {description} 请输入 <span className="font-semibold">DELETE</span> 以确认。
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
    </Modal>
  );
}

