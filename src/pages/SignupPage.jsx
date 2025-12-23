import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function SignupPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('student');
  const [errorMessage, setErrorMessage] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    studentId: '',
    department: '',
    field: '바이오',
    email: '',
    phone: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrorMessage('');
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setErrorMessage('아이디를 입력해주세요.');
      return false;
    }

    if (!formData.name.trim()) {
      setErrorMessage('이름을 입력해주세요.');
      return false;
    }

    if (!formData.password) {
      setErrorMessage('비밀번호를 입력해주세요.');
      return false;
    }

    if (formData.password.length < 6) {
      setErrorMessage('비밀번호는 6자 이상이어야 합니다.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다. 다시 시도해주세요.');
      return false;
    }

    if (activeTab === 'student') {
      if (!formData.studentId.trim()) {
        setErrorMessage('학번을 입력해주세요.');
        return false;
      }

      if (!formData.department.trim()) {
        setErrorMessage('학과를 입력해주세요.');
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      console.log('=== 회원가입 시작 ===');
      console.log('계정 유형:', activeTab);

      // 1. 중복 아이디 체크
      const { data: existingUser, error: checkError } = await supabase
        .from('users')
        .select('username')
        .eq('username', formData.username)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') {
        console.error('중복 체크 오류:', checkError);
        throw new Error('아이디 중복 확인 중 오류가 발생했습니다.');
      }

      if (existingUser) {
        setErrorMessage('이미 사용 중인 아이디입니다.');
        return;
      }

      // 🔥 2. role 매핑 (중요!)
      let roleValue;
      if (activeTab === 'student') {
        roleValue = 'student';
      } else {
        // admin이나 staff는 모두 'admin' role로 저장
        roleValue = 'admin';
      }

      // 3. 회원가입 데이터 준비
      const userData = {
        username: formData.username.trim(),
        password: formData.password,
        name: formData.name.trim(),
        account_type: activeTab,
        role: roleValue,  // 🔥 매핑된 role 사용
        status: 'pending',
        email: formData.email.trim() || null,
        phone: formData.phone.trim() || null
      };

      // 학생인 경우 추가 필드
      if (activeTab === 'student') {
        userData.student_id = formData.studentId.trim();
        userData.department = formData.department.trim();
        userData.field = formData.field;
        userData.non_curricular_score = 0;
        userData.core_subject_score = 0;
        userData.industry_score = 0;
        userData.non_curricular_history = [];
        userData.core_subject_history = [];
        userData.industry_history = [];
      }

      console.log('전송할 데이터:', userData);

      // 4. Supabase에 저장
      const { data, error } = await supabase
        .from('users')
        .insert([userData])
        .select();

      if (error) {
        console.error('회원가입 실패:', error);
        
        if (error.code === '23505') {
          setErrorMessage('이미 사용 중인 아이디입니다.');
        } else if (error.message.includes('null value')) {
          setErrorMessage('필수 항목을 모두 입력해주세요.');
        } else if (error.message.includes('check constraint')) {
          setErrorMessage('데이터 형식이 올바르지 않습니다. 관리자에게 문의하세요.');
        } else {
          setErrorMessage(`회원가입 중 오류가 발생했습니다: ${error.message}`);
        }
        return;
      }

      console.log('✅ 회원가입 성공:', data);

      // 5. 성공 메시지 및 페이지 이동
      alert('회원가입이 완료되었습니다!\n관리자 승인 후 로그인 가능합니다.');
      navigate('/login');

    } catch (error) {
      console.error('회원가입 오류:', error);
      setErrorMessage(error.message || '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8">
        {/* 로고 영역 */}
        <div className="text-center mb-6">
          <div className="flex justify-center mb-4">
            <img 
              src="/image/INU_RISE_logo.png" 
              alt="RISE 사업단 로고" 
              className="h-20 w-auto object-contain"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
            <div 
              className="h-20 w-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl items-center justify-center hidden"
              style={{ display: 'none' }}
            >
              <span className="text-3xl text-white font-bold">RISE</span>
            </div>
          </div>
          
          <h1 className="text-3xl font-bold text-gray-800 mb-2">회원가입</h1>
          <p className="text-gray-600">학생성공지수 관리 시스템</p>
        </div>

        {/* 탭 선택 */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('student')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'student'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            학생
          </button>
          <button
            onClick={() => setActiveTab('admin')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'admin'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            교수
          </button>
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-all ${
              activeTab === 'staff'
                ? 'bg-blue-600 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            직원
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* 아이디 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              아이디 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="아이디를 입력하세요"
              required
            />
          </div>

          {/* 이름 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="이름을 입력하세요"
              required
            />
          </div>

          {/* 학생 전용 필드 */}
          {activeTab === 'student' && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학번 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="studentId"
                  value={formData.studentId}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="학번을 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  학과 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="department"
                  value={formData.department}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="학과를 입력하세요"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  분야 <span className="text-red-500">*</span>
                </label>
                <select
                  name="field"
                  value={formData.field}
                  onChange={handleChange}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="바이오">바이오</option>
                  <option value="반도체">반도체</option>
                  <option value="물류">물류</option>
                </select>
              </div>
            </>
          )}

          {/* 전화번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">전화번호</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="010-0000-0000"
            />
          </div>

          {/* 이메일 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">이메일</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="example@email.com"
            />
          </div>

          {/* 비밀번호 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호 (6자 이상)"
              required
            />
          </div>

          {/* 비밀번호 확인 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 확인 <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="비밀번호를 다시 입력하세요"
              required
            />
          </div>

          {/* 에러 메시지 */}
          {errorMessage && (
            <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">
              {errorMessage}
            </div>
          )}

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleCancel}
              className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg"
            >
              회원가입
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default SignupPage;