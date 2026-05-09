import { smallButtonCls, statusBadgeCls } from '@/admin/AdminApp';
import { formatTime, type PublishVersion } from '@/hooks/useHeroAssetsAdmin';

export default function HeroPublishHistory(props: {
  history: PublishVersion[];
  currentVersionId: string | null;
  busy: boolean;
  onRollback: (id: string) => Promise<void> | void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between">
        <div className="text-base font-semibold text-zinc-900">发布历史与回滚</div>
        <div className="text-xs text-zinc-500">最近 20 条</div>
      </div>
      <div className="mt-4 overflow-hidden rounded-xl border border-zinc-200">
        {props.history.length === 0 ? <div className="px-4 py-6 text-sm text-zinc-500">暂无历史</div> : null}
        <div className="divide-y divide-zinc-200">
          {props.history.map((h) => (
            <div key={h.id} className="flex items-center justify-between gap-3 px-4 py-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="truncate text-sm font-semibold text-zinc-900">{h.id.slice(0, 8)}</div>
                  {h.rollback_from_version_id ? <span className={statusBadgeCls('warning')}>回滚</span> : <span className={statusBadgeCls('default')}>发布</span>}
                  {props.currentVersionId === h.id ? <span className={statusBadgeCls('success')}>当前线上</span> : null}
                </div>
                <div className="mt-1 text-xs text-zinc-500">{formatTime(h.published_at)}{h.change_note ? ` · ${h.change_note}` : ''}</div>
              </div>
              <button
                type="button"
                className={smallButtonCls('warning')}
                disabled={props.busy || props.currentVersionId === h.id}
                onClick={() => props.onRollback(h.id)}
              >
                回滚到此版本
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

