import { describe, expect, it } from "vitest";
import { flattenParams } from "./paramFlatten";

describe("flattenParams", () => {
  it("flattens nested objects and arrays", () => {
    const input = {
      basic: { price: "10", empty: " " },
      body: { size: { len: 1, width: 2 } },
      arr: ["a", { b: true }],
      n: null,
    };

    const out = flattenParams(input, { maxItems: 50, maxDepth: 6 });
    const map = new Map(out.map((p) => [p.path, p.value]));

    expect(map.get("basic.price")).toBe("10");
    expect(map.has("basic.empty")).toBe(false);
    expect(map.get("body.size.len")).toBe("1");
    expect(map.get("body.size.width")).toBe("2");
    expect(map.get("arr[0]")).toBe("a");
    expect(map.get("arr[1].b")).toBe("true");
  });
});

