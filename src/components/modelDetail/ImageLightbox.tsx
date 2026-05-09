import { ChevronLeft, ChevronRight, X } from "lucide-react";

type Props = {
  open: boolean;
  title?: string;
  images: string[];
  index: number;
  onChangeIndex: (next: number) => void;
  onClose: () => void;
};

export default function ImageLightbox({ open, title, images, index, onChangeIndex, onClose }: Props) {
  if (!open) return null;
  const total = images.length;
  const src = images[index] ?? "";

  const prev = () => onChangeIndex((index - 1 + total) % total);
  const next = () => onChangeIndex((index + 1) % total);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <button type="button" aria-label="关闭" className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative w-full max-w-6xl overflow-hidden rounded-2xl border border-border bg-primary-dark/95 shadow-2xl">
        <div className="flex items-center justify-between gap-3 border-b border-border px-5 py-4">
          <div className="min-w-0">
            <div className="text-sm font-semibold text-text-primary truncate">{title ?? "图片预览"}</div>
            <div className="mt-1 text-xs text-text-tertiary">
              {total > 0 ? `${index + 1} / ${total}` : "0 / 0"}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-2 rounded-lg border border-border bg-bg-card/60 px-3 py-2 text-xs font-semibold text-text-secondary hover:bg-bg-card"
          >
            <X className="h-4 w-4" />
            关闭
          </button>
        </div>

        <div className="relative bg-black">
          {src ? <img src={src} alt={title ?? "图片"} className="mx-auto max-h-[78vh] w-auto" /> : null}
          {total > 1 ? (
            <>
              <button
                type="button"
                onClick={prev}
                className="absolute left-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-bg-card/60 p-3 text-text-primary hover:bg-bg-card"
                aria-label="上一张"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={next}
                className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full border border-border bg-bg-card/60 p-3 text-text-primary hover:bg-bg-card"
                aria-label="下一张"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

