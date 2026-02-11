import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { downloadExcel, downloadStudentTemplate } from '../../utils/helpers';
import { getDepartmentField } from '../../utils/constants';
import StudentModal from '../modals/StudentModal';
import StudentDetailModal from '../modals/StudentDetailModal';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
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
      // HTML 요소 생성
      const container = document.createElement('div');
      container.style.position = 'absolute';
      container.style.left = '-9999px';
      container.style.width = '210mm'; // A4 width
      container.style.padding = '20mm';
      container.style.background = 'white';
      container.style.fontFamily = 'Arial, sans-serif';

      container.innerHTML = `
        <div style="font-size: 12px; line-height: 1.6;">
          <!-- 헤더 -->
          <div style="text-align: center; margin-bottom: 20px;">
            <div style="font-size: 10px; color: #666; margin-bottom: 5px;">[별지 제30호 서식] &lt;개정 2019.9.2.&gt;</div>
            <h1 style="font-size: 20px; font-weight: bold; margin: 10px 0;">개인정보 수집 · 이용 및 제3자 제공 동의서</h1>
          </div>

          <!-- 안내 문구 -->
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 12px; margin-bottom: 15px; font-size: 11px;">
            「개인정보보호법」에 따라 인천대학교산학협력단은 연구․사업 수행과 관련하여 귀하의 개인정보를 아래와 같이 수집․이용 및
            제3자 제공을 하고자 합니다. 다음의 사항에 대하여 자세히 읽어보신 후 동의 여부를 체크, 서명하여 주시기 바랍니다.
          </div>

          <!-- 학생 정보 -->
          <div style="margin-bottom: 20px; padding: 15px; background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
            <h3 style="font-size: 14px; font-weight: bold; margin-bottom: 10px;">■ 동의자 정보</h3>
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; font-size: 11px;">
              <div><strong>성명:</strong> ${student.name}</div>
              <div><strong>학번:</strong> ${student.studentId || student.student_id}</div>
              <div><strong>학과:</strong> ${student.department}</div>
              <div><strong>분야:</strong> ${student.field}</div>
              <div><strong>이메일:</strong> ${student.email || '-'}</div>
              <div><strong>전화번호:</strong> ${student.phone || '-'}</div>
            </div>
          </div>

          <!-- 개인정보 수집·이용 동의 -->
          <div style="margin-bottom: 15px;">
            <h3 style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">☑ 개인정보 수집·이용 동의 <span style="color: #dc2626; font-size: 11px;">[필수]</span></h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px;">
              <thead style="background: #f3f4f6;">
                <tr>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">항목</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">수집목적</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">보유기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">성명, 연락처(휴대폰, 전화번호, e-mail주소), 주소, 소속, 학위, 학번, 학력, 경력, 계좌정보</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">인건비, 수당 및 경비 지급<br/>연구과제 관련 홍보</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: bold;">공공기록물관리법에 따른<br/>회계서류의 준함</td>
                </tr>
              </tbody>
            </table>
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 6px; font-size: 9px;">
              ※ 위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.<br/>
              &nbsp;&nbsp;&nbsp;그러나 동의를 거부할 경우 원활한 연구과제 참여에 제한을 받을수 있습니다.
            </div>
          </div>

          <!-- 고유식별정보 수집·이용 -->
          <div style="margin-bottom: 15px;">
            <h3 style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">☑ 고유식별정보 수집·이용 내역 <span style="color: #dc2626; font-size: 11px;">[필수]</span></h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px;">
              <thead style="background: #f3f4f6;">
                <tr>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">항목</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">수집목적</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">보유기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px; font-weight: bold; color: #dc2626;">주민등록번호,<br/>외국인등록번호, 여권번호</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">본인식별절차,<br/>인건비, 수당 및 경비 지급</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: bold;">공공기록물관리법에 따른<br/>회계서류의 준함</td>
                </tr>
              </tbody>
            </table>
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 6px; font-size: 9px;">
              ※ 위의 개인정보 수집·이용에 대한 동의를 거부할 권리가 있습니다.<br/>
              &nbsp;&nbsp;&nbsp;그러나 동의를 거부할 경우 원활한 연구과제 참여에 제한을 받을수 있습니다.
            </div>
          </div>

          <!-- 제3자 제공 동의 -->
          <div style="margin-bottom: 15px;">
            <h3 style="font-size: 13px; font-weight: bold; margin-bottom: 8px;">☑ 개인정보의 제3자 제공 동의 <span style="color: #dc2626; font-size: 11px;">[필수]</span></h3>
            <table style="width: 100%; border-collapse: collapse; font-size: 10px; margin-bottom: 8px;">
              <thead style="background: #f3f4f6;">
                <tr>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">제공받는 자</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">제공항목</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">제공목적</th>
                  <th style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">보유기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style="border: 1px solid #d1d5db; padding: 8px;">중앙행정기관 및 전문기관, 지원기관, 회계정산기관, 금융기관</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px;"><span style="font-weight: bold; color: #dc2626;">주민등록번호, 외국인등록번호, 여권번호</span>, 성명, 연락처(휴대폰, 전화번호, e-mail주소), 주소, 계좌정보, 연구비카드사용내역 등</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center;">연구비의 사용,<br/>연구부정행위 검증 및<br/>조치에 관한 사무</td>
                  <td style="border: 1px solid #d1d5db; padding: 8px; text-align: center; font-weight: bold;">연구개발과제 종료<br/>후 5년</td>
                </tr>
              </tbody>
            </table>
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 6px; font-size: 9px;">
              ※ 위의 개인정보 제공에 대한 동의를 거부할 권리가 있습니다.<br/>
              &nbsp;&nbsp;&nbsp;그러나 동의를 거부할 경우 원활한 연구과제 참여에 제한을 받을수 있습니다.
            </div>
          </div>

          <!-- 동의 문구 -->
          <div style="background: linear-gradient(to right, #eff6ff, #f5f3ff); border: 2px solid #3b82f6; border-radius: 8px; padding: 15px; text-align: center; margin-bottom: 15px;">
            <p style="font-size: 12px; font-weight: bold; margin-bottom: 8px;">
              본인은 본 "개인정보의 수집․이용 및 제3자 제공 동의서" 내용을 읽고 명확히 이해하였으며,<br/>
              이에 동의합니다.
            </p>
            <p style="font-size: 11px; color: #666; margin-top: 10px;">
              동의일: ${student.privacy_consented_at ? new Date(student.privacy_consented_at).toLocaleDateString('ko-KR') : '-'}
            </p>
          </div>

          <!-- 서명 -->
          <div style="margin-bottom: 15px; text-align: center;">
            <p style="font-size: 11px; font-weight: bold; margin-bottom: 10px;">■ 동의자 서명</p>
            <div id="signature-placeholder" style="border: 2px solid #d1d5db; border-radius: 8px; padding: 10px; min-height: 100px; background: #fafafa; display: flex; align-items: center; justify-content: center;">
              ${student.privacy_signature ? '<img id="signature-img" style="max-width: 300px; max-height: 80px;" />' : '<span style="color: #9ca3af;">서명 없음</span>'}
            </div>
          </div>

          <!-- 하단 -->
          <div style="text-align: center; margin-top: 20px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 12px; font-weight: bold; margin-bottom: 5px;">인천대학교 산학협력단장 귀하</p>
            <p style="font-size: 9px; color: #666; margin-top: 10px;">※ 본 동의서는 인천대학교 산학협력단의 공식 서식입니다.</p>
            <p style="font-size: 9px; color: #666;">※ 생성일: ${new Date().toLocaleString('ko-KR')}</p>
          </div>
        </div>
      `;

      document.body.appendChild(container);

      // 서명 이미지 로드
      if (student.privacy_signature) {
        const signatureImg = container.querySelector('#signature-img');
        if (signatureImg) {
          signatureImg.src = student.privacy_signature;
          // 이미지 로드 대기
          await new Promise(resolve => {
            signatureImg.onload = resolve;
            signatureImg.onerror = resolve;
          });
        }
      }

      // HTML을 캔버스로 변환
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      });

      // PDF 생성
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4'
      });

      const imgWidth = 210; // A4 width in mm
      const pageHeight = 297; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      // 첫 페이지 추가
      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      // 내용이 한 페이지를 넘으면 추가 페이지 생성
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      // 파일 저장
      pdf.save(`개인정보동의서_${student.name}_${student.studentId || student.student_id}.pdf`);

      // 임시 요소 제거
      document.body.removeChild(container);
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