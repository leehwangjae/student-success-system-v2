// 핵심 교과목 관련 상수

// 분야별 학과 맵핑
export const FIELD_DEPARTMENTS = {
    '바이오': [
      '생명과학전공',
      '분자의생명전공',
      '생명공학전공',
      '나노바이오공학전공'
    ],
    '반도체': [
      '전자공학전공',
      '반도체융합전공'
    ],
    '물류': [
      '동북아국제통상전공',
      '스마트물류공학전공',
      '물류학 연계전공'
    ]
  };
  
  // 분야 목록
  export const FIELDS = Object.keys(FIELD_DEPARTMENTS);
  
  // 과목 구분 (4종류)
  export const COURSE_TYPES = [
    '전공기초',
    '전공심화',
    '전공핵심',
    '전공선택'
  ];
  
  // 과목당 점수
  export const POINTS_PER_COURSE = 5;
  
  // 최대 인정 과목 수
  export const MAX_COURSES = 10;
  
  // 최대 점수
  export const MAX_SCORE = MAX_COURSES * POINTS_PER_COURSE; // 50점
  
  // 제출 상태
  export const SUBMISSION_STATUS = {
    PENDING: 'pending',
    APPROVED: 'approved',
    REJECTED: 'rejected'
  };
  
  // 제출 상태 한글
  export const SUBMISSION_STATUS_LABEL = {
    'pending': '검토중',
    'approved': '승인',
    'rejected': '반려'
  };
  
  // 제출 상태 색상
  export const SUBMISSION_STATUS_COLOR = {
    'pending': 'yellow',
    'approved': 'green',
    'rejected': 'red'
  };
  
  // 학점 옵션
  export const CREDIT_OPTIONS = [1, 2, 3, 4, 5, 6];
  
  // 파일 업로드 설정
  export const FILE_UPLOAD_CONFIG = {
    maxSize: 10 * 1024 * 1024, // 10MB
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'],
    acceptedExtensions: ['.pdf', '.jpg', '.jpeg', '.png']
  };