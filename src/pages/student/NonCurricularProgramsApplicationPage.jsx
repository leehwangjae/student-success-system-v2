import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  FILE_UPLOAD_CONFIG,
  SUBMISSION_STATUS_LABEL
} from '../../components/nonCurricularPrograms/constants';
import {
  validateFile,
  fileToBase64,
  formatFileSize,
  calculateTotalScore,
  groupProgramsByCategory
} from '../../utils/nonCurricularHelpers';
import { useModalStore } from '../../hooks/useModal';

function NonCurricularProgramsApplicationPage() {
  const {
    currentUser,
    nonCurricularPrograms,
    getNonCurricularSubmission,
    submitNonCurricularPrograms
  } = useAppContext();

  const { showAlert, showConfirm } = useModalStore();

  const [selectedPrograms, setSelectedPrograms] = useState([]);
  const [certificateFiles, setCertificateFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 학생의 분야와 전공에 맞는 프로그램 가져오기
  const fieldPrograms = useMemo(() => {
    if (!currentUser) return [];
    return nonCurricularPrograms.filter(p =>
      p.field === currentUser.field && p.department === currentUser.department
    );
  }, [currentUser, nonCurricularPrograms]);

  // 카테고리별 그룹핑
  const groupedPrograms = useMemo(() => {
    return groupProgramsByCategory(fieldPrograms);
  }, [fieldPrograms]);

  // 점수 계산
  const totalScore = useMemo(() => {
    return calculateTotalScore(selectedPrograms);
  }, [selectedPrograms]);

  // 기존 제출 데이터 로드
  useEffect(() => {
    if (!currentUser) return;

    const submission = getNonCurricularSubmission(currentUser.id);
    if (submission) {
      setSelectedPrograms(submission.completed_programs || []);
      setCertificateFiles(submission.certificate_files || []);

      // 승인된 상태면 수정 불가
      if (submission.status === 'approved') {
        showAlert('이미 승인된 제출입니다. 수정할 수 없습니다.');
      }
    }
  }, [currentUser]);

  // 프로그램 선택 토글
  const handleProgramToggle = (program) => {
    const exists = selectedPrograms.find(p => p.programId === program.id);

    if (exists) {
      // 선택 해제
      setSelectedPrograms(prev => prev.filter(p => p.programId !== program.id));
    } else {
      // 선택 추가
      setSelectedPrograms(prev => [
        ...prev,
        {
          programId: program.id,
          programName: program.program_name,
          category: program.category,
          score: program.score
        }
      ]);
    }
  };

  // 파일 추가
  const handleFileAdd = async (e) => {
    const files = Array.from(e.target.files);

    // 최대 파일 개수 체크
    if (certificateFiles.length + files.length > FILE_UPLOAD_CONFIG.MAX_FILES) {
      showAlert(`최대 ${FILE_UPLOAD_CONFIG.MAX_FILES}개까지만 업로드 가능합니다.`);
      e.target.value = '';
      return;
    }

    for (const file of files) {
      const validation = validateFile(file);

      if (!validation.valid) {
        showAlert(validation.error);
        e.target.value = '';
        return;
      }

      try {
        const base64 = await fileToBase64(file);
        setCertificateFiles(prev => [
          ...prev,
          {
            fileName: file.name,
            fileSize: file.size,
            fileData: base64
          }
        ]);
      } catch (error) {
        showAlert('파일 업로드 중 오류가 발생했습니다.');
        console.error('File upload error:', error);
      }
    }

    e.target.value = '';
  };

  // 파일 삭제
  const handleFileRemove = (index) => {
    setCertificateFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 제출
  const handleSubmit = () => {
    // 검증
    if (selectedPrograms.length === 0) {
      showAlert('이수한 프로그램을 최소 1개 이상 선택해주세요.');
      return;
    }

    if (certificateFiles.length === 0) {
      showAlert('이수증을 최소 1개 이상 업로드해주세요.');
      return;
    }

    showConfirm(
      `${selectedPrograms.length}개 프로그램 (${totalScore}점)을 제출하시겠습니까?\n\n제출 후에는 관리자 승인 전까지 수정할 수 없습니다.`,
      async () => {
        setIsSubmitting(true);

        try {
          const submissionData = {
            studentId: currentUser.id,
            completedPrograms: selectedPrograms,
            certificateFiles: certificateFiles,
            totalProgramCount: selectedPrograms.length,
            totalScore: totalScore
          };

          const result = await submitNonCurricularPrograms(submissionData);

          if (result.success) {
            showAlert('✅ 제출이 완료되었습니다!\n관리자 검토 후 점수가 반영됩니다.');
          } else {
            showAlert(`제출 실패: ${result.error}`);
          }
        } catch (error) {
          console.error('제출 중 오류:', error);
          showAlert('제출 중 오류가 발생했습니다.');
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  // 제출 상태 확인
  const submission = getNonCurricularSubmission(currentUser?.id);
  const isApproved = submission?.status === 'approved';
  const isPending = submission?.status === 'pending';
  const isRejected = submission?.status === 'rejected';
  const canEdit = !isApproved && !isPending;

  if (!currentUser) {
    return <div className="p-6">로그인이 필요합니다.</div>;
  }

  if (fieldPrograms.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">🎯</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            등록된 비교과 프로그램이 없습니다
          </h2>
          <p className="text-gray-600">
            {currentUser.field}의 비교과 프로그램이 아직 설정되지 않았습니다.<br />
            관리자에게 문의해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-green-600 to-teal-600 text-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">🎯 비교과 프로그램 이수 현황</h1>
          <p className="text-green-100">{currentUser.field} · {currentUser.grade}학년</p>
        </div>

        {/* 점수 카드 - Sticky */}
        <div className="sticky top-4 z-10 bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-green-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">현재 점수</div>
              <div className="text-3xl font-bold text-green-600">
                {totalScore}점
              </div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">이수 프로그램</div>
              <div className="text-3xl font-bold text-blue-600">
                {selectedPrograms.length}개
              </div>
            </div>
          </div>
        </div>

        {/* 제출 상태 */}
        {submission && (
          <div className={`rounded-xl shadow-sm p-4 mb-6 ${
            isApproved ? 'bg-green-50 border border-green-200' :
            isPending ? 'bg-yellow-50 border border-yellow-200' :
            isRejected ? 'bg-red-50 border border-red-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {isApproved ? '✅' : isPending ? '🔄' : isRejected ? '❌' : '📝'}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  제출 상태: {SUBMISSION_STATUS_LABEL[submission.status]}
                </div>
                {isPending && (
                  <div className="text-sm text-gray-600 mt-1">
                    관리자 검토 대기 중입니다...
                  </div>
                )}
                {isApproved && (
                  <div className="text-sm text-green-700 mt-1">
                    {submission.total_score}점이 반영되었습니다.
                  </div>
                )}
                {isRejected && (
                  <div className="text-sm text-red-700 mt-1">
                    반려 사유: {submission.rejection_reason}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 프로그램 체크리스트 */}
        <div className="space-y-4 mb-6">
          {/* 취업역량 프로그램 */}
          {groupedPrograms['취업역량'] && groupedPrograms['취업역량'].length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-blue-50 px-6 py-3 border-b">
                <h3 className="font-bold text-gray-900">
                  💼 취업역량 프로그램 ({groupedPrograms['취업역량'].length}개)
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {groupedPrograms['취업역량'].map(program => {
                  const selected = selectedPrograms.find(p => p.programId === program.id);

                  return (
                    <label
                      key={program.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selected
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                      } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => canEdit && handleProgramToggle(program)}
                        disabled={!canEdit}
                        className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{program.program_name}</div>
                        {program.description && (
                          <div className="text-sm text-gray-600 mt-1">{program.description}</div>
                        )}
                      </div>
                      {selected && (
                        <div className="text-blue-600 font-bold text-lg">{program.score}점</div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* 산학협력 프로그램 */}
          {groupedPrograms['산학협력'] && groupedPrograms['산학협력'].length > 0 && (
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="bg-green-50 px-6 py-3 border-b">
                <h3 className="font-bold text-gray-900">
                  🏭 산학협력 프로그램 ({groupedPrograms['산학협력'].length}개)
                </h3>
              </div>
              <div className="p-4 space-y-2">
                {groupedPrograms['산학협력'].map(program => {
                  const selected = selectedPrograms.find(p => p.programId === program.id);

                  return (
                    <label
                      key={program.id}
                      className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selected
                          ? 'border-green-500 bg-green-50'
                          : 'border-gray-200 hover:border-green-300 hover:bg-gray-50'
                      } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                    >
                      <input
                        type="checkbox"
                        checked={!!selected}
                        onChange={() => canEdit && handleProgramToggle(program)}
                        disabled={!canEdit}
                        className="mt-1 w-5 h-5 text-green-600 rounded focus:ring-2 focus:ring-green-500"
                      />
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{program.program_name}</div>
                        {program.description && (
                          <div className="text-sm text-gray-600 mt-1">{program.description}</div>
                        )}
                      </div>
                      {selected && (
                        <div className="text-green-600 font-bold text-lg">{program.score}점</div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* 이수증 업로드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-4">
            📎 이수증 업로드 <span className="text-red-500">*</span>
            <span className="text-sm font-normal text-gray-600 ml-2">
              (최대 {FILE_UPLOAD_CONFIG.MAX_FILES}개)
            </span>
          </h3>

          {/* 업로드된 파일 목록 */}
          {certificateFiles.length > 0 && (
            <div className="space-y-2 mb-4">
              {certificateFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="text-2xl">📄</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900 text-sm">{file.fileName}</div>
                    <div className="text-xs text-gray-600">{formatFileSize(file.fileSize)}</div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => handleFileRemove(index)}
                      className="text-red-600 hover:text-red-700 p-1"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* 파일 추가 버튼 */}
          {canEdit && certificateFiles.length < FILE_UPLOAD_CONFIG.MAX_FILES && (
            <div>
              <input
                type="file"
                id="certificates"
                accept={FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(',')}
                onChange={handleFileAdd}
                multiple
                className="hidden"
              />
              <label
                htmlFor="certificates"
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 cursor-pointer"
              >
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-sm text-gray-600 text-center">
                  <span className="text-green-600 font-medium">파일 선택</span> 또는 드래그 앤 드롭
                  <br />
                  {FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ')} (최대 {formatFileSize(FILE_UPLOAD_CONFIG.MAX_FILE_SIZE)})
                </div>
              </label>
            </div>
          )}
        </div>

        {/* 제출 버튼 */}
        {canEdit && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '제출 중...' : '💾 제출하기'}
            </button>

            <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              ℹ️ 제출 후에는 관리자 승인 전까지 수정할 수 없습니다.
            </div>
          </div>
        )}

        {isRejected && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700"
            >
              🔄 재제출하기
            </button>
          </div>
        )}

        {/* 주의사항 */}
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 mt-6">
          <div className="flex gap-3">
            <div className="text-green-600 text-xl">ℹ️</div>
            <div className="flex-1 text-sm text-green-800">
              <h4 className="font-semibold mb-2">안내사항</h4>
              <ul className="space-y-1">
                <li>• 이수한 프로그램을 모두 선택해주세요.</li>
                <li>• 각 프로그램의 이수증을 함께 업로드해주세요.</li>
                <li>• 프로그램별로 다른 점수가 부여됩니다.</li>
                <li>• 최대 {FILE_UPLOAD_CONFIG.MAX_FILES}개의 파일을 업로드할 수 있습니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default NonCurricularProgramsApplicationPage;
