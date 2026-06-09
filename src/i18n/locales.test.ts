import { describe, expect, it } from "vitest";
import { isRtlLocale, normalizeLocale } from "./locales";

describe("normalizeLocale", () => {
  it("maps browser variants", () => {
    expect(normalizeLocale("zh")).toBe("zh-CN");
    expect(normalizeLocale("zh-CN")).toBe("zh-CN");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("pt")).toBe("pt-BR");
  });
});

describe("isRtlLocale", () => {
  it("returns true for RTL locales", () => {
    expect(isRtlLocale("ar")).toBe(true);
    expect(isRtlLocale("ur")).toBe(true);
    expect(isRtlLocale("zh-CN")).toBe(false);
    expect(isRtlLocale("en")).toBe(false);
  });
});