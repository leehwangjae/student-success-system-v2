import React from 'react';

function PrivacyPolicyContent() {
  return (
    <div className="privacy-policy-content text-sm leading-relaxed">
      <div className="text-center mb-6">
        <div className="text-xs text-gray-500 mb-2">[별지 제30호 서식] &lt;개정 2019.9.2.&gt;</div>
        <h2 className="text-2xl font-bold text-gray-900">개인정보 수집 · 이용 및 제3자 제공 동의서</h2>
      </div>

      <div className="bg-blue-50 border-l-4 border-blue-500 p-4 mb-6">
        <p className="text-gray-700">
          「개인정보보호법」에 따라 인천대학교산학협력단은 연구․사업 수행과 관련하여 귀하의 개인정보를 아래와 같이 수집․이용 및
          제3자 제공을 하고자 합니다. 다음의 사항에 대하여 자세히 읽어보신 후 동의 여부를 체크, 서명하여 주시기 바랍니다.
        </p>
      </div>

      {/* 개인정보 수집·이용 동의 */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-600">□</span>
          개인정보 수집·이용 동의 <span className="text-red-600 text-sm">[필수]</span>
        </h3>

        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-center">항목</th>
                <th className="border border-gray-300 px-4 py-2 text-center">수집목적</th>
                <th className="border border-gray-300 px-4 py-2 text-center">보유기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3">
                  성명, 연락처(휴대폰, 전화번호, e-mail주소), 주소, 소속, 학위, 학번, 학력, 경력, 계좌정보
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center">
                  인건비, 수당 및 경비 지급<br />
                  연구과제 관련 홍보
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                  공공기록물관리법에 따른<br />
                  회계서류의 준함
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-gray-700 mb-2">
          ※ 위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.<br />
          &nbsp;&nbsp;&nbsp;그러나 동의를 거부할 경우 원활한 연구과제 참여에 제한을 받을수 있습니다.
        </div>
      </div>

      {/* 고유식별정보 수집·이용 내역 */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-600">□</span>
          고유식별정보 수집·이용 내역 <span className="text-red-600 text-sm">[필수]</span>
        </h3>

        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-center">항목</th>
                <th className="border border-gray-300 px-4 py-2 text-center">수집목적</th>
                <th className="border border-gray-300 px-4 py-2 text-center">보유기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold text-red-600">
                  주민등록번호,<br />
                  외국인등록번호, 여권번호
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center">
                  본인식별절차,<br />
                  인건비, 수당 및 경비 지급
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                  공공기록물관리법에 따른<br />
                  회계서류의 준함
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-gray-700 mb-2">
          ※ 위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.<br />
          &nbsp;&nbsp;&nbsp;그러나 동의를 거부할 경우 원활한 연구과제 참여에 제한을 받을수 있습니다.
        </div>
      </div>

      {/* 개인정보의 제3자 제공 동의 */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span className="text-blue-600">□</span>
          개인정보의 제3자 제공 동의 <span className="text-red-600 text-sm">[필수]</span>
        </h3>

        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-2 text-center">제공받는 자</th>
                <th className="border border-gray-300 px-4 py-2 text-center">제공항목</th>
                <th className="border border-gray-300 px-4 py-2 text-center">제공목적</th>
                <th className="border border-gray-300 px-4 py-2 text-center">보유기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3">
                  중앙행정기관 및 전문기관, 지원기관, 회계정산기관, 금융기관
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  <span className="font-semibold text-red-600">주민등록번호, 외국인등록번호, 여권번호</span>,
                  성명, 연락처(휴대폰, 전화번호, e-mail주소), 주소, 계좌정보, 연구비카드사용내역 등
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center">
                  연구비의 사용,<br />
                  연구부정행위 검증 및<br />
                  조치에 관한 사무
                </td>
                <td className="border border-gray-300 px-4 py-3 text-center font-semibold">
                  연구개발과제 종료<br />
                  후 5년
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs text-gray-700 mb-2">
          ※ 위의 개인정보 제공에 대한 동의를 거부할 권리가 있습니다.<br />
          &nbsp;&nbsp;&nbsp;그러나 동의를 거부할 경우 원활한 연구과제 참여에 제한을 받을수 있습니다.
        </div>
      </div>

      {/* 최종 동의 문구 */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-300 rounded-lg p-6 text-center">
        <p className="text-base font-bold text-gray-900 mb-2">
          본인은 본 "개인정보의 수집․이용 및 제3자 제공 동의서" 내용을 읽고 명확히 이해하였으며,<br />
          이에 동의합니다.
        </p>
        <p className="text-sm text-gray-600 mt-4">
          인천대학교 산학협력단장 귀하
        </p>
      </div>

      {/* 하단 안내 */}
      <div className="mt-6 text-xs text-gray-500 bg-gray-50 p-4 rounded">
        <p className="mb-2">※ 본 동의서는 인천대학교 산학협력단의 공식 서식입니다.</p>
        <p className="mb-2">※ 주민등록번호 및 계좌번호는 시스템 관리자만 접근 가능하며, 암호화되어 저장됩니다.</p>
        <p>※ 동의 내용은 관련 법령에 따라 안전하게 보관됩니다.</p>
      </div>
    </div>
  );
}

export default PrivacyPolicyContent;
