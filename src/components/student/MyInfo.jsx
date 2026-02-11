import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

function MyInfo() {
  const { currentUser } = useAppContext();
  const [showModal, setShowModal] = useState(false);

  if (!currentUser) return <div>로딩 중...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">내 정보</h2>

      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">기본 정보</h3>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            📋 개인정보활용동의
          </button>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">학번</p>
            <p className="font-semibold">{currentUser.studentId}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">이름</p>
            <p className="font-semibold">{currentUser.name}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">학과</p>
            <p className="font-semibold">{currentUser.department}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">분야</p>
            <p className="font-semibold">{currentUser.field}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">이메일</p>
            <p className="font-semibold">{currentUser.email || 'thsgmdals@naver.net'}</p>
          </div>
        </div>
      </div>

      {/* 학생성공지수 */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-xl font-bold mb-6">학생성공지수</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">총점</p>
            <p className="text-4xl font-bold text-blue-600">10</p>
            <p className="text-xs text-gray-500 mt-1">/ 100점</p>
          </div>
        </div>
      </div>

      {/* 모달 */}
      {showModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-xl p-8 max-w-2xl w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">개인정보활용동의</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700 text-3xl"
              >
                ×
              </button>
            </div>
            <div className="py-20 text-center">
              <p className="text-gray-500 text-xl">모달 내용</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyInfo;
