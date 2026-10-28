import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { usePurchaseContext } from '../../context/PurchaseContext';

const UNITS = ['개', '세트', '박스', 'L', 'mL', 'g', 'kg', 'm', 'cm', '식', '조'];

function PurchaseNewRequestPage() {
  const navigate = useNavigate();
  const { requestId } = useParams(); // 수정 시
  const { currentUser } = useAppContext();
  const { saveDraft, updateDraft, submitRequest, getRequestDetail, purchaseSettings, loadPurchaseSettings, formatMoney } = usePurchaseContext();

  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [form, setForm] = useState({
    department_name: '',
    lab_name: currentUser?.lab_name || '',
    professor_name: currentUser?.name || '',
    title: '',
    purpose: '',
    delivery_name: currentUser?.name || '',
    delivery_phone: '',
    delivery_address: '',
  });

  const [items, setItems] = useState([
    { item_name: '', specification: '', quantity: 1, unit: '개', unit_price: 0, supplier_url: '' }
  ]);

  useEffect(() => {
    loadPurchaseSettings();
    if (requestId) {
      loadExisting();
    }
  }, [requestId]);

  const loadExisting = async () => {
    const { data } = await getRequestDetail(requestId);
    if (data) {
      setIsEditing(true);
      setForm({
        department_name: data.department_name || '',
        lab_name: data.lab_name || '',
        professor_name: data.professor_name || '',
        title: data.title || '',
        purpose: data.purpose || '',
        delivery_name: data.delivery_name || '',
        delivery_phone: data.delivery_phone || '',
        delivery_address: data.delivery_address || ''
      });
      if (data.items?.length > 0) {
        setItems(data.items.map(i => ({
          item_name: i.item_name,
          specification: i.specification || '',
          quantity: i.quantity,
          unit: i.unit || '개',
          unit_price: i.unit_price,
          supplier_url: i.supplier_url || ''
        })));
      }
    }
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
    setErrorMsg('');
  };

  const handleItemChange = (idx, field, value) => {
    setItems(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === 'quantity' || field === 'unit_price') {
        const qty = field === 'quantity' ? Number(value) : Number(next[idx].quantity);
        const price = field === 'unit_price' ? Number(value) : Number(next[idx].unit_price);
        next[idx].total_price = qty * price;
      }
      return next;
    });
    setErrorMsg('');
  };

  const addItem = () => {
    setItems(prev => [...prev, { item_name: '', specification: '', quantity: 1, unit: '개', unit_price: 0, supplier_url: '' }]);
  };

  const removeItem = (idx) => {
    if (items.length === 1) return;
    setItems(prev => prev.filter((_, i) => i !== idx));
  };

  const totalAmount = items.reduce((sum, item) => sum + (Number(item.quantity) * Number(item.unit_price)), 0);

  const validate = () => {
    if (!form.department_name.trim()) return '학과명을 입력하세요.';
    if (!form.lab_name.trim()) return '연구실명을 입력하세요.';
    if (!form.professor_name.trim()) return '신청자(교수)명을 입력하세요.';
    if (!form.title.trim()) return '신청 제목을 입력하세요.';
    if (!form.purpose.trim()) return '활용 목적을 입력하세요.';
    if (!form.delivery_name.trim()) return '수령인을 입력하세요.';
    if (!form.delivery_phone.trim()) return '수령 연락처를 입력하세요.';
    if (!form.delivery_address.trim()) return '수령 장소를 입력하세요.';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.item_name.trim()) return `${i + 1}번 품목명을 입력하세요.`;
      if (!item.unit_price || Number(item.unit_price) <= 0) return `${i + 1}번 품목의 단가를 입력하세요.`;
      if (!item.quantity || Number(item.quantity) <= 0) return `${i + 1}번 품목의 수량을 입력하세요.`;
      if (!item.supplier_url?.trim()) return `${i + 1}번 품목의 구매처 정보를 입력하세요.`;
    }
    return null;
  };

  const buildPayload = () => ({
    ...form,
    items: items.map(i => ({
      ...i,
      quantity: Number(i.quantity),
      unit_price: Number(i.unit_price),
      total_price: Number(i.quantity) * Number(i.unit_price)
    }))
  });

  const handleSaveDraft = async () => {
    if (!form.title.trim()) {
      setErrorMsg('최소한 제목을 입력하세요.');
      return;
    }
    setSubmitting(true);
    try {
      let result;
      if (isEditing) {
        result = await updateDraft(requestId, buildPayload(), currentUser.id);
      } else {
        result = await saveDraft(buildPayload(), currentUser.id);
      }
      if (result.error) throw result.error;
      alert('임시저장되었습니다.');
      navigate('/purchase');
    } catch (err) {
      setErrorMsg('저장 실패: ' + (err.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setErrorMsg(err); return; }

    if (!window.confirm('신청서를 제출하시겠습니까?\n제출 후에는 내용 수정이 불가합니다.')) return;

    setSubmitting(true);
    try {
      let targetId = requestId;
      if (!isEditing) {
        const result = await saveDraft(buildPayload(), currentUser.id);
        if (result.error) throw result.error;
        targetId = result.data.id;
      } else {
        const result = await updateDraft(requestId, buildPayload(), currentUser.id);
        if (result.error) throw result.error;
      }
      const submitResult = await submitRequest(targetId, currentUser.id, currentUser.name);
      if (submitResult.error) throw submitResult.error;
      alert('신청서가 제출되었습니다.');
      navigate('/purchase');
    } catch (err) {
      setErrorMsg('제출 실패: ' + (err.message || String(err)));
    } finally {
      setSubmitting(false);
    }
  };

  // 현재 활성 설정에서 학과 목록 추출
  const now = new Date();
  const deptOptions = purchaseSettings
    .filter(s => s.is_active)
    .map(s => s.department_name)
    .filter((v, i, arr) => arr.indexOf(v) === i);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/purchase')} className="text-gray-400 hover:text-gray-600">←</button>
            <h1 className="text-lg font-bold text-gray-800">
              {isEditing ? '구매 신청 수정' : '구매 신청서 작성'}
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveDraft}
              disabled={submitting}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50"
            >
              임시저장
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {submitting ? '처리중...' : '제출'}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-5">
        {errorMsg && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm">{errorMsg}</div>
        )}

        {/* 기본 정보 */}
        <Section title="기본 정보">
          <Field label="학과" required>
            {deptOptions.length > 0 ? (
              <select
                name="department_name"
                value={form.department_name}
                onChange={handleFormChange}
                className={inputClass}
              >
                <option value="">학과 선택</option>
                {deptOptions.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            ) : (
              <input
                type="text"
                name="department_name"
                value={form.department_name}
                onChange={handleFormChange}
                className={inputClass}
                placeholder="학과명 입력"
              />
            )}
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="연구실명" required>
              <input
                type="text"
                name="lab_name"
                value={form.lab_name}
                onChange={handleFormChange}
                className={inputClass}
                placeholder="연구실명"
              />
            </Field>
            <Field label="신청자(교수)" required>
              <input
                type="text"
                name="professor_name"
                value={form.professor_name}
                onChange={handleFormChange}
                className={inputClass}
                placeholder="성명"
              />
            </Field>
          </div>
          <Field label="신청 제목" required>
            <input
              type="text"
              name="title"
              value={form.title}
              onChange={handleFormChange}
              className={inputClass}
              placeholder="예: 2026년 1차 실험 재료 구매"
            />
          </Field>
          <Field label="활용 목적" required>
            <textarea
              name="purpose"
              value={form.purpose}
              onChange={handleFormChange}
              rows={3}
              className={inputClass + ' resize-none'}
              placeholder="실험 목적 및 활용 계획을 기재하세요"
            />
          </Field>
        </Section>

        {/* 수령 정보 */}
        <Section title="수령 정보">
          <div className="grid grid-cols-2 gap-3">
            <Field label="수령인" required>
              <input
                type="text"
                name="delivery_name"
                value={form.delivery_name}
                onChange={handleFormChange}
                className={inputClass}
                placeholder="수령인 성명"
              />
            </Field>
            <Field label="연락처" required>
              <input
                type="text"
                name="delivery_phone"
                value={form.delivery_phone}
                onChange={handleFormChange}
                className={inputClass}
                placeholder="010-0000-0000"
              />
            </Field>
          </div>
          <Field label="수령 장소" required>
            <input
              type="text"
              name="delivery_address"
              value={form.delivery_address}
              onChange={handleFormChange}
              className={inputClass}
              placeholder="예: 자연과학관 301호 연구실"
            />
          </Field>
        </Section>

        {/* 구매 품목 */}
        <Section title="구매 품목">
          <div className="space-y-3">
            {items.map((item, idx) => (
              <div key={idx} className="bg-gray-50 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-700">{idx + 1}번 품목</span>
                  {items.length > 1 && (
                    <button
                      onClick={() => removeItem(idx)}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      삭제
                    </button>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="품목명" required>
                    <input
                      type="text"
                      value={item.item_name}
                      onChange={(e) => handleItemChange(idx, 'item_name', e.target.value)}
                      className={inputClass}
                      placeholder="품목명"
                    />
                  </Field>
                  <Field label="규격/사양">
                    <input
                      type="text"
                      value={item.specification}
                      onChange={(e) => handleItemChange(idx, 'specification', e.target.value)}
                      className={inputClass}
                      placeholder="규격 (선택)"
                    />
                  </Field>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="수량" required>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                      className={inputClass}
                      min="1"
                    />
                  </Field>
                  <Field label="단위">
                    <select
                      value={item.unit}
                      onChange={(e) => handleItemChange(idx, 'unit', e.target.value)}
                      className={inputClass}
                    >
                      {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </Field>
                  <Field label="단가(원, 부가세 포함)" required>
                    <input
                      type="number"
                      value={item.unit_price}
                      onChange={(e) => handleItemChange(idx, 'unit_price', e.target.value)}
                      className={inputClass}
                      min="0"
                    />
                  </Field>
                </div>
                <Field label="구매처 정보 또는 URL" required>
                  <input
                    type="text"
                    value={item.supplier_url}
                    onChange={(e) => handleItemChange(idx, 'supplier_url', e.target.value)}
                    className={inputClass}
                    placeholder="예: 쿠팡 / G마켓 / https://..."
                  />
                </Field>
                <div className="text-right text-sm font-semibold text-green-700">
                  소계: {formatMoney(Number(item.quantity) * Number(item.unit_price))}원
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={addItem}
            className="w-full py-2.5 border-2 border-dashed border-gray-300 text-gray-500 rounded-xl text-sm hover:border-green-400 hover:text-green-600 transition-colors mt-2"
          >
            + 품목 추가
          </button>

          <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center justify-between">
            <span className="font-semibold text-gray-700">합계 금액</span>
            <span className="text-xl font-bold text-green-700">{formatMoney(totalAmount)}원</span>
          </div>
        </Section>

        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 text-xs text-blue-700 space-y-1">
          <p className="font-semibold">📋 유의사항</p>
          <p>• 구매 신청 승인 후 관리자가 대신 구매 진행합니다.</p>
          <p>• 견적서는 승인 후 별도 첨부 요청이 있을 수 있습니다.</p>
          <p>• 물품 수령 후 수령 사진을 업로드해주세요.</p>
        </div>

        <div className="flex gap-3 pb-8">
          <button
            onClick={handleSaveDraft}
            disabled={submitting}
            className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 disabled:opacity-50"
          >
            임시저장
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 disabled:opacity-50"
          >
            {submitting ? '처리중...' : '신청서 제출'}
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-5 space-y-3">
      <h3 className="font-semibold text-gray-700 text-sm border-b border-gray-100 pb-2">{title}</h3>
      {children}
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
    </div>
  );
}

const inputClass = 'w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent bg-white';

export default PurchaseNewRequestPage;
