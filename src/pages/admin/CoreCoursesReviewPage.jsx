import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { FIELD_DEPARTMENTS, SUBMISSION_STATUS_LABEL } from '../../components/coreCourses/constants';
import { calculateStatistics, formatDate } from '../../utils/coreCoursesHelpers';
import SubmissionReviewModal from '../../components/coreCourses/SubmissionReviewModal';
import { useModalStore } from '../../hooks/useModal';
import * as XLSX from 'xlsx';

function CoreCoursesReviewPage() {
  const {
    students,
    coreCourses,
    coreCoursesSubmissions,
    approveCoreCourses,
    rejectCoreCourses,
    partialApproveCoreCourses,
    fetchCoreCoursesSubmissionDetail,
  } = useAppContext();

  const { showAlert } = useModalStore();

  const [selectedField, setSelectedField] = useState('바이오');
  const [selectedDepartment, setSelectedDepartment] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showCourseStats, setShowCourseStats] = useState(false);

  // 일괄 학년 재추출 상태
  const [isBulkExtracting, setIsBulkExtracting] = useState(false);
  const [bulkExtractProgress, setBulkExtractProgress] = useState({ current: 0, total: 0 });
  const [bulkExtractResults, setBulkExtractResults] = useState(null);

  // 필터링된 학생 목록
  const filteredStudents = useMemo(() => {
    return students.filter(
      s => s.grade === 4 &&
      s.field === selectedField &&
      (selectedDepartment === '전체' || s.department === selectedDepartment)
    );
  }, [students, selectedField, selectedDepartment]);

  // 학생별 제출 데이터와 조합
  const studentSubmissions = useMemo(() => {
    return filteredStudents.map(student => {
      const submission = coreCoursesSubmissions.find(sub => sub.studentId === student.id);
      return { student, submission: submission || null };
    });
  }, [filteredStudents, coreCoursesSubmissions]);

  // 상태 필터링
  const statusFilteredData = useMemo(() => {
    if (selectedStatus === 'all') return studentSubmissions;
    if (selectedStatus === 'pending') return studentSubmissions.filter(item => item.submission?.status === 'pending');
    if (selectedStatus === 'approved') return studentSubmissions.filter(item => item.submission?.status === 'approved');
    if (selectedStatus === 'rejected') return studentSubmissions.filter(item => item.submission?.status === 'rejected');
    return studentSubmissions;
  }, [studentSubmissions, selectedStatus]);

  // 검색 필터링
  const searchFilteredData = useMemo(() => {
    if (!searchTerm.trim()) return statusFilteredData;
    const term = searchTerm.toLowerCase();
    return statusFilteredData.filter(item =>
      item.student.studentId.toLowerCase().includes(term) ||
      item.student.name.toLowerCase().includes(term)
    );
  }, [statusFilteredData, searchTerm]);

  // 통계 계산
  const stats = useMemo(() => {
    const submissions = studentSubmissions
      .filter(item => item.submission)
      .map(item => item.submission);
    return calculateStatistics(submissions);
  }, [studentSubmissions]);

  // 과목별 통계 계산
  const courseStats = useMemo(() => {
    if (!coreCourses || coreCourses.length === 0) return [];
    const fieldCourses = coreCourses.filter(
      c => c.field === selectedField &&
      (selectedDepartment === '전체' || c.department === selectedDepartment)
    );
    return fieldCourses.map(course => {
      const completedCount = studentSubmissions.filter(({ submission }) => {
        if (!submission || !submission.completedCourses) return false;
        return submission.completedCourses.some(c => c.courseId === course.id && c.isCompleted);
      }).length;
      const completionRate = filteredStudents.length > 0
        ? Math.round((completedCount / filteredStudents.length) * 100)
        : 0;
      return {
        id: course.id,
        courseName: course.courseName,
        courseType: course.courseType,
        credits: course.credits,
        completedCount,
        completionRate
      };
    }).sort((a, b) => b.completedCount - a.completedCount);
  }, [coreCourses, selectedField, selectedDepartment, studentSubmissions, filteredStudents]);

  const handleFieldChange = (e) => {
    setSelectedField(e.target.value);
    setSelectedDepartment('전체');
  };

  const handleReview = async (submission, student) => {
    setReviewLoading(true);
    const detail = await fetchCoreCoursesSubmissionDetail(submission.id);
    setReviewLoading(false);
    setReviewingSubmission({ submission: detail || submission, student });
  };

  const handleApprove = async (submissionId) => {
    const result = await approveCoreCourses(submissionId);
    if (result.success) {
      showAlert('✅ 승인이 완료되었습니다.\n학생 점수에 반영되었습니다.');
    } else {
      showAlert(`승인 실패: ${result.error}`);
    }
  };

  const handleReject = async (submissionId, reason) => {
    const result = await rejectCoreCourses(submissionId, reason);
    if (result.success) {
      showAlert('❌ 반려 처리되었습니다.\n학생에게 알림이 전송됩니다.');
    } else {
      showAlert(`반려 실패: ${result.error}`);
    }
  };

  const handlePartialApprove = async (submissionId, approvedScore, adminComment) => {
    const result = await partialApproveCoreCourses(submissionId, approvedScore, adminComment);
    if (result.success) {
      showAlert(`🔶 일부 승인이 완료되었습니다.\n${approvedScore}점이 학생에게 반영되었습니다.`);
    } else {
      showAlert(`일부 승인 실패: ${result.error}`);
    }
  };

  // PDF URL → base64 이미지 배열 변환 (CDN 방식 — SubmissionReviewModal과 동일)
  const convertPdfUrlToImages = async (url) => {
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
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
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

  // 일괄 학년 재추출
  const handleBulkGradeExtract = async () => {
    const submissionsWithFiles = coreCoursesSubmissions.filter(
      sub => sub.uploadedFiles && sub.uploadedFiles.length > 0
    );

    if (submissionsWithFiles.length === 0) {
      showAlert('업로드된 파일이 있는 제출 건이 없습니다.');
      return;
    }

    setIsBulkExtracting(true);
    setBulkExtractProgress({ current: 0, total: submissionsWithFiles.length });
    setBulkExtractResults(null);

    let successCount = 0;
    let changedCount = 0;
    let failCount = 0;
    const changedList = [];
    const failedList = [];

    for (let i = 0; i < submissionsWithFiles.length; i++) {
      const submission = submissionsWithFiles[i];
      setBulkExtractProgress({ current: i + 1, total: submissionsWithFiles.length });

      try {
        const firstFile = submission.uploadedFiles[0];
        const isPdf = firstFile.name?.toLowerCase().endsWith('.pdf');

        let body;
        if (isPdf) {
          const imageDataList = await convertPdfUrlToImages(firstFile.url);
          body = { mode: 'extractGrade', imageDataList, fileName: firstFile.name };
        } else {
          body = { mode: 'extractGrade', fileUrl: firstFile.url, fileName: firstFile.name };
        }

        const { data, error } = await supabase.functions.invoke('analyze-certificate', { body });
        if (error) throw error;

        if (data?.success && data?.data?.grade) {
          const newGrade = data.data.grade;
          successCount++;

          if (newGrade !== submission.gradeAt2025Fall) {
            await supabase
              .from('core_courses_submissions_2025_11_27_07_17')
              .update({ grade_at_2025_fall: newGrade })
              .eq('id', submission.id);

            const student = students.find(s => s.id === submission.studentId);
            changedList.push({
              name: student?.name || '(이름 없음)',
              studentId: student?.studentId || '',
              before: submission.gradeAt2025Fall || '미설정',
              after: newGrade
            });
            changedCount++;
          }
        } else {
          throw new Error('학년 추출 실패');
        }
      } catch (err) {
        failCount++;
        const student = students.find(s => s.id === submission.studentId);
        failedList.push(student?.name || submission.studentId);
        console.error(`학년 추출 실패 (${submission.studentId}):`, err);
      }
    }

    setIsBulkExtracting(false);
    setBulkExtractResults({
      total: submissionsWithFiles.length,
      successCount,
      changedCount,
      failCount,
      changedList,
      failedList
    });
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    try {
      const excelData = searchFilteredData.map(({ student, submission }) => ({
        '학번': student.studentId,
        '이름': student.name,
        '학과': student.department,
        '재학년도': submission?.gradeAt2025Fall || '-',
        '이수과목수': submission?.totalCompletedCount || 0,
        '점수': submission?.status === 'partial' && submission?.approvedScore != null
          ? submission.approvedScore
          : (submission?.totalScore || 0),
        '제출상태': submission ? SUBMISSION_STATUS_LABEL[submission.status] : '미제출',
        '제출일시': submission ? formatDate(submission.submittedAt) : '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '핵심교과목 이수현황');
      worksheet['!cols'] = [
        { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 12 },
        { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 20 }
      ];
      const fileName = `핵심교과목_이수현황_${selectedField}_${selectedDepartment}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      showAlert(`✅ ${searchFilteredData.length}건의 데이터를 다운로드했습니다.`);
    } catch (error) {
      showAlert('❌ 엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 과목별 통계 다운로드
  const handleCourseStatsDownload = () => {
    try {
      const excelData = courseStats.map(stat => ({
        '과목명': stat.courseName,
        '과목구분': stat.courseType,
        '학점': stat.credits,
        '이수학생수': stat.completedCount,
        '이수율': `${stat.completionRate}%`,
        '미이수학생수': filteredStudents.length - stat.completedCount
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '과목별통계');
      worksheet['!cols'] = [
        { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
      ];
      const fileName = `과목별통계_${selectedField}_${selectedDepartment}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);
      showAlert(`✅ ${courseStats.length}개 과목의 통계를 다운로드했습니다.`);
    } catch (error) {
      showAlert('❌ 통계 다운로드 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status) => {
    if (!status) {
      return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">미제출</span>;
    }
    const colors = {
      'pending': 'bg-yellow-100 text-yellow-800',
      'approved': 'bg-green-100 text-green-800',
      'rejected': 'bg-red-100 text-red-800'
    };
    return (
      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${colors[status]}`}>
        {SUBMISSION_STATUS_LABEL[status]}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">📊 핵심 교과목 이수 현황</h1>

          {/* 필터 */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">분야</label>
              <select
                value={selectedField}
                onChange={handleFieldChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(FIELD_DEPARTMENTS).map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">전공</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="전체">전체</option>
                {FIELD_DEPARTMENTS[selectedField].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제출 상태</label>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">전체</option>
                <option value="pending">검토 대기</option>
                <option value="approved">승인</option>
                <option value="rejected">반려</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="학번/이름 검색..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">전체 학생</div>
            <div className="text-2xl font-bold text-gray-900">{filteredStudents.length}명</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">제출 완료</div>
            <div className="text-2xl font-bold text-blue-600">{stats.submittedCount}명</div>
            <div className="text-xs text-gray-500">
              {filteredStudents.length > 0 ? Math.round((stats.submittedCount / filteredStudents.length) * 100) : 0}%
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">검토 대기</div>
            <div className="text-2xl font-bold text-yellow-600">{stats.pendingCount}건</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">평균 점수</div>
            <div className="text-2xl font-bold text-green-600">{stats.avgScore}점</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">평균 이수율</div>
            <div className="text-2xl font-bold text-purple-600">{stats.avgCompletionRate}%</div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleExcelDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              엑셀 다운로드
            </button>
            <button
              onClick={() => setShowCourseStats(!showCourseStats)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {showCourseStats ? '과목별 통계 닫기' : '과목별 통계'}
            </button>

            {/* 일괄 학년 재추출 버튼 */}
            <button
              onClick={handleBulkGradeExtract}
              disabled={isBulkExtracting}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isBulkExtracting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>
                    학년 추출 중... ({bulkExtractProgress.current}/{bulkExtractProgress.total})
                  </span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  학년 일괄 재추출
                </>
              )}
            </button>
          </div>

          {/* 진행률 바 */}
          {isBulkExtracting && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: bulkExtractProgress.total > 0
                      ? `${(bulkExtractProgress.current / bulkExtractProgress.total) * 100}%`
                      : '0%'
                  }}
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">
                이수표를 분석하여 학년을 추출하고 있습니다. 잠시만 기다려주세요.
              </p>
            </div>
          )}

          {/* 추출 결과 패널 */}
          {bulkExtractResults && !isBulkExtracting && (
            <div className="mt-4 border border-purple-200 rounded-lg p-4 bg-purple-50">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-purple-900">학년 일괄 재추출 완료</h4>
                <button
                  onClick={() => { setBulkExtractResults(null); window.location.reload(); }}
                  className="text-xs text-purple-600 underline hover:text-purple-800"
                >
                  닫고 새로고침
                </button>
              </div>
              <div className="grid grid-cols-4 gap-3 mb-3">
                <div className="bg-white rounded-lg p-3 text-center border border-purple-100">
                  <div className="text-lg font-bold text-gray-900">{bulkExtractResults.total}</div>
                  <div className="text-xs text-gray-600">전체 처리</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-green-200">
                  <div className="text-lg font-bold text-green-700">{bulkExtractResults.successCount}</div>
                  <div className="text-xs text-gray-600">추출 성공</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-blue-200">
                  <div className="text-lg font-bold text-blue-700">{bulkExtractResults.changedCount}</div>
                  <div className="text-xs text-gray-600">학년 변경</div>
                </div>
                <div className="bg-white rounded-lg p-3 text-center border border-red-200">
                  <div className="text-lg font-bold text-red-700">{bulkExtractResults.failCount}</div>
                  <div className="text-xs text-gray-600">추출 실패</div>
                </div>
              </div>

              {/* 변경된 학생 목록 */}
              {bulkExtractResults.changedList.length > 0 && (
                <div className="mb-3">
                  <p className="text-sm font-medium text-gray-700 mb-2">학년이 변경된 학생:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {bulkExtractResults.changedList.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm bg-white rounded px-3 py-1.5 border border-gray-100">
                        <span className="font-medium text-gray-900">{item.name}</span>
                        <span className="text-gray-400 text-xs">{item.studentId}</span>
                        <span className="ml-auto flex items-center gap-1">
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">{item.before}</span>
                          <span className="text-gray-400">→</span>
                          <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">{item.after}</span>
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 실패 목록 */}
              {bulkExtractResults.failedList.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-red-700 mb-1">
                    추출 실패 ({bulkExtractResults.failedList.length}건): {bulkExtractResults.failedList.join(', ')}
                  </p>
                  <p className="text-xs text-gray-500">실패한 학생은 수동으로 학년을 확인해주세요.</p>
                </div>
              )}

              <p className="text-xs text-purple-700 mt-2 font-medium">
                ✅ DB 업데이트 완료. "닫고 새로고침"을 눌러 변경 사항을 확인하세요.
              </p>
            </div>
          )}
        </div>

        {/* 과목별 통계 섹션 */}
        {showCourseStats && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">📈 과목별 이수 통계</h2>
              <button
                onClick={handleCourseStatsDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors text-sm"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                통계 다운로드
              </button>
            </div>
            {courseStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">과목 데이터가 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">과목명</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">구분</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">학점</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">이수학생</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">이수율</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase">진행도</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {courseStats.map((stat) => (
                      <tr key={stat.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.courseName}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{stat.courseType}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{stat.credits}</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-blue-600">{stat.completedCount}명</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">{stat.completionRate}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${stat.completionRate}%` }}
                              />
                            </div>
                            <span className="text-xs text-gray-600 w-12 text-right">
                              {stat.completedCount}/{filteredStudents.length}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* 제출 현황 테이블 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {searchFilteredData.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">🔍</div>
              <p className="text-gray-500 text-lg">검색 결과가 없습니다.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">학번</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">이름</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">재학년도</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">이수 과목</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">점수</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">증빙</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">제출 상태</th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">관리</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchFilteredData.map(({ student, submission }) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.studentId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {submission?.gradeAt2025Fall ? (
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-medium">
                            {submission.gradeAt2025Fall}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {submission ? `${submission.totalCompletedCount}개` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-blue-600">
                        {submission ? (
                          submission.status === 'partial' && submission.approvedScore != null
                            ? <span title={`자동계산: ${submission.totalScore}점`}>{submission.approvedScore}점 🔶</span>
                            : `${submission.totalScore}점`
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {(submission?.hasUploadedFiles || submission?.transcriptFileName) ? (
                          <span className="text-green-600">📄 있음</span>
                        ) : (
                          <span className="text-red-600">❌</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {getStatusBadge(submission?.status)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        {submission ? (
                          <button
                            onClick={() => handleReview(submission, student)}
                            disabled={reviewLoading}
                            className="text-blue-600 hover:text-blue-900 disabled:text-gray-400 disabled:cursor-wait"
                          >
                            {reviewLoading ? '로딩...' : (submission.status === 'pending' ? '검토' : '보기')}
                          </button>
                        ) : (
                          <button className="text-gray-400 cursor-not-allowed">미제출</button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* 검토 모달 */}
      {reviewingSubmission && (
        <SubmissionReviewModal
          isOpen={!!reviewingSubmission}
          onClose={() => setReviewingSubmission(null)}
          submission={reviewingSubmission.submission}
          student={reviewingSubmission.student}
          onApprove={handleApprove}
          onReject={handleReject}
          onPartialApprove={handlePartialApprove}
        />
      )}
    </div>
  );
}

export default CoreCoursesReviewPage;
