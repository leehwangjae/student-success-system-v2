import React, { useState, useMemo } from 'react';
import { SUBMISSION_STATUS_LABEL } from './constants';
import { formatDate, formatFileSize, groupProgramsByCategory } from '../../utils/nonCurricularHelpers';
import { getFilePreviewUrl, downloadFile } from '../../utils/storageHelpers';

function NonCurricularSubmissionReviewModal({
  isOpen, onClose, submission, student,
  onApprove, onReject, onPartialApprove,
  onUpdate,            // 관리자 수정 콜백 (submissionId, { completedPrograms })
  nonCurricularPrograms // 전체 프로그램 목록 (추가 선택용)
}) {
  const [decision, setDecision] = useState('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [partialScore, setPartialScore] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState('split');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  // 수정 모드 상태
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedPrograms, setEditedPrograms] = useState([]);
  const [selectedProgramToAdd, setSelectedProgramToAdd] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  if (!isOpen || !submission || !student) return null;

  const completedPrograms = submission.completedPrograms || [];
  const certificateFiles = submission.certificateFiles || [];

  // 뷰 모드: completedPrograms / 수정 모드: editedPrograms
  const displayPrograms = isEditMode ? editedPrograms : completedPrograms;
  const groupedPrograms = groupProgramsByCategory(displayPrograms);

  // 추가 가능한 프로그램 (이미 추가된 것 제외, 학생 분야 필터)
  const availablePrograms = useMemo(() => {
    const field = student?.field;
    return (nonCurricularPrograms || [])
      .filter(p => (!field || p.field === field))
      .filter(p => !editedPrograms.some(ep => ep.programId === p.id));
  }, [nonCurricularPrograms, editedPrograms, student]);

  const previewUrl = useMemo(() => {
    if (!certificateFiles || certificateFiles.length === 0 || selectedFileIndex >= certificateFiles.length) return null;
    return getFilePreviewUrl(certificateFiles[selectedFileIndex]);
  }, [certificateFiles, selectedFileIndex]);

  // ── 승인/반려 처리 ──────────────────────────────────────────────────────
  const handleSubmit = async () => {
    if (decision === 'reject' && !rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    if (decision === 'partial') {
      const score = Number(partialScore);
      if (!partialScore || isNaN(score) || score < 0) {
        alert('유효한 점수를 입력해주세요. (0 이상의 숫자)');
        return;
      }
    }
    setIsProcessing(true);
    try {
      if (decision === 'approve') {
        await onApprove(submission.id);
      } else if (decision === 'partial') {
        if (onPartialApprove) {
          await onPartialApprove(submission.id, Number(partialScore), adminComment);
        } else {
          alert('일부 승인 기능이 연결되지 않았습니다.');
          return;
        }
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

  const handleDownload = (file) => { if (file) downloadFile(file); };
  const handleDownloadAll = () => { certificateFiles.forEach(file => { if (file) downloadFile(file); }); };

  // ── 수정 모드 진입/취소 ─────────────────────────────────────────────────
  const handleEnterEditMode = () => {
    setEditedPrograms(completedPrograms.map(p => ({ ...p })));
    setSelectedProgramToAdd('');
    setIsEditMode(true);
  };

  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditedPrograms([]);
    setSelectedProgramToAdd('');
  };

  // 프로그램 삭제
  const handleRemoveProgram = (programId) => {
    setEditedPrograms(prev => prev.filter(p => p.programId !== programId));
  };

  // 프로그램 점수 변경
  const handleScoreChange = (programId, newScore) => {
    setEditedPrograms(prev =>
      prev.map(p => p.programId === programId ? { ...p, score: Number(newScore) } : p)
    );
  };

  // 프로그램 추가
  const handleAddProgram = () => {
    if (!selectedProgramToAdd) return;
    const program = (nonCurricularPrograms || []).find(p => p.id === selectedProgramToAdd);
    if (!program) return;
    setEditedPrograms(prev => [
      ...prev,
      {
        programId: program.id,
        programName: program.program_name,
        category: program.category,
        score: program.score
      }
    ]);
    setSelectedProgramToAdd('');
  };

  // 수정 저장
  const handleSaveEdit = async () => {
    if (!onUpdate) return;
    setIsSavingEdit(true);
    try {
      await onUpdate(submission.id, { completedPrograms: editedPrograms });
      setIsEditMode(false);
      setEditedPrograms([]);
    } catch (err) {
      alert('저장 중 오류가 발생했습니다.');
      console.error(err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  // ── 프로그램 목록 렌더 ──────────────────────────────────────────────────
  const renderProgramList = () => (
    <div className="space-y-4">
      {/* 취업역량 */}
      {groupedPrograms['취업역량'] && groupedPrograms['취업역량'].length > 0 && (
        <div>
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            💼 취업역량
            <span className="text-sm font-normal text-gray-600">({groupedPrograms['취업역량'].length}개)</span>
          </h4>
          <div className="space-y-2">
            {groupedPrograms['취업역량'].map((program, index) => (
              <div key={index} className={`p-3 border rounded-lg transition-colors ${
                isEditMode ? 'bg-yellow-50 border-yellow-300' : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{program.programName}</div>
                    <div className="text-xs text-gray-600">
                      <span className="inline-block px-2 py-0.5 bg-white rounded">{program.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditMode ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          value={program.score}
                          onChange={(e) => handleScoreChange(program.programId, e.target.value)}
                          className="w-16 px-2 py-1 text-sm border border-yellow-400 rounded text-center font-bold"
                        />
                        <span className="text-sm text-gray-500">점</span>
                        <button
                          onClick={() => handleRemoveProgram(program.programId)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="text-blue-600 font-bold text-lg">{program.score}점</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 산학협력 */}
      {groupedPrograms['산학협력'] && groupedPrograms['산학협력'].length > 0 && (
        <div>
          <h4 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
            🏭 산학협력
            <span className="text-sm font-normal text-gray-600">({groupedPrograms['산학협력'].length}개)</span>
          </h4>
          <div className="space-y-2">
            {groupedPrograms['산학협력'].map((program, index) => (
              <div key={index} className={`p-3 border rounded-lg transition-colors ${
                isEditMode ? 'bg-yellow-50 border-yellow-300' : 'bg-green-50 border-green-200 hover:bg-green-100'
              }`}>
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 mb-1">{program.programName}</div>
                    <div className="text-xs text-gray-600">
                      <span className="inline-block px-2 py-0.5 bg-white rounded">{program.category}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isEditMode ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          value={program.score}
                          onChange={(e) => handleScoreChange(program.programId, e.target.value)}
                          className="w-16 px-2 py-1 text-sm border border-yellow-400 rounded text-center font-bold"
                        />
                        <span className="text-sm text-gray-500">점</span>
                        <button
                          onClick={() => handleRemoveProgram(program.programId)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded-full"
                          title="삭제"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </>
                    ) : (
                      <div className="text-green-600 font-bold text-lg">{program.score}점</div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 수정 모드: 빈 목록 안내 */}
      {isEditMode && displayPrograms.length === 0 && (
        <div className="text-center py-6 text-gray-400 border-2 border-dashed border-gray-200 rounded-lg">
          프로그램을 추가해주세요.
        </div>
      )}

      {/* 수정 모드: 프로그램 추가 섹션 */}
      {isEditMode && (
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs font-semibold text-blue-800 mb-2">➕ 프로그램 추가</p>
          <div className="flex gap-2">
            <select
              value={selectedProgramToAdd}
              onChange={(e) => setSelectedProgramToAdd(e.target.value)}
              className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
            >
              <option value="">추가할 프로그램 선택...</option>
              {availablePrograms.map(p => (
                <option key={p.id} value={p.id}>
                  [{p.category}] {p.program_name} ({p.score}점)
                </option>
              ))}
            </select>
            <button
              onClick={handleAddProgram}
              disabled={!selectedProgramToAdd}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
            >
              추가
            </button>
          </div>
          {availablePrograms.length === 0 && (
            <p className="text-xs text-gray-500 mt-2">추가 가능한 프로그램이 없습니다.</p>
          )}
        </div>
      )}

      {/* 수정 모드: 저장/취소 버튼 */}
      {isEditMode && (
        <div className="flex gap-2 mt-4 pt-4 border-t">
          <button
            onClick={handleSaveEdit}
            disabled={isSavingEdit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingEdit ? '저장 중...' : `💾 저장하기 (${editedPrograms.length}개 · ${editedPrograms.reduce((s, p) => s + (p.score || 0), 0)}점)`}
          </button>
          <button
            onClick={handleCancelEdit}
            disabled={isSavingEdit}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 disabled:opacity-50"
          >
            취소
          </button>
        </div>
      )}
    </div>
  );

  // ── 증빙서류 뷰어 ────────────────────────────────────────────────────────
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
          {certificateFiles.length > 1 && (
            <div className="flex gap-2 overflow-x-auto">
              {certificateFiles.map((file, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedFileIndex(index)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${
                    selectedFileIndex === index ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'
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
              <iframe src={previewUrl} className="w-full h-full border rounded-lg" title="PDF Viewer" />
            ) : (
              <img src={previewUrl} alt="증빙서류" className="w-full h-auto rounded-lg shadow-lg" />
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

  // ── 관리자 검토 영역 ─────────────────────────────────────────────────────
  const renderReviewSection = (compact = false) => (
    <>
      {submission.status === 'pending' && (
        <div className={`border-t bg-white ${compact ? 'p-4' : 'pt-6'}`}>
          <h3 className={`font-bold text-gray-900 mb-3 ${compact ? '' : 'mb-4 text-base'}`}>🔍 관리자 검토</h3>
          <div className="space-y-3">
            <div className="flex gap-3 flex-wrap">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="nc-decision" value="approve"
                  checked={decision === 'approve'} onChange={(e) => setDecision(e.target.value)}
                  className="w-4 h-4 text-green-600" />
                <span className="font-medium text-gray-900">✅ 승인</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="nc-decision" value="partial"
                  checked={decision === 'partial'} onChange={(e) => setDecision(e.target.value)}
                  className="w-4 h-4 text-yellow-500" />
                <span className="font-medium text-gray-900">🔶 일부 승인</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="radio" name="nc-decision" value="reject"
                  checked={decision === 'reject'} onChange={(e) => setDecision(e.target.value)}
                  className="w-4 h-4 text-red-600" />
                <span className="font-medium text-gray-900">❌ 반려</span>
              </label>
            </div>
            {decision === 'partial' && (
              <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    수동 점수 입력 <span className="text-red-500">*</span>
                    <span className="text-gray-400 font-normal ml-1">(자동계산: {submission.totalScore}점)</span>
                  </label>
                  <input
                    type="number" min="0" value={partialScore}
                    onChange={(e) => setPartialScore(e.target.value)}
                    placeholder="부여할 점수 입력"
                    className="w-full px-3 py-2 text-sm border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">코멘트 (선택)</label>
                  <textarea
                    value={adminComment} onChange={(e) => setAdminComment(e.target.value)}
                    rows="2" placeholder="일부 승인 사유 또는 안내 메시지..."
                    className="w-full px-3 py-2 text-sm border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-white resize-none"
                  />
                </div>
              </div>
            )}
            {decision === 'reject' && (
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  반려 사유 <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)}
                  rows="2" placeholder="반려 사유를 입력해주세요..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none"
                />
              </div>
            )}
            <button
              onClick={handleSubmit} disabled={isProcessing}
              className={`w-full px-4 py-2 rounded-lg font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                decision === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                decision === 'partial' ? 'bg-yellow-500 hover:bg-yellow-600' :
                'bg-red-600 hover:bg-red-700'
              }`}
            >
              {isProcessing ? '처리 중...' :
                decision === 'approve' ? '✅ 승인하기' :
                decision === 'partial' ? `🔶 일부 승인 (${partialScore || '?'}점)` :
                '❌ 반려하기'}
            </button>
          </div>
        </div>
      )}

      {submission.status !== 'pending' && (
        <div className={`${compact ? 'p-4 m-4' : 'p-4'} rounded-lg ${
          submission.status === 'approved' ? 'bg-green-50 border border-green-200' :
          submission.status === 'partial'  ? 'bg-yellow-50 border border-yellow-200' :
          'bg-red-50 border border-red-200'
        }`}>
          <div className="font-semibold text-gray-900 mb-1">
            {submission.status === 'approved' ? '✅ 승인 완료' :
             submission.status === 'partial'  ? '🔶 일부 승인' : '❌ 반려됨'}
          </div>
          <div className="text-sm text-gray-600">
            {submission.status === 'approved'
              ? `${submission.totalScore}점이 학생에게 반영되었습니다.`
              : submission.status === 'partial'
              ? `${submission.approvedScore ?? submission.totalScore}점이 학생에게 반영되었습니다.${submission.adminComment ? ` / ${submission.adminComment}` : ''}`
              : `반려 사유: ${submission.rejectionReason || submission.rejection_reason}`
            }
          </div>
          <div className="text-xs text-gray-500 mt-2">
            처리일: {formatDate(submission.reviewedAt || submission.reviewed_at)}
          </div>
        </div>
      )}
    </>
  );

  // ── 수정 모드 안내 배너 ──────────────────────────────────────────────────
  const renderEditBanner = () => isEditMode ? (
    <div className="bg-yellow-50 border-b border-yellow-300 px-6 py-2 flex items-center gap-3">
      <span className="text-yellow-700 text-sm font-semibold">✏️ 수정 모드</span>
      <span className="text-yellow-600 text-xs">
        프로그램을 추가/삭제하거나 점수를 변경한 후 "저장하기"를 누르세요.
        저장 시 제출 상태가 <strong>검토 대기</strong>로 변경됩니다.
      </span>
    </div>
  ) : null;

  // ── 점수 요약 계산 ────────────────────────────────────────────────────────
  const displayScore = isEditMode
    ? editedPrograms.reduce((s, p) => s + (p.score || 0), 0)
    : (submission.status === 'partial' && submission.approvedScore != null
        ? submission.approvedScore
        : submission.totalScore);

  const displayCount = isEditMode ? editedPrograms.length : submission.totalProgramCount;

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
              {[
                { mode: 'split', label: '📄📋 나란히' },
                { mode: 'document', label: '📄 증빙만' },
                { mode: 'list', label: '📋 목록만' }
              ].map(({ mode, label }) => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                    viewMode === mode ? 'bg-white text-blue-600' : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* 수정 버튼 */}
            {onUpdate && (
              isEditMode ? (
                <button
                  onClick={handleCancelEdit}
                  disabled={isSavingEdit}
                  className="ml-2 px-3 py-1 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:opacity-50"
                >
                  ✕ 수정 취소
                </button>
              ) : (
                <button
                  onClick={handleEnterEditMode}
                  className="ml-2 px-3 py-1 rounded-lg text-sm font-medium bg-yellow-400 text-yellow-900 hover:bg-yellow-300"
                >
                  ✏️ 수정
                </button>
              )
            )}
          </div>

          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 수정 모드 안내 배너 */}
        {renderEditBanner()}

        {/* 점수 요약 바 */}
        <div className={`px-6 py-3 border-b ${isEditMode ? 'bg-yellow-50' : 'bg-gradient-to-r from-blue-50 to-purple-50'}`}>
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="text-xs text-gray-600 mb-1">
                {isEditMode ? '수정 후 총점' : (submission.status === 'partial' ? '승인 점수 (일부승인)' : '총점')}
              </div>
              <div className={`text-2xl font-bold ${isEditMode ? 'text-yellow-600' : 'text-blue-600'}`}>
                {displayScore}점
              </div>
              {!isEditMode && submission.status === 'partial' && (
                <div className="text-xs text-gray-400 mt-0.5">자동계산: {submission.totalScore}점</div>
              )}
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">이수 프로그램</div>
              <div className={`text-2xl font-bold ${isEditMode ? 'text-yellow-600' : 'text-green-600'}`}>
                {displayCount}개
              </div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">제출 파일</div>
              <div className="text-2xl font-bold text-purple-600">{certificateFiles.length}개</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">제출일</div>
              <div className="text-sm font-medium text-gray-900">{formatDate(submission.submittedAt || submission.submitted_at)}</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">현재 상태</div>
              <div className="text-sm font-medium text-gray-900">
                {submission.status === 'partial' ? '일부 승인' : SUBMISSION_STATUS_LABEL[submission.status]}
              </div>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 */}
        <div className="flex-1 overflow-hidden flex">
          {viewMode === 'split' ? (
            <div className="flex w-full h-full">
              <div className="w-2/3 border-r">
                {renderDocumentViewer()}
              </div>
              <div className="w-1/3 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto p-4">
                  <div className="mb-4">
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      {isEditMode ? '✏️ 프로그램 수정' : '✅ 이수 프로그램 목록'}
                      <span className="text-sm font-normal text-gray-600">({displayCount}개)</span>
                    </h3>
                    {renderProgramList()}
                  </div>
                </div>
                {!isEditMode && renderReviewSection(true)}
              </div>
            </div>
          ) : viewMode === 'document' ? (
            <div className="w-full h-full">{renderDocumentViewer()}</div>
          ) : (
            <div className="w-full overflow-auto p-6">
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">
                  {isEditMode ? '✏️ 프로그램 수정' : `✅ 이수 프로그램 (${completedPrograms.length}개)`}
                </h3>
                {renderProgramList()}
              </div>
              {!isEditMode && (
                <>
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
                  <div className="border-t pt-6">
                    {renderReviewSection(false)}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default NonCurricularSubmissionReviewModal;
