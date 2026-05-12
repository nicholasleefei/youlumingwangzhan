export type MaterialResourceSection = "series-vr" | "model-images" | "overview";

export type MaterialResourceJump = {
  section: MaterialResourceSection;
  brandJmId: number;
  brandName?: string;
  seriesJmId?: number;
  seriesName?: string;
  modelJmId?: number;
  modelName?: string;
};

