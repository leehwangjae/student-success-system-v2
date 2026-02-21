import { supabase } from '../lib/supabase';

const BUCKET = 'student-submissions';

/**
 * 파일을 Supabase Storage에 업로드하고 메타데이터 반환
 * @param {File} file - 업로드할 파일 객체
 * @param {string} folder - 'core-courses/{userId}' 또는 'non-curricular/{userId}'
 * @returns {{ storagePath, url }}
 */
const MIME_TYPE_MAP = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.gif': 'image/gif',
  '.pdf': 'application/pdf',
  '.doc': 'application/msword',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

export async function uploadFileToStorage(file, folder) {
  const sanitizedName = file.name.replace(/[^a-zA-Z0-9가-힣._-]/g, '_');
  const filePath = `${folder}/${Date.now()}_${sanitizedName}`;

  const ext = '.' + file.name.split('.').pop().toLowerCase();
  const contentType = MIME_TYPE_MAP[ext] || file.type;

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(filePath, file, { cacheControl: '3600', upsert: false, contentType });

  if (error) throw error;

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(filePath);

  return { storagePath: filePath, url: data.publicUrl };
}

/**
 * Storage에서 파일 삭제
 * @param {string} storagePath - 삭제할 파일 경로
 */
export async function deleteFileFromStorage(storagePath) {
  if (!storagePath) return;
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) console.error('Storage 파일 삭제 실패:', error);
}

/**
 * 파일 다운로드 (Storage URL 또는 base64 모두 처리)
 * @param {object} file - 파일 객체 (새 형식: {url, name} / 구 형식: {data|fileData, name|fileName})
 */
export function downloadFile(file) {
  const name = file.name || file.fileName || 'download';

  if (file.url) {
    // 새 형식: Storage URL
    const link = document.createElement('a');
    link.href = `${file.url}?download=${encodeURIComponent(name)}`;
    link.download = name;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return;
  }

  // 구 형식: base64
  const data = file.data || file.fileData;
  if (!data) return;
  const link = document.createElement('a');
  link.href = data;
  link.download = name;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * 미리보기 URL 반환 (Storage URL 또는 base64 모두 처리)
 * @param {object} file
 * @returns {string|null}
 */
export function getFilePreviewUrl(file) {
  if (!file) return null;

  // 새 형식: Storage URL
  if (file.url) return file.url;

  // 구 형식: base64
  const fileData = file.data || file.fileData;
  const fileName = (file.name || file.fileName || '').toLowerCase();
  if (!fileData || !fileName) return null;

  let mimeType = '';
  if (fileName.endsWith('.pdf')) mimeType = 'application/pdf';
  else if (fileName.endsWith('.png')) mimeType = 'image/png';
  else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) mimeType = 'image/jpeg';
  else if (fileName.endsWith('.gif')) mimeType = 'image/gif';
  else return null;

  const base64Data = fileData.includes('base64,') ? fileData.split('base64,')[1] : fileData;
  return `data:${mimeType};base64,${base64Data}`;
}
