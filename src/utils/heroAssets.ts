export type HeroAsset = {
  id: string;
  media_type: 'image' | 'video';
  source: 'upload' | 'official';
  external_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  title: string | null;
  alt_text: string | null;
  meta: unknown;
  disabled: boolean;
  created_by: string;
  created_at: string;
};

export type HeroPublicSlot = {
  slot_id: string;
  display_order: number;
  headline: string | null;
  subheadline: string | null;
  cta_text: string | null;
  cta_url: string | null;
  link_url: string | null;
  start_at: string | null;
  end_at: string | null;
  asset_id: string;
  media_type: 'image' | 'video';
  source: 'upload' | 'official';
  external_url: string | null;
  storage_bucket: string | null;
  storage_path: string | null;
  title: string | null;
  alt_text: string | null;
  meta: unknown;
};

export function isWithinWindow(now: Date, startAt: string | null, endAt: string | null) {
  const start = startAt ? new Date(startAt) : null;
  const end = endAt ? new Date(endAt) : null;
  if (start && Number.isNaN(start.getTime())) return false;
  if (end && Number.isNaN(end.getTime())) return false;
  if (start && now < start) return false;
  if (end && now >= end) return false;
  return true;
}

export function pickActiveHeroPublicSlots(slots: HeroPublicSlot[], now = new Date()): HeroPublicSlot[] {
  return slots
    .filter((s) => isWithinWindow(now, s.start_at, s.end_at))
    .slice()
    .sort((a, b) => a.display_order - b.display_order);
}

