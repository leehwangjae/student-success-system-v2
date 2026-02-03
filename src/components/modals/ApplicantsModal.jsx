import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { getApplicationStatus } from '../../utils/scoring';
import { downloadProgramApplicants } from '../../utils/helpers';

function ApplicantsModal({ program, onClose }) {
  const { 
    students, 
    programApplications, 
    approveApplication, 
    rejectApplication, 
    completeProgram 
  } = useAppContext();

  // 이수완료 상태 제외
  const applicants = programApplications.filter(
    a => a.programId === program.id && a.status !== 'completed'
  );

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-xl p-8 max-w-6xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">{program.title} - 신청자 목록</h2>
          <button 
            onClick={() => downloadProgramApplicants(program, programApplications, students, getApplicationStatus)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <span>📥</span>
            <span>엑셀 다운로드</span>
          </button>
        </div>

        {applicants.length === 0 ? (
          <p className="text-center py-12 text-gray-600">신청자가 없습니다.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold">학번</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">이름</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">학과</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">분야</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">이메일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">신청일</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold">상태</th>
                  {program.requiresFile && (
                    <th className="px-4 py-3 text-left text-sm font-semibold">첨부파일</th>
                  )}
                  <th className="px-4 py-3 text-center text-sm font-semibold">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {applicants.map(app => {
                  const student = students.find(s => s.id === app.studentId);
                  const statusInfo = getApplicationStatus(app);
                  
                  return (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{student?.studentId}</td>
                      <td className="px-4 py-3 font-medium">{student?.name}</td>
                      <td className="px-4 py-3 text-gray-600">{student?.department}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {student?.field}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{student?.email}</td>
                      <td className="px-4 py-3 text-gray-600">{app.appliedDate}</td>
                      <td className="px-4 py-3">
                        <span className={`px-3 py-1 rounded-full text-sm font-semibold ${statusInfo.color}`}>
                          {statusInfo.status}
                        </span>
                      </td>
                      {program.requiresFile && (
                        <td className="px-4 py-3">
                          {app.attachedFiles && app.attachedFiles.length > 0 ? (
                            <div className="space-y-1">
                              {app.attachedFiles.map((file, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => {
                                    if (file.url) {
                                      const link = document.createElement('a');
                                      link.href = file.url;
                                      link.download = file.name;
                                      link.click();
                                    }
                                  }}
                                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1 w-full text-left"
                                >
                                  <span>📄</span>
                                  <span className="truncate max-w-[150px]">{file.name}</span>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">미첨부</span>
                          )}
                        </td>
                      )}
                      <td className="px-4 py-3">
                        <div className="flex justify-center space-x-2">
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => approveApplication(app.id)}
                                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                              >
                                승인
                              </button>
                              <button
                                onClick={() => rejectApplication(app.id)}
                                className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                              >
                                거부
                              </button>
                            </>
                          )}
                          {app.status === 'approved' && (
                            <button
                              onClick={() => completeProgram(app.id)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              이수완료
                            </button>
                          )}
                          {app.status === 'completed' && (
                            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded font-semibold">
                              +{program.score}점 반영됨
                            </span>
                          )}
                          {app.status === 'rejected' && (
                            <span className="text-gray-500 text-sm">-</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="font-semibold text-blue-900 mb-2">💡 신청 처리 가이드</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• <strong>승인</strong>: 신청을 승인하면 학생이 프로그램에 참여할 수 있습니다.</li>
            <li>• <strong>거부</strong>: 신청을 거부하면 학생의 신청이 취소됩니다.</li>
            <li>• <strong>이수완료</strong>: 승인된 학생이 프로그램을 완료하면 자동으로 점수가 반영됩니다.</li>
            <li>• 프로그램 점수: <strong className="text-blue-900">{program.score}점</strong></li>
          </ul>
        </div>

        <button 
          onClick={onClose}
          className="mt-6 w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default ApplicantsModal;