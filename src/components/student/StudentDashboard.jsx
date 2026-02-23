import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';
import MyInfo from './MyInfo';
import ProgramList from './ProgramList';
import MyApplications from './MyApplications';
import NoticeList from './NoticeList';

function StudentDashboard() {
  const { currentUser } = useAppContext();
  const [activeTab, setActiveTab] = React.useState('myInfo');

  // DB에서 최신 점수 로드 (localStorage 캐시 대신 실시간 조회)
  const [liveScores, setLiveScores] = useState(null);

  useEffect(() => {
    if (!currentUser?.id) return;
    const load = async () => {
      const { data } = await supabase
        .from('users_2025_11_27_07_17')
        .select('non_curricular_score, core_subject_score, industry_score')
        .eq('id', currentUser.id)
        .single();
      if (data) {
        setLiveScores({
          nonCurricularScore: data.non_curricular_score || 0,
          coreSubjectScore: data.core_subject_score || 0,
          industryScore: data.industry_score || 0,
          total: (data.non_curricular_score || 0) + (data.core_subject_score || 0) + (data.industry_score || 0),
        });
      }
    };
    load();
  }, [currentUser?.id]);

  const scores = liveScores || {
    nonCurricularScore: currentUser?.nonCurricularScore || 0,
    coreSubjectScore: currentUser?.coreSubjectScore || 0,
    industryScore: currentUser?.industryScore || 0,
    total: currentUser?.total || 0,
  };

  return (
    <div>
      {/* 헤더 */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-3xl font-bold mb-4">내 정보</h2>
        <div className="grid grid-cols-3 gap-6">
          {/* 기본 정보 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">기본 정보</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-gray-600">학번</span>
                <span className="font-semibold">{currentUser.studentId}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">이름</span>
                <span className="font-semibold">{currentUser.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">학과</span>
                <span className="font-semibold">{currentUser.department}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">분야</span>
                <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full font-semibold">
                  {currentUser.field}
                </span>
              </div>
            </div>
          </div>

          {/* 학생성공지수 */}
          <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-md p-6 text-white">
            <h3 className="text-xl font-bold mb-2">학생성공지수</h3>
            <p className="text-5xl font-bold mb-2">{scores.total}</p>
            <p className="text-blue-100">총점</p>
          </div>

          {/* 세부 점수 */}
          <div className="bg-white rounded-xl shadow-md p-6">
            <h3 className="text-xl font-bold mb-4">세부 점수</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">비교과</span>
                <span className="text-xl font-bold text-blue-600">{scores.nonCurricularScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">핵심교과</span>
                <span className="text-xl font-bold text-green-600">{scores.coreSubjectScore}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">산학협력</span>
                <span className="text-xl font-bold text-purple-600">{scores.industryScore}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="mb-6">
        <div className="flex space-x-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('myInfo')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'myInfo'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            내 정보
          </button>
          <button
            onClick={() => setActiveTab('programs')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'programs'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            프로그램
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'applications'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            신청 내역
          </button>
          <button
            onClick={() => setActiveTab('notices')}
            className={`px-6 py-3 font-semibold transition-colors ${
              activeTab === 'notices'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            공지사항
          </button>
        </div>
      </div>

      {/* 탭 컨텐츠 */}
      <div>
        {activeTab === 'myInfo' && <MyInfo />}
        {activeTab === 'programs' && <ProgramList />}
        {activeTab === 'applications' && <MyApplications />}
        {activeTab === 'notices' && <NoticeList />}
      </div>
    </div>
  );
}

export default StudentDashboard;