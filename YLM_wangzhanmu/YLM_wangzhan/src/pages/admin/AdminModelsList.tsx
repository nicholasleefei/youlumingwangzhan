import { useTranslation } from "react-i18next";
import type { ModelRow } from "@/utils/db";

export default function AdminModelsList(props: {
  loading: boolean;
  error: string | null;
  models: ModelRow[];
  onSelect: (m: ModelRow) => void;
  onRefresh: () => void;
}) {
  const { t } = useTranslation();

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-zinc-800">{t("admin.tab.models")}</div>
        <button
          type="button"
          onClick={props.onRefresh}
          className="inline-flex h-9 items-center rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-800 hover:bg-zinc-50"
        >
          {t("action.refresh")}
        </button>
      </div>

      {props.loading ? <div className="mt-3 text-sm text-zinc-500">{t("common.loading")}</div> : null}
      {props.error ? <div className="mt-3 text-sm text-red-300">{props.error}</div> : null}

      {props.models.length === 0 ? (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">{t("admin.models.empty")}</div>
      ) : (
        <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
          <div className="grid grid-cols-12 gap-2 bg-zinc-50 px-3 py-2 text-xs text-zinc-500">
            <div className="col-span-5">{t("admin.models.columns.name")}</div>
            <div className="col-span-3">{t("admin.models.columns.brand")}</div>
            <div className="col-span-2">{t("admin.models.columns.hot")}</div>
            <div className="col-span-2">{t("admin.models.columns.active")}</div>
          </div>
          {props.models.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => props.onSelect(m)}
              className="grid w-full grid-cols-12 gap-2 border-t border-zinc-200 bg-white px-3 py-2 text-left text-sm text-zinc-800 hover:bg-zinc-50"
            >
              <div className="col-span-5 truncate">{m.name}</div>
              <div className="col-span-3 truncate text-zinc-600">{m.brand ?? "-"}</div>
              <div className="col-span-2 text-zinc-600">{m.is_hot ? "是" : "否"}</div>
              <div className="col-span-2 text-zinc-600">{m.is_active ? "是" : "否"}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
