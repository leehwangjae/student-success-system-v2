import React, { useState, useEffect, useRef } from 'react';
import PrivacyPolicyContent from './PrivacyPolicyContent';

function PrivacyConsentModal({ isOpen, onClose, onAgree }) {
  const [hasScrolledToBottom, setHasScrolledToBottom] = useState(false);
  const [agreedToAll, setAgreedToAll] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);
  const contentRef = useRef(null);
  const canvasRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);

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
      setHasSigned(false);
      clearSignature();
    }
  }, [isOpen]);

  // 캔버스 초기화
  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  }, [isOpen]);

  const handleAgree = () => {
    if (agreedToAll && hasSigned) {
      // 서명 이미지를 Base64로 변환하여 전달
      const canvas = canvasRef.current;
      const signatureImage = canvas.toDataURL('image/png');
      onAgree(signatureImage);
    }
  };

  // 서명 시작
  const startDrawing = (e) => {
    if (!hasScrolledToBottom || !agreedToAll) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    setIsDrawing(true);
    ctx.beginPath();

    const x = e.type.includes('touch') ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = e.type.includes('touch') ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.moveTo(x, y);
  };

  // 서명 그리기
  const draw = (e) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');

    const x = e.type.includes('touch') ? e.touches[0].clientX - rect.left : e.clientX - rect.left;
    const y = e.type.includes('touch') ? e.touches[0].clientY - rect.top : e.clientY - rect.top;

    ctx.lineTo(x, y);
    ctx.stroke();

    setHasSigned(true);
  };

  // 서명 종료
  const stopDrawing = () => {
    setIsDrawing(false);
  };

  // 서명 지우기
  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      setHasSigned(false);
    }
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

        {/* 전체 컨텐츠 (본문 + 동의 + 서명) */}
        <div
          ref={contentRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {/* 본문 */}
          <div className="p-6">
            <PrivacyPolicyContent />
          </div>

          {/* 동의 체크박스 및 서명 */}
          <div className="border-t bg-gray-50 px-6 py-4">
            {/* 스크롤 완료 안내 */}
            {hasScrolledToBottom && (
              <div className="mb-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                <p className="text-sm text-green-700 font-semibold">
                  ✅ 동의서를 끝까지 확인하셨습니다
                </p>
              </div>
            )}

            {/* 스크롤 유도 메시지 */}
            {!hasScrolledToBottom && (
              <div className="mb-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
                <p className="text-sm text-blue-700 font-semibold animate-pulse">
                  ⬇️ 아래로 스크롤하여 내용을 끝까지 읽어주세요
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

            {/* 서명 박스 */}
            <div className={`border-2 rounded-lg p-4 mb-4 transition-all ${
              hasScrolledToBottom && agreedToAll
                ? 'border-blue-300 bg-blue-50'
                : 'border-gray-200 bg-gray-100 opacity-60'
            }`}>
              <div className="flex justify-between items-center mb-2">
                <label className="font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-red-500">*</span>
                  서명
                </label>
                <button
                  onClick={clearSignature}
                  disabled={!hasScrolledToBottom || !agreedToAll}
                  className={`text-sm px-3 py-1 rounded ${
                    hasScrolledToBottom && agreedToAll
                      ? 'text-gray-600 hover:bg-gray-200'
                      : 'text-gray-400 cursor-not-allowed'
                  }`}
                >
                  🗑️ 지우기
                </button>
              </div>
              <p className="text-sm text-gray-600 mb-2">
                위의 동의 사항을 확인하였으며, 아래 서명란에 서명해주세요
              </p>
              <div className="relative">
                <canvas
                  ref={canvasRef}
                  width={600}
                  height={150}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                  className={`border-2 border-dashed rounded w-full bg-white ${
                    hasScrolledToBottom && agreedToAll
                      ? 'border-gray-300 cursor-crosshair'
                      : 'border-gray-200 cursor-not-allowed'
                  }`}
                  style={{ touchAction: 'none' }}
                />
                {!hasSigned && hasScrolledToBottom && agreedToAll && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <span className="text-gray-400 text-sm">✍️ 여기에 서명하세요</span>
                  </div>
                )}
              </div>
            </div>

            {/* 버튼 그룹 */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-bold hover:bg-gray-300 transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleAgree}
                disabled={!agreedToAll || !hasSigned}
                className={`flex-1 px-6 py-3 rounded-lg font-bold transition-colors ${
                  agreedToAll && hasSigned
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
            {hasScrolledToBottom && (!agreedToAll || !hasSigned) && (
              <p className="text-xs text-red-500 text-center mt-3 font-semibold">
                ⚠️ 동의 체크와 서명을 모두 완료해야 회원가입을 진행할 수 있습니다
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PrivacyConsentModal;
