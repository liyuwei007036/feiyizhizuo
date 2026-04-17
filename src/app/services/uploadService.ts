// src/app/services/uploadService.ts

import { fetchWithAutoRefresh } from './httpClient';

const API_BASE = '/api';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface UploadedFileInfo {
  fileId: string;
  url?: string;
  fileName?: string;
  mimeType?: string;
  size?: number;
  bucketName?: string;
  fileScene?: string;
}

async function uploadByPath(path: string, file: File): Promise<UploadedFileInfo> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithAutoRefresh(`${API_BASE}${path}`, {
    method: 'POST',
    body: formData,
  });

  // 注意：multipart/form-data 请求不需要手动设置 Content-Type
  // fetch 会自动设置正确的 Content-Type（包含 boundary）

  if (!response.ok) {
    let message = `HTTP ${response.status}`;
    try {
      const errData = await response.json();
      message = errData.message || message;
    } catch {
      // 非 JSON 响应
    }
    throw new Error(message);
  }

  const data: ApiResponse<Record<string, string | number | null | undefined>> = await response.json();

  if (data.code !== 0 && data.code !== 200) {
    throw new Error(data.message || '上传失败');
  }

  const payload = (data.data && typeof data.data === 'object')
    ? data.data
    : { fileId: data.data };
  const fileId = String(payload.fileId || payload.id || '');
  if (!fileId) {
    throw new Error('上传成功但未返回 fileId');
  }

  return {
    fileId,
    url: payload.url ? String(payload.url) : undefined,
    fileName: payload.fileName ? String(payload.fileName) : undefined,
    mimeType: payload.mimeType ? String(payload.mimeType) : undefined,
    size: typeof payload.size === 'number' ? payload.size : undefined,
    bucketName: payload.bucketName ? String(payload.bucketName) : undefined,
    fileScene: payload.fileScene ? String(payload.fileScene) : undefined,
  };
}

export async function uploadFile(file: File): Promise<string> {
  const uploaded = await uploadByPath('/client/file/upload/file', file);
  return uploaded.fileId;
}

export async function uploadChatImage(file: File): Promise<UploadedFileInfo> {
  return uploadByPath('/client/file/upload/chat-image', file);
}
