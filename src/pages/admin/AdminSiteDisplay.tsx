import { useState } from "react";
import { pageCardCls, pageTitleCls, pageDescCls, subTabCls } from "@/admin/AdminApp";
import AdminCountrySales from "./AdminCountrySales";
import AdminHeroAssets from "./AdminHeroAssets";

type SiteDisplayTab = "hero-assets" | "country-sales";

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
            onClick={() => setTab("country-sales")}
            className={subTabCls(tab === "country-sales")}
          >
            国家销量
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {tab === "hero-assets" ? <AdminHeroAssets /> : null}

        {tab === "country-sales" ? (
          <AdminCountrySales />
        ) : null}
      </div>
    </div>
  );
}
