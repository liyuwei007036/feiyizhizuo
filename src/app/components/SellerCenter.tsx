import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import type { SellerProfile, SellerAgreement, PaymentAccount, Settlement } from '../context/AppContext';
import {
  X, ChevronRight, CheckCircle2, AlertCircle, Shield, FileText,
  CreditCard, BarChart3, User, Building2, IdCard, Phone, MapPin,
  FileCheck, Lock, Coins, TrendingUp, Clock, Download, Eye,
  Check, AlertTriangle, Info, Sparkles, Receipt, Calendar, ArrowRight,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type SellerCenterTab = 'auth' | 'agreement' | 'payment' | 'settlement';

interface SellerCenterProps {
  open: boolean;
  onClose: () => void;
}

// ── Constants ─────────────────────────────────────────────────────────────────

const TABS: { key: SellerCenterTab; label: string; icon: React.ReactNode; desc: string }[] = [
  { key: 'auth', label: '身份认证', icon: <Shield className="w-4 h-4" />, desc: '完成卖家身份认证' },
  { key: 'agreement', label: '协议签署', icon: <FileText className="w-4 h-4" />, desc: '签署平台合作协议' },
  { key: 'payment', label: '收款账户', icon: <CreditCard className="w-4 h-4" />, desc: '绑定收款账户' },
  { key: 'settlement', label: '结算中心', icon: <BarChart3 className="w-4 h-4" />, desc: '查看收益与结算' },
];

const DEFAULT_COMMISSION_RATE = 10; // 平台佣金10%

// ── Subcomponents ─────────────────────────────────────────────────────────────

/** 状态指示器 */
function StatusBadge({ status, labels }: { status: string; labels: Record<string, { label: string; color: string; bg: string }> }) {
  const cfg = labels[status] || { label: '未知', color: '#9B9590', bg: 'rgba(155,149,144,0.12)' };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs"
      style={{ color: cfg.color, background: cfg.bg }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: cfg.color }}></span>
      {cfg.label}
    </span>
  );
}

/** 步骤指示器 */
function StepIndicator({ steps, current }: { steps: string[]; current: number }) {
  return (
    <div className="flex items-center justify-between mb-6">
      {steps.map((label, i) => (
        <React.Fragment key={i}>
          <div className="flex flex-col items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${
              i < current ? 'bg-emerald-500 text-white' :
              i === current ? 'bg-[#1A3D4A] text-white' :
              'bg-gray-200 text-gray-400'
            }`}>
              {i < current ? <Check className="w-4 h-4" /> : i + 1}
            </div>
            <span className={`text-xs ${i <= current ? 'text-[#1A3D4A]' : 'text-[#9B9590]'}`}>{label}</span>
          </div>
          {i < steps.length - 1 && (
            <div className={`flex-1 h-0.5 mx-2 ${i < current ? 'bg-emerald-500' : 'bg-gray-200'}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ── 1. 身份认证 ───────────────────────────────────────────────────────────────

function AuthTab() {
  const { sellerProfile, updateSellerProfile } = useApp();
  const [sellerType, setSellerType] = useState<'individual' | 'business' | 'enterprise'>('individual');
  const [realName, setRealName] = useState('');
  const [idNumber, setIdNumber] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactAddress, setContactAddress] = useState('');
  const [step, setStep] = useState(0);

  const handleSubmit = () => {
    if (!realName || !idNumber || !contactPhone || !contactAddress) {
      toast.error('请填写完整信息');
      return;
    }
    const profile: SellerProfile = {
      userId: 'me',
      status: 'verified',
      sellerType,
      realName,
      idNumber,
      contactPhone,
      contactAddress,
      appliedAt: new Date().toLocaleString('zh-CN'),
      verifiedAt: new Date().toLocaleString('zh-CN'),
    };
    updateSellerProfile(profile);
    toast.success('身份认证成功');
    setStep(3);
  };

  if (sellerProfile?.status === 'verified') {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm text-emerald-900" style={{ fontWeight: 600 }}>认证已完成</p>
            <p className="text-xs text-emerald-700 mt-0.5">您已成功完成卖家身份认证</p>
          </div>
        </div>
        {[
          { label: '卖家类型', value: sellerProfile.sellerType === 'individual' ? '个人' : sellerProfile.sellerType === 'business' ? '个体工商户' : '企业' },
          { label: '真实姓名/企业名称', value: sellerProfile.realName },
          { label: '证件号码', value: sellerProfile.idNumber },
          { label: '联系方式', value: sellerProfile.contactPhone },
          { label: '常驻地址', value: sellerProfile.contactAddress },
          { label: '认证时间', value: sellerProfile.verifiedAt },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-xs text-[#9B9590]">{row.label}</span>
            <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <StepIndicator steps={['选择类型', '填写信息', '提交审核', '完成认证']} current={step} />

      {step === 0 && (
        <div className="space-y-3">
          <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>选择卖家类型</p>
          {[
            { value: 'individual', label: '个人', desc: '个人设计师或创作者', icon: <User className="w-5 h-5" /> },
            { value: 'business', label: '个体工商户', desc: '持有个体工商户营业执照', icon: <IdCard className="w-5 h-5" /> },
            { value: 'enterprise', label: '企业', desc: '持有企业营业执照', icon: <Building2 className="w-5 h-5" /> },
          ].map(type => (
            <button key={type.value}
              onClick={() => setSellerType(type.value as any)}
              className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
                sellerType === type.value
                  ? 'border-[#1A3D4A] bg-[rgba(26,61,74,0.04)]'
                  : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                sellerType === type.value ? 'bg-[#1A3D4A] text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {type.icon}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>{type.label}</p>
                <p className="text-xs text-[#9B9590] mt-0.5">{type.desc}</p>
              </div>
              {sellerType === type.value && <CheckCircle2 className="w-5 h-5 text-[#1A3D4A]" />}
            </button>
          ))}
          <button onClick={() => setStep(1)}
            className="w-full py-2.5 rounded-xl bg-[#1A3D4A] text-white text-sm mt-4"
            style={{ fontWeight: 600 }}>
            下一步
          </button>
        </div>
      )}

      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label className="text-xs text-[#9B9590] mb-1.5 block">真实姓名/企业名称 *</label>
            <input type="text" value={realName} onChange={e => setRealName(e.target.value)}
              placeholder="请输入真实姓名或企业名称"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D4A]" />
          </div>
          <div>
            <label className="text-xs text-[#9B9590] mb-1.5 block">证件号码/统一社会信用代码 *</label>
            <input type="text" value={idNumber} onChange={e => setIdNumber(e.target.value)}
              placeholder="请输入证件号码"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D4A]" />
          </div>
          <div>
            <label className="text-xs text-[#9B9590] mb-1.5 block">联系方式 *</label>
            <input type="tel" value={contactPhone} onChange={e => setContactPhone(e.target.value)}
              placeholder="请输入联系电话"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D4A]" />
          </div>
          <div>
            <label className="text-xs text-[#9B9590] mb-1.5 block">常驻地址 *</label>
            <input type="text" value={contactAddress} onChange={e => setContactAddress(e.target.value)}
              placeholder="请输入常驻地址"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D4A]" />
          </div>
          <div className="flex gap-2">
            <button onClick={() => setStep(0)}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-[#1A3D4A] text-sm"
              style={{ fontWeight: 600 }}>
              上一步
            </button>
            <button onClick={() => setStep(2)}
              className="flex-1 py-2.5 rounded-xl bg-[#1A3D4A] text-white text-sm"
              style={{ fontWeight: 600 }}>
              下一步
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
            <Info className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1 text-xs text-amber-900">
              <p style={{ fontWeight: 600 }}>重要提示</p>
              <p className="mt-1 leading-relaxed">
                您提交的身份信息将用于平台合规核验和交易分账,请确保信息真实有效。
                根据相关法规,平台需核验平台内经营者真实身份信息。
              </p>
            </div>
          </div>
          {[
            { label: '卖家类型', value: sellerType === 'individual' ? '个人' : sellerType === 'business' ? '个体工商户' : '企业' },
            { label: '真实姓名/企业名称', value: realName },
            { label: '证件号码', value: idNumber },
            { label: '联系方式', value: contactPhone },
            { label: '常驻地址', value: contactAddress },
          ].map(row => (
            <div key={row.label} className="flex items-center justify-between py-2 border-b border-gray-100">
              <span className="text-xs text-[#9B9590]">{row.label}</span>
              <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 500 }}>{row.value}</span>
            </div>
          ))}
          <div className="flex gap-2 mt-6">
            <button onClick={() => setStep(1)}
              className="flex-1 py-2.5 rounded-xl border border-gray-300 text-[#1A3D4A] text-sm"
              style={{ fontWeight: 600 }}>
              上一步
            </button>
            <button onClick={handleSubmit}
              className="flex-1 py-2.5 rounded-xl bg-[#1A3D4A] text-white text-sm"
              style={{ fontWeight: 600 }}>
              提交认证
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── 2. 协议签署 ───────────────────────────────────────────────────────────────

function AgreementTab() {
  const { sellerProfile, sellerAgreement, updateSellerAgreement } = useApp();
  const [agreed, setAgreed] = useState(false);

  if (!sellerProfile || sellerProfile.status !== 'verified') {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
          <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>请先完成身份认证</p>
          <p className="text-xs text-[#9B9590] mt-1">完成卖家身份认证后才能签署平台协议</p>
        </div>
      </div>
    );
  }

  const handleSign = () => {
    if (!agreed) {
      toast.error('请阅读并同意平台协议');
      return;
    }
    const agreement: SellerAgreement = {
      userId: 'me',
      serviceAgreement: 'signed',
      transactionRules: 'signed',
      feeRules: 'signed',
      taxRules: 'signed',
      violationRules: 'signed',
      signedAt: new Date().toLocaleString('zh-CN'),
      commissionRate: DEFAULT_COMMISSION_RATE,
    };
    updateSellerAgreement(agreement);
    toast.success('协议签署成功');
  };

  if (sellerAgreement?.serviceAgreement === 'signed') {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm text-emerald-900" style={{ fontWeight: 600 }}>协议已签署</p>
            <p className="text-xs text-emerald-700 mt-0.5">您已完成所有平台协议签署</p>
          </div>
        </div>
        {[
          { label: '平台服务协议', status: '已签署' },
          { label: '纹样授权交易规则', status: '已签署' },
          { label: '平台收费与分账规则', status: '已签署' },
          { label: '税务与发票说明', status: '已签署' },
          { label: '侵权与违约处理规则', status: '已签署' },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-xs text-[#9B9590]">{row.label}</span>
            <span className="text-xs text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {row.status}
            </span>
          </div>
        ))}
        <div className="p-4 rounded-xl" style={{ background: 'rgba(196,145,42,0.06)' }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-[#9B9590]">平台佣金比例</span>
            <span className="text-lg text-[#C4912A]" style={{ fontWeight: 700 }}>{sellerAgreement.commissionRate}%</span>
          </div>
          <p className="text-xs text-[#6B6558] leading-relaxed">
            平台将按成交金额抽取 {sellerAgreement.commissionRate}% 作为服务费,用于平台运营、技术支持和交易保障。
          </p>
        </div>
        <div className="text-xs text-[#9B9590]">
          签署时间:{sellerAgreement.signedAt}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        {[
          { title: '平台服务协议', desc: '明确平台与卖家的权利义务关系' },
          { title: '纹样授权交易规则', desc: '规定授权类型、使用范围、期限等规则' },
          { title: '平台收费与分账规则', desc: '明确佣金比例、结算周期、分账流程' },
          { title: '税务与发票说明', desc: '说明税费承担方式和发票开具规则' },
          { title: '侵权与违约处理规则', desc: '规定侵权投诉、争议处理、违约责任' },
        ].map((item, i) => (
          <div key={i} className="p-4 rounded-xl border border-gray-200 flex items-start gap-3">
            <FileCheck className="w-5 h-5 text-[#1A3D4A] flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>{item.title}</p>
              <p className="text-xs text-[#9B9590] mt-1">{item.desc}</p>
            </div>
            <button className="text-xs text-[#1A3D4A] flex items-center gap-1 hover:underline">
              查看
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* First revenue share confirmation */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid rgba(196,145,42,0.35)' }}>
        <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, rgba(196,145,42,0.15), rgba(196,145,42,0.06))', borderBottom: '1px solid rgba(196,145,42,0.15)' }}>
          <Coins className="w-4 h-4 text-[#C4912A]" />
          <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 700 }}>平台收费与分账规则</span>
          <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: '#C4912A', fontWeight: 600 }}>第①次分账确认</span>
        </div>
        <div className="p-4 space-y-3" style={{ background: 'rgba(254,252,245,0.9)' }}>
          {/* Visual split */}
          <div className="flex rounded-xl overflow-hidden" style={{ height: 32, border: '1px solid rgba(196,145,42,0.2)' }}>
            <div className="flex items-center justify-center text-white text-xs" style={{ width: '90%', background: 'linear-gradient(135deg, #1A3D4A, #2A5568)', fontWeight: 700 }}>
              卖家净收入 90%
            </div>
            <div className="flex items-center justify-center text-white text-[10px]" style={{ width: '10%', background: '#C4912A', fontWeight: 700, writingMode: 'vertical-rl' }}>
              平台10%
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-[#6B6558]">平台佣金比例（固定）</span>
            <span className="text-xl text-[#C4912A]" style={{ fontWeight: 700 }}>{DEFAULT_COMMISSION_RATE}%</span>
          </div>
          <div className="space-y-1 text-[11px]">
            <div className="flex justify-between"><span className="text-[#9B9590]">买家实付 ¥1000（示例）</span><span className="text-[#1A3D4A]" style={{ fontWeight: 600 }}>¥1,000</span></div>
            <div className="flex justify-between"><span className="text-[#9B9590]">平台服务费（10%）</span><span className="text-[#C4912A]">−¥100</span></div>
            <div className="flex justify-between pt-1" style={{ borderTop: '1px dashed rgba(26,61,74,0.1)' }}><span className="text-[#9B9590]">卖家净收入</span><span className="text-emerald-600" style={{ fontWeight: 700 }}>¥900</span></div>
          </div>
          <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.06)' }}>
            <Clock className="w-3 h-3 text-[#1A3D4A] mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-[#1A3D4A]" style={{ fontWeight: 600 }}>T+7 结算周期</p>
              <p className="text-[10px] text-[#6B6558] leading-relaxed">买家付款后第7个工作日，净收入自动结算至绑定收款账户。</p>
            </div>
          </div>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-xs text-amber-900 leading-relaxed">
          <p style={{ fontWeight: 600 }}>重要提示</p>
          <p className="mt-1">
            签署协议即表示您同意平台按约定比例收取服务费,并遵守平台交易规则。
            如不同意,您将无法成为交易型卖家。
          </p>
        </div>
      </div>

      <label className="flex items-start gap-2 p-3 rounded-lg border border-gray-200 cursor-pointer hover:bg-gray-50">
        <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)}
          className="mt-1 w-4 h-4" />
        <span className="text-xs text-[#1A3D4A] flex-1">
          我已完整阅读并同意《平台服务协议》《纹样授权交易规则》《平台收费与分账规则》《税务与发票说明》《侵权与违约处理规则》
        </span>
      </label>

      <button onClick={handleSign}
        disabled={!agreed}
        className={`w-full py-3 rounded-xl text-sm ${
          agreed
            ? 'bg-[#1A3D4A] text-white'
            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
        }`}
        style={{ fontWeight: 600 }}>
        签署协议
      </button>
    </div>
  );
}

// ── 3. 收款账户 ───────────────────────────────────────────────────────────────

function PaymentTab() {
  const { sellerProfile, sellerAgreement, paymentAccount, updatePaymentAccount } = useApp();
  const [accountType, setAccountType] = useState<'bank' | 'alipay'>('alipay');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [confirming, setConfirming] = useState(false);

  if (!sellerProfile || sellerProfile.status !== 'verified') {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
          <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>请先完成身份认证</p>
          <p className="text-xs text-[#9B9590] mt-1">完成卖家身份认证后才能绑定收款账户</p>
        </div>
      </div>
    );
  }

  if (!sellerAgreement || sellerAgreement.serviceAgreement !== 'signed') {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
          <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>请先签署平台协议</p>
          <p className="text-xs text-[#9B9590] mt-1">完成平台协议签署后才能绑定收款账户</p>
        </div>
      </div>
    );
  }

  const handleBind = () => {
    if (!accountName || !accountNumber || (accountType === 'bank' && !bankName)) {
      toast.error('请填写完整信息');
      return;
    }
    if (!confirming) {
      setConfirming(true);
      return;
    }
    const account: PaymentAccount = {
      userId: 'me',
      status: 'verified',
      accountType,
      accountName,
      accountNumber,
      bankName: accountType === 'bank' ? bankName : undefined,
      boundAt: new Date().toLocaleString('zh-CN'),
      verifiedAt: new Date().toLocaleString('zh-CN'),
    };
    updatePaymentAccount(account);
    toast.success('收款账户绑定成功');
    setConfirming(false);
  };

  if (paymentAccount?.status === 'verified') {
    return (
      <div className="p-6 space-y-4">
        <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <div className="flex-1">
            <p className="text-sm text-emerald-900" style={{ fontWeight: 600 }}>账户已绑定</p>
            <p className="text-xs text-emerald-700 mt-0.5">您已成功绑定收款账户</p>
          </div>
        </div>
        {[
          { label: '账户类型', value: paymentAccount.accountType === 'bank' ? '对公银行账户' : '支付宝账户' },
          { label: '账户名称', value: paymentAccount.accountName },
          { label: '账户号码', value: paymentAccount.accountNumber },
          ...(paymentAccount.bankName ? [{ label: '开户银行', value: paymentAccount.bankName }] : []),
          { label: '绑定时间', value: paymentAccount.boundAt },
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-xs text-[#9B9590]">{row.label}</span>
            <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
        <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3 mt-4">
          <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-blue-900 leading-relaxed">
            <p style={{ fontWeight: 600 }}>结算说明</p>
            <p className="mt-1">
              买家支付成功后,订单进入T+7结算周期。7天无退款或争议后,平台将自动分账至您的收款账户。
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (confirming) {
    return (
      <div className="p-6 space-y-6">
        {/* Second revenue share confirmation */}
        <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid rgba(196,145,42,0.35)' }}>
          <div className="px-4 py-2.5 flex items-center gap-2" style={{ background: 'linear-gradient(135deg, rgba(196,145,42,0.15), rgba(196,145,42,0.06))', borderBottom: '1px solid rgba(196,145,42,0.15)' }}>
            <Coins className="w-4 h-4 text-[#C4912A]" />
            <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 700 }}>绑定收款账户 · 分账规则再确认</span>
            <span className="ml-auto text-[10px] px-2 py-0.5 rounded-full text-white" style={{ background: '#C4912A', fontWeight: 600 }}>第②次分账确认</span>
          </div>
          <div className="p-4 space-y-2" style={{ background: 'rgba(254,252,245,0.9)' }}>
            <p className="text-[11px] text-[#6B6558] leading-relaxed">
              绑定此账户后，每笔交易成功后平台将按以下比例自动分账：
            </p>
            <div className="flex rounded-xl overflow-hidden" style={{ height: 28, border: '1px solid rgba(196,145,42,0.2)' }}>
              <div className="flex items-center justify-center text-white text-xs" style={{ width: '90%', background: 'linear-gradient(135deg, #1A3D4A, #2A5568)', fontWeight: 700 }}>分账至此账户 90%</div>
              <div className="flex items-center justify-center text-white text-[10px]" style={{ width: '10%', background: '#C4912A', fontWeight: 700, writingMode: 'vertical-rl' }}>平台10%</div>
            </div>
            <p className="text-[10px] text-[#9B9590]">结算周期：T+7工作日 · 如有纠纷，平台有权暂停结算至争议解决</p>
          </div>
        </div>
        <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1 text-xs text-amber-900 leading-relaxed">
            <p style={{ fontWeight: 600 }}>账户信息核对</p>
            <p className="mt-1">
              请仔细核对账户信息。绑定后平台将通过持牌支付机构向此账户分账结算。账户信息有误可能导致结算失败。
            </p>
          </div>
        </div>
        {[
          { label: '账户类型', value: accountType === 'bank' ? '对公银行账户' : '支付宝账户' },
          { label: '账户名称', value: accountName },
          { label: '账户号码', value: accountNumber },
          ...(accountType === 'bank' ? [{ label: '开户银行', value: bankName }] : []),
        ].map(row => (
          <div key={row.label} className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-xs text-[#9B9590]">{row.label}</span>
            <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 500 }}>{row.value}</span>
          </div>
        ))}
        <div className="flex gap-2">
          <button onClick={() => setConfirming(false)}
            className="flex-1 py-2.5 rounded-xl border border-gray-300 text-[#1A3D4A] text-sm"
            style={{ fontWeight: 600 }}>
            返回修改
          </button>
          <button onClick={handleBind}
            className="flex-1 py-2.5 rounded-xl bg-[#1A3D4A] text-white text-sm"
            style={{ fontWeight: 600 }}>
            确认绑定
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-3">
        <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>选择账户类型</p>
        {[
          { value: 'alipay', label: '支付宝账户', desc: '推荐,到账快速便捷', icon: <Sparkles className="w-5 h-5" /> },
          { value: 'bank', label: '对公银行账户', desc: '企业用户推荐', icon: <Building2 className="w-5 h-5" /> },
        ].map(type => (
          <button key={type.value}
            onClick={() => setAccountType(type.value as any)}
            className={`w-full p-4 rounded-xl border-2 flex items-center gap-3 transition-all ${
              accountType === type.value
                ? 'border-[#1A3D4A] bg-[rgba(26,61,74,0.04)]'
                : 'border-gray-200 hover:border-gray-300'
            }`}>
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
              accountType === type.value ? 'bg-[#1A3D4A] text-white' : 'bg-gray-100 text-gray-500'
            }`}>
              {type.icon}
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>{type.label}</p>
              <p className="text-xs text-[#9B9590] mt-0.5">{type.desc}</p>
            </div>
            {accountType === type.value && <CheckCircle2 className="w-5 h-5 text-[#1A3D4A]" />}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        <div>
          <label className="text-xs text-[#9B9590] mb-1.5 block">账户名称 *</label>
          <input type="text" value={accountName} onChange={e => setAccountName(e.target.value)}
            placeholder={accountType === 'bank' ? '请输入对公账户名称' : '请输入支付宝实名姓名'}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D4A]" />
        </div>
        <div>
          <label className="text-xs text-[#9B9590] mb-1.5 block">账户号码 *</label>
          <input type="text" value={accountNumber} onChange={e => setAccountNumber(e.target.value)}
            placeholder={accountType === 'bank' ? '请输入银行账号' : '请输入支付宝账号'}
            className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D4A]" />
        </div>
        {accountType === 'bank' && (
          <div>
            <label className="text-xs text-[#9B9590] mb-1.5 block">开户银行 *</label>
            <input type="text" value={bankName} onChange={e => setBankName(e.target.value)}
              placeholder="请输入开户银行名称"
              className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:outline-none focus:border-[#1A3D4A]" />
          </div>
        )}
      </div>

      <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3">
        <Lock className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="flex-1 text-xs text-blue-900 leading-relaxed">
          <p style={{ fontWeight: 600 }}>安全保障</p>
          <p className="mt-1">
            您的收款账户信息将加密存储,仅用于交易分账结算,平台不会用于其他用途。
          </p>
        </div>
      </div>

      <button onClick={handleBind}
        className="w-full py-3 rounded-xl bg-[#1A3D4A] text-white text-sm"
        style={{ fontWeight: 600 }}>
        绑定收款账户
      </button>
    </div>
  );
}

// ── 4. 结算中心 ───────────────────────────────────────────────────────────────

function SettlementTab() {
  const { sellerProfile, settlements } = useApp();

  if (!sellerProfile || sellerProfile.status !== 'verified') {
    return (
      <div className="p-6">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertCircle className="w-12 h-12 text-amber-500 mb-3" />
          <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>请先完成身份认证</p>
        </div>
      </div>
    );
  }

  const totalIncome = settlements.filter(s => s.status === 'completed').reduce((sum, s) => sum + s.sellerIncome, 0);
  const pendingAmount = settlements.filter(s => s.status === 'pending').reduce((sum, s) => sum + s.sellerIncome, 0);

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-2 gap-3">
        <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(22,163,74,0.08), rgba(22,163,74,0.02))' }}>
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-emerald-700">累计收入</span>
          </div>
          <p className="text-2xl text-emerald-600" style={{ fontWeight: 700 }}>¥{totalIncome.toLocaleString()}</p>
        </div>
        <div className="p-4 rounded-xl" style={{ background: 'linear-gradient(135deg, rgba(196,145,42,0.08), rgba(196,145,42,0.02))' }}>
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-[#C4912A]" />
            <span className="text-xs text-[#C4912A]">待结算</span>
          </div>
          <p className="text-2xl text-[#C4912A]" style={{ fontWeight: 700 }}>¥{pendingAmount.toLocaleString()}</p>
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>结算记录</span>
          <button className="text-xs text-[#1A3D4A] flex items-center gap-1 hover:underline">
            导出对账单
            <Download className="w-3.5 h-3.5" />
          </button>
        </div>

        {settlements.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Receipt className="w-12 h-12 text-gray-300 mb-3" />
            <p className="text-sm text-[#9B9590]">暂无结算记录</p>
            <p className="text-xs text-[#9B9590] mt-1">完成交易后结算记录将在此展示</p>
          </div>
        ) : (
          <div className="space-y-2">
            {settlements.map(s => (
              <div key={s.id} className="p-4 rounded-xl border border-gray-200 hover:border-gray-300 transition-all">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>{s.patternTitle}</p>
                    <p className="text-xs text-[#9B9590] mt-0.5">订单号: {s.orderNo}</p>
                  </div>
                  <StatusBadge status={s.status} labels={{
                    pending: { label: '待结算', color: '#C4912A', bg: 'rgba(196,145,42,0.12)' },
                    processing: { label: '处理中', color: '#1A3D4A', bg: 'rgba(26,61,74,0.09)' },
                    completed: { label: '已到账', color: '#16A34A', bg: 'rgba(22,163,74,0.10)' },
                    frozen: { label: '已冻结', color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
                  }} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[#9B9590]">买家实付</span>
                    <p className="text-[#1A3D4A] mt-0.5" style={{ fontWeight: 600 }}>¥{s.buyerAmount}</p>
                  </div>
                  <div>
                    <span className="text-[#9B9590]">平台佣金</span>
                    <p className="text-amber-600 mt-0.5" style={{ fontWeight: 600 }}>-¥{s.commission}</p>
                  </div>
                  <div>
                    <span className="text-[#9B9590]">您的收入</span>
                    <p className="text-emerald-600 mt-0.5" style={{ fontWeight: 600 }}>¥{s.sellerIncome}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#9B9590]">
                  <Calendar className="w-3.5 h-3.5" />
                  {s.status === 'completed' ? `已到账 ${s.settledAt}` : `创建于 ${s.createdAt}`}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function SellerCenter({ open, onClose }: SellerCenterProps) {
  const [activeTab, setActiveTab] = useState<SellerCenterTab>('auth');
  const { sellerProfile, sellerAgreement, paymentAccount, isSellerReady } = useApp();

  const getTabStatus = (tab: SellerCenterTab): 'done' | 'todo' => {
    if (tab === 'auth') return sellerProfile?.status === 'verified' ? 'done' : 'todo';
    if (tab === 'agreement') return sellerAgreement?.serviceAgreement === 'signed' ? 'done' : 'todo';
    if (tab === 'payment') return paymentAccount?.status === 'verified' ? 'done' : 'todo';
    return 'todo';
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40" onClick={onClose}
            style={{ backdropFilter: 'blur(2px)' }} />

          <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed top-0 right-0 bottom-0 w-full max-w-md bg-white shadow-2xl z-50 flex flex-col"
            style={{ borderLeft: '1px solid rgba(26,61,74,0.1)' }}>

            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0"
              style={{ background: 'linear-gradient(to right, #F5F0E8, #FBF9F5)' }}>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h2 className="text-lg text-[#1A3D4A]" style={{ fontWeight: 700 }}>卖家中心</h2>
                  <p className="text-xs text-[#9B9590] mt-0.5">完成入驻后可发布纹样到市集交易</p>
                </div>
                <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white border border-gray-200 flex items-center justify-center hover:bg-gray-50">
                  <X className="w-4 h-4 text-[#1A3D4A]" />
                </button>
              </div>

              {isSellerReady && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs text-emerald-700" style={{ fontWeight: 600 }}>已完成入驻,可以发布交易商品</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="px-6 py-3 border-b border-gray-100 flex gap-2 flex-shrink-0 overflow-x-auto">
              {TABS.map(tab => {
                const status = getTabStatus(tab.key);
                return (
                  <button key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg flex-shrink-0 transition-all ${
                      activeTab === tab.key
                        ? 'bg-[#1A3D4A] text-white'
                        : 'bg-gray-100 text-[#6B6558] hover:bg-gray-200'
                    }`}>
                    {tab.icon}
                    <span className="text-xs" style={{ fontWeight: 600 }}>{tab.label}</span>
                    {status === 'done' && activeTab !== tab.key && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto">
              {activeTab === 'auth' && <AuthTab />}
              {activeTab === 'agreement' && <AgreementTab />}
              {activeTab === 'payment' && <PaymentTab />}
              {activeTab === 'settlement' && <SettlementTab />}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
