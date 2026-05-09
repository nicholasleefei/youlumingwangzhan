import { useEffect, type ReactNode } from "react";

type Props = {
  open: boolean;
  title?: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
};

export default function Modal({ open, title, children, onClose, className }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        aria-label="关闭"
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title ?? "弹窗"}
        className={
          className ??
          "relative w-full max-w-5xl overflow-hidden rounded-2xl border border-border bg-primary-dark/95 shadow-2xl"
        }
      >
        {title ? (
          <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
            <div className="min-w-0 text-sm font-semibold text-text-primary truncate">{title}</div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-border bg-bg-card/60 px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-bg-card"
            >
              关闭
            </button>
          </div>
        ) : null}
        {children}
      </div>
    </div>
  );
}
