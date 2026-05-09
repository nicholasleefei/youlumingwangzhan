import { Link } from "react-router-dom";
import type { SeriesModelListItem } from "./modelDetailData";

type Props = {
  base: string;
  models: SeriesModelListItem[];
  activeId: string;
  seriesId?: string | null;
};

export default function SeriesModelList({ base, models, activeId, seriesId }: Props) {
  return (
    <div className="rounded-2xl bg-transparent">
      <div className="px-1 pb-2">
        <div className="text-sm font-semibold leading-6 text-zinc-900">同车系车型</div>
        <div className="mt-0.5 text-xs leading-5 text-zinc-500">点击切换车型</div>
      </div>
      <div className="max-h-[calc(100vh-260px)] overflow-auto">
        {models.length === 0 ? (
          <div className="px-1 py-3 text-sm text-zinc-500">暂无车型</div>
        ) : (
          <div className="space-y-2">
            {models.map((m) => {
              const active = m.id === activeId;
              return (
                <Link
                  key={m.id}
                  to={`${base}/model/${m.id}${seriesId ? `?seriesId=${encodeURIComponent(String(seriesId))}` : ""}`}
                  state={seriesId ? ({ fromSeriesId: String(seriesId) } as any) : undefined}
                  className={
                    active
                      ? "block rounded-2xl bg-zinc-900 px-4 py-3 text-white"
                      : "block rounded-2xl px-4 py-3 text-zinc-800 hover:bg-zinc-50"
                  }
                >
                  <div className="text-sm font-semibold leading-6 truncate">{m.name || "未命名车型"}</div>
                  <div className={active ? "mt-1 text-xs leading-5 text-white/70" : "mt-1 text-xs leading-5 text-zinc-500"}>
                    {m.yeartype ? `${m.yeartype}` : ""}
                    {m.price ? (m.yeartype ? ` · ${m.price}` : `${m.price}`) : ""}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
