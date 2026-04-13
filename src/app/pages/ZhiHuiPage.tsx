import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { useApp } from '../context/AppContext';
import type { MyPattern } from '../context/AppContext';
import { toast } from 'sonner';
import {
  Plus, Send, Sparkles, ChevronDown, ImagePlus, FileText, Paperclip,
  X, RotateCcw, Loader2, Clock,
  Archive, ZoomIn, Bookmark, BookmarkCheck,
} from 'lucide-react';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: 'yunjin',  name: '云锦', nameEn: 'Yunjin',      enabled: true  },
  { id: 'songjin', name: '宋锦', nameEn: 'Songjin',     enabled: false },
  { id: 'shujin',  name: '蜀锦', nameEn: 'Shujin',      enabled: false },
  { id: 'kesi',    name: '缂丝', nameEn: 'Kesi',        enabled: false },
  { id: 'cixiu',   name: '刺绣', nameEn: 'Embroidery',  enabled: false },
  { id: 'mudiao',  name: '木雕', nameEn: 'Woodcraft',   enabled: false },
  { id: 'taoci',   name: '陶瓷', nameEn: 'Ceramics',    enabled: false },
  { id: 'qiqi',    name: '漆器', nameEn: 'Lacquerware', enabled: false },
  { id: 'jianzhi', name: '剪纸', nameEn: 'Papercutting',enabled: false },
  { id: 'kehui',   name: '刻绘', nameEn: 'Carving',     enabled: false },
];

const UPLOAD_OPTIONS = [
  { icon: <ImagePlus className="w-4 h-4" />, label: '上传图片',       labelEn: 'Upload Image'    },
  { icon: <FileText  className="w-4 h-4" />, label: '上传草图',       labelEn: 'Upload Sketch'   },
  { icon: <Paperclip className="w-4 h-4" />, label: '上传文档',       labelEn: 'Upload Document' },
  { icon: <FileText  className="w-4 h-4" />, label: '上传客户 Brief', labelEn: 'Upload Brief'    },
  { icon: <Archive   className="w-4 h-4" />, label: '导入已有纹样',   labelEn: 'Import Pattern'  },
];

const SAMPLE_PROMPTS = [
  '生成一组适合南京城市礼赠场景的云锦纹样，整体偏典雅、祥瑞、稳重，适合高端礼盒包装',
  '参考凤凰纹样草图，转化为更现代的云锦风格图案，保留传统骨架，降低复杂度',
  '根据客户 brief 生成 4 个可提案方向，客户为知名白酒品牌，需要兼顾文化气质与现代感',
];

// Category color map for session list badges
const CAT_COLORS: Record<string, { bg: string; text: string }> = {
  '云锦': { bg: 'rgba(196,145,42,0.1)',  text: '#C4912A' },
  '宋锦': { bg: 'rgba(26,61,74,0.08)',   text: '#1A3D4A' },
  '蜀锦': { bg: 'rgba(255,105,180,0.1)', text: '#FF69B4' },
  '缂丝': { bg: 'rgba(107,79,138,0.1)', text: '#6B4F8A' },
  '刺绣': { bg: 'rgba(255,165,0,0.1)',  text: '#FFA500' },
  '木雕': { bg: 'rgba(26,61,74,0.06)',   text: '#6B6558' },
  '陶瓷': { bg: 'rgba(26,61,74,0.06)',   text: '#6B6558' },
  '漆器': { bg: 'rgba(255,215,0,0.1)',  text: '#FFD700' },
  '剪纸': { bg: 'rgba(255,140,0,0.1)',  text: '#FF8C00' },
  '刻绘': { bg: 'rgba(139,0,0,0.1)',    text: '#8B0000' },
};

interface Session {
  id: string;
  title: string;
  category: string;
  time: string;
  group: 'today' | 'week' | 'month';
}

const MOCK_SESSIONS: Session[] = [
  { id: 's1', title: '南京城市礼赠云锦纹样', category: '云锦', time: '2026-04-07 09:24', group: 'today' },
  { id: 's2', title: '故宫文创丝巾方向探索', category: '云锦', time: '2026-04-07 11:05', group: 'today' },
  { id: 's3', title: '现代宋锦包装纹样设计', category: '宋锦', time: '2026-04-06 14:30', group: 'week'  },
  { id: 's4', title: '苏绣礼品系列开发探索', category: '苏绣', time: '2026-04-05 16:00', group: 'week'  },
  { id: 's5', title: '博物馆文创系列纹样',   category: '云锦', time: '2026-04-01 10:15', group: 'month' },
];

interface GeneratedPattern {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  style: string;
  scene: string;
  imageUrl: string;
}

const MOCK_PATTERNS: GeneratedPattern[] = [
  {
    id: 'p1', title: '祥云·典雅版',
    desc: '以四合如意云纹为骨架，加入金线勾勒，整体呈祥瑞典雅气质',
    tags: ['吉祥', '传统', '礼品感'], style: '古典工笔', scene: '高端礼赠',
    imageUrl: 'https://images.unsplash.com/photo-1773394175834-2c407177ddcf?w=800',
  },
  {
    id: 'p2', title: '流云·现代感',
    desc: '以写意水墨手法重构云纹结构，墨色与金色交融，传统与现代共存',
    tags: ['现代', '联名', '时尚感'], style: '水墨写意', scene: '品牌联名',
    imageUrl: 'https://images.unsplash.com/photo-1649300726285-19ac2b1c3654?w=800',
  },
  {
    id: 'p3', title: '华彩·富贵锦',
    desc: '多彩云锦工艺，牡丹与如意纹组合，色彩饱满，高端礼赠首选',
    tags: ['富贵', '礼赠', '高端'], style: '重彩华丽', scene: '节庆礼盒',
    imageUrl: 'https://images.unsplash.com/photo-1761724794734-4ee4148a621b?w=800',
  },
  {
    id: 'p4', title: '印记·城市章',
    desc: '融合南京地域文化符号，印章感构图，兼顾文化辨识与现代极简',
    tags: ['城市', '地域', '印章'], style: '现代极简', scene: '文创周边',
    imageUrl: 'https://images.unsplash.com/photo-1609817482305-222c7d90ab06?w=800',
  },
];

type ConvMessage = {
  id: string;
  role: 'user' | 'system';
  content: string;
  category?: string;
  timestamp: string;
};

const SESSION_CONVERSATIONS: Record<string, { messages: ConvMessage[]; patterns: GeneratedPattern[]; savedIds: string[] }> = {
  s1: {
    messages: [
      { id: 'm1', role: 'user',   content: '生成一组适合南京城市礼赠场景的云锦纹样，整体偏典雅、祥瑞、稳重，适合高端礼盒包装', category: '云锦', timestamp: '09:24' },
      { id: 'm2', role: 'system', content: '已基于您的创作方向，结合「云锦」品类工艺规则与可用授权纹样，生成以下 4 个方向。', timestamp: '09:26' },
    ],
    patterns: MOCK_PATTERNS, savedIds: ['p1'],
  },
  s2: {
    messages: [
      { id: 'm1', role: 'user',   content: '参考凤凰纹样草图，转化为更现代的云锦风格图案，保留传统骨架，降低复杂度，用于故宫文创丝巾产品', category: '云锦', timestamp: '11:05' },
      { id: 'm2', role: 'system', content: '已基于「凤凰纹样草图」与「故宫文创丝巾」场景需求，结合云锦工艺参数生成 4 个创作方向。', timestamp: '11:07' },
    ],
    patterns: MOCK_PATTERNS, savedIds: [],
  },
  s3: {
    messages: [
      { id: 'm1', role: 'user',   content: '需要一套现代宋锦纹样用于高端包装设计，客户是某知名白酒品牌，希望兼顾文化气质和现代感', category: '宋锦', timestamp: '14:30' },
      { id: 'm2', role: 'system', content: '已结合「宋锦」工艺特性与白酒品牌的场景需求，生成 4 个设计方向。', timestamp: '14:32' },
    ],
    patterns: MOCK_PATTERNS, savedIds: ['p2'],
  },
  s4: {
    messages: [
      { id: 'm1', role: 'user',   content: '探索一套苏绣礼品系列，面向高端礼赠市场，需要 3-4 个产品形态', category: '苏绣', timestamp: '16:00' },
      { id: 'm2', role: 'system', content: '已基于「苏绣」工艺特性与高端礼赠场景，生成 4 个方向。', timestamp: '16:02' },
    ],
    patterns: MOCK_PATTERNS, savedIds: [],
  },
  s5: {
    messages: [
      { id: 'm1', role: 'user',   content: '博物馆文创系列纹样开发，需要覆盖云锦、宋锦、苏绣三种工艺，形成统一设计语言', category: '云锦', timestamp: '10:15' },
      { id: 'm2', role: 'system', content: '已为「博物馆文创系列」生成跨工艺统一设计方向。系列已保存至灵感纹库。', timestamp: '10:18' },
    ],
    patterns: MOCK_PATTERNS, savedIds: ['p1', 'p3'],
  },
};

// ── Image Zoom Modal ──────────────────────────────────────────────────────────

function ImageZoomModal({ pattern, isSaved, onToggleSave, onRegen, onClose }: {
  pattern: GeneratedPattern;
  isSaved: boolean;
  onToggleSave: () => void;
  onRegen: () => void;
  onClose: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center z-50 p-8"
      style={{ background: 'rgba(10,20,30,0.94)', backdropFilter: 'blur(14px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.92, y: 16 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.92, y: 16 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="max-w-3xl w-full rounded-3xl overflow-hidden shadow-2xl"
        style={{ background: '#0B1822' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="relative">
          <img src={pattern.imageUrl} alt={pattern.title}
            className="w-full object-cover" style={{ maxHeight: 500, objectFit: 'cover' }} />
          {/* Controls */}
          <div className="absolute top-4 right-4 flex gap-2">
            <button onClick={onClose}
              className="w-9 h-9 rounded-full flex items-center justify-center backdrop-blur"
              style={{ background: 'rgba(0,0,0,0.5)' }}>
              <X className="w-4 h-4 text-white/70" />
            </button>
          </div>
          {/* Info overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-6 py-5"
            style={{ background: 'linear-gradient(to top, rgba(11,24,34,0.95) 0%, rgba(11,24,34,0.5) 55%, transparent 100%)' }}>
            <p className="text-white mb-1.5" style={{ fontSize: 20, fontWeight: 600 }}>{pattern.title}</p>
            <p className="text-white/60 text-sm leading-relaxed mb-3">{pattern.desc}</p>
            <div className="flex flex-wrap gap-2">
              {pattern.tags.map(tag => (
                <span key={tag} className="text-xs px-2.5 py-1 rounded-full"
                  style={{ background: 'rgba(196,145,42,0.3)', color: '#F5D88A', backdropFilter: 'blur(4px)' }}>{tag}</span>
              ))}
              <span className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>{pattern.style}</span>
              <span className="text-xs px-2.5 py-1 rounded-full"
                style={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.55)' }}>{pattern.scene}</span>
            </div>
          </div>
        </div>
        {/* Actions */}
        <div className="flex items-center gap-3 px-6 py-4">
          <button onClick={onToggleSave}
            className="flex-1 py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all"
            style={isSaved
              ? { background: 'rgba(13,148,136,0.15)', color: '#2dd4bf', border: '1px solid rgba(13,148,136,0.3)' }
              : { background: 'linear-gradient(135deg, #C4912A, #D9A83C)', color: '#0B1822' }
            }>
            {isSaved ? <><BookmarkCheck className="w-4 h-4" /> 已收录至我的纹库</> : <><Bookmark className="w-4 h-4" /> 收录至我的纹库</>}
          </button>
          <button onClick={() => { onRegen(); onClose(); }}
            className="px-5 py-3 rounded-2xl text-sm flex items-center gap-2 transition-all"
            style={{ background: 'rgba(255,255,255,0.05)', color: 'rgba(255,255,255,0.55)', border: '1px solid rgba(255,255,255,0.09)' }}>
            <RotateCcw className="w-4 h-4" /> 再次生图
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

type GenState = 'idle' | 'analyzing' | 'matching' | 'generating' | 'done';

const GEN_STEPS: Record<GenState, string> = {
  idle:       '',
  analyzing:  '正在分析创作诉求与意象语义...',
  matching:   '正在匹配可用授权纹样与工艺参数...',
  generating: '正在智能生成非遗纹样方案...',
  done:       '生成完成，4 个方向可供选择',
};

export function ZhiHuiPage() {
  const { t, clearRedDot, addLibraryPattern, removeLibraryPattern, savedLibraryPatterns } = useApp();
  const navigate = useNavigate();
  const [inputValue, setInputValue]             = useState('');
  const [selectedCategory, setSelectedCategory] = useState('云锦');
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [showUploadMenu, setShowUploadMenu]     = useState(false);
  const [activeSession, setActiveSession]       = useState<string | null>('new');
  const [messages, setMessages]                 = useState<ConvMessage[]>([]);
  const [genState, setGenState]                 = useState<GenState>('idle');
  const [patterns, setPatterns]                 = useState<GeneratedPattern[]>([]);
  const [zoomPattern, setZoomPattern]           = useState<GeneratedPattern | null>(null);
  const [sessions, setSessions]                 = useState<Session[]>(MOCK_SESSIONS);
  const [newSessionAnim, setNewSessionAnim]     = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => { clearRedDot('zhihui'); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, patterns]);

  const isSavedGlobally = (id: string) => savedLibraryPatterns.some(p => p.id === id);

  const handleToggleSave = (pattern: GeneratedPattern) => {
    if (isSavedGlobally(pattern.id)) {
      removeLibraryPattern(pattern.id);
      toast.info(`已从我的纹样移除「${pattern.title}」`);
    } else {
      const now = new Date().toLocaleString('zh', {
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour: '2-digit', minute: '2-digit',
      }).replace(/\//g, '-');
      const entry: MyPattern = {
        id: pattern.id, title: pattern.title, desc: pattern.desc,
        tags: pattern.tags, imageUrl: pattern.imageUrl,
        savedAt: now, createdAt: now,
        source: 'zhihui', sourceLabel: '智绘AI',
        category: selectedCategory,
        style: '', material: '', colorTone: '',
        rightsStatus: 'none',
        copyrightStatus: 'none',
        published: false,
      };
      addLibraryPattern(entry);
      toast.success(`「${pattern.title}」已收录至我的纹样`, {
        description: '可前往「我的纹样」发起确权',
        action: { label: '前往纹样', onClick: () => navigate('/materials') },
      });
    }
  };

  const loadSession = (sessionId: string) => {
    const data = SESSION_CONVERSATIONS[sessionId];
    if (data) {
      setMessages(data.messages);
      setPatterns(data.patterns);
      setGenState('done');
    } else {
      setMessages([]); setPatterns([]); setGenState('idle');
    }
  };

  const handleNewSession = () => {
    if (messages.length > 0 && activeSession === 'new') {
      const title = (messages[0]?.content.slice(0, 18) ?? '新创作') + (messages[0]?.content.length > 18 ? '…' : '');
      const newId = `s_${Date.now()}`;
      setSessions(prev => [{
        id: newId, title, category: selectedCategory,
        time: new Date().toLocaleString('zh', {
          year: 'numeric', month: '2-digit', day: '2-digit',
          hour: '2-digit', minute: '2-digit',
        }).replace(/\//g, '-'),
        group: 'today',
      }, ...prev]);
      SESSION_CONVERSATIONS[newId] = { messages: [...messages], patterns: [...patterns], savedIds: [] };
    }
    setNewSessionAnim(true);
    setTimeout(() => setNewSessionAnim(false), 600);
    setActiveSession('new');
    setMessages([]); setPatterns([]); setGenState('idle'); setInputValue('');
    setTimeout(() => inputRef.current?.focus(), 100);
    toast.success(t('新创作空间已就绪', 'New session ready'), { duration: 1500 });
  };

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    const userMsg: ConvMessage = {
      id: Date.now().toString(), role: 'user', content: inputValue, category: selectedCategory,
      timestamp: new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setGenState('analyzing');

    for (const [step, delay] of [['analyzing', 900], ['matching', 1200], ['generating', 2000], ['done', 400]] as [GenState, number][]) {
      await new Promise(r => setTimeout(r, delay));
      setGenState(step);
    }

    setMessages(prev => [...prev, {
      id: (Date.now() + 1).toString(), role: 'system',
      content: `已基于您的创作方向，结合「${selectedCategory}」品类工艺规则与可用授权纹样，生成以下 4 个方向。`,
      timestamp: new Date().toLocaleTimeString('zh', { hour: '2-digit', minute: '2-digit' }),
    }]);
    setPatterns(MOCK_PATTERNS);
    toast.success(t('生成完成，4 个方向可供选择', 'Generated!'));
  };

  const handleRegen = (pattern: GeneratedPattern) => {
    toast.info(`正在重新生成「${pattern.title}」相近款...`);
    setTimeout(() => toast.success('相近款已生成'), 1800);
  };

  const isGenerating = genState !== 'idle' && genState !== 'done';

  const sessionGroups = [
    { key: 'today' as const, label: '今日', items: sessions.filter(s => s.group === 'today') },
    { key: 'week'  as const, label: '本周', items: sessions.filter(s => s.group === 'week')  },
    { key: 'month' as const, label: '本月', items: sessions.filter(s => s.group === 'month') },
  ];

  return (
    <div className="flex h-full" style={{ background: '#F5F0E8' }}>

      {/* ── Left: Session Sidebar ─────────────────────────────── */}
      <div className="w-56 flex-shrink-0 flex flex-col overflow-hidden"
        style={{ background: 'white', borderRight: '1px solid rgba(26,61,74,0.07)' }}>

        {/* New session button */}
        <div className="p-3 flex-shrink-0" style={{ borderBottom: '1px solid rgba(26,61,74,0.06)' }}>
          <motion.button
            onClick={handleNewSession} whileTap={{ scale: 0.97 }}
            animate={newSessionAnim ? { scale: [1, 0.96, 1.02, 1] } : {}}
            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm text-white"
            style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
            <Plus className="w-4 h-4" /> {t('新建创作', 'New')}
          </motion.button>
        </div>

        {/* Session list */}
        <div className="flex-1 overflow-y-auto px-2 py-2" style={{ scrollbarWidth: 'none' }}>
          {/* Current new session */}
          {activeSession === 'new' && (
            <div className="px-3 py-2 rounded-xl mb-2"
              style={{ background: 'rgba(196,145,42,0.07)', border: '1px solid rgba(196,145,42,0.18)' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C4912A] animate-pulse" />
                <span className="text-xs text-[#C4912A]" style={{ fontWeight: 500 }}>当前创作</span>
              </div>
              {messages.length > 0 && (
                <p className="text-[10px] text-[#9B9590] mt-0.5 truncate">{messages[0]?.content.slice(0, 22)}…</p>
              )}
            </div>
          )}

          {sessionGroups.map(group => group.items.length > 0 && (
            <div key={group.key} className="mb-3">
              <p className="text-[10px] px-2 mb-1" style={{ color: 'rgba(26,61,74,0.3)', letterSpacing: '0.06em' }}>
                {group.label}
              </p>
              {group.items.map(session => {
                const isActive = activeSession === session.id;
                const catStyle = CAT_COLORS[session.category] ?? CAT_COLORS['云锦'];
                return (
                  <button key={session.id}
                    onClick={() => { setActiveSession(session.id); loadSession(session.id); }}
                    className="w-full text-left px-3 py-2.5 rounded-xl mb-0.5 transition-all"
                    style={{
                      background: isActive ? '#F0E6D3' : 'transparent',
                      borderLeft: isActive ? '2px solid #C4912A' : '2px solid transparent',
                    }}>
                    <p className="text-xs text-[#1A3D4A] truncate mb-1.5"
                      style={{ fontWeight: isActive ? 500 : 400 }}>
                      {session.title}
                    </p>
                    {/* ② Always show category tag + time */}
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: catStyle.bg, color: catStyle.text }}>
                        {session.category}
                      </span>
                      <Clock className="w-2.5 h-2.5 text-[#C4A88A]" />
                      <span className="text-[10px] text-[#9B9590]">{session.time.slice(5)}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* ③ Sidebar bottom: removed Pro plan section ── */}
      </div>

      {/* ── Center: Creation Area ─────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Header — clean, no saved-count */}
        <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
          style={{ background: 'rgba(245,240,232,0.85)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#C4912A]" />
              <span className="text-[#1A3D4A]" style={{ fontSize: 18, fontWeight: 600 }}>智绘</span>
            </div>
            <p className="text-xs text-[#9B9590] mt-0.5">非遗纹样智能创作 · 云锦工艺</p>
          </div>
        </div>

        {/* Chat + results area */}
        <div className="flex-1 overflow-y-auto px-6 py-4" style={{ scrollbarWidth: 'thin' }}>

          {/* Empty state */}
          {messages.length === 0 && !isGenerating && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              className="flex flex-col items-center justify-center min-h-[60%] text-center">
              <div className="w-20 h-20 rounded-2xl mb-5 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(196,145,42,0.1), rgba(26,61,74,0.07))' }}>
                <Sparkles className="w-9 h-9 text-[#C4912A]" />
              </div>
              <h2 className="text-[#1A3D4A] mb-2">描述你的创意方向</h2>
              <p className="text-sm text-[#9B9590] max-w-sm leading-relaxed mb-8">
                AI 将基于云锦工艺规则生成 4 个纹样方向，点击图片放大欣赏，满意的方向可收录至我的纹库
              </p>
              <div className="w-full max-w-lg space-y-2">
                {SAMPLE_PROMPTS.map((p, i) => (
                  <motion.button key={i}
                    initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08 }}
                    onClick={() => setInputValue(p)}
                    className="w-full text-left px-4 py-3 rounded-2xl text-sm"
                    style={{ background: 'white', border: '1px solid rgba(26,61,74,0.07)', color: '#1A3D4A' }}
                    whileHover={{ borderColor: 'rgba(196,145,42,0.35)', y: -1 }}>
                    <span className="mr-2 text-[#C4912A]">→</span>{p}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Messages */}
          {messages.map(msg => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className={`mb-4 flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              {msg.role === 'system' && (
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
                  <Sparkles className="w-3.5 h-3.5 text-[#C4912A]" />
                </div>
              )}
              <div className={`max-w-2xl px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === 'user' ? 'text-white rounded-tr-sm' : 'text-[#1A3D4A] rounded-tl-sm'
              }`} style={msg.role === 'user'
                ? { background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }
                : { background: 'white', border: '1px solid rgba(26,61,74,0.07)' }}>
                {msg.role === 'user' && msg.category && (
                  <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full mb-2 mr-2"
                    style={{ background: 'rgba(196,145,42,0.2)', color: '#C4912A' }}>{msg.category}</span>
                )}
                {msg.content}
                <div className={`text-[10px] mt-1.5 ${msg.role === 'user' ? 'text-white/35' : 'text-[#9B9590]'}`}>
                  {msg.timestamp}
                </div>
              </div>
            </motion.div>
          ))}

          {/* Generation progress */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="mb-4 flex justify-start">
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mr-2.5 mt-0.5"
                  style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
                  <Sparkles className="w-3.5 h-3.5 text-[#C4912A]" />
                </div>
                <div className="px-4 py-3 rounded-2xl rounded-tl-sm text-sm"
                  style={{ background: 'white', border: '1px solid rgba(196,145,42,0.12)' }}>
                  <div className="flex items-center gap-2 text-[#1A3D4A]">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-[#C4912A]" />
                    {GEN_STEPS[genState]}
                  </div>
                  <div className="mt-2 space-y-1">
                    {(['analyzing', 'matching', 'generating'] as GenState[]).map((step, i) => {
                      const arr: GenState[] = ['analyzing', 'matching', 'generating'];
                      const ci = arr.indexOf(genState), si = arr.indexOf(step);
                      return (
                        <div key={step} className="flex items-center gap-2 text-xs">
                          <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                            si < ci ? 'bg-[#C4912A]' : si === ci ? 'bg-[#C4912A] animate-pulse' : 'bg-[rgba(26,61,74,0.12)]'
                          }`} />
                          <span className={si <= ci ? 'text-[#1A3D4A]' : 'text-[#9B9590]'}>
                            {['分析需求语义', '匹配授权纹样', '生成纹样方案'][i]}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── ④ Generated Patterns: 2×2, image-first, luxurious footer ── */}
          <AnimatePresence>
            {patterns.length > 0 && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
                <p className="text-xs text-[#9B9590] mb-4 px-0.5">4 个创作方向 · 点击图片查看大图</p>

                <div className="grid grid-cols-2 gap-4">
                  {patterns.map((pattern, i) => {
                    const saved = isSavedGlobally(pattern.id);
                    return (
                      <motion.div
                        key={pattern.id}
                        initial={{ opacity: 0, scale: 0.94 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1, type: 'spring', damping: 24, stiffness: 280 }}
                        className="group rounded-3xl overflow-hidden"
                        style={{
                          background: 'white',
                          border: saved
                            ? '2px solid rgba(13,148,136,0.45)'
                            : '1px solid rgba(196,145,42,0.12)',
                          boxShadow: saved
                            ? '0 0 0 3px rgba(13,148,136,0.07), 0 8px 32px rgba(26,61,74,0.1)'
                            : '0 4px 24px rgba(26,61,74,0.08)',
                        }}
                      >
                        {/* ① Image area: only zoom indicator, no bookmark on image */}
                        <div
                          className="relative overflow-hidden cursor-pointer"
                          style={{ paddingBottom: '76%' }}
                          onClick={() => setZoomPattern(pattern)}
                        >
                          <img
                            src={pattern.imageUrl}
                            alt={pattern.title}
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                          />

                          {/* Subtle bottom gradient for title readability */}
                          <div className="absolute inset-0"
                            style={{ background: 'linear-gradient(to top, rgba(11,20,30,0.72) 0%, rgba(11,20,30,0.05) 42%, transparent 100%)' }} />

                          {/* ① Zoom indicator: bottom-right corner (non-intrusive, conventional) */}
                          <div
                            className="absolute bottom-3 right-3 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                            style={{
                              background: 'rgba(255,255,255,0.18)',
                              backdropFilter: 'blur(8px)',
                              border: '1px solid rgba(255,255,255,0.25)',
                            }}
                          >
                            <ZoomIn className="w-3.5 h-3.5 text-white" />
                          </div>

                          {/* Title + tags on image */}
                          <div className="absolute bottom-0 left-0 right-0 px-4 py-3.5">
                            <p className="text-white text-sm mb-2" style={{ fontWeight: 600, textShadow: '0 1px 6px rgba(0,0,0,0.5)' }}>
                              {pattern.title}
                            </p>
                            <div className="flex flex-wrap gap-1.5">
                              {pattern.tags.map(tag => (
                                <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full"
                                  style={{ background: 'rgba(196,145,42,0.35)', color: '#F5D88A', backdropFilter: 'blur(4px)' }}>{tag}</span>
                              ))}
                            </div>
                          </div>
                        </div>

                        {/* ④ Footer: warm parchment, clear readable, luxurious gold accents */}
                        <div className="flex items-center gap-2 px-4 py-3"
                          style={{ background: 'linear-gradient(to right, #FDFAF5, #FBF7EE)', borderTop: '1px solid rgba(196,145,42,0.1)' }}>
                          {/* Style + Scene badges */}
                          <div className="flex items-center gap-1.5 flex-1 min-w-0">
                            <span className="text-[10px] px-2 py-1 rounded-full flex-shrink-0"
                              style={{ background: 'rgba(196,145,42,0.1)', color: '#B8821E' }}>
                              {pattern.style}
                            </span>
                            <span className="text-[10px] text-[#9B9590] truncate">{pattern.scene}</span>
                          </div>
                          {/* Save to Library button */}
                          <button
                            onClick={e => { e.stopPropagation(); handleToggleSave(pattern); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] transition-all flex-shrink-0"
                            style={saved
                              ? { background: 'rgba(13,148,136,0.1)', color: '#0d9488', border: '1px solid rgba(13,148,136,0.25)' }
                              : { background: 'rgba(196,145,42,0.08)', color: '#B8821E', border: '1px solid rgba(196,145,42,0.22)' }
                            }
                            onMouseEnter={e => {
                              if (!saved) {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(196,145,42,0.16)';
                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,145,42,0.4)';
                              }
                            }}
                            onMouseLeave={e => {
                              if (!saved) {
                                (e.currentTarget as HTMLElement).style.background = 'rgba(196,145,42,0.08)';
                                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,145,42,0.22)';
                              }
                            }}
                          >
                            {saved
                              ? <><BookmarkCheck className="w-3 h-3" /> 已收录</>
                              : <><Bookmark className="w-3 h-3" /> 收录至我的纹库</>
                            }
                          </button>
                          {/* Regen button */}
                          <button
                            onClick={e => { e.stopPropagation(); handleRegen(pattern); }}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] transition-all flex-shrink-0"
                            style={{
                              background: 'rgba(26,61,74,0.06)',
                              color: '#6B6558',
                              border: '1px solid rgba(26,61,74,0.1)',
                            }}
                            onMouseEnter={e => {
                              (e.currentTarget as HTMLElement).style.background = 'rgba(26,61,74,0.1)';
                              (e.currentTarget as HTMLElement).style.color = '#1A3D4A';
                            }}
                            onMouseLeave={e => {
                              (e.currentTarget as HTMLElement).style.background = 'rgba(26,61,74,0.06)';
                              (e.currentTarget as HTMLElement).style.color = '#6B6558';
                            }}
                          >
                            <RotateCcw className="w-3 h-3" /> 再次生图
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                <motion.p
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                  className="text-center text-[11px] mt-4 text-[#9B9590]"
                >
                  点击图片可放大查看 · 在大图中可收录至我的纹库
                </motion.p>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={bottomRef} />
        </div>

        {/* ── Input Bar ────────────────────────────────── */}
        <div className="px-5 py-3 flex-shrink-0"
          style={{ borderTop: '1px solid rgba(26,61,74,0.07)', background: 'rgba(245,240,232,0.9)' }}>
          <div className="flex items-end gap-2 p-2 rounded-2xl"
            style={{ background: 'white', border: '1px solid rgba(26,61,74,0.1)', boxShadow: '0 1px 12px rgba(26,61,74,0.06)' }}>

            {/* Upload menu */}
            <div className="relative flex-shrink-0">
              <button onClick={() => { setShowUploadMenu(!showUploadMenu); setShowCategoryMenu(false); }}
                className="w-9 h-9 rounded-xl flex items-center justify-center transition-all"
                style={{ background: showUploadMenu ? 'rgba(196,145,42,0.1)' : 'rgba(26,61,74,0.05)', color: '#1A3D4A' }}>
                <Plus className="w-4 h-4" />
              </button>
              <AnimatePresence>
                {showUploadMenu && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    className="absolute bottom-full mb-2 left-0 w-44 rounded-2xl shadow-xl overflow-hidden z-20"
                    style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)', boxShadow: '0 8px 32px rgba(13,37,53,0.12)' }}>
                    {UPLOAD_OPTIONS.map((opt, idx) => (
                      <button key={idx}
                        onClick={() => { setShowUploadMenu(false); toast.info(t(opt.label, opt.labelEn) + ' 功能即将开放'); }}
                        className="w-full flex items-center gap-2.5 px-3 py-2.5 hover:bg-[#F5F0E8] transition-colors text-xs text-[#1A3D4A] text-left">
                        <span className="text-[#C4912A]">{opt.icon}</span>
                        {t(opt.label, opt.labelEn)}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Category picker */}
            <div className="relative flex-shrink-0">
              <button onClick={() => { setShowCategoryMenu(!showCategoryMenu); setShowUploadMenu(false); }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs transition-all"
                style={{ background: 'rgba(196,145,42,0.08)', color: '#C4912A' }}>
                {selectedCategory} <ChevronDown className="w-3 h-3" />
              </button>
              <AnimatePresence>
                {showCategoryMenu && (
                  <motion.div initial={{ opacity: 0, y: 6, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.95 }}
                    className="absolute bottom-full mb-2 left-0 w-40 rounded-2xl shadow-xl overflow-hidden z-20"
                    style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)', boxShadow: '0 8px 32px rgba(13,37,53,0.12)' }}>
                    <div className="p-1.5">
                      <p className="text-[10px] px-2 py-1" style={{ color: 'rgba(26,61,74,0.3)', letterSpacing: '0.08em' }}>非遗品类</p>
                      {CATEGORIES.map(cat => (
                        <button key={cat.id}
                          onClick={() => {
                            if (cat.enabled) { setSelectedCategory(cat.name); setShowCategoryMenu(false); }
                            else { toast.info(`「${cat.name}」即将开放`); }
                          }}
                          className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition-colors ${
                            cat.enabled
                              ? selectedCategory === cat.name
                                ? 'bg-[#F0E6D3] text-[#C4912A] cursor-pointer'
                                : 'hover:bg-[#F5F0E8] text-[#1A3D4A] cursor-pointer'
                              : 'cursor-default'
                          }`}
                          style={{ color: !cat.enabled ? 'rgba(26,61,74,0.28)' : undefined }}>
                          <span>{cat.name}</span>
                          {!cat.enabled
                            ? <span className="text-[9px] px-1.5 py-0.5 rounded-full"
                                style={{ background: 'rgba(26,61,74,0.05)', color: 'rgba(26,61,74,0.28)' }}>即将开放</span>
                            : selectedCategory === cat.name
                              ? <span className="w-1.5 h-1.5 rounded-full bg-[#C4912A]" />
                              : null
                          }
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Textarea */}
            <textarea
              ref={inputRef}
              value={inputValue}
              onChange={e => setInputValue(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
              placeholder="描述纹样风格、用途场景、文化意象... (Shift+Enter 换行)"
              rows={1}
              className="flex-1 text-sm bg-transparent outline-none resize-none text-[#1A3D4A] placeholder:text-[#9B9590] py-2 leading-relaxed"
              style={{ maxHeight: 120, overflowY: 'auto', scrollbarWidth: 'none' }}
              onInput={e => {
                const el = e.target as HTMLTextAreaElement;
                el.style.height = 'auto';
                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
              }}
            />

            {/* Send */}
            <button onClick={handleSend} disabled={!inputValue.trim() || isGenerating}
              className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 transition-all"
              style={{
                background: inputValue.trim() && !isGenerating ? 'linear-gradient(135deg, #1A3D4A, #2A5568)' : 'rgba(26,61,74,0.07)',
                color: inputValue.trim() && !isGenerating ? 'white' : 'rgba(26,61,74,0.3)',
              }}>
              {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Zoom Modal */}
      <AnimatePresence>
        {zoomPattern && (
          <ImageZoomModal
            pattern={zoomPattern}
            isSaved={isSavedGlobally(zoomPattern.id)}
            onToggleSave={() => handleToggleSave(zoomPattern)}
            onRegen={() => handleRegen(zoomPattern)}
            onClose={() => setZoomPattern(null)}
          />
        )}
      </AnimatePresence>

      {/* Click-outside overlay for menus */}
      {(showCategoryMenu || showUploadMenu) && (
        <div className="fixed inset-0 z-10" onClick={() => { setShowCategoryMenu(false); setShowUploadMenu(false); }} />
      )}
    </div>
  );
}