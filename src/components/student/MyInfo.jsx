import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

function MyInfo() {
  const { currentUser, students, updateStudentInfo } = useAppContext();
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    ssn: currentUser?.ssn || '',
    bankName: currentUser?.bankName || '',
    accountNumber: currentUser?.accountNumber || '',
    accountHolder: currentUser?.accountHolder || ''
  });

  // 실시간으로 students에서 현재 사용자 정보 가져오기
  const student = students.find(s => s.id === currentUser?.id) || currentUser;

  if (!student) return null;

  const handleEdit = () => {
    setEditData({
      email: student.email || '',
      phone: student.phone || '',
      ssn: student.ssn || '',
      bankName: student.bankName || '',
      accountNumber: student.accountNumber || '',
      accountHolder: student.accountHolder || ''
    });
    setIsEditing(true);
  };

  const handleSave = () => {
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

    // 주민등록번호 형식 검사 (입력된 경우에만)
    if (editData.ssn) {
      const ssnRegex = /^\d{6}-\d{7}$/;
      if (!ssnRegex.test(editData.ssn)) {
        alert('올바른 주민등록번호 형식을 입력해주세요. (예: 000000-0000000)');
        return;
      }
    }

    // 계좌번호 형식 검사 (입력된 경우에만)
    if (editData.accountNumber) {
      const accountRegex = /^\d{10,14}$/;
      if (!accountRegex.test(editData.accountNumber.replace(/-/g, ''))) {
        alert('올바른 계좌번호를 입력해주세요. (숫자만 입력)');
        return;
      }
    }

    // 계좌정보는 모두 입력하거나 모두 비워야 함
    const hasAnyBankInfo = editData.bankName || editData.accountNumber || editData.accountHolder;
    const hasAllBankInfo = editData.bankName && editData.accountNumber && editData.accountHolder;

    if (hasAnyBankInfo && !hasAllBankInfo) {
      alert('계좌정보는 은행명, 계좌번호, 예금주명을 모두 입력해주세요.');
      return;
    }

    const success = updateStudentInfo(student.id, editData);
    if (success) {
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setEditData({
      email: student.email || '',
      phone: student.phone || '',
      ssn: student.ssn || '',
      bankName: student.bankName || '',
      accountNumber: student.accountNumber || '',
      accountHolder: student.accountHolder || ''
    });
    setIsEditing(false);
  };

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">내 정보</h2>
      
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-xl font-bold">기본 정보</h3>
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
        
        <div className="grid grid-cols-2 gap-6">
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
              <p className="font-semibold">{student.email}</p>
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

        {/* 민감정보 섹션 */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center gap-2 mb-4">
            <h4 className="text-lg font-bold text-gray-900">🔐 개인정보</h4>
            <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">선택 사항</span>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            장학금 및 수당 지급을 위해 필요한 정보입니다. 필요 시 입력해주세요.
          </p>

          <div className="grid grid-cols-1 gap-4">
            {/* 주민등록번호 */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-2">
                <span>주민등록번호</span>
                <span className="text-xs text-gray-500">(개인정보 동의서 작성 항목)</span>
              </p>
              {isEditing ? (
                <input
                  type="text"
                  value={editData.ssn}
                  onChange={(e) => setEditData({...editData, ssn: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="000000-0000000"
                  maxLength="14"
                />
              ) : (
                <p className="font-semibold">{student.ssn ? '••••••-•••••••' : '-'}</p>
              )}
            </div>

            {/* 계좌정보 */}
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                <span>계좌정보</span>
                <span className="text-xs text-gray-500">(개인정보 동의서 작성 항목)</span>
              </p>
              <div className="space-y-3">
                {/* 은행명 */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">은행명</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.bankName}
                      onChange={(e) => setEditData({...editData, bankName: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="예: 국민은행"
                    />
                  ) : (
                    <p className="font-semibold">{student.bankName || '-'}</p>
                  )}
                </div>

                {/* 계좌번호 */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">계좌번호</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.accountNumber}
                      onChange={(e) => setEditData({...editData, accountNumber: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="숫자만 입력"
                    />
                  ) : (
                    <p className="font-semibold">{student.accountNumber ? '••••••••••••' : '-'}</p>
                  )}
                </div>

                {/* 예금주명 */}
                <div>
                  <p className="text-xs text-gray-500 mb-1">예금주명</p>
                  {isEditing ? (
                    <input
                      type="text"
                      value={editData.accountHolder}
                      onChange={(e) => setEditData({...editData, accountHolder: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="예금주 이름"
                    />
                  ) : (
                    <p className="font-semibold">{student.accountHolder || '-'}</p>
                  )}
                </div>
              </div>
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
              <li>• 주민등록번호: 000000-0000000 (하이픈 포함)</li>
              <li>• 계좌번호: 숫자만 입력 (하이픈 제외)</li>
              <li>• 계좌정보는 은행명, 계좌번호, 예금주명을 모두 입력해야 합니다</li>
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
            <p className="text-3xl font-bold text-blue-600">{student.nonCurricularScore}</p>
          </div>
          <div className="bg-green-50 p-6 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">핵심교과</p>
            <p className="text-3xl font-bold text-green-600">{student.coreSubjectScore}</p>
          </div>
          <div className="bg-purple-50 p-6 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">산학협력</p>
            <p className="text-3xl font-bold text-purple-600">{student.industryScore}</p>
          </div>
          <div className="bg-orange-50 p-6 rounded-lg text-center">
            <p className="text-sm text-gray-600 mb-2">총점</p>
            <p className="text-3xl font-bold text-orange-600">{student.total}</p>
          </div>
        </div>
      </div>

      {/* 비교과 활동 내역 */}
      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <h3 className="text-xl font-bold mb-4">비교과 활동 내역</h3>
        {student.nonCurricularHistory?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">활동 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {student.nonCurricularHistory?.map((item) => (
              <div key={item.id} className="bg-blue-50 p-4 rounded-lg flex justify-between items-center">
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
        {student.coreSubjectHistory?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">이수 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {student.coreSubjectHistory?.map((item) => (
              <div key={item.id} className="bg-green-50 p-4 rounded-lg flex justify-between items-center">
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
        {student.industryHistory?.length === 0 ? (
          <p className="text-gray-500 text-center py-4">활동 내역이 없습니다.</p>
        ) : (
          <div className="space-y-3">
            {student.industryHistory?.map((item) => (
              <div key={item.id} className="bg-purple-50 p-4 rounded-lg flex justify-between items-center">
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
    </div>
  );
}

export default MyInfo;