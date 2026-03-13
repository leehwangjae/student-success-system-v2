import {
  Document, Packer, Paragraph, Table, TableRow, TableCell,
  TextRun, HeadingLevel, AlignmentType, WidthType,
  BorderStyle, ShadingType, VerticalAlign, TableLayoutType,
  PageOrientation, convertInchesToTwip, Header, Footer,
  PageNumber, NumberFormat
} from 'docx';
import { writeFileSync } from 'fs';

// ── 공통 스타일 헬퍼 ─────────────────────────────
const FONT = '맑은 고딕';
const COLOR_BLUE = '1E3A5F';
const COLOR_LIGHT_BLUE = 'D6E4F0';
const COLOR_GRAY = 'F2F4F6';
const COLOR_DARK = '212529';
const COLOR_WHITE = 'FFFFFF';

const noBorder = {
  top: { style: BorderStyle.NONE, size: 0 },
  bottom: { style: BorderStyle.NONE, size: 0 },
  left: { style: BorderStyle.NONE, size: 0 },
  right: { style: BorderStyle.NONE, size: 0 },
};

const thinBorder = {
  top: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA' },
  bottom: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA' },
  left: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA' },
  right: { style: BorderStyle.SINGLE, size: 4, color: 'AAAAAA' },
};

function txt(text, opts = {}) {
  return new TextRun({
    text,
    font: FONT,
    size: opts.size || 20,
    bold: opts.bold || false,
    color: opts.color || COLOR_DARK,
    italics: opts.italic || false,
    break: opts.break,
  });
}

function para(children, opts = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [children],
    alignment: opts.align || AlignmentType.LEFT,
    spacing: {
      before: opts.before ?? 100,
      after: opts.after ?? 100,
      line: opts.line ?? 320,
    },
    indent: opts.indent ? { left: opts.indent } : undefined,
  });
}

function h1(text) {
  return new Paragraph({
    children: [txt(text, { size: 26, bold: true, color: COLOR_BLUE })],
    heading: HeadingLevel.HEADING_1,
    spacing: { before: 360, after: 120 },
    border: {
      bottom: { style: BorderStyle.SINGLE, size: 12, color: COLOR_BLUE },
    },
  });
}

function h2(text) {
  return new Paragraph({
    children: [txt(text, { size: 22, bold: true, color: COLOR_BLUE })],
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 280, after: 80 },
  });
}

function h3(text) {
  return new Paragraph({
    children: [txt(text, { size: 21, bold: true, color: COLOR_DARK })],
    heading: HeadingLevel.HEADING_3,
    spacing: { before: 200, after: 60 },
  });
}

function bullet(text, depth = 1) {
  const indent = depth === 1 ? 360 : 720;
  const prefix = depth === 1 ? '• ' : '- ';
  return para([txt(`${prefix}${text}`, { size: 19 })], {
    indent,
    before: 40,
    after: 40,
    line: 300,
  });
}

function space(lines = 1) {
  return new Paragraph({
    children: [txt('')],
    spacing: { before: 0, after: lines * 100 },
  });
}

// ── 표 헬퍼 ─────────────────────────────────────
function headerCell(text, opts = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [txt(text, { size: 18, bold: true, color: COLOR_WHITE })],
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 60 },
      }),
    ],
    shading: { type: ShadingType.SOLID, color: COLOR_BLUE },
    borders: thinBorder,
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opts.span || 1,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function dataCell(text, opts = {}) {
  return new TableCell({
    children: [
      new Paragraph({
        children: [txt(text, { size: 18, bold: opts.bold || false, color: opts.color || COLOR_DARK })],
        alignment: opts.align || AlignmentType.LEFT,
        spacing: { before: 60, after: 60 },
      }),
    ],
    shading: opts.shading
      ? { type: ShadingType.SOLID, color: opts.shading }
      : undefined,
    borders: thinBorder,
    verticalAlign: VerticalAlign.CENTER,
    columnSpan: opts.span || 1,
    width: opts.width ? { size: opts.width, type: WidthType.PERCENTAGE } : undefined,
  });
}

function simpleTable(headers, rows, widths) {
  return new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: headers.map((h, i) =>
          headerCell(h, widths ? { width: widths[i] } : {})
        ),
        tableHeader: true,
      }),
      ...rows.map((row, ri) =>
        new TableRow({
          children: row.map((cell, ci) =>
            dataCell(typeof cell === 'string' ? cell : cell.text, {
              align: AlignmentType.CENTER,
              shading: ri % 2 === 1 ? COLOR_GRAY : undefined,
              bold: typeof cell === 'object' ? cell.bold : false,
            })
          ),
        })
      ),
    ],
  });
}

// ── 문서 본문 구성 ───────────────────────────────
const content = [

  // ── 표지 ────────────────────────────────────────
  new Paragraph({
    children: [],
    spacing: { before: 1400, after: 0 },
  }),
  new Paragraph({
    children: [
      txt('업 무 실 적 보 고 서', { size: 52, bold: true, color: COLOR_BLUE }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 200 },
  }),
  new Paragraph({
    children: [txt('학생성공지수 관리 시스템 구축', { size: 28, color: '555555' })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 600 },
  }),
  new Paragraph({
    children: [
      txt('작성일 : 2026년 3월 13일', { size: 22, color: '555555' }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 80 },
  }),
  new Paragraph({
    children: [
      txt('시스템 버전 : v3.4.2', { size: 22, color: '555555' }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 2400 },
  }),

  // ── 목차 ────────────────────────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  new Paragraph({
    children: [txt('목    차', { size: 32, bold: true, color: COLOR_BLUE })],
    alignment: AlignmentType.CENTER,
    spacing: { before: 0, after: 400 },
  }),
  ...[
    ['1. 사업 개요', '3'],
    ['   1.1 추진 배경', '3'],
    ['   1.2 사업 목표', '3'],
    ['2. 시스템 구성 및 구축 개요', '4'],
    ['   2.1 기술 스택', '4'],
    ['   2.2 시스템 아키텍처', '4'],
    ['   2.3 데이터베이스 구성', '5'],
    ['   2.4 사용자 권한 체계', '5'],
    ['3. 주요 구현 기능', '6'],
    ['   3.1 학생 기능', '6'],
    ['   3.2 관리자 기능', '7'],
    ['   3.3 공통 기능', '8'],
    ['4. 개발 과정 주요 이슈 처리', '9'],
    ['5. 장점 및 기대 효과', '9'],
    ['6. 아쉬운 점 및 개선 사항', '10'],
    ['7. 종합 평가', '11'],
  ].map(([title, page]) =>
    new Paragraph({
      children: [
        txt(title, { size: 20, bold: title.startsWith('   ') ? false : true }),
        txt('\t', { size: 20 }),
        txt(page, { size: 20 }),
      ],
      tabStops: [{ type: 'right', position: 8640, leader: 'dot' }],
      spacing: { before: 60, after: 60, line: 300 },
    })
  ),

  // ── 1. 사업 개요 ─────────────────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  h1('1. 사업 개요'),

  h2('1.1 추진 배경'),
  para([
    txt(
      '학생 개인별 성공지수를 체계적으로 관리·산출하고, 교과목 이수 및 비교과 프로그램 참여 실적을 통합 관리할 수 있는 디지털 시스템의 필요성이 대두되었음. 기존 수기 작성·엑셀 관리 방식의 한계를 극복하고 실시간 데이터 기반의 투명한 운영 체계를 구축하고자 본 시스템을 개발함.',
      { size: 19 }
    ),
  ], { before: 80, after: 120, line: 340 }),

  h2('1.2 사업 목표'),
  bullet('학생 성공지수(핵심 교과목 + 비교과 프로그램 + 산학협력) 통합 산출 및 관리'),
  bullet('증빙서류 온라인 제출 및 관리자 검토 프로세스 디지털화'),
  bullet('학생·관리자 간 실시간 소통 및 정보 공유 체계 구축'),
  bullet('운영 현황 데이터 기반 분석 및 개선 근거 마련'),
  space(),

  // ── 2. 시스템 구성 및 구축 개요 ──────────────────
  h1('2. 시스템 구성 및 구축 개요'),

  h2('2.1 기술 스택'),
  simpleTable(
    ['구분', '기술/도구', '비고'],
    [
      ['프론트엔드', 'React 18 (Vite 빌드)', '컴포넌트 기반 SPA'],
      ['UI 스타일링', 'Tailwind CSS', '반응형 디자인'],
      ['상태 관리', 'React Context API + Zustand', '전역 상태 및 모달 관리'],
      ['백엔드/DB', 'Supabase (PostgreSQL)', '서버리스 BaaS'],
      ['파일 스토리지', 'Supabase Storage', '증빙서류 보관'],
      ['파일 처리', 'jsPDF, xlsx, html2canvas', 'PDF/엑셀 생성·다운로드'],
      ['배포', 'Vercel CDN', '정적 배포, 글로벌 CDN'],
    ],
    [20, 40, 40]
  ),
  space(),

  h2('2.2 시스템 아키텍처'),
  para([
    txt(
      '서버리스(Serverless) 구조를 채택하여 별도의 백엔드 서버 없이 Supabase를 통해 데이터베이스·인증·파일 스토리지를 일원화함. 프론트엔드는 Vercel에 정적 배포하여 운영 비용을 최소화하고 CDN을 통한 빠른 응답 속도를 확보함.',
      { size: 19 }
    ),
  ], { before: 80, after: 120, line: 340 }),

  new Table({
    layout: TableLayoutType.FIXED,
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: [
      new TableRow({
        children: [
          new TableCell({
            children: [
              para([txt('[ 아키텍처 흐름도 ]', { size: 18, bold: true, color: COLOR_BLUE })], { align: AlignmentType.CENTER }),
              para([txt('사용자 브라우저', { size: 18 })], { align: AlignmentType.CENTER, before: 60, after: 20 }),
              para([txt('↕ HTTPS', { size: 17, color: '888888' })], { align: AlignmentType.CENTER, before: 0, after: 20 }),
              para([txt('Vercel CDN (React SPA)', { size: 18 })], { align: AlignmentType.CENTER, before: 0, after: 20 }),
              para([txt('↕ Supabase JS SDK', { size: 17, color: '888888' })], { align: AlignmentType.CENTER, before: 0, after: 20 }),
              para([txt('Supabase', { size: 18, bold: true })], { align: AlignmentType.CENTER, before: 0, after: 20 }),
              para([txt('├── PostgreSQL (데이터 저장)', { size: 17 })], { align: AlignmentType.CENTER, before: 0, after: 10 }),
              para([txt('└── Storage (파일 저장)', { size: 17 })], { align: AlignmentType.CENTER, before: 0, after: 60 }),
            ],
            shading: { type: ShadingType.SOLID, color: COLOR_GRAY },
            borders: thinBorder,
          }),
        ],
      }),
    ],
  }),
  space(),

  h2('2.3 데이터베이스 구성'),
  simpleTable(
    ['테이블명', '역할'],
    [
      ['users', '학생·관리자 계정, 점수, 개인정보'],
      ['core_courses', '핵심 교과목 목록 (학과·분야별)'],
      ['core_courses_submissions', '교과목 이수 제출 내역 및 심사 결과'],
      ['non_curricular_programs', '비교과 프로그램 목록 (카테고리·점수)'],
      ['non_curricular_submissions', '비교과 프로그램 제출 내역 및 심사 결과'],
      ['programs', '외부 프로그램 목록'],
      ['program_applications', '프로그램 신청 내역'],
      ['notices', '공지사항 (팝업 설정 포함)'],
      ['application_periods', '신청 기간 설정 (교과목/비교과 분리)'],
      ['question_board', '학생 질문 게시판 (Q&A)'],
      ['satisfaction_survey', '만족도 조사 응답'],
    ],
    [42, 58]
  ),
  space(),

  h2('2.4 사용자 권한 체계'),
  simpleTable(
    ['역할', '대상', '주요 권한'],
    [
      ['master', '최고 관리자', '관리자 계정 승인, 전체 설정 접근'],
      ['admin', '일반 관리자', '학생 관리, 제출 검토·승인, 점수 확정, 공지사항 관리'],
      ['student', '학생', '이수 현황 제출, 프로그램 신청, 질문 등록, 만족도 조사'],
    ],
    [15, 20, 65]
  ),
  space(),

  // ── 3. 주요 구현 기능 ────────────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  h1('3. 주요 구현 기능'),

  h2('3.1 학생 기능'),

  h3('(1) 성공지수 대시보드'),
  bullet('핵심 교과목 점수, 비교과 프로그램 점수, 산학협력 점수 통합 표시'),
  bullet('분야·학과·학년별 맞춤 정보 제공'),
  bullet('본인 개인정보 및 계좌 정보 조회·수정'),

  h3('(2) 전략산업 교과목 신청'),
  bullet('학과·분야별 필수 이수 교과목 목록 제공'),
  bullet('이수 과목 선택 및 성적표(증빙 파일) 업로드'),
  bullet('신청 상태 실시간 확인 (대기 / 승인 / 반려)'),
  bullet('반려 사유 확인 후 수정 재제출 가능'),

  h3('(3) 비교과 프로그램 신청'),
  bullet('취업역량·산학협력 분류별 프로그램 체크리스트'),
  bullet('이수증 다중 파일 업로드 (최대 10개)'),
  bullet('이수 프로그램 합산 점수 실시간 표시'),

  h3('(4) 질문 게시판'),
  bullet('비밀글 기능 포함 Q&A 게시판'),
  bullet('학생 본인 글 수정·삭제'),
  bullet('관리자 답변 확인'),

  h3('(5) 만족도 조사'),
  bullet('7개 항목 5점 척도 설문 (시스템 전반, 입력 효율성, 운영 체계성, 활용 편의성, UI/디자인, 담당자 지원, 활용 의향)'),
  bullet('문항별 비고 입력 및 종합 의견 자유 서술'),
  bullet('제출 후 수정 재제출 가능'),
  space(),

  h2('3.2 관리자 기능'),

  h3('(1) 학생 관리'),
  bullet('학생 계정 등록·수정·삭제'),
  bullet('학생 목록 엑셀 다운로드'),
  bullet('개인별 점수 이력 조회 및 수동 조정'),

  h3('(2) 교과목·프로그램 심사'),
  bullet('제출 내역 목록 조회 및 증빙 파일 다운로드'),
  bullet('승인·반려 처리 (반려 사유 입력 포함)'),
  bullet('승인 시 학생 성공지수 자동 반영'),

  h3('(3) 비교과 프로그램 설정'),
  bullet('분야·학과·카테고리별 프로그램 등록·수정·삭제'),
  bullet('프로그램별 점수 개별 설정'),

  h3('(4) 공지사항 관리'),
  bullet('분야별 타깃 공지 발행'),
  bullet('팝업 공지 설정 (로그인 시 자동 노출)'),

  h3('(5) 신청 기간 설정'),
  bullet('교과목·비교과 프로그램별 신청 기간 독립 설정'),
  bullet('기간 외 제출 자동 차단'),

  h3('(6) 질문 게시판 관리'),
  bullet('학생 문의 조회 및 답변 등록'),
  bullet('비밀글 포함 전체 게시물 관리'),
  space(),

  h2('3.3 공통 기능'),
  bullet('개인정보 수집·이용 동의 처리 (PIPA 준수)'),
  bullet('파일 업로드 시 유효성 검증 (허용 확장자, 파일 크기)'),
  bullet('Supabase Storage를 이용한 안전한 증빙 파일 보관'),
  bullet('한글 파일명 업로드 오류 방지 처리 (Storage InvalidKey 대응)'),
  bullet('역할 기반 접근 제어 (RBAC): 관리자/학생 화면 분리'),
  space(),

  // ── 4. 주요 이슈 ────────────────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  h1('4. 개발 과정 주요 이슈 처리'),

  simpleTable(
    ['이슈', '원인', '해결 방법'],
    [
      [
        '한글 파일명 업로드 400 오류',
        'Supabase Storage가 한글 포함 경로(Key)를 미지원',
        '업로드 경로를 {folder}/{timestamp}.{ext} 형태로 변경하여 한글 완전 제거',
      ],
      [
        '제출 후 파일 목록 사라짐',
        'DB 재로드 시 파일 컬럼을 SELECT에서 누락하여 빈 배열로 덮어씀',
        'SELECT 쿼리에 uploaded_files, certificate_files 컬럼 추가',
      ],
    ],
    [25, 35, 40]
  ),
  space(),

  // ── 5. 장점 및 기대 효과 ─────────────────────────
  h1('5. 장점 및 기대 효과'),

  h2('5.1 운영 효율성'),
  bullet('페이퍼리스 구현: 증빙서류 온라인 제출로 오프라인 서류 접수 업무 제거'),
  bullet('실시간 처리: 제출 즉시 관리자 검토 대기 상태로 전환, 처리 지연 최소화'),
  bullet('자동 점수 반영: 승인 시 학생 성공지수 자동 업데이트로 수작업 오류 방지'),
  bullet('기간 관리 자동화: 신청 기간 설정으로 기간 외 제출 자동 차단'),

  h2('5.2 학생 편의성'),
  bullet('통합 포털: 교과목 신청, 비교과 신청, 공지사항, 질문 게시판을 하나의 시스템에서 처리'),
  bullet('실시간 현황 확인: 제출 상태(대기/승인/반려) 및 반려 사유를 즉시 확인 가능'),
  bullet('재제출 지원: 반려 시 수정 후 재제출 가능한 유연한 프로세스'),

  h2('5.3 데이터 관리'),
  bullet('중앙화된 데이터: 모든 이수 실적·점수 데이터 Supabase에 통합 관리'),
  bullet('이력 보존: 제출·수정·승인 이력 타임스탬프 기록'),
  bullet('엑셀 다운로드: 학생 목록, 신청자 현황 등 데이터 추출 지원'),
  space(),

  // ── 6. 아쉬운 점 및 개선 사항 ────────────────────
  new Paragraph({ children: [], pageBreakBefore: true }),
  h1('6. 아쉬운 점 및 개선 사항'),

  h2('6.1 보안'),
  simpleTable(
    ['항목', '현황', '개선 방향'],
    [
      ['비밀번호 저장', '일부 평문 저장', 'bcrypt 해싱 적용 필요'],
      ['인증 방식', '커스텀 로그인 (Supabase Auth 미사용)', 'Supabase Auth 전환으로 JWT 기반 세션 관리 강화'],
      ['DB 보안', '앱 레벨 제어에 의존', 'Supabase RLS 정책 강화로 DB 레벨 보안 추가'],
    ],
    [22, 38, 40]
  ),
  space(),

  h2('6.2 기능적 개선 필요 사항'),
  simpleTable(
    ['항목', '내용'],
    [
      ['만족도 조사 관리자 화면', '응답 결과 집계·통계 조회 기능 미구현 → 차기 고도화 필요'],
      ['이메일 알림', '제출/승인/반려 시 학생 이메일 자동 발송 기능 없음'],
      ['학생 일괄 등록', '엑셀 파일을 이용한 학생 대량 등록 기능 미구현'],
      ['모바일 최적화', '탭 메뉴 다수로 모바일 환경에서 UI 가독성 저하'],
      ['파일 미리보기', '업로드된 이미지·PDF 인라인 미리보기 기능 부분 구현'],
    ],
    [30, 70]
  ),
  space(),

  h2('6.3 운영 관련 개선 사항'),
  simpleTable(
    ['항목', '내용'],
    [
      ['통계 대시보드', '학기별·연도별 비교 통계 화면 부재 → 연도별 트렌드 분석 필요'],
      ['관리자 이력 관리', '검토자(reviewer) 기록 일부 미반영'],
      ['백업 정책', 'Supabase 자동 백업 외 별도 정책 수립 필요'],
    ],
    [30, 70]
  ),
  space(),

  // ── 7. 종합 평가 ─────────────────────────────────
  h1('7. 종합 평가'),
  para([
    txt(
      '본 시스템은 학생성공지수 관리 업무의 디지털 전환이라는 목표를 달성하여 ',
      { size: 19 }
    ),
    txt('증빙서류 온라인화, 실시간 점수 관리, 다중 사용자 역할 분리', { size: 19, bold: true }),
    txt('를 성공적으로 구현하였음.', { size: 19 }),
  ], { before: 80, after: 140, line: 360 }),

  para([
    txt(
      'React + Supabase 기반의 서버리스 아키텍처를 채택함으로써 별도의 서버 인프라 없이 빠른 개발과 안정적인 운영이 가능하였으며, Vercel 배포를 통해 CDN 기반의 빠른 응답 속도를 확보하였음.',
      { size: 19 }
    ),
  ], { before: 0, after: 140, line: 360 }),

  para([
    txt(
      '다만, ',
      { size: 19 }
    ),
    txt('보안 강화(비밀번호 암호화, Supabase Auth 전환)', { size: 19, bold: true }),
    txt(
      '와 만족도 조사 결과 집계 화면, 이메일 알림 기능 등은 차기 고도화 과제로 남아 있으며, 운영 피드백을 지속적으로 수렴하여 개선해 나갈 예정임.',
      { size: 19 }
    ),
  ], { before: 0, after: 200, line: 360 }),

  space(2),
  new Paragraph({
    children: [
      txt('본 보고서는 2026년 3월 기준 시스템 v3.4.2를 기준으로 작성되었습니다.', {
        size: 17,
        color: '888888',
        italic: true,
      }),
    ],
    alignment: AlignmentType.CENTER,
    spacing: { before: 200, after: 0 },
  }),
];

// ── 문서 생성 ────────────────────────────────────
const doc = new Document({
  numbering: { config: [] },
  styles: {
    default: {
      document: {
        run: { font: FONT, size: 20 },
        paragraph: { spacing: { line: 320 } },
      },
    },
  },
  sections: [
    {
      properties: {
        page: {
          margin: {
            top: convertInchesToTwip(1),
            right: convertInchesToTwip(1),
            bottom: convertInchesToTwip(1),
            left: convertInchesToTwip(1.2),
          },
        },
      },
      headers: {
        default: new Header({
          children: [
            new Paragraph({
              children: [
                txt('학생성공지수 관리 시스템 구축 업무실적보고서', { size: 16, color: '888888' }),
              ],
              alignment: AlignmentType.RIGHT,
              border: {
                bottom: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
              },
              spacing: { before: 0, after: 80 },
            }),
          ],
        }),
      },
      footers: {
        default: new Footer({
          children: [
            new Paragraph({
              children: [
                txt('- ', { size: 16, color: '888888' }),
                new TextRun({
                  children: [PageNumber.CURRENT],
                  font: FONT,
                  size: 16,
                  color: '888888',
                }),
                txt(' -', { size: 16, color: '888888' }),
              ],
              alignment: AlignmentType.CENTER,
              border: {
                top: { style: BorderStyle.SINGLE, size: 4, color: 'CCCCCC' },
              },
              spacing: { before: 80, after: 0 },
            }),
          ],
        }),
      },
      children: content,
    },
  ],
});

const buffer = await Packer.toBuffer(doc);
writeFileSync('업무실적보고서_학생성공지수관리시스템.docx', buffer);
console.log('✅ 업무실적보고서_학생성공지수관리시스템.docx 생성 완료');
