// src/app/pages/LoginPage.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, Smartphone, Lock, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';

type LoginMode = 'password' | 'code';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, loginByCode, sendCode } = useAuth();
  const [mode, setMode] = useState<LoginMode>('password');
  const [showPassword, setShowPassword] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 密码登录表单状态
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');

  // 验证码登录表单状态
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');

  const handleSendCode = async () => {
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

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account || !password) {
      toast.error('请填写账号和密码');
      return;
    }
    setIsLoading(true);
    try {
      await login(account, password);
      toast.success('登录成功');
      navigate('/zhihui');
    } catch (err: any) {
      toast.error(err.message || '登录失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCodeLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !code) {
      toast.error('请填写手机号和验证码');
      return;
    }
    setIsLoading(true);
    try {
      await loginByCode(phone, code);
      toast.success('登录成功');
      navigate('/zhihui');
    } catch (err: any) {
      toast.error(err.message || '登录失败');
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
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                  账号 / 手机号
                </label>
                <Input
                  placeholder="请输入账号或手机号"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
            <form onSubmit={handleCodeLogin} className="space-y-4">
              <div>
                <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                  手机号
                </label>
                <Input
                  type="tel"
                  placeholder="请输入手机号"
                  maxLength={11}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
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
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
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
