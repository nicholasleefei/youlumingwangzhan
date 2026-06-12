import { statusBadgeCls } from '@/admin/AdminApp';
import type { HeroAsset } from '@/utils/heroAssets';

export default function HeroPreviewPanel(props: { assets: HeroAsset[] }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-zinc-900">可用素材预览</div>
        <span className={statusBadgeCls(props.assets.length > 0 ? 'success' : 'warning')}>{props.assets.length} 个</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {props.assets.length === 0 ? <div className="text-sm text-zinc-500">暂无可用素材</div> : null}
        {props.assets.map((a) => (
          <div key={a.id} className="overflow-hidden rounded-xl border border-zinc-200">
            <div className="h-40 bg-zinc-50">
              {a.media_type === 'video' ? (
                <video src={a.external_url ?? ''} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <img src={a.external_url ?? ''} alt={a.alt_text ?? ''} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
              )}
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold text-zinc-900 truncate">{a.title || a.external_url || a.id}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
