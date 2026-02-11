import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';

function PaymentInfoModal({ student, onClose }) {
  const { updateStudentInfo } = useAppContext();
  const [formData, setFormData] = useState({
    ssn: student.ssn || '',
    bankName: student.bankName || '',
    accountNumber: student.accountNumber || '',
    accountHolder: student.accountHolder || ''
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // 주민등록번호 형식 검사 (입력된 경우에만)
    if (formData.ssn) {
      const ssnRegex = /^\d{6}-\d{7}$/;
      if (!ssnRegex.test(formData.ssn)) {
        alert('올바른 주민등록번호 형식을 입력해주세요. (예: 000000-0000000)');
        return;
      }
    }

    // 계좌번호 형식 검사 (입력된 경우에만)
    if (formData.accountNumber) {
      const accountRegex = /^\d{10,14}$/;
      if (!accountRegex.test(formData.accountNumber.replace(/-/g, ''))) {
        alert('올바른 계좌번호를 입력해주세요. (숫자만 입력, 10-14자리)');
        return;
      }
    }

    // 계좌정보는 모두 입력하거나 모두 비워야 함
    const hasAnyBankInfo = formData.bankName || formData.accountNumber || formData.accountHolder;
    const hasAllBankInfo = formData.bankName && formData.accountNumber && formData.accountHolder;

    if (hasAnyBankInfo && !hasAllBankInfo) {
      alert('계좌정보는 은행명, 계좌번호, 예금주명을 모두 입력해주세요.');
      return;
    }

    setIsSaving(true);
    try {
      await updateStudentInfo(student.id, formData);
      alert('지급 정보가 저장되었습니다.');
      onClose();
    } catch (error) {
      alert('저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-green-600 to-green-700 text-white p-6 rounded-t-xl">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold flex items-center gap-2">
                💳 지급 정보 입력
              </h2>
              <p className="text-green-100 text-sm mt-1">
                장학금 및 수당 지급을 위한 정보를 입력해주세요
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
        </div>

        {/* 안내 메시지 */}
        <div className="p-6 bg-yellow-50 border-b border-yellow-100">
          <div className="flex gap-3">
            <span className="text-2xl">ℹ️</span>
            <div>
              <p className="text-sm text-yellow-900 font-medium mb-1">
                개인정보 수집·이용 동의
              </p>
              <p className="text-xs text-yellow-800">
                입력하신 정보는 장학금 및 수당 지급 목적으로만 사용되며, 안전하게 보호됩니다.
                회원가입 시 동의하신 개인정보 수집·이용 동의서에 따라 처리됩니다.
              </p>
            </div>
          </div>
        </div>

        {/* 폼 내용 */}
        <div className="p-6 space-y-6">
          {/* 주민등록번호 */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
            <label className="block mb-2">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                주민등록번호
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">선택 사항</span>
              </span>
              <span className="text-xs text-gray-500 block mt-1">
                세금 신고 및 지급 증빙을 위해 필요할 수 있습니다
              </span>
            </label>
            <input
              type="text"
              value={formData.ssn}
              onChange={(e) => setFormData({...formData, ssn: e.target.value})}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
              placeholder="000000-0000000"
              maxLength="14"
            />
            <p className="text-xs text-gray-500 mt-2">
              💡 형식: 생년월일(6자리)-뒷자리(7자리) / 예: 900101-1234567
            </p>
          </div>

          {/* 계좌정보 */}
          <div className="bg-gray-50 p-5 rounded-lg border border-gray-200">
            <div className="mb-4">
              <span className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                계좌 정보
                <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-0.5 rounded">선택 사항</span>
              </span>
              <span className="text-xs text-gray-500 block mt-1">
                장학금 및 수당 지급을 위한 계좌 정보입니다
              </span>
            </div>

            <div className="space-y-4">
              {/* 은행명 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  은행명
                </label>
                <input
                  type="text"
                  value={formData.bankName}
                  onChange={(e) => setFormData({...formData, bankName: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="예: 국민은행, 신한은행"
                />
              </div>

              {/* 계좌번호 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  계좌번호
                </label>
                <input
                  type="text"
                  value={formData.accountNumber}
                  onChange={(e) => setFormData({...formData, accountNumber: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="숫자만 입력 (하이픈 제외)"
                />
                <p className="text-xs text-gray-500 mt-1">
                  💡 하이픈(-) 없이 숫자만 입력해주세요
                </p>
              </div>

              {/* 예금주명 */}
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  예금주명
                </label>
                <input
                  type="text"
                  value={formData.accountHolder}
                  onChange={(e) => setFormData({...formData, accountHolder: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="예금주 이름 (본인 명의)"
                />
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                ⚠️ 계좌정보를 입력하실 경우, 은행명, 계좌번호, 예금주명을 모두 입력해주세요.
              </p>
            </div>
          </div>

          {/* 입력 안내 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm font-semibold text-blue-900 mb-2">
              📋 입력 안내
            </p>
            <ul className="text-xs text-blue-800 space-y-1.5">
              <li>• 모든 정보는 선택 사항이며, 필요 시 입력하지 않아도 됩니다</li>
              <li>• 주민등록번호는 세금 처리를 위해 필요할 수 있습니다</li>
              <li>• 계좌 정보는 장학금이나 수당 지급 시 사용됩니다</li>
              <li>• 입력한 정보는 언제든지 수정할 수 있습니다</li>
              <li>• 입력한 정보는 암호화되어 안전하게 보관됩니다</li>
            </ul>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t border-gray-200 rounded-b-xl flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-6 py-3 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 font-semibold transition-colors disabled:opacity-50"
          >
            취소
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {isSaving ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                저장 중...
              </>
            ) : (
              <>
                💾 저장
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default PaymentInfoModal;
// Force rebuild 2026년 02월 11일 수 오전 10:26:21
