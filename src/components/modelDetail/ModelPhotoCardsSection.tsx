import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import SafeImage from "@/components/SafeImage";
import { CarFront, Camera, Sofa } from "lucide-react";

type CardKey = "exterior" | "interior" | "official";

type Props = {
  exterior: string[];
  interior: string[];
  official: string[];
  onOpen: (title: string, images: string[], index: number) => void;
};

function Card({
  title,
  icon,
  images,
  emptyText,
  onOpen,
}: {
  title: string;
  icon: ReactNode;
  images: string[];
  emptyText: string;
  onOpen: (index: number) => void;
}) {
  const { t } = useTranslation();
  const preview = images.slice(0, 9);
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="text-zinc-500">{icon}</div>
          <div className="text-base font-semibold text-zinc-900 truncate">{title}</div>
        </div>
        <div className="text-sm text-zinc-500">{images.length} 张</div>
      </div>

      <div className="p-5">
        {images.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-8 text-center text-sm text-zinc-600">{emptyText}</div>
        ) : (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              {preview.map((src, idx) => (
                <button
                  key={`${src}_${idx}`}
                  type="button"
                  onClick={() => onOpen(idx)}
                  className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
                >
                  <SafeImage
                    src={src}
                    alt={title}
                    className="h-24 w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                    usePlaceholder
                  />
                </button>
              ))}
            </div>
            {images.length > preview.length ? (
              <button
                type="button"
                onClick={() => onOpen(0)}
                className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
              >
                {t('model.viewAll', { count: images.length })}
              </button>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ModelPhotoCardsSection({
  exterior, interior, official, onOpen }: Props) {
  const { t } = useTranslation();
  const cards: Array<{ key: CardKey; title: string; images: string[]; icon: ReactNode; empty: string }> = [
    { key: "exterior", title: t("model.exteriorImages"), images: exterior, icon: <CarFront className="h-5 w-5" />, empty: t("common.noImage") },
    { key: "interior", title: t("model.interiorImages"), images: interior, icon: <Sofa className="h-5 w-5" />, empty: t("common.noImage") },
    { key: "official", title: t("model.officialImages"), images: official, icon: <Camera className="h-5 w-5" />, empty: t("common.noImage") },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((c) => (
        <Card
          key={c.key}
          title={c.title}
          icon={c.icon}
          images={c.images}
          emptyText={c.empty}
          onOpen={(index) => onOpen(c.title, c.images, index)}
        />
      ))}
    </div>
  );
}
