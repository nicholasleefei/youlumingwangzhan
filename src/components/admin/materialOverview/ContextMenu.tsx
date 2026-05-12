import { useEffect, useMemo, useRef } from "react";

export type ContextMenuItem = {
  key: string;
  label: string;
  disabled?: boolean;
  danger?: boolean;
  onClick: () => void;
};

export default function ContextMenu(props: {
  open: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  onClose: () => void;
}) {
  const { open, x, y, items, onClose } = props;
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    const onPointerDown = (e: PointerEvent) => {
      const el = ref.current;
      if (!el) return;
      if (!el.contains(e.target as Node)) onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("pointerdown", onPointerDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("pointerdown", onPointerDown);
    };
  }, [open, onClose]);

  const visibleItems = useMemo(() => items.filter((it) => Boolean(it.label)), [items]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className="fixed z-[1200] min-w-[240px] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-xl"
      style={{ left: x, top: y }}
      role="menu"
      aria-label="批量操作菜单"
    >
      {visibleItems.map((it) => (
        <button
          key={it.key}
          type="button"
          disabled={it.disabled}
          onClick={() => {
            if (it.disabled) return;
            it.onClick();
          }}
          className={
            "flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm transition-colors " +
            (it.disabled
              ? "cursor-not-allowed text-zinc-400"
              : it.danger
                ? "text-red-700 hover:bg-red-50"
                : "text-zinc-700 hover:bg-zinc-50")
          }
          role="menuitem"
        >
          <span className="truncate">{it.label}</span>
        </button>
      ))}
    </div>
  );
}

