import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useModalStore } from '../../hooks/useModal';

const SURVEY_ITEMS = [
  { id: 'overall', label: '시스템 전반 만족도' },
  { id: 'inputEfficiency', label: '시스템 입력 효율성' },
  { id: 'systemOrganization', label: '시스템 운영의 체계성' },
  { id: 'usability', label: '시스템 활용 편의성' },
  { id: 'uiDesign', label: 'UI 및 디자인 만족 정도' },
  { id: 'staffSupport', label: '담당자 지원 및 안내 만족도' },
  { id: 'futureIntent', label: '향후 시스템 활용 의향' },
];

const SCORE_LABELS = {
  1: '매우 불만족',
  2: '불만족',
  3: '보통',
  4: '만족',
  5: '매우 만족',
};

function SurveyPage() {
  const { currentUser, submitSurvey, getSurveySubmission } = useAppContext();
  const { showAlert, showConfirm } = useModalStore();

  const [scores, setScores] = useState(() =>
    Object.fromEntries(SURVEY_ITEMS.map(item => [item.id, null]))
  );
  const [notes, setNotes] = useState(() =>
    Object.fromEntries(SURVEY_ITEMS.map(item => [item.id, '']))
  );
  const [generalOpinion, setGeneralOpinion] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;
    const load = async () => {
      setIsLoading(true);
      const submission = await getSurveySubmission(currentUser.id);
      if (submission) {
        setExistingSubmission(submission);
        setScores(submission.scores || {});
        setNotes(submission.notes || {});
        setGeneralOpinion(submission.generalOpinion || '');
      }
      setIsLoading(false);
    };
    load();
  }, [currentUser]);

  const handleScore = (itemId, score) => {
    setScores(prev => ({ ...prev, [itemId]: score }));
  };

  const handleNote = (itemId, value) => {
    setNotes(prev => ({ ...prev, [itemId]: value }));
  };

  const handleSubmit = () => {
    const unanswered = SURVEY_ITEMS.filter(item => scores[item.id] === null);
    if (unanswered.length > 0) {
      showAlert(`미응답 항목이 있습니다: ${unanswered.map(i => i.label).join(', ')}`);
      return;
    }

    showConfirm(
      existingSubmission ? '이미 제출한 설문이 있습니다. 수정하시겠습니까?' : '설문을 제출하시겠습니까?',
      async () => {
        setIsSubmitting(true);
        try {
          const result = await submitSurvey({
            studentId: currentUser.id,
            scores,
            notes,
            generalOpinion,
          });
          if (result.success) {
            showAlert('설문이 제출되었습니다. 감사합니다!');
            const updated = await getSurveySubmission(currentUser.id);
            setExistingSubmission(updated);
          } else {
            showAlert(`제출 실패: ${result.error}`);
          }
        } finally {
          setIsSubmitting(false);
        }
      }
    );
  };

  if (!currentUser) return <div className="p-6">로그인이 필요합니다.</div>;
  if (isLoading) return <div className="p-6 text-center text-gray-500">로딩 중...</div>;

  const avgScore = (() => {
    const filled = SURVEY_ITEMS.map(i => scores[i.id]).filter(v => v !== null);
    if (filled.length === 0) return null;
    return (filled.reduce((a, b) => a + b, 0) / filled.length).toFixed(1);
  })();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">

        {/* 헤더 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">만족도 조사 설문지</h1>
          <p className="text-gray-500 italic">학생성공지수 관리 시스템 운영 만족도 조사</p>
        </div>

        {/* 조사 목적 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-4">
          <h2 className="font-bold text-gray-900 mb-2">1. 조사 목적</h2>
          <p className="text-gray-700 leading-relaxed text-sm">
            본 조사는 학생성공지수 관리 시스템 운영에 대한 만족도와 개선 의견을 파악하여 향후 운영 개선 및 질 제고를 위한 기초자료로 활용하고자 실시함.
          </p>
        </div>

        {/* 응답 방법 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="font-bold text-gray-900 mb-2">2. 응답 방법</h2>
          <p className="text-gray-700 text-sm leading-relaxed mb-3">
            아래 각 문항에 대하여 가장 적절하다고 생각하는 점수에 표시함.
          </p>
          <div className="flex flex-wrap gap-2">
            {[1, 2, 3, 4, 5].map(s => (
              <span key={s} className="text-xs px-3 py-1 bg-gray-100 rounded-full text-gray-700">
                {s}점 {SCORE_LABELS[s]}
              </span>
            ))}
          </div>
        </div>

        {/* 제출 완료 배너 */}
        {existingSubmission && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <span className="text-green-600 text-xl">✅</span>
            <div className="text-sm text-green-800">
              <span className="font-semibold">설문을 제출하셨습니다.</span>
              <span className="ml-2 text-green-600">
                제출일: {new Date(existingSubmission.submittedAt).toLocaleDateString('ko-KR')}
              </span>
              <p className="mt-0.5">내용을 수정하여 재제출할 수 있습니다.</p>
            </div>
          </div>
        )}

        {/* 설문 문항 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden mb-6">
          <div className="bg-gray-50 px-6 py-3 border-b grid grid-cols-12 text-xs font-semibold text-gray-600 text-center">
            <div className="col-span-4 text-left">문항</div>
            <div className="col-span-1">1점</div>
            <div className="col-span-1">2점</div>
            <div className="col-span-1">3점</div>
            <div className="col-span-1">4점</div>
            <div className="col-span-1">5점</div>
            <div className="col-span-3">비고</div>
          </div>

          {SURVEY_ITEMS.map((item, idx) => (
            <div
              key={item.id}
              className={`px-6 py-4 grid grid-cols-12 items-center gap-2 ${
                idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'
              } border-b border-gray-100 last:border-b-0`}
            >
              {/* 문항명 */}
              <div className="col-span-4 text-sm font-medium text-gray-800 leading-tight">
                {item.label}
              </div>

              {/* 1~5점 라디오 */}
              {[1, 2, 3, 4, 5].map(score => (
                <div key={score} className="col-span-1 flex justify-center">
                  <label className="cursor-pointer group">
                    <input
                      type="radio"
                      name={item.id}
                      value={score}
                      checked={scores[item.id] === score}
                      onChange={() => handleScore(item.id, score)}
                      className="hidden"
                    />
                    <div
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all ${
                        scores[item.id] === score
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'border-gray-300 hover:border-blue-400 bg-white'
                      }`}
                      title={SCORE_LABELS[score]}
                    >
                      {scores[item.id] === score && (
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </div>
                  </label>
                </div>
              ))}

              {/* 비고 */}
              <div className="col-span-3">
                <input
                  type="text"
                  value={notes[item.id]}
                  onChange={e => handleNote(item.id, e.target.value)}
                  placeholder="선택사항"
                  className="w-full text-xs border border-gray-200 rounded px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-blue-400"
                  maxLength={100}
                />
              </div>
            </div>
          ))}
        </div>

        {/* 점수 요약 */}
        {avgScore && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div className="text-sm text-blue-800">
              <span className="font-semibold">현재 평균 점수</span>
              <span className="text-blue-600 ml-2">(응답 {SURVEY_ITEMS.filter(i => scores[i.id] !== null).length}/{SURVEY_ITEMS.length}문항)</span>
            </div>
            <div className="text-2xl font-bold text-blue-700">{avgScore}점</div>
          </div>
        )}

        {/* 종합 의견 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-bold text-gray-900 mb-1">종합 의견 <span className="text-xs font-normal text-gray-400">(선택)</span></h3>
          <p className="text-xs text-gray-500 mb-3">시스템 개선을 위한 자유로운 의견을 남겨주세요.</p>
          <textarea
            value={generalOpinion}
            onChange={e => setGeneralOpinion(e.target.value)}
            rows={4}
            maxLength={500}
            placeholder="개선 사항, 건의 사항 등 자유롭게 작성해 주세요."
            className="w-full border border-gray-200 rounded-lg px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
          />
          <div className="text-right text-xs text-gray-400 mt-1">{generalOpinion.length}/500</div>
        </div>

        {/* 제출 버튼 */}
        <button
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl text-base transition-colors"
        >
          {isSubmitting ? '제출 중...' : existingSubmission ? '✏️ 수정 제출' : '💾 제출하기'}
        </button>

        {/* 안내 */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mt-4 text-xs text-gray-500">
          <ul className="space-y-1">
            <li>• 모든 문항(1~7번)에 응답해야 제출 가능합니다.</li>
            <li>• 제출 후에도 수정하여 재제출할 수 있습니다.</li>
            <li>• 응답 내용은 시스템 운영 개선을 위한 목적으로만 활용됩니다.</li>
          </ul>
        </div>

      </div>
    </div>
  );
}

export default SurveyPage;
