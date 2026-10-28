import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';

function ServicesPage() {
  const navigate = useNavigate();
  const { currentUser, setCurrentUser } = useAppContext();

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('currentUser');
    navigate('/');
  };

  const role = currentUser?.role;
  const isAdmin = role === 'admin' || role === 'master';
  const isProfessor = role === 'professor';
  const isStudent = role === 'student';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/image/INU_RISE_logo.png"
              alt="RISE 사업단 로고"
              className="h-10 w-auto object-contain"
              onError={(e) => { e.target.style.display = 'none'; }}
            />
            <div>
              <h1 className="text-lg font-bold text-gray-800">인천대학교 RISE 사업단</h1>
              <p className="text-xs text-gray-500">LINC3.0 서비스 포털</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {currentUser?.name}
              <span className="ml-1 text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                {isAdmin ? '관리자' : isProfessor ? '교수' : '학생'}
              </span>
            </span>
            <button
              onClick={handleLogout}
              className="text-sm text-gray-500 hover:text-red-500 transition-colors px-3 py-1.5 rounded-lg hover:bg-red-50"
            >
              로그아웃
            </button>
          </div>
        </div>
      </header>

      {/* 메인 */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-800 mb-2">서비스 선택</h2>
          <p className="text-gray-500">이용하실 서비스를 선택해주세요.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* 학생성공지수 서비스 카드 */}
          <ServiceCard
            icon="🎓"
            title="학생성공지수 관리"
            description={
              isAdmin
                ? "학생 성공지수 데이터 관리, 비교과 프로그램 심사, 핵심교과 승인을 처리합니다."
                : "학생 성공지수 확인, 비교과 프로그램 신청, 핵심교과 이수 내역을 조회합니다."
            }
            badge={isAdmin ? "관리자" : "학생"}
            badgeColor={isAdmin ? "purple" : "blue"}
            available={isAdmin || isStudent}
            unavailableMsg="해당 없음 (학생/관리자 전용)"
            onClick={() => {
              if (isAdmin) navigate('/admin');
              else if (isStudent) navigate('/student');
            }}
            gradient="from-blue-500 to-purple-600"
          />

          {/* 실험실습재료 구매지원 서비스 카드 */}
          <ServiceCard
            icon="🧪"
            title="실험실습재료 구매 지원"
            description={
              isAdmin
                ? "구매 신청 검토·승인, 예산 현황 관리, 구매 실행 기록을 처리합니다."
                : "실험실습 재료 구매를 신청하고 신청 진행 상태를 확인합니다."
            }
            badge={isAdmin ? "관리자" : "신청자"}
            badgeColor={isAdmin ? "orange" : "green"}
            available={true}
            onClick={() => {
              if (isAdmin) navigate('/purchase/admin');
              else navigate('/purchase');
            }}
            gradient="from-green-500 to-teal-600"
          />
        </div>

        {/* 안내 문구 */}
        <div className="mt-10 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm text-center">
          <p className="text-sm text-gray-500">
            서비스 이용 문의: 인천대학교 RISE 사업단 &nbsp;|&nbsp;
            <a href="mailto:rise@inu.ac.kr" className="text-blue-600 hover:underline">rise@inu.ac.kr</a>
          </p>
        </div>
      </main>
    </div>
  );
}

function ServiceCard({ icon, title, description, badge, badgeColor, available, unavailableMsg, onClick, gradient }) {
  const badgeClasses = {
    blue: 'bg-blue-100 text-blue-700',
    purple: 'bg-purple-100 text-purple-700',
    green: 'bg-green-100 text-green-700',
    orange: 'bg-orange-100 text-orange-700',
  };

  return (
    <div
      className={`bg-white rounded-2xl shadow-md overflow-hidden transition-transform duration-200 ${
        available ? 'hover:scale-105 cursor-pointer' : 'opacity-60 cursor-not-allowed'
      }`}
      onClick={available ? onClick : undefined}
    >
      <div className={`bg-gradient-to-r ${gradient} p-6 flex items-center gap-4`}>
        <span className="text-5xl">{icon}</span>
        <div>
          <h3 className="text-xl font-bold text-white">{title}</h3>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${badgeClasses[badgeColor] || 'bg-gray-100 text-gray-700'} bg-white/20 text-white`}>
            {badge}
          </span>
        </div>
      </div>
      <div className="p-6">
        <p className="text-gray-600 text-sm leading-relaxed">
          {available ? description : unavailableMsg}
        </p>
        {available && (
          <div className="mt-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
            <span>바로가기</span>
            <span>→</span>
          </div>
        )}
        {!available && (
          <div className="mt-4 text-sm text-gray-400 flex items-center gap-1">
            <span>🔒</span>
            <span>접근 권한 없음</span>
          </div>
        )}
      </div>
    </div>
  );
}

export default ServicesPage;
