import React from 'react';

function PrivacyPolicyContent() {
  return (
    <div className="privacy-policy-content text-sm leading-relaxed space-y-8">

      {/* 1. 개인정보처리방침의 의의 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">1. 개인정보처리방침의 의의</h3>
        <p className="text-gray-700 mb-3">
          인천대학교 산학협력단 RISE 사업단(이하 "RISE 사업단")은 「개인정보 보호법」 제30조에 따라
          정보주체의 개인정보를 보호하고 이와 관련한 고충을 신속하고 원활하게 처리할 수 있도록
          다음과 같이 개인정보 처리방침을 수립·공개합니다.
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <p className="text-sm text-gray-700">
            <strong>적용 범위:</strong> 본 개인정보 처리방침은 학생성공지수 관리 시스템을 이용하는
            모든 이용자에게 적용되며, 시스템을 통해 수집되는 모든 개인정보에 적용됩니다.
          </p>
        </div>
      </section>

      {/* 2. 수집하는 개인정보 항목 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">2. 수집하는 개인정보 항목</h3>
        <p className="text-gray-700 mb-4">
          RISE 사업단은 학생성공지수 관리 및 서비스 제공을 위해 다음과 같은 개인정보를 수집합니다.
        </p>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300 mb-4">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-3 text-left">구분</th>
                <th className="border border-gray-300 px-4 py-3 text-left">수집 항목</th>
                <th className="border border-gray-300 px-4 py-3 text-left">수집 방법</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold">필수 항목</td>
                <td className="border border-gray-300 px-4 py-3">
                  • 학번, 이름, 학과, 분야<br />
                  • 로그인 ID, 비밀번호 (암호화 저장)<br />
                  • 이메일 주소, 연락처
                </td>
                <td className="border border-gray-300 px-4 py-3">회원가입 시 직접 입력</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold">서비스 이용 정보</td>
                <td className="border border-gray-300 px-4 py-3">
                  • 비교과 활동 내역<br />
                  • 전략산업 교과목 이수 내역<br />
                  • 산학협력 프로그램 참여 내역<br />
                  • 학생성공지수 점수
                </td>
                <td className="border border-gray-300 px-4 py-3">서비스 이용 과정에서 자동 수집</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold">지급 정보 (선택)</td>
                <td className="border border-gray-300 px-4 py-3">
                  • 은행명, 계좌번호, 예금주명
                </td>
                <td className="border border-gray-300 px-4 py-3">장학금 지급 시 직접 입력</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3 font-semibold">접근 기록</td>
                <td className="border border-gray-300 px-4 py-3">
                  • 로그인 일시, IP 주소<br />
                  • User Agent (브라우저, OS 정보)<br />
                  • 개인정보 접근 기록
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  시스템 자동 수집<br />
                  (정보통신망법 제29조)
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded p-3 text-xs">
          <strong>※ 주민등록번호 수집 금지:</strong> 본 시스템은 주민등록번호를 수집하지 않습니다.<br />
          <strong>※ 만 14세 미만 아동:</strong> 본 서비스는 대학생을 대상으로 하며, 만 14세 미만 아동의 개인정보를 수집하지 않습니다.
        </div>
      </section>

      {/* 3. 개인정보의 수집 및 이용 목적 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">3. 개인정보의 수집 및 이용 목적</h3>
        <p className="text-gray-700 mb-4">
          수집한 개인정보는 다음의 목적을 위해 활용됩니다.
        </p>

        <div className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">가. 회원 관리</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>회원제 서비스 이용에 따른 본인확인, 개인식별</li>
              <li>회원가입 의사 확인, 연령 확인, 법정대리인 동의 진행</li>
              <li>불량회원의 부정 이용 방지와 비인가 사용 방지</li>
              <li>가입 및 가입횟수 제한, 분쟁 조정을 위한 기록보존</li>
              <li>불만처리 등 민원처리, 고지사항 전달</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">나. 학생성공지수 관리</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>비교과 활동, 전략산업 교과목, 산학협력 프로그램 참여 내역 관리</li>
              <li>학생성공지수 산출 및 관리</li>
              <li>프로그램 신청 및 승인 처리</li>
              <li>성과 분석 및 통계 자료 생성 (개인 식별 불가능한 형태)</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">다. 장학금 지급</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>학생성공지수 기반 장학금 지급 대상자 선정</li>
              <li>계좌 정보를 통한 장학금 송금</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">라. 법적 의무 준수</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>정보통신망법 제29조에 따른 접근 기록 보관 (6개월)</li>
              <li>개인정보 침해사고 발생 시 원인 규명 및 대응</li>
              <li>법령에서 정한 의무사항 이행</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 4. 개인정보의 보유 및 이용기간 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">4. 개인정보의 보유 및 이용기간</h3>
        <p className="text-gray-700 mb-4">
          RISE 사업단은 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에
          동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
        </p>

        <div className="overflow-x-auto mb-4">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-3">항목</th>
                <th className="border border-gray-300 px-4 py-3">보유기간</th>
                <th className="border border-gray-300 px-4 py-3">근거</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3">회원 정보</td>
                <td className="border border-gray-300 px-4 py-3">회원 탈퇴 시까지</td>
                <td className="border border-gray-300 px-4 py-3">서비스 이용 계약</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3">학생성공지수 관련 데이터</td>
                <td className="border border-gray-300 px-4 py-3">졸업 후 5년</td>
                <td className="border border-gray-300 px-4 py-3">공공기록물관리법</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3">장학금 지급 정보</td>
                <td className="border border-gray-300 px-4 py-3">지급 완료 후 5년</td>
                <td className="border border-gray-300 px-4 py-3">국세기본법, 회계서류 보관</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3">접근 로그 (IP, 접속시각 등)</td>
                <td className="border border-gray-300 px-4 py-3 font-semibold text-blue-600">6개월</td>
                <td className="border border-gray-300 px-4 py-3">정보통신망법 제29조</td>
              </tr>
              <tr>
                <td className="border border-gray-300 px-4 py-3">부정 이용 기록</td>
                <td className="border border-gray-300 px-4 py-3">1년</td>
                <td className="border border-gray-300 px-4 py-3">부정 이용 방지</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 p-4">
          <p className="text-sm text-gray-700">
            <strong>보유기간 경과 시:</strong> 개인정보는 보유기간이 경과하거나 처리목적이 달성된 경우
            지체 없이 파기됩니다. 단, 법령에 따라 보존이 필요한 경우 별도로 분리 보관됩니다.
          </p>
        </div>
      </section>

      {/* 5. 개인정보의 파기절차 및 방법 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">5. 개인정보의 파기절차 및 방법</h3>

        <div className="space-y-4">
          <div>
            <h4 className="font-semibold text-gray-900 mb-2">가. 파기절차</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li>이용자가 회원가입 등을 위해 입력한 정보는 목적이 달성된 후 내부 방침 및 기타 관련 법령에 의한 정보보호 사유에 따라 일정 기간 저장된 후 파기됩니다.</li>
              <li>동 개인정보는 법률에 의한 경우가 아니고서는 보유되는 이외의 다른 목적으로 이용되지 않습니다.</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 mb-2">나. 파기방법</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>전자적 파일:</strong> 복구 및 재생이 불가능한 기술적 방법을 사용하여 완전하게 삭제</li>
              <li><strong>종이 문서:</strong> 분쇄기로 분쇄하거나 소각</li>
            </ul>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">다. 회원 탈퇴 시 처리</h4>
            <p className="text-sm text-gray-700 mb-2">
              회원이 탈퇴를 요청한 경우, 다음과 같이 처리됩니다:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-700 space-y-1 ml-4">
              <li>회원 정보는 즉시 삭제 처리됩니다.</li>
              <li>법령에 따라 보관이 필요한 정보는 별도의 데이터베이스로 옮겨져 일정 기간 보관 후 파기됩니다.</li>
              <li>파기 시까지 해당 정보는 법률에 의한 경우 외에는 다른 목적으로 이용되지 않습니다.</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 6. 개인정보 제3자 제공 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">6. 개인정보의 제3자 제공</h3>
        <p className="text-gray-700 mb-4">
          RISE 사업단은 원칙적으로 정보주체의 개인정보를 수집·이용 목적으로 명시한 범위 내에서 처리하며,
          다음의 경우를 제외하고는 정보주체의 사전 동의 없이 본래의 목적 범위를 초과하여 처리하거나
          제3자에게 제공하지 않습니다.
        </p>

        <div className="bg-gray-50 p-4 rounded-lg mb-4">
          <h4 className="font-semibold text-gray-900 mb-3">제3자 제공이 가능한 경우:</h4>
          <ul className="list-decimal list-inside text-gray-700 space-y-2 ml-4">
            <li>정보주체로부터 별도의 동의를 받은 경우</li>
            <li>법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위하여 불가피한 경우</li>
            <li>정보주체 또는 그 법정대리인이 의사표시를 할 수 없는 상태에 있거나 주소불명 등으로 사전 동의를 받을 수 없는 경우로서 명백히 정보주체 또는 제3자의 급박한 생명, 신체, 재산의 이익을 위하여 필요하다고 인정되는 경우</li>
          </ul>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead className="bg-gray-100">
              <tr>
                <th className="border border-gray-300 px-4 py-3">제공받는 자</th>
                <th className="border border-gray-300 px-4 py-3">제공 목적</th>
                <th className="border border-gray-300 px-4 py-3">제공 항목</th>
                <th className="border border-gray-300 px-4 py-3">보유기간</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="border border-gray-300 px-4 py-3">
                  교육부, 한국연구재단 등 중앙행정기관
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  사업 성과 보고,<br />
                  정산 및 회계 감사
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  학번, 이름, 학과,<br />
                  학생성공지수 점수,<br />
                  장학금 지급 내역
                </td>
                <td className="border border-gray-300 px-4 py-3">
                  사업 종료 후 5년
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* 7. 개인정보 처리의 위탁 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">7. 개인정보 처리의 위탁</h3>
        <p className="text-gray-700 mb-4">
          현재 RISE 사업단은 개인정보 처리를 외부 업체에 위탁하지 않습니다.
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <p className="text-sm text-gray-700">
            향후 개인정보 처리 업무를 위탁하는 경우, 위탁받는 자와 위탁 업무 내용을 본 개인정보 처리방침에
            명시하고, 위탁계약 시 개인정보 보호를 위한 관리·감독 조항을 포함하겠습니다.
          </p>
        </div>
      </section>

      {/* 8. 정보주체의 권리·의무 및 행사방법 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">8. 정보주체의 권리·의무 및 행사방법</h3>
        <p className="text-gray-700 mb-4">
          정보주체는 다음과 같은 권리를 행사할 수 있습니다.
        </p>

        <div className="space-y-3">
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-blue-500">
            <h4 className="font-semibold text-gray-900 mb-2">✓ 개인정보 열람 요구</h4>
            <p className="text-sm text-gray-700">
              로그인 후 '내 정보' 페이지에서 본인의 개인정보를 언제든지 조회할 수 있습니다.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-green-500">
            <h4 className="font-semibold text-gray-900 mb-2">✓ 개인정보 정정·삭제 요구</h4>
            <p className="text-sm text-gray-700">
              '내 정보' 페이지에서 직접 개인정보를 수정하거나 삭제할 수 있습니다.<br />
              단, 법령에서 정한 의무 보관 정보는 삭제가 제한될 수 있습니다.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-yellow-500">
            <h4 className="font-semibold text-gray-900 mb-2">✓ 개인정보 처리정지 요구</h4>
            <p className="text-sm text-gray-700">
              개인정보 처리 정지를 원하는 경우 개인정보 보호책임자에게 요청할 수 있습니다.<br />
              단, 법률에 특별한 규정이 있거나 법령상 의무를 준수하기 위한 경우 제한될 수 있습니다.
            </p>
          </div>

          <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg border-l-4 border-red-500">
            <h4 className="font-semibold text-gray-900 mb-2">✓ 동의 철회 (회원 탈퇴)</h4>
            <p className="text-sm text-gray-700">
              '내 정보' 페이지에서 회원 탈퇴를 통해 개인정보 수집·이용·제공에 대한 동의를 철회할 수 있습니다.
            </p>
          </div>
        </div>

        <div className="mt-4 bg-yellow-50 border border-yellow-200 rounded p-3">
          <p className="text-sm text-gray-700">
            <strong>※ 권리 행사 시 유의사항:</strong><br />
            • 만 14세 미만 아동의 경우 법정대리인이 그 권리를 행사할 수 있습니다.<br />
            • 권리 행사는 서면, 전화, 이메일 등을 통하여 하실 수 있으며, RISE 사업단은 이에 대해 지체 없이 조치하겠습니다.<br />
            • 개인정보의 오류에 대한 정정을 요청하신 경우에는 정정을 완료하기 전까지 해당 개인정보를 이용 또는 제공하지 않습니다.
          </p>
        </div>
      </section>

      {/* 9. 개인정보의 안전성 확보조치 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">9. 개인정보의 안전성 확보조치</h3>
        <p className="text-gray-700 mb-4">
          RISE 사업단은 「개인정보 보호법」 제29조에 따라 다음과 같이 안전성 확보에 필요한 기술적·관리적 및
          물리적 조치를 하고 있습니다.
        </p>

        <div className="space-y-3">
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">가. 기술적 조치</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>비밀번호 암호화:</strong> bcrypt 알고리즘을 이용한 비밀번호 해시 처리 (salt rounds: 10)</li>
              <li><strong>HTTPS 통신:</strong> 모든 데이터 전송 시 SSL/TLS 암호화 적용</li>
              <li><strong>접근 제어:</strong> 데이터베이스 Row Level Security(RLS) 정책 적용</li>
              <li><strong>접근 로그 관리:</strong> 개인정보 접근 기록을 6개월간 보관하여 비정상 접근 모니터링</li>
              <li><strong>환경변수 보호:</strong> API 키 및 데이터베이스 접속 정보 암호화 관리</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">나. 관리적 조치</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>내부관리계획 수립·시행:</strong> 개인정보 보호 조직 구성 및 내부관리계획 수립</li>
              <li><strong>접근 권한 최소화:</strong> 개인정보 처리자의 권한을 최소한으로 부여하고 관리</li>
              <li><strong>정기적 보안 점검:</strong> 월간/분기별/연간 보안 점검 실시</li>
              <li><strong>직원 교육:</strong> 개인정보를 처리하는 직원을 대상으로 정기적인 교육 실시</li>
            </ul>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2">다. 물리적 조치</h4>
            <ul className="list-disc list-inside text-gray-700 space-y-1 ml-4">
              <li><strong>서버 보안:</strong> 클라우드 서비스(Supabase, Vercel) 이용으로 물리적 보안 강화</li>
              <li><strong>백업 관리:</strong> 정기적인 데이터 백업 및 복구 절차 마련</li>
            </ul>
          </div>
        </div>
      </section>

      {/* 10. 개인정보 자동 수집 장치의 설치·운영 및 거부에 관한 사항 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">10. 개인정보 자동 수집 장치의 설치·운영 및 거부</h3>
        <p className="text-gray-700 mb-3">
          RISE 사업단은 현재 쿠키(Cookie) 등 개인정보를 자동으로 수집하는 장치를 사용하지 않습니다.
        </p>
        <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
          <p className="text-sm text-gray-700">
            향후 쿠키 등을 사용하게 되는 경우, 본 개인정보 처리방침에 명시하고
            사용자가 쿠키 설치를 거부할 수 있는 방법을 안내하겠습니다.
          </p>
        </div>
      </section>

      {/* 11. 개인정보 처리방침의 변경 */}
      <section>
        <h3 className="text-xl font-bold text-gray-900 mb-4">11. 개인정보 처리방침의 변경</h3>
        <p className="text-gray-700 mb-3">
          본 개인정보 처리방침은 법령·정책 또는 보안기술의 변경에 따라 내용의 추가·삭제 및 수정이 있을 시에는
          변경사항의 시행 <strong className="text-blue-600">7일 전</strong>부터 공지사항을 통하여 고지할 것입니다.
        </p>
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 rounded-lg p-4">
          <p className="text-sm text-gray-700">
            <strong>• 공고일자:</strong> {new Date().toLocaleDateString('ko-KR')}<br />
            <strong>• 시행일자:</strong> {new Date().toLocaleDateString('ko-KR')}
          </p>
        </div>
      </section>

    </div>
  );
}

export default PrivacyPolicyContent;
