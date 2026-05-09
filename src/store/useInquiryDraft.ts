import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type InquiryDraftState = {
  selectedModelIds: string[];
  toggleModelId: (id: string) => void;
  addModelIds: (ids: string[]) => void;
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
          const has = s.selectedModelIds.includes(id);
          return { selectedModelIds: has ? s.selectedModelIds.filter((x) => x !== id) : [...s.selectedModelIds, id] };
        }),
      addModelIds: (ids) =>
        set((s) => {
          const incoming = ids.map((x) => String(x || "").trim()).filter(Boolean);
          if (incoming.length === 0) return s;
          const setIds = new Set(s.selectedModelIds);
          for (const id of incoming) setIds.add(id);
          return { selectedModelIds: Array.from(setIds) };
        }),
      removeModelId: (id) => set((s) => ({ selectedModelIds: s.selectedModelIds.filter((x) => x !== id) })),
      clear: () => set({ selectedModelIds: [] }),
      setSelected: (ids) => set({ selectedModelIds: [...new Set(ids)] }),
    }),
    {
      name: "ylm_inquiry_draft_v1",
      storage: createJSONStorage(() => window.localStorage),
      partialize: (s) => ({ selectedModelIds: s.selectedModelIds }),
    }
  )
);

