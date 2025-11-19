import React from 'react';
import { useModalStore } from '../../hooks/useModal';

function ConfirmModal() {
  const { confirmData, confirmYes, confirmNo } = useModalStore();

  if (!confirmData.isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-xl font-bold text-gray-800 mb-4">확인</h3>
        <p className="text-gray-600 mb-6 whitespace-pre-line">{confirmData.message}</p>
        <div className="flex gap-3">
          <button
            onClick={confirmNo}
            className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            취소
          </button>
          <button
            onClick={confirmYes}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            확인
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;