// CSV 셀 값 이스케이프 (쉼표·따옴표 포함 시 따옴표로 감쌈)
const escapeCsvCell = (value) => {
  const str = value == null ? '' : String(value);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return '"' + str.replace(/"/g, '""') + '"';
  }
  return str;
};

// 숫자처럼 보이는 문자열(전화번호·계좌번호·학번 등)을 텍스트로 강제 처리
const asText = (value) => {
  if (value == null || value === '') return '';
  return `="${String(value)}"`;
};

// 엑셀 다운로드 함수
export const downloadExcel = (students, filterName, nonCurricularSubmissions = []) => {
  const header = ['학번', '이름', '학과', '분야', '이메일', '전화번호', '재학년도', '취업역량 비교과', '산학협력 비교과', '핵심교과', '총점', '개인정보동의', '동의일자', '주민등록번호', '은행명', '계좌번호', '예금주', '비고'];
  const rows = students.map(s => {
    const sub = nonCurricularSubmissions.find(sub => sub.studentId === s.id);
    const programs = sub?.completedPrograms || [];
    const jobScore      = programs.reduce((acc, p) => p.category === '취업역량' ? acc + (p.score || 0) : acc, 0);
    const industryScore = programs.reduce((acc, p) => p.category === '산학협력' ? acc + (p.score || 0) : acc, 0);
    return [
      asText(s.studentId),
      escapeCsvCell(s.name),
      escapeCsvCell(s.department),
      escapeCsvCell(s.field),
      escapeCsvCell(s.email),
      asText(s.phone),
      escapeCsvCell(s.gradeAt2025Fall || '-'),
      jobScore,
      industryScore,
      s.coreSubjectScore,
      s.total,
      s.privacy_consented ? '동의완료' : '미동의',
      s.privacy_consented_at ? new Date(s.privacy_consented_at).toLocaleDateString('ko-KR') : '',
      asText(s.ssn || ''),
      escapeCsvCell(s.bankName || ''),
      asText(s.accountNumber),
      escapeCsvCell(s.accountHolder || ''),
      escapeCsvCell(s.memo || '')
    ];
  });

  const csvContent = [
    header.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `학생목록_${filterName}_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 학생 등록 양식 다운로드
export const downloadStudentTemplate = () => {
  const header = ['학번', '이름', '학과', '이메일', '전화번호', '비고'];
  const exampleRow = ['202411001', '홍길동', '컴퓨터공학과', 'hong@example.com', '010-1234-5678', ''];
  
  const csvContent = [
    header.join(','),
    exampleRow.join(',')
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', '학생등록양식.csv');
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 프로그램 신청자 엑셀 다운로드
export const downloadProgramApplicants = (program, applications, students, getApplicationStatus) => {
  const applicants = applications.filter(a => a.programId === program.id);
  
  const header = ['학번', '이름', '학과', '분야', '이메일', '전화번호', '신청일', '상태', '완료일'];
  const rows = applicants.map(app => {
    const student = students.find(s => s.id === app.studentId);
    const statusInfo = getApplicationStatus(app);
    return [
      student?.studentId || '',
      student?.name || '',
      student?.department || '',
      student?.field || '',
      student?.email || '',
      student?.phone || '',
      app.appliedDate,
      statusInfo.status,
      app.completedDate || ''
    ];
  });

  const csvContent = [
    header.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  const BOM = '\uFEFF';
  const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${program.title}_신청자목록_${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// 파일 다운로드 함수
export const downloadFile = async (fileUrl, fileName) => {
  try {
    // Blob URL인 경우 (업로드한 파일)
    if (fileUrl.startsWith('blob:')) {
      const link = document.createElement('a');
      link.href = fileUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      return;
    }

    // 외부 URL인 경우 (예: PDF 링크)
    const response = await fetch(fileUrl, { mode: 'cors' });
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // 메모리 정리
    window.URL.revokeObjectURL(blobUrl);
  } catch (error) {
    console.error('파일 다운로드 실패:', error);
    // CORS 에러 등으로 다운로드 실패 시 새 탭에서 열기
    window.open(fileUrl, '_blank');
  }
};