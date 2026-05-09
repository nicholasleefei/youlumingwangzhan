import { describe, expect, it } from "vitest";
import { isRtlLocale, normalizeLocale } from "./locales";

describe("normalizeLocale", () => {
  it("maps browser variants", () => {
    expect(normalizeLocale("zh")).toBe("zh-CN");
    expect(normalizeLocale("zh-CN")).toBe("zh-CN");
    expect(normalizeLocale("en-US")).toBe("en");
    expect(normalizeLocale("iw")).toBe("he");
  });
});

describe("isRtlLocale", () => {
  it("returns true for RTL locales", () => {
    expect(isRtlLocale("ar")).toBe(true);
    expect(isRtlLocale("fa")).toBe(true);
    expect(isRtlLocale("he")).toBe(true);
    expect(isRtlLocale("zh-CN")).toBe(false);
  });
});
