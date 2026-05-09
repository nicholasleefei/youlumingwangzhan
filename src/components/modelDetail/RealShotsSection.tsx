import SafeImage from "@/components/SafeImage";

type ShotTab = "exterior" | "interior" | "detail";

type Props = {
  exterior: string[];
  interior: string[];
  detail: string[];
  tab: ShotTab;
  onChangeTab: (t: ShotTab) => void;
  onOpen: (title: string, images: string[], index: number) => void;
};

export default function RealShotsSection({ exterior, interior, detail, tab, onChangeTab, onOpen }: Props) {
  const hasDetailTab = detail.length > 0;
  const tabs: Array<{ key: ShotTab; label: string; count: number; show: boolean }> = [
    { key: "exterior", label: "外观", count: exterior.length, show: true },
    { key: "interior", label: "内饰", count: interior.length, show: true },
    { key: "detail", label: "细节", count: detail.length, show: hasDetailTab },
  ];

  const active = tab === "exterior" ? exterior : tab === "interior" ? interior : detail;
  const activeTitle = tab === "exterior" ? "实拍 - 外观" : tab === "interior" ? "实拍 - 内饰" : "实拍 - 细节";

  return (
    <div className="rounded-2xl border border-border bg-bg-card/60 shadow-xl shadow-blue-900/10 backdrop-blur-md">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-5 py-4">
        <div className="text-lg font-semibold text-text-primary">实拍展示</div>
        <div className="flex flex-wrap items-center gap-2">
          {tabs
            .filter((t) => t.show)
            .map((t) => (
              <button
                key={t.key}
                type="button"
                onClick={() => onChangeTab(t.key)}
                className={
                  tab === t.key
                    ? "rounded-full bg-primary-accent px-4 py-2 text-xs font-semibold text-white"
                    : "rounded-full border border-border bg-white/5 px-4 py-2 text-xs font-semibold text-text-secondary hover:bg-bg-card"
                }
              >
                {t.label}（{t.count}）
              </button>
            ))}
        </div>
      </div>

      <div className="p-5">
        {active.length === 0 ? (
          <div className="rounded-xl border border-border bg-bg-card/40 p-8 text-center text-sm text-text-tertiary">暂无{activeTitle}</div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {active.slice(0, 12).map((src, idx) => (
              <button
                key={`${src}_${idx}`}
                type="button"
                onClick={() => onOpen(activeTitle, active, idx)}
                className="group relative overflow-hidden rounded-xl border border-border bg-bg-card/40"
              >
                <SafeImage
                  src={src}
                  alt={activeTitle}
                  className="h-32 w-full object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  usePlaceholder
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

