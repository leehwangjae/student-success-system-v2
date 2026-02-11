import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

function MyInfo() {
  const { currentUser, students, updateStudentInfo } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [student, setStudent] = useState(null);
  const [editData, setEditData] = useState({
    email: '',
    phone: ''
  });

  // Supabase에서 직접 최신 학생 정보 로드
  useEffect(() => {
    const loadStudentData = async () => {
      if (!currentUser?.id) return;

      try {
        const { data, error } = await supabase
          .from('users_2025_11_27_07_17')
          .select('*')
          .eq('id', currentUser.id)
          .single();

        if (error) throw error;

        // camelCase로 변환
        const studentData = {
          id: data.id,
          studentId: data.student_id,
          name: data.name,
          department: data.department,
          field: data.field,
          email: data.email || '',
          phone: data.phone || '',
          ssn: data.ssn || '',
          bankName: data.bank_name || '',
          accountNumber: data.account_number || '',
          accountHolder: data.account_holder || '',
          nonCurricularScore: data.non_curricular_score || 0,
          coreSubjectScore: data.core_subject_score || data.core_courses_score || 0,
          industryScore: data.industry_score || 0,
          total: (data.non_curricular_score || 0) +
                 (data.core_subject_score || data.core_courses_score || 0) +
                 (data.industry_score || 0),
          nonCurricularHistory: data.non_curricular_history || [],
          coreSubjectHistory: data.core_subject_history || [],
          industryHistory: data.industry_history || []
        };

        setStudent(studentData);
        setEditData({
          email: studentData.email,
          phone: studentData.phone
        });
      } catch (error) {
        console.error('학생 정보 로드 실패:', error);
      }
    };

    loadStudentData();
  }, [currentUser?.id]);

  if (!student) return <div className="p-6">로딩 중...</div>;

  const handleEdit = () => {
    setEditData({
      email: student.email || '',
      phone: student.phone || ''
    });
    setIsEditing(true);
  };

  const handleSave = async () => {
    // 이메일 형식 검사 (입력된 경우에만)
    if (editData.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(editData.email)) {
        alert('올바른 이메일 형식을 입력해주세요.');
        return;
      }
    }

    // 전화번호 형식 검사 (입력된 경우에만)
    if (editData.phone) {
      const phoneRegex = /^\d{2,3}-\d{3,4}-\d{4}$/;
      if (!phoneRegex.test(editData.phone)) {
        alert('올바른 전화번호 형식을 입력해주세요. (예: 010-1234-5678)');
        return;
      }
    }

    try {
      await updateStudentInfo(student.id, editData);
      setIsEditing(false);
      alert('정보가 수정되었습니다.');
    } catch (error) {
      alert('정보 수정에 실패했습니다.');
    }
  };

  const handleCancel = () => {
    setEditData({
      email: student.email || '',
      phone: student.phone || ''
    });
    setIsEditing(false);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">내 정보</h2>

      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold">기본 정보</h3>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPrivacyModal(true)}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 font-semibold"
            >
              📋 개인정보활용동의
            </button>
            {!isEditing ? (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                ✏️ 정보 수정
              </button>
            ) : (
              <div className="flex space-x-2">
                <button
                  onClick={handleSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
                >
                  💾 저장
                </button>
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 font-semibold"
                >
                  ✖️ 취소
                </button>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">학번</p>
              <p className="font-semibold">{student.studentId}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">이름</p>
              <p className="font-semibold">{student.name}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">학과</p>
              <p className="font-semibold">{student.department}</p>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">분야</p>
              <p className="font-semibold">{student.field}</p>
            </div>

            {/* 이메일 - 수정 가능 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">이메일</p>
              {isEditing ? (
                <input
                  type="email"
                  value={editData.email}
                  onChange={(e) => setEditData({...editData, email: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="example@email.com"
                />
              ) : (
                <p className="font-semibold">{student.email || '-'}</p>
              )}
            </div>

            {/* 전화번호 - 수정 가능 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600 mb-1">전화번호</p>
              {isEditing ? (
                <input
                  type="tel"
                  value={editData.phone}
                  onChange={(e) => setEditData({...editData, phone: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="010-1234-5678"
                />
              ) : (
                <p className="font-semibold">{student.phone || '-'}</p>
              )}
            </div>
          </div>
        </div>

        {isEditing && (
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              💡 <strong>입력 형식 안내</strong>
            </p>
            <ul className="text-sm text-blue-700 mt-2 space-y-1 ml-4">
              <li>• 이메일: example@email.com</li>
              <li>• 전화번호: 010-1234-5678 (하이픈 포함)</li>
            </ul>
          </div>
        )}
      </div>

      {/* 학생성공지수 */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h3 className="text-xl font-bold mb-6">학생성공지수</h3>
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-blue-50 p-6 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">비교과</p>
            <p className="text-3xl font-bold text-blue-600">{student.nonCurricularScore || 0}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">핵심교과</p>
            <p className="text-3xl font-bold text-green-600">{student.coreSubjectScore || 0}</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">산학협력</p>
            <p className="text-3xl font-bold text-purple-600">{student.industryScore || 0}</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">총점</p>
            <p className="text-3xl font-bold text-orange-600">{student.total || 0}</p>
          </div>
        </div>
      </div>

      {/* 비교과 활동 내역 */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h3 className="text-xl font-bold mb-4">비교과 활동 내역</h3>
        {(!student.nonCurricularHistory || student.nonCurricularHistory.length === 0) ? (
          <p className="text-gray-500 text-center py-4">활동 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {student.nonCurricularHistory.map((item, index) => (
              <div key={index} className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.program}</p>
                  <p className="text-sm text-gray-600">{item.date}</p>
                </div>
                <span className="font-bold text-blue-600">{item.score}점</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 핵심교과 이수 내역 */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h3 className="text-xl font-bold mb-4">핵심교과 이수 내역</h3>
        {(!student.coreSubjectHistory || student.coreSubjectHistory.length === 0) ? (
          <p className="text-gray-500 text-center py-4">이수 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {student.coreSubjectHistory.map((item, index) => (
              <div key={index} className="bg-green-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.subject}</p>
                  <p className="text-sm text-gray-600">{item.semester}</p>
                </div>
                <span className="font-bold text-green-600">{item.score}점</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 산학협력 활동 내역 */}
      <div className="bg-white rounded-xl shadow-md p-8">
        <h3 className="text-xl font-bold mb-4">산학협력 활동 내역</h3>
        {(!student.industryHistory || student.industryHistory.length === 0) ? (
          <p className="text-gray-500 text-center py-4">활동 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {student.industryHistory.map((item, index) => (
              <div key={index} className="bg-purple-50 p-4 rounded-lg flex justify-between items-center">
                <div>
                  <p className="font-medium">{item.program}</p>
                  <p className="text-sm text-gray-600">{item.date}</p>
                </div>
                <span className="font-bold text-purple-600">{item.score}점</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 개인정보활용동의 모달 */}
      {showPrivacyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold">개인정보활용동의</h2>
              <button
                onClick={() => setShowPrivacyModal(false)}
                className="text-gray-500 hover:text-gray-700 text-2xl"
              >
                ✕
              </button>
            </div>

            <div className="text-center py-20">
              <p className="text-gray-500 text-lg">모달 내용이 여기에 표시됩니다</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MyInfo;
