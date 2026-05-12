import type { mergeModelImages } from "@/utils/resourceOverview";

export type DbBrand = { id: string; jm_id: number; name: string; activity_status: number | null };
export type DbSeries = { id: string; jm_id: number; brand_jm_id: number; name: string; activity_status: number | null };
export type DbModel = { id: string; jm_id: number; series_jm_id: number; brand_jm_id: number; name: string; activity_status: number | null };

export type NodeType = "brand" | "series" | "model";
export type NodeKey = `${NodeType}:${string}`;

export type ModelImageStats = ReturnType<typeof mergeModelImages>;

export function nodeKey(type: NodeType, id: string): NodeKey {
  return `${type}:${id}`;
}

