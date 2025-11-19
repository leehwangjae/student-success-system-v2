// 엑셀 다운로드 함수
export const downloadExcel = (students, filterName) => {
  const header = ['학번', '이름', '학과', '분야', '이메일', '전화번호', '비교과', '핵심교과', '산학협력', '총점', '비고'];
  const rows = students.map(s => [
    s.studentId,
    s.name,
    s.department,
    s.field,
    s.email,
    s.phone,
    s.nonCurricularScore,
    s.coreSubjectScore,
    s.industryScore,
    s.total,
    s.memo || ''
  ]);

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