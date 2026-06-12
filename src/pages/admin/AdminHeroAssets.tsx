import { useState } from 'react';
import { cardContentCls, iconContainerCls, secondaryButtonCls, statusBadgeCls } from '@/admin/AdminApp';
import OfficialPickerModal from '@/components/admin/heroAssets/OfficialPickerModal';
import HeroAssetLibrary from '@/components/admin/heroAssets/HeroAssetLibrary';
import HeroPreviewPanel from '@/components/admin/heroAssets/HeroPreviewPanel';
import { formatTime, useHeroAssetsAdmin } from '@/hooks/useHeroAssetsAdmin';

export default function AdminHeroAssets() {
  const [pickerOpen, setPickerOpen] = useState(false);
  const admin = useHeroAssetsAdmin();

  return (
    <div className={cardContentCls()}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className={iconContainerCls('blue') + ' h-10 w-10'}>
              <span className="text-lg">🖼️</span>
            </div>
            <div>
              <div className="text-xl font-semibold text-zinc-900">首页英雄区展示素材</div>
              <div className="mt-1 text-sm text-zinc-600">上传图片/视频或从车型官图选择</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <span className={statusBadgeCls('default')}>
              素材库：{admin.assets.length} 个
            </span>
            <span className={statusBadgeCls('info')}>
              最近更新时间：{formatTime(admin.assets[0]?.created_at ?? null)}
            </span>
          </div>
        </div>
        <button
          type="button"
          className={secondaryButtonCls()}
          disabled={admin.busy}
          onClick={async () => {
            admin.setBusy(true);
            admin.setMessage(null);
            admin.setError(null);
            try {
              await admin.refreshAll();
              admin.setMessage('已刷新');
            } catch (e: unknown) {
              admin.setError(e instanceof Error ? e.message : '刷新失败');
            } finally {
              admin.setBusy(false);
            }
          }}
        >
          刷新
        </button>
      </div>

      {admin.error ? <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{admin.error}</div> : null}
      {admin.message ? <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{admin.message}</div> : null}

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <HeroAssetLibrary
          assets={admin.assets}
          busy={admin.busy}
          onUpload={admin.uploadFiles}
          onOpenOfficial={() => setPickerOpen(true)}
          onDelete={admin.deleteAsset}
          onToggleDisabled={admin.toggleDisabled}
        />

        <HeroPreviewPanel assets={admin.assets.filter(a => !a.disabled)} />
      </div>

      <OfficialPickerModal open={pickerOpen} onClose={() => setPickerOpen(false)} onPick={admin.addOfficialAssets} />
    </div>
  );
}
