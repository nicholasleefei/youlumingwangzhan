import { useState } from "react";
import { pageCardCls, pageTitleCls, pageDescCls, subTabCls, primaryButtonCls, secondaryButtonCls, inputCls, labelCls } from "@/admin/AdminApp";

type SettingsTab = "jumdata";

export default function AdminSettings() {
  const [tab, setTab] = useState<SettingsTab>("jumdata");

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
            onClick={() => setTab("jumdata")}
            className={subTabCls(tab === "jumdata")}
          >
            聚美智数配置
          </button>
        </div>
      </div>

      <div className="space-y-8">
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
