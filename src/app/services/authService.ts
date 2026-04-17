// src/app/services/authService.ts

import {
  clearAuthSession,
  persistAuthSession,
  setStoredUser,
  type AuthUser,
  type TokenPayload,
} from './authSession';
import { requestJson, type ApiResponse } from './httpClient';

const API_BASE = '/api';

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

export interface TokenVO extends TokenPayload {
  user: AuthUser;
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  config: { auth?: boolean } = {}
): Promise<ApiResponse<T>> {
  return requestJson<T>(`${API_BASE}${path}`, options, config);
}

export const authService = {
  // 密码登录
  login: async (data: LoginRequest) => {
    const response = await request<TokenVO>('/client/auth/login', {
      method: 'POST',
      body: JSON.stringify(data),
    }, { auth: false });

    persistAuthSession(response.data);
    return response;
  },

  // 发送验证码
  sendCode: (data: SendCodeRequest) =>
    request<{ cooldownSeconds: number }>('/client/auth/send-code', {
      method: 'POST',
      body: JSON.stringify(data),
    }, { auth: false }),

  // 注册
  register: async (data: RegisterRequest) => {
    const response = await request<TokenVO>('/client/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    }, { auth: false });

    persistAuthSession(response.data);
    return response;
  },

  // 获取当前用户
  getCurrentUser: async () => {
    const response = await request<TokenVO['user']>('/client/auth/current-user', {
      method: 'GET',
    });

    setStoredUser(response.data);
    return response;
  },

  // 刷新令牌
  refreshToken: async (accessToken: string, refreshToken: string) => {
    const response = await request<TokenVO>('/client/auth/refresh-token', {
      method: 'POST',
      body: JSON.stringify({ accessToken, refreshToken }),
    }, { auth: false });

    persistAuthSession(response.data);
    return response;
  },

  // 登出
  logout: async () => {
    try {
      return await request<void>('/client/auth/logout', {
        method: 'POST',
      });
    } finally {
      clearAuthSession();
    }
  },
};
