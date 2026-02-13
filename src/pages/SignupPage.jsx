import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { FIELD_DEPARTMENTS } from '../components/coreCourses/constants';
import PrivacyConsentModal from '../components/privacy/PrivacyConsentModal';
import bcrypt from 'bcryptjs';

function SignupPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('student');
  const [errorMessage, setErrorMessage] = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [privacyConsented, setPrivacyConsented] = useState(false);
  const [signatureImage, setSignatureImage] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    name: '',
    studentId: '',
    department: FIELD_DEPARTMENTS['바이오'][0], // 기본값: 생명과학전공
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

    // 비밀번호 길이 검증 (8자 이상)
    if (formData.password.length < 8) {
      setErrorMessage('비밀번호는 8자 이상이어야 합니다.');
      return false;
    }

    // 비밀번호 복잡도 검증
    const hasLetter = /[a-zA-Z]/.test(formData.password);
    const hasNumber = /[0-9]/.test(formData.password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>_-]/.test(formData.password);

    if (!hasLetter) {
      setErrorMessage('비밀번호에 영문자를 포함해야 합니다.');
      return false;
    }

    if (!hasNumber) {
      setErrorMessage('비밀번호에 숫자를 포함해야 합니다.');
      return false;
    }

    if (!hasSpecialChar) {
      setErrorMessage('비밀번호에 특수문자(!@#$%^&*_- 등)를 포함해야 합니다.');
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage('비밀번호가 일치하지 않습니다. 다시 시도해주세요.');
      return false;
    }

    // 이메일 검증
    if (!formData.email.trim()) {
      setErrorMessage('이메일을 입력해주세요.');
      return false;
    }

    // 이메일 형식 검증
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage('올바른 이메일 형식을 입력해주세요.');
      return false;
    }

    // 전화번호 검증
    if (!formData.phone.trim()) {
      setErrorMessage('전화번호를 입력해주세요.');
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

    // 개인정보 동의 확인 (학생만)
    if (activeTab === 'student' && !privacyConsented) {
      setShowPrivacyModal(true);
      return;
    }

    // 실제 회원가입 처리
    await processSignup();
  };

  const processSignup = async (signature = null) => {
    try {
      console.log('=== 회원가입 시작 ===');
      console.log('계정 유형:', activeTab);
      console.log('서명 데이터:', signature ? '있음 (' + signature.length + ' bytes)' : '없음');

      // 1. 중복 아이디 체크
      const { data: existingUser, error: checkError } = await supabase
        .from('users_2025_11_27_07_17')
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

      // 3. 비밀번호 해싱 (bcrypt, salt rounds: 10)
      console.log('🔐 비밀번호 해싱 중...');
      const hashedPassword = await bcrypt.hash(formData.password, 10);
      console.log('✅ 비밀번호 해싱 완료');

      // 4. 회원가입 데이터 준비
      const userData = {
        username: formData.username.trim(),
        password: hashedPassword,  // 🔐 해싱된 비밀번호 저장
        name: formData.name.trim(),
        account_type: activeTab,
        role: roleValue,  // 🔥 매핑된 role 사용
        status: 'approved',  // 즉시 승인 (관리자 승인 불필요)
        email: formData.email.trim(),  // 필수 항목
        phone: formData.phone.trim()   // 필수 항목
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
        userData.privacy_consented = true; // 개인정보 동의 여부
        userData.privacy_consented_at = new Date().toISOString(); // 동의 시각
        userData.privacy_signature = signature || signatureImage; // 서명 이미지 (Base64) - 파라미터 우선 사용
      }

      console.log('회원가입 데이터 전송 중...');

      // 5. Supabase에 저장
      const { data, error } = await supabase
        .from('users_2025_11_27_07_17')
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

      // 6. 성공 메시지 및 페이지 이동
      alert('회원가입이 완료되었습니다!\n바로 로그인하실 수 있습니다.');
      navigate('/login');

    } catch (error) {
      console.error('회원가입 오류:', error);
      setErrorMessage(error.message || '회원가입 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleCancel = () => {
    navigate('/login');
  };

  const handlePrivacyAgree = async (signature) => {
    setPrivacyConsented(true);
    setSignatureImage(signature);
    setShowPrivacyModal(false);
    // 동의 후 자동으로 회원가입 진행 (서명 데이터 직접 전달)
    await processSignup(signature);
  };

  return (
    <>
      {/* 개인정보 동의 모달 */}
      <PrivacyConsentModal
        isOpen={showPrivacyModal}
        onClose={() => setShowPrivacyModal(false)}
        onAgree={handlePrivacyAgree}
      />

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
                    분야 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="field"
                    value={formData.field}
                    onChange={(e) => {
                      handleChange(e);
                      // 분야가 변경되면 학과를 해당 분야의 첫 번째 학과로 자동 설정
                      const newField = e.target.value;
                      const departments = FIELD_DEPARTMENTS[newField] || [];
                      if (departments.length > 0) {
                        setFormData(prev => ({
                          ...prev,
                          field: newField,
                          department: departments[0]
                        }));
                      }
                    }}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="바이오">바이오</option>
                    <option value="반도체">반도체</option>
                    <option value="물류">물류</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    전공 <span className="text-red-500">*</span>
                  </label>
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    {!formData.department && <option value="">전공을 선택하세요</option>}
                    {(FIELD_DEPARTMENTS[formData.field] || []).map(dept => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </>
            )}

            {/* 이메일 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일 <span className="text-red-500">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="example@email.com"
                required
              />
            </div>

            {/* 전화번호 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호 <span className="text-red-500">*</span>
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="010-0000-0000"
                required
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
                placeholder="영문, 숫자, 특수문자 포함 8자 이상"
                required
              />
              <p className="mt-1 text-xs text-gray-500">
                최소 8자 이상 / 영문자와 숫자, 특수문자(!@#$%^&*_- 등) 포함
              </p>
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

          {/* 개인정보 동의 안내 (학생만) */}
          {activeTab === 'student' && (
            <div className="mt-4 text-xs text-gray-500 text-center bg-blue-50 p-3 rounded-lg">
              <p className="mb-1">📋 회원가입 시 개인정보 수집·이용 동의가 필요합니다</p>
              <button
                type="button"
                onClick={() => setShowPrivacyModal(true)}
                className="text-blue-600 underline hover:text-blue-700"
              >
                개인정보 처리방침 미리보기
              </button>
            </div>
          )}

          {/* Footer - 개인정보 처리방침 */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <button
              type="button"
              onClick={() => navigate('/privacy-policy')}
              className="text-xs text-gray-500 hover:text-gray-700 underline"
            >
              개인정보 처리방침
            </button>
            <p className="text-xs text-gray-400 mt-2">
              © 2024 인천대학교 RISE 사업단
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default SignupPage;