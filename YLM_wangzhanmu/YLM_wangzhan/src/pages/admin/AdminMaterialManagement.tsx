import { useState } from "react";
import AdminBrands from "./AdminBrands";
import AdminSeries from "./AdminSeries";
import AdminModelsJumdata from "./AdminModelsJumdata";
import AdminModelDetails from "./AdminModelDetails";
import AdminModelResources from "./AdminModelResources";
import { pageCardCls, pageTitleCls, pageDescCls, subTabCls, primaryButtonCls } from "@/admin/AdminApp";

type MaterialTab = "brands" | "series" | "models" | "model-details" | "model-resources" | "images" | "videos" | "documents" | "categories";

export default function AdminMaterialManagement() {
  const [tab, setTab] = useState<MaterialTab>("brands");

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
            onClick={() => setTab("brands")}
            className={subTabCls(tab === "brands")}
          >
            品牌
          </button>
          <button
            type="button"
            onClick={() => setTab("series")}
            className={subTabCls(tab === "series")}
          >
            车系
          </button>
          <button
            type="button"
            onClick={() => setTab("models")}
            className={subTabCls(tab === "models")}
          >
            车型
          </button>
          <button
            type="button"
            onClick={() => setTab("model-details")}
            className={subTabCls(tab === "model-details")}
          >
            车型详情
          </button>
          <button
            type="button"
            onClick={() => setTab("model-resources")}
            className={subTabCls(tab === "model-resources")}
          >
            展示资源配置
          </button>
          <button
            type="button"
            onClick={() => setTab("images")}
            className={subTabCls(tab === "images")}
          >
            图片库管理
          </button>
          <button
            type="button"
            onClick={() => setTab("videos")}
            className={subTabCls(tab === "videos")}
          >
            视频管理
          </button>
          <button
            type="button"
            onClick={() => setTab("documents")}
            className={subTabCls(tab === "documents")}
          >
            文档管理
          </button>
          <button
            type="button"
            onClick={() => setTab("categories")}
            className={subTabCls(tab === "categories")}
          >
            物料分类
          </button>
        </div>
      </div>

      <div>
        {tab === "brands" ? <AdminBrands /> : null}
        {tab === "series" ? <AdminSeries /> : null}
        {tab === "models" ? <AdminModelsJumdata /> : null}
        {tab === "model-details" ? <AdminModelDetails /> : null}
        {tab === "model-resources" ? <AdminModelResources /> : null}

        {tab === "images" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xl">📷</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">图片库管理</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              管理网站使用的所有图片资源
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              管理图片库
            </button>
          </div>
        ) : null}

        {tab === "videos" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 text-xl">🎬</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">视频管理</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              管理网站使用的视频资源
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              管理视频
            </button>
          </div>
        ) : null}

        {tab === "documents" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xl">📄</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">文档管理</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              管理网站使用的文档资源
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              管理文档
            </button>
          </div>
        ) : null}

        {tab === "categories" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 text-xl">📁</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">物料分类</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              管理物料的分类和标签
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              管理分类
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
