import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import { pickActiveHeroPublicSlots, type HeroAsset, type HeroPublicSlot } from '@/utils/heroAssets';

export type RuntimeState = { current_publish_version_id: string | null; updated_at: string };
export type PublishVersion = { id: string; change_note: string | null; published_at: string; rollback_from_version_id: string | null };

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

function toIsoOrNull(v: string) {
  const t = v.trim();
  if (!t) return null;
  const d = new Date(t);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

export function formatTime(ts: string | null) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export function createDefaultDraftSlots(n = 3): SlotDraft[] {
  return Array.from({ length: n }).map((_, i) => ({
    display_order: i + 1,
    asset_id: null,
    headline: '',
    subheadline: '',
    cta_text: '',
    cta_url: '',
    link_url: '',
    start_at: '',
    end_at: '',
    enabled: true,
  }));
}

export function useHeroAssetsAdmin() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [assets, setAssets] = useState<HeroAsset[]>([]);
  const [runtime, setRuntime] = useState<RuntimeState | null>(null);
  const [publicSlots, setPublicSlots] = useState<HeroPublicSlot[]>([]);
  const [history, setHistory] = useState<PublishVersion[]>([]);

  const [draftSlots, setDraftSlots] = useState<SlotDraft[]>(() => createDefaultDraftSlots(3));
  const [changeNote, setChangeNote] = useState('');

  const activePublic = useMemo(() => pickActiveHeroPublicSlots(publicSlots), [publicSlots]);
  const availableAssets = useMemo(() => assets.filter((a) => !a.disabled), [assets]);

  async function refreshAll() {
    setError(null);
    const [assetsRes, runtimeRes, slotsRes, historyRes] = await Promise.all([
      supabase.from('hero_assets').select('*').order('created_at', { ascending: false }),
      supabase.from('hero_runtime_state').select('current_publish_version_id,updated_at').eq('id', 1).maybeSingle(),
      supabase.from('hero_public_slots_view').select('*').order('display_order', { ascending: true }),
      supabase.from('hero_publish_versions').select('id,change_note,published_at,rollback_from_version_id').order('published_at', { ascending: false }).limit(20),
    ]);

    if (assetsRes.error) throw assetsRes.error;
    if (runtimeRes.error) throw runtimeRes.error;
    if (slotsRes.error) throw slotsRes.error;
    if (historyRes.error) throw historyRes.error;

    setAssets((assetsRes.data as HeroAsset[]) ?? []);
    setRuntime((runtimeRes.data as RuntimeState) ?? null);
    setPublicSlots((slotsRes.data as HeroPublicSlot[]) ?? []);
    setHistory((historyRes.data as PublishVersion[]) ?? []);
  }

  useEffect(() => {
    setBusy(true);
    refreshAll()
      .catch((e: unknown) => setError(e instanceof Error ? e.message : '加载失败'))
      .finally(() => setBusy(false));
  }, []);

  async function getCurrentUserId() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    const uid = data.user?.id;
    if (!uid) throw new Error('未登录');
    return uid;
  }

  async function uploadFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const uid = await getCurrentUserId();
      const now = new Date();
      const folder = `hero/${now.getUTCFullYear()}/${String(now.getUTCMonth() + 1).padStart(2, '0')}`;

      for (const file of Array.from(files)) {
        const mediaType = file.type.startsWith('video/') ? 'video' : 'image';
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
        const path = `${folder}/${crypto.randomUUID()}-${safeName}`;
        const upload = await supabase.storage.from('hero_assets').upload(path, file, {
          cacheControl: '3600',
          contentType: file.type || undefined,
          upsert: false,
        });
        if (upload.error) throw upload.error;

        const pub = supabase.storage.from('hero_assets').getPublicUrl(path);
        const externalUrl = pub.data.publicUrl;

        const insert = await supabase.from('hero_assets').insert({
          media_type: mediaType,
          source: 'upload',
          external_url: externalUrl,
          storage_bucket: 'hero_assets',
          storage_path: path,
          title: file.name,
          alt_text: null,
          meta: { mime_type: file.type, size: file.size },
          disabled: false,
          created_by: uid,
        });
        if (insert.error) throw insert.error;
      }

      setMessage('上传成功');
      await refreshAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '上传失败');
    } finally {
      setBusy(false);
    }
  }

  async function addOfficialAssets(items: { url: string; meta: Record<string, unknown> }[]) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const uid = await getCurrentUserId();
      const rows = items.map((it) => ({
        media_type: 'image',
        source: 'official',
        external_url: it.url,
        storage_bucket: null,
        storage_path: null,
        title: null,
        alt_text: null,
        meta: it.meta,
        disabled: false,
        created_by: uid,
      }));
      const res = await supabase.from('hero_assets').insert(rows);
      if (res.error) throw res.error;
      setMessage('已加入素材库');
      await refreshAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '加入失败');
    } finally {
      setBusy(false);
    }
  }

  async function toggleAssetDisabled(id: string, disabled: boolean) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await supabase.from('hero_assets').update({ disabled }).eq('id', id);
      if (res.error) throw res.error;
      setMessage(disabled ? '已下线' : '已启用');
      await refreshAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '操作失败');
    } finally {
      setBusy(false);
    }
  }

  async function deleteAsset(id: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const uid = await getCurrentUserId();
      const asset = assets.find((a) => a.id === id) ?? null;

      let storageDeleted = null as boolean | null;
      if (asset?.storage_bucket && asset.storage_path) {
        const rm = await supabase.storage.from(asset.storage_bucket).remove([asset.storage_path]);
        storageDeleted = rm.error ? false : true;
      }

      const del = await supabase.from('hero_assets').delete().eq('id', id);
      if (del.error) throw del.error;

      await supabase.from('hero_audit_logs').insert({
        actor_id: uid,
        action: 'delete_asset',
        target_type: 'hero_assets',
        target_id: id,
        details: { source: asset?.source ?? null, media_type: asset?.media_type ?? null, storage_deleted: storageDeleted },
      });

      setDraftSlots((prev) => prev.map((s) => (s.asset_id === id ? { ...s, asset_id: null } : s)));
      setMessage('已删除');
      await refreshAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '删除失败');
    } finally {
      setBusy(false);
    }
  }

  async function publish() {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const uid = await getCurrentUserId();
      const enabledSlots = draftSlots.filter((s) => s.enabled && s.asset_id);
      if (enabledSlots.length === 0) throw new Error('至少需要启用 1 个展示位并选择素材');

      const badRange = draftSlots.some((s) => {
        const start = toIsoOrNull(s.start_at);
        const end = toIsoOrNull(s.end_at);
        if (start && end) return new Date(end) <= new Date(start);
        return false;
      });
      if (badRange) throw new Error('排期结束时间必须晚于开始时间');

      const v = await supabase
        .from('hero_publish_versions')
        .insert({ change_note: changeNote.trim() || null, published_by: uid, rollback_from_version_id: null })
        .select('id')
        .single();
      if (v.error) throw v.error;

      const versionId = v.data.id as string;
      const rows = enabledSlots.map((s) => ({
        publish_version_id: versionId,
        display_order: s.display_order,
        asset_id: s.asset_id,
        headline: s.headline.trim() || null,
        subheadline: s.subheadline.trim() || null,
        cta_text: s.cta_text.trim() || null,
        cta_url: s.cta_url.trim() || null,
        link_url: s.link_url.trim() || null,
        start_at: toIsoOrNull(s.start_at),
        end_at: toIsoOrNull(s.end_at),
        enabled: true,
      }));

      const ins = await supabase.from('hero_published_slots').insert(rows);
      if (ins.error) throw ins.error;

      const upd = await supabase
        .from('hero_runtime_state')
        .update({ current_publish_version_id: versionId, updated_at: new Date().toISOString() })
        .eq('id', 1);
      if (upd.error) throw upd.error;

      await supabase.from('hero_audit_logs').insert({
        actor_id: uid,
        action: 'publish',
        target_type: 'hero_publish_versions',
        target_id: versionId,
        details: { slots: rows.length },
      });

      setChangeNote('');
      setMessage('已发布并生效');
      await refreshAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '发布失败');
    } finally {
      setBusy(false);
    }
  }

  async function rollbackTo(versionId: string) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const uid = await getCurrentUserId();
      const slots = await supabase
        .from('hero_published_slots')
        .select('*')
        .eq('publish_version_id', versionId)
        .order('display_order', { ascending: true });
      if (slots.error) throw slots.error;
      const src = (slots.data ?? []) as any[];
      if (src.length === 0) throw new Error('该版本没有可回滚的展示位');

      const v = await supabase
        .from('hero_publish_versions')
        .insert({ change_note: `回滚到版本 ${versionId}`, published_by: uid, rollback_from_version_id: versionId })
        .select('id')
        .single();
      if (v.error) throw v.error;

      const newVersionId = v.data.id as string;
      const rows = src
        .filter((s) => s.enabled)
        .map((s, idx) => ({
          publish_version_id: newVersionId,
          display_order: idx + 1,
          asset_id: s.asset_id,
          headline: s.headline,
          subheadline: s.subheadline,
          cta_text: s.cta_text,
          cta_url: s.cta_url,
          link_url: s.link_url,
          start_at: s.start_at,
          end_at: s.end_at,
          enabled: true,
        }));

      const ins = await supabase.from('hero_published_slots').insert(rows);
      if (ins.error) throw ins.error;

      const upd = await supabase
        .from('hero_runtime_state')
        .update({ current_publish_version_id: newVersionId, updated_at: new Date().toISOString() })
        .eq('id', 1);
      if (upd.error) throw upd.error;

      await supabase.from('hero_audit_logs').insert({
        actor_id: uid,
        action: 'rollback',
        target_type: 'hero_publish_versions',
        target_id: newVersionId,
        details: { rollback_from: versionId, slots: rows.length },
      });

      setMessage('已回滚并生效');
      await refreshAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '回滚失败');
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    message,
    assets,
    runtime,
    activePublic,
    history,
    availableAssets,
    draftSlots,
    setDraftSlots,
    changeNote,
    setChangeNote,
    refreshAll,
    uploadFiles,
    addOfficialAssets,
    deleteAsset,
    publish,
    rollbackTo,
    setBusy,
    setError,
    setMessage,
  };
}
