import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useModalStore } from '../../hooks/useModal';

function QuestionBoardAdminPage() {
  const {
    currentUser,
    questionPosts,
    answerQuestionPost,
    adminDeleteQuestionPost,
  } = useAppContext();

  const { showAlert, showConfirm } = useModalStore();

  const [view, setView] = useState('list'); // 'list' | 'detail'
  const [selectedPost, setSelectedPost] = useState(null);
  const [answerText, setAnswerText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 필터
  const [filterStatus, setFilterStatus] = useState('all'); // 'all' | 'pending' | 'answered'
  const [filterField, setFilterField] = useState('전체');
  const [searchTerm, setSearchTerm] = useState('');

  // ── 필터링 ───────────────────────────────────────────────
  const filtered = questionPosts.filter(post => {
    if (filterStatus !== 'all' && post.status !== filterStatus) return false;
    if (filterField !== '전체' && post.field !== filterField) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      if (
        !post.title.toLowerCase().includes(term) &&
        !post.studentName.toLowerCase().includes(term) &&
        !post.content.toLowerCase().includes(term)
      ) return false;
    }
    return true;
  });

  const pendingCount = questionPosts.filter(p => p.status === 'pending').length;

  // ── 상세보기 열기 ────────────────────────────────────────
  const handleViewDetail = (post) => {
    setSelectedPost(post);
    setAnswerText(post.answer || '');
    setView('detail');
  };

  // ── 답변 제출 ────────────────────────────────────────────
  const handleAnswerSubmit = async () => {
    if (!answerText.trim()) {
      showAlert('답변 내용을 입력해주세요.');
      return;
    }
    setIsSubmitting(true);
    const result = await answerQuestionPost(selectedPost.id, answerText);
    setIsSubmitting(false);
    if (result.success) {
      showAlert('✅ 답변이 등록되었습니다.');
      setView('list');
    } else {
      showAlert(`답변 등록 실패: ${result.error}`);
    }
  };

  // ── 삭제 ────────────────────────────────────────────────
  const handleDelete = (post) => {
    showConfirm(`"${post.title}" 글을 삭제하시겠습니까?`, async () => {
      const result = await adminDeleteQuestionPost(post.id);
      if (result.success) {
        showAlert('삭제되었습니다.');
        setView('list');
      } else {
        showAlert(`삭제 실패: ${result.error}`);
      }
    });
  };

  // ── 날짜 포맷 ────────────────────────────────────────────
  const formatDate = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const StatusBadge = ({ status }) => (
    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${
      status === 'answered'
        ? 'bg-green-100 text-green-700'
        : 'bg-yellow-100 text-yellow-700'
    }`}>
      {status === 'answered' ? '✅ 답변완료' : '⏳ 답변대기'}
    </span>
  );

  // ════════════════════════════════════════════════════════
  // 렌더: 목록
  // ════════════════════════════════════════════════════════
  if (view === 'list') {
    return (
      <div className="space-y-4">
        {/* 헤더 */}
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">💬 질문게시판 관리</h2>
            <p className="text-sm text-gray-500 mt-1">
              학생들이 남긴 질문에 답변하고 관리합니다.
            </p>
          </div>
          {pendingCount > 0 && (
            <div className="bg-yellow-100 border border-yellow-300 text-yellow-800 px-4 py-2 rounded-xl text-sm font-semibold">
              ⚠️ 미답변 질문 {pendingCount}건
            </div>
          )}
        </div>

        {/* 필터 */}
        <div className="bg-white rounded-xl shadow p-4 flex flex-wrap gap-3 items-center">
          {/* 상태 필터 */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {[
              { value: 'all', label: '전체' },
              { value: 'pending', label: '⏳ 미답변' },
              { value: 'answered', label: '✅ 답변완료' },
            ].map(opt => (
              <button
                key={opt.value}
                onClick={() => setFilterStatus(opt.value)}
                className={`px-4 py-1.5 text-sm font-medium transition-colors ${
                  filterStatus === opt.value
                    ? 'bg-blue-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          {/* 분야 필터 */}
          <select
            value={filterField}
            onChange={e => setFilterField(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
          >
            <option value="전체">전체 분야</option>
            <option value="바이오">바이오</option>
            <option value="반도체">반도체</option>
            <option value="물류">물류</option>
          </select>

          {/* 검색 */}
          <input
            type="text"
            placeholder="제목·작성자·내용 검색"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 min-w-[200px]"
          />

          <span className="text-sm text-gray-500 ml-auto">
            총 {filtered.length}건
          </span>
        </div>

        {/* 테이블 */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {filtered.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-4xl mb-3">💬</p>
              <p className="font-medium">해당하는 질문이 없습니다.</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-12">번호</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">제목</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-24">작성자</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-24">분야</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-36">작성일</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 w-28">상태</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 w-20">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((post, index) => (
                  <tr
                    key={post.id}
                    className={`hover:bg-blue-50 transition-colors ${
                      post.status === 'pending' ? 'bg-yellow-50' : ''
                    }`}
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 text-center">
                      {filtered.length - index}
                    </td>
                    <td
                      className="px-4 py-3 cursor-pointer"
                      onClick={() => handleViewDetail(post)}
                    >
                      <div className="flex items-center gap-2">
                        {post.isSecret && (
                          <span className="text-xs bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">🔒</span>
                        )}
                        <span className="text-sm font-medium text-gray-800 hover:text-blue-600">
                          {post.title}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">{post.studentName}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        post.field === '바이오' ? 'bg-green-100 text-green-700' :
                        post.field === '반도체' ? 'bg-blue-100 text-blue-700' :
                        post.field === '물류' ? 'bg-purple-100 text-purple-700' :
                        'bg-gray-100 text-gray-600'
                      }`}>
                        {post.field || '미분류'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">{formatDate(post.createdAt)}</td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={post.status} />
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => handleDelete(post)}
                        className="text-red-400 hover:text-red-600 text-sm px-2 py-1 rounded hover:bg-red-50 transition-colors"
                        title="삭제"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // 렌더: 상세 / 답변
  // ════════════════════════════════════════════════════════
  if (view === 'detail' && selectedPost) {
    return (
      <div className="space-y-4">
        {/* 뒤로 */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
          >
            ← 목록으로
          </button>
          <h2 className="text-xl font-bold text-gray-800">질문 상세 / 답변</h2>
        </div>

        {/* 질문 본문 */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              {selectedPost.isSecret && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">🔒 비밀글</span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{selectedPost.title}</h3>
            </div>
            <StatusBadge status={selectedPost.status} />
          </div>

          <div className="flex gap-6 text-sm text-gray-500 border-b pb-4">
            <span>👤 {selectedPost.studentName}</span>
            <span>🏫 {selectedPost.department}</span>
            <span>📌 {selectedPost.field}</span>
            <span>🕐 {formatDate(selectedPost.createdAt)}</span>
          </div>

          <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed min-h-[100px] bg-gray-50 p-4 rounded-lg">
            {selectedPost.content}
          </div>

          {/* 삭제 버튼 */}
          <div className="flex justify-end pt-2 border-t">
            <button
              onClick={() => handleDelete(selectedPost)}
              className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
            >
              🗑️ 질문 삭제
            </button>
          </div>
        </div>

        {/* 답변 작성 영역 */}
        <div className="bg-blue-50 rounded-xl shadow border border-blue-200 p-6 space-y-4">
          <h4 className="text-base font-bold text-blue-800">💬 답변 작성</h4>
          <textarea
            value={answerText}
            onChange={e => setAnswerText(e.target.value)}
            placeholder="학생에게 전달할 답변을 작성해주세요."
            rows={7}
            className="w-full px-4 py-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none bg-white"
          />

          <div className="flex gap-3">
            <button
              onClick={() => setView('list')}
              className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              onClick={handleAnswerSubmit}
              disabled={isSubmitting}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow disabled:opacity-60"
            >
              {isSubmitting ? '등록 중...' : selectedPost.status === 'answered' ? '✅ 답변 수정' : '✅ 답변 등록'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default QuestionBoardAdminPage;
