import { useState } from "react";
import AdminBrands from "./AdminBrands";
import AdminSeries from "./AdminSeries";
import AdminModelsJumdata from "./AdminModelsJumdata";
import AdminModelDetails from "./AdminModelDetails";
import AdminModelResources from "./AdminModelResources";
import AdminMaterialOverview from "./AdminMaterialOverview";
import { pageCardCls, pageTitleCls, pageDescCls, subTabCls } from "@/admin/AdminApp";
import type { MaterialResourceJump } from "@/pages/admin/materialResourceJump";

type MaterialTab =
  | "overview"
  | "brands"
  | "series"
  | "models"
  | "model-details"
  | "model-resources";

export default function AdminMaterialManagement() {
  const [tab, setTab] = useState<MaterialTab>("overview");
  const [resourceJump, setResourceJump] = useState<MaterialResourceJump | null>(null);

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-8">
        <h3 className={pageTitleCls()}>物料资产管理</h3>
        <p className={pageDescCls()}>
          管理网站的品牌、车系、车型、图片、视频、文档等物料资源
        </p>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => setTab("overview")}
            className={subTabCls(tab === "overview")}
          >
            数据总览
          </button>
          <button
            type="button"
            onClick={() => setTab("brands")}
            className={subTabCls(tab === "brands")}
          >
            品牌参数
          </button>
          <button
            type="button"
            onClick={() => setTab("series")}
            className={subTabCls(tab === "series")}
          >
            车系参数
          </button>
          <button
            type="button"
            onClick={() => setTab("models")}
            className={subTabCls(tab === "models")}
          >
            车型参数
          </button>
          <button
            type="button"
            onClick={() => setTab("model-details")}
            className={subTabCls(tab === "model-details")}
          >
            车型详细参数
          </button>
          <button
            type="button"
            onClick={() => setTab("model-resources")}
            className={subTabCls(tab === "model-resources")}
          >
            资源配置
          </button>
        </div>
      </div>

      <div>
        {tab === "overview" ? (
          <AdminMaterialOverview
            onGoToResources={(jump) => {
              setResourceJump(jump);
              setTab("model-resources");
            }}
          />
        ) : null}
        {tab === "brands" ? <AdminBrands /> : null}
        {tab === "series" ? <AdminSeries /> : null}
        {tab === "models" ? <AdminModelsJumdata /> : null}
        {tab === "model-details" ? <AdminModelDetails /> : null}
        {tab === "model-resources" ? <AdminModelResources jump={resourceJump} onJumpConsumed={() => setResourceJump(null)} /> : null}
      </div>
    </div>
  );
}
