import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import InteriorVRViewer from "@/components/modelDetail/InteriorVRViewer";
import SequenceViewer from "@/components/modelDetail/SequenceViewer";
import { filterInteriorVrPositions, getInteriorVrVisibilityConfig, type InteriorVrPosition } from "@/utils/interiorVrVisibility";

type Props = {
  seriesVrConfig: any | null;
  loading?: boolean;
};

function hexToCssColor(input: string) {
  const raw = String(input || "").trim();
  if (!raw) return "#e5e7eb";
  if (raw.startsWith("#")) return raw;
  if (/^[0-9a-fA-F]{6}$/.test(raw)) return `#${raw}`;
  return raw;
}

export default function ModelVrBlock({ seriesVrConfig, loading }: Props) {
  const { t } = useTranslation();
  const [vrTab, setVrTab] = useState<"vr_exterior" | "vr_interior">("vr_exterior");
  const [selectedExteriorId, setSelectedExteriorId] = useState<string | null>(null);
  const [selectedInteriorColorId, setSelectedInteriorColorId] = useState<string | null>(null);
  const [selectedInteriorPosId, setSelectedInteriorPosId] = useState<string | null>(null);
  const [interiorVrHiddenPositions, setInteriorVrHiddenPositions] = useState<InteriorVrPosition[]>([]);

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

  const vrExteriorGroups = useMemo(() => (seriesVrConfig?.exterior_vr ?? []) as any[], [seriesVrConfig]);
  const vrInteriorGroups = useMemo(() => (seriesVrConfig?.interior_vr ?? []) as any[], [seriesVrConfig]);
  const hasSeriesExterior = vrExteriorGroups.length > 0;
  const hasSeriesInterior = vrInteriorGroups.length > 0;

  useEffect(() => {
    setVrTab("vr_exterior");
    setSelectedExteriorId(vrExteriorGroups[0]?.id ?? null);
    setSelectedInteriorColorId(vrInteriorGroups[0]?.id ?? null);
    setSelectedInteriorPosId(null);
  }, [vrExteriorGroups.length, vrInteriorGroups.length]);

  const activeExteriorGroup = useMemo(() => {
    return (vrExteriorGroups.find((g) => g.id === selectedExteriorId) ?? vrExteriorGroups[0] ?? null) as any;
  }, [vrExteriorGroups, selectedExteriorId]);

  const activeInteriorColorGroup = useMemo(() => {
    return (vrInteriorGroups.find((g) => g.id === selectedInteriorColorId) ?? vrInteriorGroups[0] ?? null) as any;
  }, [vrInteriorGroups, selectedInteriorColorId]);

  const activeInteriorPositions = useMemo(() => {
    const raw = (activeInteriorColorGroup?.positions ?? []) as any[];
    return filterInteriorVrPositions(raw, interiorVrHiddenPositions as any) as any[];
  }, [activeInteriorColorGroup?.id, interiorVrHiddenPositions.join("|")]);

  useEffect(() => {
    const list = activeInteriorPositions;
    const firstPos = list[0]?.id || null;
    if (!firstPos) {
      setSelectedInteriorPosId(null);
      return;
    }
    const hasCurrent = selectedInteriorPosId && list.some((p) => p.id === selectedInteriorPosId);
    if (!hasCurrent) setSelectedInteriorPosId(firstPos);
  }, [activeInteriorColorGroup?.id, activeInteriorPositions.length, interiorVrHiddenPositions.join("|"), selectedInteriorPosId]);

  const activeInteriorPosGroup = useMemo(() => {
    return (activeInteriorPositions.find((p) => p.id === selectedInteriorPosId) ?? activeInteriorPositions[0] ?? null) as any;
  }, [activeInteriorPositions, selectedInteriorPosId]);

  const visibleInteriorPositions = useMemo(() => {
    if (!activeInteriorColorGroup) return [];
    return activeInteriorPositions;
  }, [activeInteriorColorGroup?.id, activeInteriorPositions.length]);

  const exteriorSequenceImages = useMemo(() => {
    return Array.isArray(activeExteriorGroup?.images) ? (activeExteriorGroup.images as string[]) : [];
  }, [activeExteriorGroup?.id]);

  const interiorPanoImages = useMemo(() => {
    return Array.isArray(activeInteriorPosGroup?.images) ? (activeInteriorPosGroup.images as string[]) : [];
  }, [activeInteriorPosGroup?.id]);

  const controls = (
    <div className="pointer-events-none absolute left-1/2 top-3 z-20 w-[min(720px,calc(100%-1.5rem))] -translate-x-1/2">
      <div className="pointer-events-auto flex flex-col items-center gap-2">
        <div className="inline-flex items-center justify-center gap-3 rounded-full bg-white/55 px-5 py-2 text-sm font-semibold text-zinc-900 backdrop-blur">
          <button
            type="button"
            onClick={() => setVrTab("vr_exterior")}
            className={vrTab === "vr_exterior" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"}
          >
            {t("model.exterior")}
          </button>
          <span className="text-zinc-300">|</span>
          <button
            type="button"
            onClick={() => setVrTab("vr_interior")}
            className={vrTab === "vr_interior" ? "text-zinc-900" : "text-zinc-500 hover:text-zinc-800"}
          >
            {t("model.interior")}
          </button>
        </div>

        <div className="flex max-w-[calc(100vw-3rem)] gap-2 overflow-x-auto px-1">
          {loading ? (
            <div className="flex gap-2 px-2 py-1">
              <div className="h-10 w-10 shrink-0 rounded-full bg-white/40 backdrop-blur" />
              <div className="h-10 w-10 shrink-0 rounded-full bg-white/40 backdrop-blur" />
              <div className="h-10 w-10 shrink-0 rounded-full bg-white/40 backdrop-blur" />
            </div>
          ) : vrTab === "vr_exterior" && hasSeriesExterior ? (
            vrExteriorGroups.map((g) => {
              const active = (activeExteriorGroup?.id ?? "") === g.id;
              const color = hexToCssColor(g.color_code || "");
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedExteriorId(g.id)}
                  className={
                    active
                      ? "relative h-10 w-10 shrink-0 rounded-full border-2 border-zinc-900 bg-white/60 backdrop-blur"
                      : "relative h-10 w-10 shrink-0 rounded-full border border-zinc-200 bg-white/60 backdrop-blur hover:border-zinc-400"
                  }
                  aria-label={g.color_name || g.color_code || t("common.color")}
                  title={g.color_name || g.color_code || t("common.color")}
                >
                  <span className="absolute inset-1 rounded-full" style={{ background: color }} />
                  {active ? <span className="absolute inset-0 grid place-items-center text-xs font-bold text-white">✓</span> : null}
                </button>
              );
            })
          ) : vrTab === "vr_interior" && hasSeriesInterior ? (
            vrInteriorGroups.map((g) => {
              const active = (activeInteriorColorGroup?.id ?? "") === g.id;
              const color = hexToCssColor(g.color_value || "");
              return (
                <button
                  key={g.id}
                  type="button"
                  onClick={() => setSelectedInteriorColorId(g.id)}
                  className={
                    active
                      ? "inline-flex shrink-0 items-center gap-2 rounded-full bg-zinc-900/90 px-3 py-2 text-xs font-semibold text-white backdrop-blur"
                      : "inline-flex shrink-0 items-center gap-2 rounded-full border border-zinc-200 bg-white/60 px-3 py-2 text-xs font-semibold text-zinc-900 backdrop-blur hover:bg-white/70"
                  }
                  aria-label={g.color_name || g.color_value || t("common.color")}
                  title={g.color_name || g.color_value || t("common.color")}
                >
                  <span className="h-3.5 w-3.5 rounded-full ring-1 ring-zinc-300" style={{ background: color }} />
                  <span className="max-w-28 truncate">{g.color_name || g.color_value || t("model.unnamedColor")}</span>
                </button>
              );
            })
          ) : (
            <div className="rounded-full bg-white/55 px-4 py-2 text-xs text-zinc-700 backdrop-blur">{t("model.noColorAvailable")}</div>
          )}
        </div>

        {vrTab === "vr_interior" && hasSeriesInterior && visibleInteriorPositions.length ? (
          <div className="flex flex-wrap items-center justify-center gap-2">
            {visibleInteriorPositions.map((p: any) => {
              const active = (activeInteriorPosGroup?.id ?? "") === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedInteriorPosId(p.id)}
                  className={
                    active
                      ? "rounded-full bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white"
                      : "rounded-full border border-zinc-200 bg-white/60 px-4 py-1.5 text-xs font-semibold text-zinc-900 backdrop-blur hover:bg-white/70"
                  }
                >
                  {p.position_name || p.position || t("common.position") || "位置"}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
    </div>
  );

  return (
    <div className="bg-zinc-100 px-4 py-8 md:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="mt-6 rounded-3xl bg-zinc-100">
          <div className="mx-auto w-full max-w-7xl px-2 py-2 md:px-4 md:py-4">
            <div className="relative">
              {controls}
              {vrTab === "vr_exterior" ? (
                <SequenceViewer label={t("vr.360Exterior")} images={exteriorSequenceImages} variant="plain" />
              ) : (
                <InteriorVRViewer label={t("vr.interiorVR")} images={interiorPanoImages} variant="plain" />
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
