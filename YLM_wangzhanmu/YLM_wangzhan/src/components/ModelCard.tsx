import { memo } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ChevronRight } from "lucide-react";
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
  const selectedIds = useInquiryDraft((s) => s.selectedModelIds);
  const selected = selectedIds.includes(model.id);

  const detailUrl = model.slug ? `${base}/detail/${model.slug}` : `${base}/admin`;

  // Collect core attributes for display
  const coreAttributes: string[] = [];
  if (model.fuel_type) coreAttributes.push(model.fuel_type);
  if (model.body_type) coreAttributes.push(model.body_type);
  if (model.cltc_range) coreAttributes.push(`${model.cltc_range}km`);

  return (
    <div className="model-card-enhanced" style={{ animationDelay: `${index * 0.1}s` }}>
      {/* Top gradient highlight for glass morphism effect */}
      <div className="card-highlight"></div>

      <div className="model-image-container-enhanced">
        {model.cover_image ? (
          <SafeImage
            src={model.cover_image}
            alt={model.display_name}
            className="h-full w-full object-cover transition-all duration-500 hover:scale-105 hover:brightness-110"
            usePlaceholder={true}
          />
        ) : (
          <div className="no-image-placeholder-enhanced">
            <div className="car-silhouette-enhanced">
              <svg viewBox="0 0 120 60" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 30 L20 15 L100 15 L110 30 L100 45 L20 45 Z" />
              </svg>
            </div>
            <div className="placeholder-text-enhanced">{t("common.noImage")}</div>
          </div>
        )}
        {model.is_hot ? (
          <span className="hot-badge-enhanced">{t("models.hot")}</span>
        ) : null}
      </div>

      <div className="model-info-enhanced">
        <div className="model-brand-enhanced">{model.display_name}</div>
        <div className="model-subtitle">{model.brand || ""}</div>

        {/* Core attribute tags */}
        {coreAttributes.length > 0 && (
          <div className="model-attributes">
            {coreAttributes.map((attr, i) => (
              <span key={i} className="attribute-tag">
                {attr}
              </span>
            ))}
          </div>
        )}

        <div className="model-actions-enhanced">
          <Link
            to={detailUrl}
            className="btn-details btn-view-details text-center"
          >
            {t("action.viewDetails", "查看详情")}
          </Link>
          <button
            type="button"
            onClick={() => toggle(model.id)}
            className="btn-inquiry btn-full-width"
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
