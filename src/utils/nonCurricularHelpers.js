import { FILE_UPLOAD_CONFIG } from '../components/nonCurricularPrograms/constants';

// 파일 유효성 검사
export function validateFile(file) {
  if (!file) {
    return { valid: false, error: '파일이 선택되지 않았습니다.' };
  }

  if (file.size > FILE_UPLOAD_CONFIG.MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `파일 크기는 ${formatFileSize(FILE_UPLOAD_CONFIG.MAX_FILE_SIZE)} 이하여야 합니다.`
    };
  }

  const fileExtension = '.' + file.name.split('.').pop().toLowerCase();
  if (!FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.includes(fileExtension)) {
    return {
      valid: false,
      error: `허용되지 않는 파일 형식입니다. (${FILE_UPLOAD_CONFIG.ALLOWED_EXTENSIONS.join(', ')})`
    };
  }

  return { valid: true };
}

// 파일을 Base64로 변환
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// 파일 크기 포맷팅
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

// 날짜 포맷팅
export function formatDate(dateString) {
  if (!dateString) return '-';
  const date = new Date(dateString);
  return date.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Base64 파일 다운로드
export function downloadBase64File(base64Data, fileName) {
  try {
    const link = document.createElement('a');
    link.href = base64Data;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch (error) {
    console.error('파일 다운로드 실패:', error);
    alert('파일 다운로드에 실패했습니다.');
  }
}

// 총 점수 계산
export function calculateTotalScore(programs) {
  if (!programs || programs.length === 0) return 0;
  return programs.reduce((sum, program) => sum + (program.score || 0), 0);
}

// 카테고리별 그룹화
export function groupProgramsByCategory(programs) {
  const grouped = {
    '취업역량': [],
    '산학협력': []
  };

  programs.forEach(program => {
    if (grouped[program.category]) {
      grouped[program.category].push(program);
    }
  });

  return grouped;
}

// 통계 계산
export function calculateStatistics(submissions) {
  if (!submissions || submissions.length === 0) {
    return {
      totalStudents: 0,
      submittedCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      avgScore: 0,
      avgProgramCount: 0
    };
  }

  const submittedCount = submissions.filter(s => s.status !== null).length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;

  const totalScore = submissions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
  const avgScore = submittedCount > 0 ? Math.round(totalScore / submittedCount) : 0;

  const totalProgramCount = submissions.reduce((sum, s) => sum + (s.totalProgramCount || 0), 0);
  const avgProgramCount = submissions.length > 0
    ? Math.round((totalProgramCount / submissions.length) * 10) / 10
    : 0;

  return {
    totalStudents: submissions.length,
    submittedCount,
    pendingCount,
    approvedCount,
    rejectedCount,
    avgScore,
    avgProgramCount
  };
}
