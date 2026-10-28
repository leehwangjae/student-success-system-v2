import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePurchaseContext } from '../../context/PurchaseContext';

function PurchaseBudgetPage() {
  const navigate = useNavigate();
  const { purchaseSettings, loadPurchaseSettings, getBudgetStatus, formatMoney } = usePurchaseContext();
  const [filterYear, setFilterYear] = useState(new Date().getFullYear().toString());
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPurchaseSettings();
  }, []);

  useEffect(() => {
    loadBudgets();
  }, [purchaseSettings, filterYear]);

  const loadBudgets = async () => {
    setLoading(true);
    const depts = purchaseSettings
      .filter(s => s.fiscal_year === filterYear)
      .map(s => s.department_name)
      .filter((v, i, arr) => arr.indexOf(v) === i);

    const results = await Promise.all(
      depts.map(async dept => {
        const status = await getBudgetStatus(filterYear, dept);
        const setting = purchaseSettings.find(s => s.fiscal_year === filterYear && s.department_name === dept);
        return { dept, ...status, setting };
      })
    );
    setBudgets(results);
    setLoading(false);
  };

  const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0);
  const totalReserved = budgets.reduce((s, b) => s + b.reserved, 0);
  const totalPurchased = budgets.reduce((s, b) => s + b.purchased, 0);
  const totalAvailable = budgets.reduce((s, b) => s + b.available, 0);

  const years = [...new Set(purchaseSettings.map(s => s.fiscal_year))].sort().reverse();
  if (!years.includes(filterYear)) years.unshift(filterYear);

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center gap-3">
          <button onClick={() => navigate('/purchase/admin')} className="text-gray-400 hover:text-gray-600">←</button>
          <h1 className="text-lg font-bold text-gray-800">예산 현황</h1>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-5">
        {/* 연도 필터 */}
        <div className="flex gap-2">
          {years.map(y => (
            <button
              key={y}
              onClick={() => setFilterYear(y)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${filterYear === y ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >{y}년</button>
          ))}
        </div>

        {/* 전체 합계 */}
        <div className="bg-white rounded-2xl shadow-sm p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">{filterYear}년 전체 예산 요약</h3>
          <div className="grid grid-cols-4 gap-4">
            <BudgetStat label="총 배정액" value={formatMoney(totalAllocated)} color="text-gray-800" />
            <BudgetStat label="집행신청액" value={formatMoney(totalReserved)} color="text-orange-600" />
            <BudgetStat label="집행액" value={formatMoney(totalPurchased)} color="text-red-600" />
            <BudgetStat label="가용액" value={formatMoney(totalAvailable)} color={totalAvailable < 0 ? 'text-red-600 font-bold' : 'text-green-600 font-bold'} />
          </div>
          {totalAllocated > 0 && (
            <div className="mt-4">
              <div className="flex text-xs text-gray-400 justify-between mb-1">
                <span>예산 사용률</span>
                <span>{Math.round(((totalReserved + totalPurchased) / totalAllocated) * 100)}%</span>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                  style={{ width: `${Math.min(100, ((totalReserved + totalPurchased) / totalAllocated) * 100)}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* 학과별 상세 */}
        {loading ? (
          <div className="text-center py-10 text-gray-400">불러오는 중...</div>
        ) : budgets.length === 0 ? (
          <div className="bg-white rounded-2xl p-10 text-center text-gray-400">
            <p>{filterYear}년 예산 설정이 없습니다.</p>
            <button
              onClick={() => navigate('/purchase/admin/settings')}
              className="mt-3 text-blue-600 hover:underline text-sm"
            >예산 설정하러 가기 →</button>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map(b => (
              <div key={b.dept} className="bg-white rounded-2xl shadow-sm p-5">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-800">{b.dept}</h4>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${b.setting?.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {b.setting?.is_active ? '운영중' : '비활성'}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  <BudgetStat label="배정액" value={formatMoney(b.allocated)} color="text-gray-700" small />
                  <BudgetStat label="집행신청액" value={formatMoney(b.reserved)} color="text-orange-600" small />
                  <BudgetStat label="집행액" value={formatMoney(b.purchased)} color="text-red-600" small />
                  <BudgetStat label="가용액" value={formatMoney(b.available)} color={b.available < 0 ? 'text-red-600 font-bold' : 'text-green-600'} small />
                </div>
                {b.allocated > 0 && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-red-400 transition-all"
                        style={{ width: `${Math.min(100, (b.purchased / b.allocated) * 100)}%` }}
                      />
                      <div
                        className="h-full bg-orange-300 transition-all"
                        style={{ width: `${Math.min(100 - (b.purchased / b.allocated) * 100, (b.reserved / b.allocated) * 100)}%` }}
                      />
                    </div>
                    <div className="flex text-xs text-gray-400 mt-1 gap-3">
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-400 inline-block" />집행 {Math.round((b.purchased / b.allocated) * 100)}%</span>
                      <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-300 inline-block" />신청 {Math.round((b.reserved / b.allocated) * 100)}%</span>
                    </div>
                  </div>
                )}
                {b.setting?.application_start_at && (
                  <p className="text-xs text-gray-400 mt-2">
                    신청기간: {new Date(b.setting.application_start_at).toLocaleDateString('ko-KR')} ~{' '}
                    {b.setting.application_end_at ? new Date(b.setting.application_end_at).toLocaleDateString('ko-KR') : '미정'}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function BudgetStat({ label, value, color, small }) {
  return (
    <div className="text-center">
      <div className={`${small ? 'text-base' : 'text-xl'} font-bold ${color}`}>{value}</div>
      <div className="text-xs text-gray-400 mt-0.5">{label}</div>
    </div>
  );
}

export default PurchaseBudgetPage;
