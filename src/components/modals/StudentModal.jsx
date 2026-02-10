import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useModalStore } from '../../hooks/useModal';
import { FIELD_DEPARTMENTS } from '../coreCourses/constants';

function StudentModal({ isOpen, onClose, student }) {
  const { addOrUpdateStudent } = useAppContext();
  const { showAlert } = useModalStore();
  const isEditMode = !!student;

  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    department: FIELD_DEPARTMENTS['바이오'][0],
    field: '바이오',
    email: '',
    phone: '',
    password: '',
    memo: ''
  });

  useEffect(() => {
    if (student) {
      setFormData({
        studentId: student.studentId || '',
        name: student.name || '',
        department: student.department || '',
        field: student.field || '바이오',
        email: student.email || '',
        phone: student.phone || '',
        password: student.password || '',
        memo: student.memo || ''
      });
    } else {
      setFormData({
        studentId: '',
        name: '',
        department: FIELD_DEPARTMENTS['바이오'][0],
        field: '바이오',
        email: '',
        phone: '',
        password: '',
        memo: ''
      });
    }
  }, [student, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFieldChange = (e) => {
    const newField = e.target.value;
    const departments = FIELD_DEPARTMENTS[newField] || [];
    setFormData(prev => ({
      ...prev,
      field: newField,
      department: departments.length > 0 ? departments[0] : ''
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.studentId || !formData.name || !formData.department) {
      showAlert('필수 항목을 모두 입력해주세요.');
      return;
    }

    const studentData = {
      ...formData,
      nonCurricularScore: student ? student.nonCurricularScore : 0,
      coreSubjectScore: student ? student.coreSubjectScore : 0,
      industryScore: student ? student.industryScore : 0,
      total: student ? student.total : 0,
      nonCurricularHistory: student ? student.nonCurricularHistory : [],
      coreSubjectHistory: student ? student.coreSubjectHistory : [],
      industryHistory: student ? student.industryHistory : []
    };

    addOrUpdateStudent(studentData, student);
    showAlert(isEditMode ? '학생 정보가 수정되었습니다.' : '학생이 추가되었습니다.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isEditMode ? '📝 학생 정보 수정' : '✨ 학생 추가'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                학번 *
              </label>
              <input
                type="text"
                name="studentId"
                value={formData.studentId}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="202411001"
                required
                disabled={isEditMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이름 *
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="홍길동"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                분야 *
              </label>
              <select
                name="field"
                value={formData.field}
                onChange={handleFieldChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="바이오">바이오</option>
                <option value="반도체">반도체</option>
                <option value="물류">물류</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전공 *
              </label>
              <select
                name="department"
                value={formData.department}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                required
              >
                {(FIELD_DEPARTMENTS[formData.field] || []).map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                이메일
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="student@example.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                전화번호
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                placeholder="010-1234-5678"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              비밀번호 {!isEditMode && '*'}
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder={isEditMode ? "변경하지 않으려면 비워두세요" : "비밀번호를 입력하세요"}
              required={!isEditMode}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              메모
            </label>
            <textarea
              name="memo"
              value={formData.memo}
              onChange={handleChange}
              rows="4"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="추가 메모사항"
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              {isEditMode ? '수정하기' : '추가하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default StudentModal;