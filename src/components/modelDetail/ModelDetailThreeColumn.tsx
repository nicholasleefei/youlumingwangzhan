import { useTranslation } from "react-i18next";
import KeyParamsCompare from "@/components/modelDetail/KeyParamsCompare";
import ModelImageGallery from "@/components/modelDetail/ModelImageGallery";
import SeriesModelList from "@/components/modelDetail/SeriesModelList";
import type { ModelDetails, ModelJumdata, SeriesModelListItem } from "./modelDetailData";

type TabKey = "official" | "exterior" | "interior" | "detail";

type Props = {
  base: string;
  modelId: string;
  seriesLoading: boolean;
  seriesModels: SeriesModelListItem[];
  availableTabs: Array<{ key: TabKey; label: string; images: string[] }>;
  imageTab: TabKey;
  onChangeImageTab: (key: TabKey) => void;
  activeGallery: { label: string; images: string[] };
  onOpenLightbox: (title: string, images: string[], index: number) => void;
  currentModel: ModelJumdata;
  currentDetails: ModelDetails | null;
  compareId: string;
  onChangeCompareId: (id: string) => void;
  compareModel: ModelJumdata | null;
  compareDetails: ModelDetails | null;
};

export default function ModelDetailThreeColumn({
  base,
  modelId,
  seriesLoading,
  seriesModels,
  availableTabs,
  imageTab,
  onChangeImageTab,
  activeGallery,
  onOpenLightbox,
  currentModel,
  currentDetails,
  compareId,
  onChangeCompareId,
  compareModel,
  compareDetails,
}: Props) {
  const { t } = useTranslation();
  const seriesId = currentModel?.series_id ?? null;

  return (
    <div className="grid grid-cols-1 gap-6 lg:gap-10 lg:grid-cols-[clamp(260px,20vw,340px)_minmax(0,1fr)]">
      <div className="space-y-3 lg:sticky lg:top-24 lg:self-start lg:border-r lg:border-zinc-100 lg:pr-8">
        {seriesLoading ? (
          <div className="rounded-2xl border border-zinc-200 bg-white p-4 text-sm text-zinc-500">{t('model.loadingModelList')}</div>
        ) : (
          <SeriesModelList base={base} models={seriesModels} activeId={modelId} seriesId={seriesId} />
        )}
      </div>

      <div className="space-y-4 lg:pl-2">
        <div className="flex flex-wrap items-center justify-center gap-2">
          {availableTabs.length === 0 ? (
            <div className="text-sm text-zinc-500">{t('common.noImage')}</div>
          ) : (
            availableTabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => onChangeImageTab(tab.key)}
                className={
                  tab.key === imageTab
                    ? "rounded-full bg-zinc-900 px-5 py-2.5 text-xs font-semibold text-white"
                    : "rounded-full border border-zinc-200 bg-white px-5 py-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                }
              >
                {tab.label}
              </button>
            ))
          )}
        </div>

        <ModelImageGallery
          title={t('model.imageGallery')}
          images={activeGallery.images}
          onOpenLightbox={(idx) => onOpenLightbox(activeGallery.label, activeGallery.images, idx)}
        />
      </div>

      <div className="lg:col-start-2 lg:border-t lg:border-zinc-100 lg:pt-10">
        <KeyParamsCompare
          currentModel={currentModel}
          currentDetails={currentDetails}
          compareModels={seriesModels}
          compareId={compareId}
          onChangeCompareId={onChangeCompareId}
          compareModel={compareModel}
          compareDetails={compareDetails}
        />
      </div>
    </div>
  );
}
