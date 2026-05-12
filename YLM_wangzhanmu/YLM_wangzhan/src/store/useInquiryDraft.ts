import { create } from "zustand";
import { persist } from "zustand/middleware";

type InquiryDraftState = {
  selectedModelIds: string[];
  toggleModelId: (id: string) => void;
  removeModelId: (id: string) => void;
  clear: () => void;
  setSelected: (ids: string[]) => void;
};

export const useInquiryDraft = create<InquiryDraftState>()(
  persist(
    (set) => ({
      selectedModelIds: [],
      toggleModelId: (id) =>
        set((s) => {
          const normalizedId = String(id || "").trim();
          if (!normalizedId) return s;
          const has = s.selectedModelIds.includes(normalizedId);
          return {
            selectedModelIds: has ? s.selectedModelIds.filter((x) => x !== normalizedId) : [...s.selectedModelIds, normalizedId],
          };
        }),
      removeModelId: (id) =>
        set((s) => {
          const normalizedId = String(id || "").trim();
          if (!normalizedId) return s;
          return { selectedModelIds: s.selectedModelIds.filter((x) => x !== normalizedId) };
        }),
      clear: () => set({ selectedModelIds: [] }),
      setSelected: (ids) => set({ selectedModelIds: Array.from(new Set((ids ?? []).map((x) => String(x || "").trim()).filter(Boolean))) }),
    }),
    {
      name: "ylm_inquiry_draft_v1",
      partialize: (s) => ({ selectedModelIds: s.selectedModelIds }),
    }
  )
);
