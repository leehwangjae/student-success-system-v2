import React, { useState, useEffect, useRef } from 'react';
import PrivacyPolicyContent from './PrivacyPolicyContent';

function PrivacyConsentModal({ isOpen, onClose, onAgree }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedToAll, setAgreedToAll] = useState(false);
  const contentRef = useRef(null);

  // 스크롤 감지
  const handleScroll = (e) => {
    const element = e.target;
    const scrolledToBottom = element.scrollHeight - element.scrollTop <= element.clientHeight + 50;

    if (scrolledToBottom && !hasScrolledToBottom) {
      setHasScrolledToBottom(true);
    }
  };

  // 모달이 열릴 때마다 초기화
  useEffect(() => {
    if (isOpen) {
      setHasScrolledToBottom(false);
      setAgreedToAll(false);
    }
  }, [isOpen]);

  const handleAgree = () => {
    if (agreedToAll) {
      onAgree();
    }
  };

  const handleDownloadPDF = () => {
    // PDF 다운로드 링크
    window.open('/documents/privacy-policy.pdf', '_blank');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4">
          <h2 className="text-xl font-bold">📋 개인정보 수집·이용 및 제3자 제공 동의</h2>
          <p className="text-blue-100 text-sm mt-1">
            회원가입을 위해 아래 내용을 반드시 확인하고 동의해주세요
          </p>
        </div>

        {/* 컨텐츠 */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto p-6"
        >
          <PrivacyPolicyContent />

          {/* 스크롤 유도 메시지 */}
          {!hasScrolledToBottom && (
            <div className="sticky bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent pt-8 pb-4 text-center">
              <div className="inline-block bg-blue-100 text-blue-700 px-6 py-3 rounded-full text-sm font-semibold animate-bounce">
                ⬇️ 아래로 스크롤하여 내용을 끝까지 읽어주세요
              </div>
            </div>
          )}
        </div>

        {/* 동의 체크박스 및 버튼 */}
        <div className="border-t bg-gray-50 px-6 py-4">
          {/* 스크롤 완료 안내 */}
          {hasScrolledToBottom && (
            <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
              <p className="text-sm text-green-700 font-semibold">
                ✅ 동의서를 끝까지 확인하셨습니다
              </p>
            </div>
          )}

          {/* 전체 동의 체크박스 */}
          <label
            className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all mb-4 ${
              hasScrolledToBottom
                ? agreedToAll
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
                : 'border-gray-200 bg-gray-100 cursor-not-allowed opacity-60'
            }`}
          >
            <input
              type="checkbox"
              checked={agreedToAll}
              onChange={(e) => setAgreedToAll(e.target.checked)}
              disabled={!hasScrolledToBottom}
              className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex-1">
              <div className="font-bold text-gray-900 mb-1">
                [필수] 개인정보 수집·이용 및 제3자 제공에 모두 동의합니다
              </div>
              <div className="text-sm text-gray-600">
                • 개인정보 수집·이용 동의<br />
                • 고유식별정보(주민등록번호) 수집·이용 동의<br />
                • 개인정보의 제3자 제공 동의
              </div>
            </div>
          </label>

          {/* 버튼 그룹 */}
          <div className="flex gap-3">
            <button
              onClick={handleDownloadPDF}
              className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg font-bold hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
            >
              📥 PDF 다운로드
            </button>
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleAgree}
              disabled={!agreedToAll}
              className={`flex-1 px-6 py-3 rounded-lg font-bold transition-colors ${
                agreedToAll
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              동의하고 계속
            </button>
          </div>

          {/* 안내 메시지 */}
          {!hasScrolledToBottom && (
            <p className="text-xs text-gray-500 text-center mt-3">
              ⚠️ 동의서를 끝까지 읽으신 후 동의할 수 있습니다
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export default PrivacyConsentModal;
