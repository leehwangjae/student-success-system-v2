import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { FIELD_DEPARTMENTS, SUBMISSION_STATUS_LABEL } from '../../components/coreCourses/constants';
import { calculateStatistics, formatDate } from '../../utils/coreCoursesHelpers';
import SubmissionReviewModal from '../../components/coreCourses/SubmissionReviewModal';
import { useModalStore } from '../../hooks/useModal';

function CoreCoursesReviewPage() {
  const {
    students,
    coreCoursesSubmissions,
    approveCoreCourses,
    rejectCoreCourses
  } = useAppContext();

  const { showAlert } = useModalStore();

  const [selectedField, setSelectedField] = useState('바이오');
  const [selectedDepartment, setSelectedDepartment] = useState('전체');
  const [selectedStatus, setSelectedStatus] = useState('all'); // all/pending/approved/rejected
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingSubmission, setReviewingSubmission] = useState(null);

  // 필터링된 학생 목록 (4학년 + 선택한 학과)
  const filteredStudents = useMemo(() => {
    console.log('=== 학생 필터링 ===');
    console.log('전체 students:', students.length);
    console.log('students 배열 전체:', students);
    console.log('selectedField:', selectedField);
    console.log('selectedDepartment:', selectedDepartment);
    
    // 각 학생별로 필터 조건 확인
    students.forEach(s => {
      console.log(`학생 ${s.name || s.studentId}:`, {
        id: s.id,
        grade: s.grade,
        field: s.field,
        department: s.department,
        grade조건: s.grade === 4,
        field조건: s.field === selectedField,
        department조건: selectedDepartment === '전체' || s.department === selectedDepartment,
        전체조건통과: s.grade === 4 && s.field === selectedField && (selectedDepartment === '전체' || s.department === selectedDepartment)
      });
    });
    
    const filtered = students.filter(
      s => s.grade === 4 && 
      s.field === selectedField && 
      (selectedDepartment === '전체' || s.department === selectedDepartment)
    );
    
    console.log('필터링된 학생:', filtered.length, filtered);
    return filtered;
  }, [students, selectedField, selectedDepartment]);

  // 학생별 제출 데이터와 조합
  const studentSubmissions = useMemo(() => {
    console.log('=== 제출 데이터 매칭 ===');
    console.log('filteredStudents:', filteredStudents.length);
    console.log('coreCoursesSubmissions:', coreCoursesSubmissions.length, coreCoursesSubmissions);
    
    const result = filteredStudents.map(student => {
      const submission = coreCoursesSubmissions.find(sub => sub.studentId === student.id);
      console.log(`학생 ${student.name} (id: ${student.id}):`, submission ? '제출 있음' : '제출 없음');
      return {
        student,
        submission: submission || null
      };
    });
    
    console.log('매칭 결과:', result);
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

  const handleFieldChange = (e) => {
    const newField = e.target.value;
    setSelectedField(newField);
    setSelectedDepartment('전체');
  };

  const handleReview = (submission, student) => {
    setReviewingSubmission({ submission, student });
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
            <div className="text-2xl font-bold text-gray-900">{stats.totalStudents}명</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-600 mb-1">제출 완료</div>
            <div className="text-2xl font-bold text-blue-600">{stats.submittedCount}명</div>
            <div className="text-xs text-gray-500">
              {stats.totalStudents > 0 ? Math.round((stats.submittedCount / stats.totalStudents) * 100) : 0}%
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
            <button className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              엑셀 다운로드
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              과목별 통계
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              미제출자 독촉
            </button>
          </div>
        </div>

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
                        {submission ? `${submission.totalCompletedCount}개` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-blue-600">
                        {submission ? `${submission.totalScore}점` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {submission?.transcriptFileName ? (
                          <span className="text-green-600">📄</span>
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
                            className="text-blue-600 hover:text-blue-900"
                          >
                            {submission.status === 'pending' ? '검토' : '보기'}
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