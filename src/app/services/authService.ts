// src/app/services/authService.ts

const API_BASE = '/ump-client-user-service';

interface LoginRequest {
  account: string;    // 账号或手机号
  password: string;
}

interface SendCodeRequest {
  phone: string;
}

interface RegisterRequest {
  phone: string;
  code: string;
  password: string;
}

interface TokenVO {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    account: string;
    displayName: string;
    avatarUrl?: string;
    badge?: string;
  };
}

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const token = localStorage.getItem('accessToken');

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  });

  const data = await response.json();

  if (data.code !== 0 && data.code !== 200) {
    throw new Error(data.message || '请求失败');
  }

  return data;
}

export const authService = {
  // 密码登录
  login: (data: LoginRequest) =>
    request<TokenVO>('/client/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 发送验证码
  sendCode: (data: SendCodeRequest) =>
    request<{ cooldownSeconds: number }>('/client/auth/send-code', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 注册
  register: (data: RegisterRequest) =>
    request<TokenVO>('/client/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  // 获取当前用户
  getCurrentUser: () =>
    request<TokenVO['user']>('/client/auth/current-user', {
      method: 'GET',
    }),

  // 刷新令牌
  refreshToken: (accessToken: string, refreshToken: string) =>
    request<TokenVO>('/client/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ accessToken, refreshToken }),
    }),

  // 登出
  logout: () =>
    request<void>('/client/auth/logout', {
      method: 'POST',
    }),
};
