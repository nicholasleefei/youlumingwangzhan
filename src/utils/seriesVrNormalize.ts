type ExteriorGroup = { id?: string; color_code?: string; color_name?: string; images?: unknown };
type InteriorPos = { id?: string; position?: string; position_name?: string; images?: unknown };
type InteriorColor = { id?: string; color_name?: string; color_value?: string; positions?: unknown };
type SeriesOfficialImages = unknown;

function hashString(input: string): string {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0).toString(16);
}

function makeId(prefix: string, ...parts: Array<string | number | null | undefined>): string {
  const s = parts
    .map((p) => (p === null || p === undefined ? "" : String(p)))
    .join("|");
  return `${prefix}_${hashString(s)}`;
}

function asString(v: unknown): string {
  return typeof v === "string" ? v : "";
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.filter((x) => typeof x === "string" && x.trim()) as string[];
}

function normalizeOfficialImages(v: SeriesOfficialImages): string[] {
  return asStringArray(v);
}

export function normalizeSeriesVrGroups(input: {
  seriesJmId: number;
  exterior_vr: unknown;
  interior_vr: unknown;
}): { exterior_vr: any[]; interior_vr: any[] } {
  const exteriorRaw = Array.isArray(input.exterior_vr) ? (input.exterior_vr as ExteriorGroup[]) : [];
  const interiorRaw = Array.isArray(input.interior_vr) ? (input.interior_vr as InteriorColor[]) : [];

  const exterior: any[] = [];
  const usedExIds = new Set<string>();
  for (let i = 0; i < exteriorRaw.length; i++) {
    const g = exteriorRaw[i] || {};
    const color_code = asString(g.color_code);
    const color_name = asString(g.color_name);
    const images = asStringArray(g.images);
    let id = asString(g.id);
    if (!id) id = makeId("ex", input.seriesJmId, color_code, color_name);
    while (usedExIds.has(id)) id = `${id}_${i}`;
    usedExIds.add(id);
    exterior.push({ id, color_code, color_name, images });
  }

  const interior: any[] = [];
  const usedColorIds = new Set<string>();
  for (let i = 0; i < interiorRaw.length; i++) {
    const c = interiorRaw[i] || {};
    const color_name = asString(c.color_name);
    const color_value = asString(c.color_value) || undefined;
    let id = asString(c.id);
    if (!id) id = makeId("in_c", input.seriesJmId, color_name, color_value || "");
    while (usedColorIds.has(id)) id = `${id}_${i}`;
    usedColorIds.add(id);

    const positionsRaw = Array.isArray(c.positions) ? (c.positions as InteriorPos[]) : [];
    const posByKey = new Map<string, { position: string; position_name: string; images: string[]; id?: string }>();
    for (let j = 0; j < positionsRaw.length; j++) {
      const p = positionsRaw[j] || {};
      const position = asString(p.position) || "driver";
      const position_name = asString(p.position_name) || position;
      const images = asStringArray(p.images);
      const key = position;
      const prev = posByKey.get(key);
      if (!prev || images.length >= prev.images.length) {
        posByKey.set(key, { position, position_name, images, id: asString(p.id) || undefined });
      }
    }

    const positions: any[] = [];
    const usedPosIds = new Set<string>();
    for (const [k, v] of posByKey.entries()) {
      let pid = asString(v.id);
      if (!pid) pid = makeId("in_p", input.seriesJmId, id, k);
      while (usedPosIds.has(pid)) pid = `${pid}_${positions.length}`;
      usedPosIds.add(pid);
      positions.push({ id: pid, position: v.position, position_name: v.position_name, images: v.images });
    }

    const order = ["driver", "passenger", "rear", "third_row", "trunk"];
    positions.sort((a, b) => order.indexOf(a.position) - order.indexOf(b.position));
    interior.push({ id, color_name, color_value, positions });
  }

  return { exterior_vr: exterior, interior_vr: interior };
}

export function normalizeSeriesVrConfig<T extends { series_jm_id: number; exterior_vr: unknown; interior_vr: unknown; official_images?: unknown }>(cfg: T): T {
  const next = normalizeSeriesVrGroups({ seriesJmId: cfg.series_jm_id, exterior_vr: cfg.exterior_vr, interior_vr: cfg.interior_vr });
  const official_images = normalizeOfficialImages((cfg as any).official_images);
  return { ...cfg, ...next, official_images };
}
