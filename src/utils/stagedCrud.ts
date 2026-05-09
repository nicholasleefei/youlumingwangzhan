export type StagedOp = "insert" | "update" | "delete";

export type StagedItem = {
  key: string;
  op: StagedOp;
  tableName: "brands" | "series" | "models_jumdata" | "model_details" | "car_pictures";
  id?: string;
  data?: Record<string, any>;
  changes?: Record<string, any>;
};

export type StagedCounts = {
  insert: number;
  update: number;
  delete: number;
  total: number;
};

export function countStaged(items: StagedItem[]): StagedCounts {
  let insert = 0;
  let update = 0;
  let del = 0;
  for (const it of items) {
    if (it.op === "insert") insert++;
    else if (it.op === "update") update++;
    else del++;
  }
  return { insert, update, delete: del, total: insert + update + del };
}

export function stableJson(value: any): string {
  return JSON.stringify(value, Object.keys(value || {}).sort());
}
