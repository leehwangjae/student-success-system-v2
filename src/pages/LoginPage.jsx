import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

function LoginPage() {
  const navigate = useNavigate();
  const { setCurrentUser } = useAppContext();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.username || !formData.password) {
      setError('아이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    try {
      console.log('🔑 로그인 시도');

      // 1. Supabase에서 사용자 조회 (username만으로)
      const { data: users, error: fetchError } = await supabase
        .from('users_2025_11_27_07_17')
        .select('*')
        .eq('username', formData.username);

      if (fetchError) {
        console.error('❌ 조회 실패:', fetchError);
        throw fetchError;
      }

      console.log('📊 조회 결과 수:', users?.length || 0);

      if (!users || users.length === 0) {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        return;
      }

      const user = users[0];

      // 2. 비밀번호 검증 (해시 비교 또는 평문 비교)
      console.log('🔐 비밀번호 검증 중...');
      let isPasswordValid = false;
      let needsMigration = false;

      // 2-1. bcrypt 해시 형식인지 확인 (bcrypt 해시는 $2a$, $2b$, $2y$로 시작)
      const isBcryptHash = user.password && user.password.startsWith('$2');

      if (isBcryptHash) {
        // 2-2. 해시된 비밀번호 비교
        console.log('🔐 해시 비밀번호 검증 중...');
        isPasswordValid = await bcrypt.compare(formData.password, user.password);
      } else {
        // 2-3. 평문 비밀번호 비교 (기존 사용자)
        console.log('🔄 평문 비밀번호 검증 중 (기존 사용자)...');
        if (user.password === formData.password) {
          isPasswordValid = true;
          needsMigration = true;
          console.log('✅ 평문 비밀번호 일치 (마이그레이션 예정)');
        }
      }

      if (!isPasswordValid) {
        console.log('❌ 비밀번호 불일치');
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        return;
      }

      console.log('✅ 비밀번호 검증 완료');

      // 2-3. 평문 비밀번호 사용자의 경우 자동으로 해시로 마이그레이션
      if (needsMigration) {
        console.log('🔄 비밀번호 마이그레이션 시작...');
        try {
          const hashedPassword = await bcrypt.hash(formData.password, 10);
          const { error: updateError } = await supabase
            .from('users_2025_11_27_07_17')
            .update({ password: hashedPassword })
            .eq('id', user.id);

          if (updateError) {
            console.error('⚠️ 비밀번호 마이그레이션 실패:', updateError);
            // 마이그레이션 실패해도 로그인은 계속 진행
          } else {
            console.log('✅ 비밀번호 마이그레이션 완료 (다음 로그인부터 해시 사용)');
          }
        } catch (migrationError) {
          console.error('⚠️ 비밀번호 마이그레이션 오류:', migrationError);
          // 마이그레이션 실패해도 로그인은 계속 진행
        }
      }

      // 3. 승인되지 않은 사용자 체크
      if (user.status !== 'approved') {
        setError('승인 대기중인 계정입니다. 관리자의 승인을 기다려주세요.');
        return;
      }

      console.log('✅ 로그인 성공');

      // 사용자 정보 설정
      const userData = {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role || user.account_type,
        studentId: user.student_id || user.username,
        department: user.department,
        field: user.field
      };

      setCurrentUser(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));

      console.log('👤 현재 사용자 설정 완료');
      console.log('🎯 페이지 전환 시작...');

      // 역할에 따라 페이지 이동
      if (user.role === 'admin' || user.role === 'master' || user.account_type === 'admin') {
        console.log('➡️ 관리자 페이지로 이동');
        navigate('/admin');
      } else {
        console.log('➡️ 학생 페이지로 이동');
        navigate('/student');
      }

    } catch (error) {
      console.error('❌ 로그인 실패:', error);
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl p-8 w-full max-w-md">
        {/* 로고 영역 */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img 
              src="/image/INU_RISE_logo.png"
              alt="인천대학교 RISE 사업단 로고" 
              className="h-24 w-auto object-contain"
              onError={(e) => {
                // 로고 로드 실패 시 기본 아이콘 표시
                console.log('로고 로드 실패, 기본 아이콘 표시');
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            {/* 로고 로드 실패 시 대체 아이콘 */}
            <div 
              className="h-24 w-24 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center hidden"
              style={{ display: 'none' }}
            >
              <span className="text-4xl text-white font-bold">RISE</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            학생성공지수 관리 시스템
          </h1>
          <p className="text-gray-600">로그인하여 시작하세요</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">아이디</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="아이디를 입력하세요"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">비밀번호</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호를 입력하세요"
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-200 transform hover:scale-105"
          >
            로그인
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-blue-600 hover:text-blue-800 font-semibold">
              회원가입
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;