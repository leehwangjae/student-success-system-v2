import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
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

  // 필터링된 학생 목록 (4학년 + 선택한 학과)
  const filteredStudents = useMemo(() => {
    const filtered = students.filter(
      s => s.grade === 4 && 
      s.field === selectedField && 
      (selectedDepartment === '전체' || s.department === selectedDepartment)
    );
    
    return filtered;
  }, [students, selectedField, selectedDepartment]);

  // 학생별 제출 데이터와 조합
  const studentSubmissions = useMemo(() => {
    const result = filteredStudents.map(student => {
      const submission = coreCoursesSubmissions.find(sub => sub.studentId === student.id);
      return {
        student,
        submission: submission || null
      };
    });
    
    return result;
  }, [filteredStudents, coreCoursesSubmissions]);

  // 상태 필터링
  const statusFilteredData = useMemo(() => {
    if (selectedStatus === 'all') return studentSubmissions;
    if (selectedStatus === 'pending') {
      return studentSubmissions.filter(item => item.submission?.status === 'pending');
    }
    if (selectedStatus === 'approved') {
      return studentSubmissions.filter(item => item.submission?.status === 'approved');
    }
    if (selectedStatus === 'rejected') {
      return studentSubmissions.filter(item => item.submission?.status === 'rejected');
    }
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
        return submission.completedCourses.some(
          c => c.courseId === course.id && c.isCompleted
        );
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
    const newField = e.target.value;
    setSelectedField(newField);
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

  // 엑셀 다운로드 함수
  const handleExcelDownload = () => {
    try {
      const excelData = searchFilteredData.map(({ student, submission }) => ({
        '학번': student.studentId,
        '이름': student.name,
        '학과': student.department,
        '재학년도': submission?.gradeAt2025Fall || '-',
        '이수과목수': submission?.totalCompletedCount || 0,
        '점수': submission?.totalScore || 0,
        '제출상태': submission ? SUBMISSION_STATUS_LABEL[submission.status] : '미제출',
        '제출일시': submission ? formatDate(submission.submittedAt) : '-'
      }));

      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '핵심교과목 이수현황');

      // 컬럼 너비 설정
      const columnWidths = [
        { wch: 12 }, // 학번
        { wch: 10 }, // 이름
        { wch: 20 }, // 학과
        { wch: 12 }, // 재학년도
        { wch: 12 }, // 이수과목수
        { wch: 8 },  // 점수
        { wch: 12 }, // 제출상태
        { wch: 20 }  // 제출일시
      ];
      worksheet['!cols'] = columnWidths;

      const fileName = `핵심교과목_이수현황_${selectedField}_${selectedDepartment}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      showAlert(`✅ ${searchFilteredData.length}건의 데이터를 다운로드했습니다.`);
    } catch (error) {
      console.error('엑셀 다운로드 실패:', error);
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

      const columnWidths = [
        { wch: 30 }, // 과목명
        { wch: 12 }, // 과목구분
        { wch: 8 },  // 학점
        { wch: 12 }, // 이수학생수
        { wch: 10 }, // 이수율
        { wch: 12 }  // 미이수학생수
      ];
      worksheet['!cols'] = columnWidths;

      const fileName = `과목별통계_${selectedField}_${selectedDepartment}_${new Date().toISOString().split('T')[0]}.xlsx`;
      XLSX.writeFile(workbook, fileName);

      showAlert(`✅ ${courseStats.length}개 과목의 통계를 다운로드했습니다.`);
    } catch (error) {
      console.error('통계 다운로드 실패:', error);
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
          <div className="flex gap-3">
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
          </div>
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
              <div className="text-center py-8 text-gray-500">
                과목 데이터가 없습니다.
              </div>
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
                        <td className="px-4 py-3 text-center text-sm font-semibold text-blue-600">
                          {stat.completedCount}명
                        </td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">
                          {stat.completionRate}%
                        </td>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학번
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이름
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      재학년도
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      이수 과목
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      점수
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      증빙
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      제출 상태
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchFilteredData.map(({ student, submission }) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {student.studentId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name}
                      </td>
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
                        {submission ? `${submission.totalScore}점` : '-'}
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
                          <button className="text-gray-400 cursor-not-allowed">
                            미제출
                          </button>
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
        />
      )}
    </div>
  );
}

export default CoreCoursesReviewPage;