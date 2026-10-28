import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { usePurchaseContext } from '../../context/PurchaseContext';

const STATUS_LABELS = {
  draft: '임시저장', submitted: '제출됨', reviewing: '검토중',
  needs_revision: '보완요청', approved: '승인됨', purchasing: '구매중',
  awaiting_receipt: '수령대기', receipt_review: '수령검토',
  closed: '완료', rejected: '반려됨', cancelled: '취소됨'
};

const STATUS_COLOR = {
  draft: 'bg-gray-100 text-gray-600', submitted: 'bg-blue-100 text-blue-700',
  reviewing: 'bg-yellow-100 text-yellow-700', needs_revision: 'bg-orange-100 text-orange-700',
  approved: 'bg-green-100 text-green-700', purchasing: 'bg-teal-100 text-teal-700',
  awaiting_receipt: 'bg-indigo-100 text-indigo-700', receipt_review: 'bg-purple-100 text-purple-700',
  closed: 'bg-gray-800 text-white', rejected: 'bg-red-100 text-red-700',
  cancelled: 'bg-gray-100 text-gray-500'
};

function PurchaseDetailPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { currentUser } = useAppContext();
  const {
    getRequestDetail, submitRequest, cancelRequest, resubmitRequest,
    submitReceipt, confirmReceipt, rejectReceipt, uploadAttachment, getAttachmentUrl, formatMoney
  } = usePurchaseContext();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showReceiptForm, setShowReceiptForm] = useState(false);
  const [receiptForm, setReceiptForm] = useState({ received_at: '', notes: '' });
  const [receiptFile, setReceiptFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [receiptPhotoUrls, setReceiptPhotoUrls] = useState({});
  const fileRef = useRef();

  const isAdmin = currentUser?.role === 'admin' || currentUser?.role === 'master';

  useEffect(() => {
    load();
  }, [id]);

  const load = async () => {
    setLoading(true);
    const { data } = await getRequestDetail(id);
    setRequest(data);
    // receipt_photo 첨부파일 signed URL 미리 로드
    if (data?.attachments) {
      const photos = data.attachments.filter(a => a.attachment_type === 'receipt_photo');
      const urls = {};
      for (const photo of photos) {
        if (photo.storage_path) {
          urls[photo.id] = await getAttachmentUrl(photo.storage_path);
        }
      }
      setReceiptPhotoUrls(urls);
    }
    setLoading(false);
  };

  if (loading) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">불러오는 중...</div>;
  }
  if (!request) {
    return <div className="min-h-screen bg-gray-50 flex items-center justify-center text-gray-500">신청 정보를 찾을 수 없습니다.</div>;
  }

  const status = request.status;
  const canSubmit = status === 'draft';
  const canCancel = ['draft', 'submitted'].includes(status);
  const canResubmit = status === 'needs_revision';
  const canEdit = status === 'draft' || status === 'needs_revision';
  // 신청자: 구매중(purchasing) 상태에서 수령 보고 가능
  const canSubmitReceipt = status === 'purchasing' && !isAdmin;

  const handleSubmit = async () => {
    if (!window.confirm('신청서를 제출하시겠습니까?')) return;
    await submitRequest(id, currentUser.id, currentUser.name);
    await load();
  };

  const handleCancel = async () => {
    if (!window.confirm('신청을 취소하시겠습니까?')) return;
    await cancelRequest(id, currentUser.id, currentUser.name);
    await load();
  };

  const handleResubmit = async () => {
    if (!window.confirm('보완 후 재제출하시겠습니까?')) return;
    await resubmitRequest(id, currentUser.id, currentUser.name);
    await load();
  };

  const handleReceiptSubmit = async () => {
    if (!receiptFile) { alert('수령 사진을 첨부하세요.'); return; }
    if (!receiptForm.received_at) { alert('수령일을 입력하세요.'); return; }

    setUploading(true);
    try {
      // 수령 보고 저장 (첫 주문 기준)
      const firstOrder = request.orders?.[0];
      if (!firstOrder) { alert('구매 기록이 없습니다.'); return; }

      const { data: receipt, error } = await submitReceipt(
        id, firstOrder.id, currentUser.id, currentUser.name, receiptForm
      );
      if (error) throw error;

      // 사진 업로드
      const { error: uploadErr } = await uploadAttachment(receiptFile, id, currentUser.id, 'receipt_photo', firstOrder.id, receipt.id);
      if (uploadErr) throw uploadErr;
      alert('수령 보고가 제출되었습니다.');
      setShowReceiptForm(false);
      await load();
    } catch (err) {
      alert('오류: ' + (err.message || String(err)));
    } finally {
      setUploading(false);
    }
  };

  const handleConfirmReceipt = async (receipt) => {
    if (!window.confirm('수령을 확인하고 처리를 완료하시겠습니까?')) return;
    const { error } = await confirmReceipt(receipt.id, id, currentUser.id, currentUser.name);
    if (error) { alert('오류: ' + error.message); return; }
    await load();
  };

  const handleRejectReceipt = async (receipt) => {
    if (!rejectReason.trim()) { alert('반려 사유를 입력하세요.'); return; }
    const { error } = await rejectReceipt(receipt.id, id, currentUser.id, currentUser.name, rejectReason);
    if (error) { alert('오류: ' + error.message); return; }
    setShowRejectInput(false);
    setRejectReason('');
    await load();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate(isAdmin ? '/purchase/admin' : '/purchase')} className="text-gray-400 hover:text-gray-600">←</button>
            <div>
              <h1 className="text-lg font-bold text-gray-800">구매 신청 상세</h1>
              <p className="text-xs text-gray-500">{request.request_no}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${STATUS_COLOR[status] || 'bg-gray-100 text-gray-600'}`}>
              {STATUS_LABELS[status] || status}
            </span>
            {status === 'purchasing' && !isAdmin && (
              <span className="text-xs px-2.5 py-1 rounded-full font-medium bg-indigo-100 text-indigo-700">
                수령 대기
              </span>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* 보완 요청 사유 */}
        {status === 'needs_revision' && request.revision_reason && (
          <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-orange-700 mb-1">📝 보완 요청 사항</p>
            <p className="text-sm text-orange-600">{request.revision_reason}</p>
          </div>
        )}

        {/* 반려 사유 */}
        {status === 'rejected' && request.rejection_reason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-red-700 mb-1">❌ 반려 사유</p>
            <p className="text-sm text-red-600">{request.rejection_reason}</p>
          </div>
        )}

        {/* 기본 정보 */}
        <Card title="기본 정보">
          <Grid2>
            <Info label="신청번호" value={request.request_no} />
            <Info label="신청일" value={new Date(request.created_at).toLocaleDateString('ko-KR')} />
            <Info label="학과" value={request.department_name} />
            <Info label="연구실" value={request.lab_name} />
            <Info label="신청자" value={request.professor_name} />
            <Info label="상태" value={STATUS_LABELS[status] || status} />
          </Grid2>
          <Info label="신청 제목" value={request.title} />
          <Info label="활용 목적" value={request.purpose} />
        </Card>

        {/* 수령 정보 */}
        <Card title="수령 정보">
          <Grid2>
            <Info label="수령인" value={request.delivery_name} />
            <Info label="연락처" value={request.delivery_phone} />
          </Grid2>
          <Info label="수령 장소" value={request.delivery_address} />
        </Card>

        {/* 품목 */}
        <Card title="구매 품목">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-gray-500 border-b border-gray-100">
                  <th className="py-2 pr-2">품목명</th>
                  <th className="py-2 pr-2">규격</th>
                  <th className="py-2 pr-2 text-right">수량</th>
                  <th className="py-2 pr-2">단위</th>
                  <th className="py-2 pr-2 text-right">단가</th>
                  <th className="py-2 text-right">소계</th>
                </tr>
              </thead>
              <tbody>
                {(request.items || []).map((item, i) => (
                  <tr key={i} className="border-b border-gray-50">
                    <td className="py-2 pr-2 font-medium">{item.item_name}</td>
                    <td className="py-2 pr-2 text-gray-500 text-xs">{item.specification || '-'}</td>
                    <td className="py-2 pr-2 text-right">{item.quantity}</td>
                    <td className="py-2 pr-2 text-gray-500">{item.unit}</td>
                    <td className="py-2 pr-2 text-right">{formatMoney(item.unit_price)}</td>
                    <td className="py-2 text-right font-semibold">{formatMoney(item.total_price)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200">
                  <td colSpan={5} className="py-2 font-semibold text-gray-700">합계</td>
                  <td className="py-2 text-right font-bold text-green-700">{formatMoney(request.total_amount)}원</td>
                </tr>
                {request.approved_amount && (
                  <tr>
                    <td colSpan={5} className="py-1 text-sm text-green-700">승인 금액</td>
                    <td className="py-1 text-right text-sm font-semibold text-green-700">{formatMoney(request.approved_amount)}원</td>
                  </tr>
                )}
              </tfoot>
            </table>
          </div>
        </Card>

        {/* 구매 기록 */}
        {(request.orders || []).length > 0 && (
          <Card title="구매 기록">
            {request.orders.map((order, i) => (
              <div key={i} className="bg-gray-50 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="font-medium">{order.supplier || '(판매처 미입력)'}</span>
                  <span className="font-bold text-teal-700">{formatMoney(order.amount)}원</span>
                </div>
                {order.purchased_at && <p className="text-gray-500 text-xs">구매일: {order.purchased_at}</p>}
                {order.order_no && <p className="text-gray-500 text-xs">주문번호: {order.order_no}</p>}
                {order.memo && <p className="text-gray-500 text-xs">{order.memo}</p>}
                <p className="text-xs text-gray-400">{order.is_closed ? '✅ 구매완료' : '⏳ 구매중'}</p>
              </div>
            ))}
          </Card>
        )}

        {/* 첨부파일 */}
        {(request.attachments || []).length > 0 && (
          <Card title="첨부파일">
            {request.attachments.map((att, i) => {
              const typeLabel = att.attachment_type === 'estimate' ? '견적서' : att.attachment_type === 'receipt_photo' ? '수령사진' : '구매증빙';
              const url = receiptPhotoUrls[att.id];
              return (
                <div key={i} className="flex items-center justify-between text-sm py-1.5 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700 truncate">{att.file_name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400">{typeLabel}</span>
                    {url ? (
                      <a href={url} target="_blank" rel="noreferrer"
                        className="text-xs text-indigo-600 hover:text-indigo-800 font-medium">
                        보기
                      </a>
                    ) : att.storage_path ? (
                      <span className="text-xs text-gray-300">로딩중</span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </Card>
        )}

        {/* 신청자: 제출된 수령 보고 내역 (receipt_review 또는 반려 후 재제출 대기) */}
        {!isAdmin && (request.receipts || []).length > 0 && (
          <Card title="📦 제출된 수령 보고">
            {[...(request.receipts || [])].reverse().map((r, i) => {
              const photos = (request.attachments || []).filter(
                a => a.attachment_type === 'receipt_photo' && a.receipt_id === r.id
              );
              return (
                <div key={i} className={`rounded-xl p-3 text-sm space-y-2 ${
                  r.review_status === 'confirmed' ? 'bg-green-50' :
                  r.review_status === 'needs_revision' ? 'bg-orange-50' : 'bg-indigo-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium">수령일: {r.received_at || '-'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      r.review_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      r.review_status === 'needs_revision' ? 'bg-orange-100 text-orange-700' :
                      'bg-indigo-100 text-indigo-700'
                    }`}>
                      {r.review_status === 'confirmed' ? '✅ 확인완료' :
                       r.review_status === 'needs_revision' ? '❌ 반려됨' : '⏳ 검토대기'}
                    </span>
                  </div>
                  {r.notes && <p className="text-gray-500 text-xs">비고: {r.notes}</p>}
                  {photos.length > 0 ? photos.map(photo => {
                    const url = receiptPhotoUrls[photo.id];
                    return (
                      <div key={photo.id} className="rounded-lg overflow-hidden border border-indigo-200">
                        {url ? (
                          <a href={url} target="_blank" rel="noreferrer">
                            <img src={url} alt="수령 사진" className="w-full max-h-48 object-contain bg-white" />
                          </a>
                        ) : (
                          <p className="text-xs text-gray-400 p-2">{photo.file_name}</p>
                        )}
                      </div>
                    );
                  }) : (
                    <p className="text-xs text-gray-400">첨부 사진 없음</p>
                  )}
                </div>
              );
            })}
          </Card>
        )}

        {/* 신청자: 구매중 상태에서 수령 보고 */}
        {canSubmitReceipt && (
          <Card title="📦 물품 수령 보고">
            <p className="text-xs text-gray-500 mb-3">물품을 수령하신 후 수령 사진을 첨부하여 제출해주세요.</p>
            {!showReceiptForm ? (
              <button
                onClick={() => setShowReceiptForm(true)}
                className="w-full py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700"
              >
                수령 사진 첨부 및 제출
              </button>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">수령일 <span className="text-red-500">*</span></label>
                  <input
                    type="date"
                    value={receiptForm.received_at}
                    onChange={e => setReceiptForm(p => ({ ...p, received_at: e.target.value }))}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">비고</label>
                  <textarea
                    value={receiptForm.notes}
                    onChange={e => setReceiptForm(p => ({ ...p, notes: e.target.value }))}
                    rows={2}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm resize-none"
                    placeholder="특이사항 (선택)"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">수령 사진 <span className="text-red-500">*</span></label>
                  <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-indigo-400 transition-colors">
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/jpg"
                      onChange={e => setReceiptFile(e.target.files[0])}
                      className="hidden"
                      id="receipt-file"
                    />
                    <label htmlFor="receipt-file" className="cursor-pointer">
                      {receiptFile ? (
                        <p className="text-sm text-indigo-600 font-medium">📎 {receiptFile.name}</p>
                      ) : (
                        <>
                          <p className="text-gray-400 text-sm">📷 사진을 선택하세요</p>
                          <p className="text-xs text-gray-400 mt-1">JPG, PNG 지원</p>
                        </>
                      )}
                    </label>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowReceiptForm(false); setReceiptFile(null); }}
                    className="flex-1 py-2 border border-gray-300 text-gray-600 rounded-lg text-sm"
                  >취소</button>
                  <button
                    onClick={handleReceiptSubmit}
                    disabled={uploading}
                    className="flex-1 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                  >
                    {uploading ? '업로드중...' : '제출'}
                  </button>
                </div>
              </div>
            )}
          </Card>
        )}

        {/* 관리자: 수령 검토 (receipt_review 상태) */}
        {isAdmin && status === 'receipt_review' && (request.receipts || []).length > 0 && (
          <Card title="📋 수령 보고 검토">
            {request.receipts.map((r, i) => (
              <div key={i} className="space-y-3">
                <div className="bg-purple-50 rounded-xl p-3 text-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">수령일: {r.received_at || '-'}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      r.review_status === 'confirmed' ? 'bg-green-100 text-green-700' :
                      r.review_status === 'needs_revision' ? 'bg-orange-100 text-orange-700' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {r.review_status === 'confirmed' ? '확인완료' : r.review_status === 'needs_revision' ? '반려됨' : '검토대기'}
                    </span>
                  </div>
                  {r.notes && <p className="text-gray-500 text-xs">비고: {r.notes}</p>}
                  {/* 수령 사진 표시 */}
                  {(() => {
                    const photos = (request.attachments || []).filter(
                      a => a.attachment_type === 'receipt_photo' && a.receipt_id === r.id
                    );
                    if (photos.length === 0) return (
                      <p className="text-xs text-orange-500">⚠️ 첨부된 수령 사진이 없습니다.</p>
                    );
                    return (
                      <div className="space-y-2">
                        <p className="text-xs font-medium text-gray-600">수령 사진</p>
                        {photos.map(photo => {
                          const url = receiptPhotoUrls[photo.id];
                          return (
                            <div key={photo.id} className="rounded-lg overflow-hidden border border-purple-200">
                              {url ? (
                                <a href={url} target="_blank" rel="noreferrer">
                                  <img src={url} alt="수령 사진" className="w-full max-h-64 object-contain bg-white" />
                                </a>
                              ) : (
                                <p className="text-xs text-gray-400 p-2">{photo.file_name} (URL 로딩중...)</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}
                </div>

                {r.review_status === 'pending' && (
                  <div className="space-y-2">
                    {/* 완료 버튼 */}
                    <button
                      onClick={() => handleConfirmReceipt(r)}
                      className="w-full py-2.5 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700"
                    >
                      ✅ 수령 확인 완료 (처리 종결)
                    </button>

                    {/* 반려 버튼 */}
                    {!showRejectInput ? (
                      <button
                        onClick={() => setShowRejectInput(true)}
                        className="w-full py-2.5 bg-red-50 text-red-600 rounded-xl text-sm font-medium hover:bg-red-100 border border-red-200"
                      >
                        ❌ 수령 반려 (재수령 요청)
                      </button>
                    ) : (
                      <div className="space-y-2">
                        <textarea
                          value={rejectReason}
                          onChange={e => setRejectReason(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2.5 border border-red-200 rounded-lg text-sm resize-none"
                          placeholder="반려 사유를 입력하세요 (신청자에게 전달됩니다)"
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => { setShowRejectInput(false); setRejectReason(''); }}
                            className="flex-1 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm"
                          >취소</button>
                          <button
                            onClick={() => handleRejectReceipt(r)}
                            className="flex-1 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600"
                          >반려 확정</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </Card>
        )}

        {/* 처리 이력 */}
        {(request.history || []).length > 0 && (
          <Card title="처리 이력">
            <div className="space-y-2">
              {[...request.history].reverse().map((h, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <div className="w-32 shrink-0 text-xs text-gray-400">
                    {new Date(h.created_at).toLocaleDateString('ko-KR')}<br />
                    {new Date(h.created_at).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div>
                    <span className="font-medium">{h.actor_name || '시스템'}</span>
                    <span className="text-gray-500 ml-1">{h.action}</span>
                    {h.reason && <p className="text-xs text-gray-400 mt-0.5">"{h.reason}"</p>}
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* 신청자 액션 버튼 */}
        {!isAdmin && (
          <div className="flex gap-3 pb-8">
            {canEdit && (
              <button
                onClick={() => navigate(`/purchase/edit/${id}`)}
                className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50"
              >
                수정
              </button>
            )}
            {canSubmit && (
              <button
                onClick={handleSubmit}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
              >
                제출
              </button>
            )}
            {canResubmit && (
              <button
                onClick={handleResubmit}
                className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700"
              >
                보완 후 재제출
              </button>
            )}
            {canCancel && (
              <button
                onClick={handleCancel}
                className="flex-1 py-3 bg-red-50 text-red-600 rounded-xl font-medium hover:bg-red-100"
              >
                취소
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function Card({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
      <h3 className="text-sm font-semibold text-gray-700 border-b border-gray-100 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Grid2({ children }) {
  return <div className="grid grid-cols-2 gap-3">{children}</div>;
}

function Info({ label, value }) {
  return (
    <div>
      <dt className="text-xs text-gray-400 mb-0.5">{label}</dt>
      <dd className="text-sm font-medium text-gray-800">{value || '-'}</dd>
    </div>
  );
}

export default PurchaseDetailPage;
