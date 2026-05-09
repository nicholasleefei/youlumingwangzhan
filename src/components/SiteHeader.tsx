import { useEffect, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LanguageSwitcher from "./LanguageSwitcher";
import type { Locale } from "@/i18n/locales";
import { normalizeLocale } from "@/i18n/locales";
import logoUrl from "../../logo/youluminglogo.png?url";

function navCls(isActive: boolean) {
  return (
    "relative px-3 py-2 text-sm transition-all duration-300 " +
    (isActive
      ? "text-accent-green after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-full after:bg-accent-green after:transition-all after:duration-300"
      : "text-text-primary hover:text-accent-green after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-accent-green after:transition-all after:duration-300 hover:after:w-full")
  );
}

export default function SiteHeader() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const base = `/${locale}`;
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header className={`navbar sticky top-0 z-50 transition-all duration-base ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="container">
        <div className="navbar-inner flex items-center justify-between">
          <Link to={base} className="navbar-brand flex items-center gap-3">
            <div className="logo-circle">
              <img src={logoUrl} alt={t("brand")} className="logo-img" />
            </div>
            <div className="brand-text">
              <h1>YOLUMI</h1>
              <p>呦鹿鸣</p>
            </div>
          </Link>

          <nav className="desktop-menu hidden md:flex">
            <ul className="nav-list flex gap-xl items-center">
              <li>
                <NavLink to={base} end className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  {t("nav.home")}
                </NavLink>
              </li>
              <li>
                <NavLink to={`${base}/brands`} className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}>
                  {t("nav.brands")}
                </NavLink>
              </li>
            </ul>
          </nav>

          <div className="navbar-right flex items-center gap-lg">
            <div className="language-selector">
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
