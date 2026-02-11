import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { 
  POINTS_PER_COURSE, 
  MAX_COURSES, 
  FILE_UPLOAD_CONFIG,
  SUBMISSION_STATUS_LABEL 
} from '../../components/coreCourses/constants';
import {
  calculateCoreCoursesScore,
  isDuplicateCourse,
  canAddMoreCourses,
  groupCoursesByType,
  validateFile,
  fileToBase64,
  formatFileSize
} from '../../utils/coreCoursesHelpers';
import { useModalStore } from '../../hooks/useModal';

function CoreCoursesCheckPage() {
  const {
    currentUser,
    coreCourses,
    getCoreCoursesByDepartment,
    getStudentSubmission,
    submitCoreCourses
  } = useAppContext();

  const { showAlert, showConfirm } = useModalStore();

  const [completedCourses, setCompletedCourses] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 학생의 학과에 맞는 교과목 가져오기
  const departmentCourses = useMemo(() => {
    if (!currentUser) return [];
    return getCoreCoursesByDepartment(currentUser.field, currentUser.department);
  }, [currentUser, coreCourses]);

  // 과목 구분별 그룹핑
  const groupedCourses = useMemo(() => {
    return groupCoursesByType(departmentCourses);
  }, [departmentCourses]);

  // 점수 계산
  const scoreInfo = useMemo(() => {
    return calculateCoreCoursesScore(completedCourses);
  }, [completedCourses]);

  // 기존 제출 데이터 로드
  useEffect(() => {
    if (!currentUser) return;

    const submission = getStudentSubmission(currentUser.id);
    if (submission) {
      setCompletedCourses(submission.completedCourses || []);
      setUploadedFiles(submission.uploadedFiles || []);

      // 승인된 상태면 수정 불가
      if (submission.status === 'approved') {
        showAlert('이미 승인된 제출입니다. 수정할 수 없습니다.');
      }
    }
  }, [currentUser]);

  // 과목 체크 토글
  const handleCourseToggle = (course) => {
    const existing = completedCourses.find(c => c.courseId === course.id);

    if (existing && existing.isCompleted) {
      // 체크 해제
      setCompletedCourses(prev =>
        prev.map(c =>
          c.courseId === course.id ? { ...c, isCompleted: false } : c
        )
      );
    } else {
      // 체크
      // 중복 체크
      if (isDuplicateCourse(course.courseCode, completedCourses, course.id)) {
        showAlert('⚠️ 이미 동일 과목을 선택하셨습니다. (학수번호 중복)');
        return;
      }

      // 최대 개수 체크
      if (!canAddMoreCourses(completedCourses)) {
        showAlert(`⚠️ 최대 ${MAX_COURSES}과목까지만 선택 가능합니다.`);
        return;
      }

      if (existing) {
        // 이미 있지만 체크 해제 상태 → 다시 체크
        setCompletedCourses(prev =>
          prev.map(c =>
            c.courseId === course.id ? { ...c, isCompleted: true } : c
          )
        );
      } else {
        // 새로 추가
        setCompletedCourses(prev => [
          ...prev,
          {
            courseId: course.id,
            courseCode: course.courseCode,
            courseName: course.courseName,
            courseType: course.courseType,
            isCompleted: true
          }
        ]);
      }
    }
  };

  // 여러 파일 선택
  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    for (const file of files) {
      const validation = validateFile(
        file,
        FILE_UPLOAD_CONFIG.maxSize,
        FILE_UPLOAD_CONFIG.acceptedFormats
      );

      if (!validation.valid) {
        showAlert(`${file.name}: ${validation.error}`);
        continue;
      }

      try {
        const base64 = await fileToBase64(file);
        setUploadedFiles(prev => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            data: base64,
            uploadedAt: new Date().toISOString()
          }
        ]);
      } catch (error) {
        showAlert(`${file.name} 업로드 중 오류가 발생했습니다.`);
        console.error('File upload error:', error);
      }
    }

    e.target.value = '';
  };

  // 파일 삭제
  const handleFileRemove = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 파일 다운로드
  const handleFileDownload = (file) => {
    const link = document.createElement('a');
    link.href = file.data;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 제출
  const handleSubmit = () => {
    console.log('🔥 제출하기 버튼 클릭!');
    console.log('현재 사용자:', currentUser);
    console.log('완료된 과목:', completedCourses);
    console.log('파일:', transcriptFile);
    console.log('파일명:', transcriptFileName);
    
    // 검증
    const completedCount = completedCourses.filter(c => c.isCompleted).length;
    console.log('체크된 과목 수:', completedCount);
    
    if (completedCount === 0) {
      console.log('❌ 과목 미선택');
      showAlert('이수한 과목을 최소 1개 이상 선택해주세요.');
      return;
    }

    if (uploadedFiles.length === 0) {
      console.log('❌ 파일 미업로드');
      showAlert('교과과정 이수표 및 개인정보제공동의서를 업로드해주세요.');
      return;
    }

    console.log('✅ 검증 통과 - 확인 모달 표시');
    console.log('점수 정보:', scoreInfo);
    
    showConfirm(
      `${scoreInfo.completedCount}개 과목 (${scoreInfo.score}점)을 제출하시겠습니까?\n\n제출 후에는 관리자 승인 전까지 수정할 수 없습니다.`,
      async () => {
        console.log('✅ 사용자가 확인 버튼 클릭!');
        setIsSubmitting(true);
        
        try {
          console.log('📤 submitCoreCourses 호출 시작...');
          const submissionData = {
            studentId: currentUser.id,
            completedCourses: completedCourses.filter(c => c.isCompleted),
            totalCompletedCount: scoreInfo.completedCount,
            totalScore: scoreInfo.score,
            uploadedFiles
          };
          console.log('제출할 데이터:', submissionData);
          
          const result = await submitCoreCourses(submissionData);
          
          console.log('📥 제출 결과:', result);

          if (result.success) {
            showAlert('✅ 제출이 완료되었습니다!\n관리자 검토 후 점수가 반영됩니다.');
          } else {
            showAlert(`제출 실패: ${result.error}`);
          }
        } catch (error) {
          console.error('❌ 제출 중 예외 발생:', error);
          showAlert('제출 중 오류가 발생했습니다.');
        } finally {
          setIsSubmitting(false);
          console.log('제출 프로세스 완료');
        }
      }
    );
  };

  // 제출 상태 확인
  const submission = getStudentSubmission(currentUser?.id);
  const isApproved = submission?.status === 'approved';
  const isPending = submission?.status === 'pending';
  const isRejected = submission?.status === 'rejected';
  const canEdit = !isApproved && !isPending;

  if (!currentUser) {
    return <div className="p-6">로그인이 필요합니다.</div>;
  }

  // 🔍 디버그 정보 출력
  console.log('=== CoreCoursesCheckPage 렌더링 ===');
  console.log('currentUser:', currentUser);
  console.log('submission:', submission);
  console.log('isApproved:', isApproved);
  console.log('isPending:', isPending);
  console.log('isRejected:', isRejected);
  console.log('canEdit:', canEdit);
  console.log('completedCourses:', completedCourses);

  if (departmentCourses.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">📚</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            등록된 핵심 교과목이 없습니다
          </h2>
          <p className="text-gray-600">
            {currentUser.department}의 핵심 교과목이 아직 설정되지 않았습니다.<br />
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
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">📚 핵심 교과목 이수 현황</h1>
          <p className="text-blue-100">{currentUser.department} · {currentUser.grade}학년</p>
        </div>

        {/* 점수 카드 - Sticky */}
        <div className="sticky top-4 z-10 bg-white rounded-xl shadow-lg p-6 mb-6 border-2 border-blue-100">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">현재 점수</div>
              <div className="text-3xl font-bold text-blue-600">
                {scoreInfo.score}점
              </div>
              <div className="text-xs text-gray-500 mt-1">/ {scoreInfo.maxScore}점</div>
            </div>
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-1">이수 과목</div>
              <div className="text-3xl font-bold text-green-600">
                {scoreInfo.completedCount}개
              </div>
              <div className="text-xs text-gray-500 mt-1">/ {departmentCourses.length}개</div>
            </div>
          </div>

          {/* 진행률 바 */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-600 mb-1">
              <span>진행률</span>
              <span>{scoreInfo.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(scoreInfo.percentage, 100)}%` }}
              />
            </div>
          </div>

          {scoreInfo.completedCount >= MAX_COURSES && (
            <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-sm text-yellow-800">
                ⚠️ 최대 {MAX_COURSES}과목({MAX_COURSES * POINTS_PER_COURSE}점)까지 인정됩니다.
              </p>
            </div>
          )}
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
                    {submission.totalScore}점이 반영되었습니다.
                  </div>
                )}
                {isRejected && (
                  <div className="text-sm text-red-700 mt-1">
                    반려 사유: {submission.rejectionReason}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 교과목 체크리스트 */}
        <div className="space-y-4 mb-6">
          {Object.entries(groupedCourses).map(([type, courses]) => {
            if (courses.length === 0) return null;

            return (
              <div key={type} className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <h3 className="font-bold text-gray-900">{type} ({courses.length}과목)</h3>
                </div>
                <div className="p-4 space-y-2">
                  {courses.map(course => {
                    const completed = completedCourses.find(
                      c => c.courseId === course.id && c.isCompleted
                    );

                    return (
                      <label
                        key={course.id}
                        className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${
                          completed
                            ? 'border-blue-500 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:bg-gray-50'
                        } ${!canEdit ? 'cursor-not-allowed opacity-60' : ''}`}
                      >
                        <input
                          type="checkbox"
                          checked={!!completed}
                          onChange={() => canEdit && handleCourseToggle(course)}
                          disabled={!canEdit}
                          className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{course.courseName}</div>
                          <div className="text-sm text-gray-600">
                            {course.courseCode} · {course.credits}학점
                          </div>
                        </div>
                        {completed && (
                          <div className="text-blue-600 font-bold">{POINTS_PER_COURSE}점</div>
                        )}
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* 파일 업로드 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">
              📎 교과과정 이수표 및 개인정보제공동의서 업로드 <span className="text-red-500">*</span>
            </h3>
            <span className="text-xs text-gray-400">v3.1</span>
          </div>

          {/* 업로드된 파일 목록 */}
          {uploadedFiles.length > 0 && (
            <div className="space-y-2 mb-4">
              {uploadedFiles.map((file, index) => (
                <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg border border-gray-300">
                  <div className="text-3xl">📄</div>
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{file.name}</div>
                    <div className="text-sm text-gray-600">{formatFileSize(file.size)}</div>
                  </div>
                  <button
                    onClick={() => handleFileDownload(file)}
                    className="text-blue-600 hover:text-blue-700 p-2"
                    title="다운로드"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                  </button>
                  {canEdit && (
                    <button
                      onClick={() => handleFileRemove(index)}
                      className="text-red-600 hover:text-red-700 p-2"
                      title="삭제"
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

          {/* 파일 업로드 영역 */}
          {canEdit && (
            <div>
              <input
                type="file"
                id="transcript"
                accept=".pdf,.jpg,.jpeg,.png"
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
              <label
                htmlFor="transcript"
                className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg border-gray-300 hover:border-blue-500 cursor-pointer"
              >
                <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <div className="text-sm text-gray-600 text-center">
                  <span className="text-blue-600 font-medium">파일 선택</span> 또는 드래그 앤 드롭
                  <br />
                  PDF, JPG, PNG (최대 10MB) · 여러 파일 선택 가능
                </div>
              </label>
            </div>
          )}
        </div>

        {/* 제출 버튼 */}
        {canEdit && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex gap-3">
              <button
                onClick={() => {
                  console.log('🎯 버튼 onClick 이벤트 발생!');
                  console.log('canEdit:', canEdit);
                  console.log('isSubmitting:', isSubmitting);
                  handleSubmit();
                }}
                disabled={isSubmitting}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '제출 중...' : '💾 제출하기'}
              </button>
              <button className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
                👁️ 미리보기
              </button>
            </div>

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
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mt-6">
          <div className="flex gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="flex-1 text-sm text-blue-800">
              <h4 className="font-semibold mb-2">안내사항</h4>
              <ul className="space-y-1">
                <li>• 이수 여부만 체크하시면 됩니다. (학점/성적 입력 불필요)</li>
                <li>• 동일 과목 중복 체크는 불가능합니다.</li>
                <li>• 최대 {MAX_COURSES}과목({MAX_COURSES * POINTS_PER_COURSE}점)까지 인정됩니다.</li>
                <li>• 과목당 {POINTS_PER_COURSE}점이 부여됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoreCoursesCheckPage;