// src/app/context/AuthContext.tsx

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { authService } from '../services/authService';
import {
  clearAuthSession,
  readAuthSession,
  readStoredUser,
  subscribeAuthSession,
  type AuthUser,
} from '../services/authSession';

type User = AuthUser;

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(true);

  const isAuthPage =
    location.pathname === '/' ||
    location.pathname === '/login' ||
    location.pathname === '/register';

  useEffect(() => {
    return subscribeAuthSession(snapshot => {
      setUser(snapshot.user);
    });
  }, []);

  // 初始化时检查本地 token
  useEffect(() => {
    const initAuth = async () => {
      const session = readAuthSession();

      if (session.user) {
        setUser(session.user);
      }

      if (session.accessToken || session.refreshToken) {
        try {
          const res = await authService.getCurrentUser();
          if (res.data) {
            setUser(res.data);
          }
        } catch {
          clearAuthSession();
        }
      }

      setIsLoading(false);
    };

    void initAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    if (user) {
      if (isAuthPage) {
        navigate('/zhihui', { replace: true });
      }
      return;
    }

    if (!isAuthPage) {
      navigate('/login', { replace: true });
    }
  }, [isAuthPage, isLoading, navigate, user]);

  const login = useCallback(async (account: string, password: string) => {
    const res = await authService.login({ account, password });
    if (res.data) {
      setUser(res.data.user);
    }
  }, []);

  const loginByCode = useCallback(async (phone: string, code: string) => {
    // 验证码登录: 调用注册接口完成登录
    const res = await authService.register({ phone, code, password: '' });
    if (res.data) {
      setUser(res.data.user);
    }
  }, []);

  const register = useCallback(async (phone: string, code: string, password: string) => {
    const res = await authService.register({ phone, code, password });
    if (res.data) {
      setUser(res.data.user);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } finally {
      clearAuthSession();
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
