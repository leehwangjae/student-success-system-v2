import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import ProgramDetailModal from '../components/modals/ProgramDetailModal';
import NoticeDetailModal from '../components/modals/NoticeDetailModal';
import { supabase } from '../lib/supabase';

function StudentPage() {
  const {
    currentUser,
    setCurrentUser,
    programs,
    notices,
    programApplications,
    applyForProgram
  } = useAppContext();

  const [activeTab, setActiveTab] = useState('info');
  const [selectedProgram, setSelectedProgram] = useState(null);
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);

  // 🔥 학생 점수 데이터 상태
  const [studentScores, setStudentScores] = useState({
    nonCurricularScore: 0,
    coreSubjectScore: 0,
    industryScore: 0,
    total: 0
  });

  // 🔥 학생 점수 로드
  useEffect(() => {
    const loadStudentScores = async () => {
      if (!currentUser?.id) return;

      console.log('=== 학생 점수 로드 시작 ===');
      console.log('현재 사용자 ID:', currentUser.id);

      try {
        const { data, error } = await supabase
          .from('users')
          .select('non_curricular_score, core_subject_score, industry_score')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          console.error('점수 로드 실패:', error);
          return;
        }

        console.log('로드된 점수 데이터:', data);

        const scores = {
          nonCurricularScore: data?.non_curricular_score || 0,
          coreSubjectScore: data?.core_subject_score || 0,
          industryScore: data?.industry_score || 0,
          total: (data?.non_curricular_score || 0) + 
                 (data?.core_subject_score || 0) + 
                 (data?.industry_score || 0)
        };

        console.log('계산된 점수:', scores);
        setStudentScores(scores);

      } catch (error) {
        console.error('점수 로드 중 오류:', error);
      }
    };

    loadStudentScores();
  }, [currentUser?.id]);

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

  const renderInfoTab = () => (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">기본 정보</h2>
        
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">학번</label>
            <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800">
              {currentUser?.studentId || currentUser?.username}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">이름</label>
            <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800">
              {currentUser?.name}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">학과</label>
            <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800">
              {currentUser?.department}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">분야</label>
            <div className="bg-gray-50 px-4 py-3 rounded-lg">
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                currentUser?.field === '바이오' ? 'bg-green-100 text-green-800' :
                currentUser?.field === '반도체' ? 'bg-blue-100 text-blue-800' :
                'bg-purple-100 text-purple-800'
              }`}>
                {currentUser?.field}
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-2">이메일</label>
            <div className="bg-gray-50 px-4 py-3 rounded-lg text-gray-800">
              {currentUser?.email || '미등록'}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg shadow-lg p-8 text-white">
        <h2 className="text-2xl font-bold mb-6">학생성공지수</h2>
        
        <div className="text-center mb-8">
          <div className="text-6xl font-bold mb-2">{studentScores.total}</div>
          <div className="text-blue-100">총점</div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-2">{studentScores.nonCurricularScore}</div>
            <div className="text-sm text-blue-100">비교과</div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-2">{studentScores.coreSubjectScore}</div>
            <div className="text-sm text-blue-100">핵심교과</div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-2">{studentScores.industryScore}</div>
            <div className="text-sm text-blue-100">산학협력</div>
          </div>
        </div>
      </div>
    </div>
  );

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

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-lg">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold">학생성공지수 관리 시스템</h1>
              <p className="text-blue-100 mt-1">
                {currentUser?.name}({currentUser?.studentId || currentUser?.username})님 환영합니다
              </p>
            </div>
            <button
              onClick={handleLogout}
              className="px-6 py-2 bg-white text-blue-600 hover:bg-blue-50 rounded-lg font-semibold transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-md mb-6">
          <div className="flex border-b">
            <button
              onClick={() => setActiveTab('info')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'info'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📋 내 정보
            </button>
            <button
              onClick={() => setActiveTab('programs')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'programs'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📚 프로그램
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'history'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📝 신청 내역
            </button>
            <button
              onClick={() => setActiveTab('notices')}
              className={`flex-1 px-6 py-4 font-semibold ${
                activeTab === 'notices'
                  ? 'text-blue-600 border-b-2 border-blue-600'
                  : 'text-gray-600 hover:text-blue-600'
              }`}
            >
              📢 공지사항
            </button>
          </div>
        </div>

        <div>
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'programs' && renderProgramsTab()}
          {activeTab === 'history' && renderApplicationHistoryTab()}
          {activeTab === 'notices' && renderNoticesTab()}
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
    </div>
  );
}

export default StudentPage;
