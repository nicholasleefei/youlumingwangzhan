import { inputCls, labelCls, primaryButtonCls, secondaryButtonCls, smallButtonCls } from '@/admin/AdminApp';
import type { HeroAsset } from '@/utils/heroAssets';

export type SlotDraft = {
  display_order: number;
  asset_id: string | null;
  headline: string;
  subheadline: string;
  cta_text: string;
  cta_url: string;
  link_url: string;
  start_at: string;
  end_at: string;
  enabled: boolean;
};

export default function HeroSlotsEditor(props: {
  draftSlots: SlotDraft[];
  setDraftSlots: (next: SlotDraft[] | ((prev: SlotDraft[]) => SlotDraft[])) => void;
  availableAssets: HeroAsset[];
  busy: boolean;
  changeNote: string;
  setChangeNote: (v: string) => void;
  onPublish: () => Promise<void> | void;
}) {
  return (
    <section className="rounded-2xl border border-zinc-200 bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-base font-semibold text-zinc-900">英雄区位配置（草稿）</div>
        <button
          type="button"
          className={secondaryButtonCls()}
          disabled={props.busy}
          onClick={() => {
            props.setDraftSlots((prev) => {
              const next = prev.slice();
              next.push({
                display_order: next.length + 1,
                asset_id: null,
                headline: '',
                subheadline: '',
                cta_text: '',
                cta_url: '',
                link_url: '',
                start_at: '',
                end_at: '',
                enabled: true,
              });
              return next;
            });
          }}
        >
          新增展示位
        </button>
      </div>

      <div className="mt-4 space-y-3">
        {props.draftSlots.map((s, idx) => (
          <div key={idx} className="rounded-xl border border-zinc-200 p-4">
            <div className="flex items-center justify-between gap-2">
              <div className="text-sm font-semibold text-zinc-900">展示位 #{s.display_order}</div>
              <div className="flex items-center gap-2">
                <label className="flex items-center gap-2 text-xs text-zinc-700">
                  <input
                    type="checkbox"
                    checked={s.enabled}
                    onChange={(e) => props.setDraftSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, enabled: e.target.checked } : x)))}
                  />
                  启用
                </label>
                <button
                  type="button"
                  className={smallButtonCls('secondary')}
                  disabled={props.busy || props.draftSlots.length <= 1}
                  onClick={() => {
                    props.setDraftSlots((prev) => prev.filter((_, i) => i !== idx).map((x, i2) => ({ ...x, display_order: i2 + 1 })));
                  }}
                >
                  删除
                </button>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="grid gap-1">
                <span className={labelCls()}>素材</span>
                <select
                  className={inputCls()}
                  value={s.asset_id ?? ''}
                  onChange={(e) => props.setDraftSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, asset_id: e.target.value || null } : x)))}
                >
                  <option value="">请选择素材</option>
                  {props.availableAssets.map((a) => (
                    <option key={a.id} value={a.id}>
                      {(a.title || a.external_url || a.id).slice(0, 60)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid grid-cols-2 gap-3">
                <label className="grid gap-1">
                  <span className={labelCls()}>开始时间</span>
                  <input
                    className={inputCls()}
                    value={s.start_at}
                    onChange={(e) => props.setDraftSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, start_at: e.target.value } : x)))}
                    placeholder="可空，例如 2026-05-02T10:00:00Z"
                  />
                </label>
                <label className="grid gap-1">
                  <span className={labelCls()}>结束时间</span>
                  <input
                    className={inputCls()}
                    value={s.end_at}
                    onChange={(e) => props.setDraftSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, end_at: e.target.value } : x)))}
                    placeholder="可空"
                  />
                </label>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3">
              <label className="grid gap-1">
                <span className={labelCls()}>标题</span>
                <input
                  className={inputCls()}
                  value={s.headline}
                  onChange={(e) => props.setDraftSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, headline: e.target.value } : x)))}
                  placeholder="可选"
                />
              </label>
              <label className="grid gap-1">
                <span className={labelCls()}>副标题</span>
                <input
                  className={inputCls()}
                  value={s.subheadline}
                  onChange={(e) => props.setDraftSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, subheadline: e.target.value } : x)))}
                  placeholder="可选"
                />
              </label>
            </div>

            <div className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-3">
              <label className="grid gap-1">
                <span className={labelCls()}>按钮文案</span>
                <input
                  className={inputCls()}
                  value={s.cta_text}
                  onChange={(e) => props.setDraftSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, cta_text: e.target.value } : x)))}
                  placeholder="例如 立即咨询"
                />
              </label>
              <label className="grid gap-1 md:col-span-2">
                <span className={labelCls()}>按钮链接</span>
                <input
                  className={inputCls()}
                  value={s.cta_url}
                  onChange={(e) => props.setDraftSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, cta_url: e.target.value } : x)))}
                  placeholder="例如 /inquiry 或 https://..."
                />
              </label>
            </div>

            <label className="mt-3 grid gap-1">
              <span className={labelCls()}>点击素材跳转链接</span>
              <input
                className={inputCls()}
                value={s.link_url}
                onChange={(e) => props.setDraftSlots((prev) => prev.map((x, i) => (i === idx ? { ...x, link_url: e.target.value } : x)))}
                placeholder="可选"
              />
            </label>
          </div>
        ))}
      </div>

      <div className="mt-5 rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="text-sm font-semibold text-zinc-900">发布</div>
        <div className="mt-3 grid gap-2">
          <label className="grid gap-1">
            <span className={labelCls()}>变更说明</span>
            <input className={inputCls()} value={props.changeNote} onChange={(e) => props.setChangeNote(e.target.value)} placeholder="可选，但建议填写" />
          </label>
          <button type="button" className={primaryButtonCls()} disabled={props.busy} onClick={props.onPublish}>
            {props.busy ? '处理中...' : '发布并生效'}
          </button>
        </div>
      </div>
    </section>
  );
}

