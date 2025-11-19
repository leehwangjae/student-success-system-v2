import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import ProgramDetailModal from '../modals/ProgramDetailModal';

function ProgramList() {
  const { currentUser, programs, programApplications } = useAppContext();
  const [showProgramDetail, setShowProgramDetail] = useState(null);

  const availablePrograms = programs.filter(p =>
    (p.field === currentUser.field || p.field === '공통') && p.status === '모집중'
  );

  const myApplications = programApplications.filter(a => a.studentId === currentUser.id);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">신청 가능한 프로그램</h2>
      
      <div className="grid gap-6">
        {availablePrograms.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-12 text-center">
            <p className="text-gray-500">현재 신청 가능한 프로그램이 없습니다.</p>
          </div>
        ) : (
          availablePrograms.map(program => {
            const alreadyApplied = myApplications.some(a => a.programId === program.id);
            return (
              <div key={program.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold">{program.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                        program.status === '모집중' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {program.status}
                      </span>
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-semibold">
                        {program.score}점
                      </span>
                      {program.requiresFile && (
                        <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-semibold">
                          📎 파일첨부 필수
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                      <span>📚 {program.category}</span>
                      <span>🏷 {program.field}</span>
                      <span>📅 {program.startDate} ~ {program.endDate}</span>
                      <span>👥 {program.maxParticipants}명</span>
                    </div>
                    <p className="text-gray-700">{program.description}</p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    <button
                      onClick={() => setShowProgramDetail(program)}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      상세보기
                    </button>
                    {alreadyApplied && (
                      <span className="px-4 py-2 bg-gray-300 text-gray-600 rounded-lg">
                        신청완료
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {showProgramDetail && (
        <ProgramDetailModal
          program={showProgramDetail}
          onClose={() => setShowProgramDetail(null)}
        />
      )}
    </div>
  );
}

export default ProgramList;