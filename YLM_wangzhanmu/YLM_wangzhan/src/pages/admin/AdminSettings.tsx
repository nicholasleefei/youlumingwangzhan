import { useState } from "react";
import AdminDatabaseMigration from "./AdminDatabaseMigration";
import { pageCardCls, pageTitleCls, pageDescCls, subTabCls, primaryButtonCls, secondaryButtonCls, inputCls, labelCls } from "@/admin/AdminApp";

type SettingsTab = "basic" | "email" | "api" | "security" | "backup" | "info" | "database-migration" | "jumdata";

export default function AdminSettings() {
  const [tab, setTab] = useState<SettingsTab>("basic");

  return (
    <div className={pageCardCls() + " p-8"}>
      <div className="mb-8">
        <h3 className={pageTitleCls()}>系统配置</h3>
        <p className={pageDescCls()}>
          系统配置和管理设置
        </p>
      </div>

      <div className="mb-8">
        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-3">
          <button
            type="button"
            onClick={() => setTab("basic")}
            className={subTabCls(tab === "basic")}
          >
            基础设置
          </button>
          <button
            type="button"
            onClick={() => setTab("email")}
            className={subTabCls(tab === "email")}
          >
            邮件配置
          </button>
          <button
            type="button"
            onClick={() => setTab("api")}
            className={subTabCls(tab === "api")}
          >
            API 设置
          </button>
          <button
            type="button"
            onClick={() => setTab("security")}
            className={subTabCls(tab === "security")}
          >
            安全设置
          </button>
          <button
            type="button"
            onClick={() => setTab("backup")}
            className={subTabCls(tab === "backup")}
          >
            数据备份
          </button>
          <button
            type="button"
            onClick={() => setTab("info")}
            className={subTabCls(tab === "info")}
          >
            系统信息
          </button>
          <button
            type="button"
            onClick={() => setTab("database-migration")}
            className={subTabCls(tab === "database-migration")}
          >
            数据库更新
          </button>
          <button
            type="button"
            onClick={() => setTab("jumdata")}
            className={subTabCls(tab === "jumdata")}
          >
            聚美智数配置
          </button>
        </div>
      </div>

      <div className="space-y-8">
        {tab === "basic" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center">
                <span className="text-blue-600 text-xl">⚙️</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">基础设置</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              系统基础信息和常规配置
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              配置基础信息
            </button>
          </div>
        ) : null}

        {tab === "email" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center">
                <span className="text-green-600 text-xl">📧</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">邮件配置</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              邮件发送和通知配置
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              配置邮件
            </button>
          </div>
        ) : null}

        {tab === "api" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center">
                <span className="text-purple-600 text-xl">🔌</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">API 设置</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              第三方 API 接口配置
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              配置 API
            </button>
          </div>
        ) : null}

        {tab === "security" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-red-100 flex items-center justify-center">
                <span className="text-red-600 text-xl">🔒</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">安全设置</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              系统安全和权限设置
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              配置安全
            </button>
          </div>
        ) : null}

        {tab === "backup" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <span className="text-amber-600 text-xl">💾</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">数据备份</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              数据库备份和恢复
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              管理备份
            </button>
          </div>
        ) : null}

        {tab === "info" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                <span className="text-indigo-600 text-xl">ℹ️</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">系统信息</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              系统状态和版本信息
            </p>
            <button
              type="button"
              className={primaryButtonCls()}
            >
              查看信息
            </button>
          </div>
        ) : null}

        {tab === "database-migration" ? <AdminDatabaseMigration /> : null}

        {tab === "jumdata" ? (
          <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-zinc-50 to-white p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-cyan-100 flex items-center justify-center">
                <span className="text-cyan-600 text-xl">📊</span>
              </div>
              <h4 className="text-xl font-semibold text-zinc-900">聚美智数配置</h4>
            </div>
            <p className="text-base text-zinc-600 mb-6 leading-relaxed">
              统一管理聚美智数 API 的配置信息
            </p>
            <div className="space-y-6 max-w-2xl">
              <div>
                <label className={labelCls()}>聚美智数 App ID</label>
                <input
                  type="text"
                  id="jumdataAppId"
                  placeholder="请输入聚美智数 App ID"
                  className={inputCls()}
                  defaultValue={localStorage.getItem('jumdata_app_id') || ''}
                  onChange={(e) => localStorage.setItem('jumdata_app_id', e.target.value)}
                />
              </div>
              <div>
                <label className={labelCls()}>聚美智数 App Secret</label>
                <input
                  type="password"
                  id="jumdataAppSecret"
                  placeholder="请输入聚美智数 App Secret"
                  className={inputCls()}
                  defaultValue={localStorage.getItem('jumdata_app_secret') || ''}
                  onChange={(e) => localStorage.setItem('jumdata_app_secret', e.target.value)}
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className={primaryButtonCls()}
                  onClick={() => {
                    // 验证并保存配置
                    const appId = (document.getElementById('jumdataAppId') as HTMLInputElement).value;
                    const appSecret = (document.getElementById('jumdataAppSecret') as HTMLInputElement).value;

                    if (!appId || !appSecret) {
                      alert('请填写完整的 App ID 和 App Secret');
                      return;
                    }

                    localStorage.setItem('jumdata_app_id', appId);
                    localStorage.setItem('jumdata_app_secret', appSecret);
                    alert('聚美智数配置已保存');
                  }}
                >
                  保存配置
                </button>
                <button
                  type="button"
                  className={secondaryButtonCls()}
                  onClick={() => {
                    // 清除配置
                    localStorage.removeItem('jumdata_app_id');
                    localStorage.removeItem('jumdata_app_secret');
                    (document.getElementById('jumdataAppId') as HTMLInputElement).value = '';
                    (document.getElementById('jumdataAppSecret') as HTMLInputElement).value = '';
                  }}
                >
                  清除配置
                </button>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
