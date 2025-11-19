import { create } from 'zustand';

export const useModalStore = create((set, get) => ({
  alertData: { isOpen: false, message: '' },
  confirmData: { isOpen: false, message: '', resolver: null },

  showAlert: (message) => {
    set({ alertData: { isOpen: true, message } });
  },

  closeAlert: () => {
    set({ alertData: { isOpen: false, message: '' } });
  },

  showConfirm: (message) => {
    return new Promise((resolve) => {
      set({
        confirmData: {
          isOpen: true,
          message,
          resolver: resolve
        }
      });
    });
  },

  confirmYes: () => {
    const { confirmData } = get();
    if (confirmData.resolver) {
      confirmData.resolver(true);
    }
    set({
      confirmData: { isOpen: false, message: '', resolver: null }
    });
  },

  confirmNo: () => {
    const { confirmData } = get();
    if (confirmData.resolver) {
      confirmData.resolver(false);
    }
    set({
      confirmData: { isOpen: false, message: '', resolver: null }
    });
  }
}));