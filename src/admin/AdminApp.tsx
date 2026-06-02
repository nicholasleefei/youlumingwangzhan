import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/utils/supabaseClient";
import AdminLogin from "@/pages/admin/AdminLogin";
import AdminSiteDisplay from "@/pages/admin/AdminSiteDisplay";
import AdminMaterialManagement from "@/pages/admin/AdminMaterialManagement";
import AdminCrm from "@/pages/admin/AdminCrm";
import AdminPermissionApproval from "@/pages/admin/AdminPermissionApproval";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminKnowledgeBase from "@/pages/admin/AdminKnowledgeBase";
import AdminDbTranslation from "@/pages/admin/AdminDbTranslation";

type Tab = "content-publish" | "material-asset" | "customer-inquiries" | "permission-approval" | "system-config" | "knowledge-base" | "translation";

type AdminProfile = {
  id: string;
  email: string;
  is_super_admin: boolean;
  is_approved: boolean;
};

// 主标签样式
function tabCls(active: boolean) {
  return (
    "relative px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-lg " +
    (active
      ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/25"
      : "text-zinc-600 hover:bg-zinc-100 hover:text-zinc-900")
  );
}

// 页面卡片样式
export function pageCardCls() {
  return "bg-white rounded-2xl border border-zinc-200/60 shadow-sm shadow-zinc-200/50";
}

// 页面标题样式
export function pageTitleCls() {
  return "text-2xl font-bold text-zinc-900 tracking-tight";
}

// 页面描述样式
export function pageDescCls() {
  return "mt-2 text-base text-zinc-500 leading-relaxed";
}

// 子标签样式
export function subTabCls(active: boolean) {
  return (
    "px-4 py-2.5 text-sm font-medium transition-all duration-200 rounded-xl " +
    (active
      ? "bg-blue-50 text-blue-700 border-b-2 border-blue-600 font-semibold"
      : "text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50")
  );
}

// 按钮样式
export function primaryButtonCls() {
  return "inline-flex items-center justify-center rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-700 hover:to-blue-800 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed";
}

export function secondaryButtonCls() {
  return "inline-flex items-center justify-center rounded-xl bg-zinc-100 px-5 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 transition-all duration-200";
}

// 输入框样式
export function inputCls() {
  return "block w-full rounded-xl border border-zinc-300 px-4 py-2.5 text-base text-zinc-900 placeholder:text-zinc-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all duration-200 bg-white";
}

// 标签样式
export function labelCls() {
  return "block text-sm font-semibold text-zinc-700 mb-1.5";
}

// 表格容器样式
export function tableContainerCls() {
  return "overflow-hidden rounded-2xl border border-zinc-200/60 shadow-sm";
}

// 表格表头样式
export function tableHeaderCls() {
  return "grid gap-2 bg-gradient-to-r from-zinc-50 to-zinc-100 px-4 py-3 text-xs font-semibold text-zinc-600";
}

// 表格行样式
export function tableRowCls(hoverable = true) {
  return (
    "grid w-full gap-2 border-t border-zinc-200/60 px-4 py-3 text-left text-sm transition-colors duration-200 " +
    (hoverable ? "hover:bg-zinc-50/80" : "")
  );
}

// 状态标签样式
export function statusBadgeCls(type: 'success' | 'warning' | 'info' | 'default' = 'default') {
  const styles = {
    success: "bg-green-100 text-green-800 border border-green-200",
    warning: "bg-amber-100 text-amber-800 border border-amber-200",
    info: "bg-blue-100 text-blue-800 border border-blue-200",
    default: "bg-zinc-100 text-zinc-700 border border-zinc-200"
  };
  return "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold " + styles[type];
}

// 小型按钮样式
export function smallButtonCls(variant: 'primary' | 'success' | 'warning' | 'danger' | 'secondary' = 'primary') {
  const variants = {
    primary: "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:from-blue-700 hover:to-blue-800 shadow-sm shadow-blue-500/20",
    success: "bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 shadow-sm shadow-green-500/20",
    warning: "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700 shadow-sm shadow-amber-500/20",
    danger: "bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 shadow-sm shadow-red-500/20",
    secondary: "bg-zinc-200 text-zinc-800 hover:bg-zinc-300"
  };
  return "inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-xs font-semibold transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed " + variants[variant];
}

// 卡片内容样式
export function cardContentCls() {
  return "rounded-2xl border border-zinc-200/60 bg-gradient-to-br from-white to-zinc-50 p-6 shadow-sm";
}

// 图标容器样式
export function iconContainerCls(color: 'blue' | 'green' | 'purple' | 'amber' | 'red' | 'indigo' | 'cyan' = 'blue') {
  const colors = {
    blue: "bg-blue-100 text-blue-600 border border-blue-200",
    green: "bg-green-100 text-green-600 border border-green-200",
    purple: "bg-purple-100 text-purple-600 border border-purple-200",
    amber: "bg-amber-100 text-amber-600 border border-amber-200",
    red: "bg-red-100 text-red-600 border border-red-200",
    indigo: "bg-indigo-100 text-indigo-600 border border-indigo-200",
    cyan: "bg-cyan-100 text-cyan-600 border border-cyan-200"
  };
  return "flex items-center justify-center rounded-xl " + colors[color];
}

export default function AdminApp() {
  const { t, i18n } = useTranslation();
  const [tab, setTab] = useState<Tab>("content-publish");
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<AdminProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_evt, next) => setSession(next));
    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (i18n.language !== "zh-CN") {
      i18n.changeLanguage("zh-CN");
    }
    document.documentElement.lang = "zh-CN";
    document.documentElement.dir = "ltr";
  }, [i18n]);

  useEffect(() => {
    async function loadProfile() {
      if (!session?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("admin_users")
        .select("id, email, is_super_admin, is_approved")
        .eq("id", session.user.id)
        .maybeSingle();

      if (!error && data) {
        setProfile(data);
      } else if (session.user.email === "1398234769@qq.com") {
        setProfile({
          id: session.user.id,
          email: "1398234769@qq.com",
          is_super_admin: true,
          is_approved: true,
        });
      } else {
        setProfile(null);
      }
      setLoading(false);
    }
    if (session) loadProfile();
  }, [session]);

  const authed = useMemo(() => Boolean(session), [session]);

  if (!authed) {
    return (
      <AdminLogin
        onSignIn={async (email, password) => {
          const { error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900">
        <div className="mx-auto max-w-7xl px-6 py-20">
          <div className="flex items-center gap-3 text-zinc-500">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-blue-600"></div>
            <span className="text-base">加载权限中...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!profile || !profile.is_approved) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-zinc-100 text-zinc-900">
        <div className="mx-auto max-w-md px-6 py-20">
          <div className={pageCardCls() + " p-8"}>
            <div className="flex items-center gap-3 mb-5">
              <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 text-lg">⏳</span>
              </div>
              <div className="text-xl font-bold text-zinc-900">等待审批</div>
            </div>
            <div className="text-base text-zinc-600 leading-relaxed">
              您的账号已创建，但还需要超级管理员审批后才能访问管理后台。请等待审批通过。
            </div>
            <div className="mt-8">
              <button
                type="button"
                onClick={async () => {
                  await supabase.auth.signOut();
                }}
                className="inline-flex h-11 w-full items-center justify-center rounded-xl bg-zinc-100 px-5 text-sm font-semibold text-zinc-900 hover:bg-zinc-200 transition-all duration-200"
              >
                退出登录
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 via-white to-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-20 border-b border-zinc-200/60 bg-white/80 backdrop-blur-xl shadow-sm shadow-zinc-200/30">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-6 px-6 py-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-start leading-tight">
              <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-blue-700 bg-clip-text text-transparent">YOULUMI</span>
              <span className="text-sm text-zinc-500 font-medium">呦鹿鸣</span>
            </div>
            <div className="rounded-2xl bg-gradient-to-r from-blue-50 to-indigo-50 px-3 py-1.5 text-xs font-semibold text-blue-700 border border-blue-100">
              管理后台
            </div>
          </div>

          <div className="flex items-center gap-1.5 rounded-2xl bg-zinc-50 p-1.5 overflow-x-auto border border-zinc-200/60">
            <button type="button" className={tabCls(tab === "content-publish")} onClick={() => setTab("content-publish")}>
              内容发布管理
            </button>
            <button type="button" className={tabCls(tab === "material-asset")} onClick={() => setTab("material-asset")}>
              物料资产管理
            </button>
            <button type="button" className={tabCls(tab === "customer-inquiries")} onClick={() => setTab("customer-inquiries")}>
              客户管理
            </button>
            <button type="button" className={tabCls(tab === "permission-approval")} onClick={() => setTab("permission-approval")}>
              权限审批管理
            </button>
            <button type="button" className={tabCls(tab === "system-config")} onClick={() => setTab("system-config")}>
              系统配置
            </button>
            <button type="button" className={tabCls(tab === "knowledge-base")} onClick={() => setTab("knowledge-base")}>
              知识库管理
            </button>
            <button type="button" className={tabCls(tab === "translation")} onClick={() => setTab("translation")}>
              翻译管理
            </button>
          </div>

          <div className="flex items-center gap-3">
            <a
              className="rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50 hover:border-zinc-300 transition-all duration-200"
              href="/"
            >
              {t("nav.home")}
            </a>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
              }}
              className="rounded-xl bg-zinc-100 px-4 py-2.5 text-sm font-semibold text-zinc-700 hover:bg-zinc-200 transition-all duration-200"
            >
              {t("action.signOut")}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <div className="mt-2">
          {tab === "content-publish" ? <AdminSiteDisplay /> : null}
          {tab === "material-asset" ? <AdminMaterialManagement /> : null}
          {tab === "customer-inquiries" ? <AdminCrm /> : null}
          {tab === "permission-approval" ? <AdminPermissionApproval /> : null}
          {tab === "system-config" ? <AdminSettings /> : null}
          {tab === "knowledge-base" ? <AdminKnowledgeBase /> : null}
          {tab === "translation" ? <AdminDbTranslation /> : null}
        </div>
      </main>
    </div>
  );
}
