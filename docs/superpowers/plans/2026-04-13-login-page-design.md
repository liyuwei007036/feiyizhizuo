# 登录注册页面实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 创建独立的登录页和注册页，支持密码登录和验证码登录两种方式

**Architecture:**
- 登录和注册使用独立路由 (`/login`, `/register`)
- 创建 API 服务层封装认证接口
- 创建 AuthContext 管理登录状态和 Token
- 登录成功后跳转到首页

**Tech Stack:** React Router v7, react-hook-form, lucide-react, sonner

---

## 文件结构

```
src/
├── app/
│   ├── pages/
│   │   ├── LoginPage.tsx          # 新增: 登录页
│   │   └── RegisterPage.tsx       # 新增: 注册页
│   ├── services/
│   │   └── authService.ts         # 新增: 认证 API 服务
│   └── context/
│       └── AuthContext.tsx        # 新增: 认证状态管理
└── app/
    └── routes.tsx                 # 修改: 添加登录/注册路由
```

---

## 任务清单

### Task 1: 创建认证 API 服务

**Files:**
- Create: `src/app/services/authService.ts`

- [ ] **Step 1: 创建 authService.ts**

```typescript
// src/app/services/authService.ts

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

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
```

- [ ] **Step 2: 提交代码**

```bash
git add src/app/services/authService.ts
git commit -m "feat: add auth API service"
```

---

### Task 2: 创建 AuthContext 认证状态管理

**Files:**
- Create: `src/app/context/AuthContext.tsx`

- [ ] **Step 1: 创建 AuthContext.tsx**

```typescript
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
  sendCode: (phone: string) => Promise<number>; // 返回冷却秒数
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
          // token 过期或无效，清除
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
    // 验证码登录: 先注册(如果用户不存在)或通过特殊接口
    // 这里假设后端支持验证码登录，或复用注册接口
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
```

- [ ] **Step 2: 提交代码**

```bash
git add src/app/context/AuthContext.tsx
git commit -m "feat: add AuthContext for authentication state"
```

---

### Task 3: 创建登录页面

**Files:**
- Create: `src/app/pages/LoginPage.tsx`

- [ ] **Step 1: 创建 LoginPage.tsx**

```typescript
// src/app/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, Smartphone, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

type LoginMode = 'password' | 'code';

interface LoginForm {
  account: string;
  password: string;
}

interface CodeForm {
  phone: string;
  code: string;
}

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginByCode, sendCode } = useAuth();
  const [mode, setMode] = useState<LoginMode>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const passwordForm = useForm<LoginForm>({ defaultValues: { account: '', password: '' } });
  const codeForm = useForm<CodeForm>({ defaultValues: { phone: '', code: '' } });

  const handleSendCode = async () => {
    const phone = codeForm.getValues('phone');
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号');
      return;
    }
    try {
      const seconds = await sendCode(phone);
      setCodeCountdown(seconds);
      toast.success('验证码已发送');
    } catch (e: any) {
      toast.error(e.message || '发送失败');
    }
  };

  // 验证码倒计时
  React.useEffect(() => {
    if (codeCountdown > 0) {
      const timer = setTimeout(() => setCodeCountdown(codeCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [codeCountdown]);

  const handlePasswordLogin = async (data: LoginForm) => {
    if (!data.account || !data.password) {
      toast.error('请填写账号和密码');
      return;
    }
    setIsLoading(true);
    try {
      await login(data.account, data.password);
      toast.success('登录成功');
      navigate('/');
    } catch (e: any) {
      toast.error(e.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeLogin = async (data: CodeForm) => {
    if (!data.phone || !data.code) {
      toast.error('请填写手机号和验证码');
      return;
    }
    setIsLoading(true);
    try {
      await loginByCode(data.phone, data.code);
      toast.success('登录成功');
      navigate('/');
    } catch (e: any) {
      toast.error(e.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 weave-bg"
        style={{ background: 'linear-gradient(135deg, #1A3D4A 0%, #0D2535 100%)' }}>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">鋆寰｜非遗智作</h1>
          <p className="text-lg" style={{ color: 'rgba(245,240,232,0.7)' }}>
            传承千年工艺，智造当代精品
          </p>
        </div>

        <div className="space-y-6">
          <div className="gold-divider" style={{ opacity: 0.3 }} />
          <div>
            <h2 className="text-xl text-white mb-4" style={{ fontWeight: 600 }}>
              智能设计助手
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>
              融合传统纹样与现代审美，让非遗文化焕发新生
            </p>
          </div>
        </div>

        <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>
          © 2024 鋆寰非遗智作平台
        </p>
      </div>

      {/* 右侧登录区 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* 移动端 logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold" style={{ color: '#1A3D4A' }}>鋆寰｜非遗智作</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl mb-2" style={{ color: '#1A3D4A', fontWeight: 600 }}>
              欢迎回来
            </h2>
            <p className="text-sm" style={{ color: '#6B6558' }}>
              登录您的账户继续探索
            </p>
          </div>

          {/* 登录模式切换 */}
          <div className="flex rounded-xl p-1 mb-6" style={{ background: '#F0EBE2' }}>
            <button
              onClick={() => setMode('password')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'password' ? 'bg-white shadow-sm' : ''
              }`}
              style={{ color: mode === 'password' ? '#1A3D4A' : '#6B6558' }}
            >
              <Lock className="w-4 h-4 inline mr-2" />
              密码登录
            </button>
            <button
              onClick={() => setMode('code')}
              className={`flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all ${
                mode === 'code' ? 'bg-white shadow-sm' : ''
              }`}
              style={{ color: mode === 'code' ? '#1A3D4A' : '#6B6558' }}
            >
              <Smartphone className="w-4 h-4 inline mr-2" />
              验证码登录
            </button>
          </div>

          {/* 密码登录表单 */}
          {mode === 'password' && (
            <form onSubmit={passwordForm.handleSubmit(handlePasswordLogin)} className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                  账号 / 手机号
                </label>
                <Input
                  placeholder="请输入账号或手机号"
                  {...passwordForm.register('account')}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                  密码
                </label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入密码"
                    {...passwordForm.register('password')}
                    className="h-12 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6558]"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link to="/forgot-password" className="text-sm hover:underline" style={{ color: '#C4912A' }}>
                  忘记密码？
                </Link>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-medium"
                style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}
              >
                {isLoading ? '登录中...' : '登录'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {/* 验证码登录表单 */}
          {mode === 'code' && (
            <form onSubmit={codeForm.handleSubmit(handleCodeLogin)} className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                  手机号
                </label>
                <Input
                  type="tel"
                  placeholder="请输入手机号"
                  maxLength={11}
                  {...codeForm.register('phone')}
                  className="h-12"
                />
              </div>

              <div>
                <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                  验证码
                </label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    placeholder="请输入验证码"
                    maxLength={6}
                    {...codeForm.register('code')}
                    className="h-12 flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleSendCode}
                    disabled={codeCountdown > 0}
                    className="h-12 px-4"
                    style={{ borderColor: '#C4912A', color: '#C4912A' }}
                  >
                    {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
                  </Button>
                </div>
              </div>

              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-12 text-base font-medium"
                style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}
              >
                {isLoading ? '登录中...' : '登录'}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {/* 注册链接 */}
          <p className="text-center mt-6 text-sm" style={{ color: '#6B6558' }}>
            还没有账户？
            <Link to="/register" className="ml-1 font-medium hover:underline" style={{ color: '#C4912A' }}>
              立即注册
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交代码**

```bash
git add src/app/pages/LoginPage.tsx
git commit -m "feat: add login page with password and code login"
```

---

### Task 4: 创建注册页面

**Files:**
- Create: `src/app/pages/RegisterPage.tsx`

- [ ] **Step 1: 创建 RegisterPage.tsx**

```typescript
// src/app/pages/RegisterPage.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';

interface RegisterForm {
  phone: string;
  code: string;
  password: string;
  confirmPassword: string;
  agreeTerms: boolean;
}

export function RegisterPage() {
  const navigate = useNavigate();
  const { register, sendCode } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<RegisterForm>({
    defaultValues: {
      phone: '',
      code: '',
      password: '',
      confirmPassword: '',
      agreeTerms: false,
    },
  });

  const handleSendCode = async () => {
    const phone = form.getValues('phone');
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号');
      return;
    }
    try {
      const seconds = await sendCode(phone);
      setCodeCountdown(seconds);
      toast.success('验证码已发送');
    } catch (e: any) {
      toast.error(e.message || '发送失败');
    }
  };

  // 验证码倒计时
  React.useEffect(() => {
    if (codeCountdown > 0) {
      const timer = setTimeout(() => setCodeCountdown(codeCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [codeCountdown]);

  const handleSubmit = async (data: RegisterForm) => {
    if (data.password !== data.confirmPassword) {
      toast.error('两次密码输入不一致');
      return;
    }
    if (data.password.length < 6) {
      toast.error('密码长度不能少于6位');
      return;
    }
    if (!data.agreeTerms) {
      toast.error('请阅读并同意用户协议');
      return;
    }

    setIsLoading(true);
    try {
      await register(data.phone, data.code, data.password);
      toast.success('注册成功');
      navigate('/');
    } catch (e: any) {
      toast.error(e.message || '注册失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* 左侧品牌区 */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 weave-bg"
        style={{ background: 'linear-gradient(135deg, #1A3D4A 0%, #0D2535 100%)' }}>
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">鋆寰｜非遗智作</h1>
          <p className="text-lg" style={{ color: 'rgba(245,240,232,0.7)' }}>
            传承千年工艺，智造当代精品
          </p>
        </div>

        <div className="space-y-6">
          <div className="gold-divider" style={{ opacity: 0.3 }} />
          <div>
            <h2 className="text-xl text-white mb-4" style={{ fontWeight: 600 }}>
              加入我们
            </h2>
            <p className="text-sm leading-relaxed" style={{ color: 'rgba(245,240,232,0.6)' }}>
              注册账户，解锁非遗纹样设计之旅<br/>
              记录创作历程，保护您的知识产权
            </p>
          </div>
        </div>

        <p className="text-xs" style={{ color: 'rgba(245,240,232,0.4)' }}>
          © 2024 鋆寰非遗智作平台
        </p>
      </div>

      {/* 右侧注册区 */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <div className="w-full max-w-md">
          {/* 返回链接 */}
          <Link to="/login" className="inline-flex items-center text-sm mb-6 hover:underline" style={{ color: '#6B6558' }}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            返回登录
          </Link>

          {/* 移动端 logo */}
          <div className="lg:hidden text-center mb-8">
            <h1 className="text-2xl font-bold" style={{ color: '#1A3D4A' }}>鋆寰｜非遗智作</h1>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-2xl mb-2" style={{ color: '#1A3D4A', fontWeight: 600 }}>
              创建账户
            </h2>
            <p className="text-sm" style={{ color: '#6B6558' }}>
              填写以下信息完成注册
            </p>
          </div>

          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                手机号
              </label>
              <Input
                type="tel"
                placeholder="请输入手机号"
                maxLength={11}
                {...form.register('phone')}
                className="h-12"
              />
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                验证码
              </label>
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="请输入验证码"
                  maxLength={6}
                  {...form.register('code')}
                  className="h-12 flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSendCode}
                  disabled={codeCountdown > 0}
                  className="h-12 px-4"
                  style={{ borderColor: '#C4912A', color: '#C4912A' }}
                >
                  {codeCountdown > 0 ? `${codeCountdown}s` : '获取验证码'}
                </Button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                设置密码
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请设置登录密码（6-20位）"
                  {...form.register('password')}
                  className="h-12 pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6558]"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                确认密码
              </label>
              <Input
                type="password"
                placeholder="请再次输入密码"
                {...form.register('confirmPassword')}
                className="h-12"
              />
            </div>

            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="agreeTerms"
                checked={form.watch('agreeTerms')}
                onCheckedChange={(checked) => form.setValue('agreeTerms', !!checked)}
                className="mt-0.5"
              />
              <label htmlFor="agreeTerms" className="text-sm leading-relaxed cursor-pointer" style={{ color: '#6B6558' }}>
                我已阅读并同意
                <a href="/terms" className="mx-1" style={{ color: '#C4912A' }}>《用户服务协议》</a>
                和
                <a href="/privacy" className="ml-1" style={{ color: '#C4912A' }}>《隐私政策》</a>
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-12 text-base font-medium"
              style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}
            >
              {isLoading ? '注册中...' : '注册'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </form>

          <p className="text-center mt-6 text-sm" style={{ color: '#6B6558' }}>
            已有账户？
            <Link to="/login" className="ml-1 font-medium hover:underline" style={{ color: '#C4912A' }}>
              立即登录
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 提交代码**

```bash
git add src/app/pages/RegisterPage.tsx
git commit -m "feat: add registration page"
```

---

### Task 5: 更新路由配置

**Files:**
- Modify: `src/app/routes.tsx`

- [ ] **Step 1: 更新 routes.tsx，添加登录/注册路由**

将 `createMemoryRouter` 改为 `createBrowserRouter`，并添加登录和注册路由：

```typescript
// src/app/routes.tsx

import React from 'react';
import { createBrowserRouter, createMemoryRouter, Outlet, useRouteError } from 'react-router';
import { AppLayout } from './components/layout/AppLayout';
import { ZhiHuiPage } from './pages/ZhiHuiPage';
import { InspirationLibraryPage } from './pages/InspirationLibraryPage';
import { DesignCopilotPage } from './pages/DesignCopilotPage';
import { AdminPage } from './pages/AdminPage';
import { PatternMarketPage } from './pages/PatternMarketPage';
import { PermissionGuard } from './components/PermissionGuard';
import { AppProvider } from './context/AppContext';
import { AuthProvider } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import type { ModuleKey } from './context/AppContext';

// ── 登录/注册布局（无侧边栏）───────────────────────────────────────────────────
function AuthLayout() {
  return <Outlet />;
}

// ── Root layout（AppLayout 包含侧边栏）──────────────────────────────────────
function Root() {
  return (
    <AppProvider>
      <AppLayout />
    </AppProvider>
  );
}

// ── Inline error boundary ─────────────────────────────────────────────────────
function RouteErrorBoundary() {
  const error = useRouteError() as Error | null;
  return (
    <div className="flex items-center justify-center h-full p-8"
      style={{ background: '#F5F0E8' }}>
      <div className="max-w-md w-full text-center p-8 rounded-3xl bg-white shadow-lg"
        style={{ border: '1px solid rgba(26,61,74,0.1)' }}>
        <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
          style={{ background: 'rgba(139,32,32,0.07)' }}>
          <span className="text-2xl">⚠️</span>
        </div>
        <h2 className="text-[#1A3D4A] mb-2" style={{ fontSize: 18, fontWeight: 600 }}>
          页面渲染出现问题
        </h2>
        <p className="text-sm text-[#6B6558] mb-1 leading-relaxed">
          {error?.message ?? '未知错误'}
        </p>
        <p className="text-xs text-[#9B9590] mb-6">请尝试刷新页面或返回首页</p>
        <button
          onClick={() => window.location.reload()}
          className="px-6 py-2.5 rounded-xl text-sm text-white"
          style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
          刷新页面
        </button>
      </div>
    </div>
  );
}

// ── Route-level RBAC guard ────────────────────────────────────────────────────
function Guard({ mod, Page }: { mod: ModuleKey; Page: React.ComponentType }) {
  return (
    <PermissionGuard module={mod}>
      <Page />
    </PermissionGuard>
  );
}

export const router = createBrowserRouter(
  [
    // 认证路由（无侧边栏）
    {
      path: '/',
      element: (
        <AuthProvider>
          <AuthLayout />
        </AuthProvider>
      ),
      children: [
        { path: 'login', element: <LoginPage /> },
        { path: 'register', element: <RegisterPage /> },
        { index: true, element: <LoginPage /> },
      ],
    },
    // 应用路由（有侧边栏）
    {
      path: '/app',
      Component: Root,
      ErrorBoundary: RouteErrorBoundary,
      children: [
        { index: true, element: <Guard mod="zhihui" Page={ZhiHuiPage} /> },
        { path: 'zhihui', element: <Guard mod="zhihui" Page={ZhiHuiPage} /> },
        { path: 'copilot', element: <Guard mod="copilot" Page={DesignCopilotPage} /> },
        { path: 'materials', element: <Guard mod="materials" Page={InspirationLibraryPage} /> },
        { path: 'market', element: <Guard mod="market" Page={PatternMarketPage} /> },
        { path: 'admin', element: <Guard mod="admin" Page={AdminPage} /> },
      ],
    },
  ],
  { basename: '/' }
);
```

同时需要更新 `src/main.tsx`，将首页改为 `/app`：

```typescript
// src/main.tsx
// 确保 initialEntries 指向 /app/zhihui
```

- [ ] **Step 2: 提交代码**

```bash
git add src/app/routes.tsx src/main.tsx
git commit -m "feat: add login/register routes with auth layout"
```

---

### Task 6: 集成测试验证

**Files:**
- Test: 登录页、注册页功能

- [ ] **Step 1: 启动开发服务器验证**

```bash
pnpm dev
```

- [ ] **Step 2: 测试清单**

1. 访问 `/login` - 显示登录页
2. 访问 `/register` - 显示注册页
3. 密码登录 - 输入账号密码，点击登录
4. 验证码登录 - 输入手机号，点击获取验证码，输入验证码，登录
5. 注册 - 填写手机号、验证码、密码，确认密码，同意协议，注册
6. 登录成功后跳转到首页

---

## 验证清单

- [ ] `/login` 页面正确渲染
- [ ] `/register` 页面正确渲染
- [ ] 密码登录功能正常
- [ ] 验证码发送和登录功能正常
- [ ] 注册功能正常
- [ ] Token 正确存储到 localStorage
- [ ] 登录成功后跳转到首页
- [ ] 未登录用户访问受保护页面时重定向到登录页
