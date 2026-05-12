import { create } from "zustand";

type InquiryModalState = {
  open: boolean;
  openModal: () => void;
  closeModal: () => void;
};

export const useInquiryModal = create<InquiryModalState>((set) => ({
  open: false,
  openModal: () => set({ open: true }),
  closeModal: () => set({ open: false }),
}));

