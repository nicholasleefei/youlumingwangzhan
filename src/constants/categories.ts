export type Category = "all" | "ev" | "sedan" | "suv" | "mpv" | "coupe" | "pickup" | "van" | "microvan" | "lightbus";

export const CATEGORIES: readonly Category[] = [
  "all",
  "ev",
  "sedan",
  "suv",
  "mpv",
  "coupe",
  "pickup",
  "van",
  "microvan",
  "lightbus",
] as const;

export const CATEGORY_TRANSLATION_KEYS: Record<Category, string> = {
  all: "category.all",
  ev: "category.ev",
  sedan: "category.sedan",
  suv: "category.suv",
  mpv: "category.mpv",
  coupe: "category.coupe",
  pickup: "category.pickup",
  van: "category.van",
  microvan: "category.microvan",
  lightbus: "category.lightbus",
};

export const CATEGORY_DEFAULT_LABELS: Record<Category, string> = {
  all: "全部",
  ev: "新能源",
  sedan: "轿车",
  suv: "SUV",
  mpv: "MPV",
  coupe: "跑车",
  pickup: "皮卡",
  van: "微面",
  microvan: "微卡",
  lightbus: "轻客",
};
