import React from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";

interface HeroBannerProps {
  title?: string;
  subtitle?: string;
}

export default function HeroBanner({
  title = `DRIVE THE FUTURE WITH CHINA AUTO`,
  subtitle = `Focused on compliant operations and efficient services, we provide stable reliable bulk procurement solutions of Chinese automobiles for global auto dealers and individuals`,
}: HeroBannerProps) {
  const { t } = useTranslation();

  return (
    <div className="relative overflow-hidden" style={{ width: "100%", minHeight: "700px" }}>
      {/* Deep space background */}
      <div className="absolute inset-0 bg-primary-dark" />

      {/* Gradient sphere decoration */}
      <div className="decoration-sphere" style={{ width: "50%", height: "50%", top: "5%", left: "-10%" }} />

      {/* Star field */}
      <div className="star-field" />

      {/* Individual stars with twinkle animation */}
      {Array.from({ length: 40 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full"
          style={{
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            width: `${Math.random() * 2 + 1}px`,
            height: `${Math.random() * 2 + 1}px`,
            background: "rgba(255,255,255,0.8)",
            animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
            opacity: Math.random() * 0.7 + 0.3,
          }}
        />
      ))}

      {/* Center text content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10" style={{ padding: "0 20px" }}>
        <div className="container text-center">
          <div className="hero-content">
            <h1 className="hero-title">
              {title.split("CHINA AUTO")[0]}
              <span className="text-gradient">CHINA AUTO</span>
            </h1>
            <p className="hero-description">
              {subtitle}
            </p>
            <div className="hero-cta flex flex-wrap gap-4 justify-center">
              <a href="#models" className="btn btn-primary">
                Browse Hot Models
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M5 10H15M15 10L10 5M15 10L10 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </a>
              <Link to="inquiry" className="btn btn-outline">
                {t("action.getQuote", "Get Quote")}
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
