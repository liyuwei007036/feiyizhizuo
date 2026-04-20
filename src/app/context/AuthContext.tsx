// src/app/context/AuthContext.tsx

import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
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
  authError: string | null;
  login: (account: string, password: string) => Promise<void>;
  loginByCode: (phone: string, code: string) => Promise<void>;
  register: (phone: string, code: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  sendCode: (phone: string) => Promise<number>;
}

const AuthContext = createContext<AuthContextType | null>(null);
const AUTO_LOGIN_FAILED_MESSAGE = '默认账号自动登录失败，请检查认证服务是否可用';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => readStoredUser());
  const [isLoading, setIsLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const autoLoginPromiseRef = useRef<Promise<User | null> | null>(null);

  useEffect(() => {
    return subscribeAuthSession(snapshot => {
      setUser(snapshot.user);
    });
  }, []);

  const resolveUser = useCallback((nextUser: User | null) => {
    setUser(nextUser);
    setAuthError(null);
    return nextUser;
  }, []);

  const autoLogin = useCallback(async () => {
    if (autoLoginPromiseRef.current) {
      return autoLoginPromiseRef.current;
    }

    autoLoginPromiseRef.current = authService.loginWithDefaultAccount()
      .then(response => {
        const nextUser = response.data?.user ?? null;

        if (!nextUser) {
          throw new Error(AUTO_LOGIN_FAILED_MESSAGE);
        }

        return resolveUser(nextUser);
      })
      .catch(error => {
        const message =
          error instanceof Error && error.message.trim()
            ? error.message
            : AUTO_LOGIN_FAILED_MESSAGE;

        setAuthError(message);
        throw error;
      })
      .finally(() => {
        autoLoginPromiseRef.current = null;
      });

    return autoLoginPromiseRef.current;
  }, [resolveUser]);

  const ensureAuthenticated = useCallback(async () => {
    const session = readAuthSession();

    if (session.user) {
      resolveUser(session.user);
    }

    if (session.accessToken || session.refreshToken) {
      try {
        const response = await authService.getCurrentUser();
        return resolveUser(response.data ?? session.user ?? null);
      } catch {
        clearAuthSession();
      }
    }

    return autoLogin();
  }, [autoLogin, resolveUser]);

  useEffect(() => {
    let cancelled = false;

    const initAuth = async () => {
      try {
        await ensureAuthenticated();
      } catch {
        // 失败信息由 autoLogin 维护到 authError，布局层负责展示阻断态。
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void initAuth();
    return () => {
      cancelled = true;
    };
  }, [ensureAuthenticated]);

  useEffect(() => {
    if (isLoading || user || authError) {
      return;
    }

    let cancelled = false;

    const recoverSession = async () => {
      setIsLoading(true);

      try {
        await autoLogin();
      } catch {
        // 错误信息已经记录到 authError。
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    void recoverSession();
    return () => {
      cancelled = true;
    };
  }, [authError, autoLogin, isLoading, user]);

  const login = useCallback(async (account: string, password: string) => {
    setAuthError(null);
    const res = await authService.login({ account, password });
    if (res.data) {
      resolveUser(res.data.user ?? null);
    }
  }, [resolveUser]);

  const loginByCode = useCallback(async (phone: string, code: string) => {
    setAuthError(null);
    // 验证码登录: 调用注册接口完成登录
    const res = await authService.register({ phone, code, password: '' });
    if (res.data) {
      resolveUser(res.data.user ?? null);
    }
  }, [resolveUser]);

  const register = useCallback(async (phone: string, code: string, password: string) => {
    setAuthError(null);
    const res = await authService.register({ phone, code, password });
    if (res.data) {
      resolveUser(res.data.user ?? null);
    }
  }, [resolveUser]);

  const logout = useCallback(async () => {
    setIsLoading(true);
    setAuthError(null);

    try {
      await authService.logout();
    } finally {
      clearAuthSession();
      setUser(null);
    }

    try {
      await autoLogin();
    } finally {
      setIsLoading(false);
    }
  }, [autoLogin]);

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
        authError,
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
