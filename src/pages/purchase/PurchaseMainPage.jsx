import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { usePurchaseContext } from '../../context/PurchaseContext';

const STATUS_LABELS = {
  draft: { label: '임시저장', color: 'bg-gray-100 text-gray-600' },
  submitted: { label: '제출됨', color: 'bg-blue-100 text-blue-700' },
  reviewing: { label: '검토중', color: 'bg-yellow-100 text-yellow-700' },
  needs_revision: { label: '보완요청', color: 'bg-orange-100 text-orange-700' },
  approved: { label: '승인됨', color: 'bg-green-100 text-green-700' },
  purchasing: { label: '구매중', color: 'bg-teal-100 text-teal-700' },
  awaiting_receipt: { label: '수령대기', color: 'bg-indigo-100 text-indigo-700' },
  receipt_review: { label: '수령검토', color: 'bg-purple-100 text-purple-700' },
  closed: { label: '완료', color: 'bg-gray-800 text-white' },
  rejected: { label: '반려', color: 'bg-red-100 text-red-700' },
  cancelled: { label: '취소됨', color: 'bg-gray-100 text-gray-500' }
};

function PurchaseMainPage() {
  const navigate = useNavigate();
  const { currentUser } = useAppContext();
  const { purchaseRequests, loadMyRequests, formatMoney, purchaseSettings, loadPurchaseSettings } = usePurchaseContext();
  const [activeFilter, setActiveFilter] = useState('all');

  useEffect(() => {
    if (currentUser?.id) {
      loadMyRequests(currentUser.id);
      loadPurchaseSettings();
    }
  }, [currentUser?.id]);

  const filtered = activeFilter === 'all'
    ? purchaseRequests
    : purchaseRequests.filter(r => r.status === activeFilter);

  const stats = {
    total: purchaseRequests.length,
    active: purchaseRequests.filter(r => !['closed', 'rejected', 'cancelled'].includes(r.status)).length,
    approved: purchaseRequests.filter(r => r.status === 'approved').length,
    closed: purchaseRequests.filter(r => r.status === 'closed').length
  };

  // 현재 연도 신청 가능 여부 확인
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const activeSetting = purchaseSettings.find(s => {
    if (!s.is_active) return false;
    if (s.application_start_at && new Date(s.application_start_at) > now) return false;
    if (s.application_end_at && new Date(s.application_end_at) < now) return false;
    return true;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 헤더 */}
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate('/services')}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              title="서비스 선택으로 돌아가기"
            >
              ←
            </button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">실험실습재료 구매 지원</h1>
              <p className="text-xs text-gray-500">{currentUser?.name} ({currentUser?.lab_name || ''})</p>
            </div>
          </div>
          <button
            onClick={() => navigate('/purchase/new')}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium text-sm transition-colors"
          >
            <span>+</span> 구매 신청
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* 신청 기간 안내 */}
        {!activeSetting && (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-xl text-sm text-yellow-700">
            ⚠️ 현재 신청 가능 기간이 아닙니다. 관리자에게 문의하세요.
          </div>
        )}

        {/* 통계 카드 */}
        <div className="grid grid-cols-4 gap-3 mb-6">
          {[
            { label: '전체', value: stats.total, color: 'text-gray-800' },
            { label: '진행중', value: stats.active, color: 'text-blue-600' },
            { label: '승인됨', value: stats.approved, color: 'text-green-600' },
            { label: '완료', value: stats.closed, color: 'text-gray-500' }
          ].map(s => (
            <div key={s.label} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </div>
          ))}
        </div>

        {/* 필터 탭 */}
        <div className="flex gap-2 mb-4 flex-wrap">
          {[
            { key: 'all', label: '전체' },
            { key: 'draft', label: '임시저장' },
            { key: 'submitted', label: '제출됨' },
            { key: 'reviewing', label: '검토중' },
            { key: 'needs_revision', label: '보완요청' },
            { key: 'approved', label: '승인됨' },
            { key: 'purchasing', label: '구매중' },
            { key: 'closed', label: '완료' }
          ].map(f => (
            <button
              key={f.key}
              onClick={() => setActiveFilter(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                activeFilter === f.key
                  ? 'bg-green-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 신청 목록 */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
            <div className="text-4xl mb-3">🧪</div>
            <p className="text-gray-500 mb-4">
              {activeFilter === 'all' ? '아직 구매 신청 내역이 없습니다.' : '해당 상태의 신청이 없습니다.'}
            </p>
            <button
              onClick={() => navigate('/purchase/new')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
            >
              첫 구매 신청하기
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(req => (
              <RequestCard
                key={req.id}
                req={req}
                formatMoney={formatMoney}
                onClick={() => navigate(`/purchase/${req.id}`)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RequestCard({ req, formatMoney, onClick }) {
  const status = STATUS_LABELS[req.status] || { label: req.status, color: 'bg-gray-100 text-gray-600' };
  const itemCount = req.items?.length || 0;
  const showReceiptBadge = req.status === 'purchasing';

  return (
    <div
      onClick={onClick}
      className="bg-white rounded-xl shadow-sm p-4 hover:shadow-md cursor-pointer transition-shadow border border-gray-100"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${status.color}`}>
              {status.label}
            </span>
            {showReceiptBadge && (
              <span className="text-xs px-2 py-0.5 rounded-full font-medium bg-indigo-100 text-indigo-700">
                수령 대기
              </span>
            )}
            <span className="text-xs text-gray-400">{req.request_no}</span>
          </div>
          <h3 className="font-semibold text-gray-800 truncate">{req.title}</h3>
          <p className="text-xs text-gray-500 mt-1">
            {req.department_name} · {req.lab_name} · 품목 {itemCount}건
          </p>
        </div>
        <div className="text-right shrink-0">
          <div className="text-sm font-bold text-gray-800">{formatMoney(req.total_amount)}원</div>
          {req.approved_amount && req.approved_amount !== req.total_amount && (
            <div className="text-xs text-green-600">승인 {formatMoney(req.approved_amount)}원</div>
          )}
          <div className="text-xs text-gray-400 mt-1">
            {new Date(req.created_at).toLocaleDateString('ko-KR')}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PurchaseMainPage;
