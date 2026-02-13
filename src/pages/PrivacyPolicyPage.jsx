import React from 'react';
import { useNavigate } from 'react-router-dom';
import PrivacyPolicyContent from '../components/privacy/PrivacyPolicyContent';

function PrivacyPolicyPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-8 shadow-lg">
        <div className="max-w-4xl mx-auto px-4">
          <button
            onClick={() => navigate(-1)}
            className="mb-4 flex items-center text-white hover:text-blue-100 transition-colors"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            뒤로 가기
          </button>
          <h1 className="text-3xl font-bold">개인정보 처리방침</h1>
          <p className="mt-2 text-blue-100">인천대학교 RISE 사업단 학생성공지수 관리 시스템</p>
        </div>
      </div>

      {/* 내용 */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="mb-6 bg-blue-50 border-l-4 border-blue-600 p-4">
            <p className="text-sm text-gray-700">
              <strong>최종 수정일:</strong> {new Date().toLocaleDateString('ko-KR')}
            </p>
            <p className="text-sm text-gray-700 mt-1">
              본 개인정보 처리방침은 「개인정보 보호법」 제30조에 따라 작성되었습니다.
            </p>
          </div>

          <PrivacyPolicyContent />

          {/* 추가 법적 고지 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold mb-4">개인정보 보호책임자</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong>소속:</strong> 인천대학교 산학협력단 RISE 사업단<br />
                <strong>문의:</strong> 개인정보 관련 문의사항은 관리자에게 문의하시기 바랍니다.
              </p>
            </div>
          </div>

          {/* 개인정보 권리 안내 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold mb-4">정보주체의 권리·의무 및 행사방법</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                정보주체는 다음과 같은 권리를 행사할 수 있습니다:
              </p>
              <ul className="list-disc list-inside space-y-2 ml-4">
                <li>개인정보 열람 요구</li>
                <li>개인정보 정정·삭제 요구</li>
                <li>개인정보 처리정지 요구</li>
                <li>동의 철회 (회원 탈퇴)</li>
              </ul>
              <p className="mt-4 text-blue-600 font-semibold">
                권리 행사는 로그인 후 '내 정보' 페이지에서 직접 하실 수 있습니다.
              </p>
            </div>
          </div>

          {/* 개인정보 침해 구제 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold mb-4">개인정보 침해에 대한 구제방법</h3>
            <div className="space-y-3 text-sm text-gray-700">
              <p>
                개인정보 침해로 인한 피해구제, 상담 등을 원하시는 경우 다음 기관에 문의하시기 바랍니다:
              </p>
              <ul className="space-y-2">
                <li>
                  <strong>개인정보 침해신고센터</strong><br />
                  전화: (국번없이) 118<br />
                  홈페이지: <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">privacy.kisa.or.kr</a>
                </li>
                <li>
                  <strong>개인정보 분쟁조정위원회</strong><br />
                  전화: (국번없이) 1833-6972<br />
                  홈페이지: <a href="https://www.kopico.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.kopico.go.kr</a>
                </li>
                <li>
                  <strong>대검찰청 사이버범죄수사단</strong><br />
                  전화: 02-3480-3573<br />
                  홈페이지: <a href="https://www.spo.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">www.spo.go.kr</a>
                </li>
                <li>
                  <strong>경찰청 사이버안전국</strong><br />
                  전화: (국번없이) 182<br />
                  홈페이지: <a href="https://cyberbureau.police.go.kr" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">cyberbureau.police.go.kr</a>
                </li>
              </ul>
            </div>
          </div>

          {/* 처리방침 변경 안내 */}
          <div className="mt-8 pt-8 border-t border-gray-200">
            <h3 className="text-lg font-bold mb-4">개인정보 처리방침 변경</h3>
            <p className="text-sm text-gray-700">
              본 개인정보 처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는
              변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
            </p>
          </div>
        </div>

        {/* 하단 버튼 */}
        <div className="mt-6 flex gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex-1 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            닫기
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
            </svg>
            인쇄하기
          </button>
        </div>
      </div>
    </div>
  );
}

export default PrivacyPolicyPage;
