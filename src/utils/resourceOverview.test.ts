import { describe, expect, it } from "vitest";
import { countSeriesVrImages, mergeModelEffectiveCategories, mergeModelImages } from "./resourceOverview";

describe("mergeModelImages", () => {
  it("prefers car_pictures when category exists", () => {
    const car = new Map<string, number>([
      ["exterior", 2],
      ["interior", 1],
    ]);
    const cfg = {
      model_jm_id: 1,
      exterior_images: ["a", "b", "c"],
      interior_images: ["d"],
      official_images: ["e"],
    };
    const out = mergeModelImages({ carPictureCounts: car, cfg });
    expect(out.exterior).toEqual({ count: 2, source: "car_pictures" });
    expect(out.interior).toEqual({ count: 1, source: "car_pictures" });
    expect(out.official).toEqual({ count: 1, source: "model_image_config" });
    expect(out.total).toBe(4);
    expect(out.hasAny).toBe(true);
  });

  it("falls back to model_image_config only when car_pictures missing", () => {
    const car = new Map<string, number>();
    const cfg = {
      model_jm_id: 1,
      exterior_images: ["a", ""],
      interior_images: null,
      official_images: ["b"],
    };
    const out = mergeModelImages({ carPictureCounts: car, cfg });
    expect(out.exterior).toEqual({ count: 1, source: "model_image_config" });
    expect(out.interior).toEqual({ count: 0, source: "none" });
    expect(out.official).toEqual({ count: 1, source: "model_image_config" });
    expect(out.total).toBe(2);
  });

  it("returns none when both sources empty", () => {
    const out = mergeModelImages({ carPictureCounts: undefined, cfg: undefined });
    expect(out.total).toBe(0);
    expect(out.hasAny).toBe(false);
    expect(out.exterior.source).toBe("none");
    expect(out.interior.source).toBe("none");
    expect(out.official.source).toBe("none");
  });
});

describe("countSeriesVrImages", () => {
  it("counts exterior groups and images", () => {
    const cfg = {
      series_jm_id: 1,
      exterior_vr: [
        { id: "g1", color_name: "黑", images: ["a", "b"] },
        { id: "g2", color_name: "白", images: [] },
      ],
      interior_vr: [],
    };
    const out = countSeriesVrImages(cfg as any);
    expect(out.hasExterior).toBe(true);
    expect(out.exteriorGroupCount).toBe(1);
    expect(out.exteriorImageCount).toBe(2);
  });

  it("counts interior colors and images", () => {
    const cfg = {
      series_jm_id: 1,
      exterior_vr: [],
      interior_vr: [
        {
          id: "c1",
          color_name: "红",
          positions: [
            { id: "p1", position_name: "主驾", images: ["a"] },
            { id: "p2", position_name: "副驾", images: [] },
          ],
        },
        {
          id: "c2",
          color_name: "蓝",
          positions: [{ id: "p3", position_name: "后排", images: ["b", "c"] }],
        },
      ],
    };
    const out = countSeriesVrImages(cfg as any);
    expect(out.hasInterior).toBe(true);
    expect(out.interiorColorCount).toBe(2);
    expect(out.interiorImageCount).toBe(3);
  });
});

describe("mergeModelEffectiveCategories", () => {
  it("uses car_pictures categories when available", () => {
    const car = new Map<string, number>([
      ["exterior", 2],
      ["detail", 1],
      ["official", 0],
    ]);
    const out = mergeModelEffectiveCategories({ carPictureCounts: car, cfg: { model_jm_id: 1, exterior_images: ["x"] } as any });
    expect(out.source).toBe("car_pictures");
    expect(out.total).toBe(3);
    expect(out.categories.exterior).toBe(2);
    expect(out.categories.detail).toBe(1);
    expect(out.categories).not.toHaveProperty("official");
  });

  it("falls back to model_image_config when no car pictures", () => {
    const out = mergeModelEffectiveCategories({
      carPictureCounts: new Map<string, number>([["exterior", 0]]),
      cfg: { model_jm_id: 1, exterior_images: ["a", "b"], interior_images: [], official_images: ["c"] } as any,
    });
    expect(out.source).toBe("model_image_config");
    expect(out.total).toBe(3);
    expect(out.categories.exterior).toBe(2);
    expect(out.categories.official).toBe(1);
  });
});
