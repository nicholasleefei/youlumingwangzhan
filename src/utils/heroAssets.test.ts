import { describe, expect, it } from 'vitest';
import { isWithinWindow, pickActiveHeroPublicSlots, type HeroPublicSlot } from './heroAssets';

describe('heroAssets', () => {
  it('isWithinWindow handles open ranges', () => {
    const now = new Date('2026-05-02T10:00:00Z');
    expect(isWithinWindow(now, null, null)).toBe(true);
    expect(isWithinWindow(now, '2026-05-02T09:00:00Z', null)).toBe(true);
    expect(isWithinWindow(now, null, '2026-05-02T11:00:00Z')).toBe(true);
  });

  it('isWithinWindow rejects invalid dates', () => {
    const now = new Date('2026-05-02T10:00:00Z');
    expect(isWithinWindow(now, 'invalid', null)).toBe(false);
    expect(isWithinWindow(now, null, 'invalid')).toBe(false);
  });

  it('pickActiveHeroPublicSlots filters by time and sorts by display_order', () => {
    const now = new Date('2026-05-02T10:00:00Z');
    const base: Omit<HeroPublicSlot, 'slot_id' | 'display_order' | 'start_at' | 'end_at'> = {
      headline: null,
      subheadline: null,
      cta_text: null,
      cta_url: null,
      link_url: null,
      asset_id: 'a',
      media_type: 'image',
      source: 'upload',
      external_url: 'https://example.com/a.jpg',
      storage_bucket: null,
      storage_path: null,
      title: null,
      alt_text: null,
      meta: {},
    };

    const slots: HeroPublicSlot[] = [
      { ...base, slot_id: '2', display_order: 2, start_at: null, end_at: null },
      { ...base, slot_id: '1', display_order: 1, start_at: '2026-05-02T09:00:00Z', end_at: '2026-05-02T10:00:00Z' },
      { ...base, slot_id: '3', display_order: 3, start_at: '2026-05-02T09:00:00Z', end_at: '2026-05-02T11:00:00Z' },
    ];

    const active = pickActiveHeroPublicSlots(slots, now);
    expect(active.map((s) => s.slot_id)).toEqual(['2', '3']);
  });
});

