import React from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/utils/supabaseClient";
import { useInquiryModal } from "@/store/useInquiryModal";

type HeroAssetRow = {
  id: string;
  media_type: 'image' | 'video';
  external_url: string | null;
};

export default function HeroBanner() {
  const { t } = useTranslation();
  const openInquiry = useInquiryModal((s) => s.openModal);
  const [mediaList, setMediaList] = React.useState<HeroAssetRow[]>([]);
  const [activeIndex, setActiveIndex] = React.useState(0);

  React.useEffect(() => {
    let active = true;
    supabase
      .from('hero_assets')
      .select('id, media_type, external_url')
      .eq('is_active', true)
      .eq('disabled', false)
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) throw error;
        setMediaList((data as HeroAssetRow[]) ?? []);
        setActiveIndex(0);
      })
      .catch(() => { if (active) setMediaList([]); });
    return () => { active = false; };
  }, []);

  React.useEffect(() => {
    if (mediaList.length <= 1) return;
    const timer = window.setInterval(() => {
      setActiveIndex(prev => (prev + 1) % mediaList.length);
    }, 6500);
    return () => window.clearInterval(timer);
  }, [mediaList.length]);

  const active = mediaList.length > 0 ? mediaList[Math.min(activeIndex, mediaList.length - 1)] : null;
  const hasMedia = !!active?.external_url;

  return (
    <div className={`studio-hero${hasMedia ? ' studio-hero-has-media' : ''}`}>
      <div className="studio-hero-bg" />
      {hasMedia ? (
        <div className="studio-hero-underlay" aria-hidden="true">
          {active.media_type === 'video' ? (
            <video
              src={active.external_url!}
              className="studio-hero-underlay-media"
              muted autoPlay loop playsInline preload="auto"
            />
          ) : (
            <img
              src={active.external_url!}
              alt=""
              className="studio-hero-underlay-media"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      ) : null}
      <div className="container relative z-10">
        <div className="studio-hero-grid">
          <h1 className="studio-hero-title">{t("hero.title")}</h1>
          <p className="studio-hero-subtitle">{t("hero.subtitle")}</p>
          <div className="studio-hero-actions">
            <a href="#models" className="btn btn-primary">
              {t("action.browseHotModels")}
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </a>
            <button type="button" onClick={openInquiry} className="btn btn-outline">
              {t("action.getQuote", "Get Quote")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
