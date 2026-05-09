import { supabase } from "@/utils/supabaseClient";

export type InteriorVrPosition = "driver" | "passenger" | "rear" | "third_row" | "trunk";

export type InteriorVrVisibilityConfig = {
  hidden_positions?: InteriorVrPosition[];
};

const SITE_CONFIG_KEY = "interior_vr_visibility";
const ALL_POSITIONS: InteriorVrPosition[] = ["driver", "passenger", "rear", "third_row", "trunk"];
const DEFAULT_HIDDEN: InteriorVrPosition[] = ["driver"];

let cache:
  | {
      value: InteriorVrVisibilityConfig;
      expiresAt: number;
    }
  | null = null;

let inflight: Promise<InteriorVrVisibilityConfig> | null = null;

function normalizeHiddenPositions(v: any): InteriorVrPosition[] {
  const raw = Array.isArray(v) ? v : [];
  const set = new Set<InteriorVrPosition>();
  for (const item of raw) {
    const s = String(item || "").trim();
    if ((ALL_POSITIONS as string[]).includes(s)) set.add(s as InteriorVrPosition);
  }
  return Array.from(set);
}

export async function getInteriorVrVisibilityConfig(opts?: { force?: boolean }): Promise<InteriorVrVisibilityConfig> {
  const force = Boolean(opts?.force);
  const now = Date.now();
  if (!force && cache && cache.expiresAt > now) return cache.value;
  if (!force && inflight) return inflight;

  inflight = (async () => {
    try {
      const { data, error } = await supabase.from("site_config").select("value").eq("key", SITE_CONFIG_KEY).maybeSingle();
      if (error) throw error;
      if (!data) {
        const next: InteriorVrVisibilityConfig = { hidden_positions: DEFAULT_HIDDEN.slice() };
        cache = { value: next, expiresAt: now + 30_000 };
        return next;
      }

      const value = (data?.value || {}) as any;
      const normalized = normalizeHiddenPositions(value?.hidden_positions);
      const next: InteriorVrVisibilityConfig = { hidden_positions: normalized.length ? normalized : DEFAULT_HIDDEN.slice() };
      cache = { value: next, expiresAt: now + 30_000 };
      return next;
    } catch {
      const fallback: InteriorVrVisibilityConfig = { hidden_positions: DEFAULT_HIDDEN.slice() };
      cache = { value: fallback, expiresAt: now + 10_000 };
      return fallback;
    } finally {
      inflight = null;
    }
  })();

  return inflight;
}

export function filterInteriorVrPositions<T extends { position?: string | null }>(
  positions: T[],
  hidden: InteriorVrPosition[]
): T[] {
  if (!Array.isArray(positions) || positions.length === 0) return [];
  if (!Array.isArray(hidden) || hidden.length === 0) return positions;
  const hiddenSet = new Set(hidden);
  return positions.filter((p) => {
    const pos = String(p?.position || "").trim();
    if (!pos) return true;
    return !hiddenSet.has(pos as InteriorVrPosition);
  });
}
