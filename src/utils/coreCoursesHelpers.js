import { POINTS_PER_COURSE, MAX_COURSES, MAX_SCORE } from '../components/coreCourses/constants';

/**
 * 점수 계산
 */
export function calculateCoreCoursesScore(completedCourses) {
  if (!completedCourses || !Array.isArray(completedCourses)) {
    return {
      completedCount: 0,
      validCount: 0,
      score: 0,
      maxScore: MAX_SCORE,
      percentage: 0
    };
  }

  // 체크된 과목만 카운트
  const completedCount = completedCourses.filter(c => c.isCompleted).length;
  
  // 최대 10과목까지만 인정
  const validCount = Math.min(completedCount, MAX_COURSES);
  
  // 점수 계산 (과목당 5점)
  const score = validCount * POINTS_PER_COURSE;
  
  // 퍼센트 계산
  const percentage = Math.round((score / MAX_SCORE) * 100);
  
  return {
    completedCount,
    validCount,
    score,
    maxScore: MAX_SCORE,
    percentage
  };
}

/**
 * 중복 체크 (같은 학수번호)
 */
export function isDuplicateCourse(courseCode, completedCourses, excludeCourseId = null) {
  if (!courseCode || !completedCourses) return false;
  
  return completedCourses.some(
    c => c.courseCode === courseCode && c.courseId !== excludeCourseId && c.isCompleted
  );
}

/**
 * 최대 과목 수 체크
 */
export function canAddMoreCourses(completedCourses) {
  const count = completedCourses.filter(c => c.isCompleted).length;
  return count < MAX_COURSES;
}

/**
 * 과목 구분별 그룹핑
 */
export function groupCoursesByType(courses) {
  const grouped = {
    '전공기초': [],
    '전공심화': [],
    '전공핵심': [],
    '전공선택': []
  };
  
  courses.forEach(course => {
    if (grouped[course.courseType]) {
      grouped[course.courseType].push(course);
    }
  });
  
  return grouped;
}

/**
 * 과목 정렬 (orderIndex 기준)
 */
export function sortCourses(courses) {
  return [...courses].sort((a, b) => {
    if (a.orderIndex !== b.orderIndex) {
      return a.orderIndex - b.orderIndex;
    }
    return a.courseName.localeCompare(b.courseName);
  });
}

/**
 * 파일 크기 포맷팅
 */
export function formatFileSize(bytes) {
  if (!bytes) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 파일 확장자 추출
 */
export function getFileExtension(filename) {
  if (!filename) return '';
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * 파일 유효성 검사
 */
export function validateFile(file, maxSize, acceptedFormats) {
  if (!file) {
    return { valid: false, error: '파일을 선택해주세요.' };
  }
  
  if (file.size > maxSize) {
    return { valid: false, error: `파일 크기는 ${formatFileSize(maxSize)} 이하여야 합니다.` };
  }
  
  if (!acceptedFormats.includes(file.type)) {
    return { valid: false, error: 'PDF, JPG, PNG 파일만 업로드 가능합니다.' };
  }
  
  return { valid: true, error: null };
}

/**
 * Base64 인코딩
 */
export function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = error => reject(error);
  });
}

/**
 * Base64 디코딩 및 다운로드 (바이너리 무결성 보장)
 */
export function downloadBase64File(base64Data, fileName) {
  try {
    console.log('📥 파일 다운로드 시작:', fileName);

    if (!base64Data || typeof base64Data !== 'string') {
      console.error('❌ Base64 데이터가 유효하지 않음');
      alert('파일 데이터가 올바르지 않습니다.');
      return;
    }

    // Data URL을 직접 사용 (가장 안전한 방법)
    // FileReader.readAsDataURL()로 생성된 데이터를 그대로 사용
    if (base64Data.startsWith('data:')) {
      console.log('✅ Data URL 직접 사용 (무손실)');
      const link = document.createElement('a');
      link.href = base64Data;
      link.download = fileName;
      link.style.display = 'none';

      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);

      console.log('✅ 파일 다운로드 완료');
      return;
    }

    // Data URL이 아닌 경우 (레거시 처리)
    console.warn('⚠️ 레거시 Base64 데이터 감지, 변환 시도');

    // Base64 데이터 추출
    let cleanBase64 = base64Data;
    if (base64Data.includes(',')) {
      cleanBase64 = base64Data.split(',')[1];
    }

    // MIME 타입 추출
    let mimeType = 'application/octet-stream';
    if (base64Data.includes('data:')) {
      const mimeMatch = base64Data.match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    // Base64를 바이너리로 변환
    const binaryString = atob(cleanBase64);
    const bytes = new Uint8Array(binaryString.length);

    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Blob 생성
    const blob = new Blob([bytes], { type: mimeType });

    console.log('📊 Blob 생성:', blob.size, 'bytes, MIME:', mimeType);

    // 다운로드
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();

    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 100);

    console.log('✅ 파일 다운로드 완료');
  } catch (error) {
    console.error('❌ 파일 다운로드 실패:', error);
    alert('파일 다운로드에 실패했습니다: ' + error.message);
  }
}

/**
 * 날짜 포맷팅
 */
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

/**
 * 과목별 이수율 계산
 */
export function calculateCourseCompletionRate(courseId, submissions) {
  if (!submissions || submissions.length === 0) return 0;
  
  const completedCount = submissions.filter(sub => {
    const courses = sub.completedCourses || [];
    return courses.some(c => c.courseId === courseId && c.isCompleted);
  }).length;
  
  return Math.round((completedCount / submissions.length) * 100);
}

/**
 * 통계 계산
 */
export function calculateStatistics(submissions) {
  if (!submissions || submissions.length === 0) {
    return {
      totalStudents: 0,
      submittedCount: 0,
      pendingCount: 0,
      approvedCount: 0,
      rejectedCount: 0,
      avgScore: 0,
      avgCompletionRate: 0
    };
  }
  
  const submittedCount = submissions.filter(s => s.status !== null).length;
  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;
  const rejectedCount = submissions.filter(s => s.status === 'rejected').length;
  
  const totalScore = submissions.reduce((sum, s) => sum + (s.totalScore || 0), 0);
  const avgScore = submittedCount > 0 ? Math.round(totalScore / submittedCount) : 0;
  
  const totalCompletionRate = submissions.reduce((sum, s) => {
    const score = calculateCoreCoursesScore(s.completedCourses);
    return sum + score.percentage;
  }, 0);
  const avgCompletionRate = submissions.length > 0 
    ? Math.round(totalCompletionRate / submissions.length) 
    : 0;
  
  return {
    totalStudents: submissions.length,
    submittedCount,
    pendingCount,
    approvedCount,
    rejectedCount,
    avgScore,
    avgCompletionRate
  };
}