import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { supabase } from '../../lib/supabase';

function MyInfo() {
  const { currentUser } = useAppContext();
  const [studentScores, setStudentScores] = useState({
    nonCurricularScore: 0,
    coreSubjectScore: 0,
    industryScore: 0,
    total: 0
  });
  const [paymentInfoRegistered, setPaymentInfoRegistered] = useState(false);

  // 학생 점수 및 지급 정보 로드
  useEffect(() => {
    const loadStudentScores = async () => {
      if (!currentUser?.id) return;

      try {
        const { data, error } = await supabase
          .from('users_2025_11_27_07_17')
          .select('non_curricular_score, core_subject_score, industry_score, bank_name, account_number, account_holder')
          .eq('id', currentUser.id)
          .single();

        if (error) {
          console.error('점수 로드 실패:', error);
          return;
        }

        const scores = {
          nonCurricularScore: data?.non_curricular_score || 0,
          coreSubjectScore: data?.core_subject_score || 0,
          industryScore: data?.industry_score || 0,
          total: (data?.non_curricular_score || 0) +
                 (data?.core_subject_score || 0) +
                 (data?.industry_score || 0)
        };

        setStudentScores(scores);

        // 지급 정보가 모두 입력되었는지 확인
        const hasPaymentInfo = data?.bank_name && data?.account_number && data?.account_holder;
        setPaymentInfoRegistered(!!hasPaymentInfo);
      } catch (error) {
        console.error('점수 로드 중 오류:', error);
      }
    };

    loadStudentScores();
  }, [currentUser?.id]);

  if (!currentUser) return <div>로딩 중...</div>;

  return (
    <div>
      <h2 className="text-3xl font-bold mb-6">내 정보</h2>

      <div className="bg-white rounded-xl shadow-md p-8 mb-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <h3 className="text-xl font-bold">기본 정보</h3>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded">v3.3</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">학번</p>
            <p className="font-semibold">{currentUser.studentId}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">이름</p>
            <p className="font-semibold">{currentUser.name}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">학과</p>
            <p className="font-semibold">{currentUser.department}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">분야</p>
            <p className="font-semibold">{currentUser.field}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">이메일</p>
            <p className="font-semibold">{currentUser.email || 'thsgmdals@naver.net'}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600 mb-1">지급정보</p>
            <p className={`font-semibold ${paymentInfoRegistered ? 'text-green-600' : 'text-gray-400'}`}>
              {paymentInfoRegistered ? '✓ 등록' : '미등록'}
            </p>
          </div>
        </div>
      </div>

      {/* 학생성공지수 */}
      <div className="bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg p-8 text-white">
        <h3 className="text-2xl font-bold mb-6">학생성공지수</h3>

        <div className="text-center mb-8">
          <div className="text-6xl font-bold mb-2">{studentScores.total}</div>
          <div className="text-blue-100 text-lg">총점</div>
          <div className="text-blue-200 text-sm mt-2">/ 100점</div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-2">{studentScores.nonCurricularScore}</div>
            <div className="text-sm text-blue-100">취업 비교과 참여</div>
            <div className="text-xs text-blue-200 mt-1">/ 20점</div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-2">{studentScores.coreSubjectScore}</div>
            <div className="text-sm text-blue-100">전략산업 교과목 이수</div>
            <div className="text-xs text-blue-200 mt-1">/ 50점</div>
          </div>

          <div className="bg-white bg-opacity-20 rounded-lg p-6 text-center backdrop-blur-sm">
            <div className="text-3xl font-bold mb-2">{studentScores.industryScore}</div>
            <div className="text-sm text-blue-100">산학협력 프로그램 참여</div>
            <div className="text-xs text-blue-200 mt-1">/ 30점</div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MyInfo;
