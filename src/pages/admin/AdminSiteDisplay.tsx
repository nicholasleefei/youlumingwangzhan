import { useState } from "react";
import { pageCardCls, pageTitleCls, pageDescCls, subTabCls, primaryButtonCls } from "@/admin/AdminApp";
import AdminCountrySales from "./AdminCountrySales";
import AdminHeroAssets from "./AdminHeroAssets";

type SiteDisplayTab = "hero-assets" | "brands" | "announcements" | "layout" | "country-sales";

export default function AdminSiteDisplay() {
  const [tab, setTab] = useState<SiteDisplayTab>("hero-assets");

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-8">
        <h3 className={pageTitleCls()}>内容发布管理</h3>
        <p className={pageDescCls()}>
          管理网站的显示配置和内容展示
        </p>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => setTab("hero-assets")}
            className={subTabCls(tab === "hero-assets")}
          >
            首页英雄区展示素材
          </button>
          <button
            type="button"
            onClick={() => setTab("brands")}
            className={subTabCls(tab === "brands")}
          >
            热门品牌配置
          </button>
          <button
            type="button"
            onClick={() => setTab("announcements")}
            className={subTabCls(tab === "announcements")}
          >
            网站公告管理
          </button>
          <button
            type="button"
            onClick={() => setTab("layout")}
            className={subTabCls(tab === "layout")}
          >
            页面布局配置
          </button>
          <button
            type="button"
            onClick={() => setTab("country-sales")}
            className={subTabCls(tab === "country-sales")}
          >
            国家销量
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {tab === "hero-assets" ? <AdminHeroAssets /> : null}

        {tab === "brands" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 text-xl">🏷️</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">热门品牌配置</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              设置网站首页展示的热门品牌
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              配置热门品牌
            </button>
          </div>
        ) : null}

        {tab === "announcements" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 text-xl">📢</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">网站公告管理</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              发布和管理网站的公告信息
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              管理公告
            </button>
          </div>
        ) : null}

        {tab === "layout" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xl">🎨</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">页面布局配置</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              自定义网站页面布局和展示方式
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              配置布局
            </button>
          </div>
        ) : null}

        {tab === "country-sales" ? (
          <AdminCountrySales />
        ) : null}
      </div>
    </div>
  );
}
