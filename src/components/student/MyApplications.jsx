import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { getApplicationStatus } from '../../utils/scoring';

function MyApplications() {
  const { currentUser, programs, programApplications, cancelApplication } = useAppContext();

  // 이수완료 상태 제외
  const myApplications = programApplications.filter(
    a => a.studentId === currentUser.id && a.status !== 'completed'
  );

  // 디버깅용 - 확인 후 삭제
  console.log('전체 신청:', programApplications.filter(a => a.studentId === currentUser.id));
  console.log('필터링 후:', myApplications);

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">나의 프로그램 신청 내역</h2>
      
      {myApplications.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-12 text-center">
          <p className="text-gray-500">신청한 프로그램이 없습니다.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {myApplications.map(app => {
            const program = programs.find(p => p.id === app.programId);
            const statusInfo = getApplicationStatus(app);
            
            return (
              <div key={app.id} className="bg-white rounded-xl shadow-md p-6">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-xl font-bold">{program?.title}</h3>
                      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                        {statusInfo.status}
                      </span>
                      {app.status === 'completed' && (
                        <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-semibold">
                          +{program?.score}점
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                      <span>📅 신청일: {app.appliedDate}</span>
                      {app.completedDate && <span>✅ 완료일: {app.completedDate}</span>}
                      <span>📚 {program?.category}</span>
                      <span>🏷 {program?.field}</span>
                    </div>
                    {app.attachedFiles && app.attachedFiles.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm text-gray-600 mb-2">첨부한 파일:</p>
                        <div className="space-y-1">
                          {app.attachedFiles.map((file, idx) => (
                            <div key={idx} className="flex items-center space-x-2 text-sm text-gray-700">
                              <span>📄</span>
                              <span>{file.name}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {app.status === 'pending' && (
                    <button
                      onClick={() => cancelApplication(program.id)}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                    >
                      신청 취소
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default MyApplications;