import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { downloadFile } from '../../utils/helpers';

function NoticeList() {
  const { currentUser, notices } = useAppContext();
  const [showNoticeDetail, setShowNoticeDetail] = useState(null);

  const relevantNotices = notices.filter(n => n.field === currentUser.field || n.field === '공통');

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">공지사항</h2>
      
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">번호</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">제목</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">분야</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">작성일</th>
              <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">조회수</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {relevantNotices.map(notice => (
              <tr 
                key={notice.id} 
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setShowNoticeDetail(notice)}
              >
                <td className="px-6 py-4">{notice.id}</td>
                <td className="px-6 py-4 font-medium">{notice.title}</td>
                <td className="px-6 py-4">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {notice.field}
                  </span>
                </td>
                <td className="px-6 py-4 text-gray-600">{notice.date}</td>
                <td className="px-6 py-4 text-gray-600">{notice.views}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showNoticeDetail && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowNoticeDetail(null)}
        >
          <div 
            className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-2xl font-bold mb-4">{showNoticeDetail.title}</h2>
            <div className="flex items-center space-x-4 text-sm text-gray-600 mb-6">
              <span>{showNoticeDetail.author}</span>
              <span>{showNoticeDetail.date}</span>
              <span>조회 {showNoticeDetail.views}</span>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full">
                {showNoticeDetail.field}
              </span>
            </div>

            <div className="bg-gray-50 p-6 rounded-lg mb-6 whitespace-pre-wrap">
              {showNoticeDetail.content}
            </div>

            {showNoticeDetail.images && showNoticeDetail.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">이미지</h3>
                <div className="space-y-4">
                  {showNoticeDetail.images.map((image, idx) => (
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

            {showNoticeDetail.files && showNoticeDetail.files.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-bold mb-3">첨부파일</h3>
                <div className="space-y-2">
                  {showNoticeDetail.files.map((file, idx) => (
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
              onClick={() => setShowNoticeDetail(null)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              닫기
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default NoticeList;