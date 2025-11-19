import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import ApplicantsModal from '../modals/ApplicantsModal';

function Dashboard({ onNavigate }) {
  const { students, programs, programApplications } = useAppContext();
  const [showApplicantsModal, setShowApplicantsModal] = useState(null);

  // 1. 학생 현황 통계
  const totalStudents = students.length;
  
  // 학과별 학생 수
  const departmentStats = students.reduce((acc, student) => {
    acc[student.department] = (acc[student.department] || 0) + 1;
    return acc;
  }, {});

  // 학생성공지수 우수자 (70점 이상)
  const excellentStudents = students.filter(s => s.total >= 70);
  
  // 학번으로 학년 추출 (예: 202411001 -> 2024년 입학 -> 1학년)
  const currentYear = new Date().getFullYear();
  const gradeStats = excellentStudents.reduce((acc, student) => {
    const admissionYear = parseInt(student.studentId.substring(0, 4));
    const grade = currentYear - admissionYear + 1;
    const gradeLabel = grade > 4 ? '4학년+' : `${grade}학년`;
    acc[gradeLabel] = (acc[gradeLabel] || 0) + 1;
    return acc;
  }, {});

  // 2. 프로그램 현황 통계
  const completedPrograms = programs.filter(p => p.status === '완료').length;
  const ongoingPrograms = programs.filter(p => p.status === '진행중').length;
  const recruitingPrograms = programs.filter(p => p.status === '모집중');

  // 프로그램별 승인 대기 건수
  const getPendingCount = (programId) => {
    return programApplications.filter(
      a => a.programId === programId && a.status === 'pending'
    ).length;
  };

  // 프로그램 카드 클릭 핸들러
  const handleProgramClick = (program) => {
    setShowApplicantsModal(program);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-8">관리자 대시보드</h2>

      {/* 1. 학생 현황 */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4">📊 학생 현황</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {/* 전체 학생 수 */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm mb-1">전체 학생 수</p>
                <p className="text-4xl font-bold">{totalStudents}</p>
                <p className="text-blue-100 text-sm mt-2">명</p>
              </div>
              <div className="text-6xl opacity-20">👥</div>
            </div>
          </div>

          {/* 학과별 학생 수 */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h4 className="font-bold text-lg mb-4 text-gray-800">학과별 학생 수</h4>
            <div className="space-y-3">
              {Object.entries(departmentStats).map(([dept, count]) => (
                <div key={dept} className="flex justify-between items-center">
                  <span className="text-gray-600 text-sm">{dept}</span>
                  <span className="font-bold text-blue-600">{count}명</span>
                </div>
              ))}
            </div>
          </div>

          {/* 우수자 현황 */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-orange-100 text-sm mb-1">우수자 (70점 이상)</p>
                <p className="text-4xl font-bold">{excellentStudents.length}</p>
                <p className="text-orange-100 text-sm mt-2">명</p>
              </div>
              <div className="text-6xl opacity-20">🏆</div>
            </div>
            <div className="border-t border-orange-400 pt-3 mt-3">
              <p className="text-xs text-orange-100 mb-2">학년별 분포</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(gradeStats).map(([grade, count]) => (
                  <div key={grade} className="text-xs">
                    <span className="text-orange-100">{grade}:</span>{' '}
                    <span className="font-semibold">{count}명</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. 프로그램 현황 */}
      <div>
        <h3 className="text-2xl font-bold mb-4">📚 프로그램 현황</h3>
        
        {/* 프로그램 요약 통계 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">완료된 프로그램</p>
                <p className="text-3xl font-bold text-green-600">{completedPrograms}</p>
                <p className="text-gray-500 text-sm mt-2">개</p>
              </div>
              <div className="text-5xl opacity-20">✅</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">진행중인 프로그램</p>
                <p className="text-3xl font-bold text-blue-600">{ongoingPrograms}</p>
                <p className="text-gray-500 text-sm mt-2">개</p>
              </div>
              <div className="text-5xl opacity-20">🚀</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm mb-1">모집중인 프로그램</p>
                <p className="text-3xl font-bold text-purple-600">{recruitingPrograms.length}</p>
                <p className="text-gray-500 text-sm mt-2">개</p>
              </div>
              <div className="text-5xl opacity-20">📢</div>
            </div>
          </div>
        </div>

        {/* 현재 운영중인 프로그램 카드 */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h4 className="font-bold text-xl mb-4 text-gray-800">현재 모집중인 프로그램</h4>
          
          {recruitingPrograms.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <p className="text-4xl mb-4">📭</p>
              <p>현재 모집중인 프로그램이 없습니다.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {recruitingPrograms.map(program => {
                const pendingCount = getPendingCount(program.id);
                const applicants = programApplications.filter(a => a.programId === program.id);
                
                return (
                  <div
                    key={program.id}
                    onClick={() => handleProgramClick(program)}
                    className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-xl p-5 cursor-pointer hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 border-2 border-blue-100 hover:border-blue-300"
                  >
                    {/* 승인 대기 배지 */}
                    {pendingCount > 0 && (
                      <div className="flex justify-end mb-2">
                        <span className="px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full animate-pulse">
                          🔔 승인 대기 {pendingCount}건
                        </span>
                      </div>
                    )}

                    {/* 프로그램 정보 */}
                    <div className="mb-3">
                      <div className="flex items-start justify-between mb-2">
                        <h5 className="font-bold text-lg text-gray-800 flex-1">{program.title}</h5>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mb-3">
                        <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-semibold">
                          {program.category}
                        </span>
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full font-semibold">
                          {program.field}
                        </span>
                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full font-semibold">
                          {program.score}점
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                        {program.description}
                      </p>

                      <div className="text-xs text-gray-500 space-y-1">
                        <p>📅 {program.startDate} ~ {program.endDate}</p>
                        <p>👥 신청: {applicants.length}/{program.maxParticipants}명</p>
                      </div>
                    </div>

                    {/* 진행 바 */}
                    <div className="mt-3">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500"
                          style={{
                            width: `${Math.min((applicants.length / program.maxParticipants) * 100, 100)}%`
                          }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 text-right">
                        {Math.round((applicants.length / program.maxParticipants) * 100)}% 달성
                      </p>
                    </div>

                    {/* 클릭 안내 */}
                    <div className="mt-3 pt-3 border-t border-blue-200">
                      <p className="text-xs text-blue-600 font-semibold text-center">
                        👆 클릭하여 신청자 목록 보기
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 신청자 모달 */}
      {showApplicantsModal && (
        <ApplicantsModal
          program={showApplicantsModal}
          onClose={() => setShowApplicantsModal(null)}
        />
      )}
    </div>
  );
}

export default Dashboard;