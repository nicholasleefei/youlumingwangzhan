import { useEffect, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from "react";
import { RotateCcw } from "lucide-react";

type Props = {
  label: string;
  images: string[];
  variant?: "card" | "plain";
};

export default function SequenceViewer({ label, images, variant = "card" }: Props) {
  const safeImages = useMemo(() => images.filter((s) => typeof s === "string" && s.trim()), [images]);
  const total = safeImages.length;
  const [idx, setIdx] = useState(0);
  const dragRef = useRef<{ active: boolean; startX: number; startIdx: number }>({
    active: false,
    startX: 0,
    startIdx: 0,
  });

  const imagesKey = useMemo(() => {
    if (total === 0) return "0";
    const first = safeImages[0] ?? "";
    const last = safeImages[total - 1] ?? "";
    return `${total}:${first}:${last}`;
  }, [safeImages, total]);

  useEffect(() => {
    setIdx(0);
    dragRef.current.active = false;
  }, [imagesKey]);

  const current = total > 0 ? safeImages[idx % total] : "";

  const reset = () => setIdx(0);

  const onPointerDown = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (total <= 1) return;
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
    dragRef.current = { active: true, startX: e.clientX, startIdx: idx };
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLDivElement>) => {
    if (!dragRef.current.active) return;
    if (total <= 1) return;
    const dx = e.clientX - dragRef.current.startX;
    const step = Math.round(dx / 14);
    const next = (dragRef.current.startIdx + step + total * 1000) % total;
    setIdx(next);
  };

  const onPointerUp = () => {
    dragRef.current.active = false;
  };

  const viewer = (
    <div
      className={
        variant === "plain"
          ? "relative aspect-[16/9] md:aspect-[3/2] bg-zinc-950/0 touch-none"
          : "relative aspect-[16/9] bg-zinc-950/5 touch-none"
      }
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      {total > 0 ? (
        safeImages.map((src, i) => (
          <img
            key={`${src}-${i}`}
            src={src}
            alt={`${label} ${i + 1}`}
            className={`absolute inset-0 h-full w-full object-contain select-none pointer-events-none transition-opacity duration-0 ${
              i === idx ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
            draggable={false}
          />
        ))
      ) : (
        <div className="h-full w-full flex items-center justify-center text-zinc-500 text-sm">暂无{label}</div>
      )}
      <button
        type="button"
        onClick={reset}
        disabled={total === 0}
        className={
          variant === "plain"
            ? "absolute right-3 top-3 inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/90 px-3 py-2 text-xs font-semibold text-zinc-700 backdrop-blur hover:bg-white disabled:opacity-50"
            : "hidden"
        }
      >
        <RotateCcw className="h-4 w-4" />
        重置
      </button>
      <div
        className={
          total > 1
            ? "pointer-events-none absolute bottom-3 left-3 z-20 rounded-full border border-zinc-200 bg-white/80 px-3 py-1 text-xs text-zinc-700 backdrop-blur"
            : "hidden"
        }
      >
        拖拽左右切换
      </div>
    </div>
  );

  if (variant === "plain") return viewer;

  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-zinc-900 truncate">{label}</div>
          <div className="mt-0.5 text-xs text-zinc-500">{total > 0 ? `${idx + 1} / ${total}` : "暂无资源"}</div>
        </div>
        <button
          type="button"
          onClick={reset}
          disabled={total === 0}
          className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 disabled:opacity-50"
        >
          <RotateCcw className="h-4 w-4" />
          重置
        </button>
      </div>
      {viewer}
    </div>
  );
}
