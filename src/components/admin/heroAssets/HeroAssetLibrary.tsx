import { primaryButtonCls, secondaryButtonCls, smallButtonCls, statusBadgeCls } from '@/admin/AdminApp';
import type { HeroAsset } from '@/utils/heroAssets';

function formatTime(ts: string) {
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export default function HeroAssetLibrary(props: {
  assets: HeroAsset[];
  busy: boolean;
  onUpload: (files: FileList | null) => Promise<void> | void;
  onOpenOfficial: () => void;
  onDelete: (id: string) => Promise<void> | void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-zinc-900">素材库</div>
        <div className="flex items-center gap-2">
          <label className={primaryButtonCls() + ' cursor-pointer'}>
            上传图片/视频
            <input
              type="file"
              className="hidden"
              multiple
              accept="image/*,video/*"
              onChange={(e) => props.onUpload(e.target.files)}
            />
          </label>
          <button type="button" className={secondaryButtonCls()} onClick={props.onOpenOfficial} disabled={props.busy}>
            选择车型官图
          </button>
        </div>
      </div>

      <div className="mt-4 max-h-[520px] overflow-auto rounded-xl border border-zinc-200">
        {props.assets.length === 0 ? <div className="px-4 py-6 text-sm text-zinc-500">暂无素材</div> : null}
        <div className="divide-y divide-zinc-200">
          {props.assets.map((a) => (
            <div key={a.id} className="flex items-center gap-4 px-4 py-3">
              <div className="h-12 w-16 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50">
                {a.media_type === 'video' ? (
                  <video src={a.external_url ?? ''} className="h-full w-full object-cover" muted playsInline />
                ) : (
                  <img src={a.external_url ?? ''} alt="" className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-semibold text-zinc-900">{a.title || a.external_url || a.id}</div>
                  <span className={statusBadgeCls(a.media_type === 'video' ? 'info' : 'default')}>{a.media_type}</span>
                  <span className={statusBadgeCls(a.source === 'official' ? 'warning' : 'default')}>{a.source === 'official' ? '官图' : '上传'}</span>
                </div>
                <div className="mt-1 text-xs text-zinc-500">{formatTime(a.created_at)}</div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  className={smallButtonCls('danger')}
                  disabled={props.busy}
                  onClick={() => {
                    if (!window.confirm('确定删除该素材吗？删除后不可恢复。')) return;
                    props.onDelete(a.id);
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
