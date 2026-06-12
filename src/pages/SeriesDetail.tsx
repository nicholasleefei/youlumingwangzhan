import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle2, ChevronRight, ClipboardList, Download } from "lucide-react";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { normalizeLocale, type Locale } from "@/i18n/locales";
import * as DB from "@/utils/db";
import { useInquiryDraft } from "@/store/useInquiryDraft";
import type { SeriesRow } from "@/utils/db";
import { supabase } from "@/utils/supabaseClient";
import { mergeRawTranslations, resolveTableName } from "@/utils/entityTranslation";
import SafeImage from "@/components/SafeImage";
import SeoHead from "@/components/SeoHead";
import ModelVrBlock from "@/components/modelDetail/ModelVrBlock";
import ImageLightbox from "@/components/modelDetail/ImageLightbox";
import AllParamsModal from "@/components/modelDetail/AllParamsModal";
import ExportAllParamsCard from "@/components/modelDetail/ExportAllParamsCard";
import { flattenParams, flattenParamsGrouped, type FlattenedParam, type ParamGroup } from "@/utils/paramFlatten";
import { normalizeSeriesVrConfig } from "@/utils/seriesVrNormalize";

const { getSeriesById } = DB;

type SeriesModel = {
  id: string;
  jm_id: number;
  series_id: string | null;
  series_jm_id: number;
  brand_id: string | null;
  brand_jm_id: number;
  name: string;
  groupid?: string | null;
  groupname?: string | null;
  logo_url: string | null;
  yeartype: string | null;
  listdate: string | null;
  price: string | null;
  productionstate: string | null;
  salestate: string | null;
  sizetype: string | null;
  displacement: string | null;
  displacement2: string | null;
  geartype: string | null;
  geartype2: number | null;
  activity_status: number;
  updated_at: string;
};

type ModelSpecs = DB.ModelRow;

type CompareGroup = {
  id: string;
  label: string;
  items: Array<{
    key: string;
    label: string;
    get: (m: SeriesModel, s: ModelSpecs | null) => any;
  }>;
};

function toText(v: any) {
  const s = String(v ?? "").trim();
  return s ? s : "—";
}

function valueToText(v: any): string {
  if (v === null || v === undefined) return "—";
  if (typeof v === "boolean") return v ? "是" : "否";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "—";
  if (typeof v === "string") return v.trim() ? v.trim() : "—";
  if (Array.isArray(v)) {
    const s = v
      .map((x) => (typeof x === "string" || typeof x === "number" || typeof x === "boolean" ? String(x) : ""))
      .map((x) => x.trim())
      .filter(Boolean)
      .join(", ");
    return s || "—";
  }
  try {
    const s = JSON.stringify(v);
    return s && s !== "{}" && s !== "[]" ? s : "—";
  } catch {
    return "—";
  }
}

function pickNumberString(...candidates: Array<unknown>) {
  for (const c of candidates) {
    if (typeof c === "number" && Number.isFinite(c)) return String(c);
    if (typeof c === "string") {
      const m = c.match(/-?\d+(?:\.\d+)?/);
      if (m?.[0]) return m[0];
    }
  }
  return null;
}

function normalizeRawObject(raw: any): Record<string, unknown> {
  let root: any = raw;
  if (typeof root === "string") {
    const s = root.trim();
    if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
      try {
        root = JSON.parse(s);
      } catch {
        root = raw;
      }
    }
  }
  return root && typeof root === "object" && !Array.isArray(root) ? (root as Record<string, unknown>) : {};
}

function extractJumeiParamRows(raw: any): Array<{ group: string; key: string; label: string; value: any }> {
  const out: Array<{ group: string; key: string; label: string; value: any }> = [];

  let root: any = raw;
  if (typeof root === "string") {
    const s = root.trim();
    if ((s.startsWith("{") && s.endsWith("}")) || (s.startsWith("[") && s.endsWith("]"))) {
      try {
        root = JSON.parse(s);
      } catch {
        root = raw;
      }
    }
  }

  const pushParam = (group: string, label: string, value: any, key: string) => {
    const gl = String(group || "").trim() || "{t('series.jumData')}";
    const ll = String(label || "").trim() || key;
    const kk = `${gl}::${key || ll}`;
    out.push({ group: gl, key: kk, label: ll, value });
  };

  const tryExtractFromParamList = (group: string, list: any, prefixKey: string) => {
    if (!Array.isArray(list)) return false;
    let used = false;
    for (let i = 0; i < list.length; i++) {
      const p = list[i];
      if (!p) continue;
      if (typeof p === "string" || typeof p === "number" || typeof p === "boolean") {
        pushParam(group, `${prefixKey}.${i}`, p, `${prefixKey}.${i}`);
        used = true;
        continue;
      }
      if (typeof p !== "object") continue;
      const label = (p.name ?? p.param_name ?? p.paramname ?? p.title ?? p.key ?? p.k) as any;
      const value = (p.value ?? p.val ?? p.v ?? p.text ?? p.display_value ?? p.displayValue) as any;
      const idKey = String(p.id ?? p.pid ?? label ?? i);
      if (label !== undefined || value !== undefined) {
        pushParam(group, String(label ?? idKey), value ?? p, `${prefixKey}.${idKey}`);
        used = true;
        continue;
      }
      if (Array.isArray(p.items) || Array.isArray(p.params) || Array.isArray(p.list) || Array.isArray(p.data)) {
        const nested = (p.items ?? p.params ?? p.list ?? p.data) as any;
        const nestedGroup = String(p.groupname ?? p.group_name ?? p.name ?? p.title ?? group);
        const ok = tryExtractFromParamList(nestedGroup, nested, `${prefixKey}.${idKey}`);
        if (ok) used = true;
      }
    }
    return used;
  };

  const scanRGroups = (rk: string, v: any) => {
    if (!rk) return;
    if (Array.isArray(v)) {
      for (let i = 0; i < v.length; i++) {
        const g = v[i];
        if (!g || typeof g !== "object") continue;
        const groupLabel = String(g.groupname ?? g.group_name ?? g.name ?? g.title ?? rk);
        const list = g.items ?? g.params ?? g.list ?? g.data ?? g.content;
        const ok = tryExtractFromParamList(groupLabel, list, `${rk}.${i}`);
        if (!ok) {
          const flat = typeof list === "object" && list ? list : g;
          pushParam(groupLabel, groupLabel, flat, `${rk}.${i}`);
        }
      }
      return;
    }
    if (v && typeof v === "object") {
      const groupLabel = String((v as any).groupname ?? (v as any).group_name ?? (v as any).name ?? (v as any).title ?? rk);
      const list = (v as any).items ?? (v as any).params ?? (v as any).list ?? (v as any).data ?? (v as any).content;
      const ok = tryExtractFromParamList(groupLabel, list, rk);
      if (!ok) pushParam(groupLabel, groupLabel, v, rk);
    }
  };

  const deepScan = (node: any) => {
    const queue: Array<{ v: any; depth: number }> = [{ v: node, depth: 0 }];
    let seen = 0;
    while (queue.length > 0) {
      const cur = queue.shift()!;
      if (!cur.v || typeof cur.v !== "object") continue;
      if (seen++ > 2000) break;

      const keys = Object.keys(cur.v);
      for (const k of keys) {
        const child = (cur.v as any)[k];
        if (/^r\d*$/i.test(k) || /^r/i.test(k)) {
          scanRGroups(k, child);
        }
        if (cur.depth < 6 && child && typeof child === "object") queue.push({ v: child, depth: cur.depth + 1 });
      }
    }
  };

  deepScan(root);

  if (out.length > 0) return out;

  const walk = (node: any, path: string[], depth: number) => {
    if (depth > 3) return;
    if (node === null || node === undefined) return;
    if (typeof node !== "object") {
      pushParam("{t('series.jumData')}", path.join("."), node, path.join("."));
      return;
    }
    if (Array.isArray(node)) {
      for (let i = 0; i < Math.min(node.length, 50); i++) {
        walk(node[i], [...path, String(i)], depth + 1);
      }
      return;
    }
    for (const k of Object.keys(node)) {
      walk((node as any)[k], [...path, k], depth + 1);
    }
  };

  walk(root, ["raw"], 0);
  return out;
}

function buildModelBadges(model: SeriesModel, specs: ModelSpecs | null, raw: unknown): string[] {
  const out: string[] = [];
  const push = (v: string | null | undefined) => {
    const s = String(v ?? "").trim();
    if (!s) return;
    if (out.includes(s)) return;
    out.push(s);
  };

  const rangeKm = (() => {
    const candidates: unknown[] = [
      specs?.cltc_range,
      (specs as any)?.specs?.cltc_range,
      (specs as any)?.specs?.cltcRange,
      (specs as any)?.specs?.range_cltc,
    ];
    const rawObj = normalizeRawObject(raw);
    const anyRaw = rawObj as any;
    candidates.push(
      anyRaw?.cltc_range,
      anyRaw?.cltcrange,
      anyRaw?.basic?.cltc_range,
      anyRaw?.basic?.cltcrange,
      anyRaw?.basic?.range,
      anyRaw?.basic?.endurance,
      anyRaw?.basic?.electricrange,
      anyRaw?.basic?.pureelectricrange,
    );

    const s = pickNumberString(...candidates);
    const n = s ? Number(s) : NaN;
    return Number.isFinite(n) && n > 0 ? Math.round(n) : null;
  })();

  push(specs?.energy_type);
  if (rangeKm !== null) push(`{t('common.range')} ${rangeKm}km`);
  if (typeof specs?.motor_horsepower === "number" && Number.isFinite(specs.motor_horsepower)) push(`${specs.motor_horsepower}Hp`);

  if (out.length < 4) push(specs?.level ?? specs?.vehicle_class ?? model.sizetype);
  if (out.length < 4 && typeof specs?.seats === "number" && Number.isFinite(specs.seats)) push(`${specs.seats}座`);
  if (out.length < 4 && typeof specs?.max_speed === "number" && Number.isFinite(specs.max_speed)) push(`${specs.max_speed}km/h`);

  return out.slice(0, 4);
}

function toNum(v: any) {
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

function yearKey(yeartype: string | null) {
  const y = Number(String(yeartype || "").replace(/[^0-9]/g, "")) || 0;
  return y > 0 ? String(y) : "其他";
}

export default function SeriesDetail() {
  const { t } = useTranslation();
  const params = useParams();
  const locale = (normalizeLocale(params.locale) ?? "en") as Locale;
  const base = `/${locale}`;
  const seriesId = typeof params.id === "string" ? params.id : "";

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [series, setSeries] = useState<SeriesRow & { brands: { name: string; logo_url: string | null } } | null>(null);
  const [models, setModels] = useState<SeriesModel[]>([]);
  const [modelSpecsMap, setModelSpecsMap] = useState<Record<string, ModelSpecs>>({});
  const [modelRawMap, setModelRawMap] = useState<Record<string, any>>({});
  const [rawDebug, setRawDebug] = useState<{ rows: number; modelsWithRaw: number } | null>(null);

  const [seriesVrLoading, setSeriesVrLoading] = useState(false);
  const [seriesVrConfig, setSeriesVrConfig] = useState<any | null>(null);

  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const [activeYear, setActiveYear] = useState<string>("");
  const [hideSame, setHideSame] = useState(false);
  const [hideEmpty, setHideEmpty] = useState(false);
  const [compareModelIds, setCompareModelIds] = useState<string[]>([]);

  const MAX_COMPARE = 5;
  const MIN_COMPARE = 2;

  const toggle = useInquiryDraft((s) => s.toggleModelId);
  const selectedIds = useInquiryDraft((s) => s.selectedModelIds);
  const addModelIds = useInquiryDraft((s) => s.addModelIds);
  const [addingToInquiry, setAddingToInquiry] = useState(false);

  const exportRef = useRef<HTMLDivElement | null>(null);
  const [paramsOpen, setParamsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);

  const query = useMemo(() => ({ seriesId, locale }), [seriesId, locale]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    Promise.all([
      getSeriesById(seriesId, locale),
      supabase
        .from(resolveTableName("models_jumdata", locale))
        .select("*")
        .eq("series_id", seriesId)
        .eq("activity_status", 0)
        .order("updated_at", { ascending: false }),
    ])
      .then(async ([s, m]) => {
        if (!active) return;
        const { data, error } = m as unknown as { data: SeriesModel[] | null; error: any };
        if (error) throw error;
        setSeries(s as SeriesRow & { brands: { name: string; logo_url: string | null } });
        const rows = data ?? [];
        setModels(rows);

        const ids = rows.map((x) => x.id).filter((x) => typeof x === "string" && x.trim());
        if (ids.length > 0) {
          // 原 models 表已被删除，使用 model_details 表获取详细参数
          const { data: specsData } = await supabase
            .from(resolveTableName("model_details", locale))
            .select("*")
            .in("model_id", ids)
            .eq("activity_status", 0)
            .limit(5000);

          const { data: rawData } = await supabase
            .from(resolveTableName("model_details", locale))
            .select("model_id, raw, activity_status")
            .in("model_id", ids)
            .eq("activity_status", 0)
            .limit(5000);

          const map: Record<string, ModelSpecs> = {};
          (specsData ?? []).forEach((r: any) => {
            const mid = String(r.model_id || "");
            if (!mid) return;
            map[mid] = r as ModelSpecs;
          });
          if (active) setModelSpecsMap(map);

          const rawMap: Record<string, any> = {};
          let rawCount = 0;
          (rawData ?? []).forEach((r: any) => {
            const id = String(r.model_id || "");
            if (!id) return;
            const v = r.raw ?? null;
            rawMap[id] = v;
            if (v !== null && v !== undefined) rawCount++;
          });
          if (active) setModelRawMap(rawMap);
          if (active) setRawDebug({ rows: (rawData ?? []).length, modelsWithRaw: rawCount });
        } else {
          setModelSpecsMap({});
          setModelRawMap({});
          setRawDebug(null);
        }
      })
      .catch((e: unknown) => {
        if (!active) return;
        const errorMsg = e instanceof Error ? e.message : String(e);
        setError(errorMsg || t("common.loadFailed"));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [query, t]);

  // 完整镜像模式：models_jumdata 翻译表已是完整镜像，name 已经翻译过
  // models 数据直接从 locale 感知的翻译表加载的，无需额外翻译

  useEffect(() => {
    let active = true;
    if (!series) return;
    setSeriesVrLoading(true);
    setSeriesVrConfig(null);
    supabase
      .from("series_vr_config")
      .select("*")
      .eq("series_jm_id", series.jm_id)
      .maybeSingle()
      .then((res: any) => {
        if (!active) return;
        if (res.error) throw res.error;
        const cfg = res.data ? normalizeSeriesVrConfig(res.data as any) : null;
        setSeriesVrConfig(cfg);
      })
      .catch(() => {
        if (!active) return;
        setSeriesVrConfig(null);
      })
      .finally(() => {
        if (active) setSeriesVrLoading(false);
      });
    return () => {
      active = false;
    };
  }, [series?.jm_id]);

  const visibleModels = useMemo(() => {
    let out = models.slice();
    out.sort((a, b) => String(b.updated_at || "").localeCompare(String(a.updated_at || "")));
    return out;
  }, [models]);

  const modelsByYear = useMemo(() => {
    const map = new Map<string, SeriesModel[]>();
    for (const m of visibleModels) {
      const key = yearKey(m.yeartype);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m);
    }
    const keys = Array.from(map.keys());
    keys.sort((a, b) => {
      if (a === "其他") return 1;
      if (b === "其他") return -1;
      return Number(b) - Number(a);
    });
    return keys.map((k) => ({ year: k, models: map.get(k) ?? [] }));
  }, [visibleModels]);

  useEffect(() => {
    const next = modelsByYear[0]?.year ?? "";
    if (!next) return;
    setActiveYear((prev) => (prev ? prev : next));
  }, [modelsByYear.map((x) => x.year).join("|")]);

  const activeModels = useMemo(() => {
    if (!activeYear) return modelsByYear[0]?.models ?? [];
    return modelsByYear.find((x) => x.year === activeYear)?.models ?? [];
  }, [activeYear, modelsByYear]);

  useEffect(() => {
    const ids = activeModels.map((m) => m.id);
    if (ids.length === 0) {
      setCompareModelIds([]);
      return;
    }
    setCompareModelIds((prev) => {
      if (prev.length === 0) return ids.slice(0, MAX_COMPARE);
      const valid = prev.filter((id) => ids.includes(id));
      if (valid.length < MIN_COMPARE) return ids.slice(0, MAX_COMPARE);
      return valid.length > MAX_COMPARE ? valid.slice(0, MAX_COMPARE) : valid;
    });
  }, [activeModels.map((m) => m.id).join("|")]);

  const compareModels = useMemo(() => {
    if (compareModelIds.length === 0) return activeModels;
    const order = new Map(compareModelIds.map((id, idx) => [id, idx] as const));
    return activeModels
      .filter((m) => order.has(m.id))
      .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  }, [activeModels, compareModelIds]);

  const extractedRawByModel = useMemo(() => {
    const out: Record<string, Array<{ group: string; key: string; label: string; value: any }>> = {};
    for (const m of compareModels) {
      const originalRaw = modelRawMap[m.id];
      // 完整镜像模式：直接使用原始 raw（翻译表没有 raw 镜像）
      out[m.id] = extractJumeiParamRows(originalRaw ?? null);
    }
    return out;
  }, [compareModels.map((m) => m.id).join("|"), modelRawMap]);

  const rawGroupStats = useMemo(() => {
    let groups = 0;
    let rows = 0;
    const set = new Set<string>();
    for (const id of Object.keys(extractedRawByModel)) {
      for (const r of extractedRawByModel[id] || []) {
        rows++;
        set.add(r.group);
      }
    }
    groups = set.size;
    return { groups, rows };
  }, [extractedRawByModel]);

  // --- All params: 按 compareModels 分块，弹窗里一次性展示全部车型的参数 ---
  const allParamsSections = useMemo(() => {
    const out: Array<{ modelName: string; groups: ParamGroup[] }> = [];
    for (const m of compareModels) {
      const raw = modelRawMap[m.id];
      const groups = flattenParamsGrouped(raw, { maxItems: 600, maxDepth: 6 });
      out.push({ modelName: m.name, groups });
    }
    return out;
  }, [compareModels, modelRawMap]);

  const inlineAllParams = useMemo(() => {
    const all: FlattenedParam[] = [];
    // PDF 导出还是用当前展示的车型
    for (const m of compareModels) {
      const raw = modelRawMap[m.id];
      all.push(...flattenParams(raw, { maxItems: 200, maxDepth: 6 }));
    }
    return all;
  }, [compareModels, modelRawMap]);

  const startExportPdf = async () => {
    if (!exportRef.current) return;
    setExporting(true);
    setError(null);
    try {
      await new Promise((r) => setTimeout(r, 80));
      const canvas = await html2canvas(exportRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        windowWidth: exportRef.current.scrollWidth,
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.92);
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfW = pdf.internal.pageSize.getWidth();
      const pdfH = pdf.internal.pageSize.getHeight();
      const imgW = pdfW;
      const imgH = (canvas.height * imgW) / canvas.width;
      let pos = 0;
      pdf.addImage(imgData, "JPEG", 0, pos, imgW, imgH);
      let heightLeft = imgH - pdfH;
      while (heightLeft > 0) {
        pos -= pdfH;
        pdf.addPage();
        pdf.addImage(imgData, "JPEG", 0, pos, imgW, imgH);
        heightLeft -= pdfH;
      }
      pdf.save(`${seriesFullname}-${t("series.seriesDetail")}.pdf`);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t("model.exportFailed"));
    } finally {
      setExporting(false);
    }
  };

  const groups: CompareGroup[] = useMemo(() => {
    const rawGroupIndex = new Map<string, { label: string; rows: Array<{ key: string; label: string }> }>();
    for (const m of compareModels) {
      const rows = extractedRawByModel[m.id] ?? [];
      for (const r of rows) {
        if (!rawGroupIndex.has(r.group)) rawGroupIndex.set(r.group, { label: r.group, rows: [] });
        rawGroupIndex.get(r.group)!.rows.push({ key: r.key, label: r.label });
      }
    }

    const groups: CompareGroup[] = [];

    if (rawGroupIndex.size > 0) {
      const rawGroups = Array.from(rawGroupIndex.values())
        .map((g) => {
          const uniq = new Map<string, string>();
          for (const r of g.rows) {
            if (!uniq.has(r.key)) uniq.set(r.key, r.label);
          }
          return { label: g.label, rows: Array.from(uniq.entries()).map(([key, label]) => ({ key, label })) };
        })
        .sort((a, b) => a.label.localeCompare(b.label));

      for (const g of rawGroups) {
        groups.push({
          id: `raw_${g.label}`,
          label: g.label,
          items: g.rows.map((r) => ({
            key: r.key,
            label: r.label,
            get: (m) => {
              const rows = extractedRawByModel[m.id] ?? [];
              const found = rows.find((x) => x.key === r.key);
              return found ? found.value : null;
            },
          })),
        });
      }
    }

    return groups;
  }, [compareModels, extractedRawByModel]);

  const tableRows = useMemo(() => {
    const rows: Array<
      | { type: "group"; id: string; label: string }
      | { type: "item"; id: string; label: string; values: string[]; isSame: boolean; isDiff: boolean; isEmpty: boolean }
    > = [];

    const pick = (m: SeriesModel) => modelSpecsMap[m.id] ?? null;
    for (const g of groups) {
      rows.push({ type: "group", id: g.id, label: g.label });
      for (const it of g.items) {
        const values = compareModels.map((m) => valueToText(it.get(m, pick(m))));
        const norm = values.map((v) => (v === "—" ? "" : v.trim()));
        const uniq = Array.from(new Set(norm.filter(Boolean)));
        const isEmpty = uniq.length === 0;
        const isSame = uniq.length <= 1;
        const isDiff = !isSame;
        rows.push({ type: "item", id: `${g.id}:${it.key}`, label: it.label, values, isSame, isDiff, isEmpty });
      }
    }

    return rows.filter((r) => {
      if (r.type !== "item") return true;
      if (hideEmpty && r.isEmpty) return false;
      if (hideSame && r.isSame) return false;
      return true;
    });
  }, [compareModels, groups, hideEmpty, hideSame, modelSpecsMap]);

  const selectedInSeriesCount = useMemo(() => {
    if (selectedIds.length === 0) return 0;
    const modelIdSet = new Set(models.map((m) => m.id));
    return selectedIds.filter((id) => modelIdSet.has(id)).length;
  }, [models, selectedIds]);

  const selectedSeriesIds = useInquiryDraft((s) => s.selectedSeriesIds);
  const addSeriesIds = useInquiryDraft((s) => s.addSeriesIds);

  const addSeriesToInquiry = async () => {
    if (!seriesId) return;
    setAddingToInquiry(true);
    try {
      addSeriesIds([seriesId]);
    } catch {
    } finally {
      setAddingToInquiry(false);
    }
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24">
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm">
          <div className="flex items-center justify-center py-20">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-zinc-300 border-t-transparent" />
            <span className="ml-3 text-zinc-600">{t("common.loading")}</span>
          </div>
        </div>
      </div>
    );
  }

  if (error || !series) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-24">
        <div className="rounded-2xl border border-zinc-200 bg-white p-10 shadow-sm">
          <div className="text-sm text-zinc-500">{t("common.notFound")}</div>
          <div className="mt-2 text-xl font-semibold text-zinc-900">{error || t("common.loadFailed")}</div>
          <div className="mt-6">
            <Link
              to={`${base}/brands`}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:bg-zinc-50"
            >
              {t("action.back")}
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const seriesFullname = series.fullname || series.name;
  const brandName = series.brands.name;
  const seriesInInquiry = !!seriesId && selectedSeriesIds.includes(seriesId);
  const bannerImage =
    (Array.isArray((seriesVrConfig as any)?.official_images) ? (((seriesVrConfig as any).official_images[0] as string | undefined) ?? null) : null) ||
    series.logo_url ||
    series.brands.logo_url ||
    "/tech-car-bg.jpg";

  const officialImages: string[] = Array.isArray((seriesVrConfig as any)?.official_images)
    ? (((seriesVrConfig as any).official_images as any[]).filter((x: any) => typeof x === "string" && x.trim()) as string[])
    : [];

  const primaryModel = visibleModels[0] ?? null;
  const primarySpecs = primaryModel ? (modelSpecsMap[primaryModel.id] ?? null) : null;
  const primaryRaw = primaryModel ? modelRawMap[primaryModel.id] : null;
  const primaryRawObj = normalizeRawObject(primaryRaw);
  const rawAny = primaryRawObj as any;
  const body = rawAny?.body as any;
  const engine = rawAny?.engine as any;
  const basic = rawAny?.basic as any;

  const wheelbase = pickNumberString(body?.wheelbase, rawAny?.body_wheelbase, rawAny?.["body.wheelbase"], rawAny?.["body_wheelbase"], (primarySpecs as any)?.wheelbase_mm);
  const statMaxPower = pickNumberString(engine?.maxpower, rawAny?.engine_maxpower, rawAny?.["engine.maxpower"], (primarySpecs as any)?.motor_total_power);
  const statMaxHp = pickNumberString(engine?.maxhorsepower, rawAny?.engine_maxhorsepower, rawAny?.["engine.maxhorsepower"], engine?.motormaxhorsepower, (primarySpecs as any)?.motor_horsepower);
  const statMaxTorque = pickNumberString(engine?.maxtorque, rawAny?.engine_maxtorque, rawAny?.["engine.maxtorque"], engine?.motortorque, engine?.integratedtorque, (primarySpecs as any)?.motor_total_torque);
  const statFuel = pickNumberString(basic?.mixfuelconsumption, basic?.comfuelconsumption, basic?.electricfuelconsumption, rawAny?.basic_mixfuelconsumption);

  return (
    <>
      <SeoHead
        locale={locale}
        title={t("seo.series.title", { seriesName: seriesFullname, brandName })}
        description={t("seo.series.description", { seriesName: seriesFullname, brandName })}
        canonicalPath={`/${locale}/series/${seriesId}`}
        ogImage={bannerImage}
        ogType="product"
        structuredData={[
          {
            "@context": "https://schema.org",
            "@type": "BreadcrumbList",
            "itemListElement": [
              { "@type": "ListItem", "position": 1, "name": t("nav.home"), "item": `https://yolumi.com/${locale}` },
              { "@type": "ListItem", "position": 2, "name": t("nav.brands"), "item": `https://yolumi.com/${locale}/brands` },
              { "@type": "ListItem", "position": 3, "name": brandName, "item": `https://yolumi.com/${locale}/brands?brandId=${series.brand_id}` },
              { "@type": "ListItem", "position": 4, "name": seriesFullname },
            ],
          },
          {
            "@context": "https://schema.org",
            "@type": "Car",
            "name": seriesFullname,
            "brand": { "@type": "Brand", "name": brandName },
            "model": primaryModel?.name || seriesFullname,
            "image": bannerImage,
            ...(wheelbase ? { "vehicleConfiguration": wheelbase } : {}),
          },
        ]}
      />
    <div className="bg-zinc-50">
      <div className="relative overflow-hidden border-b border-zinc-200 bg-white">
        <div className="absolute inset-0 opacity-90">
          <div className="absolute -top-24 -left-24 h-72 w-72 rounded-full bg-blue-100 blur-3xl" />
          <div className="absolute -bottom-28 -right-20 h-72 w-72 rounded-full bg-emerald-100 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500">
            <Link to={`${base}/brands`} className="hover:text-zinc-800">{t("nav.brands")}</Link>
            <ChevronRight className="h-4 w-4" />
            <Link to={`${base}/brands?brandId=${series.brand_id}`} className="text-zinc-700 hover:text-zinc-900 hover:underline">{brandName} {t('common.series')}</Link>
            <ChevronRight className="h-4 w-4" />
            <span className="text-zinc-900 font-medium">{seriesFullname}</span>
          </div>

          <div className="mt-5 grid grid-cols-1 gap-5 lg:grid-cols-12 lg:items-center">
            <div className="lg:col-span-7">
              <div className="flex items-start gap-4">
                <div className="h-14 w-14 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                  {series.brands.logo_url ? (
                    <SafeImage src={series.brands.logo_url} alt={brandName} className="h-full w-full object-contain" usePlaceholder />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-sm font-semibold text-zinc-500">{brandName.slice(0, 1)}</div>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <h1 className="mt-1 text-3xl md:text-4xl font-semibold tracking-tight text-zinc-900 truncate">
                    {seriesFullname}
                  </h1>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      disabled={addingToInquiry}
                      onClick={addSeriesToInquiry}
                      className={
                        addingToInquiry
                          ? "inline-flex items-center justify-center rounded-xl bg-zinc-300 px-4 py-2 text-sm font-semibold text-zinc-700"
                          : "inline-flex items-center justify-center rounded-xl bg-emerald-700 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-800"
                      }
                    >
                      {addingToInquiry ? t("common.loading") : seriesInInquiry ? `✓ ${t('inquiry.added')}` : t("action.addToInquiry")}
                    </button>
                    {!seriesInInquiry && selectedInSeriesCount > 0 ? (
                      <span className="text-xs font-semibold text-zinc-600">{t('inquiry.selectedCount', { count: selectedInSeriesCount })}</span>
                    ) : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5">
              <div className="aspect-[21/9]">
                <img src={bannerImage} alt={seriesFullname} className="h-full w-full object-cover" loading="lazy" decoding="async" />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1600px] px-4 py-10 space-y-8">
        {/* VR block - full width, no sidebar */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-5 md:px-8 md:py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900">360 VR</div>
              </div>
            </div>
          </div>
          <ModelVrBlock seriesVrConfig={seriesVrConfig} loading={seriesVrLoading} />
        </div>

        {/* Official images - below VR */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          {officialImages.length === 0 ? (
            <div className="p-10 text-center text-sm text-zinc-600">{t('model.noOfficialImages')}</div>
          ) : (
            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:p-6 lg:grid-cols-4">
              {officialImages.map((src, idx) => (
                <button
                  key={`${src}_${idx}`}
                  type="button"
                  onClick={() => {
                    setLightboxIndex(idx);
                    setLightboxOpen(true);
                  }}
                  className="group overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100"
                  title={t('model.clickToEnlarge')}
                >
                  <div className="aspect-[4/3] w-full">
                    <SafeImage src={src} alt={`${seriesFullname} ${idx + 1}`} className="h-full w-full object-cover" usePlaceholder />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <ImageLightbox
          open={lightboxOpen}
          title={`${seriesFullname} ${t('model.officialImages')}`}
          images={officialImages}
          index={lightboxIndex}
          onChangeIndex={setLightboxIndex}
          onClose={() => setLightboxOpen(false)}
        />

        {/* Stats row */}
        <div className="flex items-center justify-center gap-4 text-xs text-zinc-500">
          <div className="h-px w-24 bg-zinc-200" />
          <div className="font-semibold text-zinc-900">
            {t('model.wheelbase')} <span className="text-zinc-500 font-medium">{wheelbase ? `${wheelbase}` : "—"}</span>
          </div>
          <div className="h-px w-24 bg-zinc-200" />
        </div>
        <div className="grid grid-cols-2 gap-6 text-center md:grid-cols-4">
          <div>
            <div className="text-xs text-zinc-500">{t('model.maxPowerKw')}</div>
            <div className="mt-1 text-3xl font-semibold text-zinc-900">{statMaxPower ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">{t('model.maxHorsepowerHp')}</div>
            <div className="mt-1 text-3xl font-semibold text-zinc-900">{statMaxHp ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">{t('model.maxTorqueNm')}</div>
            <div className="mt-1 text-3xl font-semibold text-zinc-900">{statMaxTorque ?? "—"}</div>
          </div>
          <div>
            <div className="text-xs text-zinc-500">{t('model.fuelConsumption')}</div>
            <div className="mt-1 text-3xl font-semibold text-zinc-900">{statFuel ?? "—"}</div>
          </div>
        </div>

        {/* Model selection - checkbox grid below VR */}
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-5 md:px-8 md:py-6">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-semibold text-zinc-900">{t('model.compareSelect')}</div>
                <div className="mt-1 text-xs text-zinc-500">{compareModelIds.length}/{MAX_COMPARE} {t('model.selected')}</div>
              </div>
            </div>
          </div>
          <div className="p-4 md:p-6">
            {modelsByYear.length > 1 ? (
              <div className="mb-4 flex flex-wrap gap-2">
                {modelsByYear.map((x) => (
                  <button
                    key={x.year}
                    type="button"
                    onClick={() => setActiveYear(x.year)}
                    className={
                      x.year === activeYear
                        ? "rounded-xl bg-emerald-700 px-3 py-1.5 text-xs font-semibold text-white"
                        : "rounded-xl border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50"
                    }
                  >
                    {x.year}
                  </button>
                ))}
              </div>
            ) : null}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {activeModels.map((m) => {
                const checked = compareModelIds.includes(m.id);
                const disabled = !checked && compareModelIds.length >= MAX_COMPARE;
                return (
                  <label
                    key={m.id}
                    className={`flex items-center gap-2 rounded-xl border px-3 py-2.5 cursor-pointer transition-colors text-sm ${
                      checked
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : disabled
                          ? 'bg-zinc-100 border-zinc-200 text-zinc-400 cursor-not-allowed'
                          : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={disabled}
                      onChange={() => {
                        if (checked) {
                          if (compareModelIds.length > MIN_COMPARE) {
                            setCompareModelIds(compareModelIds.filter((id) => id !== m.id));
                          }
                        } else {
                          if (compareModelIds.length < MAX_COMPARE) {
                            setCompareModelIds([...compareModelIds, m.id]);
                          }
                        }
                      }}
                      className="rounded accent-emerald-700"
                    />
                    <span className="truncate">{m.name}</span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        {/* Full-width comparison table - autohome style */}
        <div ref={exportRef} className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="border-b border-zinc-200 px-6 py-5 md:px-8 md:py-6">
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="min-w-0">
                <div className="text-lg font-semibold text-zinc-900">{t("model.allParams")}</div>
                <div className="mt-1 text-xs text-zinc-500">{t('model.countModels', { count: compareModels.length })}</div>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <label className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <input type="checkbox" checked={hideSame} onChange={(e) => setHideSame(e.target.checked)} className="rounded" />
                  {t('model.hideSame')}
                </label>
                <label className="flex items-center gap-1.5 text-xs text-zinc-600">
                  <input type="checkbox" checked={hideEmpty} onChange={(e) => setHideEmpty(e.target.checked)} className="rounded" />
                  {t('model.hideEmpty')}
                </label>
                <button
                  type="button"
                  onClick={() => setParamsOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm font-semibold text-zinc-700 hover:bg-zinc-50"
                >
                  {t("model.allParams")}
                </button>
                <button
                  type="button"
                  onClick={startExportPdf}
                  disabled={exporting}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                >
                  <Download className="h-4 w-4" />
                  {exporting ? t("model.generating") : t("model.exportPdf")}
                </button>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs sm:text-sm" style={{ minWidth: Math.max(480, compareModels.length * 160) }}>
              <thead>
                <tr className="bg-zinc-100">
                  <th className="sticky left-0 z-10 bg-zinc-100 px-5 py-3 text-left font-semibold text-zinc-700 border-r border-zinc-200 min-w-[140px]">
                    {t('model.paramItem')}
                  </th>
                  {compareModels.map((m, idx) => (
                    <th key={m.id} className={`px-4 py-3 text-center font-semibold text-zinc-800 ${idx % 2 === 0 ? 'bg-zinc-100' : 'bg-zinc-50'}`}>
                      <div className="text-sm">{m.name}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row) => {
                  if (row.type === "group") {
                    return (
                      <tr key={row.id} className="bg-zinc-200/60">
                        <td colSpan={compareModels.length + 1} className="px-5 py-2.5 font-semibold text-zinc-700 text-sm sticky left-0">
                          {row.label}
                        </td>
                      </tr>
                    );
                  }
                  return (
                    <tr key={row.id} className={`border-b border-zinc-100 ${row.isSame ? 'opacity-70' : ''}`}>
                      <td className="sticky left-0 z-10 bg-white px-5 py-3 text-zinc-600 border-r border-zinc-100 font-medium text-xs whitespace-nowrap">
                        {row.label}
                      </td>
                      {row.values.map((v, idx) => (
                        <td key={idx} className={`px-4 py-3 text-center text-zinc-800 ${idx % 2 === 0 ? 'bg-white' : 'bg-zinc-50/50'}`}>
                          {String(v ?? "—")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        <AllParamsModal
          open={paramsOpen}
          title={`${t("model.allParams")} - ${seriesFullname}`}
          sections={allParamsSections}
          onClose={() => setParamsOpen(false)}
        />

        {/* Hidden extra export card for PDF */}
        <div className="hidden">
          <div className="bg-white p-8">
            <h1 className="text-2xl font-bold mb-4">{seriesFullname} - {t("model.allParamsExport")}</h1>
            <ExportAllParamsCard items={inlineAllParams} />
          </div>
        </div>
      </div>
    </div>
    </>
  );
}
