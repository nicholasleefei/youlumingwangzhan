import { useState } from "react";
import AdminInquiries from "./AdminInquiries";
import { pageCardCls, pageTitleCls, pageDescCls, subTabCls, primaryButtonCls } from "@/admin/AdminApp";

type UserInquiryTab = "inquiries" | "users" | "feedback" | "messages";

export default function AdminUserInquiries() {
  const [tab, setTab] = useState<UserInquiryTab>("inquiries");

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-8">
        <h3 className={pageTitleCls()}>客户报价管理</h3>
        <p className={pageDescCls()}>
          管理网站用户、报价请求和销售数据
        </p>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => setTab("inquiries")}
            className={subTabCls(tab === "inquiries")}
          >
            报价管理
          </button>
          <button
            type="button"
            onClick={() => setTab("users")}
            className={subTabCls(tab === "users")}
          >
            用户列表
          </button>
          <button
            type="button"
            onClick={() => setTab("feedback")}
            className={subTabCls(tab === "feedback")}
          >
            用户反馈
          </button>
          <button
            type="button"
            onClick={() => setTab("messages")}
            className={subTabCls(tab === "messages")}
          >
            消息管理
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {tab === "inquiries" ? <AdminInquiries /> : null}

        {tab === "users" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xl">👥</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">用户列表</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              查看和管理网站注册用户
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              查看用户
            </button>
          </div>
        ) : null}

        {tab === "feedback" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 text-xl">💬</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">用户反馈</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              查看用户提交的反馈和建议
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              查看反馈
            </button>
          </div>
        ) : null}

        {tab === "messages" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xl">✉️</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">消息管理</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              管理站内消息和通知
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              管理消息
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}
