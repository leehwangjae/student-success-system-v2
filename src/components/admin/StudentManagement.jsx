import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { downloadExcel, downloadStudentTemplate } from '../../utils/helpers';
import { getDepartmentField } from '../../utils/constants';
import StudentModal from '../modals/StudentModal';
import StudentDetailModal from '../modals/StudentDetailModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

function StudentManagement() {
  const { students, setStudents, deleteStudent } = useAppContext();
  const [filter, setFilter] = useState('전체');
  const [showStudentModal, setShowStudentModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showStudentDetail, setShowStudentDetail] = useState(null);
  const [showExcelUploadModal, setShowExcelUploadModal] = useState(false);
  const [excelPreviewData, setExcelPreviewData] = useState([]);
  const [selectedStudents, setSelectedStudents] = useState([]);

  const getFilteredStudents = () => {
    if (filter === '전체') return students;
    if (filter === '기타') return students.filter(s => s.field === '기타' || !['바이오', '반도체', '물류', '바이오 분야', '반도체 분야', '물류 분야'].includes(s.field));

    // 필터 값 정규화 ('바이오 분야' -> '바이오')
    const normalizedFilter = filter.replace(' 분야', '');
    return students.filter(s => {
      const normalizedField = (s.field || '').replace(' 분야', '');
      return normalizedField === normalizedFilter;
    });
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target.result;
        const rows = text.split('\n').filter(row => row.trim());
        
        if (rows.length < 2) {
          alert('데이터가 없습니다.');
          return;
        }

        const headers = rows[0].split(',').map(h => h.trim());
        const requiredHeaders = ['학번', '이름', '학과', '이메일', '전화번호'];
        const hasRequiredHeaders = requiredHeaders.every(h => headers.includes(h));
        
        if (!hasRequiredHeaders) {
          alert('필수 컬럼이 누락되었습니다: 학번, 이름, 학과, 이메일, 전화번호');
          return;
        }

        const studentsData = [];
        for (let i = 1; i < rows.length; i++) {
          const values = rows[i].split(',').map(v => v.trim());
          if (values.length < requiredHeaders.length) continue;

          const studentIdIdx = headers.indexOf('학번');
          const nameIdx = headers.indexOf('이름');
          const deptIdx = headers.indexOf('학과');
          const emailIdx = headers.indexOf('이메일');
          const phoneIdx = headers.indexOf('전화번호');
          const memoIdx = headers.indexOf('비고');

          const studentId = values[studentIdIdx];
          if (students.some(s => s.studentId === studentId)) continue;

          const department = values[deptIdx];
          studentsData.push({
            studentId,
            name: values[nameIdx],
            department,
            field: getDepartmentField(department),
            email: values[emailIdx],
            phone: values[phoneIdx],
            memo: memoIdx >= 0 ? values[memoIdx] : ''
          });
        }

        if (studentsData.length === 0) {
          alert('추가할 새로운 학생이 없습니다.');
          return;
        }

        setExcelPreviewData(studentsData);
        setShowExcelUploadModal(true);
      } catch (error) {
        alert('파일 읽기 오류: ' + error.message);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmExcelUpload = () => {
    const newStudents = excelPreviewData.map((data, index) => ({
      id: students.length + index + 1,
      ...data,
      nonCurricularScore: 0,
      coreSubjectScore: 0,
      industryScore: 0,
      total: 0,
      nonCurricularHistory: [],
      coreSubjectHistory: [],
      industryHistory: []
    }));

    setStudents([...students, ...newStudents]);
    alert(`${newStudents.length}명의 학생이 추가되었습니다!`);
    setShowExcelUploadModal(false);
    setExcelPreviewData([]);
  };

  // 체크박스 전체 선택/해제
  const handleSelectAll = (e) => {
    if (e.target.checked) {
      const allStudentIds = getFilteredStudents()
        .filter(s => s.privacy_consented) // 동의한 학생만
        .map(s => s.id);
      setSelectedStudents(allStudentIds);
    } else {
      setSelectedStudents([]);
    }
  };

  // 개별 체크박스 선택/해제
  const handleSelectStudent = (studentId) => {
    setSelectedStudents(prev =>
      prev.includes(studentId)
        ? prev.filter(id => id !== studentId)
        : [...prev, studentId]
    );
  };

  // PDF 다운로드 함수
  const downloadPrivacyConsentPDF = async (student) => {
    try {
      const doc = new jsPDF();

      // 한글 폰트 설정 (기본 폰트 사용)
      doc.setFont('helvetica');

      // 제목
      doc.setFontSize(18);
      doc.text('Privacy Consent Agreement', 105, 20, { align: 'center' });
      doc.text('(Gaeingjeongbo Sujib Mit Iyong Donguiseo)', 105, 28, { align: 'center' });

      // 학생 정보
      doc.setFontSize(12);
      doc.text('Student Information', 20, 45);
      doc.setFontSize(10);
      doc.text(`Name: ${student.name}`, 20, 55);
      doc.text(`Student ID: ${student.studentId || student.student_id}`, 20, 62);
      doc.text(`Department: ${student.department}`, 20, 69);
      doc.text(`Field: ${student.field}`, 20, 76);
      doc.text(`Email: ${student.email || 'N/A'}`, 20, 83);
      doc.text(`Phone: ${student.phone || 'N/A'}`, 20, 90);

      // 동의 정보
      doc.setFontSize(12);
      doc.text('Consent Information', 20, 105);
      doc.setFontSize(10);
      doc.text(`Consent Status: ${student.privacy_consented ? 'Agreed' : 'Not Agreed'}`, 20, 115);
      doc.text(`Consent Date: ${student.privacy_consented_at ? new Date(student.privacy_consented_at).toLocaleString('ko-KR') : 'N/A'}`, 20, 122);

      // 서명 이미지 추가
      if (student.privacy_signature) {
        doc.setFontSize(12);
        doc.text('Signature', 20, 137);
        try {
          doc.addImage(student.privacy_signature, 'PNG', 20, 145, 80, 30);
        } catch (error) {
          console.error('서명 이미지 추가 실패:', error);
          doc.setFontSize(10);
          doc.text('(Signature image not available)', 20, 155);
        }
      }

      // 동의 내용 요약
      doc.setFontSize(12);
      doc.text('Consent Summary', 20, 190);
      doc.setFontSize(9);
      const consentItems = [
        '- Personal information collection and use',
        '- Collection and use of unique identification information (SSN)',
        '- Provision of personal information to third parties'
      ];

      let yPos = 200;
      consentItems.forEach(item => {
        doc.text(item, 20, yPos);
        yPos += 7;
      });

      // 하단 정보
      doc.setFontSize(8);
      doc.text(`Generated on: ${new Date().toLocaleString('ko-KR')}`, 20, 280);
      doc.text('INU RISE Student Success Index Management System', 105, 285, { align: 'center' });

      // 파일 저장
      doc.save(`privacy_consent_${student.studentId || student.student_id}_${student.name}.pdf`);
    } catch (error) {
      console.error('PDF 생성 오류:', error);
      alert('PDF 생성 중 오류가 발생했습니다.');
    }
  };

  // 선택된 학생들의 개인정보 동의서 일괄 다운로드
  const downloadSelectedConsentPDFs = async () => {
    if (selectedStudents.length === 0) {
      alert('다운로드할 학생을 선택해주세요.');
      return;
    }

    const studentsToDownload = students.filter(s => selectedStudents.includes(s.id));

    for (const student of studentsToDownload) {
      await downloadPrivacyConsentPDF(student);
      // 각 PDF 생성 사이에 약간의 딜레이 추가
      await new Promise(resolve => setTimeout(resolve, 300));
    }

    alert(`${studentsToDownload.length}명의 개인정보 동의서가 다운로드되었습니다.`);
    setSelectedStudents([]);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-4">
          <h2 className="text-3xl font-bold">학생 관리</h2>
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="전체">전체</option>
            <option value="바이오">바이오</option>
            <option value="반도체">반도체</option>
            <option value="물류">물류</option>
            <option value="기타">기타</option>
          </select>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={downloadSelectedConsentPDFs}
            disabled={selectedStudents.length === 0}
            className={`px-4 py-2 rounded-lg ${
              selectedStudents.length > 0
                ? 'bg-purple-600 text-white hover:bg-purple-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            📄 동의서 PDF ({selectedStudents.length})
          </button>
          <button
            onClick={() => downloadExcel(getFilteredStudents(), filter)}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            📥 엑셀 다운로드
          </button>
          <button
            onClick={downloadStudentTemplate}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            📄 양식 다운로드
          </button>
          <label className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 cursor-pointer">
            <span>📤 엑셀 일괄 등록</span>
            <input
              type="file"
              accept=".csv"
              onChange={handleExcelUpload}
              className="hidden"
            />
          </label>
          <button
            onClick={() => {
              setEditingStudent(null);
              setShowStudentModal(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            + 학생 추가
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-4 text-center text-sm font-semibold text-gray-700">
                  <input
                    type="checkbox"
                    onChange={handleSelectAll}
                    checked={selectedStudents.length > 0 && selectedStudents.length === getFilteredStudents().filter(s => s.privacy_consented).length}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">분야</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">학과</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">학번</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">이름</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">이메일</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">전화번호</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">총점</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">개인정보동의</th>
                <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">지급정보</th>
                <th className="px-6 py-4 text-center text-sm font-semibold text-gray-700">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {getFilteredStudents().map(student => (
                <tr key={student.id} className="hover:bg-gray-50">
                  <td className="px-3 py-4 text-center">
                    <input
                      type="checkbox"
                      checked={selectedStudents.includes(student.id)}
                      onChange={() => handleSelectStudent(student.id)}
                      disabled={!student.privacy_consented}
                      className="w-4 h-4 text-blue-600 rounded disabled:opacity-30"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                      {student.field}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-gray-600">{student.department}</td>
                  <td className="px-6 py-4">{student.studentId || student.student_id}</td>
                  <td className="px-6 py-4 font-medium">{student.name}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{student.email || '-'}</td>
                  <td className="px-6 py-4 text-gray-600 text-sm">{student.phone || '-'}</td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-blue-600">{student.total}</span>
                  </td>
                  <td className="px-6 py-4">
                    {student.privacy_consented ? (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-block w-fit">
                          ✓ 동의완료
                        </span>
                        <button
                          onClick={() => downloadPrivacyConsentPDF(student)}
                          className="text-xs text-blue-600 hover:text-blue-800 underline w-fit"
                        >
                          PDF 다운로드
                        </button>
                        {student.privacy_consented_at && (
                          <span className="text-xs text-gray-500">
                            {new Date(student.privacy_consented_at).toLocaleDateString('ko-KR')}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">미동의</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center">
                    {student.ssn && student.bankName && student.accountNumber ? (
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">✓ 등록완료</span>
                    ) : (
                      <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">미등록</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center space-x-2">
                      <button
                        onClick={() => setShowStudentDetail(student)}
                        className="px-3 py-1 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 text-sm"
                      >
                        상세
                      </button>
                      <button
                        onClick={() => {
                          setEditingStudent(student);
                          setShowStudentModal(true);
                        }}
                        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                      >
                        수정
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`${student.name} 학생을 삭제하시겠습니까?`)) {
                            deleteStudent(student.id);
                          }
                        }}
                        className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                      >
                        삭제
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* 모달들 */}
      {showStudentModal && (
        <StudentModal
          isOpen={true}
          student={editingStudent}
          onClose={() => {
            setShowStudentModal(false);
            setEditingStudent(null);
          }}
        />
      )}

      {showStudentDetail && (
        <StudentDetailModal
          isOpen={true}
          student={showStudentDetail}
          onClose={() => setShowStudentDetail(null)}
        />
      )}

      {/* 엑셀 업로드 미리보기 모달 */}
      {showExcelUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-6xl w-full mx-4 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">엑셀 데이터 미리보기</h2>
            <p className="text-gray-600 mb-6">
              총 <span className="font-bold text-blue-600">{excelPreviewData.length}명</span>의 학생이 추가됩니다.
            </p>
            <div className="overflow-x-auto mb-6">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">학번</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">이름</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">학과</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">분야</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">이메일</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">전화번호</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">비고</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {excelPreviewData.map((student, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-4 py-3">{student.studentId}</td>
                      <td className="px-4 py-3 font-medium">{student.name}</td>
                      <td className="px-4 py-3">{student.department}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                          {student.field}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">{student.email}</td>
                      <td className="px-4 py-3 text-gray-600">{student.phone}</td>
                      <td className="px-4 py-3 text-gray-600">{student.memo || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex space-x-4">
              <button 
                onClick={confirmExcelUpload}
                className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                확인 - {excelPreviewData.length}명 추가
              </button>
              <button 
                onClick={() => {
                  setShowExcelUploadModal(false);
                  setExcelPreviewData([]);
                }}
                className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-semibold"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default StudentManagement;