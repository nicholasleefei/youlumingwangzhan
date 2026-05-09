import { useTranslation } from "react-i18next";
import { Link, useParams } from "react-router-dom";
import logoUrl from "../../logo/youluminglogo.png?url";
import { normalizeLocale } from "@/i18n/locales";

export default function SiteFooter() {
  const { t } = useTranslation();
  const params = useParams();
  const raw = typeof params.locale === "string" ? params.locale : null;
  const locale = normalizeLocale(raw) ?? window.localStorage.getItem("ylm_locale") ?? "en";
  const base = `/${locale}`;
  return (
    <footer className="border-t border-border relative overflow-hidden" style={{ background: 'var(--color-bg-secondary)' }}>
      <div className="star-field" />
      {/* 主要内容区域 */}
      <div className="mx-auto max-w-6xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          {/* 品牌信息 */}
          <div className="md:col-span-1">
            <div className="mb-4 flex items-center gap-3">
              <div className="logo-circle w-10 h-10">
                <img src={logoUrl} alt="YOLUMI" className="logo-img h-full w-full object-contain" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-text-primary">YOLUMI</span>
                <span className="text-sm text-text-secondary">呦鹿鸣</span>
              </div>
            </div>
            <p className="text-sm text-text-secondary">
              {t("footer.description", "专业的汽车批量出口服务，连接全球市场")}
            </p>
          </div>

          {/* 快速链接 */}
          <div>
            <div className="mb-4 text-sm font-semibold text-text-primary">{t("footer.quickLinks", "快速链接")}</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={`${base}/brands`} className="text-text-secondary hover:text-text-primary transition-colors">{t("nav.models", "车型")}</Link>
              </li>
              <li>
                <Link to={`${base}/inquiry`} className="text-text-secondary hover:text-text-primary transition-colors">{t("nav.inquiry", "获取报价")}</Link>
              </li>
              <li>
                <Link to={`${base}`} className="text-text-secondary hover:text-text-primary transition-colors">{t("nav.about", "关于我们")}</Link>
              </li>
            </ul>
          </div>

          {/* 法律信息 */}
          <div>
            <div className="mb-4 text-sm font-semibold text-text-primary">{t("footer.legal", "法律信息")}</div>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="/privacy" className="text-text-secondary hover:text-text-primary transition-colors">{t("footer.privacy", "隐私政策")}</a>
              </li>
              <li>
                <a href="/terms" className="text-text-secondary hover:text-text-primary transition-colors">{t("footer.terms", "服务条款")}</a>
              </li>
              <li>
                <a href="/cookies" className="text-text-secondary hover:text-text-primary transition-colors">{t("footer.cookies", "Cookie 政策")}</a>
              </li>
            </ul>
          </div>

          {/* 联系我们 */}
          <div>
            <div className="mb-4 text-sm font-semibold text-text-primary">{t("footer.contact", "获取报价")}</div>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to={`${base}/inquiry`} className="text-text-secondary hover:text-text-primary transition-colors">
                  {t("action.getQuote", "获取报价")}
                </Link>
              </li>
              <li>
                <a href="mailto:business@yolumi.com" className="text-text-secondary hover:text-text-primary transition-colors">
                  business@yolumi.com
                </a>
              </li>
              <li className="text-text-secondary">WhatsApp: +86 xxx xxxx xxxx</li>
              <li className="text-text-secondary">{t("footer.address", "中国·上海")}</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 底部栏 */}
      <div className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 text-sm text-text-tertiary md:flex-row md:items-center md:justify-between">
          {/* 版权信息 */}
          <div>
            © {new Date().getFullYear()} YOLUMI. {t("footer.rights", "保留所有权利")}
          </div>

          {/* 社交媒体 */}
          <div className="flex items-center gap-4">
            <span className="text-text-muted">{t("footer.followUs", "关注我们")}:</span>
            <a
              href="https://tiktok.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
              </svg>
              <span className="hidden sm:inline">TikTok</span>
            </a>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
              </svg>
              <span className="hidden sm:inline">Facebook</span>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
              </svg>
              <span className="hidden sm:inline">Instagram</span>
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
              <span className="hidden sm:inline">LinkedIn</span>
            </a>
            <a
              href="https://youtube.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
            >
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
              </svg>
              <span className="hidden sm:inline">YouTube</span>
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
