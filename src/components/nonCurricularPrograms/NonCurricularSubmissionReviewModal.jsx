import React, { useState, useMemo } from 'react';
import { SUBMISSION_STATUS_LABEL } from './constants';
import { formatDate, formatFileSize, downloadBase64File, groupProgramsByCategory } from '../../utils/nonCurricularHelpers';

function NonCurricularSubmissionReviewModal({ isOpen, onClose, submission, student, onApprove, onReject }) {
  const [decision, setDecision] = useState('approve'); // approve / reject
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState('split'); // split / list / document
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  if (!isOpen || !submission || !student) return null;

  const completedPrograms = submission.completedPrograms || [];
  const certificateFiles = submission.certificateFiles || [];
  const groupedPrograms = groupProgramsByCategory(completedPrograms);

  console.log('Review Modal - submission:', submission);
  console.log('Review Modal - certificateFiles:', certificateFiles);

  // 선택된 파일의 미리보기 URL 생성
  const previewUrl = useMemo(() => {
    if (!certificateFiles || certificateFiles.length === 0 || selectedFileIndex >= certificateFiles.length) {
      return null;
    }

    const file = certificateFiles[selectedFileIndex];
    if (!file || !file.fileName || !file.fileData) return null;

    const fileName = file.fileName.toLowerCase();
    let mimeType = '';

    if (fileName.endsWith('.pdf')) {
      mimeType = 'application/pdf';
    } else if (fileName.endsWith('.png')) {
      mimeType = 'image/png';
    } else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) {
      mimeType = 'image/jpeg';
    } else if (fileName.endsWith('.gif')) {
      mimeType = 'image/gif';
    } else {
      return null; // 지원하지 않는 형식
    }

    try {
      // base64 문자열에서 data URL prefix 제거
      const base64Data = file.fileData.includes('base64,')
        ? file.fileData.split('base64,')[1]
        : file.fileData;

      return `data:${mimeType};base64,${base64Data}`;
    } catch (error) {
      console.error('Preview URL 생성 실패:', error);
      return null;
    }
  }, [certificateFiles, selectedFileIndex]);

  const handleSubmit = async () => {
    if (decision === 'reject' && !rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      if (decision === 'approve') {
        await onApprove(submission.id);
      } else {
        await onReject(submission.id, rejectionReason);
      }
      onClose();
    } catch (error) {
      console.error('Review error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = (file) => {
    if (file && file.fileData && file.fileName) {
      downloadBase64File(file.fileData, file.fileName);
    }
  };

  const handleDownloadAll = () => {
    certificateFiles.forEach(file => {
      if (file && file.fileData && file.fileName) {
        downloadBase64File(file.fileData, file.fileName);
      }
    });
  };

  const renderProgramList = () => (
    <div className="space-y-4">
      {/* 취업역량 프로그램 */}
      {groupedPrograms['취업역량'] && groupedPrograms['취업역량'].length > 0 && (
        <div>
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            💼 취업역량
            <span className="text-sm font-normal text-gray-600">({groupedPrograms['취업역량'].length}개)</span>
          </h4>
          <div className="space-y-2">
            {groupedPrograms['취업역량'].map((program, index) => (
              <div key={index} className="p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{program.programName}</div>
                    <div className="text-xs text-gray-600">
                      <span className="inline-block px-2 py-0.5 bg-white rounded">
                        {program.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-blue-600 font-bold text-lg ml-2">{program.score}점</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 산학협력 프로그램 */}
      {groupedPrograms['산학협력'] && groupedPrograms['산학협력'].length > 0 && (
        <div>
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            🏭 산학협력
            <span className="text-sm font-normal text-gray-600">({groupedPrograms['산학협력'].length}개)</span>
          </h4>
          <div className="space-y-2">
            {groupedPrograms['산학협력'].map((program, index) => (
              <div key={index} className="p-3 bg-green-50 border border-green-200 rounded-lg hover:bg-green-100 transition-colors">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{program.programName}</div>
                    <div className="text-xs text-gray-600">
                      <span className="inline-block px-2 py-0.5 bg-white rounded">
                        {program.category}
                      </span>
                    </div>
                  </div>
                  <div className="text-green-600 font-bold text-lg ml-2">{program.score}점</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  const renderDocumentViewer = () => {
    const currentFile = certificateFiles[selectedFileIndex];

    return (
      <div className="flex flex-col h-full bg-gray-50">
        <div className="px-4 py-3 bg-gray-100 border-b">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              📄 제출 증빙
              {certificateFiles.length > 0 && (
                <button
                  onClick={handleDownloadAll}
                  className="ml-auto px-3 py-1 bg-blue-600 text-white text-xs rounded-lg font-medium hover:bg-blue-700"
                >
                  📥 전체 다운로드
                </button>
              )}
            </h3>
          </div>

          {/* 파일 탭 */}
          {certificateFiles.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {certificateFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedFileIndex(index)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedFileIndex === index
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  📄 파일 {index + 1}
                </button>
              ))}
            </div>
          )}

          {currentFile && (
            <div className="flex items-center justify-between mt-2">
              <p className="text-xs text-gray-600 truncate flex-1">
                {currentFile.fileName} ({formatFileSize(currentFile.fileSize)})
              </p>
              <button
                onClick={() => handleDownload(currentFile)}
                className="ml-2 px-2 py-1 bg-green-600 text-white text-xs rounded font-medium hover:bg-green-700"
              >
                📥
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          {previewUrl ? (
            currentFile.fileName.toLowerCase().endsWith('.pdf') ? (
              <iframe
                src={previewUrl}
                className="w-full h-full border rounded-lg"
                title="PDF Viewer"
              />
            ) : (
              <img
                src={previewUrl}
                alt="증빙서류"
                className="w-full h-auto rounded-lg shadow-lg"
              />
            )
          ) : currentFile ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-sm mb-2">미리보기를 지원하지 않는 파일입니다.</p>
              <button
                onClick={() => handleDownload(currentFile)}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                📥 파일 다운로드
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full">
              <div className="text-6xl mb-4">⚠️</div>
              <p className="text-red-700">제출된 파일이 없습니다.</p>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderReviewSection = () => (
    <>
      {submission.status === 'pending' && (
        <div className="border-t bg-white p-4">
          <h3 className="font-bold text-gray-900 mb-3">🔍 관리자 검토</h3>

          <div className="space-y-3">
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="approve"
                  checked={decision === 'approve'}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-4 h-4 text-green-600"
                />
                <span className="font-medium text-gray-900">✅ 승인</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="decision"
                  value="reject"
                  checked={decision === 'reject'}
                  onChange={(e) => setDecision(e.target.value)}
                  className="w-4 h-4 text-red-600"
                />
                <span className="font-medium text-gray-900">❌ 반려</span>
              </label>
            </div>

            {decision === 'reject' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  반려 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  rows="2"
                  placeholder="반려 사유를 입력해주세요..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
            )}

            <button
              onClick={handleSubmit}
              disabled={isProcessing}
              className={`w-full px-4 py-2 rounded-lg font-bold text-white ${
                decision === 'approve'
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-red-600 hover:bg-red-700'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isProcessing ? '처리 중...' : decision === 'approve' ? '✅ 승인하기' : '❌ 반려하기'}
            </button>
          </div>
        </div>
      )}

      {submission.status !== 'pending' && (
        <div className={`p-4 m-4 rounded-lg ${
          submission.status === 'approved'
            ? 'bg-green-50 border border-green-200'
            : 'bg-red-50 border border-red-200'
        }`}>
          <div className="font-semibold text-gray-900 mb-1">
            {submission.status === 'approved' ? '✅ 승인 완료' : '❌ 반려됨'}
          </div>
          <div className="text-sm text-gray-600">
            {submission.status === 'approved'
              ? `${submission.totalScore}점이 학생에게 반영되었습니다.`
              : `반려 사유: ${submission.rejection_reason}`
            }
          </div>
          <div className="text-xs text-gray-500 mt-2">
            처리일: {formatDate(submission.reviewed_at)}
          </div>
        </div>
      )}
    </>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-xl shadow-2xl w-[98vw] h-[98vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold">👨‍🎓 {student.name} ({student.studentId})</h2>
              <p className="text-blue-100 text-sm">{student.department} · {student.grade}학년</p>
            </div>

            {/* 보기 모드 전환 */}
            <div className="flex gap-2 ml-6">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'split'
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                }`}
                title="증빙서류와 프로그램 목록을 나란히 보기"
              >
                📄📋 나란히
              </button>
              <button
                onClick={() => setViewMode('document')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'document'
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                }`}
                title="증빙서류만 크게 보기"
              >
                📄 증빙만
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  viewMode === 'list'
                    ? 'bg-white text-blue-600'
                    : 'bg-blue-500 text-white hover:bg-blue-400'
                }`}
                title="프로그램 목록만 보기"
              >
                📋 목록만
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 점수 요약 바 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 border-b">
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="text-xs text-gray-600 mb-1">총점</div>
              <div className="text-2xl font-bold text-blue-600">{submission.totalScore}점</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">이수 프로그램</div>
              <div className="text-2xl font-bold text-green-600">{submission.totalProgramCount}개</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">제출 파일</div>
              <div className="text-2xl font-bold text-purple-600">{certificateFiles.length}개</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">제출일</div>
              <div className="text-sm font-medium text-gray-900">{formatDate(submission.submitted_at)}</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">현재 상태</div>
              <div className="text-sm font-medium text-gray-900">{SUBMISSION_STATUS_LABEL[submission.status]}</div>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 overflow-hidden flex">
          {viewMode === 'split' ? (
            // 나란히 보기 모드 (2:1 비율)
            <div className="flex w-full h-full">
              {/* 왼쪽: 증빙서류 뷰어 (2/3) */}
              <div className="w-2/3 border-r">
                {renderDocumentViewer()}
              </div>

              {/* 오른쪽: 프로그램 목록 및 검토 (1/3) */}
              <div className="w-1/3 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto p-4">
                  {/* 이수 프로그램 목록 */}
                  <div className="mb-6">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      ✅ 이수 프로그램 목록
                      <span className="text-sm font-normal text-gray-600">({completedPrograms.length}개)</span>
                    </h3>
                    {renderProgramList()}
                  </div>
                </div>

                {/* 하단: 관리자 검토 영역 */}
                {renderReviewSection()}
              </div>
            </div>
          ) : viewMode === 'document' ? (
            // 증빙서류만 보기 모드
            <div className="w-full h-full">
              {renderDocumentViewer()}
            </div>
          ) : (
            // 목록만 보기 모드
            <div className="w-full overflow-auto p-6">
              {/* 이수 프로그램 목록 */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">✅ 이수 프로그램 ({completedPrograms.length}개)</h3>
                {renderProgramList()}
              </div>

              {/* 제출 증빙 */}
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">📎 제출 증빙 ({certificateFiles.length}개)</h3>
                {certificateFiles.length > 0 ? (
                  <div className="space-y-2">
                    {certificateFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                        <div className="text-3xl">📄</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{file.fileName}</div>
                          <div className="text-sm text-gray-600">{formatFileSize(file.fileSize)}</div>
                        </div>
                        <button
                          onClick={() => handleDownload(file)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                        >
                          📥 다운로드
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    ⚠️ 제출된 파일이 없습니다.
                  </div>
                )}
              </div>

              {/* 관리자 검토 */}
              {submission.status === 'pending' && (
                <div className="border-t pt-6">
                  <h3 className="font-bold text-gray-900 mb-4">🔍 관리자 검토</h3>

                  <div className="space-y-4">
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="decision"
                          value="approve"
                          checked={decision === 'approve'}
                          onChange={(e) => setDecision(e.target.value)}
                          className="w-4 h-4 text-green-600"
                        />
                        <span className="font-medium text-gray-900">✅ 승인</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="decision"
                          value="reject"
                          checked={decision === 'reject'}
                          onChange={(e) => setDecision(e.target.value)}
                          className="w-4 h-4 text-red-600"
                        />
                        <span className="font-medium text-gray-900">❌ 반려</span>
                      </label>
                    </div>

                    {decision === 'reject' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          반려 사유 <span className="text-red-500">*</span>
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          rows="3"
                          placeholder="반려 사유를 입력해주세요..."
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                        />
                      </div>
                    )}

                    <div className="flex gap-3">
                      <button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className={`flex-1 px-6 py-3 rounded-lg font-bold text-white ${
                          decision === 'approve'
                            ? 'bg-green-600 hover:bg-green-700'
                            : 'bg-red-600 hover:bg-red-700'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {isProcessing ? '처리 중...' : decision === 'approve' ? '✅ 승인하기' : '❌ 반려하기'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* 이미 처리된 경우 */}
              {submission.status !== 'pending' && (
                <div className={`p-4 rounded-lg ${
                  submission.status === 'approved'
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="font-semibold text-gray-900 mb-1">
                    {submission.status === 'approved' ? '✅ 승인 완료' : '❌ 반려됨'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {submission.status === 'approved'
                      ? `${submission.totalScore}점이 학생에게 반영되었습니다.`
                      : `반려 사유: ${submission.rejection_reason}`
                    }
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    처리일: {formatDate(submission.reviewed_at)}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NonCurricularSubmissionReviewModal;
