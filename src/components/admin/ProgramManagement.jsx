import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { downloadFile } from '../../utils/helpers';
import ProgramModal from '../modals/ProgramModal';
import ApplicantsModal from '../modals/ApplicantsModal';

function ProgramManagement() {
  const { programs, programApplications, deleteProgram } = useAppContext();
  const [filter, setFilter] = useState('전체');
  const [showProgramModal, setShowProgramModal] = useState(false);
  const [editingProgram, setEditingProgram] = useState(null);
  const [showProgramPreview, setShowProgramPreview] = useState(null);
  const [showProgramApplicants, setShowProgramApplicants] = useState(null);

  const getFilteredPrograms = () => {
    if (filter === '전체') return programs;
    return programs.filter(p => p.field === filter);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-3xl font-bold">프로그램 관리</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="전체">전체</option>
            <option value="공통">공통</option>
            <option value="바이오 분야">바이오 분야</option>
            <option value="반도체 분야">반도체 분야</option>
            <option value="물류 분야">물류 분야</option>
          </select>
        </div>
        <button
          onClick={() => {
            setEditingProgram(null);
            setShowProgramModal(true);
          }}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + 프로그램 추가
        </button>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {getFilteredPrograms().map(program => {
          const applicants = programApplications.filter(a => a.programId === program.id);
          const pendingCount = applicants.filter(a => a.status === 'pending').length;
          const approvedCount = applicants.filter(a => a.status === 'approved').length;
          const completedCount = applicants.filter(a => a.status === 'completed').length;

          return (
            <div key={program.id} className="bg-white rounded-xl shadow-md p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-xl font-bold">{program.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                      program.status === '모집중' ? 'bg-green-100 text-green-800' :
                      program.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                      program.status === '마감' ? 'bg-red-100 text-red-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {program.status}
                    </span>
                    {program.requiresFile && (
                      <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs rounded-full font-semibold">
                        📎 파일첨부 필수
                      </span>
                    )}
                    <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full font-semibold">
                      {program.score}점
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-sm text-gray-600 mb-2">
                    <span>📚 {program.category}</span>
                    <span>🏷 {program.field}</span>
                    <span>📅 {program.startDate} ~ {program.endDate}</span>
                    <span>👥 {applicants.length}/{program.maxParticipants}명</span>
                  </div>
                  {applicants.length > 0 && (
                    <div className="flex items-center space-x-3 text-sm">
                      <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded">
                        대기 {pendingCount}
                      </span>
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded">
                        승인 {approvedCount}
                      </span>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded">
                        완료 {completedCount}
                      </span>
                    </div>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowProgramApplicants(program)}
                    className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    신청자 ({applicants.length})
                  </button>
                  <button
                    onClick={() => setShowProgramPreview(program)}
                    className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                  >
                    미리보기
                  </button>
                  <button
                    onClick={() => {
                      setEditingProgram(program);
                      setShowProgramModal(true);
                    }}
                    className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                  >
                    수정
                  </button>
                  <button
                    onClick={() => deleteProgram(program.id)}
                    className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                  >
                    삭제
                  </button>
                </div>
              </div>
              <p className="text-gray-700 line-clamp-2">{program.description}</p>
            </div>
          );
        })}
      </div>

      {showProgramModal && (
        <ProgramModal
          editingProgram={editingProgram}
          onClose={() => {
            setShowProgramModal(false);
            setEditingProgram(null);
          }}
        />
      )}

      {showProgramPreview && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
          onClick={() => setShowProgramPreview(null)}
        >
          <div 
            className="bg-white rounded-xl p-8 max-w-4xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold mb-2">{showProgramPreview.title}</h2>
                <div className="flex items-center space-x-3">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                    showProgramPreview.status === '모집중' ? 'bg-green-100 text-green-800' :
                    showProgramPreview.status === '진행중' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {showProgramPreview.status}
                  </span>
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
                    {showProgramPreview.category}
                  </span>
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 text-sm rounded-full">
                    {showProgramPreview.field}
                  </span>
                  <span className="px-3 py-1 bg-green-100 text-green-800 text-sm rounded-full font-semibold">
                    {showProgramPreview.score}점
                  </span>
                  {showProgramPreview.requiresFile && (
                    <span className="px-3 py-1 bg-orange-100 text-orange-800 text-sm rounded-full font-semibold">
                      📎 파일첨부 필수
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">신청 기간</p>
                <p className="font-semibold">{showProgramPreview.startDate} ~ {showProgramPreview.endDate}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-600 mb-1">정원</p>
                <p className="font-semibold">{showProgramPreview.maxParticipants}명</p>
              </div>
            </div>

            <div className="mb-6">
              <h3 className="text-xl font-bold mb-3">프로그램 설명</h3>
              <div className="bg-gray-50 p-4 rounded-lg whitespace-pre-wrap">
                {showProgramPreview.description}
              </div>
            </div>

            {showProgramPreview.images && showProgramPreview.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">이미지</h3>
                <div className="space-y-4">
                  {showProgramPreview.images.map((image, idx) => (
                    <img 
                      key={idx}
                      src={image.url} 
                      alt={image.name}
                      className="w-full rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {showProgramPreview.files && showProgramPreview.files.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xl font-bold mb-3">첨부파일</h3>
                <div className="space-y-2">
                  {showProgramPreview.files.map((file, idx) => (
                    <div 
                      key={idx}
                      className="flex items-center justify-between bg-blue-50 p-4 rounded-lg hover:bg-blue-100 cursor-pointer transition-colors border-2 border-blue-200"
                      onClick={() => downloadFile(file.url, file.name)}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-blue-600 text-2xl">📥</span>
                        <span className="text-sm font-semibold">{file.name}</span>
                      </div>
                      <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                        다운로드
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={() => setShowProgramPreview(null)}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              확인
            </button>
          </div>
        </div>
      )}

      {showProgramApplicants && (
        <ApplicantsModal
          program={showProgramApplicants}
          onClose={() => setShowProgramApplicants(null)}
        />
      )}
    </div>
  );
}

export default ProgramManagement;