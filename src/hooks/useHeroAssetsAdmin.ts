import { useEffect, useState } from 'react';
import { supabase } from '@/utils/supabaseClient';
import type { HeroAsset } from '@/utils/heroAssets';

export function formatTime(ts: string | null) {
  if (!ts) return '—';
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return ts;
  return d.toLocaleString();
}

export function useHeroAssetsAdmin() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const [assets, setAssets] = useState<HeroAsset[]>([]);

  async function refreshAll() {
    setError(null);
    const { data, error: err } = await supabase
      .from('hero_assets')
      .select('*')
      .order('created_at', { ascending: false });

    if (err) throw err;
    setAssets((data as HeroAsset[]) ?? []);
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

  async function toggleDisabled(id: string, disabled: boolean) {
    setBusy(true);
    setError(null);
    setMessage(null);
    try {
      const res = await supabase.from('hero_assets').update({ disabled }).eq('id', id);
      if (res.error) throw res.error;
      setMessage(disabled ? '已下线' : '已上架');
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
      const asset = assets.find((a) => a.id === id) ?? null;

      if (asset?.storage_bucket && asset.storage_path) {
        await supabase.storage.from(asset.storage_bucket).remove([asset.storage_path]);
      }

      const del = await supabase.from('hero_assets').delete().eq('id', id);
      if (del.error) throw del.error;

      setMessage('已删除');
      await refreshAll();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '删除失败');
    } finally {
      setBusy(false);
    }
  }

  return {
    busy,
    error,
    message,
    assets,
    refreshAll,
    uploadFiles,
    addOfficialAssets,
    deleteAsset,
    toggleDisabled,
    setBusy,
    setError,
    setMessage,
  };
}
