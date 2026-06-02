import React from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "@/utils/supabaseClient";
import { pickActiveHeroPublicSlots, type HeroPublicSlot } from "@/utils/heroAssets";
import { useInquiryModal } from "@/store/useInquiryModal";

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
}

export default function HeroBanner({
  title = `DRIVE THE FUTURE WITH CHINA AUTO`,
  subtitle = `Focused on compliant operations and efficient services, we provide stable reliable bulk procurement solutions of Chinese automobiles for global auto dealers and individuals`,
}: HeroBannerProps) {
  const { t } = useTranslation();
  const openInquiry = useInquiryModal((s) => s.openModal);
  const [heroSlots, setHeroSlots] = React.useState<HeroPublicSlot[]>([]);
  const [heroIndex, setHeroIndex] = React.useState(0);

  const titleParts = React.useMemo(() => {
    const m = title.match(/^(.*?)(CHINA AUTO)(.*)$/i);
    if (!m) return { before: title, hit: null as string | null, after: "" };
    return { before: m[1] ?? "", hit: m[2] ?? "CHINA AUTO", after: m[3] ?? "" };
  }, [title]);

  React.useEffect(() => {
    let active = true;
    supabase
      .from('hero_public_slots_view')
      .select('*')
      .order('display_order', { ascending: true })
      .then(({ data, error }) => {
        if (!active) return;
        if (error) throw error;
        const slots = pickActiveHeroPublicSlots((data as HeroPublicSlot[]) ?? []);
        setHeroSlots(slots);
        setHeroIndex(0);
      })
      .catch(() => {
        if (!active) return;
        setHeroSlots([]);
      });
    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (heroSlots.length <= 1) return;
    const t = window.setInterval(() => {
      setHeroIndex((prev) => (prev + 1) % heroSlots.length);
    }, 6500);
    return () => window.clearInterval(t);
  }, [heroSlots.length]);

  const activeSlot = heroSlots.length > 0 ? heroSlots[Math.min(heroIndex, heroSlots.length - 1)] : null;

  return (
    <div className={`studio-hero ${activeSlot?.external_url ? 'studio-hero-has-media' : ''}`.trim()}>
      <div className="studio-hero-bg" />
      {activeSlot?.external_url ? (
        <div className="studio-hero-underlay" aria-hidden="true">
          {activeSlot.media_type === 'video' ? (
            <video
              src={activeSlot.external_url}
              className="studio-hero-underlay-media"
              muted
              autoPlay
              loop
              playsInline
              preload="auto"
            />
          ) : (
            <img
              src={activeSlot.external_url}
              alt=""
              className="studio-hero-underlay-media"
              loading="eager"
              referrerPolicy="no-referrer"
            />
          )}
        </div>
      ) : null}
      <div className="container relative z-10">
        <div className="studio-hero-grid relative z-10">
          <div className="studio-hero-left studio-hero-left-lift">
            <h1 className="studio-hero-title">
              <span className="studio-hero-title-inner">
                {titleParts.before}
                {titleParts.hit ? <span className="studio-hero-title-accent">{titleParts.hit}</span> : null}
                {titleParts.after}
              </span>
            </h1>
            <p className="studio-hero-subtitle">{subtitle}</p>
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
    </div>
  );
}
