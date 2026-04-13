// src/app/services/uploadService.ts

const API_BASE = '/api';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export async function uploadFile(file: File): Promise<string> {
  const token = localStorage.getItem('accessToken');

  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE}/client/file/upload/file`, {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
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

  const data: ApiResponse<Record<string, string>> = await response.json();

  if (data.code !== 0 && data.code !== 200) {
    throw new Error(data.message || '上传失败');
  }

  // 返回文件路径或 URL
  // 尝试常见的字段名
  return data.data.url || data.data.objectKey || data.data.path || Object.values(data.data)[0] || '';
}
