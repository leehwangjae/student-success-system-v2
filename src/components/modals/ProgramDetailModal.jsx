import React from 'react';

function ProgramDetailModal({ isOpen, onClose, program }) {
  if (!isOpen || !program) return null;

  // 🔥 Base64 파일 다운로드 핸들러 (수정됨)
  const downloadBase64File = (fileObj) => {
    try {
      console.log('📥 Base64 파일 다운로드 시작:', fileObj.name);
      console.log('📦 fileObj 전체 구조:', JSON.stringify(fileObj, null, 2));
      console.log('📦 fileObj.data 타입:', typeof fileObj.data);
      
      let base64Data;
      
      // data가 객체인 경우 (이중 JSON 파싱)
      if (typeof fileObj.data === 'object' && fileObj.data !== null) {
        console.log('⚠️ data가 객체임, 내부 구조 확인:', JSON.stringify(fileObj.data, null, 2));
        
        // data 객체 안에서 base64 문자열 찾기
        if (fileObj.data.data) {
          console.log('✅ data.data 발견');
          base64Data = typeof fileObj.data.data === 'string' ? fileObj.data.data : null;
        } else if (fileObj.data.base64) {
          console.log('✅ data.base64 발견');
          base64Data = fileObj.data.base64;
        } else {
          // 객체를 다시 문자열로 시도
          console.log('⚠️ 알려진 키가 없음, 전체 객체를 문자열로 변환 시도');
          const dataStr = JSON.stringify(fileObj.data);
          if (dataStr.includes('base64')) {
            console.log('✅ 객체에 base64 문자열 포함됨');
            base64Data = dataStr;
          }
        }
      }
      // data가 문자열인 경우 (정상)
      else if (typeof fileObj.data === 'string') {
        base64Data = fileObj.data;
        console.log('✅ data가 문자열, 길이:', base64Data.length);
      }
      
      if (!base64Data) {
        console.error('❌ Base64 데이터를 찾을 수 없음');
        alert('파일 데이터를 찾을 수 없습니다.');
        return;
      }
      
      // Base64 추출 (data:...;base64, 부분 제거)
      let cleanBase64;
      if (base64Data.includes(',')) {
        cleanBase64 = base64Data.split(',')[1];
        console.log('✅ Base64 추출 (쉼표 기준)');
      } else if (base64Data.includes('base64')) {
        cleanBase64 = base64Data.split('base64')[1];
        console.log('✅ Base64 추출 (base64 문자열 기준)');
      } else {
        cleanBase64 = base64Data;
        console.log('✅ 순수 Base64 데이터 사용');
      }
      
      console.log('🔍 정제된 Base64 데이터 길이:', cleanBase64.length);
      console.log('🔍 첫 50자:', cleanBase64.substring(0, 50));
      
      // Base64를 Blob으로 변환
      const byteCharacters = atob(cleanBase64);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: fileObj.type || 'application/octet-stream' });
      
      console.log('📊 Blob 생성 완료:', blob.size, 'bytes');
      
      // 다운로드 트리거
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = fileObj.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      console.log('✅ Base64 파일 다운로드 완료');
    } catch (error) {
      console.error('❌ Base64 파일 다운로드 실패:', error);
      console.error('❌ 에러 스택:', error.stack);
      alert('파일 다운로드에 실패했습니다: ' + error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl">
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-2xl font-bold mb-2">{program.title}</h2>
              <div className="flex gap-3 text-sm">
                <span className={`px-3 py-1 rounded-full font-semibold ${
                  program.status === '모집중' ? 'bg-green-100 text-green-800' :
                  program.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {program.status}
                </span>
                <span className={`px-3 py-1 rounded-full font-semibold ${
                  program.category === '비교과' ? 'bg-purple-100 text-purple-800' :
                  program.category === '산학협력' ? 'bg-orange-100 text-orange-800' :
                  'bg-blue-100 text-blue-800'
                }`}>
                  {program.category}
                </span>
                <span className={`px-3 py-1 rounded-full font-semibold ${
                  program.field === '바이오' ? 'bg-green-100 text-green-800' :
                  program.field === '반도체' ? 'bg-blue-100 text-blue-800' :
                  program.field === '물류' ? 'bg-purple-100 text-purple-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {program.field}
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
            >
              ×
            </button>
          </div>
        </div>

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 이미지 */}
          {program.imageUrl && (
            <div className="rounded-lg overflow-hidden">
              <img 
                src={program.imageUrl} 
                alt={program.title}
                className="w-full h-64 object-cover"
              />
            </div>
          )}

          {/* 기본 정보 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">신청 기간</p>
              <p className="font-semibold text-gray-800">
                {program.startDate} ~ {program.endDate}
              </p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">정원</p>
              <p className="font-semibold text-gray-800">{program.maxParticipants}명</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">점수</p>
              <p className="font-semibold text-blue-600 text-lg">{program.score}점</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">파일 첨부</p>
              <p className="font-semibold text-gray-800">
                {program.requiresFile ? '필수' : '선택'}
              </p>
            </div>
          </div>

          {/* 프로그램 설명 */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">프로그램 설명</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">
                {program.description || '설명이 없습니다.'}
              </p>
            </div>
          </div>

          {/* 첨부 파일 */}
          {program.attachedFiles && program.attachedFiles.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-800 mb-3">첨부 파일</h3>
              <div className="bg-gray-50 p-4 rounded-lg space-y-2">
                {program.attachedFiles.map((file, index) => (
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

export default ProgramDetailModal;