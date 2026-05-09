import { useTranslation } from "react-i18next";
import { Category, CATEGORIES, CATEGORY_TRANSLATION_KEYS, CATEGORY_DEFAULT_LABELS } from "@/constants/categories";

interface CategoryFilterProps {
  selectedCategory: Category;
  onCategoryChange: (category: Category) => void;
}

export default function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap justify-center gap-2">
      {CATEGORIES.map((category) => (
        <button
          key={category}
          type="button"
          onClick={() => onCategoryChange(category)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === category
              ? "bg-zinc-900 text-white"
              : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200"
          }`}
        >
          {t(CATEGORY_TRANSLATION_KEYS[category], CATEGORY_DEFAULT_LABELS[category])}
        </button>
      ))}
    </div>
  );
}
