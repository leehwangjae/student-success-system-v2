import React from 'react';

function NoticeDetailModal({ isOpen, onClose, notice }) {
  if (!isOpen || !notice) return null;

  // 파일 다운로드 핸들러 (바이너리 무결성 보장)
  const downloadBase64File = (fileObj) => {
    try {
      console.log('📥 파일 다운로드 시작:', fileObj.name, 'Type:', fileObj.type);

      let base64Data = fileObj.data;

      // data가 객체인 경우 처리
      if (typeof base64Data === 'object' && base64Data !== null) {
        if (base64Data.data) {
          base64Data = base64Data.data;
        } else {
          console.error('❌ Base64 데이터를 찾을 수 없음');
          alert('파일 데이터를 찾을 수 없습니다.');
          return;
        }
      }

      if (typeof base64Data !== 'string') {
        console.error('❌ Base64 데이터가 문자열이 아님');
        alert('파일 데이터 형식이 올바르지 않습니다.');
        return;
      }

      // Data URL을 직접 사용 (가장 안전한 방법)
      // FileReader.readAsDataURL()로 생성된 데이터를 그대로 사용
      if (base64Data.startsWith('data:')) {
        console.log('✅ Data URL 직접 사용 (무손실)');
        const link = document.createElement('a');
        link.href = base64Data;
        link.download = fileObj.name;
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();

        setTimeout(() => {
          document.body.removeChild(link);
        }, 100);

        console.log('✅ 파일 다운로드 완료');
        return;
      }

      // Data URL이 아닌 경우 (레거시 처리)
      console.warn('⚠️ 레거시 Base64 데이터 감지, 변환 시도');
      const base64Match = base64Data.match(/base64,(.+)/);
      const cleanBase64 = base64Match ? base64Match[1] : base64Data;

      // Base64를 바이너리로 안전하게 변환
      const binaryString = atob(cleanBase64);
      const bytes = new Uint8Array(binaryString.length);

      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }

      // Blob 생성
      const mimeType = fileObj.type || 'application/octet-stream';
      const blob = new Blob([bytes], { type: mimeType });

      console.log('📊 Blob 생성:', blob.size, 'bytes, MIME:', mimeType);

      // 다운로드
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.href = url;
      link.download = fileObj.name;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }, 100);

      console.log('✅ 파일 다운로드 완료');
    } catch (error) {
      console.error('❌ 파일 다운로드 실패:', error);
      alert('파일 다운로드에 실패했습니다: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <h2 className="text-2xl font-bold mb-2">{notice.title}</h2>
              <div className="flex gap-3 text-sm">
                <span className={`px-3 py-1 rounded-full font-semibold ${
                  notice.field === '바이오' ? 'bg-green-100 text-green-800' :
                  notice.field === '반도체' ? 'bg-blue-100 text-blue-800' :
                  notice.field === '물류' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {notice.field}
                </span>
                <span className="px-3 py-1 rounded-full font-semibold bg-white text-blue-600">
                  조회 {notice.views}회
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold leading-none ml-4"
            >
              ×
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 작성 정보 */}
          <div className="flex justify-between items-center text-sm text-gray-600 pb-4 border-b border-gray-200">
            <span>작성자: <span className="font-semibold text-gray-800">{notice.author}</span></span>
            <span>{notice.date}</span>
          </div>

          {/* 이미지 */}
          {notice.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={notice.imageUrl} 
                alt={notice.title}
                className="w-full max-h-96 object-contain bg-gray-100"
              />
            </div>
          )}

          {/* 공지사항 내용 */}
          <div>
            <div className="bg-gray-50 p-6 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                {notice.content}
              </p>
            </div>
          </div>

          {/* 첨부 파일 */}
          {notice.attachedFiles && notice.attachedFiles.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">첨부 파일</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {notice.attachedFiles.map((file, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">📎</span>
                      <div>
                        <p className="font-medium text-gray-800">{file.name || `파일 ${index + 1}`}</p>
                        <p className="text-xs text-gray-500">{file.type}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => downloadBase64File(file)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
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
            className="w-full px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default NoticeDetailModal;