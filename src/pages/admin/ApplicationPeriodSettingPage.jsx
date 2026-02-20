/**
 * 신청 기간 설정 페이지 (관리자)
 * @version 1.0
 * @description 전략산업 교과목 및 비교과 프로그램 신청 기간 설정
 */
import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useModalStore } from '../../hooks/useModal';

function ApplicationPeriodSettingPage() {
  const { applicationPeriods, saveApplicationPeriod } = useAppContext();
  const { showAlert, showConfirm } = useModalStore();

  // 전략산업 교과목 기간
  const [coreCoursesForm, setCoreCoursesForm] = useState({
    startDate: '',
    endDate: '',
    isActive: false
  });

  // 비교과 프로그램 기간
  const [nonCurricularForm, setNonCurricularForm] = useState({
    startDate: '',
    endDate: '',
    isActive: false
  });

  const [isSavingCore, setIsSavingCore] = useState(false);
  const [isSavingNon, setIsSavingNon] = useState(false);

  // ISO 문자열을 로컬 datetime-local input 형식(YYYY-MM-DDTHH:mm)으로 변환
  const toLocalDatetimeInput = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    // 로컬 시각 기준으로 변환
    const yyyy = d.getFullYear();
    const MM = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${yyyy}-${MM}-${dd}T${hh}:${mm}`;
  };

  // datetime-local 입력값(로컬 시각)을 ISO 문자열로 변환 (UTC 변환 없이 로컬 기준)
  const toLocalISOString = (localDatetimeStr) => {
    if (!localDatetimeStr) return null;
    // "2026-02-22T23:59" 형식을 로컬 시각 그대로 ISO처럼 저장 (+09:00 추가)
    const d = new Date(localDatetimeStr);
    const offsetMs = d.getTimezoneOffset() * 60 * 1000;
    const localMs = d.getTime() - offsetMs;
    return new Date(localMs).toISOString();
  };

  // 기존 설정 로드
  useEffect(() => {
    if (applicationPeriods.coreCourses) {
      setCoreCoursesForm({
        startDate: toLocalDatetimeInput(applicationPeriods.coreCourses.startDate),
        endDate: toLocalDatetimeInput(applicationPeriods.coreCourses.endDate),
        isActive: applicationPeriods.coreCourses.isActive || false
      });
    }
    if (applicationPeriods.nonCurricular) {
      setNonCurricularForm({
        startDate: toLocalDatetimeInput(applicationPeriods.nonCurricular.startDate),
        endDate: toLocalDatetimeInput(applicationPeriods.nonCurricular.endDate),
        isActive: applicationPeriods.nonCurricular.isActive || false
      });
    }
  }, [applicationPeriods]);

  // 현재 기간 상태 계산
  const getPeriodStatus = (period) => {
    if (!period.isActive) return { label: '비활성화', color: 'gray' };
    if (!period.startDate || !period.endDate) return { label: '기간 미설정', color: 'yellow' };

    const now = new Date();
    const start = new Date(period.startDate);
    const end = new Date(period.endDate);
    end.setHours(23, 59, 59, 999);

    if (now < start) return { label: '신청 전', color: 'blue' };
    if (now > end) return { label: '신청 마감', color: 'red' };
    return { label: '신청 중', color: 'green' };
  };

  const coreStatus = getPeriodStatus(applicationPeriods.coreCourses);
  const nonStatus = getPeriodStatus(applicationPeriods.nonCurricular);

  const handleSaveCoreCourses = async () => {
    if (coreCoursesForm.isActive) {
      if (!coreCoursesForm.startDate || !coreCoursesForm.endDate) {
        showAlert('기간 활성화 시 시작일시와 종료일시를 모두 입력해주세요.');
        return;
      }
      if (new Date(coreCoursesForm.startDate) >= new Date(coreCoursesForm.endDate)) {
        showAlert('시작일시는 종료일시보다 이전이어야 합니다.');
        return;
      }
    }

    showConfirm('전략산업 교과목 신청 기간을 저장하시겠습니까?', async () => {
      setIsSavingCore(true);
      const result = await saveApplicationPeriod('core_courses', {
        startDate: toLocalISOString(coreCoursesForm.startDate),
        endDate: toLocalISOString(coreCoursesForm.endDate),
        isActive: coreCoursesForm.isActive
      });
      setIsSavingCore(false);

      if (result.success) {
        showAlert('✅ 전략산업 교과목 신청 기간이 저장되었습니다.');
      } else {
        showAlert(`저장 실패: ${result.error}`);
      }
    });
  };

  const handleSaveNonCurricular = async () => {
    if (nonCurricularForm.isActive) {
      if (!nonCurricularForm.startDate || !nonCurricularForm.endDate) {
        showAlert('기간 활성화 시 시작일시와 종료일시를 모두 입력해주세요.');
        return;
      }
      if (new Date(nonCurricularForm.startDate) >= new Date(nonCurricularForm.endDate)) {
        showAlert('시작일시는 종료일시보다 이전이어야 합니다.');
        return;
      }
    }

    showConfirm('비교과 프로그램 신청 기간을 저장하시겠습니까?', async () => {
      setIsSavingNon(true);
      const result = await saveApplicationPeriod('non_curricular', {
        startDate: toLocalISOString(nonCurricularForm.startDate),
        endDate: toLocalISOString(nonCurricularForm.endDate),
        isActive: nonCurricularForm.isActive
      });
      setIsSavingNon(false);

      if (result.success) {
        showAlert('✅ 비교과 프로그램 신청 기간이 저장되었습니다.');
      } else {
        showAlert(`저장 실패: ${result.error}`);
      }
    });
  };

  const statusBadge = (status) => {
    const colorMap = {
      gray: 'bg-gray-100 text-gray-700 border-gray-200',
      yellow: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      blue: 'bg-blue-100 text-blue-700 border-blue-200',
      green: 'bg-green-100 text-green-700 border-green-200',
      red: 'bg-red-100 text-red-700 border-red-200',
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold border ${colorMap[status.color]}`}>
        {status.label}
      </span>
    );
  };

  const formatDateDisplay = (isoString) => {
    if (!isoString) return '-';
    const d = new Date(isoString);
    return `${d.getFullYear()}.${String(d.getMonth()+1).padStart(2,'0')}.${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold mb-2">⏰ 신청 기간 설정</h1>
          <p className="text-indigo-100">전략산업 교과목 및 비교과 프로그램 신청 기간을 설정합니다</p>
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6">
          <div className="flex gap-3">
            <div className="text-blue-600 text-xl">ℹ️</div>
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">신청 기간 안내</p>
              <ul className="space-y-1">
                <li>• <strong>기간 활성화</strong>를 켜면 설정된 기간 외에는 학생이 제출/수정할 수 없습니다.</li>
                <li>• <strong>기간 활성화</strong>를 끄면 기간 제한 없이 항상 신청 가능합니다.</li>
                <li>• 종료일시는 해당 날짜의 <strong>23:59:59</strong>까지 허용됩니다.</li>
                <li>• 이미 승인된 제출은 기간과 무관하게 수정이 불가합니다.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 전략산업 교과목 신청 기간 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-blue-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">📚</div>
              <h2 className="text-lg font-bold text-gray-900">전략산업 교과목 신청 기간</h2>
            </div>
            {statusBadge(coreStatus)}
          </div>

          {/* 현재 설정 요약 */}
          {applicationPeriods.coreCourses.startDate && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              현재 설정: {formatDateDisplay(applicationPeriods.coreCourses.startDate)} ~ {formatDateDisplay(applicationPeriods.coreCourses.endDate)}
            </div>
          )}

          {/* 활성화 토글 */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-blue-50 rounded-lg">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={coreCoursesForm.isActive}
                onChange={(e) => setCoreCoursesForm({ ...coreCoursesForm, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-900">
              기간 제한 활성화 {coreCoursesForm.isActive ? '(켜짐 - 기간 외 신청 불가)' : '(꺼짐 - 기간 제한 없음)'}
            </span>
          </div>

          {/* 기간 입력 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신청 시작 일시
              </label>
              <input
                type="datetime-local"
                value={coreCoursesForm.startDate}
                onChange={(e) => setCoreCoursesForm({ ...coreCoursesForm, startDate: e.target.value })}
                disabled={!coreCoursesForm.isActive}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신청 종료 일시
              </label>
              <input
                type="datetime-local"
                value={coreCoursesForm.endDate}
                onChange={(e) => setCoreCoursesForm({ ...coreCoursesForm, endDate: e.target.value })}
                disabled={!coreCoursesForm.isActive}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button
            onClick={handleSaveCoreCourses}
            disabled={isSavingCore}
            className="mt-4 w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingCore ? '저장 중...' : '💾 저장'}
          </button>
        </div>

        {/* 비교과 프로그램 신청 기간 */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6 border-2 border-green-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="text-2xl">🎯</div>
              <h2 className="text-lg font-bold text-gray-900">비교과 프로그램 신청 기간</h2>
            </div>
            {statusBadge(nonStatus)}
          </div>

          {/* 현재 설정 요약 */}
          {applicationPeriods.nonCurricular.startDate && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg text-sm text-gray-600">
              현재 설정: {formatDateDisplay(applicationPeriods.nonCurricular.startDate)} ~ {formatDateDisplay(applicationPeriods.nonCurricular.endDate)}
            </div>
          )}

          {/* 활성화 토글 */}
          <div className="flex items-center gap-3 mb-4 p-3 bg-green-50 rounded-lg">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={nonCurricularForm.isActive}
                onChange={(e) => setNonCurricularForm({ ...nonCurricularForm, isActive: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
            <span className="text-sm font-medium text-gray-900">
              기간 제한 활성화 {nonCurricularForm.isActive ? '(켜짐 - 기간 외 신청 불가)' : '(꺼짐 - 기간 제한 없음)'}
            </span>
          </div>

          {/* 기간 입력 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신청 시작 일시
              </label>
              <input
                type="datetime-local"
                value={nonCurricularForm.startDate}
                onChange={(e) => setNonCurricularForm({ ...nonCurricularForm, startDate: e.target.value })}
                disabled={!nonCurricularForm.isActive}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                신청 종료 일시
              </label>
              <input
                type="datetime-local"
                value={nonCurricularForm.endDate}
                onChange={(e) => setNonCurricularForm({ ...nonCurricularForm, endDate: e.target.value })}
                disabled={!nonCurricularForm.isActive}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

          <button
            onClick={handleSaveNonCurricular}
            disabled={isSavingNon}
            className="mt-4 w-full px-6 py-3 bg-green-600 text-white rounded-lg font-bold hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSavingNon ? '저장 중...' : '💾 저장'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ApplicationPeriodSettingPage;
