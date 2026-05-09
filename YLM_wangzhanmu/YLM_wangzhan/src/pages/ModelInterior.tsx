import { useEffect, useMemo, useState } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import SiteHeader from "@/components/SiteHeader";
import SiteFooter from "@/components/SiteFooter";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import { getModelBySlug } from "@/utils/db";
import { useInquiryDraft } from "@/store/useInquiryDraft";
import type { ModelRow } from "@/utils/db";

export default function ModelInterior() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const slug = typeof params.slug === "string" ? params.slug : "";
  const base = `/${locale}`;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<Awaited<ReturnType<typeof getModelBySlug>>>(null);

  const toggle = useInquiryDraft((s) => s.toggleModelId);
  const selectedIds = useInquiryDraft((s) => s.selectedModelIds);
  const selected = data?.model ? selectedIds.includes(data.model.id) : false;

  const query = useMemo(() => ({ slug, locale }), [slug, locale]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    getModelBySlug(query)
      .then(async (d) => {
        if (!active) return;
        setData(d);
      })
      .catch((e: unknown) => {
        if (!active) return;
        setError(e instanceof Error ? e.message : t("common.loadFailed"));
      })
      .finally(() => {
        if (!active) return;
        setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary-dark text-text-primary relative overflow-hidden">
        <SiteHeader />
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(15,42,71,0.45)_0%,rgba(10,13,20,0.95)_100%)]"></div>
        <div className="star-field" />
        <div className="mx-auto max-w-7xl px-4 py-32 relative z-10">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-accent border-t-transparent"></div>
            <span className="ml-3 text-text-secondary">{t("common.loading")}</span>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  if (error || !data || !data.model) {
    return (
      <div className="min-h-screen bg-primary-dark text-text-primary relative overflow-hidden">
        <SiteHeader />
        <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(15,42,71,0.45)_0%,rgba(10,13,20,0.95)_100%)]"></div>
        <div className="star-field" />
        <div className="mx-auto max-w-7xl px-4 py-32 relative z-10">
          <div className="flex flex-col items-center justify-center py-20 px-4 rounded-2xl border border-border bg-bg-card/40 backdrop-blur-md text-center">
            <svg className="w-20 h-20 text-text-tertiary mb-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="text-2xl font-bold text-text-secondary mb-4">{t("common.notFound")}</h3>
            <Link to={`${base}/models/all`} className="btn-details mt-4 inline-flex">
              {t("action.back")}
            </Link>
          </div>
        </div>
        <SiteFooter />
      </div>
    );
  }

  const model = data.model as ModelRow;
  const name = data.translation?.name ?? model.name;
  const backUrl = `${base}/models/all`;

  // @ts-ignore
  const interiorImages = model.interior_images?.filter((img: string) => img.trim()) || [];

  return (
    <div className="min-h-screen bg-primary-dark text-text-primary relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(ellipse_at_center,rgba(15,42,71,0.45)_0%,rgba(10,13,20,0.95)_100%)]"></div>
      <div className="star-field" />

      <SiteHeader />

      <main className="mx-auto max-w-7xl px-4 py-32 relative z-10">
        {/* Breadcrumb Navigation */}
        <div className="mb-8 flex items-center gap-2 text-sm">
          <Link to={`${base}/`} className="text-text-secondary hover:text-text-primary transition-colors">
            {t("nav.home")}
          </Link>
          <span className="text-text-tertiary">/</span>
          <Link to={`${base}/models/all`} className="text-text-secondary hover:text-text-primary transition-colors">
            {t("nav.models")}
          </Link>
          <span className="text-text-tertiary">/</span>
          <Link to={`${base}/models/${slug}`} className="text-text-secondary hover:text-text-primary transition-colors">
            {name}
          </Link>
          <span className="text-text-tertiary">/</span>
          <span className="text-text-primary">{t("model.interior", "内饰")}</span>
        </div>

        {/* Core Info Section */}
        <div className="mb-10 rounded-3xl border border-border bg-bg-card/60 p-8 shadow-xl shadow-blue-900/10 backdrop-blur-md">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8">
            <div className="flex-1">
              <h1 className="text-4xl lg:text-5xl font-bold text-text-primary mb-3 leading-tight">
                {name}
              </h1>
              {model.fullname && model.fullname !== name && (
                <p className="text-xl text-text-secondary mb-6">{model.fullname}</p>
              )}

              <div className="flex flex-wrap gap-2 mb-6">
                {model.brand && (
                  <span className="rounded-full bg-bg-card border border-border px-4 py-2 text-sm text-text-secondary">
                    {model.brand}
                  </span>
                )}
                {model.vehicle_class && (
                  <span className="rounded-full bg-bg-card border border-border px-4 py-2 text-sm text-text-secondary">
                    {model.vehicle_class}
                  </span>
                )}
                {model.energy_type && (
                  <span className="rounded-full bg-bg-card border border-border px-4 py-2 text-sm text-text-secondary">
                    {model.energy_type}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Interior Image Gallery */}
        <div className="mb-10">
          <h2 className="text-2xl font-bold text-text-primary mb-6 px-1">{t("model.interior", "内饰")}</h2>
          {interiorImages.length === 0 ? (
            <div className="rounded-2xl border border-border bg-bg-card/60 p-12 text-center shadow-lg shadow-blue-900/10 backdrop-blur-md">
              <svg className="w-16 h-16 text-text-tertiary mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <p className="text-text-secondary">{t("common.noImage", "暂无图片")}</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {interiorImages.map((imageUrl, index) => (
                <div
                  key={index}
                  className="rounded-2xl border border-border bg-bg-card/60 overflow-hidden shadow-lg shadow-blue-900/10 backdrop-blur-md"
                >
                  <img
                    src={imageUrl}
                    alt={`${name} ${t("model.interior")} ${index + 1}`}
                    className="w-full h-auto object-cover"
                    loading="lazy"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Action Buttons */}
        <div className="mt-12 sticky bottom-6 bg-bg-card/80 backdrop-blur-xl border border-border rounded-2xl p-4 shadow-xl shadow-blue-900/20">
          <div className="grid grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => navigate(backUrl)}
              className="btn-details"
            >
              {t("action.back", "返回列表")}
            </button>
            <button
              type="button"
              onClick={() => toggle(model.id)}
              className="btn-inquiry"
            >
              {selected ? "✓ " : ""}{t("action.addToInquiry", "加入报价单")}
            </button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
