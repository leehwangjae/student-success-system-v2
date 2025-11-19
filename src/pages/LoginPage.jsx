import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../lib/supabase';

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
      console.log('🔑 로그인 시도:', formData.username);

      // Supabase에서 사용자 조회
      const { data: users, error: fetchError } = await supabase
        .from('users')
        .select('*')
        .eq('username', formData.username)
        .eq('password', formData.password);

      if (fetchError) {
        console.error('❌ 조회 실패:', fetchError);
        throw fetchError;
      }

      console.log('📊 조회 결과:', users);

      if (!users || users.length === 0) {
        setError('아이디 또는 비밀번호가 일치하지 않습니다.');
        return;
      }

      const user = users[0];

      // 승인되지 않은 사용자 체크
      if (user.status !== 'approved') {
        setError('승인 대기중인 계정입니다. 관리자의 승인을 기다려주세요.');
        return;
      }

      console.log('✅ 로그인 성공:', user);

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

      console.log('👤 현재 사용자 설정 완료:', userData);
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
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">학생성공지수 관리 시스템</h1>
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