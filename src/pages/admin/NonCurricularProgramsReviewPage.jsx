import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import { SUBMISSION_STATUS_LABEL } from '../../components/nonCurricularPrograms/constants';
import { calculateStatistics, formatDate, groupProgramsByCategory } from '../../utils/nonCurricularHelpers';
import NonCurricularSubmissionReviewModal from '../../components/nonCurricularPrograms/NonCurricularSubmissionReviewModal';
import { useModalStore } from '../../hooks/useModal';
import * as XLSX from 'xlsx';

function NonCurricularProgramsReviewPage() {
  const {
    students,
    nonCurricularPrograms,
    nonCurricularSubmissions,
    approveNonCurricularPrograms,
    rejectNonCurricularPrograms,
    partialApproveNonCurricularPrograms,
    fetchNonCurricularSubmissionDetail,
  } = useAppContext();

  const { showAlert } = useModalStore();

  const [selectedField, setSelectedField] = useState('바이오');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [reviewingSubmission, setReviewingSubmission] = useState(null);
  const [reviewLoading, setReviewLoading] = useState(false);
  const [showProgramStats, setShowProgramStats] = useState(false);

  // 필터링된 학생 목록
  const filteredStudents = useMemo(() => {
    return students.filter(s => s.field === selectedField);
  }, [students, selectedField]);

  // 학생별 제출 데이터 조합
  const studentSubmissions = useMemo(() => {
    return filteredStudents.map(student => {
      const submission = nonCurricularSubmissions.find(sub => sub.studentId === student.id);
      return { student, submission: submission || null };
    });
  }, [filteredStudents, nonCurricularSubmissions]);

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
    const submissions = studentSubmissions.filter(item => item.submission).map(item => item.submission);
    return calculateStatistics(submissions);
  }, [studentSubmissions]);

  // 프로그램별 통계
  const programStats = useMemo(() => {
    if (!nonCurricularPrograms || nonCurricularPrograms.length === 0) return [];
    const fieldPrograms = nonCurricularPrograms.filter(p => p.field === selectedField);
    return fieldPrograms.map(program => {
      const completedCount = studentSubmissions.filter(({ submission }) => {
        if (!submission || !submission.completedPrograms) return false;
        return submission.completedPrograms.some(p => p.programId === program.id);
      }).length;
      const completionRate = filteredStudents.length > 0
        ? Math.round((completedCount / filteredStudents.length) * 100) : 0;
      return {
        id: program.id,
        programName: program.program_name,
        category: program.category,
        score: program.score,
        completedCount,
        completionRate
      };
    }).sort((a, b) => b.completedCount - a.completedCount);
  }, [nonCurricularPrograms, selectedField, studentSubmissions, filteredStudents]);

  // 검토 모달 열기
  const handleReview = async (submission, student) => {
    setReviewLoading(true);
    const detail = await fetchNonCurricularSubmissionDetail(submission.id);
    setReviewLoading(false);
    setReviewingSubmission({ submission: detail || submission, student });
  };

  // 승인
  const handleApprove = async (submissionId) => {
    const result = await approveNonCurricularPrograms(submissionId);
    if (result.success) {
      showAlert('✅ 승인이 완료되었습니다.\n학생 점수에 반영되었습니다.');
    } else {
      showAlert(`승인 실패: ${result.error}`);
    }
  };

  // 반려
  const handleReject = async (submissionId, reason) => {
    const result = await rejectNonCurricularPrograms(submissionId, reason);
    if (result.success) {
      showAlert('❌ 반려 처리되었습니다.\n학생에게 알림이 전송됩니다.');
    } else {
      showAlert(`반려 실패: ${result.error}`);
    }
  };

  // 일부 승인
  const handlePartialApprove = async (submissionId, approvedScore, adminComment) => {
    const result = await partialApproveNonCurricularPrograms(submissionId, approvedScore, adminComment);
    if (result.success) {
      showAlert(`🔶 일부 승인이 완료되었습니다.\n${approvedScore}점이 학생에게 반영되었습니다.`);
    } else {
      showAlert(`일부 승인 실패: ${result.error}`);
    }
  };

  // ── 관리자 제출 내역 수정 ──────────────────────────────────────────────
  const handleUpdateSubmission = async (submissionId, updatedData) => {
    const totalScore = updatedData.completedPrograms.reduce((sum, p) => sum + (p.score || 0), 0);
    const totalProgramCount = updatedData.completedPrograms.length;

    const { error } = await supabase
      .from('non_curricular_submissions_2025_11_27_07_17')
      .update({
        completed_programs: updatedData.completedPrograms,
        total_program_count: totalProgramCount,
        total_score: totalScore,
        // 수정 시 검토 대기 상태로 초기화 (재검토 필요)
        status: 'pending',
        approved_score: null,
        admin_comment: null,
        rejection_reason: null,
        reviewed_at: null,
        updated_at: new Date().toISOString()
      })
      .eq('id', submissionId);

    if (error) throw new Error(error.message);

    // 모달 데이터 갱신
    const freshDetail = await fetchNonCurricularSubmissionDetail(submissionId);
    if (freshDetail) {
      setReviewingSubmission(prev => ({ ...prev, submission: freshDetail }));
    }

    showAlert(`✅ 수정이 완료되었습니다.\n프로그램 ${totalProgramCount}개 · ${totalScore}점으로 업데이트되었습니다.\n제출 상태가 "검토 대기"로 변경되었습니다.`);
  };

  // 엑셀 다운로드
  const handleExcelDownload = () => {
    try {
      const excelData = searchFilteredData.map(({ student, submission }) => ({
        '학번': student.studentId,
        '이름': student.name,
        '학과': student.department,
        '이수프로그램수': submission?.totalProgramCount || 0,
        '점수': submission?.status === 'partial' && submission?.approvedScore != null
          ? submission.approvedScore : (submission?.totalScore || 0),
        '제출상태': submission ? SUBMISSION_STATUS_LABEL[submission.status] : '미제출',
        '제출일시': submission ? formatDate(submission.submitted_at) : '-'
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '비교과프로그램 이수현황');
      worksheet['!cols'] = [
        { wch: 12 }, { wch: 10 }, { wch: 20 }, { wch: 14 },
        { wch: 8 }, { wch: 12 }, { wch: 20 }
      ];
      XLSX.writeFile(workbook, `비교과프로그램_이수현황_${selectedField}_${new Date().toISOString().split('T')[0]}.xlsx`);
      showAlert(`✅ ${searchFilteredData.length}건의 데이터를 다운로드했습니다.`);
    } catch (error) {
      showAlert('❌ 엑셀 다운로드 중 오류가 발생했습니다.');
    }
  };

  // 프로그램별 통계 다운로드
  const handleProgramStatsDownload = () => {
    try {
      const excelData = programStats.map(stat => ({
        '프로그램명': stat.programName,
        '카테고리': stat.category,
        '배점': stat.score,
        '이수학생수': stat.completedCount,
        '이수율': `${stat.completionRate}%`,
        '미이수학생수': filteredStudents.length - stat.completedCount
      }));
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '프로그램별통계');
      worksheet['!cols'] = [
        { wch: 30 }, { wch: 12 }, { wch: 8 }, { wch: 12 }, { wch: 10 }, { wch: 12 }
      ];
      XLSX.writeFile(workbook, `프로그램별통계_${selectedField}_${new Date().toISOString().split('T')[0]}.xlsx`);
      showAlert(`✅ ${programStats.length}개 프로그램의 통계를 다운로드했습니다.`);
    } catch (error) {
      showAlert('❌ 통계 다운로드 중 오류가 발생했습니다.');
    }
  };

  const getStatusBadge = (status) => {
    if (!status) return <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">미제출</span>;
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">🎯 비교과 프로그램 이수 현황</h1>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">분야</label>
              <select value={selectedField} onChange={(e) => setSelectedField(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="바이오">바이오</option>
                <option value="반도체">반도체</option>
                <option value="물류">물류</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">제출 상태</label>
              <select value={selectedStatus} onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
                <option value="all">전체</option>
                <option value="pending">검토 대기</option>
                <option value="approved">승인</option>
                <option value="rejected">반려</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">검색</label>
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="학번/이름 검색..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>

        {/* 통계 카드 */}
        <div className="grid grid-cols-5 gap-4 mb-6">
          {[
            { label: '전체 학생', value: `${filteredStudents.length}명`, color: 'text-gray-900' },
            { label: '제출 완료', value: `${stats.submittedCount}명`, sub: `${filteredStudents.length > 0 ? Math.round((stats.submittedCount / filteredStudents.length) * 100) : 0}%`, color: 'text-blue-600' },
            { label: '검토 대기', value: `${stats.pendingCount}건`, color: 'text-yellow-600' },
            { label: '평균 점수', value: `${stats.avgScore}점`, color: 'text-green-600' },
            { label: '평균 프로그램', value: `${stats.avgProgramCount}개`, color: 'text-purple-600' }
          ].map(({ label, value, sub, color }) => (
            <div key={label} className="bg-white rounded-lg shadow-sm p-4">
              <div className="text-sm text-gray-600 mb-1">{label}</div>
              <div className={`text-2xl font-bold ${color}`}>{value}</div>
              {sub && <div className="text-xs text-gray-500">{sub}</div>}
            </div>
          ))}
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-3">
            <button onClick={handleExcelDownload}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              엑셀 다운로드
            </button>
            <button onClick={() => setShowProgramStats(!showProgramStats)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              {showProgramStats ? '프로그램별 통계 닫기' : '프로그램별 통계'}
            </button>
          </div>
        </div>

        {/* 프로그램별 통계 */}
        {showProgramStats && (
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">📈 프로그램별 이수 통계</h2>
              <button onClick={handleProgramStatsDownload}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 text-sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                </svg>
                통계 다운로드
              </button>
            </div>
            {programStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">프로그램 데이터가 없습니다.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      {['프로그램명', '카테고리', '배점', '이수학생', '이수율', '진행도'].map(h => (
                        <th key={h} className={`px-4 py-3 text-xs font-medium text-gray-500 uppercase ${h === '프로그램명' ? 'text-left' : 'text-center'}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {programStats.map((stat) => (
                      <tr key={stat.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{stat.programName}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{stat.category}</td>
                        <td className="px-4 py-3 text-center text-sm text-gray-600">{stat.score}점</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-blue-600">{stat.completedCount}명</td>
                        <td className="px-4 py-3 text-center text-sm font-semibold text-green-600">{stat.completionRate}%</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 rounded-full h-2">
                              <div className="bg-blue-600 h-2 rounded-full transition-all" style={{ width: `${stat.completionRate}%` }} />
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
                    {['학번', '이름', '이수 프로그램', '점수', '증빙파일', '제출 상태', '관리'].map((h, i) => (
                      <th key={h} className={`px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider ${i < 2 ? 'text-left' : 'text-center'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {searchFilteredData.map(({ student, submission }) => (
                    <tr key={student.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.studentId}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-900">
                        {submission ? `${submission.totalProgramCount}개` : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-semibold text-blue-600">
                        {submission ? (
                          submission.status === 'partial' && submission.approvedScore != null
                            ? <span title={`자동계산: ${submission.totalScore}점`}>{submission.approvedScore}점 🔶</span>
                            : `${submission.totalScore}점`
                        ) : '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {submission?.hasCertificateFiles
                          ? <span className="text-green-600">📄 있음</span>
                          : <span className="text-red-600">❌</span>}
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
                          <span className="text-gray-400">미제출</span>
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
        <NonCurricularSubmissionReviewModal
          isOpen={!!reviewingSubmission}
          onClose={() => setReviewingSubmission(null)}
          submission={reviewingSubmission.submission}
          student={reviewingSubmission.student}
          onApprove={handleApprove}
          onReject={handleReject}
          onPartialApprove={handlePartialApprove}
          onUpdate={handleUpdateSubmission}
          nonCurricularPrograms={nonCurricularPrograms.filter(
            p => p.field === reviewingSubmission.student.field
          )}
        />
      )}
    </div>
  );
}

export default NonCurricularProgramsReviewPage;
