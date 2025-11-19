import React from 'react';

function NoticeDetailModal({ isOpen, onClose, notice }) {
  if (!isOpen || !notice) return null;

  const handleFileDownload = (file) => {
    try {
      // 파일 데이터가 있는 경우
      if (file.data) {
        // File 객체인 경우
        if (file.data instanceof File) {
          const url = window.URL.createObjectURL(file.data);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        } 
        // Base64나 다른 형식의 데이터인 경우
        else {
          const blob = new Blob([file.data], { type: file.type || 'application/octet-stream' });
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.name;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      } else {
        alert('파일을 다운로드할 수 없습니다. 파일 데이터가 없습니다.');
      }
    } catch (error) {
      console.error('파일 다운로드 오류:', error);
      alert('파일 다운로드 중 오류가 발생했습니다.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{notice.title}</h2>
              <div className="flex items-center gap-4 text-sm text-blue-100">
                <span>작성자: {notice.author}</span>
                <span>작성일: {notice.date}</span>
                <span>조회수: {notice.views}</span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors ml-4"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6">
          {/* 분야 배지 */}
          <div className="mb-6">
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              notice.field === '바이오' ? 'bg-green-100 text-green-800' :
              notice.field === '반도체' ? 'bg-blue-100 text-blue-800' :
              notice.field === '물류' ? 'bg-purple-100 text-purple-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {notice.field}
            </span>
          </div>

          {/* 이미지 */}
          {notice.imageUrl && (
            <div className="mb-6">
              <img
                src={notice.imageUrl}
                alt={notice.title}
                className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* 본문 */}
          <div className="prose max-w-none mb-6">
            <div className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {notice.content}
            </div>
          </div>

          {/* 첨부파일 */}
          {notice.attachedFiles && notice.attachedFiles.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">첨부파일</h3>
              <div className="space-y-2">
                {notice.attachedFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg hover:bg-gray-100 transition-colors">
                    <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <button 
                      onClick={() => handleFileDownload(file)}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      다운로드
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 rounded-b-2xl border-t border-gray-200">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoticeDetailModal;