// 비교과 프로그램 카테고리
export const PROGRAM_CATEGORIES = {
  EMPLOYMENT: '취업역량',
  INDUSTRY: '산학협력'
};

// 제출 상태
export const SUBMISSION_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
};

export const SUBMISSION_STATUS_LABEL = {
  pending: '검토 대기',
  approved: '승인',
  rejected: '반려'
};

// 파일 업로드 설정
export const FILE_UPLOAD_CONFIG = {
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_FILES: 5, // 최대 5개 파일
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ],
  ALLOWED_EXTENSIONS: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx']
};

// 분야별 카테고리 (교과목과 동일)
export const FIELD_CATEGORIES = {
  '바이오': ['취업역량', '산학협력'],
  '반도체': ['취업역량', '산학협력'],
  '물류': ['취업역량', '산학협력']
};
