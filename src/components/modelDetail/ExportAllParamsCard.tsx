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
      <div className="border-b border-zinc-200 px-6 py-4">
        <h2 className="text-base font-bold text-zinc-900">{t('model.allParamsExport')}</h2>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-zinc-100 rounded-xl overflow-hidden">
          {items.map((it) => (
            <div key={it.path} className="bg-white px-4 py-3 hover:bg-zinc-50/50 transition-colors">
              <div className="text-[11px] leading-4 text-zinc-400 font-medium tracking-wide uppercase break-all">
                {it.path}
              </div>
              <div className="mt-1 text-sm leading-5 text-zinc-900 font-medium break-words">
                {it.value}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
