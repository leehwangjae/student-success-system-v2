import React from 'react';
import { useModalStore } from '../../hooks/useModal';

function AlertModal() {
  const { alertData, closeAlert } = useModalStore();

  if (!alertData.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">알림</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{alertData.message}</p>
        <button
          onClick={closeAlert}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          확인
        </button>
      </div>
    </div>
  );
}

export default AlertModal;