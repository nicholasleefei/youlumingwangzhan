import { describe, expect, it } from "vitest";
import { countStaged, type StagedItem } from "./stagedCrud";

describe("countStaged", () => {
  it("counts items by op", () => {
    const items: StagedItem[] = [
      { key: "1", op: "insert", tableName: "brands" },
      { key: "2", op: "update", tableName: "brands" },
      { key: "3", op: "delete", tableName: "brands" },
      { key: "4", op: "delete", tableName: "brands" },
    ];
    expect(countStaged(items)).toEqual({ insert: 1, update: 1, delete: 2, total: 4 });
  });
});

