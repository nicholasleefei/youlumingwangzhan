import { statusBadgeCls } from '@/admin/AdminApp';
import type { HeroPublicSlot } from '@/utils/heroAssets';

export default function HeroPreviewPanel(props: { slots: HeroPublicSlot[] }) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-zinc-900">当前线上预览（取已发布版本）</div>
        <span className={statusBadgeCls(props.slots.length > 0 ? 'success' : 'warning')}>生效 {props.slots.length}</span>
      </div>
      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
        {props.slots.length === 0 ? <div className="text-sm text-zinc-500">暂无线上素材</div> : null}
        {props.slots.map((s) => (
          <div key={s.slot_id} className="overflow-hidden rounded-xl border border-zinc-200">
            <div className="h-40 bg-zinc-50">
              {s.media_type === 'video' ? (
                <video src={s.external_url ?? ''} className="h-full w-full object-cover" muted playsInline />
              ) : (
                <img src={s.external_url ?? ''} alt={s.alt_text ?? ''} className="h-full w-full object-cover" loading="lazy" referrerPolicy="no-referrer" />
              )}
            </div>
            <div className="p-3">
              <div className="text-sm font-semibold text-zinc-900">#{s.display_order} {s.headline || s.title || '未命名'}</div>
              {s.subheadline ? <div className="mt-1 text-xs text-zinc-600 line-clamp-2">{s.subheadline}</div> : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

