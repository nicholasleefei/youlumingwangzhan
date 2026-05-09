import { create } from "zustand";

type InquiryDraftState = {
  selectedModelIds: string[];
  toggleModelId: (id: string) => void;
  removeModelId: (id: string) => void;
  clear: () => void;
  setSelected: (ids: string[]) => void;
};

export const useInquiryDraft = create<InquiryDraftState>((set) => ({
  selectedModelIds: [],
  toggleModelId: (id) =>
    set((s) => {
      const has = s.selectedModelIds.includes(id);
      return { selectedModelIds: has ? s.selectedModelIds.filter((x) => x !== id) : [...s.selectedModelIds, id] };
    }),
  removeModelId: (id) => set((s) => ({ selectedModelIds: s.selectedModelIds.filter((x) => x !== id) })),
  clear: () => set({ selectedModelIds: [] }),
  setSelected: (ids) => set({ selectedModelIds: [...new Set(ids)] }),
}));

