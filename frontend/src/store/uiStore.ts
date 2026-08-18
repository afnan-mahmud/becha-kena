import { create } from 'zustand';

interface UiState {
  isMobileMenuOpen: boolean;
  isSearchOpen: boolean;
  activeModal: string | null;
  modalData: any;
  toggleMobileMenu: () => void;
  toggleSearch: () => void;
  openModal: (name: string, data?: any) => void;
  closeModal: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  isMobileMenuOpen: false,
  isSearchOpen: false,
  activeModal: null,
  modalData: null,

  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  
  toggleSearch: () => set((state) => ({ isSearchOpen: !state.isSearchOpen })),
  
  openModal: (name, data = null) => set({ activeModal: name, modalData: data }),
  
  closeModal: () => set({ activeModal: null, modalData: null }),
}));
