import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchaseContext } from '../../context/PurchaseContext';

function PurchaseSettingsPage() {
  const navigate = useNavigate();
  const { purchaseSettings, loadPurchaseSettings, savePurchaseSetting, deletePurchaseSetting, formatMoney } = usePurchaseContext();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState({
    fiscal_year: new Date().getFullYear().toString(),
    department_name: '',
    allocated_amount: '',
    application_start_at: '',
    application_end_at: '',
    is_active: true
  });
  const [saving, setSaving] = useState(false);
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    loadPurchaseSettings();
  }, []);

  const openNew = () => {
    setEditItem(null);
    setForm({
      fiscal_year: filterYear,
      department_name: '',
      allocated_amount: '',
      application_start_at: '',
      application_end_at: '',
      is_active: true
    });
    setShowForm(true);
  };

  const openEdit = (item) => {
    setEditItem(item);
    setForm({
      fiscal_year: item.fiscal_year,
      department_name: item.department_name,
      allocated_amount: item.allocated_amount,
      application_start_at: item.application_start_at ? item.application_start_at.split('T')[0] : '',
      application_end_at: item.application_end_at ? item.application_end_at.split('T')[0] : '',
      is_active: item.is_active
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.department_name.trim()) { alert('학과명을 입력하세요.'); return; }
    if (!form.allocated_amount || Number(form.allocated_amount) < 0) { alert('배정액을 입력하세요.'); return; }

    setSaving(true);
    const payload = {
      ...form,
      id: editItem?.id,
      allocated_amount: Number(form.allocated_amount),
      application_start_at: form.application_start_at ? form.application_start_at + 'T00:00:00+09:00' : null,
      application_end_at: form.application_end_at ? form.application_end_at + 'T23:59:59+09:00' : null
    };
    const { error } = await savePurchaseSetting(payload);
    setSaving(false);
    if (error) { alert('저장 실패: ' + error.message); return; }
    setShowForm(false);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('이 설정을 삭제하시겠습니까?')) return;
    const { error } = await deletePurchaseSetting(id);
    if (error) alert('삭제 실패: ' + error.message);
  };

  const years = [...new Set(purchaseSettings.map(s => s.fiscal_year))].sort().reverse();
  if (!years.includes(filterYear)) years.unshift(filterYear);

  const filtered = purchaseSettings.filter(s => s.fiscal_year === filterYear);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => navigate('/purchase/admin')} className="text-gray-400 hover:text-gray-600">←</button>
            <h1 className="text-lg font-bold text-gray-800">예산 설정</h1>
          </div>
          <button
            onClick={openNew}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >+ 학과 추가</button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
        {/* 연도 탭 */}
        <div className="flex gap-2">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setFilterYear(y)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filterYear === y ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >{y}년</button>
          ))}
          {/* 새 연도 추가 */}
          <button
            onClick={() => {
              const y = prompt('새 사업연도를 입력하세요 (예: 2027)');
              if (y && /^\d{4}$/.test(y)) setFilterYear(y);
            }}
            className="px-3 py-2 rounded-lg text-sm text-gray-400 hover:text-gray-600 border border-dashed border-gray-200"
          >+ 연도</button>
        </div>

        {/* 안내 */}
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
          <p className="font-semibold">💡 가용액 계산 방식</p>
          <p className="mt-1">가용액 = 배정액 − 집행신청액(승인 후 미구매) − 집행액(구매완료)</p>
        </div>

        {/* 설정 목록 */}
        {filtered.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
            <p>{filterYear}년 설정이 없습니다.</p>
            <button onClick={openNew} className="mt-3 text-blue-600 hover:underline text-sm">+ 학과 추가</button>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(item => (
              <div key={item.id} className="bg-white rounded-2xl shadow-sm p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="font-semibold text-gray-800">{item.department_name}</h4>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${item.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        {item.is_active ? '활성' : '비활성'}
                      </span>
                    </div>
                    <p className="text-lg font-bold text-gray-800 mt-1">{formatMoney(item.allocated_amount)}원</p>
                    {item.application_start_at && (
                      <p className="text-xs text-gray-400 mt-1">
                        신청기간: {new Date(item.application_start_at).toLocaleDateString('ko-KR')} ~{' '}
                        {item.application_end_at ? new Date(item.application_end_at).toLocaleDateString('ko-KR') : '미정'}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEdit(item)}
                      className="px-3 py-1.5 text-xs border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50"
                    >수정</button>
                    <button
                      onClick={() => handleDelete(item.id)}
                      className="px-3 py-1.5 text-xs border border-red-100 text-red-500 rounded-lg hover:bg-red-50"
                    >삭제</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 입력 모달 */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold">{editItem ? '학과 설정 수정' : '학과 추가'}</h3>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">사업연도 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.fiscal_year}
                onChange={e => setForm(p => ({...p, fiscal_year: e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="예: 2026"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">학과명 <span className="text-red-500">*</span></label>
              <input
                type="text"
                value={form.department_name}
                onChange={e => setForm(p => ({...p, department_name: e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="예: 생명공학과"
                disabled={!!editItem}
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">배정액 (원) <span className="text-red-500">*</span></label>
              <input
                type="number"
                value={form.allocated_amount}
                onChange={e => setForm(p => ({...p, allocated_amount: e.target.value}))}
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm"
                placeholder="예: 10000000"
                min="0"
              />
              {form.allocated_amount && (
                <p className="text-xs text-gray-400 mt-1">{formatMoney(Number(form.allocated_amount))}원</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">신청 시작일</label>
                <input type="date" value={form.application_start_at} onChange={e => setForm(p => ({...p, application_start_at: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">신청 마감일</label>
                <input type="date" value={form.application_end_at} onChange={e => setForm(p => ({...p, application_end_at: e.target.value}))} className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm" />
              </div>
            </div>

            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={e => setForm(p => ({...p, is_active: e.target.checked}))}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700">활성 (신청 가능)</span>
            </label>

            <div className="flex gap-3 pt-2">
              <button onClick={() => setShowForm(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm">취소</button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >{saving ? '저장중...' : '저장'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default PurchaseSettingsPage;
