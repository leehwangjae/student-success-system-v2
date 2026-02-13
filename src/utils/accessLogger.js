import { supabase } from '../lib/supabase';

/**
 * 접근 로그 기록 유틸리티
 * 정보통신망법 제29조에 따른 접근 기록 보관
 */

/**
 * 접근 로그 기록
 * @param {Object} logData - 로그 데이터
 * @param {number} logData.userId - 사용자 ID
 * @param {string} logData.username - 사용자 아이디
 * @param {string} logData.actionType - 행동 유형 (login, logout, view_personal_info, update_personal_info, delete_personal_info)
 * @param {string} logData.resourceAccessed - 접근한 리소스
 * @param {string} logData.status - 상태 (success, failed, blocked)
 * @param {string} logData.errorMessage - 에러 메시지 (실패 시)
 */
export async function logAccess({
  userId,
  username,
  actionType,
  resourceAccessed = '',
  status = 'success',
  errorMessage = null
}) {
  try {
    // IP 주소 및 User Agent 수집
    const userAgent = navigator.userAgent || '';

    // 메타데이터 수집
    const metadata = {
      browser: getBrowserInfo(),
      os: getOSInfo(),
      screen: {
        width: window.screen.width,
        height: window.screen.height
      },
      timestamp: new Date().toISOString()
    };

    const logEntry = {
      user_id_custom: userId || null,
      username: username || 'anonymous',
      action_type: actionType,
      user_agent: userAgent,
      resource_accessed: resourceAccessed,
      status: status,
      error_message: errorMessage,
      metadata: metadata
    };

    // Supabase에 로그 저장
    const { error } = await supabase
      .from('access_logs')
      .insert([logEntry]);

    if (error) {
      console.error('❌ 접근 로그 기록 실패:', error);
    } else {
      console.log('📝 접근 로그 기록:', actionType, status);
    }
  } catch (error) {
    console.error('❌ 접근 로그 기록 오류:', error);
    // 로그 실패해도 애플리케이션은 계속 동작
  }
}

/**
 * 로그인 성공 기록
 */
export async function logLoginSuccess(userId, username) {
  await logAccess({
    userId,
    username,
    actionType: 'login',
    status: 'success'
  });
}

/**
 * 로그인 실패 기록
 */
export async function logLoginFailure(username, errorMessage) {
  await logAccess({
    username,
    actionType: 'login',
    status: 'failed',
    errorMessage
  });
}

/**
 * 로그아웃 기록
 */
export async function logLogout(userId, username) {
  await logAccess({
    userId,
    username,
    actionType: 'logout',
    status: 'success'
  });
}

/**
 * 개인정보 열람 기록
 */
export async function logViewPersonalInfo(userId, username, resourceAccessed) {
  await logAccess({
    userId,
    username,
    actionType: 'view_personal_info',
    resourceAccessed,
    status: 'success'
  });
}

/**
 * 개인정보 수정 기록
 */
export async function logUpdatePersonalInfo(userId, username, resourceAccessed) {
  await logAccess({
    userId,
    username,
    actionType: 'update_personal_info',
    resourceAccessed,
    status: 'success'
  });
}

/**
 * 개인정보 삭제 기록
 */
export async function logDeletePersonalInfo(userId, username) {
  await logAccess({
    userId,
    username,
    actionType: 'delete_personal_info',
    status: 'success'
  });
}

/**
 * 브라우저 정보 추출
 */
function getBrowserInfo() {
  const ua = navigator.userAgent;
  let browser = 'Unknown';

  if (ua.indexOf('Chrome') > -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') > -1) browser = 'Safari';
  else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('Edge') > -1) browser = 'Edge';
  else if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) browser = 'IE';

  return browser;
}

/**
 * OS 정보 추출
 */
function getOSInfo() {
  const ua = navigator.userAgent;
  let os = 'Unknown';

  if (ua.indexOf('Windows') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'macOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iOS') > -1) os = 'iOS';

  return os;
}

/**
 * 최근 로그 조회 (관리자용)
 */
export async function getRecentLogs(limit = 100) {
  try {
    const { data, error } = await supabase
      .from('access_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('로그 조회 실패:', error);
    return [];
  }
}

/**
 * 사용자별 로그 조회 (관리자용)
 */
export async function getUserLogs(username, limit = 50) {
  try {
    const { data, error } = await supabase
      .from('access_logs')
      .select('*')
      .eq('username', username)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('사용자 로그 조회 실패:', error);
    return [];
  }
}
