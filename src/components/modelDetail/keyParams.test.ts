import { describe, expect, it } from "vitest";
import { buildKeyParams12 } from "./keyParams";

describe("buildKeyParams12", () => {
  it("returns 12 fixed items with best-effort values", () => {
    const model: any = {
      id: "m1",
      jm_id: 1,
      series_jm_id: null,
      name: "A",
      logo_url: null,
      yeartype: "2024款",
      price: "10万",
      salestate: null,
      sizetype: "SUV",
      displacement: "2.0",
      displacement2: null,
      geartype: "AT",
    };

    const details: any = {
      id: "d1",
      model_id: "m1",
      model_jm_id: 1,
      name: "A",
      yeartype: null,
      price: null,
      sizetype: null,
      seatnum: "5",
      drivemode: "AWD",
      displacement2: null,
      geartype: null,
      raw: {
        basic: { maxspeed: "180", officialaccelerationtime100: "6.0" },
        engine: { cltcmaxmileage: "520", batterycapacity: "80" },
        body: { wheelbase: "2800" },
      },
    };

    const out = buildKeyParams12(model, details);
    expect(out).toHaveLength(12);
    expect(out.map((x) => x.key)).toEqual([
      "yeartype",
      "price",
      "sizetype",
      "seatnum",
      "drivemode",
      "displacement",
      "geartype",
      "maxspeed",
      "acceleration_0_100",
      "cltc_range",
      "batterycapacity",
      "wheelbase",
    ]);

    const map = new Map(out.map((x) => [x.key, x.value] as const));
    expect(map.get("maxspeed")).toBe("180");
    expect(map.get("acceleration_0_100")).toBe("6.0");
    expect(map.get("cltc_range")).toBe("520");
    expect(map.get("batterycapacity")).toBe("80");
    expect(map.get("wheelbase")).toBe("2800");
  });

  it("keeps items but may return null values", () => {
    const model: any = { id: "m1", jm_id: 1, series_jm_id: null, name: "A" };
    const out = buildKeyParams12(model, null);
    expect(out).toHaveLength(12);
    expect(out.every((x) => "key" in x && "label" in x)).toBe(true);
  });
});

