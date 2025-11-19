import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useModalStore } from '../../hooks/useModal';

function ProgramDetailModal({ isOpen, onClose, program }) {
  const { currentUser, applyForProgram, programApplications } = useAppContext();
  const { showAlert } = useModalStore();

  // 파일 첨부 상태
  const [uploadedFiles, setUploadedFiles] = useState([]);

  if (!isOpen || !program) return null;

  // 학생인 경우에만 신청 관련 로직 처리
  const isStudent = currentUser?.role === 'student';
  
  const existingApplication = isStudent 
    ? programApplications.find(
        app => app.programId === program.id && app.studentId === currentUser.id
      )
    : null;

  // 파일 업로드 핸들러
  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      data: file
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  // 파일 제거 핸들러
  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  // 신청하기 핸들러
  const handleApply = () => {
    // 파일 첨부가 필요한데 파일이 없는 경우
    if (program.requiresFile && uploadedFiles.length === 0) {
      showAlert('이 프로그램은 파일 첨부가 필수입니다.');
      return;
    }

    const success = applyForProgram(program.id, uploadedFiles);
    if (success) {
      showAlert('프로그램 신청이 완료되었습니다.');
      setUploadedFiles([]);
      onClose();
    } else {
      showAlert('이미 신청한 프로그램입니다.');
    }
  };

  const handleFileDownload = (file) => {
    // Base64 데이터나 실제 파일 데이터 다운로드
    if (file.data) {
      const blob = new Blob([file.data], { type: file.type });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } else {
      showAlert('파일 다운로드 준비 중입니다.');
    }
  };

  const getStatusBadge = () => {
    const statusStyles = {
      '모집중': 'bg-green-100 text-green-800',
      '진행중': 'bg-blue-100 text-blue-800',
      '종료': 'bg-gray-100 text-gray-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusStyles[program.status]}`}>
        {program.status}
      </span>
    );
  };

  const getCategoryBadge = () => {
    const categoryStyles = {
      '비교과': 'bg-purple-100 text-purple-800',
      '산학협력': 'bg-orange-100 text-orange-800',
      '교과': 'bg-blue-100 text-blue-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${categoryStyles[program.category]}`}>
        {program.category}
      </span>
    );
  };

  const getFieldBadge = () => {
    const fieldStyles = {
      '바이오': 'bg-green-100 text-green-800',
      '반도체': 'bg-blue-100 text-blue-800',
      '물류': 'bg-purple-100 text-purple-800'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${fieldStyles[program.field]}`}>
        {program.field}
      </span>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <div className="flex-1">
            <h2 className="text-2xl font-bold mb-2">{program.title}</h2>
            <div className="flex items-center gap-2">
              {getStatusBadge()}
              {getCategoryBadge()}
              {getFieldBadge()}
              <span className="px-3 py-1 bg-white bg-opacity-20 rounded-full text-sm font-semibold">
                {program.score}점
              </span>
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

        {/* 내용 */}
        <div className="p-6 space-y-6">
          {/* 프로그램 이미지 */}
          {program.imageUrl && (
            <div className="mb-6">
              <img
                src={program.imageUrl}
                alt={program.title}
                className="w-full max-h-96 object-contain rounded-lg border border-gray-200"
              />
            </div>
          )}

          {/* 프로그램 정보 */}
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
          </div>

          {/* 프로그램 설명 */}
          <div>
            <h3 className="text-lg font-bold text-gray-800 mb-3">프로그램 설명</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-gray-700 whitespace-pre-wrap">{program.description}</p>
            </div>
          </div>

          {/* 첨부파일 (프로그램 관련) */}
          {program.attachedFiles && program.attachedFiles.length > 0 && (
            <div className="border-t border-gray-200 pt-6">
              <h3 className="text-lg font-bold text-gray-800 mb-3">첨부파일</h3>
              <div className="space-y-2">
                {program.attachedFiles.map(file => (
                  <div key={file.id} className="flex items-center gap-3 bg-gray-50 p-3 rounded-lg">
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
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                    >
                      다운로드
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 학생인 경우에만 신청 섹션 표시 */}
          {isStudent && (
            <>
              {/* 파일 첨부 필요 알림 */}
              {program.requiresFile && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <p className="text-sm text-yellow-800 font-medium">
                      ⚠️ 이 프로그램은 관련 파일 첨부가 필수입니다.
                    </p>
                  </div>
                </div>
              )}

              {/* 파일 첨부 섹션 (신청하지 않았고 모집중일 때만) */}
              {!existingApplication && program.status === '모집중' && program.requiresFile && (
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-bold text-gray-800 mb-3">📎 신청 파일 첨부</h3>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                    <label className="flex flex-col items-center justify-center cursor-pointer">
                      <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                      </svg>
                      <span className="text-sm text-gray-600">파일 선택 (클릭하여 업로드)</span>
                      <input
                        type="file"
                        multiple
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>

                    {uploadedFiles.length > 0 && (
                      <div className="mt-4 space-y-2">
                        <p className="text-sm font-semibold text-gray-700 mb-2">첨부된 파일:</p>
                        {uploadedFiles.map(file => (
                          <div key={file.id} className="flex items-center justify-between bg-blue-50 p-3 rounded">
                            <div className="flex items-center gap-2">
                              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="text-sm font-medium text-gray-700">{file.name}</p>
                                <p className="text-xs text-gray-500">
                                  {(file.size / 1024).toFixed(1)} KB
                                </p>
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="text-red-600 hover:text-red-800"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 신청 상태 표시 */}
              {existingApplication ? (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <div>
                        <p className="text-sm font-semibold text-blue-800">신청 완료</p>
                        <p className="text-xs text-blue-600">
                          신청일: {existingApplication.appliedDate} | 
                          상태: {
                            existingApplication.status === 'pending' ? '대기중' :
                            existingApplication.status === 'approved' ? '승인됨' :
                            existingApplication.status === 'completed' ? '완료' : '거부됨'
                          }
                        </p>
                      </div>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      existingApplication.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      existingApplication.status === 'approved' ? 'bg-green-100 text-green-800' :
                      existingApplication.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {existingApplication.status === 'pending' ? '심사중' :
                       existingApplication.status === 'approved' ? '승인' :
                       existingApplication.status === 'completed' ? '완료' : '거부'}
                    </span>
                  </div>
                </div>
              ) : program.status === '모집중' ? (
                <button
                  onClick={handleApply}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-4 rounded-lg font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
                >
                  신청하기
                </button>
              ) : (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 text-center">
                  <p className="text-gray-600">현재 신청할 수 없는 프로그램입니다.</p>
                </div>
              )}
            </>
          )}

          {/* 관리자인 경우 정보만 표시 */}
          {!isStudent && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <p className="text-sm text-gray-600 text-center">
                관리자 모드: 프로그램 상세 정보 조회
              </p>
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

export default ProgramDetailModal;