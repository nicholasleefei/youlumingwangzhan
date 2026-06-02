import { useEffect, useState } from "react";
import { Link, NavLink, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Menu, X } from "lucide-react";
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
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [params.locale]);

  return (
    <header className={`navbar sticky top-0 z-50 transition-all duration-base ${scrolled ? "navbar-scrolled" : ""}`}>
      <div className="container">
        <div className="navbar-inner flex items-center justify-between">
          <Link to={base} className="navbar-brand flex items-center gap-3" onClick={() => setMobileOpen(false)}>
            <div className="logo-circle">
              <img src={logoUrl} alt={t("brand")} className="logo-img" />
            </div>
            <div className="brand-text">
              <h1>YOLUMI</h1>
              <p>呦鹿鸣</p>
            </div>
          </Link>

          {/* Desktop nav */}
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
            {/* Mobile hamburger */}
            <button
              type="button"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="md:hidden inline-flex items-center justify-center rounded-lg p-2 text-zinc-700 hover:bg-zinc-100"
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile nav drawer */}
      {mobileOpen && (
        <div className="md:hidden border-t border-zinc-200 bg-white">
          <nav className="container py-4">
            <ul className="flex flex-col gap-1">
              <li>
                <NavLink
                  to={base}
                  end
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                      isActive ? "bg-emerald-50 text-emerald-700" : "text-zinc-700 hover:bg-zinc-50"
                    }`
                  }
                >
                  {t("nav.home")}
                </NavLink>
              </li>
              <li>
                <NavLink
                  to={`${base}/brands`}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    `block rounded-lg px-4 py-3 text-base font-medium transition-colors ${
                      isActive ? "bg-emerald-50 text-emerald-700" : "text-zinc-700 hover:bg-zinc-50"
                    }`
                  }
                >
                  {t("nav.brands")}
                </NavLink>
              </li>
            </ul>
          </nav>
        </div>
      )}
    </header>
  );
}
