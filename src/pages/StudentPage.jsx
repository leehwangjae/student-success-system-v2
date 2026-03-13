import React, { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import ProgramDetailModal from '../components/modals/ProgramDetailModal';
import NoticeDetailModal from '../components/modals/NoticeDetailModal';
import { supabase } from '../lib/supabase';
import { useModalStore } from '../hooks/useModal';
import {
  POINTS_PER_COURSE,
  MAX_COURSES,
  FILE_UPLOAD_CONFIG,
  SUBMISSION_STATUS_LABEL
} from '../components/coreCourses/constants';
import {
  calculateCoreCoursesScore,
  isDuplicateCourse,
  canAddMoreCourses,
  groupCoursesByType,
  validateFile,
  fileToBase64,
  formatFileSize
} from '../utils/coreCoursesHelpers';
import NonCurricularProgramsApplicationPage from './student/NonCurricularProgramsApplicationPage';
import CoreCoursesCheckPage from './student/CoreCoursesCheckPage';
import QuestionBoardPage from './student/QuestionBoardPage';
import SurveyPage from './student/SurveyPage';
import MyInfo from '../components/student/MyInfo';

function StudentPage() {
  const {
    currentUser,
    setCurrentUser,
    programs,
    notices,
    programApplications,
    applyForProgram,
    coreCourses,
    getCoreCoursesByDepartment,
    getStudentSubmission,
    submitCoreCourses
  } = useAppContext();

  const { showAlert, showConfirm } = useModalStore();

  const [activeTab, setActiveTab] = useState('info');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [showLoginPopup, setShowLoginPopup] = useState(false);
  const [popupNotices, setPopupNotices] = useState([]);

  // 핵심교과목 관련 상태
  const [completedCourses, setCompletedCourses] = useState([]);
  const [transcriptFile, setTranscriptFile] = useState(null);
  const [transcriptFileName, setTranscriptFileName] = useState('');
  const [transcriptFileSize, setTranscriptFileSize] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 로그인 시 팝업 공지사항 확인
  useEffect(() => {
    if (!currentUser?.id || !notices || notices.length === 0) return;

    const checkPopupNotices = () => {
      // 오늘 날짜
      const today = new Date().toISOString().split('T')[0];
      const dismissedKey = `dismissed_popups_${currentUser.id}`;
      const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '{}');

      // 팝업으로 표시할 공지사항 필터링
      const popups = notices.filter(notice => {
        // isPopup 속성이 true인 공지사항만
        if (!notice.isPopup) return false;

        // 내 분야 또는 전체 공지사항만
        if (notice.field !== '전체' && notice.field !== currentUser.field) return false;

        // 오늘 이미 "오늘 하루 보지 않기"를 선택한 공지는 제외
        if (dismissed[notice.id] === today) return false;

        // "다시 보지 않기"를 선택한 공지는 제외
        if (dismissed[notice.id] === 'forever') return false;

        return true;
      });

      if (popups.length > 0) {
        setPopupNotices(popups);
        setShowLoginPopup(true);
      }
    };

    checkPopupNotices();
  }, [currentUser?.id, notices, currentUser?.field]);

  const handleDismissPopup = (noticeId, dismissType) => {
    const dismissedKey = `dismissed_popups_${currentUser.id}`;
    const dismissed = JSON.parse(localStorage.getItem(dismissedKey) || '{}');

    if (dismissType === 'today') {
      // 오늘 하루 보지 않기
      dismissed[noticeId] = new Date().toISOString().split('T')[0];
    } else if (dismissType === 'forever') {
      // 다시 보지 않기
      dismissed[noticeId] = 'forever';
    }

    localStorage.setItem(dismissedKey, JSON.stringify(dismissed));

    // 남은 팝업 업데이트
    const remaining = popupNotices.filter(n => n.id !== noticeId);
    setPopupNotices(remaining);

    if (remaining.length === 0) {
      setShowLoginPopup(false);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
  };

  const myApplications = programApplications.filter(
    app => app.studentId === currentUser?.id
  );

  const handleApplyProgram = async (program) => {
    try {
      await applyForProgram(program.id);
      alert('프로그램 신청이 완료되었습니다.');
    } catch (error) {
      alert('프로그램 신청 중 오류가 발생했습니다.');
      console.error('신청 오류:', error);
    }
  };

  const renderInfoTab = () => <MyInfo />;

  const renderProgramsTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">프로그램</h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {programs
          .filter(p => p.field === currentUser?.field || p.field === '전체')
          .filter(p => p.status === '모집중')
          .map(program => {
            const hasApplied = myApplications.some(app => app.programId === program.id);
            
            return (
              <div key={program.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex justify-between items-start mb-3">
                    <h3 className="text-lg font-bold text-gray-800 flex-1">{program.title}</h3>
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-800 ml-2">
                      {program.status}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">분류:</span>
                      <span className={`px-2 py-0.5 rounded text-xs ${
                        program.category === '비교과' ? 'bg-purple-100 text-purple-800' :
                        program.category === '산학협력' ? 'bg-orange-100 text-orange-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {program.category}
                      </span>
                    </div>
                    <p><span className="font-semibold">기간:</span> {program.startDate} ~ {program.endDate}</p>
                    <p className="text-blue-600 font-bold">
                      <span className="font-semibold text-gray-600">점수:</span> {program.score}점
                    </p>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setSelectedProgram(program);
                        setShowProgramModal(true);
                      }}
                      className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
                    >
                      상세보기
                    </button>
                    {!hasApplied && (
                      <button
                        onClick={() => handleApplyProgram(program)}
                        className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700"
                      >
                        신청하기
                      </button>
                    )}
                    {hasApplied && (
                      <div className="flex-1 px-4 py-2 bg-gray-300 text-gray-600 rounded-lg font-semibold text-center">
                        신청완료
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );

  const renderApplicationHistoryTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">신청 내역</h2>

      <div className="space-y-4">
        {myApplications.map(app => {
          const program = programs.find(p => p.id === app.programId);
          if (!program) return null;

          return (
            <div key={app.id} className="bg-white rounded-lg shadow-md p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-bold text-gray-800">{program.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      app.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      app.status === 'approved' ? 'bg-green-100 text-green-800' :
                      app.status === 'completed' ? 'bg-blue-100 text-blue-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {app.status === 'pending' ? '심사중' :
                       app.status === 'approved' ? '승인됨' :
                       app.status === 'completed' ? '이수완료' : '거부됨'}
                    </span>
                  </div>

                  <div className="text-sm text-gray-600 space-y-1">
                    <p><span className="font-semibold">분야:</span> {program.field}</p>
                    <p><span className="font-semibold">신청일:</span> {app.appliedDate}</p>
                    {app.completedDate && (
                      <p><span className="font-semibold">완료일:</span> {app.completedDate}</p>
                    )}
                    <p className="text-blue-600 font-bold">
                      <span className="font-semibold text-gray-600">획득 점수:</span> {program.score}점
                    </p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {myApplications.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <p className="text-gray-500">신청 내역이 없습니다.</p>
          </div>
        )}
      </div>
    </div>
  );

  const renderNoticesTab = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-800">공지사항</h2>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">제목</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">분야</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">작성자</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">날짜</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {notices
              .filter(n => n.field === currentUser?.field || n.field === '전체')
              .map(notice => (
                <tr
                  key={notice.id}
                  onClick={() => {
                    setSelectedNotice(notice);
                    setShowNoticeModal(true);
                  }}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">{notice.title}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      notice.field === '바이오' ? 'bg-green-100 text-green-800' :
                      notice.field === '반도체' ? 'bg-blue-100 text-blue-800' :
                      notice.field === '물류' ? 'bg-purple-100 text-purple-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {notice.field}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{notice.author}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">{notice.date}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  // 핵심교과목 관련 로직
  const departmentCourses = useMemo(() => {
    if (!currentUser) return [];
    return getCoreCoursesByDepartment(currentUser.field, currentUser.department);
  }, [currentUser, coreCourses]);

  const groupedCourses = useMemo(() => {
    return groupCoursesByType(departmentCourses);
  }, [departmentCourses]);

  const scoreInfo = useMemo(() => {
    return calculateCoreCoursesScore(completedCourses);
  }, [completedCourses]);

  // 기존 제출 데이터 로드
  useEffect(() => {
    if (!currentUser || activeTab !== 'coreCourses') return;

    const submission = getStudentSubmission(currentUser.id);
    if (submission) {
      setCompletedCourses(submission.completedCourses || []);
      setTranscriptFileName(submission.transcriptFileName || '');
      setTranscriptFileSize(submission.transcriptFileSize || 0);
    }
  }, [currentUser, activeTab]);

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

  // 파일 선택
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const validation = validateFile(
      file,
      FILE_UPLOAD_CONFIG.maxSize,
      FILE_UPLOAD_CONFIG.acceptedFormats
    );

    if (!validation.valid) {
      showAlert(validation.error);
      e.target.value = '';
      return;
    }

    try {
      const base64 = await fileToBase64(file);
      setTranscriptFile(base64);
      setTranscriptFileName(file.name);
      setTranscriptFileSize(file.size);
    } catch (error) {
      showAlert('파일 업로드 중 오류가 발생했습니다.');
    }
  };

  // 파일 삭제
  const handleFileRemove = () => {
    setTranscriptFile(null);
    setTranscriptFileName('');
    setTranscriptFileSize(0);
  };

  // 제출
  const handleCoreCoursesSubmit = () => {
    const completedCount = completedCourses.filter(c => c.isCompleted).length;

    if (completedCount === 0) {
      showAlert('이수한 과목을 최소 1개 이상 선택해주세요.');
      return;
    }

    if (!transcriptFile && !transcriptFileName) {
      showAlert('교과과정 이수표를 업로드해주세요.');
      return;
    }

    showConfirm(
      `${scoreInfo.completedCount}개 과목 (${scoreInfo.score}점)을 제출하시겠습니까?\n\n제출 후에는 관리자 승인 전까지 수정할 수 없습니다.`,
      async () => {
        setIsSubmitting(true);

        try {
          const submissionData = {
            studentId: currentUser.id,
            completedCourses: completedCourses.filter(c => c.isCompleted),
            totalCompletedCount: scoreInfo.completedCount,
            totalScore: scoreInfo.score,
            transcriptFile,
            transcriptFileName,
            transcriptFileSize
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

  const submission = getStudentSubmission(currentUser?.id);
  const isApproved = submission?.status === 'approved';
  const isPending = submission?.status === 'pending';
  const isRejected = submission?.status === 'rejected';
  const canEdit = !isApproved && !isPending;

  // renderCoreCoursesTab 함수는 제거됨 - CoreCoursesCheckPage 컴포넌트 사용

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              {/* 로고 추가 */}
              <div className="bg-white p-2 rounded-lg">
                <img
                  src="/image/INU_RISE_logo.png"
                  alt="RISE 사업단"
                  className="h-10 w-auto object-contain"
                />
              </div>
              <div>
                <h1 className="text-3xl font-bold">학생성공지수 관리 시스템</h1>
                <p className="text-blue-100 mt-1">
                  {currentUser?.name}({currentUser?.studentId || currentUser?.username})님 환영합니다
                </p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="text-right text-white">
                <div className="text-sm font-semibold">문의 : 인천대학교 RISE사업단 미래인재양성센터</div>
                <div className="text-sm text-blue-100 mt-1">032-835-9834</div>
              </div>
              <button
                onClick={handleLogout}
                className="px-6 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
              >
                로그아웃
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-3 py-4 font-semibold text-center leading-tight text-sm ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📋<br />내 정보
            </button>
            <button
              onClick={() => setActiveTab('programs')}
              className={`flex-1 px-3 py-4 font-semibold text-center leading-tight text-sm ${
                activeTab === 'programs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📚<br />프로그램
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-3 py-4 font-semibold text-center leading-tight text-sm ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📝<br />신청 내역
            </button>
            <button
              onClick={() => setActiveTab('notices')}
              className={`flex-1 px-3 py-4 font-semibold text-center leading-tight text-sm ${
                activeTab === 'notices'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📢<br />공지사항
            </button>
            <button
              onClick={() => setActiveTab('coreCourses')}
              className={`flex-1 px-3 py-4 font-semibold text-center leading-tight text-sm ${
                activeTab === 'coreCourses'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              🎓<br />전략산업 교과목<br />신청
            </button>
            <button
              onClick={() => setActiveTab('nonCurricular')}
              className={`flex-1 px-3 py-4 font-semibold text-center leading-tight text-sm ${
                activeTab === 'nonCurricular'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              🎯<br />비교과 프로그램<br />신청
            </button>
            <button
              onClick={() => setActiveTab('questionBoard')}
              className={`flex-1 px-3 py-4 font-semibold text-center leading-tight text-sm ${
                activeTab === 'questionBoard'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              💬<br />질문게시판
            </button>
            <button
              onClick={() => setActiveTab('survey')}
              className={`flex-1 px-3 py-4 font-semibold text-center leading-tight text-sm ${
                activeTab === 'survey'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📊<br />만족도 조사
            </button>
          </div>
        </div>

        <div>
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'programs' && renderProgramsTab()}
          {activeTab === 'history' && renderApplicationHistoryTab()}
          {activeTab === 'notices' && renderNoticesTab()}
          {activeTab === 'coreCourses' && <CoreCoursesCheckPage />}
          {activeTab === 'nonCurricular' && <NonCurricularProgramsApplicationPage />}
          {activeTab === 'questionBoard' && <QuestionBoardPage />}
          {activeTab === 'survey' && <SurveyPage />}
        </div>
      </div>

      {showProgramModal && selectedProgram && (
        <ProgramDetailModal
          isOpen={showProgramModal}
          onClose={() => {
            setShowProgramModal(false);
            setSelectedProgram(null);
          }}
          program={selectedProgram}
        />
      )}

      {showNoticeModal && selectedNotice && (
        <NoticeDetailModal
          isOpen={showNoticeModal}
          onClose={() => {
            setShowNoticeModal(false);
            setSelectedNotice(null);
          }}
          notice={selectedNotice}
        />
      )}

      {/* 로그인 팝업 공지사항 */}
      {showLoginPopup && popupNotices.length > 0 && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* 헤더 */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
              <h2 className="text-xl font-bold">📢 중요 공지사항</h2>
              <p className="text-blue-100 text-sm mt-1">
                {popupNotices.length}개의 새로운 공지사항이 있습니다
              </p>
            </div>

            {/* 컨텐츠 */}
            <div className="flex-1 overflow-y-auto p-6">
              {popupNotices.map((notice, index) => (
                <div key={notice.id} className="mb-6 last:mb-0">
                  {index > 0 && <div className="border-t my-6"></div>}

                  {/* 공지사항 제목 */}
                  <div className="mb-3">
                    <div className="flex items-center gap-2 mb-2">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        notice.field === '바이오' ? 'bg-green-100 text-green-800' :
                        notice.field === '반도체' ? 'bg-blue-100 text-blue-800' :
                        notice.field === '물류' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {notice.field}
                      </span>
                      <span className="text-xs text-gray-500">{notice.date}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{notice.title}</h3>
                  </div>

                  {/* 공지사항 내용 */}
                  <div className="prose prose-sm max-w-none">
                    <div className="text-gray-700 whitespace-pre-wrap">{notice.content}</div>
                  </div>

                  {/* 이미지 */}
                  {notice.imageUrl && (
                    <div className="mt-4">
                      <img
                        src={notice.imageUrl}
                        alt={notice.title}
                        className="w-full h-auto rounded-lg shadow-md"
                      />
                    </div>
                  )}

                  {/* 첨부파일 */}
                  {notice.attachedFiles && notice.attachedFiles.length > 0 && (
                    <div className="mt-4 space-y-2">
                      {notice.attachedFiles.map((file, idx) => (
                        <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex items-center gap-2 flex-1">
                            <span className="text-xl">📎</span>
                            <div>
                              <p className="text-sm font-medium text-gray-800">{file.name || `파일 ${idx + 1}`}</p>
                              <p className="text-xs text-gray-500">{file.type}</p>
                            </div>
                          </div>
                          <button
                            onClick={() => {
                              try {
                                console.log('📥 파일 다운로드 시도:', file);
                                console.log('파일 객체 키:', Object.keys(file));

                                // 여러 가능한 필드명 시도
                                let base64Data = file.data || file.fileData || file.file_data;

                                if (typeof base64Data === 'object' && base64Data !== null) {
                                  if (base64Data.data) {
                                    base64Data = base64Data.data;
                                  } else {
                                    console.error('파일 데이터 구조:', base64Data);
                                    alert('파일 데이터를 찾을 수 없습니다.');
                                    return;
                                  }
                                }

                                if (!base64Data) {
                                  console.error('전체 파일 객체:', file);
                                  alert('파일 데이터를 찾을 수 없습니다. 콘솔을 확인해주세요.');
                                  return;
                                }

                                if (typeof base64Data !== 'string') {
                                  alert('파일 데이터 형식이 올바르지 않습니다.');
                                  return;
                                }

                                if (base64Data.startsWith('data:')) {
                                  const link = document.createElement('a');
                                  link.href = base64Data;
                                  link.download = file.name;
                                  link.style.display = 'none';
                                  document.body.appendChild(link);
                                  link.click();
                                  setTimeout(() => document.body.removeChild(link), 100);
                                  return;
                                }

                                const base64Match = base64Data.match(/base64,(.+)/);
                                const cleanBase64 = base64Match ? base64Match[1] : base64Data;
                                const binaryString = atob(cleanBase64);
                                const bytes = new Uint8Array(binaryString.length);

                                for (let i = 0; i < binaryString.length; i++) {
                                  bytes[i] = binaryString.charCodeAt(i);
                                }

                                const mimeType = file.type || 'application/octet-stream';
                                const blob = new Blob([bytes], { type: mimeType });
                                const link = document.createElement('a');
                                const url = URL.createObjectURL(blob);
                                link.href = url;
                                link.download = file.name;
                                link.style.display = 'none';
                                document.body.appendChild(link);
                                link.click();
                                setTimeout(() => {
                                  document.body.removeChild(link);
                                  URL.revokeObjectURL(url);
                                }, 100);
                              } catch (error) {
                                console.error('파일 다운로드 실패:', error);
                                alert('파일 다운로드에 실패했습니다: ' + error.message);
                              }
                            }}
                            className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg font-medium hover:bg-blue-700 transition-colors"
                          >
                            다운로드
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 개별 공지사항 닫기 버튼 */}
                  <div className="flex gap-2 mt-4">
                    <button
                      onClick={() => handleDismissPopup(notice.id, 'today')}
                      className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 transition-colors"
                    >
                      오늘 하루 보지 않기
                    </button>
                    <button
                      onClick={() => handleDismissPopup(notice.id, 'forever')}
                      className="flex-1 px-4 py-2 bg-gray-600 text-white rounded-lg font-medium hover:bg-gray-700 transition-colors"
                    >
                      다시 보지 않기
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 하단 버튼 */}
            <div className="border-t px-6 py-4 bg-gray-50">
              <button
                onClick={() => setShowLoginPopup(false)}
                className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 transition-colors"
              >
                모두 확인했습니다
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentPage;