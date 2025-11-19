import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppContext } from '../context/AppContext';

function MasterApprovalPage() {
  const { currentUser } = useAppContext();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPendingUsers();
  }, []);

  const loadPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPendingUsers(data || []);
    } catch (error) {
      console.error('대기 중인 사용자 로딩 실패:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId) => {
    if (!window.confirm('이 사용자를 승인하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: currentUser.userId
        })
        .eq('id', userId);

      if (error) throw error;

      alert('승인이 완료되었습니다.');
      loadPendingUsers();
    } catch (error) {
      console.error('승인 실패:', error);
      alert('승인 처리에 실패했습니다.');
    }
  };

  const handleReject = async (userId) => {
    if (!window.confirm('이 사용자를 거부하시겠습니까?')) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({
          status: 'rejected',
          approved_by: currentUser.userId
        })
        .eq('id', userId);

      if (error) throw error;

      alert('거부가 완료되었습니다.');
      loadPendingUsers();
    } catch (error) {
      console.error('거부 실패:', error);
      alert('거부 처리에 실패했습니다.');
    }
  };

  const getAccountTypeBadge = (type) => {
    const styles = {
      professor: 'bg-purple-100 text-purple-800',
      staff: 'bg-green-100 text-green-800',
      student: 'bg-blue-100 text-blue-800'
    };
    const labels = {
      professor: '교수',
      staff: '직원',
      student: '학생'
    };
    return (
      <span className={`px-3 py-1 rounded-full text-sm font-semibold ${styles[type]}`}>
        {labels[type]}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">로딩 중...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            🔑 마스터 승인 관리
          </h1>
          <p className="text-gray-600">교수 및 직원 계정 승인 요청 관리</p>
        </div>

        {pendingUsers.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">✅</div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">
              승인 대기 중인 요청이 없습니다
            </h2>
            <p className="text-gray-600">
              새로운 교수/직원 가입 요청이 있으면 여기에 표시됩니다.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-bold text-gray-800">
                        {user.name}
                      </h3>
                      {getAccountTypeBadge(user.account_type)}
                      <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                        승인 대기
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">아이디:</span>
                        <span className="ml-2 font-semibold">{user.username}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">이메일:</span>
                        <span className="ml-2 font-semibold">{user.email}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">전화번호:</span>
                        <span className="ml-2 font-semibold">{user.phone}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">학과/부서:</span>
                        <span className="ml-2 font-semibold">{user.department}</span>
                      </div>
                      {user.position && (
                        <div>
                          <span className="text-gray-600">직책:</span>
                          <span className="ml-2 font-semibold">{user.position}</span>
                        </div>
                      )}
                      {user.employee_number && (
                        <div>
                          <span className="text-gray-600">사번:</span>
                          <span className="ml-2 font-semibold">{user.employee_number}</span>
                        </div>
                      )}
                      <div>
                        <span className="text-gray-600">신청일:</span>
                        <span className="ml-2 font-semibold">
                          {new Date(user.created_at).toLocaleDateString('ko-KR')}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 ml-4">
                    <button
                      onClick={() => handleApprove(user.id)}
                      className="px-6 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
                    >
                      ✓ 승인
                    </button>
                    <button
                      onClick={() => handleReject(user.id)}
                      className="px-6 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors"
                    >
                      ✗ 거부
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default MasterApprovalPage;