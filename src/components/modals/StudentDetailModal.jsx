import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useModalStore } from '../../hooks/useModal';

function StudentDetailModal({ isOpen, onClose, student, readOnly = true }) {
  const {
    updateStudentInfo,
    addHistoryEntry,
    updateHistoryEntry,
    deleteHistoryEntry,
    updateStudentScore
  } = useAppContext();

  const { showConfirm, showAlert } = useModalStore();

  const [activeTab, setActiveTab] = useState('info');
  const [isEditing, setIsEditing] = useState(false);

  // 개인정보 수정용 state
  const [editedInfo, setEditedInfo] = useState({
    name: '',
    department: '',
    field: '',
    email: '',
    phone: '',
    memo: ''
  });

  // 활동 추가/수정용 state
  const [showActivityForm, setShowActivityForm] = useState(false);
  const [editingActivity, setEditingActivity] = useState(null);
  const [activityFormData, setActivityFormData] = useState({
    program: '',
    date: '',
    score: ''
  });

  useEffect(() => {
    if (student) {
      setEditedInfo({
        name: student.name || '',
        department: student.department || '',
        field: student.field || '',
        email: student.email || '',
        phone: student.phone || '',
        memo: student.memo || ''
      });
      setIsEditing(!readOnly);
    }
  }, [student, readOnly, isOpen]);

  if (!isOpen || !student) return null;

  const handleInfoChange = (e) => {
    const { name, value } = e.target;
    setEditedInfo(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSaveInfo = () => {
    const success = updateStudentInfo(student.id, editedInfo);
    if (success) {
      showAlert('정보가 수정되었습니다.');
      if (readOnly) {
        onClose();
      }
    }
  };

  const handleActivityFormChange = (e) => {
    const { name, value } = e.target;
    setActivityFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddActivity = (historyType) => {
    setEditingActivity(null);
    setActivityFormData({ program: '', date: '', score: '' });
    setShowActivityForm(historyType);
  };

  const handleEditActivity = (historyType, activity) => {
    setEditingActivity(activity);
    setActivityFormData({
      program: activity.program,
      date: activity.date,
      score: activity.score
    });
    setShowActivityForm(historyType);
  };

  const handleSaveActivity = () => {
    if (!activityFormData.program || !activityFormData.date || !activityFormData.score) {
      showAlert('모든 필드를 입력해주세요.');
      return;
    }

    const activityData = {
      program: activityFormData.program,
      date: activityFormData.date,
      score: parseInt(activityFormData.score)
    };

    if (editingActivity) {
      updateHistoryEntry(student.id, showActivityForm, editingActivity.id, activityData);
    } else {
      addHistoryEntry(student.id, showActivityForm, activityData);
    }

    setShowActivityForm(false);
    setActivityFormData({ program: '', date: '', score: '' });
    setEditingActivity(null);
  };

  const handleDeleteActivity = (historyType, activityId) => {
    showConfirm('정말 삭제하시겠습니까?', () => {
      deleteHistoryEntry(student.id, historyType, activityId);
      showAlert('삭제되었습니다.');
    });
  };

  const renderInfoTab = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">이름</label>
          {isEditing ? (
            <input
              type="text"
              name="name"
              value={editedInfo.name}
              onChange={handleInfoChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg">{student.name}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">학번</label>
          <p className="px-4 py-2 bg-gray-50 rounded-lg">{student.studentId}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">학과</label>
          {isEditing ? (
            <input
              type="text"
              name="department"
              value={editedInfo.department}
              onChange={handleInfoChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg">{student.department}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">분야</label>
          {isEditing ? (
            <select
              name="field"
              value={editedInfo.field}
              onChange={handleInfoChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="바이오">바이오</option>
              <option value="반도체">반도체</option>
              <option value="물류">물류</option>
            </select>
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg">{student.field}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
          {isEditing ? (
            <input
              type="email"
              name="email"
              value={editedInfo.email}
              onChange={handleInfoChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg">{student.email}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
          {isEditing ? (
            <input
              type="tel"
              name="phone"
              value={editedInfo.phone}
              onChange={handleInfoChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          ) : (
            <p className="px-4 py-2 bg-gray-50 rounded-lg">{student.phone}</p>
          )}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">메모</label>
        {isEditing ? (
          <textarea
            name="memo"
            value={editedInfo.memo}
            onChange={handleInfoChange}
            rows="4"
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        ) : (
          <p className="px-4 py-2 bg-gray-50 rounded-lg min-h-[100px]">{student.memo || '메모 없음'}</p>
        )}
      </div>

      {isEditing && (
        <button
          onClick={handleSaveInfo}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        >
          정보 저장
        </button>
      )}
    </div>
  );

  const renderHistoryTab = (historyType, title, historyData) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold">{title}</h3>
        {isEditing && (
          <button
            onClick={() => handleAddActivity(historyType)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + 활동 추가
          </button>
        )}
      </div>

      {historyData.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-500">활동 내역이 없습니다.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {historyData.map((activity) => (
            <div key={activity.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-800 mb-1">{activity.program}</h4>
                  <div className="text-sm text-gray-600 space-y-1">
                    <p>날짜: {activity.date}</p>
                    <p className="font-semibold text-blue-600">점수: {activity.score}점</p>
                  </div>
                </div>
                {isEditing && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditActivity(historyType, activity)}
                      className="px-3 py-1 text-sm bg-blue-50 text-blue-600 rounded hover:bg-blue-100"
                    >
                      수정
                    </button>
                    <button
                      onClick={() => handleDeleteActivity(historyType, activity.id)}
                      className="px-3 py-1 text-sm bg-red-50 text-red-600 rounded hover:bg-red-100"
                    >
                      삭제
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 활동 추가/수정 폼 */}
      {showActivityForm === historyType && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">
              {editingActivity ? '활동 수정' : '활동 추가'}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">프로그램명</label>
                <input
                  type="text"
                  name="program"
                  value={activityFormData.program}
                  onChange={handleActivityFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="프로그램 이름"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">날짜</label>
                <input
                  type="date"
                  name="date"
                  value={activityFormData.date}
                  onChange={handleActivityFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">점수</label>
                <input
                  type="number"
                  name="score"
                  value={activityFormData.score}
                  onChange={handleActivityFormChange}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="점수"
                  min="0"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    setShowActivityForm(false);
                    setEditingActivity(null);
                    setActivityFormData({ program: '', date: '', score: '' });
                  }}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  취소
                </button>
                <button
                  onClick={handleSaveActivity}
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  저장
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold mb-2">
              {isEditing ? '📝 학생 정보 수정' : '👨‍🎓 학생 상세 정보'}
            </h2>
            <p className="text-blue-100">
              {student.name} ({student.studentId}) - {student.department}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 점수 카드 */}
        <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 grid grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-sm text-gray-600 mb-1">비교과</p>
            <p className="text-2xl font-bold text-purple-600">{student.nonCurricularScore}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-sm text-gray-600 mb-1">핵심교과</p>
            <p className="text-2xl font-bold text-blue-600">{student.coreSubjectScore}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-sm text-gray-600 mb-1">산학협력</p>
            <p className="text-2xl font-bold text-green-600">{student.industryScore}</p>
          </div>
          <div className="bg-white rounded-lg p-4 text-center shadow-sm">
            <p className="text-sm text-gray-600 mb-1">총점</p>
            <p className="text-2xl font-bold text-indigo-600">{student.total}</p>
          </div>
        </div>

        {/* 탭 */}
        <div className="flex border-b bg-white">
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-6 py-4 font-semibold ${
              activeTab === 'info'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            📋 기본 정보
          </button>
          <button
            onClick={() => setActiveTab('nonCurricular')}
            className={`flex-1 px-6 py-4 font-semibold ${
              activeTab === 'nonCurricular'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            🎯 비교과 활동
          </button>
          <button
            onClick={() => setActiveTab('coreSubject')}
            className={`flex-1 px-6 py-4 font-semibold ${
              activeTab === 'coreSubject'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            📚 핵심 교과
          </button>
          <button
            onClick={() => setActiveTab('industry')}
            className={`flex-1 px-6 py-4 font-semibold ${
              activeTab === 'industry'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-blue-600'
            }`}
          >
            🏢 산학협력
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeTab === 'info' && renderInfoTab()}
          {activeTab === 'nonCurricular' && renderHistoryTab('nonCurricularHistory', '비교과 활동', student.nonCurricularHistory)}
          {activeTab === 'coreSubject' && renderHistoryTab('coreSubjectHistory', '핵심 교과', student.coreSubjectHistory)}
          {activeTab === 'industry' && renderHistoryTab('industryHistory', '산학협력', student.industryHistory)}
        </div>

        {/* 푸터 */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
          >
            닫기
          </button>
        </div>
      </div>
    </div>
  );
}

export default StudentDetailModal;