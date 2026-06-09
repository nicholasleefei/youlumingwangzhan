import { useState } from "react";
import { pageCardCls, pageTitleCls, pageDescCls, subTabCls } from "@/admin/AdminApp";

type PermissionTab = "approval";

export default function AdminPermissionApproval() {
  const [tab, setTab] = useState<PermissionTab>("approval");

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-8">
        <h3 className={pageTitleCls()}>权限审批管理</h3>
        <p className={pageDescCls()}>
          管理用户权限和审批流程
        </p>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => setTab("approval")}
            className={subTabCls(tab === "approval")}
          >
            管理员审批
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {tab === "approval" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xl">✅</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">管理员审批</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              审批新注册的管理员用户
            </p>
          </div>
        ) : null}
      </div>
    </div>
  );
}