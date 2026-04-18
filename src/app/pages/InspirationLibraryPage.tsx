import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import type { MyPattern, CraftInfo, LicenseConfig } from '../context/AppContext';
import { useAuth } from '../context/AuthContext';
import { ProtectedImage } from '../components/ProtectedImage';
import { uploadFile } from '../services/uploadService';
import { patternService } from '../services/patternService';
import {
  Search, Upload, X, ZoomIn, ShieldCheck, Award, Globe, Globe2,
  Lock, Sparkles, Brain, FolderUp, ChevronRight, Check, Star,
  Eye, Trash2, AlertTriangle, QrCode, Stamp, Fingerprint,
  FileText, ChevronDown, Plus, ImagePlus, Info, Store, Percent,
  Layers, DollarSign, TrendingUp, Clock, Settings, Shield, AlertCircle,
  BarChart3, CreditCard,
} from 'lucide-react';
import { SellerCenter } from '../components/SellerCenter';

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['云锦', '宋锦', '蜀锦', '缂丝', '刺绣', '木雕', '陶瓷', '漆器', '剪纸', '刻绘', '其他'];
const FILTER_CATEGORIES = ['云锦', '宋锦', '蜀锦', '缂丝', '刺绣', '木雕', '陶瓷', '漆器', '剪纸', '刻绘'];
const STYLES     = ['古典典藏', '简雅现代', '文化叙事', '商务厚重', '自由探索', '其他'];
const MATERIALS  = ['桑蚕丝', '棉·亚麻', '蚕丝·棉', '高岭土', '樟木·楠木', '生漆·木', '宣纸', '其他'];
const WEAVE_STRUCTURES = ['纬三重缎纹组织', '重纬斜纹组织', '平纹地提花', '缂丝平纹组织', '浮雕刻制', '拉坯成型', '手工彩绘', '其他'];
const TECHNIQUES = ['妆花挖梭工艺', '宋锦彩纬显花', '缂丝戗色', '苏绣乱针绣', '湘绣鬅毛针', '圆雕+浮雕', '青花彩绘', '雕漆工艺', '其他'];
const COLOR_TONES = ['金色·米白', '朱砂红·宝石蓝', '粉白·翠绿', '青瓷蓝·素白', '原木棕·朱红', '墨绿·烟灰', '藏青·金', '其他'];

// ── Source badge config ───────────────────────────────────────────────────────
const SOURCE_CONFIG: Record<string, { label: string; labelEn: string; color: string; bg: string; icon: React.ReactNode }> = {
  zhihui:  { label: '智绘AI',   labelEn: 'ZhiHui AI',      color: '#C4912A', bg: 'rgba(196,145,42,0.12)', icon: <Sparkles className="w-2.5 h-2.5" /> },
  copilot: { label: '设计提案', labelEn: 'Design Proposal', color: '#1A3D4A', bg: 'rgba(26,61,74,0.10)',  icon: <Brain className="w-2.5 h-2.5" /> },
  upload:  { label: '自有上传', labelEn: 'Uploaded',        color: '#6B6558', bg: 'rgba(107,101,88,0.10)',icon: <FolderUp className="w-2.5 h-2.5" /> },
  licensed:{ label: '授权获得', labelEn: 'Licensed',        color: '#0F766E', bg: 'rgba(15,118,110,0.12)', icon: <Shield className="w-2.5 h-2.5" /> },
};

const RIGHTS_CONFIG = {
  none:       { label: '待确权', color: '#9B9590', bg: 'rgba(155,149,144,0.12)', dot: '#9B9590' },
  processing: { label: '确权中', color: '#D4900A', bg: 'rgba(212,144,10,0.12)',  dot: '#D4900A' },
  done:       { label: '已确权', color: '#16A34A', bg: 'rgba(22,163,74,0.10)',  dot: '#16A34A' },
};

// ── Certificate generator ─────────────────────────────────────────────────────
function genCertNo() {
  const y = new Date().getFullYear();
  const n = String(Math.floor(1000 + Math.random() * 9000));
  return `EC-${y}-${n}`;
}

function nowStr() {
  return new Date().toLocaleString('zh', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit',
  }).replace(/\//g, '-');
}

// ── Subcomponents ─────────────────────────────────────────────────────────────

/** Image lightbox */
function Lightbox({ src, title, onClose }: { src: string; title: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.88 }} animate={{ scale: 1 }} exit={{ scale: 0.88 }}
        className="relative max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        <ProtectedImage src={src} alt={title} className="w-full rounded-2xl shadow-2xl" style={{ maxHeight: '80vh', objectFit: 'contain' }} />
        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 rounded-b-2xl"
          style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
          <p className="text-white text-sm">{title}</p>
        </div>
        <button onClick={onClose} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg">
          <X className="w-4 h-4 text-[#1A3D4A]" />
        </button>
      </motion.div>
    </motion.div>
  );
}

/** Certificate View Modal */
function CertificateModal({ pattern, userName, onClose }: { pattern: MyPattern; userName: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
        <button onClick={onClose} className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg z-10">
          <X className="w-4 h-4 text-[#1A3D4A]" />
        </button>

        {/* Certificate card */}
        <div className="rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(145deg, #FEFCF5, #F9F3E4)', border: '1.5px solid rgba(196,145,42,0.35)' }}>
          {/* Header strip */}
          <div className="px-6 py-4 text-center" style={{ background: 'linear-gradient(135deg, #0D2535, #1A3D4A)' }}>
            <div className="flex items-center justify-center gap-2 mb-1">
              <Fingerprint className="w-5 h-5 text-[#C4912A]" />
              <span className="text-white text-sm tracking-widest" style={{ fontWeight: 700, letterSpacing: '0.12em' }}>鋆寰｜非遗智作</span>
              <Fingerprint className="w-5 h-5 text-[#C4912A]" />
            </div>
            <p className="text-[10px] tracking-widest" style={{ color: 'rgba(196,145,42,0.7)', letterSpacing: '0.15em' }}>
              鋆寰科技确权平台
            </p>
          </div>

          {/* Title */}
          <div className="text-center py-4" style={{ borderBottom: '1px dashed rgba(196,145,42,0.3)' }}>
            <p className="text-[#C4912A] tracking-widest mb-0.5" style={{ fontSize: 13, fontWeight: 700, letterSpacing: '0.2em' }}>纹 样 确 权 证 书</p>
            <p className="text-[10px] text-[#9B9590] tracking-wider">PATTERN RIGHTS CERTIFICATE</p>
          </div>

          {/* Body */}
          <div className="px-6 py-4 space-y-3">
            {/* Pattern thumbnail + cert no */}
            <div className="flex gap-4 items-start">
              <ProtectedImage src={pattern.imageUrl} alt={pattern.title}
                className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                style={{ border: '1.5px solid rgba(196,145,42,0.3)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <QrCode className="w-3 h-3 text-[#C4912A]" />
                  <span className="text-[10px] text-[#9B9590]">证书编号</span>
                </div>
                <p className="text-sm text-[#1A3D4A] font-mono" style={{ fontWeight: 700 }}>{pattern.certNo}</p>
                <div className="mt-2 px-2 py-1 rounded-lg inline-flex items-center gap-1"
                  style={{ background: 'rgba(22,163,74,0.08)', border: '1px solid rgba(22,163,74,0.2)' }}>
                  <Check className="w-3 h-3 text-emerald-600" />
                  <span className="text-[10px] text-emerald-700">确权有效</span>
                </div>
              </div>
            </div>

            {/* Info rows */}
            {[
              { label: '纹样名称', value: pattern.title },
              { label: '品　　类', value: pattern.category ?? '—' },
              { label: '风格类别', value: pattern.style ?? '—' },
              { label: '设　计　师', value: userName },
              { label: '创作时间', value: pattern.createdAt ?? pattern.savedAt },
              { label: '确权时间', value: pattern.certIssuedAt ?? '—' },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5"
                style={{ borderBottom: '1px solid rgba(26,61,74,0.06)' }}>
                <span className="text-[11px] text-[#9B9590]">{row.label}</span>
                <span className="text-[11px] text-[#1A3D4A] text-right max-w-[200px] truncate" style={{ fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}

            {/* Encryption info */}
            <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.08)' }}>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#C4912A]" />
                <span className="text-[10px] text-[#C4912A]" style={{ fontWeight: 600 }}>加密技术说明</span>
              </div>
              <p className="text-[10px] text-[#6B6558] leading-relaxed">
                确权采用机密加密技术，对话记录·图案·工艺特征·创新描述合并加密存证，
                哈希值安全托管于鋆寰科技锦绣智织平台。
              </p>
            </div>

            {/* Watermark info */}
            <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(196,145,42,0.05)', border: '1px solid rgba(196,145,42,0.15)' }}>
              <div className="flex items-center gap-1.5">
                <Stamp className="w-3 h-3 text-[#C4912A]" />
                <span className="text-[10px] text-[#C4912A]" style={{ fontWeight: 600 }}>水印保护说明</span>
              </div>
              <p className="text-[10px] text-[#6B6558] leading-relaxed">
                <span className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>可见水印：</span>{userName}｜
                <span className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>不可见水印：</span>{pattern.certNo}·鋆寰科技
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 text-center" style={{ borderTop: '1px dashed rgba(196,145,42,0.3)', background: 'rgba(196,145,42,0.03)' }}>
            <p className="text-[10px] text-[#9B9590]">签发机构：南京鋆寰科技有限公司</p>
            <p className="text-[9px] text-[#C4A88A] mt-0.5">加密存证仅作法律参考，如需更强法律效力请自行官方版权认证。</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Extracted sub-components (must be defined OUTSIDE modal to avoid remount on each rerender) ──
const LicenseToggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!value)} className="flex-shrink-0 rounded-full transition-all"
    style={{ width: 36, height: 20, display: 'flex', alignItems: 'center', padding: '2px',
      background: value ? '#1A3D4A' : 'rgba(26,61,74,0.18)', justifyContent: value ? 'flex-end' : 'flex-start' }}>
    <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'block' }} />
  </button>
);

const LicensePriceInput = ({ value, onChange, placeholder, error, suffix = '元/次' }: {
  value: string; onChange: (v: string) => void; placeholder?: string; error?: string; suffix?: string;
}) => (
  <div>
    <div className="relative flex items-center">
      <span className="absolute left-3 text-[#9B9590] text-xs">¥</span>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={e => onChange(e.target.value.replace(/[^0-9]/g, ''))}
        placeholder={placeholder}
        className="w-full text-xs border rounded-xl pl-7 pr-14 py-2 outline-none text-[#1A3D4A] bg-white"
        style={{ border: error ? '1.5px solid #DC2626' : '1.5px solid rgba(26,61,74,0.12)' }}
      />
      <span className="absolute right-3 text-[9px] text-[#9B9590]">{suffix}</span>
    </div>
    {error && <p className="text-[10px] text-red-500 mt-0.5">{error}</p>}
  </div>
);

/** Publish / License Config Modal — 2-step: License Config → Revenue Share Confirm */
function LicensePublishModal({ pattern, onClose, onConfirm, isSellerReady, onOpenSellerCenter }: {
  pattern: MyPattern;
  onClose: () => void;
  onConfirm: (config: LicenseConfig, price: string) => void;
  isSellerReady: boolean;
  onOpenSellerCenter: () => void;
}) {
  const [step, setStep] = useState<'config' | 'confirm'>('config');
  const [enableProject, setEnableProject] = useState(true);
  const [enableAnnual, setEnableAnnual] = useState(true);
  const [enableLimited, setEnableLimited] = useState(false);
  const [projectPriceStr, setProjectPriceStr] = useState(pattern.price ?? '');
  const [allowDerivative, setAllowDerivative] = useState(true);
  const [allowCommercial, setAllowCommercial] = useState(true);
  const [region, setRegion] = useState('中国大陆');
  const [agreed, setAgreed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const COMMISSION_RATE = 10;
  const projectPrice = Number(projectPriceStr) || 0;
  const annualPrice  = projectPrice > 0 ? Math.round(projectPrice * 2.5) : 0;

  const lowestPriceForDemo = (() => {
    const prices: number[] = [];
    if (enableProject && projectPrice > 0) prices.push(projectPrice);
    if (enableAnnual && annualPrice > 0) prices.push(annualPrice);
    if (enableLimited && projectPrice > 0) prices.push(Math.round(projectPrice * 0.6));
    return prices.length > 0 ? Math.min(...prices) : 0;
  })();
  const platformFee  = Math.round(lowestPriceForDemo * COMMISSION_RATE / 100);
  const sellerIncome = lowestPriceForDemo - platformFee;

  const configValid = (enableProject || enableAnnual || enableLimited) &&
    (!enableProject || projectPrice > 0) &&
    (!enableLimited || projectPrice > 0) &&
    region.trim().length > 0;

  const validate = () => {
    const e: Record<string, string> = {};
    if (!enableProject && !enableAnnual && !enableLimited) e.types = '至少开启一种授权类型';
    if (enableProject && projectPrice <= 0) e.projectPrice = '请输入有效价格';
    if (enableLimited && projectPrice <= 0) e.projectPrice = '开启限量授权需要设置基准价格';
    if (!region.trim()) e.region = '请填写授权地域';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  // Toggle and PriceInput are now defined outside as LicenseToggle / LicensePriceInput

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ border: '1px solid rgba(26,61,74,0.1)', maxHeight: '92vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0D2535, #1A3D4A)', borderBottom: '1px solid rgba(196,145,42,0.2)' }}>
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-[#C4912A]" />
            <span className="text-white" style={{ fontWeight: 700, fontSize: 13 }}>
              {step === 'config' ? '发布至纹样市集 · 授权方案配置' : '发布确认 · 分账规则确认'}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5">
              {(['config', 'confirm'] as const).map((s, i) => (
                <React.Fragment key={s}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                    style={{
                      background: step === s ? '#C4912A' : (step === 'confirm' && s === 'config') ? '#16A34A' : 'rgba(255,255,255,0.15)',
                      color: 'white', fontWeight: 700,
                    }}>
                    {(step === 'confirm' && s === 'config') ? <Check className="w-2.5 h-2.5" /> : i + 1}
                  </div>
                  {i === 0 && <div className="w-4 h-px" style={{ background: step === 'confirm' ? '#16A34A' : 'rgba(255,255,255,0.2)' }} />}
                </React.Fragment>
              ))}
            </div>
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4" style={{ scrollbarWidth: 'thin' }}>
          <AnimatePresence mode="wait">

            {/* ── Step 1: License Config ── */}
            {step === 'config' && (
              <motion.div key="config" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">

                {/* seller-center banner removed */}

                {/* Pattern preview */}
                <div className="flex gap-3 items-center p-3.5 rounded-xl" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.08)' }}>
                  <ProtectedImage src={pattern.imageUrl} alt="" className="w-16 h-16 rounded-xl object-cover flex-shrink-0" style={{ border: '1px solid rgba(26,61,74,0.1)' }} />
                  <div>
                    <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 700 }}>{pattern.title}</p>
                    <p className="text-[11px] text-[#6B6558] mt-0.5">{pattern.category} · {pattern.style}</p>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="flex items-center gap-0.5 text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A' }}>
                        <ShieldCheck className="w-2.5 h-2.5" />已确权 · {pattern.certNo}
                      </span>
                    </div>
                  </div>
                </div>

                {errors.types && <p className="text-xs text-red-500 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{errors.types}</p>}

                {/* ── 基准价格说明 ── */}
                <div className="px-3.5 py-3 rounded-xl" style={{ background: 'rgba(196,145,42,0.06)', border: '1px solid rgba(196,145,42,0.2)' }}>
                  <p className="text-[11px] text-[#A8741A] mb-1" style={{ fontWeight: 600 }}>💡 定价说明</p>
                  <p className="text-[10px] text-[#6B6558] leading-relaxed">
                    以「单项目授权」为基准价。年度授权自动按 ×2.5 计算；限量授权按件数阶梯自动计算。您只需填写一个基准价，平台自动生成完整价格体系。
                  </p>
                </div>

                {/* 基准价格 */}
                <div>
                  <label className="text-[11px] text-[#1A3D4A] mb-2 flex items-center gap-1" style={{ fontWeight: 600 }}>
                    单项目授权基准价 <span className="text-red-500">*</span>
                    <span className="ml-auto text-[9px] text-[#9B9590]">其他价格自动计算</span>
                  </label>
                  <LicensePriceInput value={projectPriceStr} onChange={setProjectPriceStr} placeholder="如：1200" error={errors.projectPrice} suffix="元/次" />
                </div>

                {/* ① 单项目授权 */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${enableProject ? '#1A3D4A' : 'rgba(26,61,74,0.12)'}` }}>
                  <div className="flex items-start justify-between px-4 py-3"
                    style={{ background: enableProject ? 'rgba(26,61,74,0.04)' : 'white' }}>
                    <div className="flex items-start gap-2.5 flex-1">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: enableProject ? 'rgba(26,61,74,0.12)' : 'rgba(26,61,74,0.05)' }}>
                        <FileText className="w-4 h-4 text-[#1A3D4A]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs text-[#1A3D4A]" style={{ fontWeight: 600 }}>单项目授权</p>
                          {enableProject && projectPrice > 0 && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(26,61,74,0.1)', color: '#1A3D4A', fontWeight: 600 }}>
                              ¥{projectPrice.toLocaleString()}/次
                            </span>
                          )}
                        </div>
                        <p className="text-[10px] text-[#9B9590] leading-relaxed">
                          适用：单次联名 · 单次礼盒 · 单次活动视觉<br/>
                          边界：1主体 · 1项目 · 1品类 · 中国大陆 · 12个月 · 非独占
                        </p>
                      </div>
                    </div>
                    <LicenseToggle value={enableProject} onChange={setEnableProject} />
                  </div>
                </div>

                {/* ② 年度授权 */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${enableAnnual ? '#C4912A' : 'rgba(26,61,74,0.12)'}` }}>
                  <div className="flex items-start justify-between px-4 py-3"
                    style={{ background: enableAnnual ? 'rgba(196,145,42,0.04)' : 'white' }}>
                    <div className="flex items-start gap-2.5 flex-1">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: enableAnnual ? 'rgba(196,145,42,0.12)' : 'rgba(26,61,74,0.05)' }}>
                        <TrendingUp className="w-4 h-4 text-[#C4912A]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs text-[#1A3D4A]" style={{ fontWeight: 600 }}>年度授权</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(196,145,42,0.12)', color: '#C4912A', fontWeight: 600 }}>
                            基准价 ×2.5{enableAnnual && annualPrice > 0 ? ` = ¥${annualPrice.toLocaleString()}` : ''}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#9B9590] leading-relaxed">
                          适用：品牌年度上新 · 产品线持续传播 · 反复使用同一纹样<br/>
                          边界：1主体 · 1品牌/产品线 · 1品类 · 中国大陆 · 12个月 · 非独占
                        </p>
                      </div>
                    </div>
                    <LicenseToggle value={enableAnnual} onChange={setEnableAnnual} />
                  </div>
                </div>

                {/* ③ 限量授权 */}
                <div className="rounded-xl overflow-hidden" style={{ border: `1.5px solid ${enableLimited ? '#7C3AED' : 'rgba(26,61,74,0.12)'}` }}>
                  <div className="flex items-start justify-between px-4 py-3"
                    style={{ background: enableLimited ? 'rgba(124,58,237,0.04)' : 'white' }}>
                    <div className="flex items-start gap-2.5 flex-1">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ background: enableLimited ? 'rgba(124,58,237,0.12)' : 'rgba(26,61,74,0.05)' }}>
                        <Layers className="w-4 h-4 text-[#7C3AED]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="text-xs text-[#1A3D4A]" style={{ fontWeight: 600 }}>限量授权</p>
                          <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED', fontWeight: 600 }}>阶梯定价自动计算</span>
                        </div>
                        <p className="text-[10px] text-[#9B9590] leading-relaxed">
                          适用：限量礼盒 · 节庆款 · 馆藏衍生商品试水<br/>
                          边界：1主体 · 约定数量上限 · 12个月 · 非独占
                        </p>
                      </div>
                    </div>
                    <LicenseToggle value={enableLimited} onChange={setEnableLimited} />
                  </div>
                  {enableLimited && projectPrice > 0 && (
                    <div className="px-4 pb-3 pt-2 space-y-1.5" style={{ background: 'rgba(124,58,237,0.02)', borderTop: '1px solid rgba(124,58,237,0.1)' }}>
                      <p className="text-[10px] text-[#9B9590] mb-2">系数自动计算（基准价 × 系数）</p>
                      {[
                        { label: '100 件以内', coeff: 0.6 },
                        { label: '500 件以内', coeff: 0.9 },
                        { label: '1,000 件以内', coeff: 1.2 },
                        { label: '3,000 件以内', coeff: 1.8 },
                        { label: '10,000 件以内', coeff: 3.0 },
                      ].map((tier, i) => (
                        <div key={i} className="flex items-center justify-between py-1.5 px-3 rounded-lg"
                          style={{ background: i % 2 === 0 ? 'rgba(124,58,237,0.04)' : 'white', border: '1px solid rgba(124,58,237,0.08)' }}>
                          <span className="text-[10px] text-[#6B6558]">{tier.label}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] text-[#9B9590]">×{tier.coeff}</span>
                            <span className="text-[11px] text-[#7C3AED]" style={{ fontWeight: 700 }}>
                              ¥{Math.round(projectPrice * tier.coeff).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 其他授权设置 */}
                <div className="rounded-xl p-3.5 space-y-3" style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.07)' }}>
                  <p className="text-[10px] text-[#9B9590]" style={{ fontWeight: 600, letterSpacing: '0.08em' }}>授权附加条件</p>
                  {[
                    { label: '允许买方改编', sub: '允许在原纹样基础上进行二次设计', value: allowDerivative, setter: setAllowDerivative },
                    { label: '允许商业使用', sub: '允许用于商业产品和商业活动', value: allowCommercial, setter: setAllowCommercial },
                  ].map(row => (
                    <div key={row.label} className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] text-[#1A3D4A]" style={{ fontWeight: 500 }}>{row.label}</p>
                        <p className="text-[10px] text-[#9B9590]">{row.sub}</p>
                      </div>
                      <LicenseToggle value={row.value} onChange={row.setter} />
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Revenue Share Confirm ── */}
            {step === 'confirm' && (
              <motion.div key="confirm" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">

                {/* Third confirmation notice */}
                <div className="p-3.5 rounded-xl text-center" style={{ background: 'linear-gradient(135deg, rgba(26,61,74,0.06), rgba(196,145,42,0.04))', border: '1px solid rgba(196,145,42,0.25)' }}>
                  <p className="text-[#C4912A]" style={{ fontWeight: 700, fontSize: 13 }}>🔔 发布前 · 分账规则再次确认</p>
                </div>

                {/* License config summary */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(26,61,74,0.09)' }}>
                  <div className="px-3.5 py-2.5 flex items-center gap-2" style={{ background: 'rgba(26,61,74,0.04)', borderBottom: '1px solid rgba(26,61,74,0.06)' }}>
                    <Settings className="w-3.5 h-3.5 text-[#1A3D4A]" />
                    <span className="text-[11px] text-[#1A3D4A]" style={{ fontWeight: 600 }}>授权方案摘要</span>
                  </div>
                  <div className="px-3.5 py-3 space-y-1.5 bg-white">
                    {enableProject && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#9B9590]">单项目授权</span>
                        <span className="text-[#1A3D4A]" style={{ fontWeight: 600 }}>¥{projectPrice.toLocaleString()}/次</span>
                      </div>
                    )}
                    {enableAnnual && (
                      <div className="flex justify-between text-[11px]">
                        <span className="text-[#9B9590]">年度授权（单项目×2.5）</span>
                        <span className="text-[#C4912A]" style={{ fontWeight: 600 }}>¥{annualPrice.toLocaleString()}/年</span>
                      </div>
                    )}
                    {enableLimited && (
                      <div>
                        <p className="text-[10px] text-[#9B9590] mb-1">限量授权（阶梯自动计算）</p>
                        <div className="pl-2 space-y-0.5">
                          {[
                            { label: '100件以内',    coeff: 0.6 },
                            { label: '500件以内',    coeff: 0.9 },
                            { label: '1,000件以内',  coeff: 1.2 },
                            { label: '3,000件以内',  coeff: 1.8 },
                            { label: '10,000件以内', coeff: 3.0 },
                          ].map(tier => (
                            <div key={tier.label} className="flex justify-between text-[10px]">
                              <span className="text-[#C4A88A]">{tier.label}</span>
                              <span className="text-[#1A3D4A]">¥{Math.round(projectPrice * tier.coeff).toLocaleString()}/次</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex justify-between text-[11px] pt-1" style={{ borderTop: '1px dashed rgba(26,61,74,0.08)' }}>
                      <span className="text-[#9B9590]">地域 · 改编 · 商用</span>
                      <span className="text-[#1A3D4A]">{region} · {allowDerivative ? '可改编' : '不可改编'} · {allowCommercial ? '可商用' : '非商用'}</span>
                    </div>
                  </div>
                </div>

                {/* Revenue split visual */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1.5px solid rgba(196,145,42,0.3)' }}>
                  <div className="px-3.5 py-2.5 flex items-center gap-2"
                    style={{ background: 'linear-gradient(135deg, rgba(196,145,42,0.12), rgba(196,145,42,0.05))', borderBottom: '1px solid rgba(196,145,42,0.15)' }}>
                    <span className="text-[11px] text-[#C4912A]" style={{ fontWeight: 700 }}>平台分账规则</span>
                    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(196,145,42,0.2)', color: '#A8741A', fontWeight: 600 }}>固定10%佣金</span>
                  </div>
                  <div className="p-3.5 space-y-3" style={{ background: 'rgba(254,252,245,0.8)' }}>
                    {/* Calculation example */}
                    {lowestPriceForDemo > 0 ? (
                      <div className="rounded-xl p-3 space-y-1.5" style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.07)' }}>
                        <p className="text-[10px] text-[#9B9590]">以最低价 ¥{lowestPriceForDemo.toLocaleString()} 为例：</p>
                        {[
                          { label: '买家实付', value: `¥${lowestPriceForDemo.toLocaleString()}`, color: '#1A3D4A', bold: false },
                          { label: `平台佣金（${COMMISSION_RATE}%）`, value: `−¥${platformFee.toLocaleString()}`, color: '#C4912A', bold: false },
                          { label: '卖家净收入（90%）', value: `¥${sellerIncome.toLocaleString()}`, color: '#16A34A', bold: true },
                        ].map(row => (
                          <div key={row.label} className="flex items-center justify-between">
                            <span className="text-[11px] text-[#6B6558]">{row.label}</span>
                            <span className="text-[11px] font-mono" style={{ color: row.color, fontWeight: row.bold ? 700 : 500 }}>{row.value}</span>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {/* T+7 */}
                    <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.07)' }}>
                      <Clock className="w-3 h-3 text-[#1A3D4A] mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-[10px] text-[#1A3D4A]" style={{ fontWeight: 600 }}>T+7 结算周期</p>
                        <p className="text-[10px] text-[#6B6558] leading-relaxed mt-0.5">买家付款成功后，平台于 T+7 个工作日将卖家净收入结算至绑定收款账户。如发生纠纷，平台有权暂停结算并介入处理。</p>
                      </div>
                    </div>

                    {/* Risk notice */}
                    <div className="flex items-start gap-2 p-2.5 rounded-xl" style={{ background: 'rgba(196,145,42,0.05)', border: '1px solid rgba(196,145,42,0.15)' }}>
                      <AlertTriangle className="w-3 h-3 text-[#C4912A] mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-[#6B6558] leading-relaxed">
                        发布即同意《纹样授权交易规则》《平台收费与分账规则》。如纹样存在侵权风险，平台有权下架并冻结资金。
                      </p>
                    </div>
                  </div>
                </div>

                {/* Agree checkbox */}
                <button onClick={() => setAgreed(v => !v)}
                  className="w-full flex items-center gap-2.5 p-3 rounded-xl text-left transition-all"
                  style={{ border: `1.5px solid ${agreed ? 'rgba(22,163,74,0.4)' : 'rgba(26,61,74,0.12)'}`, background: agreed ? 'rgba(22,163,74,0.04)' : 'white' }}>
                  <div className="w-5 h-5 rounded flex items-center justify-center flex-shrink-0"
                    style={{ background: agreed ? '#16A34A' : 'white', border: agreed ? 'none' : '1.5px solid rgba(26,61,74,0.25)' }}>
                    {agreed && <Check className="w-3.5 h-3.5 text-white" />}
                  </div>
                  <p className="text-[11px] text-[#1A3D4A]">
                    我已阅读并同意上述<span className="text-[#C4912A]" style={{ fontWeight: 600 }}>分账规则</span>，确认授权平台在交易成功后按上述比例自动执行分账结算。
                  </p>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(26,61,74,0.06)' }}>
          {step === 'config' && (
            <>
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6558]"
                style={{ border: '1px solid rgba(26,61,74,0.12)' }}>取消</button>
              <button
                onClick={() => { if (validate()) setStep('confirm'); }}
                disabled={!configValid}
                className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-1.5 transition-all"
                style={{
                  background: configValid ? 'linear-gradient(135deg, #1A3D4A, #2A5568)' : 'rgba(26,61,74,0.25)',
                  cursor: configValid ? 'pointer' : 'not-allowed',
                }}>
                下一步：确认分账规则 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </>
          )}
          {step === 'confirm' && (
            <>
              <button onClick={() => setStep('config')} className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6558]"
                style={{ border: '1px solid rgba(26,61,74,0.12)' }}>← 返回修改</button>
              <button
                onClick={() => {
                  if (!agreed) { toast.error('请先勾选同意分账规则'); return; }
                  const config: LicenseConfig = {
                    patternId: pattern.id,
                    enableProject, enableAnnual, enableLimited,
                    projectPrice: enableProject ? projectPrice : undefined,
                    annualPrice: enableAnnual ? annualPrice : undefined,
                    limitedTiers: enableLimited ? {
                      qty100: Math.round(projectPrice * 0.6), qty500: Math.round(projectPrice * 0.9), qty1000: Math.round(projectPrice * 1.2),
                    } : undefined,
                    allowDerivative, allowCommercial, region: region.trim(), productCategories: [],
                  };
                  const displayPrice = enableProject ? String(projectPrice) : enableAnnual ? String(annualPrice) : String(Math.round(projectPrice * 0.6));
                  onConfirm(config, displayPrice);
                }}
                disabled={!agreed}
                className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-1.5 transition-all"
                style={{ background: agreed ? 'linear-gradient(135deg, #C4912A, #A87920)' : 'rgba(196,145,42,0.3)', cursor: agreed ? 'pointer' : 'not-allowed' }}>
                <Store className="w-3.5 h-3.5" />确认发布至市集
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Copyright certification modal — 2-step: info+email → pay QR → submit */
function CopyrightModal({ pattern, onClose, onConfirm }: {
  pattern: MyPattern;
  onClose: () => void;
  onConfirm: (email: string) => void;
}) {
  const [step, setStep] = useState<'info' | 'pay'>('info');
  const [agreed, setAgreed] = useState(false);
  const [email, setEmail] = useState('');
  const [emailErr, setEmailErr] = useState('');
  const [payDone, setPayDone] = useState(false);
  const [payLoading, setPayLoading] = useState(false);

  const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  const goToPay = () => {
    if (!agreed) { toast.error('请���勾选同意'); return; }
    if (!email.trim()) { setEmailErr('请填写接收通知的邮箱'); return; }
    if (!emailValid) { setEmailErr('邮箱格式不正确'); return; }
    setEmailErr('');
    setStep('pay');
  };

  const simulatePay = () => {
    setPayLoading(true);
    setTimeout(() => { setPayLoading(false); setPayDone(true); }, 1600);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}
        style={{ border: '1px solid rgba(26,61,74,0.1)' }}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, rgba(26,61,74,0.08), rgba(26,61,74,0.03))' }}>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#1A3D4A]" />
            <span className="text-[#1A3D4A]" style={{ fontWeight: 600 }}>
              {step === 'info' ? '申请版权认证' : '扫码支付 · 版权认证费'}
            </span>
          </div>
          {/* Step indicator */}
          <div className="flex items-center gap-1.5">
            {(['info', 'pay'] as const).map((s, i) => (
              <React.Fragment key={s}>
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px]"
                  style={{
                    background: step === s ? '#1A3D4A' : (step === 'pay' && s === 'info') ? '#16A34A' : 'rgba(26,61,74,0.1)',
                    color: (step === s || (step === 'pay' && s === 'info')) ? 'white' : '#9B9590',
                    fontWeight: 600,
                  }}>
                  {(step === 'pay' && s === 'info') ? <Check className="w-2.5 h-2.5" /> : i + 1}
                </div>
                {i === 0 && <div className="w-4 h-px" style={{ background: step === 'pay' ? '#16A34A' : 'rgba(26,61,74,0.15)' }} />}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ── Step 1: Info + Email ── */}
        {step === 'info' && (
          <>
            <div className="p-5 space-y-3 overflow-y-auto" style={{ maxHeight: '60vh' }}>
              <div className="p-3 rounded-xl space-y-1.5" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.08)' }}>
                <p className="text-xs text-[#1A3D4A]" style={{ fontWeight: 500 }}>什么是版权认证？</p>
                <p className="text-[11px] text-[#6B6558] leading-relaxed">
                  版权认证是在确权基础上，通过调用<span className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>国家版权局官方接口</span>进行的政府权威认证。
                  认证成功后，您的纹样将受到国家版权法的完整保护，适合在纹样市集进行高价值流通。
                </p>
              </div>
              <div className="space-y-1.5">
                {[
                  { icon: '⏱', label: '预计周期', value: '7–15 个工作日' },
                  { icon: '💰', label: '认证费用', value: '¥ 300 / 件（政府标准费率）' },
                  { icon: '📋', label: '认证机构', value: '国家版权局 · 官方数字版权平台' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between px-3 py-2 rounded-xl"
                    style={{ background: 'rgba(26,61,74,0.03)' }}>
                    <span className="text-[11px] text-[#9B9590]">{item.icon} {item.label}</span>
                    <span className="text-[11px] text-[#1A3D4A]" style={{ fontWeight: 500 }}>{item.value}</span>
                  </div>
                ))}
              </div>

              {/* Email field */}
              <div>
                <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>
                  通知邮箱 <span className="text-red-500">*</span>
                  <span className="text-[#9B9590] ml-1" style={{ fontWeight: 400 }}>（认证进度及证书将发送至此邮箱）</span>
                </label>
                <input
                  value={email}
                  onChange={e => { setEmail(e.target.value); setEmailErr(''); }}
                  placeholder="请输入您的邮箱地址"
                  className="w-full text-sm rounded-xl px-3 py-2 outline-none text-[#1A3D4A] bg-white"
                  style={{ border: `1.5px solid ${emailErr ? '#DC2626' : 'rgba(26,61,74,0.12)'}`, transition: 'border-color 0.2s' }}
                  onFocus={e => { if (!emailErr) e.target.style.borderColor = '#C4912A'; }}
                  onBlur={e => { if (!emailErr) e.target.style.borderColor = 'rgba(26,61,74,0.12)'; }}
                />
                {emailErr && <p className="text-[10px] text-red-500 mt-0.5">{emailErr}</p>}
              </div>

              <button onClick={() => setAgreed(!agreed)}
                className="w-full flex items-center gap-2.5 p-2 rounded-lg text-left"
                style={{ border: `1px solid ${agreed ? 'rgba(22,163,74,0.3)' : 'rgba(26,61,74,0.1)'}`, background: agreed ? 'rgba(22,163,74,0.04)' : 'white' }}>
                <div className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0"
                  style={{ background: agreed ? '#16A34A' : 'white', border: agreed ? 'none' : '1.5px solid rgba(26,61,74,0.2)' }}>
                  {agreed && <Check className="w-3 h-3 text-white" />}
                </div>
                <p className="text-[11px] text-[#6B6558]">我已了解认证流程，同意支付费用并提交认证申请</p>
              </button>
            </div>
            <div className="px-5 pb-5 flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6558]"
                style={{ border: '1px solid rgba(26,61,74,0.12)' }}>取消</button>
              <button onClick={goToPay}
                className="flex-1 py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-1.5"
                style={{ background: (agreed && emailValid) ? 'linear-gradient(135deg, #1A3D4A, #2A5568)' : 'rgba(26,61,74,0.3)', cursor: (agreed && emailValid) ? 'pointer' : 'default' }}>
                下一步：去支付 <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </>
        )}

        {/* ── Step 2: QR Payment ── */}
        {step === 'pay' && (
          <>
            <div className="p-5 space-y-4">
              {/* Amount */}
              <div className="flex items-center justify-between px-4 py-3 rounded-xl"
                style={{ background: 'rgba(196,145,42,0.06)', border: '1px solid rgba(196,145,42,0.18)' }}>
                <div>
                  <p className="text-xs text-[#6B6558]">支付方</p>
                  <p className="text-[11px] text-[#1A3D4A] mt-0.5" style={{ fontWeight: 500 }}>国家版权局认证平台</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-[#9B9590]">应付金额</p>
                  <p style={{ fontSize: 22, fontWeight: 700, color: '#C4912A' }}>¥ 300</p>
                </div>
              </div>

              {/* QR Code mock */}
              <div className="flex flex-col items-center gap-3">
                <p className="text-xs text-[#6B6558]">使用微信 / 支付宝扫码完成支付</p>
                <div className="relative p-2.5 bg-white rounded-xl shadow-md"
                  style={{ border: '2px solid rgba(26,61,74,0.12)', width: 148, height: 148 }}>
                  {/* QR code pattern (mock SVG) */}
                  <svg width="124" height="124" viewBox="0 0 31 31" xmlns="http://www.w3.org/2000/svg" shapeRendering="crispEdges">
                    {/* Top-left finder */}
                    <rect x="0" y="0" width="7" height="7" fill="#1A3D4A"/>
                    <rect x="1" y="1" width="5" height="5" fill="white"/>
                    <rect x="2" y="2" width="3" height="3" fill="#1A3D4A"/>
                    {/* Top-right finder */}
                    <rect x="24" y="0" width="7" height="7" fill="#1A3D4A"/>
                    <rect x="25" y="1" width="5" height="5" fill="white"/>
                    <rect x="26" y="2" width="3" height="3" fill="#1A3D4A"/>
                    {/* Bottom-left finder */}
                    <rect x="0" y="24" width="7" height="7" fill="#1A3D4A"/>
                    <rect x="1" y="25" width="5" height="5" fill="white"/>
                    <rect x="2" y="26" width="3" height="3" fill="#1A3D4A"/>
                    {/* Data modules — simplified pattern */}
                    {[8,10,12,14,16,18,20,22].map(x => <rect key={`t${x}`} x={x} y="0" width="1" height="1" fill="#1A3D4A"/>)}
                    {[9,11,13,17,19,21].map(x => <rect key={`t2${x}`} x={x} y="2" width="1" height="1" fill="#1A3D4A"/>)}
                    {[8,12,16,20].map(x => <rect key={`t3${x}`} x={x} y="4" width="1" height="1" fill="#1A3D4A"/>)}
                    {[8,9,11,13,15,17,19,21,23].map(y => <rect key={`l${y}`} x="0" y={y} width="1" height="1" fill="#1A3D4A"/>)}
                    {[10,12,14,16,18,20,22].map(y => <rect key={`l2${y}`} x="2" y={y} width="1" height="1" fill="#1A3D4A"/>)}
                    {/* Center data area */}
                    {[8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23].map(y =>
                      [8,10,12,14,16,18,20,22].filter(x => (x+y)%3===0).map(x =>
                        <rect key={`d${x}_${y}`} x={x} y={y} width="1" height="1" fill="#1A3D4A"/>
                      )
                    )}
                    {/* Right column */}
                    {[8,10,12,14,18,20,22].map(y => <rect key={`r${y}`} x="30" y={y} width="1" height="1" fill="#1A3D4A"/>)}
                    {[9,11,15,17,19,21,23].map(y => <rect key={`r2${y}`} x="28" y={y} width="1" height="1" fill="#1A3D4A"/>)}
                    {/* Bottom row */}
                    {[8,10,12,14,16,18,22].map(x => <rect key={`b${x}`} x={x} y="30" width="1" height="1" fill="#1A3D4A"/>)}
                    {[9,11,13,17,19,21,23].map(x => <rect key={`b2${x}`} x={x} y="28" width="1" height="1" fill="#1A3D4A"/>)}
                    {/* Center logo area */}
                    <rect x="13" y="13" width="5" height="5" fill="white"/>
                    <rect x="13.5" y="13.5" width="4" height="4" rx="0.5" fill="#C4912A"/>
                  </svg>
                  {payDone && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                      style={{ background: 'rgba(22,163,74,0.92)' }}>
                      <div className="flex flex-col items-center gap-1">
                        <Check className="w-8 h-8 text-white" strokeWidth={3}/>
                        <span className="text-white text-xs" style={{ fontWeight: 600 }}>支付成功</span>
                      </div>
                    </div>
                  )}
                </div>
                <p className="text-[10px] text-[#9B9590]">二维码有效期 15 分钟 · 请勿截图转账</p>
              </div>

              {/* Recipient info */}
              <div className="px-3 py-2.5 rounded-xl text-[10px] text-[#6B6558] leading-relaxed space-y-0.5"
                style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.07)' }}>
                <p>📧 通知邮箱：<span className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>{email}</span></p>
                <p>🏛 收款方：国家版权局认证平台</p>
                <p>📝 认证项目：{pattern.title}</p>
              </div>
            </div>

            <div className="px-5 pb-5 space-y-2">
              {!payDone ? (
                <button onClick={simulatePay}
                  disabled={payLoading}
                  className="w-full py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-2"
                  style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)', opacity: payLoading ? 0.7 : 1 }}>
                  {payLoading ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />支付处理中…</>
                  ) : '我已完成扫码支付'}
                </button>
              ) : (
                <button onClick={() => onConfirm(email.trim())}
                  className="w-full py-2.5 rounded-xl text-sm text-white flex items-center justify-center gap-1.5"
                  style={{ background: 'linear-gradient(135deg, #16A34A, #15803d)' }}>
                  <Check className="w-4 h-4" />支付成功 · 提交认证申请
                </button>
              )}
              <button onClick={() => setStep('info')}
                className="w-full py-2 rounded-xl text-xs text-[#9B9590]"
                style={{ border: '1px solid rgba(26,61,74,0.08)' }}>
                ← 返回上一步
              </button>
            </div>
          </>
        )}
      </motion.div>
    </motion.div>
  );
}

/** Rights confirmation wizard (multi-step) */
type RightsStep = 'info' | 'craft' | 'encrypting' | 'done';

// Issue 11: innovationPoints moved before heritageSource
// Issue 9: innovationPoints is required; Issue 10: heritageSource is optional
// Issues 7&8: weaveStructure and technique handle "其他" in component
const CRAFT_FIELDS_BASE: { key: keyof CraftInfo; label: string; type: 'select' | 'input' | 'textarea' | 'star'; required: boolean; options?: string[]; placeholder?: string }[] = [
  { key: 'weaveStructure',   label: '织造/制作结构',   type: 'select',   required: true,  options: WEAVE_STRUCTURES },
  { key: 'technique',        label: '工艺技法',        type: 'select',   required: true,  options: TECHNIQUES },
  { key: 'colorLayers',      label: '色彩层次/套色数',  type: 'input',    required: true,  placeholder: '如：12套色 / 5-7层次' },
  { key: 'repeatSize',       label: '纹样循环单元尺寸', type: 'input',    required: true,  placeholder: '如：28×28 cm' },
  { key: 'materialSpec',     label: '材质规格详述',    type: 'input',    required: true,  placeholder: '如：经线桑蚕丝 20/22D，纬线金银线' },
  { key: 'complexity',       label: '工艺复杂度',      type: 'star',     required: true  },
  { key: 'patternDesc',      label: '图案描述',        type: 'textarea', required: true,  placeholder: '描述纹样的图案内容、主题意象及视觉特征…' },
  { key: 'innovationPoints', label: '创新亮点',        type: 'textarea', required: true,  placeholder: '描述纹样在传统基础上的创新之处，如：线条简化、配色革新、跨品类融合等…' },
  { key: 'adaptProducts',    label: '适配方向',        type: 'textarea', required: true,  placeholder: '描述适合落地的产品品类或应用场景，如：高端礼盒、真丝丝巾、家居软装…' },
  { key: 'heritageSource',   label: '传承来源/工坊',   type: 'input',    required: false, placeholder: '如：南京云锦传承基地·柯桂荣工坊（选填）' },
];

function RightsWizard({ pattern, userName, onClose, onConfirmed, onViewCertificate }: {
  pattern: MyPattern;
  userName: string;
  onClose: () => void;
  onConfirmed: (craft: CraftInfo) => Promise<MyPattern>;
  onViewCertificate: (pattern: MyPattern) => void;
}) {
  const [step, setStep] = useState<RightsStep>('info');
  const [craft, setCraft] = useState<CraftInfo>(pattern.craftInfo ?? {
    weaveStructure: '', technique: '', colorLayers: '', repeatSize: '',
    materialSpec: '', complexity: 3, heritageSource: '', innovationPoints: '',
  });
  // Issues 7 & 8: track "其他" selection for weave/technique
  const [weaveSelectVal, setWeaveSelectVal] = useState(() =>
    WEAVE_STRUCTURES.includes(craft.weaveStructure) ? craft.weaveStructure : (craft.weaveStructure ? '其他' : '')
  );
  const [techSelectVal, setTechSelectVal] = useState(() =>
    TECHNIQUES.includes(craft.technique) ? craft.technique : (craft.technique ? '其他' : '')
  );
  const [weaveCustom, setWeaveCustom] = useState(() =>
    WEAVE_STRUCTURES.includes(craft.weaveStructure) ? '' : craft.weaveStructure
  );
  const [techCustom, setTechCustom] = useState(() =>
    TECHNIQUES.includes(craft.technique) ? '' : craft.technique
  );
  const [encryptProgress, setEncryptProgress] = useState(0);
  const [confirmedPattern, setConfirmedPattern] = useState<MyPattern | null>(null);
  const [certNo, setCertNo] = useState(pattern.certNo ?? '');
  const [certIssuedAt, setCertIssuedAt] = useState(pattern.certIssuedAt ?? '');

  const sourceDesc: Record<string, string> = {
    zhihui:  `AI 对话记录摘要 + 纹样图案 + 品类专属工艺特征 + 风格类别 + 材质 + 创新点描述`,
    copilot: `设计提案内容 + 最终锁定图案 + 品类专属工艺特征 + 风格类别 + 材质 + 创新点描述`,
    upload:  `自有图案 + 图案描述 + 品类专属工艺特征 + 风格类别 + 材质 + 创新点描述`,
  };

  // Resolved final values for weave/tech
  const resolvedWeave = weaveSelectVal === '其他' ? weaveCustom.trim() : weaveSelectVal;
  const resolvedTech  = techSelectVal  === '其他' ? techCustom.trim()  : techSelectVal;

  // Issue 10: heritageSource removed from required; Issue 9: innovationPoints is required
  const craftValid = resolvedWeave && resolvedTech &&
    craft.colorLayers && craft.repeatSize && craft.materialSpec && craft.innovationPoints;

  const updateCraft = (key: keyof CraftInfo, val: string | number) =>
    setCraft(prev => ({ ...prev, [key]: val }));

  const startEncrypt = async () => {
    // Commit resolved weave/tech before encrypting
    const finalCraft = { ...craft, weaveStructure: resolvedWeave, technique: resolvedTech };
    setCraft(finalCraft);
    setStep('encrypting');
    setEncryptProgress(0);
    const steps = [8, 24, 41, 57, 72, 85, 94, 100];
    for (const p of steps) {
      await new Promise(r => setTimeout(r, 280));
      setEncryptProgress(p);
    }
    try {
      const updatedPattern = await onConfirmed(finalCraft);
      setConfirmedPattern(updatedPattern);
      setCertNo(updatedPattern.certNo ?? genCertNo());
      setCertIssuedAt(updatedPattern.certIssuedAt ?? nowStr());
      await new Promise(r => setTimeout(r, 400));
      setStep('done');
    } catch (error: any) {
      toast.error(error?.message || '确权失败，请稍后重试');
      setStep('craft');
      setEncryptProgress(0);
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={step === 'encrypting' ? undefined : onClose}>
      <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        className="w-full max-w-lg bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ border: '1px solid rgba(26,61,74,0.1)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: 'linear-gradient(135deg, #0D2535, #1A3D4A)', borderBottom: '1px solid rgba(196,145,42,0.15)' }}>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#C4912A]" />
            <span className="text-white" style={{ fontWeight: 600 }}>
              {step === 'info' ? '纹样确权 · 信息确认' : step === 'craft' ? '纹样确权 · 工艺特征录入' : step === 'encrypting' ? '纹样确权 · 加密处理中…' : '确权成功 · 证书已生成'}
            </span>
          </div>
          {step !== 'encrypting' && (
            <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Step indicators */}
        <div className="flex items-center px-5 py-3 gap-2 flex-shrink-0" style={{ background: 'rgba(26,61,74,0.03)', borderBottom: '1px solid rgba(26,61,74,0.06)' }}>
          {([
            { key: 'info', label: '① 基础信息' },
            { key: 'craft', label: '② 工艺特征' },
            { key: 'encrypting', label: '③ 加密确权' },
            { key: 'done', label: '④ 证书' },
          ] as const).map((s, i) => {
            const stepOrder = { info: 0, craft: 1, encrypting: 2, done: 3 };
            const currentOrder = stepOrder[step];
            const sOrder = stepOrder[s.key];
            const isActive = s.key === step;
            const isDone = sOrder < currentOrder;
            return (
              <div key={s.key} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3 h-3 text-[#C4A88A]" />}
                <span className="text-[11px]" style={{
                  color: isActive ? '#C4912A' : isDone ? '#16A34A' : '#9B9590',
                  fontWeight: isActive ? 600 : 400,
                }}>
                  {isDone ? '✓ ' : ''}{s.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>
          <AnimatePresence mode="wait">

            {/* Step 1: Basic info */}
            {step === 'info' && (
              <motion.div key="info" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-4">
                <div className="flex gap-4 items-start p-4 rounded-2xl" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.08)' }}>
                  <ProtectedImage src={pattern.imageUrl} alt={pattern.title} className="w-20 h-20 object-cover rounded-xl flex-shrink-0" style={{ border: '1px solid rgba(26,61,74,0.1)' }} />
                  <div>
                    <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>{pattern.title}</p>
                    <p className="text-xs text-[#6B6558] mt-0.5">{pattern.category ?? '—'} · {pattern.style ?? '—'}</p>
                    <p className="text-xs text-[#9B9590] mt-1">来源：{SOURCE_CONFIG[pattern.source]?.label}</p>
                    <p className="text-xs text-[#9B9590]">设计师：{userName}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#1A3D4A] mb-1.5" style={{ fontWeight: 500 }}>待加密内容范围</p>
                  <div className="p-3 rounded-xl" style={{ background: 'rgba(196,145,42,0.05)', border: '1px solid rgba(196,145,42,0.15)' }}>
                    <p className="text-[11px] text-[#6B6558] leading-relaxed">{sourceDesc[pattern.source]}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-[#1A3D4A] mb-2" style={{ fontWeight: 500 }}>基础分类信息确认</p>
                  <div className="space-y-2">
                    {[
                      { label: '品类', value: pattern.category ?? '—' },
                      { label: '风格', value: pattern.style ?? '—' },
                      { label: '材质', value: pattern.material ?? '—' },
                      { label: '色彩基调', value: pattern.colorTone ?? '—' },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between px-3 py-2 rounded-xl"
                        style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.05)' }}>
                        <span className="text-[11px] text-[#9B9590]">{row.label}</span>
                        <div className="flex items-center gap-1">
                          <span className="text-[11px] text-[#1A3D4A]" style={{ fontWeight: 500 }}>{row.value}</span>

                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="p-3 rounded-xl" style={{ background: 'rgba(196,145,42,0.05)', border: '1px dashed rgba(196,145,42,0.25)' }}>
                  <p className="text-[10px] text-[#9B9590] leading-relaxed">
                    确权将对上述内容执行机密加密，生成唯一哈希证书。
                    证书编号将以「<span className="text-[#C4912A]" style={{ fontWeight: 500 }}>EC-XXXX</span>」格式显示，哈希值不对外暴露。
                  </p>
                </div>
              </motion.div>
            )}

            {/* Step 2: Craft info */}
            {step === 'craft' && (
              <motion.div key="craft" initial={{ opacity: 0, x: 12 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} className="space-y-3">
                <div className="p-3 rounded-xl" style={{ background: 'rgba(196,145,42,0.05)', border: '1px solid rgba(196,145,42,0.15)' }}>
                  <p className="text-[11px] text-[#6B6558] leading-relaxed">
                    以下工艺特征字段为通用字段，覆盖云锦、宋锦、蜀锦、苏绣、木雕、陶瓷等所有非遗品类。
                    请根据实际工艺情况如实填写，这些信息将被加密纳入确权内容。
                  </p>
                </div>
                {CRAFT_FIELDS_BASE
                  .map(f => f.key === 'innovationPoints' /* TEST2 */
                    ? { ...f, placeholder: '描述纹样在传统基础上的创新之处，如：线条简化、配色革新、跨品类融合等…' }
                    : f)
                  .filter(f => f.label !== '')
                  .map(field => (
                  <div key={field.key}>
                    <label className="text-xs text-[#1A3D4A] mb-1.5 block" style={{ fontWeight: 500 }}>
                      {field.label}
                      {field.required && <span className="text-red-500 ml-0.5">*</span>}
                      {!field.required && <span className="text-[#9B9590] ml-1 text-[10px]">（选填）</span>}
                    </label>

                    {/* Issue 7: weaveStructure with "其他" expansion */}
                    {field.key === 'weaveStructure' && (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <select value={weaveSelectVal}
                            onChange={e => {
                              setWeaveSelectVal(e.target.value);
                              if (e.target.value !== '其他') { updateCraft('weaveStructure', e.target.value); setWeaveCustom(''); }
                              else { updateCraft('weaveStructure', ''); }
                            }}
                            className="w-full text-sm border rounded-xl px-3 py-2 outline-none appearance-none bg-white focus:border-[#C4912A] text-[#1A3D4A]"
                            style={{ border: '1.5px solid rgba(26,61,74,0.12)' }}>
                            <option value="">请选择…</option>
                            {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9590] pointer-events-none" />
                        </div>
                        {weaveSelectVal === '其他' && (
                          <input value={weaveCustom} autoFocus
                            onChange={e => { setWeaveCustom(e.target.value); updateCraft('weaveStructure', e.target.value); }}
                            placeholder="请描述织造/制作结构，如：多层叠织工艺"
                            className="w-full text-sm border rounded-xl px-3 py-2 outline-none focus:border-[#C4912A] text-[#1A3D4A] bg-white"
                            style={{ border: '1.5px solid rgba(196,145,42,0.35)' }} />
                        )}
                      </div>
                    )}

                    {/* Issue 8: technique with "其他" expansion */}
                    {field.key === 'technique' && (
                      <div className="space-y-1.5">
                        <div className="relative">
                          <select value={techSelectVal}
                            onChange={e => {
                              setTechSelectVal(e.target.value);
                              if (e.target.value !== '其他') { updateCraft('technique', e.target.value); setTechCustom(''); }
                              else { updateCraft('technique', ''); }
                            }}
                            className="w-full text-sm border rounded-xl px-3 py-2 outline-none appearance-none bg-white focus:border-[#C4912A] text-[#1A3D4A]"
                            style={{ border: '1.5px solid rgba(26,61,74,0.12)' }}>
                            <option value="">请选择…</option>
                            {field.options?.map(o => <option key={o} value={o}>{o}</option>)}
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#9B9590] pointer-events-none" />
                        </div>
                        {techSelectVal === '其他' && (
                          <input value={techCustom} autoFocus
                            onChange={e => { setTechCustom(e.target.value); updateCraft('technique', e.target.value); }}
                            placeholder="请描述工艺技法，如：综合镶嵌工艺"
                            className="w-full text-sm border rounded-xl px-3 py-2 outline-none focus:border-[#C4912A] text-[#1A3D4A] bg-white"
                            style={{ border: '1.5px solid rgba(196,145,42,0.35)' }} />
                        )}
                      </div>
                    )}

                    {/* Regular input fields */}
                    {field.type === 'input' && field.key !== 'weaveStructure' && field.key !== 'technique' && (
                      <input value={craft[field.key] as string}
                        onChange={e => updateCraft(field.key, e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        className="w-full text-sm border rounded-xl px-3 py-2 outline-none focus:border-[#C4912A] text-[#1A3D4A] bg-white"
                        style={{ border: '1.5px solid rgba(26,61,74,0.12)' }} />
                    )}

                    {field.type === 'star' && (
                      <div className="flex items-center gap-2">
                        {[1,2,3,4,5].map(v => (
                          <button key={v} onClick={() => updateCraft('complexity', v)} className="transition-all">
                            <Star className={`w-6 h-6 ${(craft.complexity as number) >= v ? 'text-[#C4912A] fill-[#C4912A]' : 'text-[#D4CCBC]'}`} />
                          </button>
                        ))}
                        <span className="text-xs text-[#9B9590] ml-1">
                          {['', '极简', '简单', '中等', '复杂', '极复杂'][craft.complexity as number]}
                        </span>
                      </div>
                    )}

                    {field.type === 'textarea' && (
                      <textarea value={craft[field.key] as string}
                        onChange={e => updateCraft(field.key, e.target.value)}
                        placeholder={field.placeholder ?? ''}
                        rows={3}
                        className="w-full text-sm border rounded-xl px-3 py-2 outline-none focus:border-[#C4912A] text-[#1A3D4A] bg-white resize-none"
                        style={{ border: '1.5px solid rgba(26,61,74,0.12)' }} />
                    )}
                  </div>
                ))}
              </motion.div>
            )}

            {/* Step 3: Encrypting */}
            {step === 'encrypting' && (
              <motion.div key="encrypting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center py-8 space-y-6">
                <div className="relative w-20 h-20">
                  <div className="absolute inset-0 rounded-full border-4 border-[rgba(196,145,42,0.15)]" />
                  <div className="absolute inset-0 rounded-full border-4 border-[#C4912A] border-t-transparent animate-spin" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Lock className="w-8 h-8 text-[#C4912A]" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-[#1A3D4A] mb-1" style={{ fontWeight: 600 }}>机密加密中…</p>
                  <p className="text-xs text-[#9B9590]">正在对纹样内容进行加密并生成存证</p>
                </div>
                <div className="w-full">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[#6B6558]">加密进度</span>
                    <span className="text-xs text-[#C4912A]" style={{ fontWeight: 500 }}>{encryptProgress}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: 'rgba(196,145,42,0.12)' }}>
                    <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #C4912A, #E8B84B)', width: `${encryptProgress}%` }} />
                  </div>
                </div>
                <div className="w-full space-y-1.5">
                  {[
                    { label: '内容哈希计算', done: encryptProgress >= 24 },
                    { label: '工艺特征加密', done: encryptProgress >= 57 },
                    { label: '平台节点存证', done: encryptProgress >= 85 },
                    { label: '证书生成', done: encryptProgress >= 100 },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2">
                      <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${item.done ? 'bg-emerald-500' : 'bg-[rgba(26,61,74,0.1)]'}`}>
                        {item.done && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className="text-xs" style={{ color: item.done ? '#16A34A' : '#9B9590' }}>{item.label}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 4: Done - certificate */}
            {step === 'done' && (
              <motion.div key="done" initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} className="space-y-4">
                <div className="text-center py-4">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
                    style={{ background: 'rgba(22,163,74,0.1)' }}>
                    <ShieldCheck className="w-8 h-8 text-emerald-600" />
                  </div>
                  <p className="text-[#1A3D4A]" style={{ fontWeight: 700, fontSize: 16 }}>确权成功！</p>
                  <p className="text-xs text-[#6B6558] mt-1">证书已生成，哈希值已安全存证于鋆寰科技非遗智作平台</p>
                </div>
                <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid rgba(196,145,42,0.3)' }}>
                  <div className="px-4 py-3 text-center" style={{ background: 'linear-gradient(135deg, #0D2535, #1A3D4A)' }}>
                    <p className="text-[#C4912A] tracking-widest" style={{ fontWeight: 700, letterSpacing: '0.18em', fontSize: 12 }}>纹 样 确 权 证 书</p>
                  </div>
                  <div className="px-4 py-3 space-y-2" style={{ background: 'linear-gradient(145deg, #FEFCF5, #F9F3E4)' }}>
                    {[
                      { label: '证书编号', value: certNo, highlight: true },
                      { label: '纹样名称', value: pattern.title },
                      { label: '品类',    value: pattern.category ?? '—' },
                      { label: '设计师',  value: userName },
                      { label: '确权时间', value: certIssuedAt || nowStr() },
                    ].map(row => (
                      <div key={row.label} className="flex items-center justify-between py-1.5"
                        style={{ borderBottom: '1px solid rgba(196,145,42,0.12)' }}>
                        <span className="text-[10px] text-[#9B9590]">{row.label}</span>
                        <span className="text-[11px] font-mono" style={{ color: row.highlight ? '#C4912A' : '#1A3D4A', fontWeight: row.highlight ? 700 : 500 }}>
                          {row.value}
                        </span>
                      </div>
                    ))}
                    <div className="pt-1">
                      <p className="text-[10px] text-[#9B9590] text-center">南京鋆寰科技有限公司 · 机密加密</p>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2 text-[10px] text-[#6B6558]">
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(196,145,42,0.06)', border: '1px solid rgba(196,145,42,0.15)' }}>
                    <p className="text-[#C4912A]" style={{ fontWeight: 600 }}>可见水印</p>
                    <p className="mt-0.5">{userName}</p>
                  </div>
                  <div className="p-2 rounded-lg" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.08)' }}>
                    <p className="text-[#1A3D4A]" style={{ fontWeight: 600 }}>不可见水印</p>
                    <p className="mt-0.5">{certNo}·鋆寰科技</p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        {step !== 'encrypting' && (
          <div className="px-5 py-4 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(26,61,74,0.06)' }}>
            {step === 'info' && (
              <>
                <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6558]"
                  style={{ border: '1px solid rgba(26,61,74,0.12)' }}>取消</button>
                <button onClick={() => setStep('craft')}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
                  下一步：录入工艺特征
                </button>
              </>
            )}
            {step === 'craft' && (
              <>
                <button onClick={() => setStep('info')} className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6558]"
                  style={{ border: '1px solid rgba(26,61,74,0.12)' }}>上一步</button>
                <button onClick={startEncrypt}
                  disabled={!craftValid}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white transition-opacity"
                  style={{ background: craftValid ? 'linear-gradient(135deg, #C4912A, #A87920)' : 'rgba(196,145,42,0.3)', cursor: craftValid ? 'pointer' : 'default' }}>
                  开始加密确权
                </button>
              </>
            )}
            {step === 'done' && (
              <button
                onClick={() => {
                  if (confirmedPattern) {
                    onViewCertificate(confirmedPattern);
                    return;
                  }
                  onClose();
                }}
                className="w-full py-2.5 rounded-xl text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}>
                完成，查看证书
              </button>
            )}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

type UploadPatternDraft = {
  title: string;
  desc: string;
  tags: string[];
  category: string;
  style: string;
  material: string;
  colorTone: string;
  coverFile: File;
  certFile?: File;
};

/** Upload modal — all fields required except tags; "其他" expansions; smart submit button */
function UploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: (draft: UploadPatternDraft) => Promise<void> | void }) {
  const [form, setForm] = useState({
    title: '', desc: '', category: '', style: '', material: '', colorTone: '', tags: '',
    categoryCustom: '', styleCustom: '', materialCustom: '', colorToneCustom: '',
  });
  const [imageUrl, setImageUrl] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [hasCopyrightCert, setHasCopyrightCert] = useState<'no' | 'yes'>('no');
  const [copyrightCertImageUrl, setCopyrightCertImageUrl] = useState('');
  const [copyrightCertFile, setCopyrightCertFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileRef = useRef<HTMLInputElement>(null);
  const certFileRef = useRef<HTMLInputElement>(null);

  // Resolve "其他" → custom values
  const resolvedCategory  = form.category  === '其他' ? form.categoryCustom.trim()  : form.category;
  const resolvedStyle     = form.style     === '其他' ? form.styleCustom.trim()     : form.style;
  const resolvedMaterial  = form.material  === '其他' ? form.materialCustom.trim()  : form.material;
  const resolvedColorTone = form.colorTone === '其他' ? form.colorToneCustom.trim() : form.colorTone;

  // Issue 17: smart button — all required fields have values (tags now required too)
  const canSubmit = !!(
    imageUrl &&
    form.title.trim() &&
    form.desc.trim() &&
    resolvedCategory &&
    resolvedStyle &&
    resolvedMaterial &&
    resolvedColorTone &&
    form.tags.trim()
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = '请输入纹样名称';
    if (!form.desc.trim())  e.desc  = '请填写图案描述';
    if (!imageUrl) e.image = '请上传纹样图片';
    if (!resolvedCategory)  e.category  = '请选择或填写品类';
    if (!resolvedStyle)     e.style     = '请选择或填写风格';
    if (!resolvedMaterial)  e.material  = '请选择或填写材质';
    if (!resolvedColorTone) e.colorTone = '请选择或填写色彩基调';
    if (!form.tags.trim()) e.tags = '请填写主要元素标签';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('请选择图片文件'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('图片不能超过 5MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setImageFile(file);
      setImageUrl(ev.target?.result as string);
      setErrors(p => ({ ...p, image: '' }));
    };
    reader.readAsDataURL(file);
  };

  const handleCertFile = (file: File) => {
    if (!file.type.startsWith('image/')) { toast.error('请选择图片文件'); return; }
    if (file.size > 10 * 1024 * 1024) { toast.error('图片不能超过 10MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      setCopyrightCertFile(file);
      setCopyrightCertImageUrl(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!validate()) return;
    if (!imageFile) {
      toast.error('请先上传纹样图片');
      return;
    }

    setSubmitting(true);
    try {
      await onUploaded({
        title: form.title.trim(),
        desc: form.desc.trim(),
        tags: form.tags.split(/[,，]/).map(t => t.trim()).filter(Boolean),
        category: resolvedCategory,
        style: resolvedStyle,
        material: resolvedMaterial,
        colorTone: resolvedColorTone,
        coverFile: imageFile,
        certFile: hasCopyrightCert === 'yes' ? (copyrightCertFile || undefined) : undefined,
      });
    } finally {
      setSubmitting(false);
    }
  };

  // Reusable "其他" select+input field
  const SelectWithOther = ({ label, fieldKey, customKey, options, placeholder, required = false }:
    { label: string; fieldKey: keyof typeof form; customKey: keyof typeof form; options: string[]; placeholder: string; required?: boolean }) => (
    <div>
      <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="space-y-1.5">
        <div className="relative">
          <select value={form[fieldKey]}
            onChange={e => { setForm(p => ({ ...p, [fieldKey]: e.target.value, [customKey]: '' })); setErrors(p => ({ ...p, [fieldKey]: '' })); }}
            className="w-full text-sm border rounded-xl px-3 py-2 outline-none appearance-none bg-white text-[#1A3D4A]"
            style={{ border: (errors[fieldKey as string]) ? '1.5px solid #DC2626' : '1.5px solid rgba(26,61,74,0.12)' }}>
            <option value="">{placeholder}</option>
            {options.map(o => <option key={o} value={o}>{o}</option>)}
          </select>
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B9590] pointer-events-none" />
        </div>
        {form[fieldKey] === '其他' && (
          <input value={form[customKey]}
            onChange={e => { setForm(p => ({ ...p, [customKey]: e.target.value })); setErrors(p => ({ ...p, [fieldKey]: '' })); }}
            placeholder={`请填写${label}…`}
            className="w-full text-sm border rounded-xl px-3 py-2 outline-none focus:border-[#C4912A] text-[#1A3D4A] bg-white"
            style={{ border: '1.5px solid rgba(196,145,42,0.35)' }}
            autoFocus />
        )}
      </div>
      {errors[fieldKey as string] && <p className="text-xs text-red-500 mt-1">{errors[fieldKey as string]}</p>}
    </div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden"
        style={{ border: '1px solid rgba(26,61,74,0.1)', maxHeight: '90vh' }}
        onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background: 'rgba(26,61,74,0.04)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          <div className="flex items-center gap-2">
            <FolderUp className="w-5 h-5 text-[#1A3D4A]" />
            <span className="text-[#1A3D4A]" style={{ fontWeight: 600 }}>上传本地纹样</span>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-[#6B6558]" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-3" style={{ scrollbarWidth: 'thin' }}>
          {/* Image upload */}
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1.5 block" style={{ fontWeight: 500 }}>
              纹样图片 <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
              className="w-full rounded-2xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
              style={{
                border: errors.image ? '2px dashed #DC2626' : '2px dashed rgba(26,61,74,0.18)',
                background: imageUrl ? 'transparent' : 'rgba(26,61,74,0.02)',
                minHeight: 140,
              }}>
              {imageUrl ? (
                <div className="relative w-full">
                  <img src={imageUrl} alt="preview" className="w-full h-44 object-cover" />
                  <button onClick={e => { e.stopPropagation(); setImageUrl(''); setImageFile(null); }}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/50 flex items-center justify-center">
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : (
                <div className="py-8 flex flex-col items-center gap-2">
                  <ImagePlus className="w-8 h-8 text-[#9B9590]" />
                  <p className="text-xs text-[#6B6558]">点击上传 或 拖拽图片到此处</p>
                  <p className="text-[10px] text-[#9B9590]">JPG / PNG / WEBP，≤ 5MB</p>
                </div>
              )}
            </div>
            <input ref={fileRef} type="file" accept="image/*" className="hidden"
              onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
            {errors.image && <p className="text-xs text-red-500 mt-1">{errors.image}</p>}
          </div>

          {/* 纹样名称 — required */}
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>
              纹样名称 <span className="text-red-500">*</span>
            </label>
            <input value={form.title}
              onChange={e => { setForm(p => ({ ...p, title: e.target.value })); if (errors.title) setErrors(p => ({ ...p, title: '' })); }}
              placeholder="如：折枝牡丹·春日款"
              className="w-full text-sm border rounded-xl px-3 py-2 outline-none focus:border-[#C4912A] text-[#1A3D4A] bg-white"
              style={{ border: errors.title ? '1.5px solid #DC2626' : '1.5px solid rgba(26,61,74,0.12)' }} />
            {errors.title && <p className="text-xs text-red-500 mt-1">{errors.title}</p>}
          </div>

          {/* 图案描述 — required (Issues 11, 16) */}
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>
              图案描述 <span className="text-red-500">*</span>
            </label>
            <textarea value={form.desc}
              onChange={e => { setForm(p => ({ ...p, desc: e.target.value })); if (errors.desc) setErrors(p => ({ ...p, desc: '' })); }}
              placeholder="简要描述纹样的来源、特色和适用场景…"
              rows={2}
              className="w-full text-sm border rounded-xl px-3 py-2 outline-none focus:border-[#C4912A] text-[#1A3D4A] bg-white resize-none"
              style={{ border: errors.desc ? '1.5px solid #DC2626' : '1.5px solid rgba(26,61,74,0.12)' }} />
            {errors.desc && <p className="text-xs text-red-500 mt-1">{errors.desc}</p>}
          </div>

          {/* 品类 & 风格 (Issues 12, 13) */}
          <div className="grid grid-cols-2 gap-2">
            <SelectWithOther label="品类" fieldKey="category" customKey="categoryCustom"
              options={CATEGORIES} placeholder="选择品类" required />
            <SelectWithOther label="风格" fieldKey="style" customKey="styleCustom"
              options={STYLES} placeholder="选择风格" required />
          </div>
          {(errors.category || errors.style) && (
            <div className="grid grid-cols-2 gap-2 -mt-1">
              <div>{errors.category && <p className="text-xs text-red-500">{errors.category}</p>}</div>
              <div>{errors.style && <p className="text-xs text-red-500">{errors.style}</p>}</div>
            </div>
          )}

          {/* 材质 & 色彩基调 (Issues 14, 15) */}
          <div className="grid grid-cols-2 gap-2">
            <SelectWithOther label="材质" fieldKey="material" customKey="materialCustom"
              options={MATERIALS} placeholder="选择材质" required />
            <SelectWithOther label="色彩基调" fieldKey="colorTone" customKey="colorToneCustom"
              options={COLOR_TONES} placeholder="选择色调" required />
          </div>
          {(errors.material || errors.colorTone) && (
            <div className="grid grid-cols-2 gap-2 -mt-1">
              <div>{errors.material && <p className="text-xs text-red-500">{errors.material}</p>}</div>
              <div>{errors.colorTone && <p className="text-xs text-red-500">{errors.colorTone}</p>}</div>
            </div>
          )}

          {/* 元素标签 — required */}
          <div>
            <label className="text-xs text-[#1A3D4A] mb-1 block" style={{ fontWeight: 500 }}>
              主要元素标签 <span className="text-[#9B9590]">（用逗号分隔）</span><span className="text-red-500 ml-0.5">*</span>
            </label>
            <input value={form.tags} onChange={e => setForm(p => ({ ...p, tags: e.target.value }))}
              placeholder="如：云纹, 如意纹, 金线"
              className="w-full text-sm border rounded-xl px-3 py-2 outline-none focus:border-[#C4912A] text-[#1A3D4A] bg-white"
              style={{ border: `1.5px solid ${errors.tags ? '#DC2626' : 'rgba(26,61,74,0.12)'}` }} />
            {errors.tags && <p className="text-[10px] text-red-500 mt-0.5">{errors.tags}</p>}
          </div>

          {/* ── 是否已有版权证书 ── */}
          <div className="rounded-2xl overflow-hidden" style={{ border: '1.5px solid rgba(26,61,74,0.1)' }}>
            <div className="px-3.5 py-2.5 flex items-center gap-2" style={{ background: 'rgba(26,61,74,0.04)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
              <Award className="w-3.5 h-3.5 text-[#C4912A]" />
              <span className="text-xs text-[#1A3D4A]" style={{ fontWeight: 600 }}>是否已有国家版权局颁发的版权证书</span>
            </div>
            <div className="px-3.5 py-3 space-y-2">
              {/* Radio 选项 */}
              <div className="flex gap-4">
                {(['no', 'yes'] as const).map(val => (
                  <button key={val} onClick={() => { setHasCopyrightCert(val); if (val === 'no') { setCopyrightCertImageUrl(''); setCopyrightCertFile(null); } }}
                    className="flex items-center gap-2 py-1.5 px-3 rounded-xl transition-all"
                    style={{
                      border: hasCopyrightCert === val ? '1.5px solid #1A3D4A' : '1.5px solid rgba(26,61,74,0.12)',
                      background: hasCopyrightCert === val ? 'rgba(26,61,74,0.06)' : 'white',
                    }}>
                    <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ border: '1.5px solid ' + (hasCopyrightCert === val ? '#1A3D4A' : 'rgba(26,61,74,0.3)') }}>
                      {hasCopyrightCert === val && <div className="w-2 h-2 rounded-full" style={{ background: '#1A3D4A' }} />}
                    </div>
                    <span className="text-xs text-[#1A3D4A]">{val === 'no' ? '否' : '是，我已有版权证书'}</span>
                  </button>
                ))}
              </div>
              {/* 展示说明 */}
              {hasCopyrightCert === 'no' && (
                <p className="text-[10px] text-[#9B9590] leading-relaxed">
                  如尚未进行版权认证，可在完成纹样确权后，前往「我的纹库」申请版权认证服务（¥300/件）。
                </p>
              )}
              {/* 已有证书：上传区域 */}
              {hasCopyrightCert === 'yes' && (
                <div className="space-y-2">
                  <p className="text-[10px] text-[#6B6558]">请上传国家版权局颁发的作品著作权登记证书图片（JPG/PNG/PDF截图，≤ 10MB）</p>
                  <div
                    onClick={() => certFileRef.current?.click()}
                    onDragOver={e => e.preventDefault()}
                    onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleCertFile(f); }}
                    className="w-full rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden"
                    style={{ border: '2px dashed rgba(196,145,42,0.4)', background: copyrightCertImageUrl ? 'transparent' : 'rgba(196,145,42,0.03)', minHeight: 90 }}>
                    {copyrightCertImageUrl ? (
                      <div className="relative w-full">
                        <img src={copyrightCertImageUrl} alt="版权证书预览" className="w-full max-h-40 object-contain" />
                        <button onClick={e => { e.stopPropagation(); setCopyrightCertImageUrl(''); setCopyrightCertFile(null); }}
                          className="absolute top-2 right-2 w-6 h-6 rounded-full bg-black/50 flex items-center justify-center">
                          <X className="w-3 h-3 text-white" />
                        </button>
                        <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-0.5 rounded-full"
                          style={{ background: 'rgba(22,163,74,0.9)' }}>
                          <Check className="w-2.5 h-2.5 text-white" />
                          <span className="text-[10px] text-white">证书已上传</span>
                        </div>
                      </div>
                    ) : (
                      <div className="py-5 flex flex-col items-center gap-1.5">
                        <Award className="w-6 h-6 text-[#C4912A]" style={{ opacity: 0.6 }} />
                        <p className="text-[11px] text-[#6B6558]">点击上传 或 拖拽版权证书图片</p>
                      </div>
                    )}
                  </div>
                  <input ref={certFileRef} type="file" accept="image/*" className="hidden"
                    onChange={e => { const f = e.target.files?.[0]; if (f) handleCertFile(f); }} />
                  {copyrightCertImageUrl && (
                    <div className="flex items-start gap-1.5 p-2.5 rounded-xl"
                      style={{ background: 'rgba(22,163,74,0.06)', border: '1px solid rgba(22,163,74,0.15)' }}>
                      <Check className="w-3 h-3 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <p className="text-[10px] text-emerald-700 leading-relaxed">
                        证书上传成功！保存后该纹样将直接标记为「版权已认证」状态，并在纹样卡片上显示版权证书查看入口。
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Required fields hint */}
          {!canSubmit && (
            <p className="text-[10px] text-[#C4A88A] text-center">请填写所有带 <span className="text-red-400">*</span> 的必填项后方可保存</p>
          )}
        </div>

        <div className="px-5 pb-5 pt-3 flex gap-2 flex-shrink-0" style={{ borderTop: '1px solid rgba(26,61,74,0.06)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6558]"
            style={{ border: '1px solid rgba(26,61,74,0.12)' }}>取消</button>
          {/* Issue 17: button grayed out unless all required filled */}
          <button onClick={() => { void handleSave(); }}
            disabled={!canSubmit || submitting}
            className="flex-1 py-2.5 rounded-xl text-sm text-white transition-all"
            style={{
              background: canSubmit && !submitting ? 'linear-gradient(135deg, #1A3D4A, #2A5568)' : 'rgba(26,61,74,0.25)',
              cursor: canSubmit && !submitting ? 'pointer' : 'default',
            }}>
            {submitting ? '保存中...' : '保存到我的纹样'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

/** Pattern card */
function PatternCard({ pattern, userName, onZoom, onRights, onCert, onPublish, onUnpublish, onCopyright, onCancelCopyright, onCopyrightProgress, onDelete }: {
  pattern: MyPattern;
  userName: string;
  onZoom: () => void;
  onRights: () => void;
  onCert: () => void;
  onPublish: () => void;
  onUnpublish: () => void;
  onCopyright: () => void;
  onCancelCopyright: () => void;
  onCopyrightProgress: () => void;
  onDelete: () => void;
}) {
  const [showDelete, setShowDelete] = useState(false);
  const src = SOURCE_CONFIG[pattern.source];
  const rights = RIGHTS_CONFIG[pattern.rightsStatus];
  const isDone = pattern.rightsStatus === 'done';
  const canDelete = pattern.canDelete ?? (!pattern.published && pattern.copyrightStatus !== 'applied');
  const canConfirmRights = pattern.canConfirmRights ?? (!isDone && pattern.source !== 'licensed');
  const canPublish = pattern.canPublish ?? (isDone && !pattern.published && pattern.source !== 'licensed');
  const canApplyCopyright = pattern.canApplyCopyright ?? (isDone && pattern.copyrightStatus === 'none' && pattern.source !== 'licensed');
  const canUnpublish = pattern.canUnpublish ?? pattern.published;

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-2xl overflow-hidden flex flex-col group"
      style={{ border: '1px solid rgba(26,61,74,0.08)', boxShadow: '0 2px 12px rgba(26,61,74,0.06)' }}>
      {/* Image */}
      <div className="relative overflow-hidden" style={{ paddingBottom: '66%' }}>
        <ProtectedImage src={pattern.imageUrl} alt={pattern.title}
          className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {/* Overlay on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
          style={{ background: 'rgba(0,0,0,0.15)' }} />
        {/* Zoom button — bottom-right corner */}
        <button
          onClick={e => { e.stopPropagation(); onZoom(); }}
          className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}
          title="放大查看">
          <ZoomIn className="w-3.5 h-3.5 text-[#1A3D4A]" />
        </button>
        {/* Source badge */}
        <div className="absolute top-2 left-2">
          <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px]"
            style={{ background: src?.bg, color: src?.color, fontWeight: 500 }}>
            {src?.icon}{src?.label}
          </span>
        </div>
        {/* Published badge */}
        {pattern.published && (
          <div className="absolute bottom-2 left-2 space-y-1">
            <span className="flex items-center gap-1 px-2 py-1 rounded-full text-[10px]"
              style={{ background: 'rgba(22,163,74,0.88)', color: 'white', fontWeight: 500 }}>
              <Globe2 className="w-2.5 h-2.5" />已上架 · 起售¥{pattern.price}
            </span>
          </div>
        )}

      </div>

      {/* Content */}
      <div className="p-3 flex-1 flex flex-col">
        <h3 className="text-sm text-[#1A3D4A] mb-1 line-clamp-1" style={{ fontWeight: 600 }}>{pattern.title}</h3>
        <p className="text-[10px] text-[#9B9590] mb-2">
          {[pattern.category, pattern.style].filter(Boolean).join(' · ')}
          {pattern.material && ` · ${pattern.material}`}
        </p>
        {/* Issue 13: Remove "#" from tags */}
        {pattern.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {pattern.tags.slice(0, 3).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 rounded-md text-[10px]"
                style={{ background: 'rgba(196,145,42,0.08)', color: '#C4912A' }}>
                {tag}
              </span>
            ))}
            {pattern.tags.length > 3 && (
              <span className="px-1.5 py-0.5 rounded-md text-[10px]" style={{ background: 'rgba(26,61,74,0.05)', color: '#9B9590' }}>
                +{pattern.tags.length - 3}
              </span>
            )}
          </div>
        )}
        {pattern.colorTone && (
          <p className="text-[10px] text-[#6B6558] mb-1">🎨 {pattern.colorTone}</p>
        )}
        <p className="text-[10px] text-[#C4A88A] mt-auto">{pattern.savedAt.slice(0, 10)}</p>
      </div>

      {/* Consistent action buttons */}
      <div className="px-3 pb-3 space-y-1.5">
        {/* 待确权: single full-width button */}
        {canConfirmRights && (
          <button onClick={onRights}
            className="w-full flex items-center justify-center gap-1.5 py-2 rounded-xl text-[11px] text-white"
            style={{ background: 'linear-gradient(135deg, #C4912A, #A87920)' }}>
            <ShieldCheck className="w-3.5 h-3.5" />立即确权
          </button>
        )}

        {/* 已确权 + 未发布: 3 equal buttons (Issue 1: copyright always accessible) */}
        {isDone && !pattern.published && (
          <div className="grid grid-cols-3 gap-1">
            <button onClick={onCert}
              className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] transition-all"
              style={{ background: 'rgba(22,163,74,0.07)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>
              <Eye className="w-3.5 h-3.5" /><span>确权证书</span>
            </button>
            {canPublish ? (
              <button onClick={onPublish}
                className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] transition-all"
                style={{ background: 'rgba(26,61,74,0.06)', color: '#1A3D4A', border: '1px solid rgba(26,61,74,0.12)' }}>
                <Globe className="w-3.5 h-3.5" /><span>纹样发布</span>
              </button>
            ) : (
              <div
                className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px]"
                style={{ background: 'rgba(26,61,74,0.03)', color: '#9B9590', border: '1px solid rgba(26,61,74,0.08)' }}>
                <Globe className="w-3.5 h-3.5" /><span>不可发布</span>
              </div>
            )}
            {/* Issue 4: copyright "认证中" is clickable to see progress + cancel */}
            {pattern.copyrightStatus === 'none' && canApplyCopyright && (
              <button onClick={onCopyright}
                className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] transition-all"
                style={{ background: 'rgba(26,61,74,0.04)', color: '#6B6558', border: '1px solid rgba(26,61,74,0.1)' }}>
                <Award className="w-3.5 h-3.5" /><span>版权认证</span>
              </button>
            )}
            {pattern.copyrightStatus === 'none' && !canApplyCopyright && (
              <div
                className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px]"
                style={{ background: 'rgba(26,61,74,0.03)', color: '#9B9590', border: '1px solid rgba(26,61,74,0.08)' }}>
                <Award className="w-3.5 h-3.5" /><span>不可申证</span>
              </div>
            )}
            {pattern.copyrightStatus === 'applied' && (
              <button onClick={onCopyrightProgress}
                className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] transition-all"
                style={{ background: 'rgba(196,145,42,0.08)', color: '#C4912A', border: '1px solid rgba(196,145,42,0.2)' }}>
                <Award className="w-3.5 h-3.5" /><span>认证进度</span>
              </button>
            )}
            {pattern.copyrightStatus === 'done' && (
              <button onClick={onCopyrightProgress}
                className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] transition-all hover:scale-105"
                style={{ background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Award className="w-3.5 h-3.5" /><span>版权证书</span>
              </button>
            )}
          </div>
        )}

        {/* 已发布: 3 equal buttons */}
        {isDone && pattern.published && (
          <div className="grid grid-cols-3 gap-1">
            <button onClick={onCert}
              className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] transition-all"
              style={{ background: 'rgba(22,163,74,0.07)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.2)' }}>
              <Eye className="w-3.5 h-3.5" /><span>确权证书</span>
            </button>
            <button onClick={onUnpublish}
              disabled={!canUnpublish}
              className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] transition-all"
              style={{
                background: canUnpublish ? 'rgba(239,68,68,0.06)' : 'rgba(26,61,74,0.03)',
                color: canUnpublish ? '#DC2626' : '#9B9590',
                border: canUnpublish ? '1px solid rgba(239,68,68,0.15)' : '1px solid rgba(26,61,74,0.08)',
              }}>
              <Globe2 className="w-3.5 h-3.5" /><span>取消发布</span>
            </button>
            {pattern.copyrightStatus === 'none' && canApplyCopyright && (
              <button onClick={onCopyright}
                className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] transition-all"
                style={{ background: 'rgba(26,61,74,0.04)', color: '#6B6558', border: '1px solid rgba(26,61,74,0.1)' }}>
                <Award className="w-3.5 h-3.5" /><span>版权认证</span>
              </button>
            )}
            {pattern.copyrightStatus === 'none' && !canApplyCopyright && (
              <div
                className="flex flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-[10px]"
                style={{ background: 'rgba(26,61,74,0.03)', color: '#9B9590', border: '1px solid rgba(26,61,74,0.08)' }}>
                <Award className="w-3.5 h-3.5" /><span>不可申证</span>
              </div>
            )}
            {pattern.copyrightStatus === 'applied' && (
              <button onClick={onCopyrightProgress}
                className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] transition-all"
                style={{ background: 'rgba(196,145,42,0.08)', color: '#C4912A', border: '1px solid rgba(196,145,42,0.2)' }}>
                <Award className="w-3.5 h-3.5" /><span>认证进度</span>
              </button>
            )}
            {pattern.copyrightStatus === 'done' && (
              <button onClick={onCopyrightProgress}
                className="flex flex-col items-center gap-0.5 py-2 rounded-xl text-[10px] transition-all hover:scale-105"
                style={{ background: 'rgba(16,185,129,0.08)', color: '#059669', border: '1px solid rgba(16,185,129,0.25)' }}>
                <Award className="w-3.5 h-3.5" /><span>版权证书</span>
              </button>
            )}
          </div>
        )}

        {/* Delete — only if canDelete (not published AND not copyright-in-progress) */}
        {canDelete && !showDelete && (
          <button onClick={() => setShowDelete(true)}
            className="w-full flex items-center justify-center gap-1 py-1 rounded-lg text-[10px] text-[#C4A88A] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 className="w-3 h-3" />删除纹样
          </button>
        )}
        {canDelete && showDelete && (
          <div className="p-2 rounded-xl" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>
            <p className="text-[10px] text-red-600 mb-1.5 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />确认删除此纹样？
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowDelete(false)} className="flex-1 py-1 rounded-lg text-[11px] text-[#6B6558]"
                style={{ border: '1px solid rgba(26,61,74,0.1)' }}>取消</button>
              <button onClick={onDelete} className="flex-1 py-1 rounded-lg text-[11px] text-white"
                style={{ background: '#DC2626' }}>删除</button>
            </div>
          </div>
        )}
        {!canDelete && isDone && (
          <p className="text-center text-[10px] text-[#C4A88A] py-0.5">
            {pattern.published ? '取消发布后方可删除' : '撤销版权申请后方可删除'}
          </p>
        )}
        {!canConfirmRights && !isDone && (
          <p className="text-center text-[10px] text-[#9B9590] py-0.5">该纹样来源不支持再次确权</p>
        )}
      </div>
    </motion.div>
  );
}

/** Copyright Progress / Certificate Modal */
function CopyrightProgressModal({ pattern, onClose, onCancel, onSync }: {
  pattern: MyPattern;
  onClose: () => void;
  onCancel: () => void;
  onSync: () => void;
}) {
  const [confirmCancel, setConfirmCancel] = useState(false);
  const isDone = pattern.copyrightStatus === 'done';

  // Simulate progress: day 3 of ~10
  const steps = [
    { label: '申请已提交', sub: '材料已上传至版权局平台', done: true, date: pattern.certIssuedAt?.slice(0,10) ?? '2026-04-07' },
    { label: '材料审核中', sub: '预计 1-3 个工作日', done: isDone, active: !isDone, date: isDone ? pattern.copyrightDoneAt?.slice(0,10) ?? '2026-04-08' : '预计 2026-04-10' },
    { label: '版权局处理', sub: '预计 5-10 个工作日', done: isDone, date: isDone ? pattern.copyrightDoneAt?.slice(0,10) ?? '2026-04-10' : '待启动' },
    { label: '证书颁发', sub: '邮件 + 平台通知', done: isDone, date: isDone ? pattern.copyrightDoneAt?.slice(0,10) ?? '2026-04-05' : '待颁发' },
  ];

  // 版权已认证：展示官方登记证书样式（严格按照国家版权局样本还原）
  if (isDone) {
    const seedStr = pattern.certNo?.replace(/\D/g, '') ?? pattern.id.replace(/\D/g, '') ?? '1234';
    const seedNum = parseInt(seedStr, 10) % 10000000;
    const regNo = pattern.copyrightCertNo ?? `国作登字-2026-F-${String(seedNum + 10000000).slice(-8)}`;
    const authorName   = '张设计师';
    const creationDate = pattern.createdAt?.slice(0, 10) ?? pattern.savedAt.slice(0, 10);
    const publishDate  = pattern.publishedAt?.slice(0, 10) ?? pattern.savedAt.slice(0, 10);
    const regDate      = pattern.copyrightDoneAt?.slice(0, 10) ?? '2026-04-05';
    const W = 500, H = 666;
    const certBg   = '#FFFFE6'; // CMYK(C=0,M=0,Y=10,K=0)
    const certGold = '#B3994D'; // CMYK(C=30,M=40,Y=70,K=0)
    const sFont = "'Noto Serif SC', STSong, SimSun, '宋体', serif";

    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] flex items-center justify-center overflow-y-auto py-6"
        style={{ background: 'rgba(0,0,0,0.72)', backdropFilter: 'blur(6px)' }}
        onClick={onClose}>
        <div className="relative my-auto" onClick={e => e.stopPropagation()}>
          {/* 关闭按钮 */}
          <button onClick={onClose}
            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg z-20">
            <X className="w-4 h-4 text-[#1A3D4A]" />
          </button>

          {/* 证书主体 */}
          <motion.div
            initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
            style={{ width: W, height: H, background: certBg, position: 'relative', overflow: 'hidden',
              boxShadow: '0 32px 100px rgba(0,0,0,0.55)' }}>

            {/* ── SVG 装饰边框 ── */}
            <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}
              style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
              <defs>
                <g id="lib-cert-cf">
                  <ellipse cx="0" cy="-26" rx="5" ry="7.5" fill={certGold}/>
                  <ellipse cx="0" cy="26" rx="5" ry="7.5" fill={certGold}/>
                  <ellipse cx="-26" cy="0" rx="7.5" ry="5" fill={certGold}/>
                  <ellipse cx="26" cy="0" rx="7.5" ry="5" fill={certGold}/>
                  <ellipse cx="-18" cy="-18" rx="5" ry="7.5" fill={certGold} transform="rotate(-45,-18,-18)"/>
                  <ellipse cx="18" cy="-18" rx="5" ry="7.5" fill={certGold} transform="rotate(45,18,-18)"/>
                  <ellipse cx="-18" cy="18" rx="5" ry="7.5" fill={certGold} transform="rotate(45,-18,18)"/>
                  <ellipse cx="18" cy="18" rx="5" ry="7.5" fill={certGold} transform="rotate(-45,18,18)"/>
                  <circle cx="0" cy="0" r="15" fill={certGold}/>
                  <circle cx="0" cy="0" r="11" fill={certBg}/>
                  <ellipse cx="0" cy="-8" rx="3" ry="4.5" fill={certGold}/>
                  <ellipse cx="0" cy="8" rx="3" ry="4.5" fill={certGold}/>
                  <ellipse cx="-8" cy="0" rx="4.5" ry="3" fill={certGold}/>
                  <ellipse cx="8" cy="0" rx="4.5" ry="3" fill={certGold}/>
                  <circle cx="0" cy="0" r="5.5" fill={certGold}/>
                  <circle cx="0" cy="0" r="3" fill={certBg}/>
                  <circle cx="0" cy="0" r="1.2" fill={certGold}/>
                  <path d="M-6,-24 C-12,-20 -20,-12 -24,-6" fill="none" stroke={certGold} strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M6,-24 C12,-20 20,-12 24,-6" fill="none" stroke={certGold} strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M-6,24 C-12,20 -20,12 -24,6" fill="none" stroke={certGold} strokeWidth="1.3" strokeLinecap="round"/>
                  <path d="M6,24 C12,20 20,12 24,6" fill="none" stroke={certGold} strokeWidth="1.3" strokeLinecap="round"/>
                </g>
              </defs>
              {/* 角落背景（纯米黄色，绝对不透出斑点） */}
              <rect x="4" y="4" width="72" height="72" fill={certBg}/>
              <rect x={W-76} y="4" width="72" height="72" fill={certBg}/>
              <rect x="4" y={H-76} width="72" height="72" fill={certBg}/>
              <rect x={W-76} y={H-76} width="72" height="72" fill={certBg}/>
              {/* 四角角花 */}
              <use href="#lib-cert-cf" transform="translate(36,36)"/>
              <use href="#lib-cert-cf" transform={`translate(${W-36},36)`}/>
              <use href="#lib-cert-cf" transform={`translate(36,${H-36})`}/>
              <use href="#lib-cert-cf" transform={`translate(${W-36},${H-36})`}/>
              {/* 四道同心线框花边 */}
              <rect x="5" y="5" width={W-10} height={H-10} fill="none" stroke={certGold} strokeWidth="2"/>
              <rect x="12" y="12" width={W-24} height={H-24} fill="none" stroke={certGold} strokeWidth="0.8"/>
              <rect x="24" y="24" width={W-48} height={H-48} fill="none" stroke={certGold} strokeWidth="0.8"/>
              <rect x="34" y="34" width={W-68} height={H-68} fill="none" stroke={certGold} strokeWidth="1.2"/>
            </svg>

            {/* ── 文字内容 ── */}
            <div style={{
              position: 'relative', zIndex: 1, padding: '52px 62px 38px',
              height: H, boxSizing: 'border-box',
              display: 'flex', flexDirection: 'column',
              fontFamily: sFont, color: '#000',
            }}>
              {/* 标题 */}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <h1 style={{ margin: 0, fontSize: 30, fontWeight: 700, letterSpacing: '0.55em', fontFamily: sFont }}>
                  作品登记证书
                </h1>
              </div>

              {/* 横线 */}
              <div style={{ borderBottom: `1px solid ${certGold}`, marginBottom: 18 }}/>

              {/* 登记号 */}
              <div style={{ marginBottom: 18, fontSize: 14, lineHeight: 1.6 }}>
                <span style={{ letterSpacing: '0.3em' }}>登　记　号：</span>
                <span style={{ borderBottom: '1px solid #333', paddingBottom: 1, letterSpacing: '0.05em' }}>
                  {regNo}
                </span>
              </div>

              {/* 虚线分隔 */}
              <div style={{ borderBottom: `1px dashed ${certGold}99`, marginBottom: 18 }}/>

              {/* 双栏字段 */}
              {([
                [{ label: '作品/制品名称', value: pattern.title },
                 { label: '作品类别', value: `美术作品（${pattern.category ?? '非遗纹样'}）` }],
                [{ label: '作　　　者', value: authorName },
                 { label: '著　作　权　人', value: authorName }],
                [{ label: '创作完成日期', value: creationDate },
                 { label: '首次发表/出版/制作日期', value: publishDate }],
              ] as Array<Array<{ label: string; value: string }>>).map((row, ri) => (
                <div key={ri} style={{ display: 'flex', gap: 12, marginBottom: 15, fontSize: 14, lineHeight: 1.7 }}>
                  {row.map((col, ci) => (
                    <div key={ci} style={{ flex: 1 }}>
                      <span>{col.label}：</span>
                      <span style={{ borderBottom: '1px solid #444', paddingBottom: 1 }}>{col.value}</span>
                    </div>
                  ))}
                </div>
              ))}

              {/* 虚线分隔 */}
              <div style={{ borderBottom: `1px dashed ${certGold}99`, marginBottom: 20 }}/>

              {/* 以上事项段落 */}
              <div style={{ fontSize: 14, lineHeight: 2, color: '#000' }}>
                <span style={{ marginLeft: '2em' }}>以上事项，由</span>
                <span style={{
                  display: 'inline-block', borderBottom: '1px solid #333',
                  minWidth: 68, textAlign: 'center', verticalAlign: 'bottom', paddingBottom: 1,
                }}>{authorName}</span>
                <span>申请，经</span>
                <span style={{
                  display: 'inline-block', borderBottom: '1px solid #333',
                  minWidth: 108, textAlign: 'center', verticalAlign: 'bottom', paddingBottom: 1,
                }}>中国版权保护中心</span>
                <span>审核，</span>
                <br/>
                <span>根据《作品自愿登记试行办法》规定，予以登记。</span>
              </div>

              {/* 弹性间距 */}
              <div style={{ flex: 1 }}/>

              {/* 登记日期 + 签章 */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 14 }}>
                <div style={{ fontSize: 14, lineHeight: 1.7 }}>
                  <span>登记日期：</span>
                  <span style={{ borderBottom: '1px solid #333', paddingBottom: 1 }}>{regDate}</span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    <circle cx="35" cy="35" r="32" fill="none" stroke="#CC0000" strokeWidth="2"/>
                    <circle cx="35" cy="35" r="26" fill="none" stroke="#CC0000" strokeWidth="0.8" strokeDasharray="2,2"/>
                    <text x="35" y="21" textAnchor="middle" fontSize="6.5" fill="#CC0000" fontWeight="bold" letterSpacing="1" fontFamily={sFont}>中国版权保护中心</text>
                    <text x="35" y="53" textAnchor="middle" fontSize="6" fill="#CC0000" letterSpacing="0.5" fontFamily={sFont}>作品登记专用章</text>
                    <polygon points="35,27 37.3,34.1 44.8,34.1 38.7,38.5 41.1,45.6 35,41.2 28.9,45.6 31.3,38.5 25.2,34.1 32.7,34.1" fill="#CC0000"/>
                  </svg>
                  <div style={{ fontSize: 12.5, color: '#333', marginTop: 2 }}>登记机构签章</div>
                </div>
              </div>

              {/* 页脚 */}
              <div style={{ textAlign: 'center', paddingTop: 10, borderTop: `1px solid ${certGold}77` }}>
                <p style={{ margin: 0, fontSize: 14, fontWeight: 700, letterSpacing: '0.12em', fontFamily: sFont }}>
                  中华人民共和国国家版权局统一监制
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // 版权认证中：展示进度
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.93, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.93, y: 16 }}
        className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden"
        style={{ border: '1px solid rgba(26,61,74,0.1)' }}
        onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, rgba(26,61,74,0.08), rgba(26,61,74,0.03))' }}>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#C4912A]" />
            <span className="text-[#1A3D4A]" style={{ fontWeight: 600 }}>版权认证进度</span>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-[#9B9590]" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Pattern info */}
          <div className="flex gap-3 items-center p-3 rounded-xl" style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.07)' }}>
            <ProtectedImage src={pattern.imageUrl} alt="" className="w-12 h-12 rounded-xl object-cover flex-shrink-0" />
            <div>
              <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>{pattern.title}</p>
              <p className="text-[10px] text-[#9B9590] mt-0.5">认证单号：{pattern.certNo ?? '—'}</p>
            </div>
          </div>

          {/* Fee info */}
          <div className="flex items-center justify-between px-3 py-2.5 rounded-xl"
            style={{ background: 'rgba(196,145,42,0.06)', border: '1px solid rgba(196,145,42,0.15)' }}>
            <span className="text-[11px] text-[#6B6558]">💰 认证费用已支付</span>
            <span className="text-[11px] text-[#C4912A]" style={{ fontWeight: 600 }}>¥ 300</span>
          </div>

          {/* Progress steps */}
          <div className="space-y-3">
            {steps.map((s, i) => (
              <div key={s.label} className="flex gap-3 items-start">
                <div className="flex flex-col items-center" style={{ width: 24, flexShrink: 0 }}>
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                    style={{ background: s.done ? '#16A34A' : (s as any).active ? 'rgba(196,145,42,0.9)' : 'rgba(26,61,74,0.1)' }}>
                    {s.done ? <Check className="w-3 h-3 text-white" /> :
                      (s as any).active ? <div className="w-2 h-2 rounded-full bg-white animate-pulse" /> :
                      <div className="w-2 h-2 rounded-full" style={{ background: 'rgba(26,61,74,0.2)' }} />}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 mt-1" style={{ minHeight: 20, background: s.done ? '#16A34A' : 'rgba(26,61,74,0.12)' }} />
                  )}
                </div>
                <div className="flex-1 pb-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[11px]" style={{
                      color: s.done ? '#16A34A' : (s as any).active ? '#C4912A' : '#9B9590',
                      fontWeight: (s as any).active || s.done ? 600 : 400,
                    }}>{s.label}</p>
                    <span className="text-[10px] text-[#C4A88A]">{s.date}</span>
                  </div>
                  <p className="text-[10px] text-[#9B9590] mt-0.5">{s.sub}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 rounded-xl text-[10px] text-[#6B6558] leading-relaxed"
            style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.07)' }}>
            认证机构：国家版权局 · 官方数字版权平台<br/>
            认证完成后将以邮件 + 站内通知告知，证书同步至本平台。
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 space-y-2">
          {!confirmCancel ? (
            <div className="flex gap-2">
              <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-[#1A3D4A]"
                style={{ border: '1px solid rgba(26,61,74,0.15)', fontWeight: 500 }}>关闭</button>
              {!isDone && (
                <button onClick={onSync}
                  className="flex-1 py-2.5 rounded-xl text-sm text-white"
                  style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
                  同步版权证书
                </button>
              )}
              <button onClick={() => setConfirmCancel(true)}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#9B9590]"
                style={{ border: '1px solid rgba(26,61,74,0.1)' }}>撤销申请</button>
            </div>
          ) : (
            <div className="p-3 rounded-xl space-y-2" style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.2)' }}>
              <p className="text-[11px] text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />撤销后已支付费用不予退还，确认撤销？
              </p>
              <div className="flex gap-2">
                <button onClick={() => setConfirmCancel(false)} className="flex-1 py-1.5 rounded-lg text-[11px] text-[#6B6558]"
                  style={{ border: '1px solid rgba(26,61,74,0.1)' }}>保留</button>
                <button onClick={onCancel} className="flex-1 py-1.5 rounded-lg text-[11px] text-white"
                  style={{ background: '#DC2626' }}>确认撤销</button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

function SyncCopyrightCertModal({
  pattern,
  onClose,
  onConfirm,
}: {
  pattern: MyPattern;
  onClose: () => void;
  onConfirm: (payload: { certNo?: string; certFile: File }) => Promise<void> | void;
}) {
  const [certNo, setCertNo] = useState(pattern.copyrightCertNo ?? '');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const isImage = file.type.startsWith('image/');
    const isPdf = file.type === 'application/pdf';
    if (!isImage && !isPdf) {
      toast.error('请上传图片或 PDF 证书文件');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('证书文件不能超过 10MB');
      return;
    }
    setCertFile(file);
    setError('');

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
      setPreviewUrl('');
    }

    if (isImage) {
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!certFile) {
      setError('请先上传版权证书文件');
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm({
        certNo: certNo.trim() || undefined,
        certFile,
      });
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[95] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.94, y: 12 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.94, y: 12 }}
        className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ border: '1px solid rgba(26,61,74,0.1)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ background: 'rgba(26,61,74,0.04)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-[#1A3D4A]" />
            <span className="text-[#1A3D4A]" style={{ fontWeight: 600 }}>同步版权证书</span>
          </div>
          <button onClick={onClose}><X className="w-4 h-4 text-[#6B6558]" /></button>
        </div>

        <div className="space-y-4 p-5">
          <div className="rounded-xl p-3" style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.07)' }}>
            <p className="text-xs text-[#1A3D4A]" style={{ fontWeight: 600 }}>{pattern.title}</p>
            <p className="mt-1 text-[11px] text-[#6B6558]">上传国家版权局证书后，系统会将当前纹样状态同步为“版权已认证”。</p>
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#1A3D4A]" style={{ fontWeight: 500 }}>版权证书编号</label>
            <input
              value={certNo}
              onChange={e => setCertNo(e.target.value)}
              placeholder="选填，如：国作登字-2026-F-00000001"
              className="w-full rounded-xl bg-white px-3 py-2 text-sm text-[#1A3D4A] outline-none"
              style={{ border: '1.5px solid rgba(26,61,74,0.12)' }}
            />
          </div>

          <div>
            <label className="mb-1 block text-xs text-[#1A3D4A]" style={{ fontWeight: 500 }}>
              版权证书文件 <span className="text-red-500">*</span>
            </label>
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={e => e.preventDefault()}
              onDrop={e => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file) handleFile(file);
              }}
              className="cursor-pointer overflow-hidden rounded-2xl"
              style={{
                border: `2px dashed ${error ? '#DC2626' : 'rgba(196,145,42,0.35)'}`,
                background: previewUrl || certFile ? 'white' : 'rgba(196,145,42,0.03)',
              }}
            >
              {previewUrl ? (
                <div className="relative">
                  <img src={previewUrl} alt="证书预览" className="max-h-56 w-full object-contain" />
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setCertFile(null);
                      setPreviewUrl('');
                    }}
                    className="absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-full bg-black/50"
                  >
                    <X className="w-3.5 h-3.5 text-white" />
                  </button>
                </div>
              ) : certFile ? (
                <div className="flex items-center justify-between px-4 py-4">
                  <div>
                    <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 500 }}>{certFile.name}</p>
                    <p className="mt-1 text-[10px] text-[#9B9590]">已选择证书文件</p>
                  </div>
                  <button
                    onClick={e => {
                      e.stopPropagation();
                      setCertFile(null);
                    }}
                    className="flex h-7 w-7 items-center justify-center rounded-full bg-[rgba(26,61,74,0.08)]"
                  >
                    <X className="w-3.5 h-3.5 text-[#1A3D4A]" />
                  </button>
                </div>
              ) : (
                <div className="flex min-h-[140px] flex-col items-center justify-center gap-2 py-6">
                  <Award className="w-8 h-8 text-[#C4912A]" />
                  <p className="text-xs text-[#6B6558]">点击上传 或 拖拽证书图片 / PDF 到此处</p>
                  <p className="text-[10px] text-[#9B9590]">JPG / PNG / PDF，≤ 10MB</p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*,application/pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
          </div>
        </div>

        <div className="flex gap-2 px-5 pb-5 pt-1">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl py-2.5 text-sm text-[#6B6558]"
            style={{ border: '1px solid rgba(26,61,74,0.12)' }}
          >
            取消
          </button>
          <button
            onClick={() => { void handleSubmit(); }}
            disabled={!certFile || submitting}
            className="flex-1 rounded-xl py-2.5 text-sm text-white"
            style={{
              background: certFile && !submitting ? 'linear-gradient(135deg, #1A3D4A, #2A5568)' : 'rgba(26,61,74,0.25)',
              cursor: certFile && !submitting ? 'pointer' : 'default',
            }}
          >
            {submitting ? '同步中...' : '确认同步'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type FilterSource = 'all' | 'zhihui' | 'copilot' | 'upload' | 'licensed';
type FilterRights = 'all' | 'none' | 'processing' | 'done' | 'published' | 'copyright' | 'copyrightDone';

export function InspirationLibraryPage() {
  const {
    myPatterns, myPatternsLoading, reloadMyPatterns, clearRedDot,
    isSellerReady, updateLicenseConfig,
  } = useApp();
  const { user } = useAuth();

  const [search, setSearch] = useState('');
  const [filterSource, setFilterSource] = useState<FilterSource>('all');
  const [filterRights, setFilterRights] = useState<FilterRights>('all');
  const [filterCategory, setFilterCategory] = useState('');

  const [lightboxPattern, setLightboxPattern] = useState<MyPattern | null>(null);
  const [rightsPattern, setRightsPattern]     = useState<MyPattern | null>(null);
  const [certPattern, setCertPattern]         = useState<MyPattern | null>(null);
  const [publishPattern, setPublishPattern]   = useState<MyPattern | null>(null);
  const [copyrightPattern, setCopyrightPattern] = useState<MyPattern | null>(null);
  const [copyrightProgressPattern, setCopyrightProgressPattern] = useState<MyPattern | null>(null); // Issue 4/18
  const [syncCopyrightPattern, setSyncCopyrightPattern] = useState<MyPattern | null>(null);
  const [showUpload, setShowUpload]           = useState(false);
  const [sellerCenterOpen, setSellerCenterOpen] = useState(false);

  const userName = user?.displayName || user?.account || '当前用户';

  useEffect(() => {
    clearRedDot('materials');
    void reloadMyPatterns().catch((error: any) => {
      toast.error(error?.message || '加载我的纹样失败');
    });
  }, [clearRedDot, reloadMyPatterns]);

  const filtered = myPatterns.filter(p => {
    if (filterSource !== 'all' && p.source !== filterSource) return false;
    if (filterRights === 'none' && p.rightsStatus !== 'none') return false;
    if (filterRights === 'processing' && p.rightsStatus !== 'processing') return false;
    if (filterRights === 'done' && p.rightsStatus !== 'done') return false;
    if (filterRights === 'published' && !p.published) return false;
    if (filterRights === 'copyright' && p.copyrightStatus !== 'applied') return false;
    if (filterRights === 'copyrightDone' && p.copyrightStatus !== 'done') return false;
    if (filterCategory && p.category !== filterCategory) return false;
    if (search.trim()) {
      const q = search.toLowerCase().replace(/\s/g, '');
      const haystack = [p.title, p.desc, p.category, p.style, p.material, ...p.tags].join(' ').toLowerCase().replace(/\s/g, '');
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  // Stats
  const stats = {
    total: myPatterns.length,
    zhihui: myPatterns.filter(p => p.source === 'zhihui').length,
    copilot: myPatterns.filter(p => p.source === 'copilot').length,
    upload: myPatterns.filter(p => p.source === 'upload').length,
    licensed: myPatterns.filter(p => p.source === 'licensed').length,
    none: myPatterns.filter(p => p.rightsStatus === 'none').length,
    processing: myPatterns.filter(p => p.rightsStatus === 'processing').length,
    done: myPatterns.filter(p => p.rightsStatus === 'done').length,
    published: myPatterns.filter(p => p.published).length,
    copyright: myPatterns.filter(p => p.copyrightStatus === 'applied').length,
    copyrightDone: myPatterns.filter(p => p.copyrightStatus === 'done').length,
  };

  const reloadAndFindPattern = async (patternId: string) => {
    const latestPatterns = await reloadMyPatterns();
    return latestPatterns.find(item => item.id === patternId) || null;
  };

  const parseAdaptProducts = (value: string) =>
    value
      .split(/[\n,，、]/)
      .map(item => item.trim())
      .filter(Boolean);

  const handleUpload = async (draft: UploadPatternDraft) => {
    const coverFileId = await uploadFile(draft.coverFile);
    const certFileId = draft.certFile ? await uploadFile(draft.certFile) : undefined;

    await patternService.createFromUpload({
      title: draft.title,
      description: draft.desc,
      coverFileId,
      category: draft.category,
      style: draft.style,
      material: draft.material,
      colorTone: draft.colorTone,
      tags: draft.tags,
      copyrightCertFileId: certFileId,
    });
    await reloadMyPatterns();
    setShowUpload(false);
    toast.success(`「${draft.title}」已添加到我的纹样`, {
      description: certFileId ? '已检测到版权证书，状态已同步为“版权已认证”' : undefined,
    });
  };

  const handleRightsConfirmed = async (craft: CraftInfo) => {
    if (!rightsPattern) return;
    await patternService.confirmRights(rightsPattern.id, {
      weaveStructure: craft.weaveStructure,
      technique: craft.technique,
      colorLayers: craft.colorLayers,
      repeatSize: craft.repeatSize,
      materialSpec: craft.materialSpec,
      complexity: String(craft.complexity),
      patternDesc: craft.patternDesc,
      innovationPoints: craft.innovationPoints,
      adaptProducts: parseAdaptProducts(craft.adaptProducts),
      heritageSource: craft.heritageSource?.trim() || undefined,
    });
    const updated = await reloadAndFindPattern(rightsPattern.id);
    if (!updated) {
      throw new Error('确权成功，但未能读取最新纹样信息');
    }
    toast.success('确权成功！证书已生成', { description: `证书编号：${updated.certNo ?? '系统已生成'}` });
    return updated;
  };

  const handleRightsCertificateView = (pattern: MyPattern) => {
    setRightsPattern(null);
    setCertPattern(pattern);
  };

  const handlePublishConfirm = async (config: LicenseConfig, price: string) => {
    if (!publishPattern) return;
    await patternService.publish(publishPattern.id, {
      enableProject: config.enableProject,
      enableAnnual: config.enableAnnual,
      enableLimited: config.enableLimited,
      projectPrice: Number(price),
      region: config.region,
      allowDerivative: config.allowDerivative,
      allowCommercial: config.allowCommercial,
    });
    updateLicenseConfig(publishPattern.id, config);
    await reloadMyPatterns();
    setPublishPattern(null);
    const licenseTypes = [
      config.enableProject && '单项目',
      config.enableAnnual && '年度',
      config.enableLimited && '限量',
    ].filter(Boolean).join('·');
    toast.success(`「${publishPattern.title}」已发布至纹样市集`, {
      description: `授权类型：${licenseTypes} · 起售价 ¥${price} · 平台佣金10% · T+7结算`,
    });
  };

  const handleUnpublish = async (p: MyPattern) => {
    await patternService.unpublish(p.id);
    await reloadMyPatterns();
    toast.success(`「${p.title}」已从纹样市集下架`);
  };

  const handleCopyrightConfirm = async (email: string) => {
    if (!copyrightPattern) return;
    await patternService.applyCopyright(copyrightPattern.id, { applyEmail: email });
    await reloadMyPatterns();
    setCopyrightPattern(null);
    toast.success('版权认证申请已提交', { description: '预计7-15个工作日，完成后将通知您' });
  };

  // Issue 4: Cancel copyright certification
  const handleCancelCopyright = async () => {
    if (!copyrightProgressPattern) return;
    await patternService.cancelCopyright(copyrightProgressPattern.id);
    await reloadMyPatterns();
    setCopyrightProgressPattern(null);
    toast.success('版权认证申请已撤销', { description: '已支付费用不予退还，如需重新认证请再次申请' });
  };

  const handleSyncCopyrightCert = async (payload: { certNo?: string; certFile: File }) => {
    if (!syncCopyrightPattern) return;
    const certFileId = await uploadFile(payload.certFile);
    await patternService.syncCopyrightCertificate(syncCopyrightPattern.id, {
      certNo: payload.certNo,
      certFileId,
    });
    const updated = await reloadAndFindPattern(syncCopyrightPattern.id);
    setSyncCopyrightPattern(null);
    setCopyrightProgressPattern(updated);
    toast.success('版权证书同步成功', { description: '当前纹样已更新为“版权已认证”' });
  };

  const handleDelete = async (p: MyPattern) => {
    await patternService.deletePattern(p.id);
    await reloadMyPatterns();
    toast.success(`「${p.title}」已删除`);
  };

  const SOURCE_TABS: { key: FilterSource; label: string; count: number }[] = [
    { key: 'all',     label: '全部',     count: stats.total   },
    { key: 'zhihui',  label: '智绘AI',   count: stats.zhihui  },
    { key: 'copilot', label: '设计提案', count: stats.copilot },
    { key: 'upload',  label: '自有上传', count: stats.upload  },
    { key: 'licensed',label: '授权获得', count: stats.licensed },
  ];


  return (
    <div className="flex flex-col h-full" style={{ background: '#F5F0E8' }}>
      {/* Page header */}
      <div className="flex-shrink-0 px-6 py-4" style={{ background: 'rgba(245,240,232,0.95)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-[#1A3D4A]" style={{ fontSize: 18, fontWeight: 700 }}>我的纹库 · 灵感纹库</h1>
            <p className="text-xs text-[#9B9590] mt-0.5">汇聚智绘创作、提案成果与自有设计，一站式确权·发布·授权交易</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowUpload(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white"
              style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
              <Upload className="w-4 h-4" />上传本地纹样
            </button>
          </div>
        </div>

        {/* Filter row */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Status filter */}
          <div className="relative">
            <select value={filterRights} onChange={e => setFilterRights(e.target.value as FilterRights)}
              className="text-xs border rounded-xl px-3 py-2 pr-7 outline-none appearance-none bg-white text-[#1A3D4A]"
              style={{ border: '1px solid rgba(26,61,74,0.1)' }}>
              <option value="all">全部状态</option>
              <option value="none">待确权</option>
              <option value="done">已确权</option>
              <option value="published">已发布</option>
              <option value="copyright">版权认证中</option>
              <option value="copyrightDone">版权已认证</option>
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9B9590] pointer-events-none" />
          </div>
          {/* Category filter */}
          <div className="relative">
            <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}
              className="text-xs border rounded-xl px-3 py-2 pr-7 outline-none appearance-none bg-white text-[#1A3D4A]"
              style={{ border: '1px solid rgba(26,61,74,0.1)' }}>
              <option value="">全部品类</option>
              {FILTER_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9B9590] pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Source tabs + stats bar */}
      <div className="flex-shrink-0 px-6 py-3 flex items-center justify-between flex-wrap gap-3"
        style={{ background: 'rgba(245,240,232,0.7)', borderBottom: '1px solid rgba(26,61,74,0.06)' }}>
        {/* Source tabs */}
        <div className="flex gap-1">
          {SOURCE_TABS.map(tab => (
            <button key={tab.key} onClick={() => setFilterSource(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
              style={{
                background: filterSource === tab.key ? '#1A3D4A' : 'rgba(26,61,74,0.06)',
                color: filterSource === tab.key ? 'white' : '#6B6558',
                fontWeight: filterSource === tab.key ? 600 : 400,
              }}>
              {tab.label}
              <span className="px-1.5 py-0.5 rounded-full text-[10px]"
                style={{ background: filterSource === tab.key ? 'rgba(255,255,255,0.2)' : 'rgba(26,61,74,0.1)', color: filterSource === tab.key ? 'white' : '#9B9590' }}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Quick stats */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { label: '待确权', value: stats.none, color: '#9B9590', bg: 'rgba(155,149,144,0.1)', filter: 'none' as FilterRights },
            { label: '已确权', value: stats.done, color: '#16A34A', bg: 'rgba(22,163,74,0.1)', filter: 'done' as FilterRights },
            { label: '已发布', value: stats.published, color: '#1A3D4A', bg: 'rgba(26,61,74,0.08)', filter: 'published' as FilterRights },
          ].map(item => (
            <button key={item.label} onClick={() => setFilterRights(filterRights === item.filter ? 'all' : item.filter)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] transition-all hover:scale-105"
              style={{
                background: filterRights === item.filter ? item.bg : 'transparent',
                border: `1px solid ${filterRights === item.filter ? item.color + '40' : 'rgba(26,61,74,0.08)'}`,
                color: filterRights === item.filter ? item.color : '#9B9590',
                fontWeight: filterRights === item.filter ? 600 : 400,
              }}>
              <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: item.color }} />
              {item.label}
              <span style={{ fontWeight: 700 }}>{item.value}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pattern grid */}
      <div className="flex-1 overflow-y-auto px-6 py-5" style={{ scrollbarWidth: 'thin' }}>
        {myPatternsLoading ? (
          <div className="flex h-64 flex-col items-center justify-center text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl" style={{ background: 'rgba(26,61,74,0.06)' }}>
              <div className="h-6 w-6 rounded-full border-2 border-[#C4912A]/30 border-t-[#C4912A] animate-spin" />
            </div>
            <p className="text-sm text-[#6B6558]" style={{ fontWeight: 500 }}>正在加载我的纹样…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(196,145,42,0.08)' }}>
              <FileText className="w-8 h-8 text-[#C4A88A]" />
            </div>
            <p className="text-sm text-[#6B6558]" style={{ fontWeight: 500 }}>
              {search || filterSource !== 'all' || filterRights !== 'all' || filterCategory
                ? '没有找到符合条件的纹样'
                : '还没有纹样，从智绘或设计提案收录，或上传本地纹样'}
            </p>
            {!search && filterSource === 'all' && filterRights === 'all' && !filterCategory && (
              <button onClick={() => setShowUpload(true)}
                className="mt-4 flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white"
                style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
                <Plus className="w-4 h-4" />上传第一个纹样
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            <AnimatePresence>
              {filtered.map(p => (
                <PatternCard key={p.id} pattern={p} userName={userName}
                  onZoom={() => setLightboxPattern(p)}
                  onRights={() => setRightsPattern(p)}
                  onCert={() => setCertPattern(p)}
                  onPublish={() => setPublishPattern(p)}
                  onUnpublish={() => { void handleUnpublish(p); }}
                  onCopyright={() => setCopyrightPattern(p)}
                  onCancelCopyright={() => { setCopyrightProgressPattern(p); }}
                  onCopyrightProgress={() => setCopyrightProgressPattern(p)}
                  onDelete={() => { void handleDelete(p); }}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Modals */}
      <AnimatePresence>
        {lightboxPattern && (
          <Lightbox src={lightboxPattern.imageUrl} title={lightboxPattern.title} onClose={() => setLightboxPattern(null)} />
        )}
        {rightsPattern && (
          <RightsWizard
            pattern={rightsPattern}
            userName={userName}
            onClose={() => setRightsPattern(null)}
            onConfirmed={handleRightsConfirmed}
            onViewCertificate={handleRightsCertificateView}
          />
        )}
        {certPattern && (
          <CertificateModal pattern={certPattern} userName={userName} onClose={() => setCertPattern(null)} />
        )}
        {publishPattern && (
          <AnimatePresence>
            <LicensePublishModal
              pattern={publishPattern}
              onClose={() => setPublishPattern(null)}
              onConfirm={handlePublishConfirm}
              isSellerReady={isSellerReady}
              onOpenSellerCenter={() => setSellerCenterOpen(true)}
            />
          </AnimatePresence>
        )}
        {copyrightPattern && (
          <CopyrightModal pattern={copyrightPattern} onClose={() => setCopyrightPattern(null)} onConfirm={handleCopyrightConfirm} />
        )}
        {copyrightProgressPattern && (
          <CopyrightProgressModal
            pattern={copyrightProgressPattern}
            onClose={() => setCopyrightProgressPattern(null)}
            onCancel={() => { void handleCancelCopyright(); }}
            onSync={() => {
              setSyncCopyrightPattern(copyrightProgressPattern);
              setCopyrightProgressPattern(null);
            }}
          />
        )}
        {syncCopyrightPattern && (
          <SyncCopyrightCertModal
            pattern={syncCopyrightPattern}
            onClose={() => setSyncCopyrightPattern(null)}
            onConfirm={handleSyncCopyrightCert}
          />
        )}
        {showUpload && (
          <UploadModal onClose={() => setShowUpload(false)} onUploaded={handleUpload} />
        )}
      </AnimatePresence>

      {/* Seller Center removed */}
    </div>
  );
}
