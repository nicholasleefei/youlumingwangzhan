import { memo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import type { ModelListItem } from "@/utils/db";
import { useInquiryDraft } from "@/store/useInquiryDraft";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import SafeImage from "@/components/SafeImage";

function ModelCardComponent(props: { model: ModelListItem; index?: number }) {
  const { model, index = 0 } = props;
  const { t } = useTranslation();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const base = `/${locale}`;
  const toggle = useInquiryDraft((s) => s.toggleModelId);
  const selected = useInquiryDraft((s) => s.selectedModelIds.includes(model.id));

  return (
    <div className="model-card" style={{ animationDelay: `${index * 0.1}s` }}>
      <div className="model-image-container">
        {model.cover_image ? (
          <SafeImage
            src={model.cover_image}
            alt={model.display_name}
            className="h-full w-full object-cover transition-all duration-500 hover:scale-105 hover:brightness-110"
            usePlaceholder={true}
          />
        ) : (
          <div className="no-image-placeholder">
            <div className="car-silhouette">
              <svg viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 30 L20 15 L100 15 L110 30 L100 45 L20 45 Z" />
              </svg>
            </div>
            <div className="placeholder-text">{t("common.noImage")}</div>
          </div>
        )}
        {model.is_hot ? (
          <span className="hot-badge">{t("models.hot")}</span>
        ) : null}
      </div>

      <div className="model-info">
        <div className="model-brand">{model.display_name}</div>
        <div className="model-name">{[model.brand, model.series_name].filter(Boolean).join(" · ") || model.summary || ""}</div>

        <div className="model-actions">
          <Link
            to={model.slug ? `${base}/models/${model.slug}` : `${base}/admin`}
            className="btn-details"
          >
            {t("action.viewDetail")}
          </Link>
          <button
            type="button"
            onClick={() => toggle(model.id)}
            className="btn-inquiry"
          >
            {selected ? "✓ " : ""}{t("action.addToInquiry")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default memo(ModelCardComponent, (prev, next) => {
  return prev.model.id === next.model.id && prev.index === next.index;
});
