import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import type { ModelDetails, ModelJumdata, SeriesModelListItem } from "./modelDetailData";
import { buildKeyParams12 } from "./keyParams";

type Props = {
  currentModel: ModelJumdata;
  currentDetails: ModelDetails | null;
  compareModels: SeriesModelListItem[];
  compareId: string;
  onChangeCompareId: (id: string) => void;
  compareModel: ModelJumdata | null;
  compareDetails: ModelDetails | null;
};

export default function KeyParamsCompare({
  currentModel,
  currentDetails,
  compareModels,
  compareId,
  onChangeCompareId,
  compareModel,
  compareDetails,
}: Props) {
  const { t } = useTranslation();
  const current = useMemo(() => buildKeyParams12(currentModel, currentDetails), [currentModel, currentDetails]);
  const compare = useMemo(() => (compareModel ? buildKeyParams12(compareModel, compareDetails) : []), [compareModel, compareDetails]);
  const compareMap = useMemo(() => new Map(compare.map((x) => [x.key, x.value])), [compare]);
  const hasCompare = Boolean(compareModel && compareId);

  return (
    <div className="rounded-2xl bg-zinc-50 p-4">
      <div className="flex items-start justify-between gap-3 pb-4">
        <div>
          <div className="text-sm font-semibold leading-6 text-zinc-900">{t("model.keyParams")}</div>
          <div className="mt-0.5 text-xs leading-5 text-zinc-500">{t("model.max12Items")}</div>
        </div>
        <div className="min-w-40">
          <select
            value={compareId}
            onChange={(e) => onChangeCompareId(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-800"
            aria-label={t("model.selectForCompare")}
          >
            <option value="">{t("model.noCompare")}</option>
            {compareModels
              .filter((m) => m.id !== currentModel.id)
              .map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
          </select>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-4">
        <div className={hasCompare ? "grid grid-cols-3 gap-x-4 gap-y-2 text-xs" : "grid grid-cols-2 gap-x-4 gap-y-2 text-xs"}>
          <div className="pb-1 font-semibold text-zinc-500">{t("model.param")}</div>
          <div className="pb-1 font-semibold text-zinc-900 truncate" title={currentModel.name}>
            {currentModel.name}
          </div>
          {hasCompare ? (
            <div className="pb-1 font-semibold text-zinc-900 truncate" title={compareModel?.name ?? ""}>
              {compareModel?.name ?? ""}
            </div>
          ) : null}

          {current.map((row, idx) => {
            const left = row.value ?? "-";
            const right = hasCompare ? compareMap.get(row.key) ?? "-" : null;
            const rowCls = idx === current.length - 1 ? "" : "border-b border-zinc-100";
            return (
              <div key={row.key} className={hasCompare ? "contents" : "contents"}>
                <div className={`py-2 leading-6 text-zinc-600 ${rowCls}`}>{row.label}</div>
                <div className={`py-2 leading-6 text-zinc-900 ${rowCls}`}>
                  <span className="inline-flex max-w-full rounded-full bg-zinc-50 px-3 py-1.5">{left}</span>
                </div>
                {hasCompare ? (
                  <div className={`py-2 leading-6 text-zinc-900 ${rowCls}`}>
                    <span className="inline-flex max-w-full rounded-full bg-zinc-50 px-3 py-1.5">{right}</span>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
