import { describe, expect, it } from "vitest";
import { selectionRange } from "./selectionRange";

describe("selectionRange", () => {
  it("returns empty when endpoints missing", () => {
    expect(selectionRange(["a", "b"], "a", "x")).toEqual([]);
  });

  it("returns inclusive range forward", () => {
    expect(selectionRange(["a", "b", "c", "d"], "b", "d")).toEqual(["b", "c", "d"]);
  });

  it("returns inclusive range backward", () => {
    expect(selectionRange(["a", "b", "c", "d"], "d", "b")).toEqual(["b", "c", "d"]);
  });
});

