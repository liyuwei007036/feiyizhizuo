import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router';
import { useApp } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import type { ModuleKey } from '../../context/AppContext';
import {
  Bell, ChevronLeft, ChevronRight, User, ChevronDown,
  AlertCircle, CheckCircle2, Info, Zap, X, Home,
  Sparkles, Brain, Presentation, BookOpen, ShieldCheck,
  Award, Coins, FolderOpen, BarChart3, Settings, Search,
  Shield, LogOut, Edit3, Key,
  Lock, Palette, Camera, Store
} from 'lucide-react';
import { toast } from 'sonner';

const NAV_GROUPS = [
  {
    label: '创作与提案',
    labelEn: 'Create & Propose',
    items: [
      { path: '/zhihui',    label: '智绘创作', labelEn: 'ZhiHui',          icon: Sparkles, module: 'zhihui'    as ModuleKey, sub: '非遗纹样智能创作' },
      { path: '/copilot',   label: '设计提案', labelEn: 'Design Proposal',  icon: Brain,    module: 'copilot'   as ModuleKey, sub: '懂客户·懂成交' },
    ]
  },
  {
    label: '纹样资产',
    labelEn: 'Pattern Assets',
    items: [
      { path: '/materials', label: '我的纹库', labelEn: 'My Patterns',      icon: BookOpen, module: 'materials' as ModuleKey, sub: '确权·发布·申证' },
      { path: '/market',    label: '纹样市集', labelEn: 'Pattern Market',   icon: Store,    module: 'market'    as ModuleKey, sub: '浏览·授权·交易' },
    ]
  },
  {
    label: '系统',
    labelEn: 'System',
    items: [
      { path: '/admin',     label: '系统设置', labelEn: 'Settings',         icon: Settings, module: 'admin'     as ModuleKey, sub: '权限·品牌·关于' },
    ]
  }
];

const PATH_TITLES: Record<string, { zh: string; en: string }> = {
  '/':          { zh: '工作台',   en: 'Workbench' },
  '/zhihui':    { zh: '智绘创作', en: 'ZhiHui' },
  '/copilot':   { zh: '设计提案', en: 'Design Proposal' },
  '/materials': { zh: '我的纹库', en: 'My Patterns' },
  '/market':    { zh: '纹样市集', en: 'Pattern Market' },
  '/admin':     { zh: '系统设置', en: 'Settings' },
};

const ROLE_LABELS: Record<string, { zh: string; en: string; color: string }> = {
  designer: { zh: '设计师', en: 'Designer', color: 'bg-[#1A3D4A]' },
  admin:    { zh: '管理员', en: 'Admin',    color: 'bg-[#8B2020]' },
};

// 锦绣智织 品牌图标 SVG
function JinxiuLogo({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* 外框 - 印章感方形圆角 */}
      <rect x="1" y="1" width="30" height="30" rx="4" fill="none" stroke="#C4912A" strokeWidth="1.5" opacity="0.6" />
      {/* 织纹主体 - 经纬交织感 */}
      <path d="M8 8 L16 4 L24 8 L24 16 L16 28 L8 16 Z" fill="none" stroke="#C4912A" strokeWidth="1.2" opacity="0.9" />
      {/* 中心菱形 */}
      <rect x="12" y="12" width="8" height="8" rx="1" transform="rotate(45 16 16)" fill="#C4912A" opacity="0.85" />
      {/* 四角小纹 */}
      <circle cx="8" cy="8" r="1.5" fill="#C4912A" opacity="0.5" />
      <circle cx="24" cy="8" r="1.5" fill="#C4912A" opacity="0.5" />
      <circle cx="8" cy="24" r="1.5" fill="#C4912A" opacity="0.5" />
      <circle cx="24" cy="24" r="1.5" fill="#C4912A" opacity="0.5" />
      {/* 中心点 */}
      <circle cx="16" cy="16" r="2" fill="white" opacity="0.9" />
    </svg>
  );
}

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const { notifications, markNotificationRead, markAllRead, unreadCount, t } = useApp();

  const iconMap = {
    task: <Zap className="w-4 h-4 text-[#C4912A]" />,
    message: <Info className="w-4 h-4 text-[#1A3D4A]" />,
    alert: <AlertCircle className="w-4 h-4 text-[#8B2020]" />,
    system: <CheckCircle2 className="w-4 h-4 text-emerald-600" />,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -10, scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="absolute top-full right-0 mt-2 w-96 bg-white rounded-2xl shadow-2xl border border-[rgba(26,61,74,0.1)] z-50 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(26,61,74,0.08)]"
        style={{ background: 'linear-gradient(to right, #F5F0E8, #FBF9F5)' }}>
        <div className="flex items-center gap-2">
          <span className="text-sm text-[#1A3D4A]">{t('消息通知', 'Notifications')}</span>
          {unreadCount > 0 && (
            <span className="bg-[#8B2020] text-white text-xs rounded-full px-1.5 py-0.5 min-w-[20px] text-center">{unreadCount}</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button onClick={markAllRead} className="text-xs text-[#C4912A] hover:text-[#A87920] transition-colors">
            {t('全部已读', 'Mark all read')}
          </button>
          <button onClick={onClose} className="text-[#6B6558] hover:text-[#1A3D4A]">
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="max-h-80 overflow-y-auto">
        {notifications.map(n => (
          <button
            key={n.id}
            onClick={() => markNotificationRead(n.id)}
            className={`w-full flex items-start gap-3 px-4 py-3 hover:bg-[#F5F0E8] transition-colors text-left border-b border-[rgba(26,61,74,0.05)] last:border-0 ${!n.read ? 'bg-[#FBF8F2]' : ''}`}
          >
            <div className="mt-0.5 flex-shrink-0">{iconMap[n.type]}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#1A1A1A] truncate">{n.title}</span>
                {!n.read && <span className="w-2 h-2 rounded-full bg-[#8B2020] flex-shrink-0" />}
              </div>
              <p className="text-xs text-[#6B6558] mt-0.5 line-clamp-2 leading-relaxed">{n.content}</p>
              <span className="text-xs text-[#9B9590] mt-1 block">{n.time}</span>
            </div>
          </button>
        ))}
      </div>
      <div className="px-4 py-2.5 border-t border-[rgba(26,61,74,0.06)] text-center">
        <span className="text-xs text-[#6B6558]">南京鋆寰科技有限公司 · 锦绣智织</span>
      </div>
    </motion.div>
  );
}

function Watermark({ text }: { text: string }) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {Array.from({ length: 6 }).map((_, row) =>
        Array.from({ length: 5 }).map((_, col) => (
          <div
            key={`${row}-${col}`}
            className="absolute select-none"
            style={{
              top: `${row * 18 + 5}%`,
              left: `${col * 24 - 3}%`,
              transform: 'rotate(-25deg)',
              opacity: 0.035,
              fontSize: '12px',
              color: '#1A3D4A',
              whiteSpace: 'nowrap',
              fontWeight: 500,
              letterSpacing: '0.05em',
            }}
          >
            {text}
          </div>
        ))
      )}
    </div>
  );
}

function AuthState({
  title,
  description,
  mode,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  mode: 'loading' | 'error';
  actionLabel?: string;
  onAction?: () => void;
}) {
  const isLoading = mode === 'loading';

  return (
    <div className="relative z-10 flex flex-1 items-center justify-center p-8">
      <div
        className="w-full max-w-md bg-white p-8 text-center shadow-lg rounded-lg"
        style={{ border: '1px solid rgba(26,61,74,0.1)' }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg"
          style={{ background: isLoading ? 'rgba(26,61,74,0.07)' : 'rgba(139,32,32,0.07)' }}
        >
          {isLoading ? (
            <span
              className="h-6 w-6 animate-spin rounded-full border-2 border-[#1A3D4A]/20 border-t-[#1A3D4A]"
              aria-hidden="true"
            />
          ) : (
            <AlertCircle className="h-6 w-6 text-[#8B2020]" />
          )}
        </div>
        <h2 className="mb-2 text-lg text-[#1A3D4A]" style={{ fontWeight: 600 }}>
          {title}
        </h2>
        <p className="text-sm leading-relaxed text-[#6B6558]">{description}</p>
        {actionLabel && onAction ? (
          <button
            onClick={onAction}
            className="mt-6 rounded-lg px-5 py-2 text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

// ── User Settings Panel ───────────────────────────────────────────────────────

function UserSettingsPanel({ onClose }: { onClose: () => void }) {
  const { userRole, setUserRole, t, watermarkText, userAvatar, setUserAvatar, userPhone, userName, setUserName } = useApp();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(userName);
  const [activeSection, setActiveSection] = useState<'profile' | 'prefs' | 'security'>('profile');
  const [notifToggles, setNotifToggles] = useState({ redDot: true, sound: false, system: true });
  const [showChangePwd, setShowChangePwd] = useState(false);
  const [pwdForm, setPwdForm] = useState({ old: '', next: '', confirm: '' });
  const [show2FA, setShow2FA] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const roleInfo = ROLE_LABELS[userRole];

  const ROLE_DESCRIPTIONS: Record<string, string> = {
    designer: '可访问智绘、设计副驾、灵感纹库等设计模块',
    admin: '拥有全部权限，可访问系统设置和审计日志',
  };

  const MOCK_LOG = [
    { time: '09:12', action: '登录系统', module: '系统' },
    { time: '09:15', action: '查看灵感纹库', module: '灵感纹库' },
    { time: '09:24', action: '新建智绘创作', module: '智绘' },
    { time: '09:26', action: '生成纹样方案', module: '智绘' },
    { time: '10:05', action: '提交版权认证申请', module: '版权认证' },
    { time: '11:30', action: '新建授权合同', module: '授权资产' },
    { time: '14:22', action: '导出提案 PDF', module: '提案中心' },
  ];

  const sections = [
    { key: 'profile',  label: '个人信息', icon: <User className="w-3.5 h-3.5" /> },
    { key: 'prefs',    label: '偏好设置', icon: <Palette className="w-3.5 h-3.5" /> },
    { key: 'security', label: '安全设置', icon: <Shield className="w-3.5 h-3.5" /> },
  ];

  // Rendered as fixed so it escapes the header's flex-item stacking context
  return (
    <>
      {/* Transparent backdrop — click outside closes panel */}
      <div className="fixed inset-0" style={{ zIndex: 998 }} onClick={onClose} />

      {/* Panel — above backdrop */}
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -6 }}
        transition={{ duration: 0.16 }}
        className="fixed top-14 right-4 w-[420px] bg-white rounded-2xl shadow-2xl border border-[rgba(26,61,74,0.1)] overflow-hidden"
        style={{ zIndex: 999 }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #0D2535, #1A3D4A)' }}>
          <div className="flex items-center gap-3">
            <div className="relative group flex-shrink-0">
              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-10 h-10 rounded-full ${roleInfo.color} flex items-center justify-center ring-2 ring-white/20 overflow-hidden transition-all relative`}
              >
                {userAvatar
                  ? <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
                  : <User className="w-5 h-5 text-white" />
                }
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                  <Camera className="w-4 h-4 text-white" />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (file.size > 2 * 1024 * 1024) { toast.error('图片不能超过 2MB'); return; }
                  const reader = new FileReader();
                  reader.onload = ev => {
                    setUserAvatar(ev.target?.result as string);
                    toast.success('头像已更新');
                  };
                  reader.readAsDataURL(file);
                  e.target.value = '';
                }}
              />
              <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full flex items-center justify-center shadow"
                style={{ background: '#C4912A', pointerEvents: 'none' }}>
                <Camera className="w-2.5 h-2.5 text-white" />
              </div>
            </div>
            <div>
              {editingName ? (
                <div className="flex items-center gap-2">
                  <input
                    value={nameInput}
                    onChange={e => setNameInput(e.target.value)}
                    className="text-sm bg-white/10 border border-white/20 rounded-lg px-2 py-0.5 outline-none w-28"
                    style={{ color: 'white' }}
                    autoFocus
                    onKeyDown={e => {
                      if (e.key === 'Enter') { setUserName(nameInput); setEditingName(false); toast.success('昵称已更新'); }
                      if (e.key === 'Escape') { setEditingName(false); setNameInput(userName); }
                    }}
                  />
                  <button onClick={() => { setUserName(nameInput); setEditingName(false); toast.success('昵称已更新'); }}
                    className="text-xs px-2 py-0.5 rounded-md" style={{ background: '#C4912A', color: 'white' }}>保存</button>
                  <button onClick={() => { setEditingName(false); setNameInput(userName); }} className="text-white/50 text-xs">取消</button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span className="text-sm text-white" style={{ fontWeight: 500 }}>{userName}</span>
                  <button onClick={() => { setEditingName(true); setNameInput(userName); }} className="text-white/30 hover:text-[#C4912A] transition-colors">
                    <Edit3 className="w-3 h-3" />
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${roleInfo.color}`} />
                <span className="text-xs" style={{ color: 'rgba(196,145,42,0.85)' }}>{t(roleInfo.zh, roleInfo.en)}</span>
                <span className="text-[10px] text-white/30">· {userPhone}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white/80 transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-[rgba(26,61,74,0.07)]" style={{ background: '#FAFAF8' }}>
          {sections.map(s => (
            <button key={s.key}
              onClick={() => { setActiveSection(s.key as any); setShowChangePwd(false); setShow2FA(false); setShowLog(false); }}
              className="flex-1 flex flex-col items-center gap-1 py-2.5 text-[10px] transition-all"
              style={{
                color: activeSection === s.key ? '#1A3D4A' : '#9B9590',
                borderBottom: activeSection === s.key ? '2px solid #C4912A' : '2px solid transparent',
                fontWeight: activeSection === s.key ? 600 : 400,
              }}>
              {s.icon}
              {s.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-4 overflow-y-auto" style={{ maxHeight: 460, scrollbarWidth: 'none' }}>
          <AnimatePresence mode="wait">

            {/* ─ Profile ─ */}
            {activeSection === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.12 }} className="space-y-2">
                {/* Phone — primary identifier, displayed prominently */}
                <div className="flex items-center justify-between py-2.5 px-3 rounded-xl"
                  style={{ background: 'rgba(196,145,42,0.06)', border: '1.5px solid rgba(196,145,42,0.25)' }}>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#C4912A]" style={{ fontWeight: 600 }}>📱 联系电话</span>
                  </div>
                  <span className="text-sm text-[#1A3D4A] font-mono" style={{ fontWeight: 600 }}>{userPhone}</span>
                </div>
                {[
                  { label: '邮箱',     value: 'designer@jinxiu.ai' },
                  { label: '水印标识', value: watermarkText },
                  { label: '注册时间', value: '2024-03-28' },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-2 px-3 rounded-xl"
                    style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.05)' }}>
                    <span className="text-xs text-[#9B9590]">{item.label}</span>
                    <span className="text-xs text-[#1A3D4A]">{item.value}</span>
                  </div>
                ))}
              </motion.div>
            )}

            {/* ─ Preferences ─ */}
            {activeSection === 'prefs' && (
              <motion.div key="prefs" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.12 }} className="space-y-4">
                <div>
                  <p className="text-xs text-[#9B9590] mb-2 px-1">通知偏好</p>
                  <div className="space-y-2">
                    {([
                      { key: 'redDot' as const, label: '红点任务提醒', desc: '确权、审核、跟进等任务提醒' },
                      { key: 'sound'  as const, label: '声音提示',     desc: '消息到达时播放提示音' },
                      { key: 'system' as const, label: '系统公告',     desc: '产品更新和系统维护通知' },
                    ]).map(item => (
                      <div key={item.key} className="flex items-center justify-between px-3 py-2.5 rounded-xl"
                        style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.05)' }}>
                        <div>
                          <p className="text-xs text-[#1A3D4A]">{item.label}</p>
                          <p className="text-[10px] text-[#9B9590]">{item.desc}</p>
                        </div>
                        <button
                          onClick={() => {
                            const next = !notifToggles[item.key];
                            setNotifToggles(prev => ({ ...prev, [item.key]: next }));
                            toast.success(`${item.label}已${next ? '开启' : '关闭'}`);
                          }}
                          className="flex-shrink-0 ml-4 rounded-full transition-all"
                          style={{
                            width: 36, height: 20, display: 'flex', alignItems: 'center', padding: '2px',
                            background: notifToggles[item.key] ? '#1A3D4A' : 'rgba(26,61,74,0.18)',
                            justifyContent: notifToggles[item.key] ? 'flex-end' : 'flex-start',
                          }}>
                          <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'block' }} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {/* ─ Security ─ */}
            {activeSection === 'security' && (
              <motion.div key="security" initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -8 }} transition={{ duration: 0.12 }} className="space-y-2.5">
                <div className="p-3 rounded-xl flex items-center gap-3"
                  style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.07)' }}>
                  <Shield className="w-4 h-4 text-[#C4912A] flex-shrink-0" />
                  <div>
                    <p className="text-xs text-[#1A3D4A]" style={{ fontWeight: 500 }}>最后登录</p>
                    <p className="text-[10px] text-[#6B6558]">2026-04-04 09:12 · 南京市 · Chrome / macOS</p>
                  </div>
                </div>

                {/* Change password */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(26,61,74,0.07)' }}>
                  <button onClick={() => setShowChangePwd(v => !v)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#F5F0E8] transition-all">
                    <span className="text-[#C4912A]"><Key className="w-3.5 h-3.5" /></span>
                    <div className="flex-1">
                      <p className="text-xs text-[#1A3D4A]">修改密码</p>
                      <p className="text-[10px] text-[#9B9590]">上次修改：30天前</p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-[#C4A88A] transition-transform ${showChangePwd ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showChangePwd && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                        style={{ borderTop: '1px solid rgba(26,61,74,0.06)' }}>
                        <div className="p-3 space-y-2" style={{ background: 'rgba(26,61,74,0.02)' }}>
                          {[
                            { key: 'old', placeholder: '当前密码' },
                            { key: 'next', placeholder: '新密码（≥8位，含大小写+数字）' },
                            { key: 'confirm', placeholder: '确认新密码' },
                          ].map(f => (
                            <input key={f.key} type="password" placeholder={f.placeholder}
                              value={pwdForm[f.key as keyof typeof pwdForm]}
                              onChange={e => setPwdForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                              className="w-full text-xs px-3 py-2 rounded-lg outline-none"
                              style={{ background: 'white', border: '1px solid rgba(26,61,74,0.12)', color: '#1A3D4A' }}
                            />
                          ))}
                          <button
                            onClick={() => {
                              if (!pwdForm.old) { toast.error('请输入当前密码'); return; }
                              if (pwdForm.next.length < 8) { toast.error('新密码至少8位'); return; }
                              if (pwdForm.next !== pwdForm.confirm) { toast.error('两次输入的密码不一致'); return; }
                              toast.success('密码修改成功');
                              setShowChangePwd(false);
                              setPwdForm({ old: '', next: '', confirm: '' });
                            }}
                            className="w-full py-1.5 rounded-lg text-xs text-white transition-all"
                            style={{ background: '#1A3D4A' }}>
                            确认修改
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2FA */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(26,61,74,0.07)' }}>
                  <button onClick={() => setShow2FA(v => !v)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#F5F0E8] transition-all">
                    <span className="text-[#C4912A]"><Shield className="w-3.5 h-3.5" /></span>
                    <div className="flex-1">
                      <p className="text-xs text-[#1A3D4A]">双因素验证</p>
                      <p className="text-[10px] text-emerald-600">已开启 · 绑定手机尾号 8888</p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-[#C4A88A] transition-transform ${show2FA ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {show2FA && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                        style={{ borderTop: '1px solid rgba(26,61,74,0.06)' }}>
                        <div className="p-3" style={{ background: 'rgba(26,61,74,0.02)' }}>
                          <p className="text-xs text-[#6B6558]">双因素验证已绑定手机 ****8888，每次登录将向该手机发送验证码。</p>
                          <button onClick={() => { toast.info('解绑操作已记录'); setShow2FA(false); }}
                            className="mt-2 text-xs text-[#8B2020] hover:underline">解除绑定</button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Activity log */}
                <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(26,61,74,0.07)' }}>
                  <button onClick={() => setShowLog(v => !v)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-[#F5F0E8] transition-all">
                    <span className="text-[#C4912A]"><Lock className="w-3.5 h-3.5" /></span>
                    <div className="flex-1">
                      <p className="text-xs text-[#1A3D4A]">操作日志</p>
                      <p className="text-[10px] text-[#9B9590]">今日 7 条记录</p>
                    </div>
                    <ChevronRight className={`w-3.5 h-3.5 text-[#C4A88A] transition-transform ${showLog ? 'rotate-90' : ''}`} />
                  </button>
                  <AnimatePresence>
                    {showLog && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden"
                        style={{ borderTop: '1px solid rgba(26,61,74,0.06)' }}>
                        <div className="divide-y divide-[rgba(26,61,74,0.05)]" style={{ background: 'rgba(26,61,74,0.02)' }}>
                          {MOCK_LOG.map((entry, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2">
                              <span className="text-[10px] text-[#9B9590] w-10 flex-shrink-0">{entry.time}</span>
                              <span className="text-xs text-[#1A3D4A] flex-1">{entry.action}</span>
                              <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(196,145,42,0.1)', color: '#C4912A' }}>{entry.module}</span>
                            </div>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Footer */}
        <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid rgba(26,61,74,0.06)' }}>
          <button
            onClick={async () => {
              onClose();
              try {
                await logout();
                toast.success('已恢复默认账号会话');
              } catch (e) {
                toast.error('默认账号会话恢复失败');
              }
              navigate('/zhihui', { replace: true });
            }}
            className="w-full py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all text-[#1A3D4A] hover:bg-[rgba(26,61,74,0.04)]"
            style={{ border: '1px solid rgba(26,61,74,0.12)' }}>
            <LogOut className="w-4 h-4" /> 重置会话
          </button>
        </div>
      </motion.div>
    </>
  );
}

export function AppLayout({ children }: { children?: React.ReactNode }) {
  const { userRole, setUserRole, unreadCount, redDots, clearRedDot, t, sidebarCollapsed, toggleSidebar, watermarkText, canAccess, userAvatar } = useApp();
  const { authError, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showUserSettings, setShowUserSettings] = useState(false);

  // Auth pages have no sidebar
  const isAuthPage = location.pathname === '/login' || location.pathname === '/register';

  const roleInfo = ROLE_LABELS[userRole];

  // Filter nav by RBAC: only show items the current role can access
  const visibleNavGroups = NAV_GROUPS.map(group => ({
    ...group,
    items: group.items.filter(item => canAccess(item.module))
  })).filter(group => group.items.length > 0);

  const handleNavClick = (module: ModuleKey) => {
    clearRedDot(module);
  };

  const pathKey = Object.keys(PATH_TITLES).find(k => k !== '/' && location.pathname.startsWith(k)) || '/';
  const pageTitle = PATH_TITLES[pathKey];

  // Auth pages: no sidebar layout
  if (isAuthPage) {
    return (
      <div className="flex h-screen overflow-hidden relative" style={{ background: '#F5F0E8' }}>
        <Watermark text={watermarkText} />
        {children}
      </div>
    );
  }

  if (isLoading || !isAuthenticated) {
    return (
      <div className="flex h-screen overflow-hidden relative" style={{ background: '#F5F0E8' }}>
        <Watermark text={watermarkText} />
        {authError ? (
          <AuthState
            mode="error"
            title="默认账号连接失败"
            description={authError}
            actionLabel="重新加载"
            onAction={() => window.location.reload()}
          />
        ) : (
          <AuthState
            mode="loading"
            title="正在连接默认账号"
            description="系统正在自动接入 18571593801，完成后会直接进入工作区。"
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden relative" style={{ background: '#F5F0E8' }}>
      <Watermark text={watermarkText} />

      {/* Sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 60 : 232 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
        className="flex flex-col flex-shrink-0 z-20 relative overflow-hidden"
        style={{ background: '#0D2535' }}
      >
        {/* 织纹背景装饰 */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 3px, rgba(196,145,42,0.025) 3px, rgba(196,145,42,0.025) 6px)`,
        }} />

        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0 relative" style={{ borderBottom: '1px solid rgba(196,145,42,0.15)' }}>
          <div className="flex-shrink-0">
            <JinxiuLogo size={32} />
          </div>
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -8 }}
                transition={{ duration: 0.18 }}
                className="min-w-0"
              >
                <div className="text-sm text-white leading-tight tracking-wide">鋆寰｜非遗智作</div>
                <div className="text-[10px] leading-tight mt-0.5" style={{ color: 'rgba(196,145,42,0.7)', letterSpacing: '0.08em' }}>赋能非遗 · 智作传承</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-2 overflow-y-auto overflow-x-hidden" style={{ scrollbarWidth: 'none' }}>
          {visibleNavGroups.map((group, gi) => (
            <div key={gi} className="mb-1">
              <AnimatePresence>
                {!sidebarCollapsed && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="px-4 pt-3 pb-1"
                  >
                    <span className="text-[10px] uppercase tracking-widest" style={{ color: 'rgba(196,145,42,0.45)', letterSpacing: '0.1em' }}>
                      {t(group.label, group.labelEn)}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {group.items.map(item => {
                const isActive = item.path === '/' ? location.pathname === '/' : location.pathname.startsWith(item.path);
                const dotCount = redDots[item.module] || 0;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={() => handleNavClick(item.module)}
                    className={() =>
                      `flex items-center gap-3 mx-2 rounded-xl relative transition-all group ${
                        sidebarCollapsed ? 'px-3 py-3 justify-center' : 'px-3 py-2.5'
                      } ${isActive
                        ? 'text-white'
                        : 'text-white/50 hover:text-white/80'
                      }`
                    }
                    style={({ isActive: navActive }) => isActive || navActive ? {
                      background: 'linear-gradient(135deg, rgba(196,145,42,0.18) 0%, rgba(196,145,42,0.08) 100%)',
                      borderLeft: '2px solid #C4912A',
                    } : {
                      borderLeft: '2px solid transparent',
                    }}
                    end={item.path === '/'}
                  >
                    <div className="relative flex-shrink-0">
                      <item.icon className={`w-4 h-4 ${isActive ? 'text-[#C4912A]' : ''}`} />
                      {dotCount > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 bg-[#8B2020] text-white text-[9px] rounded-full flex items-center justify-center px-0.5 font-medium">
                          {dotCount > 9 ? '9+' : dotCount}
                        </span>
                      )}
                    </div>
                    <AnimatePresence>
                      {!sidebarCollapsed && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex-1 min-w-0"
                        >
                          <div className="text-sm whitespace-nowrap overflow-hidden" style={{ color: isActive ? '#F0EAE0' : undefined }}>
                            {t(item.label, item.labelEn)}
                          </div>
                          {item.sub && (
                            <div className="text-[10px] mt-0.5 truncate" style={{ color: 'rgba(255,255,255,0.3)' }}>
                              {item.sub}
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {/* Collapsed tooltip */}
                    {sidebarCollapsed && (
                      <div className="absolute left-full ml-2.5 bg-[#0D2535] border border-[rgba(196,145,42,0.2)] text-white text-xs rounded-lg px-2.5 py-1.5 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 shadow-xl">
                        <div className="font-medium">{t(item.label, item.labelEn)}</div>
                        {dotCount > 0 && <span className="text-[#C4912A]"> ({dotCount})</span>}
                      </div>
                    )}
                  </NavLink>
                );
              })}
            </div>
          ))}
        </nav>

        {/* User Area */}
        <div className="flex-shrink-0 relative" style={{ borderTop: '1px solid rgba(196,145,42,0.12)' }}>
          <button
            onClick={() => setShowUserMenu(!showUserMenu)}
            className="w-full flex items-center gap-2.5 hover:bg-white/5 p-3 transition-colors group"
          >
            <div className={`w-7 h-7 rounded-full ${roleInfo.color} flex items-center justify-center flex-shrink-0 text-white`}>
              <User className="w-3.5 h-3.5" />
            </div>
            <AnimatePresence>
              {!sidebarCollapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 text-left min-w-0">
                  <div className="text-xs text-white/70 truncate">{t('当前用户', 'Current User')}</div>
                  <div className="text-xs" style={{ color: 'rgba(196,145,42,0.8)' }}>{t(roleInfo.zh, roleInfo.en)}</div>
                </motion.div>
              )}
            </AnimatePresence>
            {!sidebarCollapsed && <ChevronDown className="w-3 h-3 text-white/30 flex-shrink-0" />}
          </button>

          <AnimatePresence>
            {showUserMenu && !sidebarCollapsed && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
                style={{ background: 'rgba(0,0,0,0.2)' }}
              >
                <div className="p-2 pb-3">
                  <p className="text-[10px] px-2 mb-1.5" style={{ color: 'rgba(196,145,42,0.4)', letterSpacing: '0.05em' }}>
                    {t('切换角色（演示）', 'Switch Role (Demo)')}
                  </p>
                  {Object.entries(ROLE_LABELS).map(([role, info]) => (
                    <button
                      key={role}
                      onClick={() => { setUserRole(role as any); setShowUserMenu(false); toast.success(t(`已切换至 ${info.zh}`, `Switched to ${info.en}`)); }}
                      className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs transition-colors ${
                        userRole === role
                          ? 'text-[#C4912A]'
                          : 'text-white/40 hover:text-white/70'
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${info.color}`} />
                      {t(info.zh, info.en)}
                      {userRole === role && <span className="ml-auto text-[#C4912A]">✓</span>}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Company info */}
          <AnimatePresence>
            {!sidebarCollapsed && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="px-3 pb-3 text-center">
                <p className="text-[9px] leading-relaxed" style={{ color: 'rgba(196,145,42,0.3)' }}>
                  南京鋆寰科技有限公司
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Collapse Button */}
        <button
          onClick={toggleSidebar}
          className="absolute -right-3 top-16 w-6 h-6 rounded-full flex items-center justify-center shadow-lg transition-colors z-30"
          style={{ background: '#0D2535', border: '1px solid rgba(196,145,42,0.25)', color: 'rgba(196,145,42,0.7)' }}
        >
          {sidebarCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </motion.aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-13 flex items-center px-5 gap-4 flex-shrink-0 z-10"
          style={{
            background: 'rgba(245,240,232,0.95)',
            backdropFilter: 'blur(8px)',
            borderBottom: '1px solid rgba(26,61,74,0.08)',
            minHeight: '52px',
          }}>
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Home className="w-3.5 h-3.5 text-[#6B6558]" />
            <ChevronRight className="w-3 h-3 text-[#C4A88A]" />
            <span className="text-sm text-[#1A3D4A]">
              {pageTitle ? t(pageTitle.zh, pageTitle.en) : ''}
            </span>
          </div>

          {/* Search bar removed per UX review */}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setShowNotifications(!showNotifications); setShowUserSettings(false); }}
              className={`relative p-2 rounded-xl transition-all ${showNotifications ? 'bg-[#F0E6D3] text-[#C4912A]' : 'hover:bg-[rgba(26,61,74,0.06)] text-[#6B6558] hover:text-[#1A3D4A]'}`}
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#8B2020] rounded-full" />
              )}
            </button>
            <AnimatePresence>
              {showNotifications && (
                <NotificationPanel onClose={() => setShowNotifications(false)} />
              )}
            </AnimatePresence>
          </div>

          {/* User Avatar — click opens settings panel */}
          <div className="relative">
            <button
              onClick={() => { setShowUserSettings(!showUserSettings); setShowNotifications(false); }}
              className={`w-8 h-8 rounded-full ${roleInfo.color} flex items-center justify-center ring-2 transition-all ${showUserSettings ? 'ring-[#C4912A] scale-105' : 'ring-white/60'} shadow-sm overflow-hidden`}
            >
              {userAvatar
                ? <img src={userAvatar} alt="avatar" className="w-full h-full object-cover" />
                : <User className="w-4 h-4 text-white" />
              }
            </button>
            <AnimatePresence>
              {showUserSettings && (
                <UserSettingsPanel onClose={() => setShowUserSettings(false)} />
              )}
            </AnimatePresence>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>

      {/* Click outside to close */}
      {(showNotifications || showUserMenu) && (
        <div className="fixed inset-0 z-10" onClick={() => { setShowNotifications(false); setShowUserMenu(false); }} />
      )}
    </div>
  );
}
