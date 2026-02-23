import React, { useState, useMemo } from 'react';
import { SUBMISSION_STATUS_LABEL, POINTS_PER_COURSE } from './constants';
import { formatDate, formatFileSize } from '../../utils/coreCoursesHelpers';
import { getFilePreviewUrl, downloadFile } from '../../utils/storageHelpers';

// ─── AI 자동 대조 결과 컴포넌트 ───────────────────────────────────────────────
function AiAnalysisResult({ result, onClose }) {
  if (!result) return null;
  const { results = [], summary = {} } = result;

  return (
    <div className="mb-4 border-2 border-purple-300 rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">🤖</span>
          <span className="font-bold text-sm">AI 자동 대조 결과</span>
          {summary.documentType && (
            <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded-full">
              {summary.documentType}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-1 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="bg-purple-50 px-4 py-3 border-b border-purple-200">
        <div className="flex items-center gap-4 text-sm flex-wrap">
          <div className="flex items-center gap-1">
            <span className="text-gray-600">전체:</span>
            <span className="font-bold text-gray-900">{summary.totalChecked}과목</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-green-600">✅ 확인됨:</span>
            <span className="font-bold text-green-700">{summary.foundCount}과목</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-red-600">❌ 미확인:</span>
            <span className="font-bold text-red-700">{summary.notFoundCount}과목</span>
          </div>
          <div className={`ml-auto px-3 py-1 rounded-full text-xs font-bold ${
            summary.overallValid ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {summary.overallValid ? '✅ 증빙 유효' : '⚠️ 검토 필요'}
          </div>
        </div>
      </div>

      <div className="bg-white p-3 space-y-1.5 max-h-48 overflow-y-auto">
        {results.map((item, idx) => (
          <div key={idx} className={`flex items-start gap-2 p-2 rounded-lg border ${
            item.found ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
          }`}>
            <span className="flex-shrink-0 mt-0.5">{item.found ? '✅' : '❌'}</span>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-gray-900 text-sm truncate">{item.courseName}</div>
              <div className="text-xs text-gray-500 flex items-center gap-2 mt-0.5">
                <span>{item.courseCode}</span>
                {item.confidence && (
                  <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    item.confidence === 'high' ? 'bg-blue-100 text-blue-700' :
                    item.confidence === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {item.confidence === 'high' ? '확실' : item.confidence === 'medium' ? '유사' : '불확실'}
                  </span>
                )}
                {item.note && <span className="text-gray-400 italic">{item.note}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-yellow-50 border-t border-yellow-200 px-4 py-2">
        <p className="text-xs text-yellow-700">⚠️ AI 분석은 참고용입니다. 최종 판단은 관리자가 직접 확인하세요.</p>
      </div>
    </div>
  );
}

// ─── 메인 모달 컴포넌트 ──────────────────────────────────────────────────────
function SubmissionReviewModal({ isOpen, onClose, submission, student, onApprove, onReject, onPartialApprove }) {
  const [decision, setDecision] = useState('approve');
  const [rejectionReason, setRejectionReason] = useState('');
  const [adminComment, setAdminComment] = useState('');
  const [partialScore, setPartialScore] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [viewMode, setViewMode] = useState('split');
  const [selectedFileIndex, setSelectedFileIndex] = useState(0);

  // AI 자동 대조 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [analysisError, setAnalysisError] = useState(null);

  if (!isOpen || !submission || !student) return null;

  const completedCourses = submission.completedCourses || [];
  const uploadedFiles = submission.uploadedFiles || submission.uploaded_files || [];

  // PDF를 이미지(base64 PNG)로 변환하는 함수
  const convertPdfToImages = async (fileUrl, fileData) => {
    // pdf.js CDN 동적 로드
    if (!window.pdfjsLib) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
      });
      window.pdfjsLib.GlobalWorkerOptions.workerSrc =
        'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
    }

    const pdfjsLib = window.pdfjsLib;
    let pdfData;

    if (fileUrl) {
      // Storage URL → fetch로 ArrayBuffer 변환
      const res = await fetch(fileUrl);
      const arrayBuffer = await res.arrayBuffer();
      pdfData = new Uint8Array(arrayBuffer);
    } else if (fileData) {
      // base64 → Uint8Array 변환
      const base64 = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
      const binary = atob(base64);
      pdfData = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) pdfData[i] = binary.charCodeAt(i);
    } else {
      throw new Error('PDF 데이터를 읽을 수 없습니다.');
    }

    const pdf = await pdfjsLib.getDocument({ data: pdfData }).promise;
    const images = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 }); // 고해상도
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      await page.render({ canvasContext: ctx, viewport }).promise;
      // PNG base64로 변환 (data: prefix 제거)
      const dataUrl = canvas.toDataURL('image/png');
      images.push(dataUrl.split('base64,')[1]);
    }

    return images;
  };

  // AI 자동 대조 함수
  const handleAiAnalysis = async () => {
    if (!uploadedFiles || uploadedFiles.length === 0) {
      alert('분석할 파일이 없습니다.');
      return;
    }
    if (!completedCourses || completedCourses.length === 0) {
      alert('체크된 과목이 없습니다.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setAnalysisResult(null);

    try {
      const file = uploadedFiles[selectedFileIndex];
      if (!file) throw new Error('선택된 파일이 없습니다.');

      const fileData = file.data || file.fileData;
      const fileUrl = file.url;
      const fileName = file.name || file.fileName;

      if (!fileName) throw new Error('파일 이름을 읽을 수 없습니다.');
      if (!fileData && !fileUrl) throw new Error('파일 데이터를 읽을 수 없습니다.');

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      let requestBody;
      const fileNameLower = fileName.toLowerCase();
      const isPdf = fileNameLower.endsWith('.pdf');

      if (isPdf) {
        // PDF → 이미지 변환 후 전송
        const imageDataList = await convertPdfToImages(fileUrl, fileData);
        requestBody = { imageDataList, fileName, checkedCourses: completedCourses.map(c => ({ courseName: c.courseName, courseCode: c.courseCode })) };
      } else if (fileUrl) {
        // 이미지 Storage URL → URL 직접 전송
        requestBody = { fileUrl, fileName, checkedCourses: completedCourses.map(c => ({ courseName: c.courseName, courseCode: c.courseCode })) };
      } else {
        // 이미지 base64 → imageDataList로 전송
        const base64 = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
        requestBody = { imageDataList: [base64], fileName, checkedCourses: completedCourses.map(c => ({ courseName: c.courseName, courseCode: c.courseCode })) };
      }

      const response = await fetch(
        `${supabaseUrl}/functions/v1/analyze-certificate`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseKey}`,
            'apikey': supabaseKey,
          },
          body: JSON.stringify(requestBody),
        }
      );

      const result = await response.json();
      if (!result.success) throw new Error(result.error || 'AI 분석에 실패했습니다.');
      setAnalysisResult(result.data);
    } catch (err) {
      console.error('[AI 분석 오류]', err);
      setAnalysisError(err.message || 'AI 분석 중 오류가 발생했습니다.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 파일 미리보기 URL 생성 (Storage URL 및 기존 base64 모두 지원)
  const previewUrl = useMemo(() => {
    if (!uploadedFiles || uploadedFiles.length === 0 || selectedFileIndex >= uploadedFiles.length) return null;
    return getFilePreviewUrl(uploadedFiles[selectedFileIndex]);
  }, [uploadedFiles, selectedFileIndex]);

  const handleSubmit = async () => {
    if (decision === 'reject' && !rejectionReason.trim()) {
      alert('반려 사유를 입력해주세요.');
      return;
    }
    if (decision === 'partial') {
      const score = Number(partialScore);
      if (!partialScore || isNaN(score) || score < 0) {
        alert('유효한 점수를 입력해주세요. (0 이상의 숫자)');
        return;
      }
    }
    setIsProcessing(true);
    try {
      if (decision === 'approve') {
        await onApprove(submission.id);
      } else if (decision === 'partial') {
        if (onPartialApprove) {
          await onPartialApprove(submission.id, Number(partialScore), adminComment);
        } else {
          alert('일부 승인 기능이 연결되지 않았습니다.');
          return;
        }
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
    const file = uploadedFiles[selectedFileIndex];
    if (file) downloadFile(file);
  };

  const handleDownloadAllUploadedFiles = () => {
    uploadedFiles.forEach(file => {
      if (file) downloadFile(file);
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2">
      <div className="bg-white rounded-xl shadow-2xl w-[98vw] h-[98vh] overflow-hidden flex flex-col">
        {/* 헤더 */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div>
              <h2 className="text-xl font-bold">👨‍🎓 {student.name} ({student.studentId})</h2>
              <p className="text-blue-100 text-sm">{student.department} · {student.grade}학년</p>
            </div>
            <div className="flex gap-2 ml-6">
              <button
                onClick={() => setViewMode('split')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${viewMode === 'split' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white hover:bg-blue-400'}`}
              >
                📄📋 나란히
              </button>
              <button
                onClick={() => setViewMode('document')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${viewMode === 'document' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white hover:bg-blue-400'}`}
              >
                📄 증빙만
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${viewMode === 'list' ? 'bg-white text-blue-600' : 'bg-blue-500 text-white hover:bg-blue-400'}`}
              >
                📋 목록만
              </button>
            </div>
          </div>
          <button onClick={onClose} className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 점수 요약 바 */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 px-6 py-3 border-b">
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="text-xs text-gray-600 mb-1">
                {submission.status === 'partial' ? '승인 점수 (일부승인)' : '총점'}
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {submission.status === 'partial' && submission.approvedScore != null
                  ? submission.approvedScore
                  : submission.totalScore}점
              </div>
              {submission.status === 'partial' && (
                <div className="text-xs text-gray-400 mt-0.5">자동계산: {submission.totalScore}점</div>
              )}
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">이수 과목</div>
              <div className="text-2xl font-bold text-green-600">{submission.totalCompletedCount}개</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">25년 2학기 재학년도</div>
              <div className="text-2xl font-bold text-purple-600">{submission.gradeAt2025Fall || '2학년'}</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">제출일</div>
              <div className="text-sm font-medium text-gray-900">{formatDate(submission.submittedAt)}</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div>
              <div className="text-xs text-gray-600 mb-1">현재 상태</div>
              <div className="text-sm font-medium text-gray-900">{SUBMISSION_STATUS_LABEL[submission.status]}</div>
            </div>
          </div>
        </div>

        {/* 메인 컨텐츠 영역 */}
        <div className="flex-1 overflow-hidden flex">
          {viewMode === 'split' ? (
            <div className="flex w-full h-full">
              {/* 왼쪽: 증빙서류 뷰어 (2/3) */}
              <div className="w-2/3 border-r flex flex-col bg-gray-50">
                <div className="px-4 py-3 bg-gray-100 border-b">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      📎 제출 증빙 ({uploadedFiles.length}개)
                      {uploadedFiles.length > 0 && (
                        <button onClick={handleDownloadAllUploadedFiles} className="ml-2 px-3 py-1 bg-green-600 text-white text-xs rounded-lg font-medium hover:bg-green-700">
                          📥 전체 다운로드
                        </button>
                      )}
                    </h3>
                    <button onClick={handleDownload} disabled={uploadedFiles.length === 0} className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed">
                      📥 다운로드
                    </button>
                  </div>
                  {uploadedFiles.length > 1 && (
                    <div className="flex gap-2 overflow-x-auto mt-2">
                      {uploadedFiles.map((file, index) => (
                        <button
                          key={index}
                          onClick={() => { setSelectedFileIndex(index); setAnalysisResult(null); setAnalysisError(null); }}
                          className={`px-3 py-1 text-xs rounded-lg font-medium whitespace-nowrap transition-colors ${selectedFileIndex === index ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
                        >
                          📄 {(file.name || file.fileName || `파일 ${index + 1}`).substring(0, 20)}
                        </button>
                      ))}
                    </div>
                  )}
                  {uploadedFiles[selectedFileIndex] && (
                    <p className="text-xs text-gray-600 mt-2">
                      {uploadedFiles[selectedFileIndex].name || uploadedFiles[selectedFileIndex].fileName}
                      {(uploadedFiles[selectedFileIndex].size || uploadedFiles[selectedFileIndex].fileSize) ?
                        ` (${formatFileSize(uploadedFiles[selectedFileIndex].size || uploadedFiles[selectedFileIndex].fileSize)})` : ''}
                    </p>
                  )}
                </div>
                <div className="flex-1 overflow-auto p-4">
                  {previewUrl ? (
                    (() => {
                      const fileName = uploadedFiles[selectedFileIndex]?.fileName || uploadedFiles[selectedFileIndex]?.name || '';
                      return fileName.toLowerCase().endsWith('.pdf') ? (
                        <iframe src={previewUrl} className="w-full h-full border rounded-lg" title="PDF Viewer" />
                      ) : (
                        <img src={previewUrl} alt="증빙서류" className="w-full h-auto rounded-lg shadow-lg" />
                      );
                    })()
                  ) : uploadedFiles[selectedFileIndex] ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <div className="text-6xl mb-4">📄</div>
                      <p className="text-sm mb-2">미리보기를 지원하지 않는 파일입니다.</p>
                      <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">📥 파일 다운로드</button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full">
                      <div className="text-6xl mb-4">⚠️</div>
                      <p className="text-red-700">제출된 파일이 없습니다.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* 오른쪽: AI 대조 + 과목 목록 + 검토 (1/3) */}
              <div className="w-1/3 flex flex-col overflow-hidden">
                <div className="flex-1 overflow-auto p-4">

                  {/* ── AI 자동 대조 버튼 ── */}
                  <div className="mb-4">
                    <button
                      onClick={handleAiAnalysis}
                      disabled={isAnalyzing || uploadedFiles.length === 0 || completedCourses.length === 0}
                      className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
                        isAnalyzing
                          ? 'bg-purple-100 text-purple-400 cursor-not-allowed'
                          : 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-700 hover:to-indigo-700 hover:shadow-md'
                      }`}
                    >
                      {isAnalyzing ? (
                        <>
                          <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                          </svg>
                          AI 분석 중... (10~30초)
                        </>
                      ) : (
                        <>🤖 AI 자동 대조</>
                      )}
                    </button>
                    <p className="text-xs text-gray-400 text-center mt-1">
                      현재 파일({(uploadedFiles[selectedFileIndex]?.name || uploadedFiles[selectedFileIndex]?.fileName || '없음').substring(0, 20)})을 분석합니다
                    </p>
                  </div>

                  {/* AI 오류 */}
                  {analysisError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-700 font-medium">❌ 분석 실패</p>
                      <p className="text-xs text-red-600 mt-1">{analysisError}</p>
                    </div>
                  )}

                  {/* AI 분석 결과 */}
                  {analysisResult && (
                    <AiAnalysisResult result={analysisResult} onClose={() => setAnalysisResult(null)} />
                  )}

                  {/* 이수 과목 목록 */}
                  <div>
                    <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                      ✅ 이수 과목 목록
                      <span className="text-sm font-normal text-gray-600">({completedCourses.length}개)</span>
                    </h3>
                    <div className="space-y-2">
                      {completedCourses.map((course, index) => {
                        const aiResult = analysisResult?.results?.find(
                          r => r.courseCode === course.courseCode || r.courseName === course.courseName
                        );
                        return (
                          <div key={index} className={`p-3 rounded-lg border transition-colors ${
                            aiResult
                              ? aiResult.found ? 'bg-green-50 border-green-300' : 'bg-red-50 border-red-300'
                              : 'bg-green-50 border-green-200 hover:bg-green-100'
                          }`}>
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="font-medium text-gray-900 mb-1 flex items-center gap-1.5">
                                  {aiResult && <span>{aiResult.found ? '✅' : '❌'}</span>}
                                  {course.courseName}
                                </div>
                                <div className="text-xs text-gray-600 space-x-2">
                                  <span className="inline-block px-2 py-0.5 bg-white rounded">{course.courseType}</span>
                                  <span>{course.courseCode}</span>
                                  <span>{course.credits}학점</span>
                                </div>
                              </div>
                              <div className="text-green-600 font-bold text-lg ml-2">{POINTS_PER_COURSE}점</div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* 관리자 검토 영역 */}
                {submission.status === 'pending' && (
                  <div className="border-t bg-white p-4">
                    <h3 className="font-bold text-gray-900 mb-3">🔍 관리자 검토</h3>
                    <div className="space-y-3">
                      <div className="flex gap-3 flex-wrap">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="decision" value="approve" checked={decision === 'approve'} onChange={(e) => setDecision(e.target.value)} className="w-4 h-4 text-green-600" />
                          <span className="font-medium text-gray-900">✅ 승인</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="decision" value="partial" checked={decision === 'partial'} onChange={(e) => setDecision(e.target.value)} className="w-4 h-4 text-yellow-500" />
                          <span className="font-medium text-gray-900">🔶 일부 승인</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input type="radio" name="decision" value="reject" checked={decision === 'reject'} onChange={(e) => setDecision(e.target.value)} className="w-4 h-4 text-red-600" />
                          <span className="font-medium text-gray-900">❌ 반려</span>
                        </label>
                      </div>

                      {decision === 'partial' && (
                        <div className="space-y-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              수동 점수 입력 <span className="text-red-500">*</span>
                              <span className="text-gray-400 font-normal ml-1">(자동계산: {submission.totalScore}점)</span>
                            </label>
                            <input
                              type="number"
                              min="0"
                              value={partialScore}
                              onChange={(e) => setPartialScore(e.target.value)}
                              placeholder="부여할 점수 입력"
                              className="w-full px-3 py-2 text-sm border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">코멘트 (선택)</label>
                            <textarea
                              value={adminComment}
                              onChange={(e) => setAdminComment(e.target.value)}
                              rows="2"
                              placeholder="일부 승인 사유 또는 안내 메시지..."
                              className="w-full px-3 py-2 text-sm border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-white resize-none"
                            />
                          </div>
                        </div>
                      )}

                      {decision === 'reject' && (
                        <div>
                          <label className="block text-xs font-medium text-gray-700 mb-1">반려 사유 <span className="text-red-500">*</span></label>
                          <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows="2" placeholder="반려 사유를 입력해주세요..." className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none" />
                        </div>
                      )}

                      <button
                        onClick={handleSubmit}
                        disabled={isProcessing}
                        className={`w-full px-4 py-2 rounded-lg font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                          decision === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                          decision === 'partial' ? 'bg-yellow-500 hover:bg-yellow-600' :
                          'bg-red-600 hover:bg-red-700'
                        }`}
                      >
                        {isProcessing ? '처리 중...' :
                          decision === 'approve' ? '✅ 승인하기' :
                          decision === 'partial' ? `🔶 일부 승인 (${partialScore || '?'}점)` :
                          '❌ 반려하기'}
                      </button>
                    </div>
                  </div>
                )}

                {submission.status !== 'pending' && (
                  <div className={`p-4 m-4 rounded-lg ${
                    submission.status === 'approved' ? 'bg-green-50 border border-green-200' :
                    submission.status === 'partial' ? 'bg-yellow-50 border border-yellow-200' :
                    'bg-red-50 border border-red-200'
                  }`}>
                    <div className="font-semibold text-gray-900 mb-1">
                      {submission.status === 'approved' ? '✅ 승인 완료' :
                       submission.status === 'partial' ? '🔶 일부 승인' : '❌ 반려됨'}
                    </div>
                    <div className="text-sm text-gray-600">
                      {submission.status === 'approved' ? `${submission.totalScore}점이 학생에게 반영되었습니다.` :
                       submission.status === 'partial' ? `${submission.approvedScore ?? submission.totalScore}점이 학생에게 반영되었습니다.${submission.adminComment ? ` / ${submission.adminComment}` : ''}` :
                       `반려 사유: ${submission.rejectionReason}`}
                    </div>
                    <div className="text-xs text-gray-500 mt-2">처리일: {formatDate(submission.reviewedAt)}</div>
                  </div>
                )}
              </div>
            </div>
          ) : viewMode === 'document' ? (
            <div className="w-full h-full flex flex-col bg-gray-50">
              <div className="px-6 py-3 bg-gray-100 border-b">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-bold text-gray-900">📎 제출 증빙 ({uploadedFiles.length}개)</h3>
                    {uploadedFiles[selectedFileIndex] && (
                      <p className="text-xs text-gray-600 mt-1">
                        {uploadedFiles[selectedFileIndex].name || uploadedFiles[selectedFileIndex].fileName}
                        {(uploadedFiles[selectedFileIndex].size || uploadedFiles[selectedFileIndex].fileSize) ?
                          ` (${formatFileSize(uploadedFiles[selectedFileIndex].size || uploadedFiles[selectedFileIndex].fileSize)})` : ''}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {uploadedFiles.length > 0 && (
                      <>
                        <button onClick={handleDownloadAllUploadedFiles} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700">📥 전체 다운로드</button>
                        <button onClick={handleDownload} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">📥 다운로드</button>
                      </>
                    )}
                  </div>
                </div>
                {uploadedFiles.length > 1 && (
                  <div className="flex gap-2 overflow-x-auto mt-3">
                    {uploadedFiles.map((file, index) => (
                      <button key={index} onClick={() => setSelectedFileIndex(index)} className={`px-3 py-2 text-sm rounded-lg font-medium whitespace-nowrap transition-colors ${selectedFileIndex === index ? 'bg-blue-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}>
                        📄 {(file.name || file.fileName || `파일 ${index + 1}`).substring(0, 30)}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex-1 overflow-auto p-6">
                {previewUrl ? (
                  (() => {
                    const fileName = uploadedFiles[selectedFileIndex]?.fileName || uploadedFiles[selectedFileIndex]?.name || '';
                    return fileName.toLowerCase().endsWith('.pdf') ? (
                      <iframe src={previewUrl} className="w-full h-full border rounded-lg" title="PDF Viewer" />
                    ) : (
                      <div className="flex justify-center">
                        <img src={previewUrl} alt="증빙서류" className="max-w-full h-auto rounded-lg shadow-2xl" />
                      </div>
                    );
                  })()
                ) : uploadedFiles[selectedFileIndex] ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <div className="text-8xl mb-4">📄</div>
                    <p className="text-lg mb-4">미리보기를 지원하지 않는 파일입니다.</p>
                    <button onClick={handleDownload} className="px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">📥 파일 다운로드</button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full">
                    <div className="text-8xl mb-4">⚠️</div>
                    <p className="text-red-700 text-lg">제출된 파일이 없습니다.</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full overflow-auto p-6">
              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3">✅ 이수 과목 ({completedCourses.length}개)</h3>
                <div className="space-y-2">
                  {completedCourses.map((course, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{course.courseName}</div>
                        <div className="text-sm text-gray-600">
                          <span className="inline-block px-2 py-0.5 bg-white rounded text-xs mr-2">{course.courseType}</span>
                          {course.courseCode}
                        </div>
                      </div>
                      <div className="text-green-600 font-bold">{POINTS_PER_COURSE}점</div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-bold text-gray-900 mb-3 flex items-center justify-between">
                  <span>📎 제출 증빙 ({uploadedFiles.length}개)</span>
                  {uploadedFiles.length > 0 && (
                    <button onClick={handleDownloadAllUploadedFiles} className="px-3 py-1 bg-green-600 text-white text-sm rounded-lg font-medium hover:bg-green-700">📥 전체 다운로드</button>
                  )}
                </h3>
                {uploadedFiles.length > 0 ? (
                  <div className="space-y-2">
                    {uploadedFiles.map((file, index) => (
                      <div key={index} className="flex items-center gap-3 p-4 bg-gray-50 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors">
                        <div className="text-3xl">📄</div>
                        <div className="flex-1">
                          <div className="font-medium text-gray-900">{file.name || file.fileName}</div>
                          <div className="text-sm text-gray-600">
                            {file.size || file.fileSize ? formatFileSize(file.size || file.fileSize) : '파일 크기 정보 없음'}
                          </div>
                        </div>
                        <button onClick={() => { setSelectedFileIndex(index); downloadFile(file); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700">
                          📥 다운로드
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">⚠️ 제출된 파일이 없습니다.</div>
                )}
              </div>

              {submission.status === 'pending' && (
                <div className="border-t pt-6">
                  <h3 className="font-bold text-gray-900 mb-4">🔍 관리자 검토</h3>
                  <div className="space-y-4">
                    <div className="flex gap-4 flex-wrap">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="decision" value="approve" checked={decision === 'approve'} onChange={(e) => setDecision(e.target.value)} className="w-4 h-4 text-green-600" />
                        <span className="font-medium text-gray-900">✅ 승인</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="decision" value="partial" checked={decision === 'partial'} onChange={(e) => setDecision(e.target.value)} className="w-4 h-4 text-yellow-500" />
                        <span className="font-medium text-gray-900">🔶 일부 승인</span>
                      </label>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input type="radio" name="decision" value="reject" checked={decision === 'reject'} onChange={(e) => setDecision(e.target.value)} className="w-4 h-4 text-red-600" />
                        <span className="font-medium text-gray-900">❌ 반려</span>
                      </label>
                    </div>

                    {decision === 'partial' && (
                      <div className="space-y-3 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            수동 점수 입력 <span className="text-red-500">*</span>
                            <span className="text-gray-400 font-normal ml-1">(자동계산: {submission.totalScore}점)</span>
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={partialScore}
                            onChange={(e) => setPartialScore(e.target.value)}
                            placeholder="부여할 점수를 입력하세요"
                            className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">코멘트 (선택)</label>
                          <textarea
                            value={adminComment}
                            onChange={(e) => setAdminComment(e.target.value)}
                            rows="3"
                            placeholder="일부 승인 사유 또는 학생에게 전달할 안내 메시지..."
                            className="w-full px-4 py-2 border border-yellow-300 rounded-lg focus:ring-2 focus:ring-yellow-400 bg-white resize-none"
                          />
                        </div>
                      </div>
                    )}

                    {decision === 'reject' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">반려 사유 <span className="text-red-500">*</span></label>
                        <textarea value={rejectionReason} onChange={(e) => setRejectionReason(e.target.value)} rows="3" placeholder="반려 사유를 입력해주세요..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 resize-none" />
                      </div>
                    )}

                    <button
                      onClick={handleSubmit}
                      disabled={isProcessing}
                      className={`flex-1 w-full px-6 py-3 rounded-lg font-bold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        decision === 'approve' ? 'bg-green-600 hover:bg-green-700' :
                        decision === 'partial' ? 'bg-yellow-500 hover:bg-yellow-600' :
                        'bg-red-600 hover:bg-red-700'
                      }`}
                    >
                      {isProcessing ? '처리 중...' :
                        decision === 'approve' ? '✅ 승인하기' :
                        decision === 'partial' ? `🔶 일부 승인 (${partialScore || '?'}점)` :
                        '❌ 반려하기'}
                    </button>
                  </div>
                </div>
              )}

              {submission.status !== 'pending' && (
                <div className={`p-4 rounded-lg ${
                  submission.status === 'approved' ? 'bg-green-50 border border-green-200' :
                  submission.status === 'partial' ? 'bg-yellow-50 border border-yellow-200' :
                  'bg-red-50 border border-red-200'
                }`}>
                  <div className="font-semibold text-gray-900 mb-1">
                    {submission.status === 'approved' ? '✅ 승인 완료' :
                     submission.status === 'partial' ? '🔶 일부 승인' : '❌ 반려됨'}
                  </div>
                  <div className="text-sm text-gray-600">
                    {submission.status === 'approved' ? `${submission.totalScore}점이 학생에게 반영되었습니다.` :
                     submission.status === 'partial' ? `${submission.approvedScore ?? submission.totalScore}점이 학생에게 반영되었습니다.${submission.adminComment ? ` / ${submission.adminComment}` : ''}` :
                     `반려 사유: ${submission.rejectionReason}`}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">처리일: {formatDate(submission.reviewedAt)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default SubmissionReviewModal;
