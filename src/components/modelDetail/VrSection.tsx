import { useEffect, useMemo, useState } from "react";
import SequenceViewer from "@/components/modelDetail/SequenceViewer";
import InteriorVRViewer from "@/components/modelDetail/InteriorVRViewer";
import type { SeriesVrExteriorGroup, SeriesVrInteriorColorGroup, SeriesVrInteriorPositionGroup } from "@/components/modelDetail/modelDetailData";
import { filterInteriorVrPositions, getInteriorVrVisibilityConfig, type InteriorVrPosition } from "@/utils/interiorVrVisibility";

type Props = {
  tab: "vr_exterior" | "vr_interior";
  onChangeTab: (t: "vr_exterior" | "vr_interior") => void;
  vrExterior: string[];
  vrInterior: string[];
  seriesExteriorGroups: SeriesVrExteriorGroup[];
  seriesInteriorGroups: SeriesVrInteriorColorGroup[];
};

function colorPreviewStyle(colorCode: string) {
  const code = (colorCode || "").trim();
  if (!code) return { backgroundColor: "#9ca3af", border: "1px solid rgba(255,255,255,0.3)" };
  const isWhite = code.toUpperCase() === "#FFFFFF";
  return {
    backgroundColor: isWhite ? "#f5f5f5" : code,
    border: isWhite ? "2px solid rgba(255,255,255,0.55)" : "1px solid rgba(255,255,255,0.3)",
  };
}

export default function VrSection({ tab, onChangeTab, vrExterior, vrInterior, seriesExteriorGroups, seriesInteriorGroups }: Props) {
  const hasSeriesExterior = seriesExteriorGroups.length > 0;
  const hasSeriesInterior = seriesInteriorGroups.length > 0;

  const [interiorVrHiddenPositions, setInteriorVrHiddenPositions] = useState<InteriorVrPosition[]>([]);

  const [selectedExteriorId, setSelectedExteriorId] = useState<string>("");
  const [selectedInteriorColorId, setSelectedInteriorColorId] = useState<string>("");
  const [selectedInteriorPosId, setSelectedInteriorPosId] = useState<string>("");

  useEffect(() => {
    if (!hasSeriesExterior) return;
    const firstId = seriesExteriorGroups[0]?.id ?? "";
    if (!firstId) return;
    setSelectedExteriorId((p) => (p ? p : firstId));
  }, [hasSeriesExterior, seriesExteriorGroups]);

  useEffect(() => {
    if (!hasSeriesInterior) return;
    const firstColorId = seriesInteriorGroups[0]?.id ?? "";
    if (!firstColorId) return;
    setSelectedInteriorColorId((p) => (p ? p : firstColorId));
  }, [hasSeriesInterior, seriesInteriorGroups]);

  const activeExteriorGroup = useMemo(() => {
    if (!hasSeriesExterior) return null;
    return seriesExteriorGroups.find((g) => g.id === selectedExteriorId) ?? seriesExteriorGroups[0] ?? null;
  }, [hasSeriesExterior, selectedExteriorId, seriesExteriorGroups]);

  const activeInteriorColorGroup = useMemo(() => {
    if (!hasSeriesInterior) return null;
    return seriesInteriorGroups.find((g) => g.id === selectedInteriorColorId) ?? seriesInteriorGroups[0] ?? null;
  }, [hasSeriesInterior, selectedInteriorColorId, seriesInteriorGroups]);

  useEffect(() => {
    let active = true;
    getInteriorVrVisibilityConfig()
      .then((cfg) => {
        if (!active) return;
        setInteriorVrHiddenPositions((cfg.hidden_positions || []) as InteriorVrPosition[]);
      })
      .catch(() => {
        if (!active) return;
        setInteriorVrHiddenPositions([]);
      });
    return () => {
      active = false;
    };
  }, []);

  const visibleInteriorPositions = useMemo(() => {
    const raw = (activeInteriorColorGroup?.positions ?? []) as SeriesVrInteriorPositionGroup[];
    return filterInteriorVrPositions(raw as any, interiorVrHiddenPositions as any) as SeriesVrInteriorPositionGroup[];
  }, [activeInteriorColorGroup?.id, interiorVrHiddenPositions.join("|")]);

  useEffect(() => {
    if (!activeInteriorColorGroup || visibleInteriorPositions.length === 0) {
      setSelectedInteriorPosId("");
      return;
    }
    const firstPosId = visibleInteriorPositions[0]?.id ?? "";
    const hasCurrent = selectedInteriorPosId && visibleInteriorPositions.some((p) => p.id === selectedInteriorPosId);
    if (!hasCurrent) setSelectedInteriorPosId(firstPosId);
  }, [activeInteriorColorGroup?.id, visibleInteriorPositions.length, interiorVrHiddenPositions.join("|"), selectedInteriorPosId]);

  const activeInteriorPosGroup = useMemo(() => {
    if (!activeInteriorColorGroup) return null;
    return visibleInteriorPositions.find((p) => p.id === selectedInteriorPosId) ?? visibleInteriorPositions[0] ?? null;
  }, [activeInteriorColorGroup?.id, selectedInteriorPosId, visibleInteriorPositions]);

  const images = tab === "vr_exterior" 
    ? (activeExteriorGroup?.images?.length ? activeExteriorGroup.images : vrExterior) 
    : (activeInteriorPosGroup?.images?.length ? activeInteriorPosGroup.images : vrInterior);

  const label =
    tab === "vr_exterior"
      ? activeExteriorGroup?.color_name
        ? `360 外观 - ${activeExteriorGroup.color_name}`
        : "360 外观"
      : activeInteriorPosGroup?.position_name
        ? `内饰 VR - ${activeInteriorColorGroup?.color_name ? activeInteriorColorGroup.color_name + ' - ' : ''}${activeInteriorPosGroup.position_name}`
        : "内饰 VR";

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex flex-col gap-3 border-b border-zinc-200 px-5 py-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-base font-semibold text-zinc-900">VR 展示</div>
          <div className="mt-1 text-xs text-zinc-500">支持外观 360 序列帧与 3D 全景内饰</div>
        </div>
        <div className="inline-flex rounded-xl bg-zinc-100 p-1">
          <button
            type="button"
            onClick={() => onChangeTab("vr_exterior")}
            className={
              tab === "vr_exterior"
                ? "rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 shadow-sm"
                : "rounded-lg px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900"
            }
          >
            360 外观（{hasSeriesExterior ? seriesExteriorGroups.reduce((sum, g) => sum + (g.images?.length ?? 0), 0) : vrExterior.length}）
          </button>
          <button
            type="button"
            onClick={() => onChangeTab("vr_interior")}
            className={
              tab === "vr_interior"
                ? "rounded-lg bg-white px-4 py-2 text-xs font-semibold text-zinc-900 shadow-sm"
                : "rounded-lg px-4 py-2 text-xs font-semibold text-zinc-700 hover:text-zinc-900"
            }
          >
            内饰 VR（{hasSeriesInterior ? seriesInteriorGroups.reduce((sum, g) => sum + g.positions.reduce((pSum, p) => pSum + (p.images?.length ?? 0), 0), 0) : vrInterior.length}）
          </button>
        </div>
      </div>
      <div className="p-5">
        {tab === "vr_exterior" && hasSeriesExterior ? (
          <div className="mb-4 flex flex-wrap items-center gap-2">
            {seriesExteriorGroups.map((g) => {
              const active = (activeExteriorGroup?.id ?? "") === g.id;
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedExteriorId(g.id)}
                  className={
                    active
                      ? "inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                      : "inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                  }
                >
                  <span className="inline-block h-3.5 w-3.5 rounded-full" style={colorPreviewStyle(g.color_code)} />
                  <span className="max-w-28 truncate">{g.color_name || g.color_code || "未命名颜色"}</span>
                  <span className={active ? "text-blue-700/80" : "text-zinc-500"}>({g.images?.length ?? 0})</span>
                </button>
              );
            })}
          </div>
        ) : null}

        {tab === "vr_interior" && hasSeriesInterior ? (
          <div className="mb-4 space-y-3">
            {/* 颜色选择 */}
            <div className="flex flex-wrap items-center gap-2">
              {seriesInteriorGroups.map((g) => {
                const active = (activeInteriorColorGroup?.id ?? "") === g.id;
                return (
                  <button
                    key={g.id}
                    type="button"
                    onClick={() => setSelectedInteriorColorId(g.id)}
                    className={
                      active
                        ? "inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700"
                        : "inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    }
                  >
                    <span className="inline-block h-3.5 w-3.5 rounded-full" style={colorPreviewStyle(g.color_value || '')} />
                    <span className="max-w-28 truncate">{g.color_name || "未命名颜色"}</span>
                  </button>
                );
              })}
            </div>
            
            {/* 位置选择 */}
            {activeInteriorColorGroup && visibleInteriorPositions.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-zinc-200">
                {visibleInteriorPositions.map((p) => {
                  const active = (activeInteriorPosGroup?.id ?? "") === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedInteriorPosId(p.id)}
                      className={
                        active
                          ? "rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white"
                          : "rounded-full border border-zinc-200 bg-white px-4 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                      }
                    >
                      {p.position_name || p.position || "未命名位置"}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        ) : null}

        {tab === "vr_exterior" ? (
          <SequenceViewer label={label} images={images} />
        ) : (
          <InteriorVRViewer label={label} images={images} />
        )}
      </div>
    </div>
  );
}
