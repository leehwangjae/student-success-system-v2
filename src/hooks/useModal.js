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

  showConfirm: (message, callback) => {
    console.log('🔔 showConfirm 호출:', { message, hasCallback: !!callback });
    
    if (callback) {
      // 콜백 방식 지원
      return new Promise((resolve) => {
        set({
          confirmData: {
            isOpen: true,
            message,
            resolver: (result) => {
              console.log('✅ resolver 호출:', result);
              resolve(result);
              if (result) {
                console.log('✅ 콜백 실행!');
                callback();
              }
            }
          }
        });
      });
    } else {
      // Promise 방식
      return new Promise((resolve) => {
        set({
          confirmData: {
            isOpen: true,
            message,
            resolver: resolve
          }
        });
      });
    }
  },

  confirmYes: () => {
    console.log('🎯 confirmYes 호출됨!');
    const { confirmData } = get();
    console.log('confirmData:', confirmData);
    
    if (confirmData.resolver) {
      console.log('✅ resolver 실행 with true');
      confirmData.resolver(true);
    } else {
      console.log('❌ resolver가 없습니다!');
    }
    
    set({
      confirmData: { isOpen: false, message: '', resolver: null }
    });
  },

  confirmNo: () => {
    console.log('❌ confirmNo 호출됨!');
    const { confirmData } = get();
    if (confirmData.resolver) {
      confirmData.resolver(false);
    }
    set({
      confirmData: { isOpen: false, message: '', resolver: null }
    });
  }
}));