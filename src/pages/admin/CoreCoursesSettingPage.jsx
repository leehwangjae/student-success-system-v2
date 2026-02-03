import React, { useState, useMemo } from 'react';
import { useAppContext } from '../../context/AppContext';
import { FIELD_DEPARTMENTS, COURSE_TYPES } from '../../components/coreCourses/constants';
import { groupCoursesByType } from '../../utils/coreCoursesHelpers';
import CourseModal from '../../components/coreCourses/CourseModal';
import { useModalStore } from '../../hooks/useModal';

function CoreCoursesSettingPage() {
  const {
    coreCourses,
    students,
    addCoreCourse,
    updateCoreCourse,
    deleteCoreCourse
  } = useAppContext();

  const { showConfirm, showAlert } = useModalStore();

  const [selectedField, setSelectedField] = useState('바이오');
  const [selectedDepartment, setSelectedDepartment] = useState('생명과학전공');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState(null);

  // 선택된 학과의 교과목 필터링
  const departmentCourses = useMemo(() => {
    return coreCourses.filter(
      c => c.field === selectedField && c.department === selectedDepartment
    );
  }, [coreCourses, selectedField, selectedDepartment]);

  // 과목 구분별 통계
  const courseStats = useMemo(() => {
    const grouped = groupCoursesByType(departmentCourses);
    return Object.entries(grouped).map(([type, courses]) => ({
      type,
      count: courses.length
    }));
  }, [departmentCourses]);

  // 해당 학과 4학년 학생 수
  const fourthGradeCount = useMemo(() => {
    return students.filter(
      s => s.department === selectedDepartment && s.grade === 4
    ).length;
  }, [students, selectedDepartment]);

  const handleFieldChange = (e) => {
    const newField = e.target.value;
    setSelectedField(newField);
    // 분야 변경 시 첫 번째 학과로 자동 선택
    setSelectedDepartment(FIELD_DEPARTMENTS[newField][0]);
  };

  const handleAddCourse = () => {
    setEditingCourse(null);
    setIsModalOpen(true);
  };

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setIsModalOpen(true);
  };

  const handleSaveCourse = async (courseData) => {
    let result;
    if (editingCourse) {
      result = await updateCoreCourse(editingCourse.id, courseData);
    } else {
      result = await addCoreCourse(courseData);
    }

    if (result.success) {
      showAlert(editingCourse ? '교과목이 수정되었습니다.' : '교과목이 추가되었습니다.');
      setIsModalOpen(false);
    } else {
      showAlert(`오류: ${result.error}`);
    }
  };

  const handleDeleteCourse = (course) => {
    showConfirm(
      `"${course.courseName}" 과목을 삭제하시겠습니까?\n\n⚠️ 해당 과목의 학생 체크 데이터도 함께 삭제됩니다.`,
      async () => {
        const result = await deleteCoreCourse(course.id);
        if (result.success) {
          showAlert('교과목이 삭제되었습니다.');
        } else {
          showAlert(`삭제 실패: ${result.error}`);
        }
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">⚙️ 핵심 교과목 설정</h1>
          
          {/* 학과 선택 */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">분야</label>
              <select
                value={selectedField}
                onChange={handleFieldChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {Object.keys(FIELD_DEPARTMENTS).map(field => (
                  <option key={field} value={field}>{field}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">전공</label>
              <select
                value={selectedDepartment}
                onChange={(e) => setSelectedDepartment(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {FIELD_DEPARTMENTS[selectedField].map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* 통계 */}
          <div className="flex items-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <span className="text-gray-600">설정된 과목 수:</span>
              <span className="font-bold text-blue-600">{departmentCourses.length}개</span>
              <span className="text-gray-500">(최대 {departmentCourses.length * 5}점)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-600">해당 전공 4학년 학생:</span>
              <span className="font-bold text-green-600">{fourthGradeCount}명</span>
            </div>
          </div>
        </div>

        {/* 액션 버튼 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex gap-3">
            <button
              onClick={handleAddCourse}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              과목 추가
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              엑셀 업로드
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg font-medium hover:bg-gray-200">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              템플릿 다운로드
            </button>
          </div>
        </div>

        {/* 교과목 리스트 */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {departmentCourses.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-6xl mb-4">📚</div>
              <p className="text-gray-500 text-lg mb-4">등록된 교과목이 없습니다.</p>
              <button
                onClick={handleAddCourse}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
              >
                첫 번째 과목 추가하기
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      #
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      과목명
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학수번호
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      학점
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      과목 구분
                    </th>
                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      관리
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {departmentCourses.map((course, index) => (
                    <tr key={course.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {index + 1}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{course.courseName}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-600">{course.courseCode}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <div className="text-sm text-gray-900">{course.credits}학점</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          course.courseType === '전공기초' ? 'bg-blue-100 text-blue-800' :
                          course.courseType === '전공심화' ? 'bg-purple-100 text-purple-800' :
                          course.courseType === '전공핵심' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {course.courseType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                        <button
                          onClick={() => handleEditCourse(course)}
                          className="text-blue-600 hover:text-blue-900 mr-3"
                        >
                          수정
                        </button>
                        <button
                          onClick={() => handleDeleteCourse(course)}
                          className="text-red-600 hover:text-red-900"
                        >
                          삭제
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* 과목 구분별 통계 */}
        {departmentCourses.length > 0 && (
          <div className="bg-white rounded-xl shadow-sm p-6 mt-6">
            <h3 className="text-lg font-bold text-gray-900 mb-4">📊 과목 구분별 현황</h3>
            <div className="grid grid-cols-4 gap-4">
              {courseStats.map(stat => (
                <div key={stat.type} className="bg-gray-50 rounded-lg p-4 text-center">
                  <div className="text-sm text-gray-600 mb-1">{stat.type}</div>
                  <div className="text-2xl font-bold text-gray-900">{stat.count}개</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 주의사항 */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mt-6">
          <div className="flex gap-3">
            <div className="text-yellow-600 text-xl">⚠️</div>
            <div className="flex-1">
              <h4 className="font-semibold text-yellow-900 mb-2">주의사항</h4>
              <ul className="text-sm text-yellow-800 space-y-1">
                <li>• 학수번호가 같으면 동일 과목으로 처리됩니다.</li>
                <li>• 과목을 삭제하면 해당 과목의 학생 체크 데이터도 함께 삭제됩니다.</li>
                <li>• 과목당 5점, 최대 10과목(50점)까지 인정됩니다.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* 과목 추가/수정 모달 */}
      <CourseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveCourse}
        course={editingCourse}
        department={selectedDepartment}
        field={selectedField}
      />
    </div>
  );
}

export default CoreCoursesSettingPage;