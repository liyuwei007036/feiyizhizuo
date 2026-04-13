// src/app/context/AuthContext.tsx

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  account: string;
  displayName: string;
  avatarUrl?: string;
  badge?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (account: string, password: string) => Promise<void>;
  loginByCode: (phone: string, code: string) => Promise<void>;
  register: (phone: string, code: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendCode: (phone: string) => Promise<number>;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时检查本地 token
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem(TOKEN_KEY);
      if (token) {
        try {
          const res = await authService.getCurrentUser();
          if (res.data) {
            setUser(res.data);
          }
        } catch {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
        }
      }
      setIsLoading(false);
    };
    initAuth();
  }, []);

  const login = useCallback(async (account: string, password: string) => {
    const res = await authService.login({ account, password });
    if (res.data) {
      localStorage.setItem(TOKEN_KEY, res.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, res.data.refreshToken);
      setUser(res.data.user);
    }
  }, []);

  const loginByCode = useCallback(async (phone: string, code: string) => {
    // 验证码登录: 调用注册接口完成登录
    const res = await authService.register({ phone, code, password: '' });
    if (res.data) {
      localStorage.setItem(TOKEN_KEY, res.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, res.data.refreshToken);
      setUser(res.data.user);
    }
  }, []);

  const register = useCallback(async (phone: string, code: string, password: string) => {
    const res = await authService.register({ phone, code, password });
    if (res.data) {
      localStorage.setItem(TOKEN_KEY, res.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, res.data.refreshToken);
      setUser(res.data.user);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      setUser(null);
    }
  }, []);

  const sendCode = useCallback(async (phone: string): Promise<number> => {
    const res = await authService.sendCode({ phone });
    return res.data?.cooldownSeconds || 60;
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        loginByCode,
        register,
        logout,
        sendCode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
