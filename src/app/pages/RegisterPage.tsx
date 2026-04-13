// src/app/pages/RegisterPage.tsx

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router';
import { Eye, EyeOff, ArrowLeft, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../context/AuthContext';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Checkbox } from '../components/ui/checkbox';

export function RegisterPage() {
  const navigate = useNavigate();
  const { register: doRegister, sendCode } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [codeCountdown, setCodeCountdown] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // 表单状态
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(false);

  const handleSendCode = async () => {
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      toast.error('请输入正确的手机号');
      return;
    }
    try {
      const seconds = await sendCode(phone);
      setCodeCountdown(seconds);
      toast.success('验证码已发送');
    } catch (err: any) {
      toast.error(err.message || '发送失败');
    }
  };

  // 验证码倒计时
  React.useEffect(() => {
    if (codeCountdown > 0) {
      const timer = setTimeout(() => setCodeCountdown(codeCountdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [codeCountdown]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('两次密码输入不一致');
      return;
    }
    if (password.length < 6) {
      toast.error('密码长度不能少于6位');
      return;
    }
    if (!agreeTerms) {
      toast.error('请阅读并同意用户协议');
      return;
    }

    setIsLoading(true);
    try {
      await doRegister(phone, code, password);
      toast.success('注册成功');
      navigate('/zhihui');
    } catch (err: any) {
      toast.error(err.message || '注册失败');
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

          <form onSubmit={handleSubmit} className="space-y-4">
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

            <div>
              <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                设置密码
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="请设置登录密码（6-20位）"
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

            <div>
              <label className="block text-sm mb-2" style={{ color: '#1A3D4A' }}>
                确认密码
              </label>
              <Input
                type="password"
                placeholder="请再次输入密码"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="h-12"
              />
            </div>

            <div className="flex items-start gap-2 pt-2">
              <Checkbox
                id="agreeTerms"
                checked={agreeTerms}
                onCheckedChange={(checked) => setAgreeTerms(!!checked)}
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
