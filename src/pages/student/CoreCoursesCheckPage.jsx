/**
 * 핵심 교과목 이수 현황 페이지
 * @version 3.3
 * @description 교과과정 이수표 업로드 시 AI가 학년(재학년도) 자동 추출
 * @date 2026-04-23
 */
import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
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
  formatFileSize
} from '../../utils/coreCoursesHelpers';
import { uploadFileToStorage, deleteFileFromStorage, downloadFile } from '../../utils/storageHelpers';
import { useModalStore } from '../../hooks/useModal';

function CoreCoursesCheckPage() {
  const {
    currentUser,
    coreCourses,
    getCoreCoursesByDepartment,
    getStudentSubmission,
    submitCoreCourses,
    applicationPeriods,
    isWithinApplicationPeriod
  } = useAppContext();

  const { showAlert, showConfirm } = useModalStore();

  const [completedCourses, setCompletedCourses] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 재학년도 (기본값: 2학년, 이수표 업로드 시 AI 자동 추출)
  const [selectedGrade, setSelectedGrade] = useState('2학년');
  const [isExtractingGrade, setIsExtractingGrade] = useState(false);
  const [gradeSource, setGradeSource] = useState('manual'); // 'auto' | 'manual'

  // 지급 관련 정보
  const [paymentInfo, setPaymentInfo] = useState({
    bankName: '',
    accountNumber: '',
    accountHolder: ''
  });

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

      // 재학년도 로드
      if (submission.gradeAt2025Fall) {
        setSelectedGrade(submission.gradeAt2025Fall);
      }

      // 지급 정보 로드
      if (submission.paymentInfo) {
        setPaymentInfo(submission.paymentInfo);
      }

      // 승인된 상태면 수정 불가
      if (submission.status === 'approved') {
        showAlert('이미 승인된 제출입니다. 수정할 수 없습니다.');
      }
    } else {
      // 제출 데이터가 없을 경우 초기화
      setSelectedGrade('2학년');
      setGradeSource('manual');
      setCompletedCourses([]);
      setUploadedFiles([]);
      setPaymentInfo({
        bankName: '',
        accountNumber: '',
        accountHolder: ''
      });
    }
  }, [currentUser, getStudentSubmission]);

  // 과목 체크 토글
  const handleCourseToggle = (course) => {
    const existing = completedCourses.find(c => c.courseId === course.id);

    if (existing && existing.isCompleted) {
      setCompletedCourses(prev =>
        prev.map(c =>
          c.courseId === course.id ? { ...c, isCompleted: false } : c
        )
      );
    } else {
      if (isDuplicateCourse(course.courseCode, completedCourses, course.id)) {
        showAlert('⚠️ 이미 동일 과목을 선택하셨습니다. (학수번호 중복)');
        return;
      }
      if (!canAddMoreCourses(completedCourses)) {
        showAlert(`⚠️ 최대 ${MAX_COURSES}과목까지만 선택 가능합니다.`);
        return;
      }
      if (existing) {
        setCompletedCourses(prev =>
          prev.map(c =>
            c.courseId === course.id ? { ...c, isCompleted: true } : c
          )
        );
      } else {
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

  // PDF를 이미지 배열(base64)로 변환 (CDN 방식 — SubmissionReviewModal과 동일)
  const convertPdfToImages = async (file) => {
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }
    const pdfjsLib = window.pdfjsLib;
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      images.push(canvas.toDataURL('image/png').split('base64,')[1]);
    }
    return images;
  };

  // 이수표에서 학년 자동 추출
  const extractGradeFromFile = async (file, storageUrl) => {
    setIsExtractingGrade(true);
    try {
      let body;
      if (file.type === 'application/pdf') {
        const imageDataList = await convertPdfToImages(file);
        body = { mode: 'extractGrade', imageDataList, fileName: file.name };
      } else {
        body = { mode: 'extractGrade', fileUrl: storageUrl, fileName: file.name };
      }

      const { data, error } = await supabase.functions.invoke('analyze-certificate', { body });
      if (error) throw error;

      if (data?.success && data?.data?.grade) {
        setSelectedGrade(data.data.grade);
        setGradeSource('auto');
      }
    } catch (err) {
      console.error('학년 자동 추출 실패:', err);
      // 실패해도 수동 선택 유지 — 사용자에게 별도 알림 없이 드롭다운으로 폴백
    } finally {
      setIsExtractingGrade(false);
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
        const { storagePath, url } = await uploadFileToStorage(
          file,
          `core-courses/${currentUser.id}`
        );
        setUploadedFiles(prev => [
          ...prev,
          {
            name: file.name,
            size: file.size,
            storagePath,
            url,
            uploadedAt: new Date().toISOString()
          }
        ]);

        // 첫 번째 파일 업로드 시에만 학년 자동 추출 (아직 자동 추출 전인 경우)
        if (uploadedFiles.length === 0 && gradeSource !== 'auto') {
          extractGradeFromFile(file, url);
        }
      } catch (error) {
        showAlert(`${file.name} 업로드 중 오류가 발생했습니다.`);
        console.error('File upload error:', error);
      }
    }

    e.target.value = '';
  };

  // 파일 삭제
  const handleFileRemove = async (index) => {
    const file = uploadedFiles[index];
    if (file?.storagePath) {
      await deleteFileFromStorage(file.storagePath);
    }
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // 파일 다운로드
  const handleFileDownload = (file) => {
    downloadFile(file);
  };

  // 제출
  const handleSubmit = () => {
    const completedCount = completedCourses.filter(c => c.isCompleted).length;

    if (completedCount === 0) {
      showAlert('이수한 과목을 최소 1개 이상 선택해주세요.');
      return;
    }

    if (uploadedFiles.length === 0) {
      showAlert('교과과정 이수표를 업로드해주세요.');
      return;
    }

    if (!paymentInfo.bankName || !paymentInfo.accountNumber || !paymentInfo.accountHolder) {
      showAlert('지급 관련 정보를 모두 입력해주세요.\n(은행명, 계좌번호, 예금주)');
      return;
    }

    showConfirm(
      `${scoreInfo.completedCount}개 과목 (${scoreInfo.score}점)을 제출하시겠습니까?\n\n제출 후에는 관리자 승인 전까지 수정할 수 있습니다.`,
      async () => {
        setIsSubmitting(true);
        try {
          const submissionData = {
            studentId: currentUser.id,
            completedCourses: completedCourses.filter(c => c.isCompleted),
            totalCompletedCount: scoreInfo.completedCount,
            totalScore: scoreInfo.score,
            uploadedFiles,
            paymentInfo,
            gradeAt2025Fall: selectedGrade
          };

          const result = await submitCoreCourses(submissionData);

          if (result.success) {
            showAlert('✅ 제출이 완료되었습니다!\n관리자 검토 후 점수가 반영됩니다.');
          } else {
            showAlert(`제출 실패: ${result.error}`);
          }
        } catch (error) {
          showAlert('제출 중 오류가 발생했습니다.');
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  // 제출 상태 확인
  const submission = getStudentSubmission(currentUser?.id);
  const isApproved = submission?.status === 'approved';
  const isPartial = submission?.status === 'partial';
  const isPending = submission?.status === 'pending';
  const isRejected = submission?.status === 'rejected';

  // 신청 기간 체크
  const withinPeriod = isWithinApplicationPeriod('core_courses');
  const periodInfo = applicationPeriods?.coreCourses;
  const periodActive = periodInfo?.isActive;

  const canEdit = !isApproved && !isPartial && withinPeriod;

  if (!currentUser) {
    return <div className="p-6">로그인이 필요합니다.</div>;
  }

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

        {/* 신청 기간 안내 배너 */}
        {periodActive && (
          <div className={`rounded-xl shadow-sm p-4 mb-4 ${
            withinPeriod
              ? 'bg-green-50 border border-green-200'
              : 'bg-red-50 border border-red-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">{withinPeriod ? '🟢' : '🔴'}</div>
              <div className="flex-1">
                <div className={`font-semibold ${withinPeriod ? 'text-green-800' : 'text-red-800'}`}>
                  {withinPeriod ? '신청 기간 중' : '신청 기간이 아닙니다'}
                </div>
                <div className={`text-sm mt-1 ${withinPeriod ? 'text-green-700' : 'text-red-700'}`}>
                  {periodInfo.startDate && periodInfo.endDate ? (
                    <>
                      신청 기간: {new Date(periodInfo.startDate).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                      {' ~ '}
                      {new Date(periodInfo.endDate).toLocaleString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </>
                  ) : '기간 미설정'}
                </div>
                {!withinPeriod && (
                  <div className="text-sm text-red-600 font-medium mt-1">
                    ⚠️ 신청 기간이 아니므로 제출 및 수정이 불가합니다.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
            isPartial ? 'bg-yellow-50 border border-yellow-300' :
            isPending ? 'bg-blue-50 border border-blue-200' :
            isRejected ? 'bg-red-50 border border-red-200' :
            'bg-gray-50 border border-gray-200'
          }`}>
            <div className="flex items-center gap-3">
              <div className="text-2xl">
                {isApproved ? '✅' : isPartial ? '🔶' : isPending ? '🔄' : isRejected ? '❌' : '📝'}
              </div>
              <div className="flex-1">
                <div className="font-semibold text-gray-900">
                  제출 상태: {isPartial ? '일부 승인' : SUBMISSION_STATUS_LABEL[submission.status]}
                </div>
                {isPending && (
                  <div className="text-sm text-gray-600 mt-1">
                    관리자 검토 대기 중입니다...
                    <div className="text-xs text-blue-600 mt-1">
                      💡 승인 전까지 수정이 가능합니다.
                    </div>
                  </div>
                )}
                {isApproved && (
                  <div className="text-sm text-green-700 mt-1">
                    {submission.totalScore}점이 반영되었습니다.
                  </div>
                )}
                {isPartial && (
                  <div className="text-sm text-yellow-800 mt-1">
                    <span className="font-bold">{submission.approvedScore ?? submission.totalScore}점</span>이 반영되었습니다.
                    {submission.adminComment && (
                      <div className="text-xs text-yellow-700 mt-1">💬 {submission.adminComment}</div>
                    )}
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

        {/* 재학년도 - AI 자동 추출 (v3.3) */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-purple-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📅</div>
              <div>
                <h3 className="font-bold text-gray-900">25년 2학기 기준 재학년도</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {isExtractingGrade
                    ? '이수표에서 학년 추출 중...'
                    : gradeSource === 'auto'
                    ? '이수표에서 자동 추출됨 ✓'
                    : '이수표 업로드 후 자동으로 설정됩니다'}
                </p>
              </div>
            </div>
            <div className="w-48">
              {isExtractingGrade ? (
                <div className="flex items-center justify-center h-12 border-2 border-purple-300 rounded-lg bg-purple-50">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-purple-600"></div>
                  <span className="ml-2 text-sm text-purple-700">추출 중...</span>
                </div>
              ) : (
                <select
                  value={selectedGrade}
                  onChange={(e) => { setSelectedGrade(e.target.value); setGradeSource('manual'); }}
                  disabled={!canEdit}
                  className={`w-full px-4 py-3 border-2 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:bg-gray-100 disabled:cursor-not-allowed font-semibold text-gray-900 ${
                    gradeSource === 'auto'
                      ? 'border-green-400 bg-green-50'
                      : 'border-purple-300'
                  }`}
                >
                  <option value="2학년">2학년</option>
                  <option value="3학년">3학년</option>
                  <option value="4학년">4학년</option>
                </select>
              )}
            </div>
          </div>
          <div className={`mt-3 border rounded-lg p-3 ${
            gradeSource === 'auto'
              ? 'bg-green-50 border-green-200'
              : 'bg-purple-50 border-purple-200'
          }`}>
            <p className={`text-sm ${gradeSource === 'auto' ? 'text-green-800' : 'text-purple-800'}`}>
              {gradeSource === 'auto'
                ? `✅ 이수표 분석을 통해 ${selectedGrade}로 자동 설정되었습니다. 잘못된 경우 직접 변경하세요.`
                : '💡 이수표를 업로드하면 학년이 자동으로 추출됩니다. 업로드 후에도 직접 변경이 가능합니다.'}
            </p>
          </div>
        </div>

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
              📎 교과과정 이수표 업로드 <span className="text-red-500">*</span>
            </h3>
            <span className="text-xs text-gray-400">v3.3</span>
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
                  <br />
                  <span className="text-purple-600 font-medium">첫 번째 파일에서 학년이 자동 추출됩니다</span>
                </div>
              </label>
            </div>
          )}
        </div>

        {/* 지급 관련 정보 입력 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-blue-500">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-gray-900">
              💳 지급 관련 정보 입력 <span className="text-red-500">*</span>
            </h3>
            <span className="text-xs text-blue-600 font-bold">v3.2 NEW</span>
          </div>

          <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3">
            <div className="flex gap-2">
              <div className="text-blue-600">ℹ️</div>
              <div className="text-sm text-blue-800">
                <p className="font-semibold">새로 추가된 필수 입력 항목입니다</p>
                <p className="text-xs mt-1">지급금 수령을 위해 아래 정보를 정확히 입력해주세요.</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* 은행명 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                은행명 <span className="text-red-500">*</span>
              </label>
              <select
                value={paymentInfo.bankName}
                onChange={(e) => setPaymentInfo({ ...paymentInfo, bankName: e.target.value })}
                disabled={!canEdit}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              >
                <option value="">은행을 선택하세요</option>
                <option value="KB국민은행">KB국민은행</option>
                <option value="신한은행">신한은행</option>
                <option value="우리은행">우리은행</option>
                <option value="하나은행">하나은행</option>
                <option value="NH농협은행">NH농협은행</option>
                <option value="IBK기업은행">IBK기업은행</option>
                <option value="SC제일은행">SC제일은행</option>
                <option value="한국씨티은행">한국씨티은행</option>
                <option value="케이뱅크">케이뱅크</option>
                <option value="카카오뱅크">카카오뱅크</option>
                <option value="토스뱅크">토스뱅크</option>
                <option value="부산은행">부산은행</option>
                <option value="대구은행">대구은행</option>
                <option value="광주은행">광주은행</option>
                <option value="경남은행">경남은행</option>
                <option value="전북은행">전북은행</option>
                <option value="제주은행">제주은행</option>
                <option value="새마을금고">새마을금고</option>
                <option value="신협">신협</option>
                <option value="우체국">우체국</option>
              </select>
            </div>

            {/* 계좌번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                계좌번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentInfo.accountNumber}
                onChange={(e) => setPaymentInfo({ ...paymentInfo, accountNumber: e.target.value.replace(/[^0-9-]/g, '') })}
                disabled={!canEdit}
                placeholder="숫자와 하이픈(-)만 입력 (예: 123-456-789012)"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* 예금주 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                예금주 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={paymentInfo.accountHolder}
                onChange={(e) => setPaymentInfo({ ...paymentInfo, accountHolder: e.target.value })}
                disabled={!canEdit}
                placeholder="예금주명을 입력하세요"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex gap-2">
              <div className="text-yellow-600">⚠️</div>
              <div className="text-sm text-yellow-800">
                <p className="font-semibold mb-1">입력 시 주의사항</p>
                <ul className="space-y-1 text-xs">
                  <li>• 지급금을 받을 본인 명의의 계좌를 입력해주세요.</li>
                  <li>• 예금주명은 학생 이름과 일치해야 합니다.</li>
                  <li>• 계좌번호는 정확하게 입력해주세요. (오류 시 지급이 지연될 수 있습니다)</li>
                  <li>• 관리자 승인 전까지 수정이 가능합니다.</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* 신청 기간 외 안내 */}
        {!isApproved && !withinPeriod && periodActive && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
            <div className="flex gap-3">
              <div className="text-red-600 text-xl">🔒</div>
              <div className="text-sm text-red-800">
                <p className="font-semibold">신청 기간이 아닙니다</p>
                <p className="mt-1">신청 기간이 종료되어 제출 및 수정이 불가합니다.</p>
              </div>
            </div>
          </div>
        )}

        {/* 제출/수정/재제출 버튼 */}
        {canEdit && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            {isPending ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '제출 중...' : '✏️ 수정하기'}
              </button>
            ) : isRejected ? (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-bold hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '제출 중...' : '🔄 재제출하기'}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? '제출 중...' : '💾 제출하기'}
              </button>
            )}

            <div className="mt-4 text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              ℹ️ 제출 후에도 관리자 승인 전까지는 수정이 가능합니다.
            </div>
          </div>
        )}

        {/* 안내사항 */}
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
                <li>• 교과과정 이수표, 개인정보동의서, 지급 정보는 필수 입력 사항입니다.</li>
                <li>• 이수표 업로드 시 학년이 자동으로 추출됩니다. 잘못된 경우 직접 수정하세요.</li>
                <li>• 제출 후에도 관리자 승인 전까지는 수정이 가능합니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CoreCoursesCheckPage;
