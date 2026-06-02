import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";

type Props = {
  title: string;
  images: string[];
  onOpenLightbox: (index: number) => void;
};

export default function ModelImageGallery({ title, images, onOpenLightbox }: Props) {
  const { t } = useTranslation();
  const cleaned = useMemo(() => images.filter((s) => typeof s === "string" && s.trim()), [images]);
  const [index, setIndex] = useState(0);
  const src = cleaned[index] ?? "";
  const total = cleaned.length;

  useEffect(() => {
    setIndex(0);
  }, [cleaned[0] ?? ""]);

  const prev = () => {
    if (total <= 1) return;
    setIndex((p) => (p - 1 + total) % total);
  };

  const next = () => {
    if (total <= 1) return;
    setIndex((p) => (p + 1) % total);
  };

  return (
    <div className="overflow-hidden rounded-2xl bg-white">
      <div className="group relative">
        <button
          type="button"
          onClick={() => (total > 0 ? onOpenLightbox(index) : null)}
          className="group block w-full"
          aria-label={t("model.imageGallery")}
        >
          <div className="flex w-full items-center justify-center bg-white px-6 py-10 sm:px-10 sm:py-14 lg:px-12 lg:py-16">
            <div className="w-full max-w-[1040px]">
              <div className="aspect-[16/9] w-full">
                {src ? (
                  <img src={src} alt={title} className="h-full w-full object-contain" loading="lazy" decoding="async" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center rounded-xl bg-zinc-50 text-zinc-400">
                    <ImageIcon className="h-6 w-6" />
                    <span className="ml-2 text-sm">{t("common.noImage")}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          {src ? <div className="pointer-events-none absolute inset-0 ring-0 ring-zinc-900/10 transition group-hover:ring-1" /> : null}
        </button>

        {total > 1 ? (
          <>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                prev();
              }}
              className="absolute left-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/55 text-zinc-900 shadow-sm backdrop-blur-md ring-1 ring-white/60 opacity-100 transition hover:bg-white/75 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label={t("common.prev")}
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                next();
              }}
              className="absolute right-4 top-1/2 inline-flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/55 text-zinc-900 shadow-sm backdrop-blur-md ring-1 ring-white/60 opacity-100 transition hover:bg-white/75 lg:opacity-0 lg:group-hover:opacity-100"
              aria-label={t("common.next")}
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        ) : null}

        <div className="pointer-events-none absolute bottom-3 left-0 right-0 flex items-center justify-center">
          <div className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-zinc-700 shadow-sm">
            {total > 0 ? `${index + 1} / ${total}` : t("common.noImage")}
          </div>
        </div>
      </div>

      {total > 1 ? (
        <div className="bg-white px-4 py-3">
          <div className="flex max-w-full justify-center gap-2 overflow-x-auto pb-1">
            {cleaned.slice(0, 36).map((u, i) => {
              const active = i === index;
              return (
                <button
                  key={`${u}_${i}`}
                  type="button"
                  onClick={() => setIndex(i)}
                  className={
                    active
                      ? "h-14 w-20 shrink-0 overflow-hidden rounded-md ring-2 ring-zinc-900"
                      : "h-14 w-20 shrink-0 overflow-hidden rounded-md ring-1 ring-zinc-200 hover:ring-zinc-400"
                  }
                  aria-label={`${t("model.thumbnail")} ${i + 1}`}
                >
                  <img src={u} alt={t("model.thumbnail")} className="h-full w-full object-cover" loading="lazy" decoding="async" />
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
