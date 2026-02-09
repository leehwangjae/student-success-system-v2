import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useModalStore } from '../../hooks/useModal';

function NoticeModal({ isOpen, onClose, notice }) {
  const { addOrUpdateNotice, currentUser } = useAppContext();
  const { showAlert } = useModalStore();
  const isEditMode = !!notice;

  const [formData, setFormData] = useState({
    title: '',
    field: '전체',
    content: '',
    isPopup: false
  });

  const [imagePreview, setImagePreview] = useState(null);
  const [uploadedFiles, setUploadedFiles] = useState([]);

  useEffect(() => {
    if (notice) {
      // 수정 모드 - 기존 데이터 채우기
      setFormData({
        title: notice.title || '',
        field: notice.field || '전체',
        content: notice.content || '',
        isPopup: notice.isPopup || false
      });
      
      if (notice.imageUrl) {
        setImagePreview(notice.imageUrl);
      } else {
        setImagePreview(null);
      }
      
      if (notice.attachedFiles && notice.attachedFiles.length > 0) {
        setUploadedFiles(notice.attachedFiles);
      } else {
        setUploadedFiles([]);
      }
    } else {
      // 추가 모드 - 초기화
      setFormData({
        title: '',
        field: '전체',
        content: '',
        isPopup: false
      });
      setImagePreview(null);
      setUploadedFiles([]);
    }
  }, [notice, isOpen]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        showAlert('이미지 파일은 5MB 이하만 업로드 가능합니다.');
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newFiles = files.map(file => ({
      id: Date.now() + Math.random(),
      name: file.name,
      size: file.size,
      type: file.type,
      data: file
    }));

    setUploadedFiles(prev => [...prev, ...newFiles]);
  };

  const removeFile = (fileId) => {
    setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
  };

  const removeImage = () => {
    setImagePreview(null);
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!formData.title.trim()) {
      showAlert('제목을 입력해주세요.');
      return;
    }

    if (!formData.content.trim()) {
      showAlert('내용을 입력해주세요.');
      return;
    }

    const noticeData = {
      ...formData,
      imageUrl: imagePreview || '',
      attachedFiles: uploadedFiles,
      author: currentUser.name,
      date: new Date().toISOString().split('T')[0],
      views: notice ? notice.views : 0
    };

    addOrUpdateNotice(noticeData, notice);
    showAlert(isEditMode ? '공지사항이 수정되었습니다.' : '공지사항이 등록되었습니다.');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 헤더 */}
        <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-4 rounded-t-2xl flex justify-between items-center">
          <h2 className="text-2xl font-bold">
            {isEditMode ? '📝 공지사항 수정' : '✨ 공지사항 추가'}
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 폼 */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* 제목 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              제목 *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="공지사항 제목을 입력하세요"
              required
            />
          </div>

          {/* 분야 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              분야 *
            </label>
            <select
              name="field"
              value={formData.field}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              required
            >
              <option value="전체">전체</option>
              <option value="바이오">바이오</option>
              <option value="반도체">반도체</option>
              <option value="물류">물류</option>
            </select>
          </div>

          {/* 팝업으로 표시 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.isPopup}
                onChange={(e) => setFormData(prev => ({ ...prev, isPopup: e.target.checked }))}
                className="w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="font-medium text-gray-900">📢 학생 로그인 시 팝업으로 표시</div>
                <div className="text-sm text-gray-600 mt-1">
                  활성화하면 학생이 로그인할 때 이 공지사항이 자동으로 팝업창으로 표시됩니다.
                  <br />
                  학생은 "오늘 하루 보지 않기" 또는 "다시 보지 않기"를 선택할 수 있습니다.
                </div>
              </div>
            </label>
          </div>

          {/* 이미지 업로드 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              이미지 첨부
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-64 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-2 right-2 bg-red-600 text-white p-2 rounded-full hover:bg-red-700"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center cursor-pointer">
                  <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-gray-600">이미지 업로드 (최대 5MB)</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
          </div>

          {/* 파일 첨부 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              첨부파일
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
              <label className="flex flex-col items-center justify-center cursor-pointer">
                <svg className="w-10 h-10 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <span className="text-sm text-gray-600">파일 추가</span>
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {uploadedFiles.length > 0 && (
                <div className="mt-4 space-y-2">
                  {uploadedFiles.map(file => (
                    <div key={file.id} className="flex items-center justify-between bg-gray-50 p-2 rounded">
                      <div className="flex items-center gap-2">
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <span className="text-sm text-gray-700">{file.name}</span>
                        <span className="text-xs text-gray-500">
                          ({(file.size / 1024).toFixed(1)} KB)
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeFile(file.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 내용 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              내용 *
            </label>
            <textarea
              name="content"
              value={formData.content}
              onChange={handleChange}
              rows="12"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="공지사항 내용을 입력하세요"
              required
            />
          </div>

          {/* 버튼 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-semibold hover:bg-gray-300 transition-colors"
            >
              취소
            </button>
            <button
              type="submit"
              className="flex-1 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all"
            >
              {isEditMode ? '수정하기' : '등록하기'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default NoticeModal;