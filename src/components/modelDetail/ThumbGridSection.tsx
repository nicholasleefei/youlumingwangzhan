import SafeImage from "@/components/SafeImage";

type Props = {
  title: string;
  images: string[];
  onOpen: (title: string, images: string[], index: number) => void;
};

export default function ThumbGridSection({ title, images, onOpen }: Props) {
  const list = images.slice(0, 12);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div className="text-base font-semibold text-zinc-900">{title}</div>
        <div className="text-xs text-zinc-500">{images.length} 张</div>
      </div>
      {list.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-zinc-600">暂无图片</div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 p-5">
          {list.map((src, idx) => (
            <button
              key={`${src}_${idx}`}
              type="button"
              onClick={() => onOpen(title, images, idx)}
              className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-50"
            >
              <SafeImage
                src={src}
                alt={title}
                className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                usePlaceholder
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
