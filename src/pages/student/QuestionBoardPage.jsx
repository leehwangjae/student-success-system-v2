import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useModalStore } from '../../hooks/useModal';

function QuestionBoardPage() {
  const {
    currentUser,
    questionPosts,
    createQuestionPost,
    updateQuestionPost,
    deleteQuestionPost,
  } = useAppContext();

  const { showAlert, showConfirm } = useModalStore();

  // 목록 / 글쓰기 / 상세 뷰
  const [view, setView] = useState('list'); // 'list' | 'write' | 'detail' | 'edit'
  const [selectedPost, setSelectedPost] = useState(null);

  // 작성/수정 폼
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    isSecret: false,
  });

  // 내 글만 보기 토글
  const [showMyOnly, setShowMyOnly] = useState(false);

  // ── 필터링 ───────────────────────────────────────────────
  const visiblePosts = questionPosts.filter(post => {
    // 내 글만 보기
    if (showMyOnly && post.studentId !== currentUser?.id) return false;
    // 비밀글: 본인 글이거나 관리자만 볼 수 있음
    if (post.isSecret && post.studentId !== currentUser?.id) return false;
    return true;
  });

  // ── 글쓰기 시작 ───────────────────────────────────────────
  const handleWriteStart = () => {
    setFormData({ title: '', content: '', isSecret: false });
    setView('write');
  };

  // ── 글쓰기 제출 ───────────────────────────────────────────
  const handleSubmit = async () => {
    if (!formData.title.trim()) {
      showAlert('제목을 입력해주세요.');
      return;
    }
    if (!formData.content.trim()) {
      showAlert('내용을 입력해주세요.');
      return;
    }

    const result = await createQuestionPost(formData);
    if (result.success) {
      showAlert('✅ 질문이 등록되었습니다.');
      setView('list');
    } else {
      showAlert(`등록 실패: ${result.error}`);
    }
  };

  // ── 수정 시작 ─────────────────────────────────────────────
  const handleEditStart = (post) => {
    setFormData({
      title: post.title,
      content: post.content,
      isSecret: post.isSecret,
    });
    setSelectedPost(post);
    setView('edit');
  };

  // ── 수정 제출 ─────────────────────────────────────────────
  const handleEditSubmit = async () => {
    if (!formData.title.trim()) {
      showAlert('제목을 입력해주세요.');
      return;
    }
    if (!formData.content.trim()) {
      showAlert('내용을 입력해주세요.');
      return;
    }

    const result = await updateQuestionPost(selectedPost.id, formData);
    if (result.success) {
      showAlert('✅ 수정되었습니다.');
      setView('list');
    } else {
      showAlert(`수정 실패: ${result.error}`);
    }
  };

  // ── 삭제 ─────────────────────────────────────────────────
  const handleDelete = (post) => {
    if (post.status === 'answered') {
      showAlert('답변이 완료된 글은 삭제할 수 없습니다.');
      return;
    }
    showConfirm('이 질문을 삭제하시겠습니까?', async () => {
      const result = await deleteQuestionPost(post.id);
      if (result.success) {
        showAlert('삭제되었습니다.');
        setView('list');
      } else {
        showAlert(`삭제 실패: ${result.error}`);
      }
    });
  };

  // ── 상세 보기 ─────────────────────────────────────────────
  const handleViewDetail = (post) => {
    setSelectedPost(post);
    setView('detail');
  };

  // ── 날짜 포맷 ─────────────────────────────────────────────
  const formatDate = (isoStr) => {
    if (!isoStr) return '-';
    const d = new Date(isoStr);
    return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  // ── 상태 배지 ─────────────────────────────────────────────
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
            <h2 className="text-2xl font-bold text-gray-800">💬 질문게시판</h2>
            <p className="text-sm text-gray-500 mt-1">
              교과목·프로그램 신청 관련 궁금한 점을 남겨주시면 담당자가 답변해 드립니다.
            </p>
          </div>
          <button
            onClick={handleWriteStart}
            className="px-5 py-2.5 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors shadow"
          >
            ✏️ 질문 작성
          </button>
        </div>

        {/* 내 글만 보기 토글 */}
        <div className="flex items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer select-none text-sm text-gray-600">
            <input
              type="checkbox"
              checked={showMyOnly}
              onChange={e => setShowMyOnly(e.target.checked)}
              className="w-4 h-4 accent-blue-600"
            />
            내가 작성한 글만 보기
          </label>
        </div>

        {/* 게시글 목록 */}
        <div className="bg-white rounded-xl shadow overflow-hidden">
          {visiblePosts.length === 0 ? (
            <div className="py-16 text-center text-gray-400">
              <p className="text-4xl mb-3">💬</p>
              <p className="font-medium">등록된 질문이 없습니다.</p>
              <p className="text-sm mt-1">첫 번째 질문을 작성해보세요!</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-12">번호</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500">제목</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-24">작성자</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 w-32">작성일</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 w-28">상태</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visiblePosts.map((post, index) => (
                  <tr
                    key={post.id}
                    onClick={() => handleViewDetail(post)}
                    className="hover:bg-blue-50 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 text-sm text-gray-500 text-center">
                      {visiblePosts.length - index}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {post.isSecret && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">🔒 비밀</span>
                        )}
                        <span className="text-sm font-medium text-gray-800 hover:text-blue-600">
                          {post.title}
                        </span>
                        {post.status === 'answered' && (
                          <span className="text-xs text-green-600 font-semibold">[답변완료]</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {post.isSecret && post.studentId !== currentUser?.id
                        ? '비밀글'
                        : post.studentName}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(post.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <StatusBadge status={post.status} />
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
  // 렌더: 글쓰기 / 수정 폼
  // ════════════════════════════════════════════════════════
  if (view === 'write' || view === 'edit') {
    const isEdit = view === 'edit';
    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
          >
            ← 목록으로
          </button>
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? '✏️ 질문 수정' : '✏️ 질문 작성'}
          </h2>
        </div>

        <div className="bg-white rounded-xl shadow p-6 space-y-5">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
              placeholder="제목을 입력하세요"
              maxLength={100}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            />
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              내용 <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.content}
              onChange={e => setFormData(prev => ({ ...prev, content: e.target.value }))}
              placeholder="문의 내용을 자세히 작성해주세요."
              rows={8}
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm resize-none"
            />
          </div>

          {/* 비밀글 여부 */}
          <div>
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.isSecret}
                onChange={e => setFormData(prev => ({ ...prev, isSecret: e.target.checked }))}
                className="w-4 h-4 accent-blue-600"
              />
              <span className="text-sm text-gray-700">🔒 비밀글로 등록 (본인과 관리자만 열람 가능)</span>
            </label>
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setView('list')}
              className="flex-1 py-2.5 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              onClick={isEdit ? handleEditSubmit : handleSubmit}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow"
            >
              {isEdit ? '수정 완료' : '등록하기'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ════════════════════════════════════════════════════════
  // 렌더: 상세보기
  // ════════════════════════════════════════════════════════
  if (view === 'detail' && selectedPost) {
    const isOwner = selectedPost.studentId === currentUser?.id;

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setView('list')}
            className="text-gray-500 hover:text-gray-700 text-sm flex items-center gap-1"
          >
            ← 목록으로
          </button>
        </div>

        {/* 질문 본문 */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          {/* 제목 행 */}
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-center gap-2 flex-1">
              {selectedPost.isSecret && (
                <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">🔒 비밀글</span>
              )}
              <h3 className="text-xl font-bold text-gray-900">{selectedPost.title}</h3>
            </div>
            <StatusBadge status={selectedPost.status} />
          </div>

          {/* 메타 */}
          <div className="flex gap-6 text-sm text-gray-500 border-b pb-4">
            <span>👤 {selectedPost.studentName}</span>
            <span>🏫 {selectedPost.department}</span>
            <span>🕐 {formatDate(selectedPost.createdAt)}</span>
          </div>

          {/* 내용 */}
          <div className="whitespace-pre-wrap text-gray-800 text-sm leading-relaxed min-h-[100px]">
            {selectedPost.content}
          </div>

          {/* 본인 버튼 */}
          {isOwner && (
            <div className="flex gap-2 pt-4 border-t">
              {selectedPost.status !== 'answered' && (
                <button
                  onClick={() => handleEditStart(selectedPost)}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg text-sm font-semibold hover:bg-blue-200 transition-colors"
                >
                  ✏️ 수정
                </button>
              )}
              <button
                onClick={() => handleDelete(selectedPost)}
                className="px-4 py-2 bg-red-100 text-red-700 rounded-lg text-sm font-semibold hover:bg-red-200 transition-colors"
              >
                🗑️ 삭제
              </button>
            </div>
          )}
        </div>

        {/* 답변 영역 */}
        {selectedPost.status === 'answered' && selectedPost.answer ? (
          <div className="bg-blue-50 rounded-xl shadow border border-blue-200 p-6 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-blue-700 font-bold text-base">💬 관리자 답변</span>
              <span className="text-xs text-blue-500">{formatDate(selectedPost.answeredAt)}</span>
              {selectedPost.answeredBy && (
                <span className="text-xs text-blue-500">— {selectedPost.answeredBy}</span>
              )}
            </div>
            <div className="whitespace-pre-wrap text-blue-900 text-sm leading-relaxed">
              {selectedPost.answer}
            </div>
          </div>
        ) : (
          <div className="bg-gray-50 rounded-xl border border-dashed border-gray-300 p-6 text-center text-gray-400 text-sm">
            ⏳ 아직 답변이 등록되지 않았습니다. 조금만 기다려 주세요.
          </div>
        )}
      </div>
    );
  }

  return null;
}

export default QuestionBoardPage;
