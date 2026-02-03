import React, { useState, useEffect } from 'react';
import { COURSE_TYPES, CREDIT_OPTIONS } from './constants';

function CourseModal({ isOpen, onClose, onSave, course, department, field }) {
  const [formData, setFormData] = useState({
    courseName: '',
    courseCode: '',
    credits: 3,
    courseType: '전공기초',
    orderIndex: 0
  });

  useEffect(() => {
    if (course) {
      setFormData({
        courseName: course.courseName,
        courseCode: course.courseCode,
        credits: course.credits,
        courseType: course.courseType,
        orderIndex: course.orderIndex || 0
      });
    } else {
      setFormData({
        courseName: '',
        courseCode: '',
        credits: 3,
        courseType: '전공기초',
        orderIndex: 0
      });
    }
  }, [course, isOpen]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'credits' || name === 'orderIndex' ? parseInt(value) : value
    }));
  };

  const handleSubmit = () => {
    if (!formData.courseName.trim()) {
      alert('과목명을 입력해주세요.');
      return;
    }
    if (!formData.courseCode.trim()) {
      alert('학수번호를 입력해주세요.');
      return;
    }
    
    onSave({
      ...formData,
      field,
      department
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-gray-900">
            {course ? '✏️ 교과목 수정' : '➕ 교과목 추가'}
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              과목명 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="courseName"
              value={formData.courseName}
              onChange={handleChange}
              placeholder="예: 세포생물학"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              학수번호 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="courseCode"
              value={formData.courseCode}
              onChange={handleChange}
              placeholder="예: BIO201"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">⚠️ 중복 체크에 사용됩니다</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                학점
              </label>
              <select
                name="credits"
                value={formData.credits}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {CREDIT_OPTIONS.map(credit => (
                  <option key={credit} value={credit}>{credit}학점</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                과목 구분
              </label>
              <select
                name="courseType"
                value={formData.courseType}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {COURSE_TYPES.map(type => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              정렬 순서 (선택)
            </label>
            <input
              type="number"
              name="orderIndex"
              value={formData.orderIndex}
              onChange={handleChange}
              min="0"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">숫자가 작을수록 먼저 표시됩니다</p>
          </div>

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-800">
              ℹ️ 과목당 5점, 최대 10과목(50점)까지 인정됩니다.
            </p>
          </div>
        </div>

        <div className="flex gap-3 mt-6">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
          >
            {course ? '수정하기' : '추가하기'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CourseModal;