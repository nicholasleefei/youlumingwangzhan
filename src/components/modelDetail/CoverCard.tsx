import { useTranslation } from "react-i18next";
import SafeImage from "@/components/SafeImage";

type Props = {
  title: string;
  coverUrl: string;
  onOpen: () => void;
};

export default function CoverCard({ title, coverUrl, onOpen }: Props) {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
        <div className="text-base font-semibold text-zinc-900">{t('model.coverImage')}</div>
        <div className="text-xs text-zinc-500">{t('model.clickToPreview')}</div>
      </div>
      <button type="button" onClick={onOpen} className="w-full">
        <SafeImage src={coverUrl} alt={title} className="h-56 w-full object-cover" usePlaceholder />
      </button>
    </div>
  );
}
