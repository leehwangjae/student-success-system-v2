import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { usePurchaseContext } from '../../context/PurchaseContext';

const STATUS_LABELS = {
  submitted: '제출됨', reviewing: '검토중', needs_revision: '보완요청',
  approved: '승인됨', purchasing: '구매중', awaiting_receipt: '수령대기',
  receipt_review: '수령검토', closed: '완료', rejected: '반려됨',
  cancelled: '취소됨', draft: '임시저장'
};

const STATUS_COLOR = {
  draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-yellow-100 text-yellow-700', needs_revision: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700', purchasing: 'bg-teal-100 text-teal-700',
  awaiting_receipt: 'bg-indigo-100 text-indigo-700', receipt_review: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-800 text-white', rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500'
};

function PurchaseAdminPage() {
  const navigate = useNavigate();
  const { currentUser } = useAppContext();
  const {
    purchaseRequests, loadAllRequests, formatMoney,
    startReview, approveRequest, rejectRequest, requestRevision,
    registerPurchaseOrder, closePurchaseOrder, confirmReceipt, rejectReceipt,
    purchaseSettings, loadPurchaseSettings, getBudgetStatus
  } = usePurchaseContext();

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [modalMode, setModalMode] = useState(null); // 'review' | 'order' | 'receipt'
  const [formData, setFormData] = useState({});
  const [processing, setProcessing] = useState(false);
  const [budgetMap, setBudgetMap] = useState({});

  useEffect(() => {
    loadAllRequests({ fiscal_year: filterYear, status: filterStatus === 'all' ? undefined : filterStatus });
    loadPurchaseSettings();
  }, [filterStatus, filterYear]);

  useEffect(() => {
    loadBudgets();
  }, [purchaseSettings, purchaseRequests]);

  const loadBudgets = async () => {
    const years = [...new Set(purchaseSettings.map(s => s.fiscal_year))];
    const map = {};
    for (const y of years) {
      const depts = purchaseSettings.filter(s => s.fiscal_year === y).map(s => s.department_name);
      for (const dept of depts) {
        const key = `${y}__${dept}`;
        map[key] = await getBudgetStatus(y, dept);
      }
    }
    setBudgetMap(map);
  };

  const openModal = (request, mode) => {
    setSelectedRequest(request);
    setModalMode(mode);
    setFormData({});
  };

  const closeModal = () => {
    setSelectedRequest(null);
    setModalMode(null);
    setFormData({});
  };

  const reload = async () => {
    await loadAllRequests({ fiscal_year: filterYear, status: filterStatus === 'all' ? undefined : filterStatus });
    closeModal();
  };

  const handleStartReview = async (req) => {
    await startReview(req.id, currentUser.id, currentUser.name);
    await reload();
  };

  const handleApprove = async () => {
    if (!formData.approved_amount || Number(formData.approved_amount) <= 0) {
      alert('승인 금액을 입력하세요.');
      return;
    }
    setProcessing(true);
    await approveRequest(selectedRequest.id, currentUser.id, currentUser.name, Number(formData.approved_amount), formData.memo);
    setProcessing(false);
    await reload();
  };

  const handleReject = async () => {
    if (!formData.reason?.trim()) { alert('반려 사유를 입력하세요.'); return; }
    setProcessing(true);
    await rejectRequest(selectedRequest.id, currentUser.id, currentUser.name, formData.reason);
    setProcessing(false);
    await reload();
  };

  const handleRevision = async () => {
    if (!formData.reason?.trim()) { alert('보완 요청 내용을 입력하세요.'); return; }
    setProcessing(true);
    await requestRevision(selectedRequest.id, currentUser.id, currentUser.name, formData.reason);
    setProcessing(false);
    await reload();
  };

  const handleRegisterOrder = async () => {
    if (!formData.amount || Number(formData.amount) <= 0) { alert('구매금액을 입력하세요.'); return; }
    setProcessing(true);
    const { error } = await registerPurchaseOrder(selectedRequest.id, currentUser.id, currentUser.name, {
      supplier: formData.supplier,
      order_no: formData.order_no,
      purchased_at: formData.purchased_at,
      shipping_fee: Number(formData.shipping_fee || 0),
      amount: Number(formData.amount),
      memo: formData.memo
    });
    setProcessing(false);
    if (error) { alert('오류: ' + error.message); return; }
    await reload();
  };

  const handleCloseOrder = async (order) => {
    if (!window.confirm('구매를 완료 처리하시겠습니까?')) return;
    await closePurchaseOrder(order.id, selectedRequest.id, currentUser.id, currentUser.name, Number(formData.purchased_amount || order.amount));
    await reload();
  };

  const handleConfirmReceipt = async (receipt) => {
    if (!window.confirm('수령을 확인하고 처리를 종결하시겠습니까?')) return;
    await confirmReceipt(receipt.id, selectedRequest.id, currentUser.id, currentUser.name);
    await reload();
  };

  const statusFilters = [
    { key: 'all', label: '전체' },
    { key: 'submitted', label: '제출됨' },
    { key: 'reviewing', label: '검토중' },
    { key: 'needs_revision', label: '보완요청' },
    { key: 'approved', label: '승인됨' },
    { key: 'purchasing', label: '구매중' },
    { key: 'awaiting_receipt', label: '수령대기' },
    { key: 'receipt_review', label: '수령검토' },
    { key: 'closed', label: '완료' },
    { key: 'rejected', label: '반려됨' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/services')} className="text-gray-400 hover:text-gray-600">←</button>
            <h1 className="text-lg font-bold text-gray-800">구매지원 관리</h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => navigate('/purchase/admin/budget')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              예산 현황
            </button>
            <button
              onClick={() => navigate('/purchase/admin/settings')}
              className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 text-gray-600"
            >
              설정
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* 예산 요약 */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
          {purchaseSettings
            .filter(s => s.fiscal_year === filterYear && s.is_active)
            .slice(0, 4)
            .map(s => {
              const key = `${s.fiscal_year}__${s.department_name}`;
              const b = budgetMap[key] || { allocated: s.allocated_amount, reserved: 0, purchased: 0, available: s.allocated_amount };
              return (
                <div key={key} className="bg-white rounded-xl p-3 shadow-sm text-xs">
                  <div className="font-semibold text-gray-700 mb-1 truncate">{s.department_name}</div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between"><span className="text-gray-400">배정</span><span>{formatMoney(b.allocated)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">집행신청</span><span className="text-orange-600">{formatMoney(b.reserved)}</span></div>
                    <div className="flex justify-between"><span className="text-gray-400">집행</span><span className="text-red-600">{formatMoney(b.purchased)}</span></div>
                    <div className="flex justify-between font-semibold border-t border-gray-100 pt-0.5 mt-1">
                      <span>가용</span>
                      <span className={b.available < 0 ? 'text-red-600' : 'text-green-600'}>{formatMoney(b.available)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
        </div>

        {/* 필터 */}
        <div className="flex gap-2 mb-4 flex-wrap items-center">
          <select
            value={filterYear}
            onChange={e => setFilterYear(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
          >
            {['2025', '2026', '2027'].map(y => <option key={y} value={y}>{y}년</option>)}
          </select>
          {statusFilters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilterStatus(f.key)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                filterStatus === f.key ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
              }`}
            >
              {f.label}
              {f.key !== 'all' && purchaseRequests.filter(r => r.status === f.key).length > 0 && (
                <span className="ml-1 bg-red-500 text-white rounded-full px-1 text-xs">
                  {purchaseRequests.filter(r => r.status === f.key).length}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 신청 목록 */}
        {purchaseRequests.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400">해당 신청이 없습니다.</div>
        ) : (
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 bg-gray-50 border-b border-gray-100">
                  <th className="text-left py-3 px-4">신청번호</th>
                  <th className="text-left py-3 px-4">제목</th>
                  <th className="text-left py-3 px-4">신청자</th>
                  <th className="text-left py-3 px-4">학과</th>
                  <th className="text-right py-3 px-4">신청금액</th>
                  <th className="text-center py-3 px-4">상태</th>
                  <th className="text-center py-3 px-4">처리</th>
                </tr>
              </thead>
              <tbody>
                {purchaseRequests.map(req => (
                  <tr key={req.id} className="border-b border-gray-50 hover:bg-gray-50 cursor-pointer" onClick={() => navigate(`/purchase/${req.id}`)}>
                    <td className="py-3 px-4 text-xs text-gray-500">{req.request_no}</td>
                    <td className="py-3 px-4 font-medium max-w-xs truncate">{req.title}</td>
                    <td className="py-3 px-4 text-gray-600">{req.applicant?.name || req.professor_name}</td>
                    <td className="py-3 px-4 text-gray-500 text-xs">{req.department_name}</td>
                    <td className="py-3 px-4 text-right">{formatMoney(req.total_amount)}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLOR[req.status] || ''}`}>
                        {STATUS_LABELS[req.status] || req.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center" onClick={e => e.stopPropagation()}>
                      {req.status === 'submitted' && (
                        <button
                          onClick={() => handleStartReview(req)}
                          className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs hover:bg-yellow-200"
                        >검토시작</button>
                      )}
                      {req.status === 'reviewing' && (
                        <button
                          onClick={() => openModal(req, 'review')}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs hover:bg-blue-200"
                        >심사처리</button>
                      )}
                      {req.status === 'approved' && (
                        <button
                          onClick={() => openModal(req, 'order')}
                          className="px-2 py-1 bg-teal-100 text-teal-700 rounded text-xs hover:bg-teal-200"
                        >구매중 처리</button>
                      )}
                      {req.status === 'receipt_review' && (
                        <button
                          onClick={() => navigate(`/purchase/${req.id}`)}
                          className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-xs hover:bg-purple-200"
                        >수령검토</button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 모달 */}
      {modalMode && selectedRequest && (
        <Modal onClose={closeModal}>
          {modalMode === 'review' && (
            <ReviewModal
              req={selectedRequest}
              formData={formData}
              setFormData={setFormData}
              processing={processing}
              onApprove={handleApprove}
              onReject={handleReject}
              onRevision={handleRevision}
              formatMoney={formatMoney}
            />
          )}
          {modalMode === 'order' && (
            <OrderModal
              req={selectedRequest}
              formData={formData}
              setFormData={setFormData}
              processing={processing}
              onRegister={handleRegisterOrder}
              onClose={handleCloseOrder}
              formatMoney={formatMoney}
            />
          )}
          {modalMode === 'receipt' && (
            <ReceiptModal
              req={selectedRequest}
              onConfirm={handleConfirmReceipt}
            />
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── 모달 컴포넌트들 ──────────────────────────────────────────────────────────

function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
}

function ReviewModal({ req, formData, setFormData, processing, onApprove, onReject, onRevision, formatMoney }) {
  const [action, setAction] = useState('approve');

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-bold">심사 처리</h3>
      <div className="bg-gray-50 rounded-xl p-3 text-sm space-y-1">
        <p className="font-medium">{req.title}</p>
        <p className="text-gray-500">{req.professor_name} · {req.department_name}</p>
        <p className="text-green-700 font-semibold">신청금액: {formatMoney(req.total_amount)}원</p>
        <p className="text-gray-500 text-xs mt-1">{req.purpose}</p>
      </div>

      <div className="flex gap-2">
        {[{ k: 'approve', l: '✅ 승인' }, { k: 'revision', l: '📝 보완요청' }, { k: 'reject', l: '❌ 반려' }].map(a => (
          <button
            key={a.k}
            onClick={() => setAction(a.k)}
            className={`flex-1 py-2 rounded-lg text-sm font-medium ${action === a.k ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
          >{a.l}</button>
        ))}
      </div>

      {action === 'approve' && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">승인 금액 <span className="text-red-500">*</span></label>
            <input
              type="number"
              value={formData.approved_amount || ''}
              onChange={e => setFormData(p => ({ ...p, approved_amount: e.target.value }))}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
              placeholder={req.total_amount}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">관리자 메모</label>
            <textarea
              value={formData.memo || ''}
              onChange={e => setFormData(p => ({ ...p, memo: e.target.value }))}
              rows={2}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none"
              placeholder="신청자에게 전달할 내용"
            />
          </div>
          <button
            onClick={onApprove}
            disabled={processing}
            className="w-full py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
          >승인 확정</button>
        </div>
      )}

      {(action === 'revision' || action === 'reject') && (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              {action === 'revision' ? '보완 요청 내용' : '반려 사유'} <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.reason || ''}
              onChange={e => setFormData(p => ({ ...p, reason: e.target.value }))}
              rows={3}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none"
              placeholder={action === 'revision' ? '보완이 필요한 내용을 기재하세요' : '반려 사유를 기재하세요'}
            />
          </div>
          <button
            onClick={action === 'revision' ? onRevision : onReject}
            disabled={processing}
            className={`w-full py-3 rounded-xl font-semibold disabled:opacity-50 ${action === 'revision' ? 'bg-orange-500 hover:bg-orange-600 text-white' : 'bg-red-500 hover:bg-red-600 text-white'}`}
          >
            {processing ? '처리중...' : action === 'revision' ? '보완 요청' : '반려'}
          </button>
        </div>
      )}
    </div>
  );
}

function OrderModal({ req, formData, setFormData, processing, onRegister, onClose, formatMoney }) {
  const hasOrder = req.orders?.length > 0;

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-bold">구매 등록</h3>
      <div className="bg-gray-50 rounded-xl p-3 text-sm">
        <p className="font-medium">{req.title}</p>
        <p className="text-green-700 font-semibold">승인금액: {formatMoney(req.approved_amount)}원</p>
      </div>

      {hasOrder && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700">기존 구매 기록</p>
          {req.orders.map((o, i) => (
            <div key={i} className="bg-teal-50 rounded-lg p-3 text-sm flex items-center justify-between">
              <div>
                <span className="font-medium">{o.supplier || '(판매처)'}</span>
                <span className="ml-2 text-teal-700">{formatMoney(o.amount)}원</span>
              </div>
              {!o.is_closed && (
                <button
                  onClick={() => onClose(o)}
                  className="px-2 py-1 bg-teal-600 text-white rounded text-xs hover:bg-teal-700"
                >구매완료</button>
              )}
            </div>
          ))}
        </div>
      )}

      <p className="text-sm font-semibold text-gray-700">새 구매 등록</p>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <label className="block text-xs text-gray-500 mb-1">판매처</label>
          <input type="text" value={formData.supplier || ''} onChange={e => setFormData(p => ({...p, supplier: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="쇼핑몰명" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">주문번호</label>
          <input type="text" value={formData.order_no || ''} onChange={e => setFormData(p => ({...p, order_no: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="주문번호" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">구매일</label>
          <input type="date" value={formData.purchased_at || ''} onChange={e => setFormData(p => ({...p, purchased_at: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">구매금액 <span className="text-red-500">*</span></label>
          <input type="number" value={formData.amount || ''} onChange={e => setFormData(p => ({...p, amount: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">배송비</label>
          <input type="number" value={formData.shipping_fee || ''} onChange={e => setFormData(p => ({...p, shipping_fee: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="0" />
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">메모</label>
          <input type="text" value={formData.memo || ''} onChange={e => setFormData(p => ({...p, memo: e.target.value}))} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm" placeholder="메모" />
        </div>
      </div>
      <button
        onClick={onRegister}
        disabled={processing}
        className="w-full py-3 bg-teal-600 text-white rounded-xl font-semibold hover:bg-teal-700 disabled:opacity-50"
      >{processing ? '처리중...' : '구매 등록'}</button>
    </div>
  );
}

function ReceiptModal({ req, onConfirm }) {
  const receipts = req.receipts || [];

  return (
    <div className="p-6 space-y-4">
      <h3 className="text-lg font-bold">수령 확인</h3>
      {receipts.length === 0 ? (
        <p className="text-gray-400 text-sm">수령 보고 내역이 없습니다.</p>
      ) : (
        receipts.map((r, i) => (
          <div key={i} className="bg-purple-50 rounded-xl p-4 space-y-2">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-medium">수령일: {r.received_at || '-'}</p>
                {r.notes && <p className="text-xs text-gray-500 mt-0.5">{r.notes}</p>}
              </div>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                r.review_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                r.review_status === 'needs_revision' ? 'bg-orange-100 text-orange-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {r.review_status === 'confirmed' ? '확인완료' : r.review_status === 'needs_revision' ? '보완필요' : '검토대기'}
              </span>
            </div>
            {r.review_status === 'pending' && (
              <button
                onClick={() => onConfirm(r)}
                className="w-full py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
              >수령 확인 및 처리 종결</button>
            )}
          </div>
        ))
      )}
    </div>
  );
}

export default PurchaseAdminPage;
