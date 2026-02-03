import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAppContext } from '../../context/AppContext';
import { useModalStore } from '../../hooks/useModal';

function MasterApprovalModal({ isOpen, onClose }) {
  const { currentUser } = useAppContext();
  const { showConfirm, showAlert } = useModalStore();
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      loadPendingUsers();
    }
  }, [isOpen]);

  const loadPendingUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('users_2025_11_27_07_17')
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
    showConfirm('이 사용자를 승인하시겠습니까?', async () => {
      try {
        const { error } = await supabase
          .from('users_2025_11_27_07_17')
          .update({
            status: 'approved',
            approved_at: new Date().toISOString(),
            approved_by: currentUser.userId
          })
          .eq('id', userId);

        if (error) throw error;

        showAlert('승인이 완료되었습니다.');
        loadPendingUsers();
      } catch (error) {
        console.error('승인 실패:', error);
        showAlert('승인 처리에 실패했습니다.');
      }
    });
  };

  const handleReject = async (userId) => {
    showConfirm('이 사용자를 거부하시겠습니까?', async () => {
      try {
        const { error } = await supabase
          .from('users_2025_11_27_07_17')
          .update({
            status: 'rejected',
            approved_by: currentUser.userId
          })
          .eq('id', userId);

        if (error) throw error;

        showAlert('거부가 완료되었습니다.');
        loadPendingUsers();
      } catch (error) {
        console.error('거부 실패:', error);
        showAlert('거부 처리에 실패했습니다.');
      }
    });
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

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold">🔑 마스터 승인 관리</h2>
            <p className="text-yellow-100 text-sm mt-1">교수 및 직원 계정 승인 요청</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 컨텐츠 */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-lg text-gray-600">로딩 중...</div>
            </div>
          ) : pendingUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64">
              <div className="text-6xl mb-4">✅</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">
                승인 대기 중인 요청이 없습니다
              </h3>
              <p className="text-gray-600 text-center">
                새로운 교수/직원 가입 요청이 있으면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingUsers.map((user) => (
                <div 
                  key={user.id} 
                  className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition-shadow bg-white"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="text-lg font-bold text-gray-800">
                          {user.name}
                        </h3>
                        {getAccountTypeBadge(user.account_type)}
                        <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-semibold">
                          승인 대기
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center">
                          <span className="text-gray-600 w-24">아이디:</span>
                          <span className="font-semibold text-gray-800">{user.username}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600 w-24">이메일:</span>
                          <span className="font-semibold text-gray-800">{user.email}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600 w-24">전화번호:</span>
                          <span className="font-semibold text-gray-800">{user.phone}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-gray-600 w-24">학과/부서:</span>
                          <span className="font-semibold text-gray-800">{user.department}</span>
                        </div>
                        {user.position && (
                          <div className="flex items-center">
                            <span className="text-gray-600 w-24">직책:</span>
                            <span className="font-semibold text-gray-800">{user.position}</span>
                          </div>
                        )}
                        {user.employee_number && (
                          <div className="flex items-center">
                            <span className="text-gray-600 w-24">사번:</span>
                            <span className="font-semibold text-gray-800">{user.employee_number}</span>
                          </div>
                        )}
                        <div className="flex items-center">
                          <span className="text-gray-600 w-24">신청일:</span>
                          <span className="font-semibold text-gray-800">
                            {new Date(user.created_at).toLocaleDateString('ko-KR')}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <button
                        onClick={() => handleApprove(user.id)}
                        className="px-5 py-2 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors shadow-sm"
                      >
                        ✓ 승인
                      </button>
                      <button
                        onClick={() => handleReject(user.id)}
                        className="px-5 py-2 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors shadow-sm"
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

        {/* 푸터 */}
        <div className="border-t border-gray-200 px-6 py-4 bg-gray-50 rounded-b-2xl">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600">
              총 <span className="font-bold text-blue-600">{pendingUsers.length}</span>개의 승인 대기 요청
            </p>
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              닫기
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MasterApprovalModal;