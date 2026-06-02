import { useTranslation } from "react-i18next";

type Props = {
  items: Array<{ label: string; value: string }>;
  onOpenAll: () => void;
};

export default function KeyParamsCard({ items, onOpenAll }: Props) {
  const { t } = useTranslation();
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div className="text-base font-semibold text-zinc-900">{t('model.keyParams')}</div>
        <button
          type="button"
          onClick={onOpenAll}
          className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
        >
          {t('model.viewAllParams')}
        </button>
      </div>
      <div className="p-5">
        {items.length === 0 ? (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">{t('model.noKeyParams')}</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((p) => (
              <div key={p.label} className="rounded-xl border border-zinc-200 bg-white p-4">
                <div className="text-xs text-zinc-500">{p.label}</div>
                <div className="mt-1 text-sm font-semibold text-zinc-900 break-words">{p.value}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
