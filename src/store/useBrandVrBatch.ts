import { create } from "zustand";
import { supabase } from "@/utils/supabaseClient";
import { downloadExteriorVRForSeries, downloadInteriorVRForSeries, type VRDownloadProgress } from "@/utils/vrDownloader";
import { asyncPool } from "@/utils/asyncPool";
import { normalizeSeriesVrGroups } from "@/utils/seriesVrNormalize";

export type BrandVrBatchSeries = {
  id: string | null;
  jm_id: number;
  name: string;
  activity_status?: number;
};

export type BrandVrBatchDraft = {
  series_jm_id: number;
  series_id: string | null;
  series_name: string;
  brand_jm_id: number;
  brand_name: string;
  exterior_vr: any[];
  interior_vr: any[];
  errors: string[];
};

type BatchProgress = {
  current: number;
  total: number;
  message: string;
};

type State = {
  running: boolean;
  saving: boolean;
  brandJmId: number | null;
  brandName: string | null;
  progress: BatchProgress | null;
  logs: string[];
  drafts: BrandVrBatchDraft[];
  cancelled: boolean;
  startDownload: (params: {
    brandJmId: number;
    brandName: string;
    seriesPool: BrandVrBatchSeries[];
    onlyNormal: boolean;
  }) => Promise<void>;
  cancel: () => void;
  clearDrafts: () => void;
  saveAll: () => Promise<void>;
};

function nowStamp() {
  return new Date().toLocaleTimeString();
}

function extFromDataUrl(dataUrl: string): string {
  const m = String(dataUrl || "").match(/^data:image\/([a-z0-9.+-]+);/i);
  const t = (m?.[1] || "").toLowerCase();
  if (t === "jpeg") return "jpg";
  if (t === "png") return "png";
  if (t === "webp") return "webp";
  return "jpg";
}

export const useBrandVrBatch = create<State>((set, get) => ({
  running: false,
  saving: false,
  brandJmId: null,
  brandName: null,
  progress: null,
  logs: [],
  drafts: [],
  cancelled: false,

  cancel: () => {
    set({ cancelled: true });
    set((s) => ({ logs: [...s.logs, `[${nowStamp()}] 已请求取消批量任务`] }));
  },

  clearDrafts: () => set({ drafts: [] }),

  startDownload: async ({ brandJmId, brandName, seriesPool, onlyNormal }) => {
    const state = get();
    if (state.running || state.saving) return;

    const pool = seriesPool
      .filter((s) => (!onlyNormal ? true : (s.activity_status ?? 0) === 0))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""));

    if (pool.length === 0) {
      set((s) => ({ logs: [...s.logs, `[${nowStamp()}] 当前品牌下没有可用车系`] }));
      return;
    }

    set({
      running: true,
      cancelled: false,
      brandJmId,
      brandName,
      progress: { current: 0, total: pool.length, message: "准备开始批量下载..." },
      logs: [],
      drafts: [],
    });
    set((s) => ({ logs: [...s.logs, `[${nowStamp()}] 开始批量下载：${brandName}（共 ${pool.length} 个车系）`] }));

    const drafts: BrandVrBatchDraft[] = [];

    try {
      for (let i = 0; i < pool.length; i++) {
        if (get().cancelled) {
          set((s) => ({ logs: [...s.logs, `[${nowStamp()}] 已取消批量下载`] }));
          break;
        }

        const series = pool[i];
        set({ progress: { current: i + 1, total: pool.length, message: `下载 ${series.name}（${i + 1}/${pool.length}）` } });
        set((s) => ({ logs: [...s.logs, `[${nowStamp()}] 开始：${series.name}（jm_id: ${series.jm_id}）`] }));

        const errors: string[] = [];

        try {
          const ex = await downloadExteriorVRForSeries(series.jm_id, brandName, series.name, (p: VRDownloadProgress) => {
            set({ progress: { current: i + 1, total: pool.length, message: `${series.name} - ${p.message}` } });
          });
          if (ex.errors.length > 0) errors.push(...ex.errors.map((x) => `[外观VR] ${x}`));

          const it = await downloadInteriorVRForSeries(series.jm_id, brandName, series.name, (p: VRDownloadProgress) => {
            set({ progress: { current: i + 1, total: pool.length, message: `${series.name} - ${p.message}` } });
          });
          if (it.errors.length > 0) errors.push(...it.errors.map((x) => `[内饰VR] ${x}`));

          const draft: BrandVrBatchDraft = {
            series_jm_id: series.jm_id,
            series_id: series.id,
            series_name: series.name,
            brand_jm_id: brandJmId,
            brand_name: brandName,
            exterior_vr: ex.colorGroups,
            interior_vr: it.colorGroups,
            errors,
          };

          drafts.push(draft);
          set((s) => ({ drafts: [...s.drafts, draft] }));

          set((s) => ({
            logs: [
              ...s.logs,
              `[${nowStamp()}] 完成：${series.name}（外观组 ${ex.colorGroups.length}，内饰组 ${it.colorGroups.length}）`,
              ...(errors.length > 0 ? [`[${nowStamp()}] 警告：${series.name} 有 ${errors.length} 条错误记录`] : []),
            ],
          }));
        } catch (e: any) {
          const msg = e?.message || String(e);
          const draft: BrandVrBatchDraft = {
            series_jm_id: series.jm_id,
            series_id: series.id,
            series_name: series.name,
            brand_jm_id: brandJmId,
            brand_name: brandName,
            exterior_vr: [],
            interior_vr: [],
            errors: [`[异常] ${msg}`],
          };
          drafts.push(draft);
          set((s) => ({ drafts: [...s.drafts, draft], logs: [...s.logs, `[${nowStamp()}] 失败：${series.name} - ${msg}`] }));
        }
      }

      set({ progress: { current: drafts.length, total: pool.length, message: "批量下载已完成（未写入数据库）" } });
    } finally {
      set({ running: false });
    }
  },

  saveAll: async () => {
    const state = get();
    if (state.saving || state.running) return;
    if (state.drafts.length === 0) return;

    set({ saving: true });
    set((s) => ({ logs: [...s.logs, `[${nowStamp()}] 开始批量保存（会上传图片并写入数据库）：共 ${s.drafts.length} 个车系`] }));

    try {
      for (let i = 0; i < get().drafts.length; i++) {
        const d = get().drafts[i];
        set({ progress: { current: i + 1, total: get().drafts.length, message: `保存 ${d.series_name}（${i + 1}/${get().drafts.length}）` } });
        set((s) => ({ logs: [...s.logs, `[${nowStamp()}] 保存：${d.series_name}（jm_id: ${d.series_jm_id}）`] }));

        const rawExterior = JSON.parse(JSON.stringify(d.exterior_vr || []));
        const rawInterior = JSON.parse(JSON.stringify(d.interior_vr || []));
        const normalized = normalizeSeriesVrGroups({ seriesJmId: d.series_jm_id, exterior_vr: rawExterior, interior_vr: rawInterior });
        const newExteriorVr = normalized.exterior_vr;
        const newInteriorVr = normalized.interior_vr;

        type UploadTask = {
          groupType: "exterior" | "interior";
          groupIndex?: number;
          colorGroupIndex?: number;
          posGroupIndex?: number;
          imageIndex: number;
          base64Url: string;
          path: string;
        };

        const tasks: UploadTask[] = [];

        newExteriorVr.forEach((group: any, gIdx: number) => {
          const safeColorCode = (group.color_code || "default").replace(/#/g, "");
          group.images.forEach((img: string, iIdx: number) => {
            if (typeof img === "string" && img.startsWith("data:image")) {
              const ext = extFromDataUrl(img);
              tasks.push({
                groupType: "exterior",
                groupIndex: gIdx,
                imageIndex: iIdx,
                base64Url: img,
                path: `vr/${d.brand_jm_id}/${d.series_jm_id}/exterior/${safeColorCode}/${iIdx}.${ext}`,
              });
            }
          });
        });

        newInteriorVr.forEach((colorGroup: any, cgIdx: number) => {
          const safeColorName = (colorGroup.color_name || "default")
            .replace(/[/\\?%*:|"<>]/g, "-")
            .replace(/[\u4e00-\u9fa5]/g, (match: string) => encodeURIComponent(match).replace(/%/g, ""));
          (colorGroup.positions || []).forEach((posGroup: any, pgIdx: number) => {
            const safePosition = (posGroup.position || posGroup.id || "default").replace(/#/g, "");
            (posGroup.images || []).forEach((img: string, iIdx: number) => {
              if (typeof img === "string" && img.startsWith("data:image")) {
                const ext = extFromDataUrl(img);
                tasks.push({
                  groupType: "interior",
                  colorGroupIndex: cgIdx,
                  posGroupIndex: pgIdx,
                  imageIndex: iIdx,
                  base64Url: img,
                  path: `vr/${d.brand_jm_id}/${d.series_jm_id}/interior/color_${safeColorName}/${safePosition}/${iIdx}.${ext}`,
                });
              }
            });
          });
        });

        if (tasks.length > 0) {
          const concurrency = 6;
          set((s) => ({ logs: [...s.logs, `[${nowStamp()}] ${d.series_name}：检测到 ${tasks.length} 张新图片需要上传（并发 ${concurrency} + 重试）`] }));
          let completed = 0;

          await asyncPool(concurrency, tasks, async (task) => {
            try {
              let retries = 3;
              let lastError: any = null;
              while (retries > 0) {
                try {
                  const res = await fetch(task.base64Url);
                  const blob = await res.blob();

                  const { error: uploadError } = await supabase.storage
                    .from("vehicle_resources")
                    .upload(task.path, blob, { contentType: blob.type, upsert: true });
                  if (uploadError) throw uploadError;

                  const { data: publicUrlData } = supabase.storage.from("vehicle_resources").getPublicUrl(task.path);
                  if (task.groupType === "exterior") {
                    newExteriorVr[task.groupIndex!].images[task.imageIndex] = publicUrlData.publicUrl;
                  } else {
                    newInteriorVr[task.colorGroupIndex!].positions[task.posGroupIndex!].images[task.imageIndex] = publicUrlData.publicUrl;
                  }
                  return;
                } catch (err: any) {
                  lastError = err;
                  retries--;
                  if (retries > 0) {
                    set((s) => ({ logs: [...s.logs, `[${nowStamp()}] [${d.series_name}] [${task.path}] 上传失败，剩余 ${retries} 次重试（1秒后重试）`] }));
                    await new Promise((resolve) => setTimeout(resolve, 1000));
                    continue;
                  }
                }
              }
              throw new Error(`[${d.series_name}] 图片上传失败 [${task.path}]: ${lastError?.message || lastError}`);
            } finally {
              completed++;
              if (completed % 10 === 0 || completed === tasks.length) {
                set((s) => ({ logs: [...s.logs, `[${nowStamp()}] [${d.series_name}] 已上传 ${completed}/${tasks.length}`] }));
              }
            }
          });
        }

        const payload = {
          series_jm_id: d.series_jm_id,
          series_id: d.series_id,
          series_name: d.series_name,
          brand_jm_id: d.brand_jm_id,
          brand_name: d.brand_name,
          exterior_vr: newExteriorVr,
          interior_vr: newInteriorVr,
        };

        const { error: upsertError } = await supabase.from("series_vr_config").upsert(payload, { onConflict: "series_jm_id" });
        if (upsertError) throw upsertError;

        set((s) => ({ logs: [...s.logs, `[${nowStamp()}] 已写入数据库：${d.series_name}`] }));
      }

      set((s) => ({ logs: [...s.logs, `[${nowStamp()}] 批量保存完成`] }));
    } finally {
      set({ saving: false });
    }
  },
}));
