export const initialStudents = [
  {
    id: 1,
    name: '김철수',
    studentId: '202411001',
    department: '바이오공학과',
    field: '바이오 분야',
    email: 'chulsoo@example.com',
    phone: '010-1234-5678',
    memo: '',
    nonCurricularScore: 0,
    coreSubjectScore: 0,
    industryScore: 0,
    total: 0,
    nonCurricularHistory: [],
    coreSubjectHistory: [],
    industryHistory: []
  },
  {
    id: 2,
    name: '이영희',
    studentId: '202411002',
    department: '전자공학과',
    field: '반도체 분야',
    email: 'younghee@example.com',
    phone: '010-2345-6789',
    memo: '',
    nonCurricularScore: 0,
    coreSubjectScore: 0,
    industryScore: 0,
    total: 0,
    nonCurricularHistory: [],
    coreSubjectHistory: [],
    industryHistory: []
  },
  {
    id: 3,
    name: '박민수',
    studentId: '202411003',
    department: '물류시스템공학과',
    field: '물류 분야',
    email: 'minsu@example.com',
    phone: '010-3456-7890',
    memo: '',
    nonCurricularScore: 0,
    coreSubjectScore: 0,
    industryScore: 0,
    total: 0,
    nonCurricularHistory: [],
    coreSubjectHistory: [],
    industryHistory: []
  },
  {
    id: 4,
    name: '정수진',
    studentId: '202411004',
    department: '컴퓨터공학과',
    field: '반도체 분야',
    email: 'sujin@example.com',
    phone: '010-4567-8901',
    memo: '',
    nonCurricularScore: 0,
    coreSubjectScore: 0,
    industryScore: 0,
    total: 0,
    nonCurricularHistory: [],
    coreSubjectHistory: [],
    industryHistory: []
  },
  {
    id: 5,
    name: '최동욱',
    studentId: '202411005',
    department: '생명과학과',
    field: '바이오 분야',
    email: 'dongwook@example.com',
    phone: '010-5678-9012',
    memo: '',
    nonCurricularScore: 0,
    coreSubjectScore: 0,
    industryScore: 0,
    total: 0,
    nonCurricularHistory: [],
    coreSubjectHistory: [],
    industryHistory: []
  }
];

export const initialPrograms = [
  {
    id: 1,
    title: '바이오 산업 현장실습',
    category: '산학협력',
    field: '바이오 분야',
    startDate: '2024-03-01',
    endDate: '2024-03-31',
    status: '모집중',
    maxParticipants: 20,
    requiresFile: true,
    score: 15,
    description: '바이오 산업 현장에서의 실무 경험을 쌓는 프로그램입니다.\n\n참가 학생들은 실제 바이오 기업에서 4주간 근무하며 다음과 같은 경험을 얻게 됩니다:\n- 바이오 제품 개발 프로세스 참여\n- 실험실 연구 보조\n- 품질 관리 및 분석\n\n이 프로그램을 통해 산업 현장의 실무 능력을 키우고 취업 경쟁력을 높일 수 있습니다.',
    files: [
      {
        name: '현장실습 신청서.pdf',
        size: 102400,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      },
      {
        name: '프로그램 안내문.pdf',
        size: 153600,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }
    ],
    images: []
  },
  {
    id: 2,
    title: '창업 아이디어 경진대회',
    category: '비교과',
    field: '공통',
    startDate: '2024-04-01',
    endDate: '2024-04-30',
    status: '모집중',
    maxParticipants: 50,
    requiresFile: false,
    score: 10,
    description: '혁신적인 창업 아이디어를 발표하고 경쟁하는 대회입니다.\n\n대회 진행 방식:\n1차: 서류 심사 (아이디어 기획서)\n2차: 발표 심사 (PPT 프레젠테이션)\n\n우수 팀에게는 다음과 같은 혜택이 제공됩니다:\n- 상금 및 상장 수여\n- 창업 멘토링 기회\n- 창업 지원금 우선 선발',
    files: [
      {
        name: '대회 안내문.pdf',
        size: 204800,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }
    ],
    images: []
  },
  {
    id: 3,
    title: '반도체 기술 세미나',
    category: '비교과',
    field: '반도체 분야',
    startDate: '2024-05-01',
    endDate: '2024-05-15',
    status: '모집중',
    maxParticipants: 30,
    requiresFile: false,
    score: 8,
    description: '최신 반도체 기술 동향과 산업 전망에 대한 세미나입니다.\n\n세미나 주제:\n- AI 반도체 설계 기술\n- 차세대 메모리 반도체\n- 시스템 반도체 산업 동향\n\n초청 연사:\n- 삼성전자 반도체 연구소 수석연구원\n- SK하이닉스 기술개발팀장',
    files: [],
    images: []
  },
  {
    id: 4,
    title: '물류 시스템 프로젝트',
    category: '산학협력',
    field: '물류 분야',
    startDate: '2024-06-01',
    endDate: '2024-06-30',
    status: '진행중',
    maxParticipants: 15,
    requiresFile: true,
    score: 12,
    description: '실제 물류 시스템 개선 프로젝트에 참여하는 프로그램입니다.\n\n프로젝트 내용:\n- 물류센터 효율성 분석\n- 재고 관리 시스템 개선안 도출\n- 배송 최적화 알고리즘 개발\n\n협력 기업: CJ대한통운, 쿠팡 풀필먼트',
    files: [
      {
        name: '프로젝트 계획서.pdf',
        size: 153600,
        url: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf'
      }
    ],
    images: []
  },
  {
    id: 5,
    title: '글로벌 리더십 캠프',
    category: '비교과',
    field: '공통',
    startDate: '2024-07-01',
    endDate: '2024-07-10',
    status: '모집중',
    maxParticipants: 40,
    requiresFile: false,
    score: 12,
    description: '글로벌 리더로 성장하기 위한 역량 강화 캠프입니다.\n\n프로그램 구성:\n- 리더십 이론 교육\n- 팀 프로젝트 수행\n- 해외 기업 탐방 (온라인)\n- 글로벌 네트워킹\n\n참가 혜택:\n- 수료증 발급\n- 리더십 역량 인증서',
    files: [],
    images: []
  }
];

export const initialNotices = [
  {
    id: 1,
    title: '2024학년도 1학기 학생성공지수 프로그램 안내',
    field: '공통',
    content: '안녕하세요. 학생성공지수 관리팀입니다.\n\n2024학년도 1학기 학생성공지수 프로그램 신청이 시작되었습니다.\n\n신청 기간: 2024년 3월 1일 ~ 3월 31일\n\n많은 참여 부탁드립니다.\n\n감사합니다.',
    date: '2024-03-01',
    author: '관리자',
    views: 245,
    files: [],
    images: []
  },
  {
    id: 2,
    title: '[바이오 분야] 산업체 현장실습 모집 공고',
    field: '바이오 분야',
    content: '바이오 분야 학생들을 대상으로 산업체 현장실습 프로그램 참가자를 모집합니다.\n\n모집 기간: 2024년 3월 1일 ~ 3월 15일\n실습 기간: 2024년 4월 1일 ~ 4월 30일\n모집 인원: 20명\n\n참가 신청은 학생성공지수 시스템에서 가능합니다.',
    date: '2024-03-01',
    author: '관리자',
    views: 189,
    files: [],
    images: []
  },
  {
    id: 3,
    title: '[반도체 분야] 기술 세미나 개최 안내',
    field: '반도체 분야',
    content: '반도체 분야 최신 기술 동향 세미나를 개최합니다.\n\n일시: 2024년 5월 10일 14:00\n장소: 공학관 대강당\n연사: 삼성전자 반도체 연구소 김OO 수석연구원\n\n많은 참여 바랍니다.',
    date: '2024-04-20',
    author: '관리자',
    views: 156,
    files: [],
    images: []
  },
  {
    id: 4,
    title: '학생성공지수 산정 기준 안내',
    field: '공통',
    content: '학생성공지수는 다음 3가지 영역으로 구성됩니다.\n\n1. 비교과 활동 (30%)\n2. 핵심교과 이수 (40%)\n3. 산학협력 활동 (30%)\n\n각 활동별 점수는 프로그램 참여 시 자동으로 반영됩니다.',
    date: '2024-03-05',
    author: '관리자',
    views: 321,
    files: [],
    images: []
  },
  {
    id: 5,
    title: '[물류 분야] 산학협력 프로젝트 참가자 모집',
    field: '물류 분야',
    content: 'CJ대한통운과 함께하는 물류 시스템 개선 프로젝트 참가자를 모집합니다.\n\n프로젝트 기간: 2024년 6월 1일 ~ 6월 30일\n모집 인원: 15명\n참가 혜택: 프로젝트 수행비 지급, 우수 참가자 인턴 기회\n\n신청 기한: 2024년 5월 20일까지',
    date: '2024-05-01',
    author: '관리자',
    views: 203,
    files: [],
    images: []
  }
];