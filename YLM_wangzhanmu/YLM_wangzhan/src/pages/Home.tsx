import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import { supabase } from "@/utils/supabaseClient";
import Globe from "@/components/Globe";
import ModelCard from "@/components/ModelCard";
import { listModels, type ModelListItem } from "@/utils/db";
import ExportProcess from "@/components/ExportProcess";
import HeroBanner from "@/components/HeroBanner";

type CountrySale = { countryName: string; salesVolume: number };
type Category = "all" | "ev" | "sedan" | "suv" | "mpv" | "coupe" | "pickup" | "van" | "microvan" | "lightbus";

export default function Home() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const [countrySales, setCountrySales] = useState<CountrySale[]>([]);
  const [allModels, setAllModels] = useState<ModelListItem[]>([]);
  const [filteredModels, setFilteredModels] = useState<ModelListItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<Category>("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchSales() {
      const { data } = await supabase.from("country_sales").select("*");
      if (data) {
        setCountrySales(data.map((d: any) => ({ countryName: d.country_name, salesVolume: d.sales_volume })));
      }
    }
    fetchSales();

    function onFocus() {
      fetchSales();
    }

    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  useEffect(() => {
    async function fetchModels() {
      setLoading(true);
      try {
        const models = await listModels({ locale, onlyHot: false });
        setAllModels(models);
        setFilteredModels(models.slice(0, 6));
      } catch (error) {
        console.error("Failed to fetch models:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchModels();
  }, [locale]);

  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredModels(allModels.slice(0, 6));
    } else if (selectedCategory === "ev") {
      const filtered = allModels.filter(model => model.fuel_type === "electric").slice(0, 6);
      setFilteredModels(filtered);
    } else {
      const filtered = allModels.filter(model => model.body_type === selectedCategory).slice(0, 6);
      setFilteredModels(filtered);
    }
  }, [selectedCategory, allModels]);

  return (
    <div className="min-h-screen bg-primary-dark text-text-primary">
      {/* Hero Section */}
      <section className="relative min-h-[600px] md:min-h-[700px] flex items-center justify-center overflow-hidden -mt-16">
        <div className="absolute inset-0 z-0 overflow-hidden">
          <HeroBanner
            title={t("hero.title")}
            subtitle={t("hero.subtitle", "以合规运营与高效服务为核心，为全球汽车商家及个人提供稳定可靠的中国汽车批量采购解决方案")}
          />
        </div>
      </section>

      {/* 热门车型 */}
      <section className="hot-models bg-bg-secondary relative overflow-hidden" id="models">
        <div className="star-field" />
        <div className="decoration-sphere" style={{ width: "35%", height: "35%", top: "-8%", right: "-12%" }} />

        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t("models.hot")}</h2>
            <p className="section-subtitle">{t("hero.subtitle")}</p>
          </div>

          <div className="category-filter overflow-x-auto pb-4 -mx-4 px-4">
            <div className="flex gap-0.625rem min-w-max px-0">
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              className={`category-btn ${selectedCategory === "all" ? "active" : ""}`}
            >
              {t("category.all", "全部")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("ev")}
              className={`category-btn ${selectedCategory === "ev" ? "active" : ""}`}
            >
              {t("category.ev", "新能源")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("sedan")}
              className={`category-btn ${selectedCategory === "sedan" ? "active" : ""}`}
            >
              {t("category.sedan", "轿车")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("suv")}
              className={`category-btn ${selectedCategory === "suv" ? "active" : ""}`}
            >
              {t("category.suv", "SUV")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("mpv")}
              className={`category-btn ${selectedCategory === "mpv" ? "active" : ""}`}
            >
              {t("category.mpv", "MPV")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("coupe")}
              className={`category-btn ${selectedCategory === "coupe" ? "active" : ""}`}
            >
              {t("category.coupe", "跑车")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("pickup")}
              className={`category-btn ${selectedCategory === "pickup" ? "active" : ""}`}
            >
              {t("category.pickup", "皮卡")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("van")}
              className={`category-btn ${selectedCategory === "van" ? "active" : ""}`}
            >
              {t("category.van", "微面")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("microvan")}
              className={`category-btn ${selectedCategory === "microvan" ? "active" : ""}`}
            >
              {t("category.microvan", "微卡")}
            </button>
            <button
              type="button"
              onClick={() => setSelectedCategory("lightbus")}
              className={`category-btn ${selectedCategory === "lightbus" ? "active" : ""}`}
            >
              {t("category.lightbus", "轻客")}
            </button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-accent border-t-transparent"></div>
              <span className="ml-3 text-text-secondary">{t("common.loading")}</span>
            </div>
          ) : filteredModels.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-bg-card py-20 text-center">
              <svg className="h-16 w-16 text-text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="mt-4 text-lg font-medium text-text-secondary">{t("models.empty")}</p>
            </div>
          ) : (
            <div className="models-grid">
              {filteredModels.map((model, index) => (
                <div key={model.id} className="fade-in-up" style={{ animationDelay: `${index * 0.1}s` }}>
                  <ModelCard model={model} index={index} />
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 出口流程 */}
      <section className="relative overflow-hidden bg-bg-secondary">
        <div className="star-field" />
        <div className="decoration-sphere" style={{ width: "30%", height: "30%", bottom: "10%", right: "-5%" }} />
        <ExportProcess />
      </section>

      {/* 全球市场覆盖 */}
      <section className="bg-bg-secondary relative overflow-hidden">
        <div className="star-field" />

        <div className="container">
          <div className="text-center mb-16">
            <h2 className="section-title">
              {t("home.globe.title", "覆盖全球主要市场")}
            </h2>
            <p className="section-subtitle">
              {t("home.globe.subtitle", "我们的汽车出口业务已覆盖中东、中亚、东南亚、非洲、南美等全球多个区域")}
            </p>
          </div>

          <div className="relative h-[448px] overflow-hidden md:h-[588px] border-0 rounded-none">
            <div className="absolute inset-0">
              <Globe
                className="h-full w-full"
                accent="#60a5fa"
                ocean="rgba(15, 30, 60, 0.95)"
                land="rgba(80, 120, 200, 0.85)"
                highlight="rgba(96, 165, 250, 0.98)"
                graticule="rgba(96, 165, 250, 0.35)"
                borders="rgba(255, 255, 255, 0.55)"
                countrySales={countrySales}
                interactive
              />
            </div>

            <div className="pointer-events-none absolute bottom-4 left-4 rounded-full border border-border bg-bg-card/80 px-3 py-1 text-xs text-text-secondary backdrop-blur">
              {t("home.globe.hint")}
            </div>
          </div>
        </div>
      </section>

      {/* 联系我们 */}
      <section className="bg-bg-secondary relative overflow-hidden" id="contact">
        <div className="decoration-sphere" style={{ width: "40%", height: "40%", bottom: "-10%", left: "-10%" }} />

        <div className="container">
          <div className="glass-card glass-card-strong rounded-3xl overflow-hidden">
            <div className="p-8 md:p-12">
              <div className="flex flex-col md:flex-row items-center gap-8">
                {/* 头像区域 */}
                <div className="relative">
                  <div className="relative w-32 h-32 rounded-full overflow-hidden border-4 border-border shadow-lg">
                    <img
                      src="/favicon.svg"
                      alt="联系我们"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="absolute -bottom-2 -right-2 w-16 h-16 bg-bg-card rounded-full flex items-center justify-center shadow-lg border-4 border-accent-green/20">
                    <svg className="w-8 h-8 text-accent-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                  </div>
                </div>

                <div className="flex-1 text-center md:text-left">
                  <h3 className="text-3xl font-bold text-text-primary mb-4">
                    {t("contact.title", "不确定从哪里开始？")}
                  </h3>
                  <p className="text-lg text-text-secondary mb-6 leading-relaxed max-w-xl">
                    {t("contact.description", "预约 30 分钟的免费咨询。我们将分析您的需求，并为您提供最佳的汽车采购方案。")}
                  </p>
                  <Link
                    to={`/${locale}/inquiry`}
                    className="btn-inquiry inline-flex items-center gap-2"
                  >
                    <span>{t("action.getQuote", "获取报价")}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
