import { useTranslation } from "react-i18next";
import type { FlattenedParam } from "@/utils/paramFlatten";

type Props = {
  items: FlattenedParam[];
};

export default function ExportAllParamsCard({ items }: Props) {
  const { t } = useTranslation();
  if (items.length === 0) return null;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="border-b border-zinc-200 px-5 py-4">
        <div className="text-base font-semibold text-zinc-900">{t('model.allParamsExport')}</div>
      </div>
      <div className="p-5">
        <div className="space-y-2">
          {items.map((it) => (
            <div key={it.path} className="flex items-start justify-between gap-3 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <div className="text-xs text-zinc-600 break-all">{it.path}</div>
              <div className="text-xs font-semibold text-zinc-900 text-right break-words">{it.value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
