import { beforeEach, describe, expect, it, vi } from "vitest";

type QueryState = {
  table: string;
  ops: Array<{ op: string; [k: string]: any }>;
};

type QueryResult = { data: any; error: any };

let handler: (state: QueryState) => QueryResult;
const calls: QueryState[] = [];

const supabase = {
  from(table: string) {
    const state: QueryState = { table, ops: [] };
    calls.push(state);

    const builder: any = {
      select(sel: string) {
        state.ops.push({ op: "select", sel });
        return builder;
      },
      eq(col: string, val: any) {
        state.ops.push({ op: "eq", col, val });
        return builder;
      },
      in(col: string, vals: any[]) {
        state.ops.push({ op: "in", col, vals });
        return builder;
      },
      order(col: string, opts: any) {
        state.ops.push({ op: "order", col, opts });
        return builder;
      },
      limit(n: number) {
        state.ops.push({ op: "limit", n });
        return builder;
      },
      then(onFulfilled: any, onRejected: any) {
        try {
          return Promise.resolve(handler(state)).then(onFulfilled, onRejected);
        } catch (e) {
          return Promise.reject(e).then(onFulfilled, onRejected);
        }
      },
    };

    return builder;
  },
};

vi.mock("./supabaseClient", () => ({ supabase }));

describe("inquiry data wiring", () => {
  beforeEach(() => {
    calls.length = 0;
    handler = () => ({ data: [], error: null });
    vi.resetModules();
  });

  it("listModelsByIds reads model_details for inquiry display", async () => {
    handler = (q) => {
      if (q.table === "model_details") {
        return {
          data: [
            {
              model_id: "m1",
              name: "问界M7",
              yeartype: "2026款",
              brandname: "AITO",
              parentname: "问界M7",
              activity_status: 0,
            },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    };

    const { listModelsByIds } = await import("./db");
    const items = await listModelsByIds({ ids: ["m1"], locale: "en" as any });

    expect(items).toHaveLength(1);
    expect(items[0].display_name).toBe("2026款 问界M7");
    expect(items[0].series_name).toBe("问界M7");
    expect(items[0].brand).toBe("AITO");
    expect(calls.some((c) => c.table === "model_details")).toBe(true);
  });

  it("listModelsBySeriesId reads ids from models_jumdata by series_id", async () => {
    handler = (q) => {
      if (q.table === "models_jumdata") {
        const hasSeriesFilter = q.ops.some((op) => op.op === "eq" && op.col === "series_id" && op.val === "s1");
        const hasStatusFilter = q.ops.some((op) => op.op === "eq" && op.col === "activity_status" && op.val === 0);
        if (hasSeriesFilter && hasStatusFilter) {
          return { data: [{ id: "m1" }, { id: "m2" }], error: null };
        }
        return { data: [], error: null };
      }
      if (q.table === "model_details") {
        return {
          data: [
            { model_id: "m1", name: "M1", yeartype: null, brandname: "B1", parentname: "S1", activity_status: 0 },
            { model_id: "m2", name: "M2", yeartype: null, brandname: "B1", parentname: "S1", activity_status: 0 },
          ],
          error: null,
        };
      }
      return { data: [], error: null };
    };

    const { listModelsBySeriesId } = await import("./db");
    const items = await listModelsBySeriesId({ seriesId: "s1", locale: "en" as any });

    expect(items).toHaveLength(2);
    const jumdataCalls = calls.filter((c) => c.table === "models_jumdata");
    expect(jumdataCalls.length).toBeGreaterThan(0);
    expect(
      jumdataCalls.some(
        (c) => c.ops.some((op) => op.op === "eq" && op.col === "series_id" && op.val === "s1") && c.ops.some((op) => op.op === "eq" && op.col === "activity_status" && op.val === 0)
      )
    ).toBe(true);
  });

  it("listSeriesByIds reads series rows for inquiry display", async () => {
    handler = (q) => {
      if (q.table === "series") {
        return { data: [{ id: "s1", name: "S1", fullname: "Series One", brand_name: "BrandOne" }], error: null };
      }
      return { data: [], error: null };
    };

    const { listSeriesByIds } = await import("./db");
    const items = await listSeriesByIds({ ids: ["s1"] });
    expect(items).toHaveLength(1);
    expect(items[0].fullname).toBe("Series One");
    expect(items[0].brand_name).toBe("BrandOne");
    expect(calls.some((c) => c.table === "series")).toBe(true);
  });
});
