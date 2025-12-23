import React, { useState } from 'react';
import { SUBMISSION_STATUS_LABEL, POINTS_PER_COURSE } from './constants';
import { formatDate, formatFileSize, downloadBase64File } from '../../utils/coreCoursesHelpers';

function SubmissionReviewModal({ isOpen, onClose, submission, student, onApprove, onReject }) {
  const [decision, setDecision] = useState('approve'); // approve / reject
  const [rejectionReason, setRejectionReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isOpen || !submission || !student) return null;

  const completedCourses = submission.completedCourses || [];

  const handleSubmit = async () => {
    if (decision === 'reject' && !rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }

    setIsProcessing(true);
    try {
      if (decision === 'approve') {
        await onApprove(submission.id);
      } else {
        await onReject(submission.id, rejectionReason);
      }
      onClose();
    } catch (error) {
      console.error('Review error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDownload = () => {
    if (submission.transcriptFile && submission.transcriptFileName) {
      downloadBase64File(submission.transcriptFile, submission.transcriptFileName);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold">👨‍🎓 {student.name} ({student.studentId})</h2>
            <p className="text-blue-100 text-sm">{student.department} · {student.grade}학년</p>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6">
          {/* 점수 요약 */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 mb-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-sm text-gray-600 mb-1">총점</div>
                <div className="text-3xl font-bold text-blue-600">{submission.totalScore}점</div>
              </div>
              <div>
                <div className="text-sm text-gray-600 mb-1">이수 과목</div>
                <div className="text-3xl font-bold text-green-600">{submission.totalCompletedCount}개</div>
              </div>
            </div>
          </div>

          {/* 이수 과목 목록 */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3">✅ 이수 과목 ({completedCourses.length}개)</h3>
            <div className="space-y-2">
              {completedCourses.map((course, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex-1">
                    <div className="font-medium text-gray-900">{course.courseName}</div>
                    <div className="text-sm text-gray-600">
                      <span className="inline-block px-2 py-0.5 bg-white rounded text-xs mr-2">
                        {course.courseType}
                      </span>
                      {course.courseCode}
                    </div>
                  </div>
                  <div className="text-green-600 font-bold">{POINTS_PER_COURSE}점</div>
                </div>
              ))}
            </div>
          </div>

          {/* 제출 증빙 */}
          <div className="mb-6">
            <h3 className="font-bold text-gray-900 mb-3">📎 제출 증빙</h3>
            {submission.transcriptFileName ? (
              <div className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-300 rounded-lg">
                <div className="text-3xl">📄</div>
                <div className="flex-1">
                  <div className="font-medium text-gray-900">{submission.transcriptFileName}</div>
                  <div className="text-sm text-gray-600">{formatFileSize(submission.transcriptFileSize)}</div>
                </div>
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700"
                >
                  📥 다운로드
                </button>
              </div>
            ) : (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                ⚠️ 제출된 파일이 없습니다.
              </div>
            )}
          </div>

          {/* 제출 정보 */}
          <div className="mb-6 grid grid-cols-2 gap-4 text-sm">
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-600 mb-1">제출일</div>
              <div className="font-medium text-gray-900">{formatDate(submission.submittedAt)}</div>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <div className="text-gray-600 mb-1">현재 상태</div>
              <div className="font-medium text-gray-900">{SUBMISSION_STATUS_LABEL[submission.status]}</div>
            </div>
          </div>

          {/* 관리자 검토 */}
          {submission.status === 'pending' && (
            <div className="border-t pt-6">
              <h3 className="font-bold text-gray-900 mb-4">🔍 관리자 검토</h3>
              
              <div className="space-y-4">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="approve"
                      checked={decision === 'approve'}
                      onChange={(e) => setDecision(e.target.value)}
                      className="w-4 h-4 text-green-600"
                    />
                    <span className="font-medium text-gray-900">✅ 승인</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      name="decision"
                      value="reject"
                      checked={decision === 'reject'}
                      onChange={(e) => setDecision(e.target.value)}
                      className="w-4 h-4 text-red-600"
                    />
                    <span className="font-medium text-gray-900">❌ 반려</span>
                  </label>
                </div>

                {decision === 'reject' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      반려 사유 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      rows="3"
                      placeholder="반려 사유를 입력해주세요..."
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    />
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className={`flex-1 px-6 py-3 rounded-lg font-bold text-white ${
                      decision === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing ? '처리 중...' : decision === 'approve' ? '✅ 승인하기' : '❌ 반려하기'}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 이미 처리된 경우 */}
          {submission.status !== 'pending' && (
            <div className={`p-4 rounded-lg ${
              submission.status === 'approved' 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="font-semibold text-gray-900 mb-1">
                {submission.status === 'approved' ? '✅ 승인 완료' : '❌ 반려됨'}
              </div>
              <div className="text-sm text-gray-600">
                {submission.status === 'approved' 
                  ? `${submission.totalScore}점이 학생에게 반영되었습니다.`
                  : `반려 사유: ${submission.rejectionReason}`
                }
              </div>
              <div className="text-xs text-gray-500 mt-2">
                처리일: {formatDate(submission.reviewedAt)} · 처리자: {submission.reviewedBy}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmissionReviewModal;