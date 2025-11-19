import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { downloadFile } from '../../utils/helpers';
import NoticeModal from '../modals/NoticeModal';

function NoticeManagement() {
  const { notices, deleteNotice } = useAppContext();
  const [filter, setFilter] = useState('전체');
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [editingNotice, setEditingNotice] = useState(null);
  const [showNoticePreview, setShowNoticePreview] = useState(null);

  const getFilteredNotices = () => {
    if (filter === '전체') return notices;
    return notices.filter(n => n.field === filter);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-3xl font-bold">공지사항 관리</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="전체">전체</option>
            <option value="공통">공통</option>
            <option value="바이오 분야">바이오 분야</option>
            <option value="반도체 분야">반도체 분야</option>
            <option value="물류 분야">물류 분야</option>
          </select>
        </div>
        <button
          onClick={() => {
            setEditingNotice(null);
            setShowNoticeModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 공지사항 등록
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">번호</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">제목</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">대상</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">작성일</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">조회수</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getFilteredNotices().map(notice => (
                <tr key={notice.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4">{notice.id}</td>
                  <td className="px-6 py-4 font-medium">{notice.title}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                      {notice.field}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{notice.date}</td>
                  <td className="px-6 py-4 text-gray-600">{notice.views}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => setShowNoticePreview(notice)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      >
                        미리보기
                      </button>
                      <button
                        onClick={() => {
                          setEditingNotice(notice);
                          setShowNoticeModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => deleteNotice(notice.id)}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showNoticeModal && (
        <NoticeModal
          editingNotice={editingNotice}
          onClose={() => {
            setShowNoticeModal(false);
            setEditingNotice(null);
          }}
        />
      )}

      {showNoticePreview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowNoticePreview(null)}
        >
          <div 
            className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">{showNoticePreview.title}</h2>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>{showNoticePreview.author}</span>
                <span>{showNoticePreview.date}</span>
                <span>조회 {showNoticePreview.views}</span>
                <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                  {showNoticePreview.field}
                </span>
              </div>
            </div>

            <div className="mb-6">
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {showNoticePreview.content}
              </div>
            </div>

            {showNoticePreview.images && showNoticePreview.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">이미지</h3>
                <div className="space-y-4">
                  {showNoticePreview.images.map((image, idx) => (
                    <img 
                      key={idx}
                      src={image.url} 
                      alt={image.name}
                      className="w-full rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {showNoticePreview.files && showNoticePreview.files.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">첨부파일</h3>
                <div className="space-y-2">
                  {showNoticePreview.files.map((file, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between bg-blue-50 p-4 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors border-2 border-blue-200"
                      onClick={() => downloadFile(file.url, file.name)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-600 text-2xl">📥</span>
                        <span className="text-sm font-semibold">{file.name}</span>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => setShowNoticePreview(null)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NoticeManagement;