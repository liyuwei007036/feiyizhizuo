import { useState, useEffect, useCallback, type ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import type { CopilotProposal } from '../context/AppContext';
import {
  Plus, User, Check, X, Zap, ChevronRight, ChevronLeft, Search,
  Sparkles, Trash2, AlertTriangle, Send,
  FileText, Package, Clock, ZoomIn, Loader2,
  Upload, Cpu, GitMerge, Phone, RefreshCw, Lock, Pencil,
  MapPin, Wallet,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────────

type DirectionType  = 'safe' | 'cultural' | 'surprise';
type PatternSource  = 'ai' | 'upload' | 'combined';
type EventType      = 'created' | 'direction_selected' | 'pdf_exported' | 'feedback_recorded' | 'signed';

interface Direction {
  id: string; type: DirectionType; typeLabel: string; letter: 'A'|'B'|'C';
  name: string; positioning: string; effectImage: string;
  suitableFor: string[]; budget: string;
  rightsStatus: 'available'|'pending'|'custom'; rightsLabel: string;
  craftTechnique: string; complexity: string; material: string;
  deliveryDays: string; estimatedPrice: string;
}
interface LockedPattern {
  id: string; name: string; imageUrl: string;
  source: PatternSource; sourceLabel: string;
}
interface ProposalEvent {
  id: string; type: EventType; timestamp: string; description: string;
}
interface Proposal {
  id: string; clientId: string; clientName: string; clientCompany: string; clientPhone?: string;
  title: string; purpose: string; concern: string; style: string;
  elements: string[]; targetProducts: string[];
  directions: Direction[];
  selectedDirectionId: string;
  lockedPattern: LockedPattern;
  addedAt: string; notes: string;
  events: ProposalEvent[];
  clientBudget?: string;
}
interface WizardState {
  selectedClientId: string | null;
  newClientName: string; newClientPhone: string;
  newClientBudget: string; newClientAddress: string;
  purpose: string; purposeCustom: string;
  concern: string; concernCustom: string;
  style: string; styleCustom: string;
  elements: string[]; elementsCustom: string;
  targetProduct: string; targetProductCustom: string;
  generatedDirs: Direction[];
}
interface ImageSlot { idx: number; url: string; name: string; loading: boolean; }
interface UploadedPattern { id: string; url: string; name: string; }

// ── Constants ─────────────────────────────────────────────────────────────────

const PURPOSES  = ['城市礼赠','博物馆文创','节庆礼盒','商务定制','空间软装','活动策展'];
const CONCERNS  = ['稳重安全','文化辨识度','年轻时尚','高级质感','可落地生产','差异化惊喜'];
const STYLES    = ['古典典藏','简雅现代','商务厚重','自由探索'];
const ELEMENTS  = ['云纹','龙凤纹','花卉纹','如意纹','山水纹','几何纹','文字印章','飞鸟走兽','宝相纹','吉祥八宝','莲荷纹','折枝草虫'];
const PRODUCTS  = ['高端礼盒','真丝丝巾','书签套装','艺术挂画','文具套装','空间软装','服饰应用','文化说明册'];

const PATTERN_POOL: Array<{ url: string; name: string }> = [
  { url:'https://images.unsplash.com/photo-1751202127096-9517c03939ee?w=400', name:'四合如意云纹' },
  { url:'https://images.unsplash.com/photo-1707569620487-1fcff5e22f9f?w=400', name:'宝相团花纹'   },
  { url:'https://images.unsplash.com/photo-1768943367297-129f5fb9d4ea?w=400', name:'缠枝花卉纹'   },
  { url:'https://images.unsplash.com/photo-1769710230436-db6353a08af4?w=400', name:'如意卷草纹'   },
  { url:'https://images.unsplash.com/photo-1763400234383-8b9ecbb9c043?w=400', name:'团龙祥云纹'   },
  { url:'https://images.unsplash.com/photo-1768895124631-213163435e30?w=400', name:'折枝牡丹纹'   },
];
const MOCK_UPLOADED: UploadedPattern[] = [
  { id:'mu1', url:'https://images.unsplash.com/photo-1769710230436-db6353a08af4?w=400', name:'传统锦纹-甲.png' },
  { id:'mu2', url:'https://images.unsplash.com/photo-1763400234383-8b9ecbb9c043?w=400', name:'传统锦纹-乙.png' },
  { id:'mu3', url:'https://images.unsplash.com/photo-1707569620487-1fcff5e22f9f?w=400', name:'传统锦纹-丙.png' },
];

const DIR_CFG: Record<DirectionType, { color: string; light: string; border: string }> = {
  safe:     { color:'#C4912A', light:'rgba(196,145,42,0.07)',  border:'rgba(196,145,42,0.3)'   },
  cultural: { color:'#1A3D4A', light:'rgba(26,61,74,0.06)',   border:'rgba(26,61,74,0.2)'     },
  surprise: { color:'#6B4F8A', light:'rgba(107,79,138,0.07)', border:'rgba(107,79,138,0.25)'  },
};
const DIR_TEMPLATES: Record<DirectionType, { typeLabel: string; letter: 'A'|'B'|'C'; effectImage: string }> = {
  safe:     { typeLabel:'稳妥成交型', letter:'A', effectImage:'https://images.unsplash.com/photo-1695916106317-87cfb79fb25f?w=600' },
  cultural: { typeLabel:'文化表达型', letter:'B', effectImage:'https://images.unsplash.com/photo-1763696118762-03f8fcfb8a8c?w=600' },
  surprise: { typeLabel:'视觉惊喜型', letter:'C', effectImage:'https://images.unsplash.com/photo-1761660450845-6c3aa8aaf43f?w=600' },
};

const now8 = () =>
  new Date().toLocaleString('zh',{ year:'numeric', month:'2-digit', day:'2-digit', hour:'2-digit', minute:'2-digit' }).replace(/\//g,'-');

function shufflePool() { return [...PATTERN_POOL].sort(() => Math.random() - 0.5); }

// ── Budget helpers ─────────────────────────────────────────────────────────────
/** 解析预算字符串 → { lo, hi }（单位：元），支持"万"单位与纯数字 */
function parseBudget(s: string): { lo: number; hi: number } | null {
  if (!s?.trim()) return null;
  const isWan = /万/.test(s);
  const mult  = isWan ? 10000 : 1;
  const nums  = (s.match(/[\d,]+(\.\d+)?/g) ?? [])
    .map(n => parseFloat(n.replace(/,/g, '')))
    .filter(n => n > 0 && !isNaN(n));
  if (!nums.length) return null;
  if (nums.length >= 2) {
    const a = nums[0] * mult, b = nums[1] * mult;
    return { lo: Math.min(a, b), hi: Math.max(a, b) };
  }
  return { lo: nums[0] * mult * 0.72, hi: nums[0] * mult * 1.28 };
}

/** 格式化定价区间 → "xx,xxx – yy,yyy" */
function fmtRange(lo: number, hi: number): string {
  const r = (n: number) => Math.round(n / 1000) * 1000;
  return `${r(lo).toLocaleString()} – ${r(hi).toLocaleString()}`;
}

// ── Seed Data ─────────────────────────────────────────────────────────────────

const SEED_PROPOSALS: Proposal[] = [
  {
    id:'seed_1', clientId:'c1', clientName:'李文创主任', clientCompany:'故宫博物院文创部',
    title:'博物馆文创提案 · 礼赠系列',
    purpose:'博物馆文创', concern:'文化辨识度', style:'古典典藏',
    elements:['云纹','如意纹','宝相纹'], targetProducts:['高端礼盒','真丝丝巾','书签套装'],
    addedAt:'2026-04-06 14:22', notes:'客户强调文化叙事性，送礼场合偏正式',
    selectedDirectionId:'seed_1_A',
    lockedPattern:{ id:'lp1', name:'四合如意云纹', imageUrl:'https://images.unsplash.com/photo-1751202127096-9517c03939ee?w=400', source:'ai', sourceLabel:'智绘AI生成' },
    events:[
      { id:'e1', type:'created',            timestamp:'2026-04-06 14:22', description:'提案已创建' },
      { id:'e2', type:'direction_selected', timestamp:'2026-04-06 15:30', description:'已选定方向A「云锦·典雅礼赠」，纹���「四合如意云纹」已锁定（智绘AI生成）' },
    ],
    directions:[
      { id:'seed_1_A', type:'safe',     typeLabel:'稳妥成交型', letter:'A', name:'云锦·典雅礼赠',  positioning:'经典四合如意云纹，金色线描勾勒，让客户\"送出去不丢人\"',          effectImage:'https://images.unsplash.com/photo-1695916106317-87cfb79fb25f?w=600', suitableFor:['政务礼赠','贵宾接待','节庆礼盒'],  budget:'45,000 – 80,000',  rightsStatus:'available', rightsLabel:'纹样已收录可用',    craftTechnique:'宋锦彩纬提花', complexity:'★★★☆☆ 中等', material:'桑蚕丝 · 金线', deliveryDays:'25–35 工作日', estimatedPrice:'45,000 – 85,000' },
      { id:'seed_1_B', type:'cultural', typeLabel:'文化表达型', letter:'B', name:'锦绣·文化叙事',  positioning:'以故宫文化符号为核心，突出\"可讲述性\"，彰显品味与文化自信',         effectImage:'https://images.unsplash.com/photo-1763696118762-03f8fcfb8a8c?w=600', suitableFor:['文博文创','品牌合作','文化展览'],  budget:'60,000 – 120,000', rightsStatus:'pending',   rightsLabel:'部分纹样待确权',    craftTechnique:'云锦妆花挖梭', complexity:'★★★★☆ 复杂', material:'桑蚕丝 · 金银线', deliveryDays:'40–55 工作日', estimatedPrice:'65,000 – 120,000' },
      { id:'seed_1_C', type:'surprise', typeLabel:'视觉惊喜型', letter:'C', name:'织语·新古典',    positioning:'传统云纹与当代设计语言融合，差异化出圈，适合有创新意愿的采购方',     effectImage:'https://images.unsplash.com/photo-1761660450845-6c3aa8aaf43f?w=600', suitableFor:['品牌联名','艺术展览','年轻受众'],  budget:'30,000 – 55,000',  rightsStatus:'custom',    rightsLabel:'需定制授权',        craftTechnique:'缂丝 + 现代印染', complexity:'★★★★★ 极复杂', material:'真丝 · 植物染料', deliveryDays:'50–70 工作日', estimatedPrice:'30,000 – 60,000' },
    ],
  },
  {
    id:'seed_2', clientId:'c2', clientName:'张院长助理', clientCompany:'敦煌研究院',
    title:'博物馆文创提案 · 华彩文化系列',
    purpose:'博物馆文创', concern:'稳重安全', style:'古典典藏',
    elements:['飞鸟走兽','云纹'], targetProducts:['高端礼盒','真丝丝巾','文化说明册'],
    addedAt:'2026-04-05 10:15', notes:'飞天纹样偏好强烈，但需确认授权路径',
    selectedDirectionId:'seed_2_B',
    lockedPattern:{ id:'lp2', name:'如意卷草纹', imageUrl:'https://images.unsplash.com/photo-1769710230436-db6353a08af4?w=400', source:'combined', sourceLabel:'AI+自传融合' },
    events:[
      { id:'e1', type:'created',            timestamp:'2026-04-05 10:15', description:'提案已创建' },
      { id:'e2', type:'direction_selected', timestamp:'2026-04-05 11:42', description:'已选定方向B「飞天·文博记忆」，纹样「如意卷草纹」已锁定（AI+自传融合）' },
    ],
    directions:[
      { id:'seed_2_A', type:'safe',     typeLabel:'稳妥成交型', letter:'A', name:'华彩·礼赠典藏',  positioning:'以经典敦煌色彩体系为主，稳重大气，适合正式礼赠场合',               effectImage:'https://images.unsplash.com/photo-1769710230436-db6353a08af4?w=600', suitableFor:['高端礼赠','外事接待','学术赠礼'],  budget:'40,000 – 80,000',  rightsStatus:'available', rightsLabel:'纹样已收录可用',    craftTechnique:'缂丝平纹组织', complexity:'★★★☆☆ 中等', material:'桑蚕丝 · 棉线', deliveryDays:'30–40 工作日', estimatedPrice:'40,000 – 80,000' },
      { id:'seed_2_B', type:'cultural', typeLabel:'文化表达型', letter:'B', name:'飞天·文博记忆',  positioning:'飞天纹样主体呈现，强调\"文化故事可讲\"，适合博物馆品牌建设',            effectImage:'https://images.unsplash.com/photo-1763400234383-8b9ecbb9c043?w=600', suitableFor:['文博文创','文化IP','研学纪念'],     budget:'60,000 – 100,000', rightsStatus:'pending',   rightsLabel:'飞天纹样需专项授权', craftTechnique:'蜀锦重纬斜纹', complexity:'★★★★☆ 复杂', material:'真丝 · 矿物颜料', deliveryDays:'45–60 工作日', estimatedPrice:'60,000 – 100,000' },
      { id:'seed_2_C', type:'surprise', typeLabel:'视觉惊喜型', letter:'C', name:'丝路·当代重构',  positioning:'以丝路元素为灵感，现代设计语言重构，适合创意文创产品线',               effectImage:'https://images.unsplash.com/photo-1768895124631-213163435e30?w=600', suitableFor:['创意文创','年轻市场','时尚联名'],  budget:'25,000 – 45,000',  rightsStatus:'custom',    rightsLabel:'需定制开发',        craftTechnique:'苏绣乱针绣法', complexity:'★★★★★ 极复杂', material:'蚕丝 · 植物染料', deliveryDays:'55–75 工作日', estimatedPrice:'28,000 – 50,000' },
    ],
  },
];

// ── Image Lightbox ─────────────────────────────────────────────────────────────

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-8"
      style={{ background:'rgba(0,0,0,0.9)' }} onClick={onClose}>
      <motion.div initial={{ scale:0.9 }} animate={{ scale:1 }} exit={{ scale:0.9 }}
        onClick={e => e.stopPropagation()} className="relative">
        <img src={src} alt="" className="max-h-[88vh] max-w-full rounded-2xl object-contain" style={{ boxShadow:'0 24px 80px rgba(0,0,0,0.5)' }} />
        <button onClick={onClose} className="absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center"
          style={{ background:'rgba(0,0,0,0.55)', backdropFilter:'blur(4px)' }}>
          <X className="w-4 h-4 text-white" />
        </button>
      </motion.div>
    </motion.div>
  );
}

// ── Pattern Confirm Modal (redesigned) ────────────────────────────────────────

function PatternConfirmModal({ direction, onConfirm, onClose, hasReplacement }: {
  direction: Direction;
  onConfirm: (p: LockedPattern) => void;
  onClose: () => void;
  hasReplacement?: boolean;
}) {
  const cfg = DIR_CFG[direction.type];
  const [source, setSource] = useState<PatternSource>('ai');
  const [slots, setSlots] = useState<ImageSlot[]>([]);
  const [selSlot, setSelSlot] = useState<number | null>(null);
  const [selUploadId, setSelUploadId] = useState<string | null>(null);
  const [combineFile, setCombineFile] = useState<UploadedPattern | null>(null);
  const [combineUploading, setCombineUploading] = useState(false);

  const SRCS: Array<{ key: PatternSource; label: string; icon: ReactNode }> = [
    { key:'ai',       label:'智绘AI生成',   icon:<Cpu      className="w-3.5 h-3.5" /> },
    { key:'upload',   label:'自主上传',     icon:<Upload   className="w-3.5 h-3.5" /> },
    { key:'combined', label:'AI+自传融合',  icon:<GitMerge className="w-3.5 h-3.5" /> },
  ];

  const runGenerate = useCallback(async () => {
    setSelSlot(null);
    setSlots([0,1,2,3].map(i => ({ idx:i, url:'', name:'', loading:true })));
    await new Promise(r => setTimeout(r, 1400));
    const pool = shufflePool().filter(p => p.url !== direction.effectImage);
    // Slot 0 始终与方向卡片图案保持一致（问题5）
    const slot0: ImageSlot = { idx:0, url:direction.effectImage, name:direction.name, loading:false };
    const rest  = pool.slice(0,3).map((p,i) => ({ idx:i+1, url:p.url, name:p.name, loading:false }));
    setSlots([slot0, ...rest]);
    setSelSlot(0); // 默认选中第一张
  }, [direction]);

  useEffect(() => {
    if (source === 'ai') { runGenerate(); }
    if (source === 'combined' && combineFile) { runGenerate(); }
    if (source !== 'ai' && source !== 'combined') setSlots([]);
  }, [source, combineFile]);

  const regenOne = async (idx: number) => {
    setSlots(p => p.map(s => s.idx === idx ? { ...s, loading:true } : s));
    if (selSlot === idx) setSelSlot(null);
    await new Promise(r => setTimeout(r, 900));
    const pick = shufflePool().find(p => !slots.find(s => s.url === p.url && s.idx !== idx)) ?? shufflePool()[0];
    setSlots(p => p.map(s => s.idx === idx ? { ...s, url:pick.url, name:pick.name, loading:false } : s));
  };

  const handleMockUpload = async () => {
    setCombineUploading(true);
    await new Promise(r => setTimeout(r, 1200));
    setCombineFile({ id:'uf1', url:MOCK_UPLOADED[0].url, name:'自有图案.png' });
    setCombineUploading(false);
  };

  const canConfirm =
    (source === 'ai' && selSlot !== null && slots[selSlot] && !slots[selSlot].loading) ||
    (source === 'upload' && selUploadId !== null) ||
    (source === 'combined' && selSlot !== null && combineFile && slots[selSlot] && !slots[selSlot].loading);

  const handleConfirm = () => {
    if (!canConfirm) return;
    if (source === 'upload') {
      const up = MOCK_UPLOADED.find(u => u.id === selUploadId)!;
      onConfirm({ id:`lp_${Date.now()}`, name:up.name.replace('.png',''), imageUrl:up.url, source:'upload', sourceLabel:'自主上传' });
    } else {
      const slot = slots[selSlot!];
      onConfirm({ id:`lp_${Date.now()}`, name:slot.name, imageUrl:slot.url, source, sourceLabel: SRCS.find(s=>s.key===source)!.label });
    }
  };

  return (
    <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
      className="fixed inset-0 z-40 flex items-center justify-center p-6"
      style={{ background:'rgba(13,37,53,0.65)', backdropFilter:'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale:0.95, y:16 }} animate={{ scale:1, y:0 }} exit={{ scale:0.95, y:16 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-lg max-h-[92vh] flex flex-col rounded-3xl overflow-hidden"
        style={{ background:'white', boxShadow:'0 24px 80px rgba(13,37,53,0.3)' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ background:cfg.light, borderBottom:`1px solid ${cfg.border}` }}>
          <div className="flex items-center gap-2">
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ background:cfg.color, color:'white', fontWeight:600 }}>{direction.typeLabel}</span>
            <span className="text-[#1A3D4A] text-sm" style={{ fontWeight:600 }}>纹样确认 · {direction.name}</span>
          </div>
          <button onClick={onClose} className="w-7 h-7 rounded-full flex items-center justify-center text-[#6B6558] hover:bg-white/60 transition-all">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth:'thin' }}>
          {hasReplacement && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl"
              style={{ background:'rgba(196,145,42,0.07)', border:'1px solid rgba(196,145,42,0.2)' }}>
              <AlertTriangle className="w-3.5 h-3.5 text-[#C4912A] flex-shrink-0" />
              <p className="text-xs text-[#C4912A]">选择此方向将替换当前已确认方向，纹样同步更新</p>
            </div>
          )}

          {/* Source tabs */}
          <div className="flex gap-2">
            {SRCS.map(s => (
              <button key={s.key} onClick={() => { setSource(s.key); setSelSlot(null); setSelUploadId(null); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
                style={{ background:source===s.key ? '#1A3D4A' : 'rgba(26,61,74,0.05)', color:source===s.key ? 'white' : '#1A3D4A', border:`1.5px solid ${source===s.key ? '#1A3D4A' : 'rgba(26,61,74,0.1)'}` }}>
                {s.icon}{s.label}
              </button>
            ))}
          </div>

          {/* ── AI generated: 2×2 grid ─── */}
          {(source === 'ai' || (source === 'combined' && combineFile)) && (
            <div>
              {source === 'combined' && combineFile && (
                <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-xl"
                  style={{ background:'rgba(107,79,138,0.06)', border:'1px solid rgba(107,79,138,0.15)' }}>
                  <img src={combineFile.url} alt="" className="w-8 h-8 rounded-lg object-cover" />
                  <div>
                    <p className="text-xs text-[#6B4F8A]" style={{ fontWeight:500 }}>已上传：{combineFile.name}</p>
                    <p className="text-[10px] text-[#9B9590]">以下为与智绘AI融合生成的结果</p>
                  </div>
                </div>
              )}
              <div className="flex items-center justify-between mb-2">
                <p className="text-[10px] text-[#9B9590] uppercase tracking-widest">选择纹样 · 点击选中，可单图重新生成</p>
                <button onClick={runGenerate} className="flex items-center gap-1 text-[10px] text-[#1A3D4A] hover:text-[#C4912A] transition-all">
                  <RefreshCw className="w-3 h-3" /> 全部重新生成
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {slots.map(slot => (
                  <div key={slot.idx} className="relative rounded-xl overflow-hidden aspect-square group cursor-pointer"
                    onClick={() => !slot.loading && setSelSlot(slot.idx)}
                    style={{ border: selSlot === slot.idx ? `2.5px solid ${cfg.color}` : '2.5px solid transparent', boxShadow: selSlot === slot.idx ? `0 2px 12px ${cfg.color}40` : 'none' }}>
                    {slot.loading ? (
                      <div className="w-full h-full flex flex-col items-center justify-center gap-2"
                        style={{ background:'rgba(26,61,74,0.05)' }}>
                        <Loader2 className="w-6 h-6 text-[#C4912A] animate-spin" />
                        <p className="text-[10px] text-[#9B9590]">生成中...</p>
                      </div>
                    ) : (
                      <>
                        <img src={slot.url} alt={slot.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        <div className="absolute inset-0" style={{ background:'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)' }} />
                        <div className="absolute bottom-0 left-0 right-0 px-2 pb-1.5">
                          <p className="text-[11px] text-white truncate" style={{ fontWeight:500, textShadow:'0 1px 3px rgba(0,0,0,0.5)' }}>{slot.name}</p>
                        </div>
                        {/* Re-generate button */}
                        <button onClick={e => { e.stopPropagation(); regenOne(slot.idx); }}
                          className="absolute top-1.5 right-1.5 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
                          style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(4px)' }}
                          title="重新生成此图">
                          <RefreshCw className="w-3.5 h-3.5 text-[#1A3D4A]" />
                        </button>
                        {selSlot === slot.idx && (
                          <div className="absolute top-1.5 left-1.5 w-6 h-6 rounded-full flex items-center justify-center"
                            style={{ background:cfg.color }}>
                            <Check className="w-3.5 h-3.5 text-white" />
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Combined: upload zone first ─── */}
          {source === 'combined' && !combineFile && (
            <div>
              <p className="text-xs text-[#6B4F8A] mb-3">先上传您的自有图案，再与智绘AI融合生成</p>
              <button onClick={handleMockUpload} disabled={combineUploading}
                className="w-full border-2 border-dashed rounded-2xl p-6 flex flex-col items-center gap-2 transition-all"
                style={{ borderColor:'rgba(107,79,138,0.3)', background:'rgba(107,79,138,0.03)', cursor:combineUploading?'not-allowed':'pointer' }}>
                {combineUploading ? (
                  <><Loader2 className="w-7 h-7 text-[#6B4F8A] animate-spin" /><p className="text-xs text-[#6B4F8A]">上传中...</p></>
                ) : (
                  <><Upload className="w-7 h-7 text-[#9B9590]" />
                  <p className="text-sm text-[#6B6558]">拖拽或点击上传自有图案</p>
                  <p className="text-[10px] text-[#9B9590]">支持 PNG / JPG / SVG · 最大 20MB</p></>
                )}
              </button>
            </div>
          )}

          {/* ── Upload tab ─── */}
          {source === 'upload' && (
            <div>
              <div className="w-full border-2 border-dashed rounded-2xl p-4 flex flex-col items-center gap-1.5 mb-4"
                style={{ borderColor:'rgba(26,61,74,0.15)', background:'rgba(26,61,74,0.02)' }}>
                <Upload className="w-6 h-6 text-[#9B9590]" />
                <p className="text-xs text-[#6B6558]">拖拽或点击上传纹样图案</p>
                <p className="text-[10px] text-[#9B9590]">支持 PNG / JPG / SVG</p>
              </div>
              <p className="text-[10px] text-[#9B9590] uppercase tracking-widest mb-2">最近上传</p>
              <div className="grid grid-cols-3 gap-2.5">
                {MOCK_UPLOADED.map(up => (
                  <button key={up.id} onClick={() => setSelUploadId(up.id)}
                    className="relative rounded-xl overflow-hidden aspect-square group"
                    style={{ border: selUploadId===up.id ? `2.5px solid ${cfg.color}` : '2.5px solid transparent' }}>
                    <img src={up.url} alt={up.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0" style={{ background:'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 50%)' }} />
                    <p className="absolute bottom-1 left-1 right-1 text-[10px] text-white truncate text-center" style={{ fontWeight:500 }}>{up.name.replace('.png','')}</p>
                    {selUploadId===up.id && (
                      <div className="absolute top-1.5 left-1.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background:cfg.color }}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warning */}
          <div className="flex items-start gap-2 px-3 py-2 rounded-xl"
            style={{ background:'rgba(239,68,68,0.05)', border:'1px solid rgba(239,68,68,0.12)' }}>
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-red-600 leading-relaxed">
              此纹样将作为最终产品图案，与实际交付产品上的图案保持完全一致，确认后纹样锁定
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 px-5 py-4 flex-shrink-0" style={{ borderTop:'1px solid rgba(26,61,74,0.07)' }}>
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-[#6B6558]"
            style={{ border:'1px solid rgba(26,61,74,0.12)' }}>取消</button>
          <button onClick={handleConfirm} disabled={!canConfirm}
            className="flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
            style={{ background:canConfirm ? `linear-gradient(135deg, ${cfg.color}, ${cfg.color}BB)` : 'rgba(26,61,74,0.08)', color:canConfirm ? 'white' : '#9B9590', fontWeight:500 }}>
            <Lock className="w-4 h-4" /> 锁定此纹样，确认方向
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── Direction Card (used in wizard review) ────────────────────────────────────

function DirectionCard({ dir, isSelected, onSelect, onUnlock, onZoom, confirmedImageUrl, locked }: {
  dir: Direction; isSelected: boolean;
  onSelect: () => void;
  onUnlock?: () => void;
  onZoom: (u: string) => void;
  confirmedImageUrl?: string;  // 选中后锁定的纹样图（问题6）
  locked?: boolean;            // 另一个方向已被选定，本卡片锁定不可操作（问题10）
}) {
  const cfg = DIR_CFG[dir.type];
  const displayImage = isSelected && confirmedImageUrl ? confirmedImageUrl : dir.effectImage;

  return (
    <motion.div
      whileHover={{ y: (!locked && !isSelected) ? -2 : 0 }}
      className="flex flex-col rounded-2xl overflow-hidden transition-all relative"
      style={{
        border: isSelected ? `2px solid ${cfg.color}` : '1.5px solid rgba(26,61,74,0.09)',
        background: isSelected ? cfg.light : 'white',
        boxShadow: isSelected ? `0 4px 20px ${cfg.color}22` : '0 1px 4px rgba(26,61,74,0.06)',
        flex: 1, minWidth: 0,
        opacity: locked ? 0.4 : 1,
        pointerEvents: locked ? 'none' : 'auto',
      }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5"
        style={{ background: isSelected ? cfg.light : 'rgba(26,61,74,0.02)', borderBottom: '1px solid rgba(26,61,74,0.06)' }}>
        <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: cfg.light, color: cfg.color, fontWeight: 600, border: `1px solid ${cfg.border}` }}>{dir.typeLabel}</span>
        <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs" style={{ background: cfg.color, color: 'white', fontWeight: 700 }}>{dir.letter}</span>
      </div>

      {/* Image — 显示锁定纹样（问题5/6） */}
      <div className="relative overflow-hidden group" style={{ height: 160 }}>
        <img src={displayImage} alt={dir.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,37,53,0.52) 0%, transparent 55%)' }} />
        <div className="absolute bottom-0 left-0 right-0 px-3 pb-2.5">
          <p className="text-white text-sm truncate" style={{ fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{dir.name}</p>
        </div>
        <button onClick={e => { e.stopPropagation(); onZoom(displayImage); }}
          className="absolute bottom-2.5 right-2.5 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
          style={{ background: 'rgba(255,255,255,0.85)', backdropFilter: 'blur(4px)' }}>
          <ZoomIn className="w-3.5 h-3.5 text-[#1A3D4A]" />
        </button>
        {isSelected && (
          <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: cfg.color }}>
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 px-3 py-2.5 gap-2">
        <p className="text-[11px] text-[#6B6558] leading-relaxed">{dir.positioning}</p>

        {/* 适用场景 */}
        <div className="flex flex-wrap gap-1">
          {dir.suitableFor.map(s => (
            <span key={s} className="text-[9px] px-1.5 py-0.5 rounded-full text-[#1A3D4A]"
              style={{ background: 'rgba(26,61,74,0.06)', border: '1px solid rgba(26,61,74,0.08)' }}>{s}</span>
          ))}
        </div>

        {/* AI 工艺测算信息（问题9） */}
        <div className="rounded-xl p-2.5" style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.07)' }}>
          <div className="flex items-center gap-1 mb-1.5">
            <Cpu className="w-3 h-3 text-[#C4912A]" />
            <span className="text-[9px] text-[#C4912A]" style={{ fontWeight: 600 }}>AI 工艺测算（根据制作工艺及市场行情）</span>
          </div>
          <div className="grid grid-cols-2 gap-x-2 gap-y-1">
            {[
              { label: '制作工艺', value: dir.craftTechnique },
              { label: '复杂度',   value: dir.complexity },
              { label: '主要材质', value: dir.material },
              { label: '交付周期', value: dir.deliveryDays },
            ].map(item => (
              <div key={item.label} className="flex flex-col">
                <span className="text-[8px] text-[#9B9590]">{item.label}</span>
                <span className="text-[10px] text-[#1A3D4A]" style={{ fontWeight: 500 }}>{item.value}</span>
              </div>
            ))}
          </div>
          <div className="flex items-center justify-between mt-1.5 pt-1.5" style={{ borderTop: '1px solid rgba(26,61,74,0.07)' }}>
            <span className="text-[8px] text-[#9B9590]">测算定价区间</span>
            <span className="text-[11px] text-[#C4912A]" style={{ fontWeight: 700 }}>¥ {dir.estimatedPrice}</span>
          </div>
        </div>

        {/* CTA 区 */}
        {isSelected ? (
          <div className="flex gap-1.5 mt-1 items-stretch">
            {/* 已选定 — 灰化、cursor-not-allowed，视觉上退为次要 */}
            <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs select-none cursor-not-allowed"
              style={{
                background: 'rgba(26,61,74,0.05)',
                color: 'rgba(107,101,88,0.45)',
                fontWeight: 500,
                border: '1px solid rgba(26,61,74,0.08)',
              }}>
              <Check className="w-3 h-3" /> 已选定此方向
            </div>
            {/* 取消 — 高亮主色，带阴影吸引点击 */}
            {onUnlock && (
              <button
                onClick={onUnlock}
                className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs transition-all hover:scale-105 active:scale-95"
                style={{
                  background: `linear-gradient(135deg, ${cfg.color}, ${cfg.color}CC)`,
                  color: 'white',
                  fontWeight: 600,
                  boxShadow: `0 3px 10px ${cfg.color}50`,
                  border: 'none',
                  whiteSpace: 'nowrap',
                }}
                title="取消选定，重新选择方向">
                <X className="w-3 h-3" /> 取消
              </button>
            )}
          </div>
        ) : (
          <button onClick={onSelect}
            className="w-full py-2 rounded-xl text-xs mt-1 transition-all hover:scale-[1.02]"
            style={{ background: 'transparent', color: cfg.color, border: `1.5px solid ${cfg.color}`, fontWeight: 600 }}>
            选择此方向 →
          </button>
        )}
      </div>
    </motion.div>
  );
}

// ── Confirmed Direction Card (detail view - redesigned, no letter badge) ───────

function ConfirmedDirectionCard({ dir, pattern, onZoom }: {
  dir: Direction; pattern: LockedPattern; onZoom: (u: string) => void;
}) {
  const cfg = DIR_CFG[dir.type];
  const rights = {
    available: { color:'#1A7A4A', bg:'rgba(26,122,74,0.08)', label:'纹样已收录可用', dot:'#1A7A4A' },
    pending:   { color:'#C4912A', bg:'rgba(196,145,42,0.08)', label:'部分纹样待确权', dot:'#C4912A' },
    custom:    { color:'#6B6558', bg:'rgba(107,101,88,0.08)', label:'需定制授权',     dot:'#6B6558' },
  }[dir.rightsStatus];

  return (
    <div className="rounded-2xl overflow-hidden" style={{ border:`1.5px solid ${cfg.color}28`, background:'white', boxShadow:`0 6px 32px ${cfg.color}12` }}>
      {/* Header - clean, no letter */}
      <div className="flex items-center gap-3 px-5 py-3.5"
        style={{ background:`linear-gradient(to right, ${cfg.light}, rgba(255,255,255,0))`, borderBottom:`1px solid ${cfg.border}` }}>
        <span className="text-xs px-2.5 py-1 rounded-full" style={{ background:cfg.color, color:'white', fontWeight:600 }}>{dir.typeLabel}</span>
        <span className="text-sm text-[#1A3D4A]" style={{ fontWeight:700 }}>{dir.name}</span>
        <span className="ml-auto flex items-center gap-1.5 text-[10px] px-2.5 py-1 rounded-full" style={{ background:'rgba(26,122,74,0.08)', color:'#1A7A4A', border:'1px solid rgba(26,122,74,0.15)' }}>
          <Check className="w-3 h-3" /> 历史提案
        </span>
      </div>

      {/* Body: two-column */}
      <div className="flex">
        {/* Left: effect image */}
        <div className="relative group flex-shrink-0" style={{ width:240 }}>
          <img src={dir.effectImage} alt={dir.name} className="w-full object-cover" style={{ height:240 }} />
          <div className="absolute inset-0" style={{ background:'linear-gradient(to top, rgba(13,37,53,0.4) 0%, transparent 50%)' }} />
          <button onClick={() => onZoom(dir.effectImage)}
            className="absolute bottom-3 right-3 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ background:'rgba(255,255,255,0.88)', backdropFilter:'blur(4px)' }}>
            <ZoomIn className="w-3.5 h-3.5 text-[#1A3D4A]" />
          </button>
          {/* Image label overlay */}
          <div className="absolute bottom-0 left-0 right-0 px-3 pb-3">
            <p className="text-white text-xs" style={{ fontWeight:600, textShadow:'0 1px 4px rgba(0,0,0,0.5)' }}>{dir.name}</p>
          </div>
        </div>

        {/* Right: direction info */}
        <div className="flex-1 p-5 flex flex-col gap-3.5 min-w-0">
          {/* Positioning */}
          <div>
            <p className="text-[10px] text-[#9B9590] mb-1 uppercase tracking-widest">设计定位</p>
            <p className="text-xs text-[#6B6558] leading-relaxed">{dir.positioning}</p>
          </div>

          {/* Suitable for */}
          <div>
            <p className="text-[10px] text-[#9B9590] mb-1.5 uppercase tracking-widest">适用场景</p>
            <div className="flex flex-wrap gap-1.5">
              {dir.suitableFor.map(s => (
                <span key={s} className="text-[10px] px-2 py-0.5 rounded-full" style={{ background:'rgba(26,61,74,0.06)', border:'1px solid rgba(26,61,74,0.08)', color:'#1A3D4A' }}>{s}</span>
              ))}
            </div>
          </div>

          {/* Budget + Rights */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-[#9B9590]">预算区间</span>
              <span className="text-sm text-[#1A3D4A]" style={{ fontWeight:700 }}>¥ {dir.budget}</span>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded-full" style={{ color:rights.color, background:rights.bg, fontWeight:500 }}>
              <span className="w-1.5 h-1.5 rounded-full inline-block mr-1" style={{ background:rights.dot }} />
              {dir.rightsLabel}
            </span>
          </div>

          {/* Locked pattern */}
          <div className="mt-auto p-3.5 rounded-2xl" style={{ background:`linear-gradient(135deg, rgba(26,61,74,0.03), rgba(26,61,74,0.06))`, border:'1px solid rgba(26,61,74,0.08)' }}>
            <p className="text-[10px] text-[#9B9590] mb-2 uppercase tracking-widest">已锁定纹样</p>
            <div className="flex items-center gap-3">
              <img src={pattern.imageUrl} alt={pattern.name}
                className="w-14 h-14 rounded-xl object-cover flex-shrink-0"
                style={{ border:`2px solid ${cfg.color}33`, boxShadow:`0 2px 8px ${cfg.color}20` }} />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[#1A3D4A] truncate" style={{ fontWeight:700 }}>{pattern.name}</p>
                <p className="text-[10px] text-[#6B6558] mt-0.5">{pattern.sourceLabel}</p>
              </div>
              <span className="flex items-center gap-1 text-[10px] px-2.5 py-1 rounded-full flex-shrink-0"
                style={{ background:'rgba(26,122,74,0.09)', color:'#1A7A4A', fontWeight:600, border:'1px solid rgba(26,122,74,0.15)' }}>
                <Lock className="w-2.5 h-2.5" /> 已锁定
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Requirement Summary Row ───────────────────────────────────────────────────

function RequirementSummaryRow({ proposal }: { proposal: Proposal }) {
  const items = [
    { icon:'📌', label:'用途', value:proposal.purpose },
    { icon:'🎯', label:'在意', value:proposal.concern },
    { icon:'🎨', label:'风格', value:proposal.style },
    { icon:'✨', label:'元素', value:proposal.elements.slice(0,4).join(' · ') },
    { icon:'📦', label:'品类', value:proposal.targetProducts.slice(0,3).join(' · ') },
  ].filter(i => i.value);
  return (
    <div className="flex flex-wrap gap-2 px-6 pb-3">
      {items.map(item => (
        <div key={item.label} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background:'rgba(26,61,74,0.05)', border:'1px solid rgba(26,61,74,0.08)' }}>
          <span style={{ fontSize:12 }}>{item.icon}</span>
          <span className="text-[10px] text-[#9B9590]">{item.label}</span>
          <span className="text-xs text-[#1A3D4A]" style={{ fontWeight:500 }}>{item.value}</span>
        </div>
      ))}
      {proposal.notes && (
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl"
          style={{ background:'rgba(196,145,42,0.06)', border:'1px solid rgba(196,145,42,0.12)' }}>
          <span style={{ fontSize:12 }}>💬</span>
          <span className="text-[10px] text-[#C4912A]">备注</span>
          <span className="text-xs text-[#6B6558] max-w-48 truncate">{proposal.notes}</span>
        </div>
      )}
    </div>
  );
}

// ── Proposal Detail View ───────────────────────────────────────────────────────

function ProposalDetailView({ proposal }: {
  proposal: Proposal;
}) {
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const dir = proposal.directions.find(d => d.id === proposal.selectedDirectionId)!;

  const handleExportPDF = () => {
    toast.success('PDF 已导出', { description: '提案已成功导出为PDF文件' });
  };

  return (
    <>
      <motion.div key={proposal.id} initial={{ opacity:0, x:12 }} animate={{ opacity:1, x:0 }}
        className="flex flex-col h-full overflow-hidden">

        {/* Section A */}
        <div className="px-6 py-4 flex-shrink-0" style={{ background:'rgba(245,240,232,0.7)', borderBottom:'1px solid rgba(26,61,74,0.07)' }}>
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-[#1A3D4A] truncate" style={{ fontSize:18, fontWeight:700 }}>{proposal.title}</h2>
              <div className="flex items-center gap-2 mt-1 text-xs text-[#6B6558] flex-wrap">
                <User className="w-3.5 h-3.5 text-[#9B9590] flex-shrink-0" /><span>{proposal.clientName}</span>
                {proposal.clientCompany && <><span className="text-[#C4A88A]">·</span><span className="truncate">{proposal.clientCompany}</span></>}
              </div>
            </div>
            <div className="flex items-center gap-3 flex-shrink-0">
              {/* Redesigned PDF export button */}
              <button onClick={handleExportPDF}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm transition-all group"
                style={{
                  background: 'linear-gradient(135deg, rgba(196,145,42,0.09), rgba(196,145,42,0.14))',
                  border: '1px solid rgba(196,145,42,0.32)',
                  color: '#A8741A',
                  fontWeight: 500,
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(196,145,42,0.15), rgba(196,145,42,0.22))';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,145,42,0.55)';
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 12px rgba(196,145,42,0.18)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.background = 'linear-gradient(135deg, rgba(196,145,42,0.09), rgba(196,145,42,0.14))';
                  (e.currentTarget as HTMLElement).style.borderColor = 'rgba(196,145,42,0.32)';
                  (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                }}>
                <FileText className="w-3.5 h-3.5" />
                导出 PDF
              </button>
              <div className="flex items-center gap-1 text-[10px] text-[#9B9590]"><Clock className="w-3 h-3" /><span>{proposal.addedAt.slice(0,10)}</span></div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth:'thin' }}>
          {/* 需求摘要 */}
          <div className="px-6 pt-4 pb-1">
            <p className="text-[10px] text-[#9B9590] mb-2.5 uppercase tracking-widest">客户需求摘要</p>
          </div>
          <RequirementSummaryRow proposal={proposal} />

          {/* Section B: 历史提案 */}
          <div className="px-6 pt-2 pb-6">
            <p className="text-[10px] text-[#9B9590] uppercase tracking-widest mb-3">历史提案</p>
            <ConfirmedDirectionCard dir={dir} pattern={proposal.lockedPattern} onZoom={url => setLightboxUrl(url)} />
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {lightboxUrl && <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      </AnimatePresence>
    </>
  );
}

// ── Create / Edit Wizard ───────────────────────────────────────────────────────

type WizardPhase = 'client' | 'brief' | 'generating' | 'review';

function OtherInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <motion.input initial={{ opacity:0 }} animate={{ opacity:1 }}
      value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder ?? '请输入…'}
      autoFocus
      className="mt-2 w-full text-xs border border-[rgba(196,145,42,0.3)] rounded-xl px-3 py-2 bg-white focus:outline-none focus:border-[#C4912A] text-[#1A3D4A] placeholder:text-[#9B9590]"
    />
  );
}

function CreateWizard({ clients, onAddClient, onDeleteClient, getClientProposalCount, onComplete, onClose, editingProposal, onUpdate }: {
  clients: ReturnType<typeof useApp>['persistentClients'];
  onAddClient: (name: string, phone: string, budget: string, address: string) => string;
  onDeleteClient: (id: string) => void;
  getClientProposalCount: (clientId: string) => number;
  onComplete: (data: WizardState & { clientId: string; clientName: string; confirmedDirectionId: string; confirmedPattern: LockedPattern }) => void;
  onClose: () => void;
  editingProposal?: Proposal;
  onUpdate?: (id: string, patch: Partial<Proposal>, clientPatch?: { name: string; phone: string; budget: string; address: string }) => void;
}) {
  const isEditing = !!editingProposal;

  const [phase, setPhase] = useState<WizardPhase>('client');
  const [ws, setWs] = useState<WizardState>(() => {
    if (editingProposal) {
      const initClient = clients.find(c => c.id === editingProposal.clientId);
      return {
        selectedClientId: editingProposal.clientId,
        newClientName: editingProposal.clientName,
        newClientPhone: initClient?.phone ?? '',
        newClientBudget: initClient?.budget ?? '',
        newClientAddress: initClient?.notes ?? '',
        purpose: editingProposal.purpose, purposeCustom: '',
        concern: editingProposal.concern, concernCustom: '',
        style: editingProposal.style, styleCustom: '',
        elements: editingProposal.elements, elementsCustom: '',
        targetProduct: editingProposal.targetProducts[0] ?? '',
        targetProductCustom: '',
        generatedDirs: editingProposal.directions,
      };
    }
    return {
      selectedClientId:null, newClientName:'', newClientPhone:'',
      newClientBudget:'', newClientAddress:'',
      purpose:'', purposeCustom:'', concern:'', concernCustom:'',
      style:'', styleCustom:'', elements:[], elementsCustom:'',
      targetProduct:'', targetProductCustom:'',
      generatedDirs:[],
    };
  });
  const [showNewForm, setShowNewForm]         = useState(false);
  const [clientSearch, setClientSearch]       = useState('');
  const [deletingId, setDeletingId]           = useState<string | null>(null);
  // Review phase
  const [reviewConfirmedDir, setReviewConfirmedDir] = useState<Direction | null>(() => {
    if (editingProposal) {
      return editingProposal.directions.find(d => d.id === editingProposal.selectedDirectionId) ?? null;
    }
    return null;
  });
  const [reviewConfirmedPattern, setReviewConfirmedPattern] = useState<LockedPattern | null>(() => {
    if (editingProposal) return editingProposal.lockedPattern;
    return null;
  });
  const [patternModalDir, setPatternModalDir]               = useState<Direction | null>(null);
  const [lightboxUrl, setLightboxUrl]                       = useState<string | null>(null);

  const filteredClients = clients.filter(c => {
    if (!clientSearch.trim()) return true;
    const q = clientSearch.toLowerCase();
    return c.name.includes(q) || c.phone?.includes(q);
  });
  const selectedClient  = clients.find(c => c.id === ws.selectedClientId);
  const canProceedClient = isEditing
    ? !!ws.newClientName.trim()
    : (!!ws.selectedClientId || (showNewForm && !!ws.newClientName.trim()));
  const ep = ws.purpose === '__other__' ? ws.purposeCustom : ws.purpose;
  const ec = ws.concern === '__other__' ? ws.concernCustom : ws.concern;
  const es = ws.style   === '__other__' ? ws.styleCustom   : ws.style;
  const etp = ws.targetProduct === '__other__' ? ws.targetProductCustom : ws.targetProduct;
  const canProceedBrief  = !!ep && !!ec && !!es && !!etp;
  const headerLabel = isEditing
    ? (phase === 'generating' ? '设计副驾·重新分析' : phase === 'review' ? '编辑提案·方向确认' : '编辑提案')
    : (phase === 'generating' ? '设计副驾·分析中' : phase === 'review' ? '设计副驾·方向确认' : '新建提案');

  const toggleElement = (el: string) =>
    setWs(p => ({ ...p, elements: p.elements.includes(el) ? p.elements.filter(x=>x!==el) : [...p.elements, el] }));

  const handleGenerate = async () => {
    setPhase('generating');
    // Reset confirmed state when regenerating
    setReviewConfirmedDir(null);
    setReviewConfirmedPattern(null);
    await new Promise(r => setTimeout(r, 1800));
    const names: Record<DirectionType,string> = { safe:`${ep}·稳妥方案`, cultural:`${ep}·文化叙事`, surprise:`${ep}·创意重构` };
    const positions: Record<DirectionType,string> = {
      safe:     `以${es}风格为主，${ec}优先，让客户\"送出去不丢人\"`,
      cultural: `以文化故事为核心，${es}呈现，强调可讲述性与品味表达`,
      surprise: `以差异化为导向，突破传统礼品形式，适合有创新意愿的品牌方`,
    };
    // ── 预算感知定价 ──────────────────────────────────────────────────────────
    // 优先取新建/编辑客户填写的预算，否则取已有客户记录
    const clientBudgetStr = ws.newClientBudget.trim() ||
      clients.find(c => c.id === ws.selectedClientId)?.budget?.trim() || '';
    const pb    = parseBudget(clientBudgetStr);
    const bMid  = pb ? (pb.lo + pb.hi) / 2 : null;

    /**
     * 目标品类对应的项目总价系数
     * - 空间软装面积大、用料多 → 高系数
     * - 书签/说明册单价低 → 低系数
     */
    const PROD_VAL: Record<string, number> = {
      '空间软装': 1.55, '服饰应用': 1.35, '高端礼盒': 1.15,
      '艺术挂画': 1.05, '真丝丝巾': 1.00, '文具套装': 0.72,
      '书签套装': 0.55, '文化说明册': 0.50,
    };
    const pv = PROD_VAL[etp] ?? 1.0;

    /**
     * 每个方向的工艺/材质基础配置
     *
     * ratioLo/Hi  — 相对预算中位数的价格比例
     *   safe:     保守方向，落在预算 50-88% 区间；宋锦材质成本中等（金线+10%）
     *   cultural: 文化旗舰，可到预算 80-122%；云锦金银线材质溢价最高（+28%）
     *   surprise: 实验性小范围交付，预算 28-55%；缂丝+数字印染工艺极复杂但
     *             交付量小，综合材质系数居中（+10%）
     *
     * 兜底 fLo/fHi — 无预算时的默认合理区间（非遗B2B最低可行单量成本）
     */
    type DirCostCfg = {
      craftTechnique: string; complexity: string; material: string; deliveryDays: string;
      ratioLo: number; ratioHi: number; matCoef: number;
      fLo: number; fHi: number;
    };
    const CRAFT_CFG: Record<DirectionType, DirCostCfg> = {
      safe: {
        craftTechnique: '宋锦彩纬提花', complexity: '★★★☆☆ 中等',
        material: '桑蚕丝 · 金线', deliveryDays: '25–35 工作日',
        ratioLo: 0.50, ratioHi: 0.88,
        matCoef: 1.10,  // 宋锦+金线，材质成本适中
        fLo: 35000, fHi: 75000,
      },
      cultural: {
        craftTechnique: '云锦妆花挖梭', complexity: '★★★★☆ 复杂',
        material: '桑蚕丝 · 金银线', deliveryDays: '40–55 工作日',
        ratioLo: 0.78, ratioHi: 1.22,
        matCoef: 1.28,  // 云锦+金银线，材质溢价最高
        fLo: 55000, fHi: 110000,
      },
      surprise: {
        craftTechnique: '缂丝 + 数字印染', complexity: '★★★★★ 极复杂',
        material: '真丝 · 天然植物染', deliveryDays: '50–70 工作日',
        ratioLo: 0.28, ratioHi: 0.55,
        matCoef: 1.12,  // 缂丝工艺极复杂但批量小、含数字印染降本
        fLo: 22000, fHi: 50000,
      },
    };

    /**
     * 综合测算：预算中位数 × 方向比例 × 材质系数 × 品类价值系数
     * 同时取 max(计算值, 兜底值) 保证不低于非遗最低可行成本
     */
    const calcPrice = (type: DirectionType): string => {
      const cfg = CRAFT_CFG[type];
      const coef = cfg.matCoef * pv;
      if (!bMid) return fmtRange(cfg.fLo * coef, cfg.fHi * coef);
      return fmtRange(
        Math.max(bMid * cfg.ratioLo * coef, cfg.fLo),
        Math.max(bMid * cfg.ratioHi * coef, cfg.fHi),
      );
    };

    const dirs: Direction[] = (['safe','cultural','surprise'] as DirectionType[]).map(type => ({
      id:`gen_${type}_${Date.now()}`, type, typeLabel:DIR_TEMPLATES[type].typeLabel, letter:DIR_TEMPLATES[type].letter,
      name:names[type], positioning:positions[type], effectImage:DIR_TEMPLATES[type].effectImage,
      suitableFor: etp ? [etp] : [],
      budget: calcPrice(type),
      rightsStatus:type==='safe' ? 'available' : type==='cultural' ? 'pending' : 'custom' as const,
      rightsLabel:type==='safe' ? '纹样已收录可用' : type==='cultural' ? '部分纹样待确权' : '需定制授权',
      craftTechnique: CRAFT_CFG[type].craftTechnique,
      complexity:     CRAFT_CFG[type].complexity,
      material:       CRAFT_CFG[type].material,
      deliveryDays:   CRAFT_CFG[type].deliveryDays,
      estimatedPrice: calcPrice(type),
    }));
    setWs(p => ({ ...p, generatedDirs:dirs }));
    setPhase('review');
    toast.success('已生成 3 个成交方向', { description:'请从下方选择一个方向并锁定纹样' });
  };

  const handleComplete = () => {
    if (!reviewConfirmedDir || !reviewConfirmedPattern) return;
    let clientId   = ws.selectedClientId ?? '';
    let clientName = isEditing ? ws.newClientName : (selectedClient?.name ?? ws.newClientName);
    if (!isEditing && !ws.selectedClientId && ws.newClientName.trim())
      clientId = onAddClient(ws.newClientName.trim(), ws.newClientPhone.trim(), ws.newClientBudget.trim(), ws.newClientAddress.trim());

    if (isEditing && onUpdate) {
      const effectivePurpose  = ws.purpose === '__other__' ? ws.purposeCustom : ws.purpose;
      const effectiveConcern  = ws.concern === '__other__' ? ws.concernCustom : ws.concern;
      const effectiveStyle    = ws.style   === '__other__' ? ws.styleCustom   : ws.style;
      const effectiveElements = ws.elements.includes('__other__')
        ? [...ws.elements.filter(e => e !== '__other__'), ws.elementsCustom].filter(Boolean)
        : ws.elements;
      const effectiveTarget   = ws.targetProduct === '__other__' ? ws.targetProductCustom : ws.targetProduct;
      onUpdate(editingProposal!.id, {
        clientId: editingProposal!.clientId,
        clientName: ws.newClientName,
        purpose: effectivePurpose, concern: effectiveConcern, style: effectiveStyle,
        elements: effectiveElements,
        targetProducts: effectiveTarget ? [effectiveTarget] : [],
        directions: ws.generatedDirs,
        selectedDirectionId: reviewConfirmedDir.id,
        lockedPattern: reviewConfirmedPattern,
      }, {
        name: ws.newClientName,
        phone: ws.newClientPhone,
        budget: ws.newClientBudget,
        address: ws.newClientAddress,
      });
    } else {
      onComplete({ ...ws, clientId, clientName, confirmedDirectionId:reviewConfirmedDir.id, confirmedPattern:reviewConfirmedPattern });
    }
  };

  return (
    <div className="flex flex-col h-full" style={{ background:'#FAFAF8' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0"
        style={{ borderBottom:'1px solid rgba(26,61,74,0.07)', background:'rgba(245,240,232,0.8)' }}>
        <div className="flex items-center gap-2">
          {isEditing ? <Pencil className="w-5 h-5 text-[#C4912A]" /> : <Sparkles className="w-5 h-5 text-[#C4912A]" />}
          <span className="text-[#1A3D4A]" style={{ fontSize:15, fontWeight:600 }}>{headerLabel}</span>
          {phase === 'generating' && <span className="w-4 h-4 border-2 border-[#1A3D4A]/20 border-t-[#C4912A] rounded-full animate-spin" />}
        </div>
        <button onClick={onClose} className="w-8 h-8 rounded-xl flex items-center justify-center text-[#6B6558] hover:bg-[rgba(26,61,74,0.06)] transition-all">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Body */}
      <div className={`flex-1 overflow-y-auto ${phase === 'review' ? 'px-4 py-4' : 'px-6 py-5'}`} style={{ scrollbarWidth:'thin' }}>
        <AnimatePresence mode="wait">

          {/* client */}
          {phase === 'client' && (
            <motion.div key="client" initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-16 }}>

              {/* ── EDIT MODE: show only editable form for current client ── */}
              {isEditing ? (
                <>
                  <p className="text-xs text-[#9B9590] mb-4">编辑客户信息 · 更新以下资料后继续</p>
                  <div className="rounded-2xl p-4 space-y-2.5"
                    style={{ background:'rgba(196,145,42,0.05)', border:'1.5px solid rgba(196,145,42,0.2)' }}>
                    <p className="text-[10px] text-[#C4912A] mb-1" style={{ fontWeight:600 }}>客户资料</p>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B9590]" />
                      <input value={ws.newClientName} onChange={e => setWs(p => ({ ...p, newClientName:e.target.value }))}
                        placeholder="联系人姓名（必填）"
                        className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl pl-9 pr-3 py-2 bg-white focus:outline-none focus:border-[#C4912A] text-[#1A3D4A]" />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B9590]" />
                      <input value={ws.newClientPhone} onChange={e => setWs(p => ({ ...p, newClientPhone:e.target.value }))}
                        placeholder="手机号（选填）" type="tel"
                        className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl pl-9 pr-3 py-2 bg-white focus:outline-none focus:border-[#C4912A] text-[#1A3D4A]" />
                    </div>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9B9590] select-none">¥</span>
                      <input value={ws.newClientBudget} onChange={e => setWs(p => ({ ...p, newClientBudget:e.target.value }))}
                        placeholder="预算范围（如：5 – 10 万）"
                        className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl pl-7 pr-3 py-2 bg-white focus:outline-none focus:border-[#C4912A] text-[#1A3D4A]" />
                    </div>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B9590]" />
                      <input value={ws.newClientAddress} onChange={e => setWs(p => ({ ...p, newClientAddress:e.target.value }))}
                        placeholder="联系地址（选填）"
                        className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl pl-9 pr-3 py-2 bg-white focus:outline-none focus:border-[#C4912A] text-[#1A3D4A]" />
                    </div>
                  </div>
                </>
              ) : (
                /* ── NEW MODE: client list + expandable new client form ── */
                <>
                  <p className="text-xs text-[#9B9590] mb-4">选择客户 · 为谁做这份提案？</p>
                  <div className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                    style={{ background:'rgba(26,61,74,0.05)', border:'1px solid rgba(26,61,74,0.08)' }}>
                    <Search className="w-3.5 h-3.5 text-[#9B9590]" />
                    <input value={clientSearch} onChange={e => setClientSearch(e.target.value)} placeholder="搜索客户..."
                      className="flex-1 text-xs bg-transparent outline-none text-[#1A3D4A] placeholder:text-[#9B9590]" />
                  </div>
                  <div className="space-y-2 mb-4">
                    {filteredClients.map(c => {
                      const isSel = ws.selectedClientId === c.id;
                      const isDel = deletingId === c.id;
                      return (
                        <div key={c.id} className="rounded-2xl overflow-hidden transition-all"
                          style={{ border:isDel ? '1.5px solid rgba(239,68,68,0.35)' : isSel ? '1.5px solid rgba(196,145,42,0.35)' : '1.5px solid rgba(26,61,74,0.07)', background:isDel ? 'rgba(239,68,68,0.03)' : isSel ? 'rgba(196,145,42,0.04)' : 'white' }}>
                          {!isDel ? (
                            <div className="flex items-center gap-3 px-3 py-2.5 group">
                              <button onClick={() => { setWs(p => ({ ...p, selectedClientId:c.id })); setShowNewForm(false); }} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-sm"
                                  style={{ background:isSel ? '#1A3D4A' : 'rgba(26,61,74,0.08)', color:isSel ? 'white' : '#1A3D4A', fontWeight:700 }}>{c.name[0]}</div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs text-[#1A3D4A] truncate" style={{ fontWeight:600 }}>{c.name}</p>
                                  {c.phone && <p className="text-[10px] text-[#6B6558]">{c.phone}</p>}
                                </div>
                                {isSel && <Check className="w-4 h-4 text-[#C4912A] flex-shrink-0" />}
                              </button>
                              <button onClick={() => {
                                  const cnt = getClientProposalCount(c.id);
                                  if (cnt > 0) {
                                    toast.error(`客户「${c.name}」已绑定 ${cnt} 份提案，无法删除`, { description: '请先删除该客户的所有关联提案后再操作' });
                                  } else {
                                    setDeletingId(c.id);
                                  }
                                }}
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-[#9B9590] hover:text-red-500 hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-all">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ) : (
                            <div className="p-3">
                              <p className="text-xs text-red-600 mb-2 flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" />确认删除「{c.name}」？关联提案记录将保留。</p>
                              <div className="flex gap-2">
                                <button onClick={() => setDeletingId(null)} className="flex-1 py-1.5 rounded-lg text-xs text-[#6B6558] bg-white" style={{ border:'1px solid rgba(26,61,74,0.12)' }}>取消</button>
                                <button onClick={() => { onDeleteClient(c.id); setDeletingId(null); if (ws.selectedClientId===c.id) setWs(p=>({...p,selectedClientId:null})); }} className="flex-1 py-1.5 rounded-lg text-xs text-white" style={{ background:'#DC2626' }}>确认删除</button>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                    {filteredClients.length === 0 && <p className="text-center text-xs text-[#9B9590] py-4">未找到匹配客户</p>}
                  </div>
                  {!showNewForm ? (
                    <button onClick={() => { setShowNewForm(true); setWs(p => ({ ...p, selectedClientId:null })); }}
                      className="w-full py-2.5 rounded-xl text-xs text-[#1A3D4A] flex items-center justify-center gap-1.5"
                      style={{ border:'1.5px dashed rgba(26,61,74,0.18)', background:'rgba(26,61,74,0.02)' }}>
                      <Plus className="w-3.5 h-3.5" /> 新建客户
                    </button>
                  ) : (
                    <motion.div initial={{ opacity:0, y:-6 }} animate={{ opacity:1, y:0 }}
                      className="rounded-2xl p-4 space-y-2.5" style={{ background:'rgba(196,145,42,0.05)', border:'1.5px solid rgba(196,145,42,0.2)' }}>
                      <p className="text-[10px] text-[#C4912A] mb-1" style={{ fontWeight:600 }}>新建客户</p>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B9590]" />
                        <input value={ws.newClientName} onChange={e => setWs(p => ({ ...p, newClientName:e.target.value }))}
                          placeholder="联系人姓名（必填）" autoFocus
                          className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl pl-9 pr-3 py-2 bg-white focus:outline-none focus:border-[#C4912A] text-[#1A3D4A]" />
                      </div>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B9590]" />
                        <input value={ws.newClientPhone} onChange={e => setWs(p => ({ ...p, newClientPhone:e.target.value }))}
                          placeholder="手机号（选填）" type="tel"
                          className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl pl-9 pr-3 py-2 bg-white focus:outline-none focus:border-[#C4912A] text-[#1A3D4A]" />
                      </div>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-[#9B9590] select-none">¥</span>
                        <input value={ws.newClientBudget} onChange={e => setWs(p => ({ ...p, newClientBudget:e.target.value }))}
                          placeholder="预算范围（如：5 – 10 万）"
                          className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl pl-7 pr-3 py-2 bg-white focus:outline-none focus:border-[#C4912A] text-[#1A3D4A]" />
                      </div>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#9B9590]" />
                        <input value={ws.newClientAddress} onChange={e => setWs(p => ({ ...p, newClientAddress:e.target.value }))}
                          placeholder="联系地址（选填）"
                          className="w-full text-sm border border-[rgba(26,61,74,0.12)] rounded-xl pl-9 pr-3 py-2 bg-white focus:outline-none focus:border-[#C4912A] text-[#1A3D4A]" />
                      </div>
                      <button onClick={() => setShowNewForm(false)} className="text-xs text-[#9B9590]">取消</button>
                    </motion.div>
                  )}
                </>
              )}
            </motion.div>
          )}

          {/* brief */}
          {phase === 'brief' && (
            <motion.div key="brief" initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-16 }}>
              <p className="text-xs text-[#9B9590] mb-5">描述需求 · 告诉副驾这次的背景（每项选1个即可）</p>
              {([
                { key:'purpose' as const, ck:'purposeCustom' as const, label:'用途场景',   options:PURPOSES },
                { key:'concern' as const, ck:'concernCustom' as const, label:'客户最在意', options:CONCERNS },
                { key:'style'   as const, ck:'styleCustom'   as const, label:'风格偏好',   options:STYLES   },
              ]).map(({ key, ck, label, options }) => (
                <div key={key} className="mb-5">
                  <p className="text-xs text-[#1A3D4A] mb-2" style={{ fontWeight:500 }}>{label} <span className="text-red-500 ml-0.5">*</span></p>
                  <div className="flex flex-wrap gap-2">
                    {options.map(opt => (
                      <button key={opt} onClick={() => setWs(p => ({ ...p, [key]:p[key]===opt ? '' : opt, [ck]:'' }))}
                        className="px-3 py-1.5 rounded-xl text-sm transition-all"
                        style={{ background:ws[key]===opt ? '#1A3D4A' : 'white', color:ws[key]===opt ? 'white' : '#1A3D4A', border:`1.5px solid ${ws[key]===opt ? '#1A3D4A' : 'rgba(26,61,74,0.12)'}` }}>
                        {ws[key]===opt && <Check className="w-3 h-3 inline mr-1" />}{opt}
                      </button>
                    ))}
                    <button onClick={() => setWs(p => ({ ...p, [key]:p[key]==='__other__' ? '' : '__other__' }))}
                      className="px-3 py-1.5 rounded-xl text-sm transition-all"
                      style={{ background:ws[key]==='__other__' ? 'rgba(196,145,42,0.12)' : 'white', color:'#C4912A', border:`1.5px solid ${ws[key]==='__other__' ? '#C4912A' : 'rgba(196,145,42,0.25)'}` }}>
                      {ws[key]==='__other__' && <Check className="w-3 h-3 inline mr-1" />}其他…
                    </button>
                  </div>
                  {ws[key]==='__other__' && <OtherInput value={ws[ck]} onChange={v => setWs(p => ({ ...p, [ck]:v }))} placeholder={`请输入${label}...`} />}
                </div>
              ))}
              {/* 期望元素 */}
              <div className="mb-5">
                <p className="text-xs text-[#1A3D4A] mb-2" style={{ fontWeight:500 }}>
                  期望元素{ws.elements.filter(e=>e!=='__other__').length > 0 && <span className="text-[#C4912A] ml-2">· 已选 {ws.elements.filter(e=>e!=='__other__').length} 项</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {ELEMENTS.map(el => {
                    const active = ws.elements.includes(el);
                    return (
                      <button key={el} onClick={() => toggleElement(el)}
                        className="px-3 py-1.5 rounded-xl text-sm transition-all"
                        style={{ background:active ? '#C4912A' : 'white', color:active ? 'white' : '#1A3D4A', border:`1.5px solid ${active ? '#C4912A' : 'rgba(26,61,74,0.12)'}` }}>
                        {active && <Check className="w-3 h-3 inline mr-1" />}{el}
                      </button>
                    );
                  })}
                  <button onClick={() => toggleElement('__other__')}
                    className="px-3 py-1.5 rounded-xl text-sm transition-all"
                    style={{ background:ws.elements.includes('__other__') ? 'rgba(196,145,42,0.12)' : 'white', color:'#C4912A', border:`1.5px solid ${ws.elements.includes('__other__') ? '#C4912A' : 'rgba(196,145,42,0.25)'}` }}>
                    {ws.elements.includes('__other__') && <Check className="w-3 h-3 inline mr-1" />}其他…
                  </button>
                </div>
                {ws.elements.includes('__other__') && <OtherInput value={ws.elementsCustom} onChange={v => setWs(p => ({ ...p, elementsCustom:v }))} placeholder="请输入期望元素，如：星辰、山岳..." />}
              </div>
              {/* 目标品类 - 单选 */}
              <div className="mb-4">
                <p className="text-xs text-[#1A3D4A] mb-2" style={{ fontWeight:500 }}>
                  目标品类 <span className="text-red-500 ml-0.5">*</span>
                  {ws.targetProduct && ws.targetProduct !== '__other__' && <span className="text-[#C4912A] ml-2">· 已选「{ws.targetProduct}」</span>}
                  {ws.targetProduct === '__other__' && ws.targetProductCustom && <span className="text-[#C4912A] ml-2">· 已选「{ws.targetProductCustom}」</span>}
                </p>
                <div className="flex flex-wrap gap-2">
                  {PRODUCTS.map(prod => {
                    const active = ws.targetProduct === prod;
                    return (
                      <button key={prod} onClick={() => setWs(prev => ({ ...prev, targetProduct: active ? '' : prod, targetProductCustom: '' }))}
                        className="px-3 py-1.5 rounded-xl text-sm transition-all"
                        style={{ background:active ? '#1A3D4A' : 'white', color:active ? 'white' : '#1A3D4A', border:`1.5px solid ${active ? '#1A3D4A' : 'rgba(26,61,74,0.12)'}` }}>
                        {active && <Check className="w-3 h-3 inline mr-1" />}{prod}
                      </button>
                    );
                  })}
                  <button onClick={() => setWs(prev => ({ ...prev, targetProduct: prev.targetProduct === '__other__' ? '' : '__other__', targetProductCustom: '' }))}
                    className="px-3 py-1.5 rounded-xl text-sm transition-all"
                    style={{ background:ws.targetProduct==='__other__' ? 'rgba(196,145,42,0.12)' : 'white', color:'#C4912A', border:`1.5px solid ${ws.targetProduct==='__other__' ? '#C4912A' : 'rgba(196,145,42,0.25)'}` }}>
                    {ws.targetProduct==='__other__' && <Check className="w-3 h-3 inline mr-1" />}其他…
                  </button>
                </div>
                {ws.targetProduct === '__other__' && (
                  <OtherInput value={ws.targetProductCustom} onChange={v => setWs(p => ({ ...p, targetProductCustom:v }))} placeholder="请输入目标品类，如：茶叶礼盒、瓷器套装..." />
                )}
              </div>
            </motion.div>
          )}

          {/* generating */}
          {phase === 'generating' && (
            <motion.div key="generating" initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background:'linear-gradient(135deg, rgba(196,145,42,0.12), rgba(26,61,74,0.08))' }}>
                <Loader2 className="w-8 h-8 text-[#C4912A] animate-spin" />
              </div>
              <p className="text-[#1A3D4A] mb-2" style={{ fontWeight:500 }}>设计副驾正在分析客户诉求...</p>
              <p className="text-xs text-[#6B6558] text-center">识别真实需求 → 匹配方向模板 → 生成可比较方案</p>
            </motion.div>
          )}

          {/* review: full 3 direction cards */}
          {phase === 'review' && (
            <motion.div key="review" initial={{ opacity:0, x:16 }} animate={{ opacity:1, x:0 }}>
              <p className="text-xs text-[#9B9590] mb-1">选择一个方向并锁定纹样 · 确认后生成提案</p>
              {reviewConfirmedDir && reviewConfirmedPattern && (
                <motion.div initial={{ opacity:0, y:-4 }} animate={{ opacity:1, y:0 }}
                  className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3"
                  style={{ background:'rgba(26,122,74,0.07)', border:'1px solid rgba(26,122,74,0.2)' }}>
                  <img src={reviewConfirmedPattern.imageUrl} alt="" className="w-6 h-6 rounded-lg object-cover" />
                  <span className="text-xs text-[#1A7A4A]" style={{ fontWeight:600 }}>
                    已确认方向{reviewConfirmedDir.letter}「{reviewConfirmedDir.name}」· 纹样「{reviewConfirmedPattern.name}」已锁定
                  </span>
                </motion.div>
              )}
              <div className="flex gap-3">
                {ws.generatedDirs.map(dir => {
                  const isSel = reviewConfirmedDir?.id === dir.id;
                  const isLocked = !!reviewConfirmedDir && !isSel; // 另一方向已选，本卡锁定（问题10）
                  return (
                    <DirectionCard key={dir.id} dir={dir}
                      isSelected={isSel}
                      onSelect={() => setPatternModalDir(dir)}
                      onUnlock={isSel ? () => { setReviewConfirmedDir(null); setReviewConfirmedPattern(null); } : undefined}
                      onZoom={url => setLightboxUrl(url)}
                      confirmedImageUrl={isSel && reviewConfirmedPattern ? reviewConfirmedPattern.imageUrl : undefined}
                      locked={isLocked}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* Footer */}
      {phase !== 'generating' && (
        <div className="px-6 py-4 flex-shrink-0" style={{ borderTop:'1px solid rgba(26,61,74,0.07)', background:'rgba(245,240,232,0.8)' }}>
          {phase === 'client' && (
            <div className="flex gap-3">
              <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-sm text-[#6B6558]" style={{ border:'1px solid rgba(26,61,74,0.12)' }}>取消</button>
              <button onClick={() => setPhase('brief')} disabled={!canProceedClient}
                className="flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background:canProceedClient ? 'linear-gradient(135deg, #1A3D4A, #2A5568)' : 'rgba(26,61,74,0.1)', color:canProceedClient ? 'white' : '#9B9590' }}>
                <Check className="w-4 h-4" /> 已选定客户，下一步
              </button>
            </div>
          )}
          {phase === 'brief' && (
            <div className="flex gap-3">
              <button onClick={() => setPhase('client')}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm text-[#6B6558] hover:text-[#1A3D4A] hover:bg-[rgba(26,61,74,0.05)] transition-all"
                style={{ border:'1px solid rgba(26,61,74,0.12)' }}>
                <ChevronLeft className="w-3.5 h-3.5" /> 上一步
              </button>
              <button onClick={handleGenerate} disabled={!canProceedBrief}
                className="flex-1 py-2.5 rounded-xl text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background:canProceedBrief ? 'linear-gradient(135deg, #C4912A, #A87920)' : 'rgba(26,61,74,0.1)', color:canProceedBrief ? 'white' : '#9B9590' }}>
                <Zap className="w-4 h-4" /> AI 生成方向
              </button>
            </div>
          )}
          {phase === 'review' && (
            <button onClick={handleComplete} disabled={!reviewConfirmedDir || !reviewConfirmedPattern}
              className="w-full py-3 rounded-2xl text-sm flex items-center justify-center gap-2 transition-all"
              style={{ background:(reviewConfirmedDir && reviewConfirmedPattern) ? 'linear-gradient(135deg, #1A3D4A, #2A5568)' : 'rgba(26,61,74,0.1)', color:(reviewConfirmedDir && reviewConfirmedPattern) ? 'white' : '#9B9590', fontWeight:500 }}>
              <Send className="w-4 h-4" /> {isEditing ? '确认更新提案' : '确认生成提案'}
            </button>
          )}
        </div>
      )}

      {/* Portals */}
      <AnimatePresence>
        {patternModalDir && (
          <PatternConfirmModal
            direction={patternModalDir}
            hasReplacement={!!reviewConfirmedDir && reviewConfirmedDir.id !== patternModalDir.id}
            onConfirm={pattern => {
              setReviewConfirmedDir(patternModalDir);
              setReviewConfirmedPattern(pattern);
              setPatternModalDir(null);
              toast.success(`方向${patternModalDir.letter}纹样已锁定`, { description: pattern.name });
            }}
            onClose={() => setPatternModalDir(null)}
          />
        )}
        {lightboxUrl && <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
      </AnimatePresence>
    </div>
  );
}

// ── Proposal Card (Grid View) ─────────────────────────────────────────────────

function ProposalCard({ proposal, onEdit, onDelete }: {
  proposal: Proposal;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const dir = proposal.directions.find(d => d.id === proposal.selectedDirectionId);
  const cfg = dir ? DIR_CFG[dir.type] : DIR_CFG.safe;

  const summaryItems = [
    { icon: '📌', label: '用途', value: proposal.purpose },
    { icon: '🎯', label: '在意', value: proposal.concern },
    { icon: '🎨', label: '风格', value: proposal.style },
    { icon: '✨', label: '元素', value: proposal.elements.slice(0, 3).join(' · ') },
    { icon: '📦', label: '品类', value: proposal.targetProducts.slice(0, 2).join(' · ') },
    ...(proposal.clientBudget ? [{ icon: '💰', label: '预算', value: `¥ ${proposal.clientBudget}` }] : []),
  ].filter(i => i.value);

  return (
    <>
    <motion.div
      whileHover={{ y: -2, boxShadow: '0 6px 24px rgba(26,61,74,0.11)' }}
      className="rounded-xl overflow-hidden transition-all"
      style={{ background: 'white', border: '1px solid rgba(26,61,74,0.09)', boxShadow: '0 1px 6px rgba(26,61,74,0.06)' }}
    >
      {/* Image header — compact */}
      {dir && (
        <div className="relative overflow-hidden group" style={{ height: 120 }}>
          <img src={dir.effectImage} alt={dir.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,37,53,0.78) 0%, rgba(13,37,53,0.1) 55%, transparent 100%)' }} />
          {/* Direction type badge top-left */}
          <span className="absolute top-2.5 left-2.5 text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: cfg.color, color: 'white', fontWeight: 600, backdropFilter: 'blur(2px)' }}>{dir.typeLabel}</span>
          {/* Direction name bottom-left */}
          <p className="absolute bottom-2.5 left-2.5 right-10 text-white text-xs truncate" style={{ fontWeight: 700, textShadow: '0 1px 4px rgba(0,0,0,0.4)' }}>{dir.name}</p>
          {/* Zoom button bottom-right */}
          <button
            onClick={e => { e.stopPropagation(); setLightboxUrl(dir.effectImage); }}
            className="absolute bottom-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}
            title="放大查看">
            <ZoomIn className="w-3 h-3 text-[#1A3D4A]" />
          </button>
        </div>
      )}

      {/* Body */}
      <div className="px-3 pt-2.5 pb-3">
        {confirmingDelete ? (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2 py-1">
            <p className="text-xs text-red-600 flex items-center gap-1.5">
              <AlertTriangle className="w-3 h-3 flex-shrink-0" />
              删除「{proposal.title.length > 18 ? proposal.title.slice(0, 18) + '…' : proposal.title}」？
            </p>
            <p className="text-[10px] text-[#9B9590]">删除后无法恢复</p>
            <div className="flex gap-1.5">
              <button onClick={e => { e.stopPropagation(); setConfirmingDelete(false); }}
                className="flex-1 py-1 rounded-lg text-[11px] text-[#6B6558]"
                style={{ border: '1px solid rgba(26,61,74,0.12)', background: 'white' }}>取消</button>
              <button onClick={e => { e.stopPropagation(); onDelete(); }}
                className="flex-1 py-1 rounded-lg text-[11px] text-white" style={{ background: '#DC2626' }}>确认删除</button>
            </div>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {/* Title + client */}
            <div>
              <h3 className="text-[#1A3D4A] truncate" style={{ fontSize: 13, fontWeight: 700 }}>{proposal.title}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <User className="w-2.5 h-2.5 text-[#9B9590] flex-shrink-0" />
                <span className="text-[11px] text-[#6B6558] flex-shrink-0">{proposal.clientName}</span>
                {proposal.clientCompany && (
                  <><span className="text-[#C4A88A] text-[11px]">·</span><span className="text-[11px] text-[#9B9590] truncate">{proposal.clientCompany}</span></>
                )}
              </div>
            </div>

            {/* Client summary tags — compact inline row */}
            {summaryItems.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {summaryItems.map(item => (
                  <span key={item.label} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                    style={{ background: 'rgba(26,61,74,0.05)', border: '1px solid rgba(26,61,74,0.07)' }}>
                    <span style={{ fontSize: 9 }}>{item.icon}</span>
                    <span className="text-[9px] text-[#9B9590]">{item.label}</span>
                    <span className="text-[9px] text-[#1A3D4A]" style={{ fontWeight: 600 }}>{item.value}</span>
                  </span>
                ))}
              </div>
            )}

            {/* Locked pattern — slim row */}
            {proposal.lockedPattern && (
              <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg"
                style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.07)' }}>
                <img src={proposal.lockedPattern.imageUrl} alt="" className="w-7 h-7 rounded-md object-cover flex-shrink-0"
                  style={{ border: `1.5px solid ${cfg.color}33` }} />
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#1A3D4A] truncate" style={{ fontWeight: 600 }}>{proposal.lockedPattern.name}</p>
                  <p className="text-[9px] text-[#9B9590]">{proposal.lockedPattern.sourceLabel}</p>
                </div>
                <span className="flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full flex-shrink-0"
                  style={{ background: 'rgba(26,122,74,0.08)', color: '#1A7A4A', fontWeight: 600, border: '1px solid rgba(26,122,74,0.12)' }}>
                  <Lock className="w-2 h-2" /> 已锁定
                </span>
              </div>
            )}

            {/* Footer: date + PDF + edit + delete */}
            <div className="flex items-center justify-between pt-1.5" style={{ borderTop: '1px solid rgba(26,61,74,0.06)' }}>
              <div className="flex items-center gap-1">
                <Clock className="w-2.5 h-2.5 text-[#C4A88A]" />
                <span className="text-[10px] text-[#9B9590]">{proposal.addedAt.slice(0, 10)}</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={e => { e.stopPropagation(); toast.success('PDF 已导出', { description: '提案已成功导出为PDF文件' }); }}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-md text-[11px] transition-all hover:scale-105"
                  style={{ background: 'rgba(196,145,42,0.09)', border: '1px solid rgba(196,145,42,0.25)', color: '#A8741A', fontWeight: 500 }}>
                  <FileText className="w-2.5 h-2.5" /> 导出PDF
                </button>
                <button onClick={e => { e.stopPropagation(); onEdit(); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: 'rgba(196,145,42,0.1)', color: '#C4912A' }}
                  title="编辑提案">
                  <Pencil className="w-2.5 h-2.5" />
                </button>
                <button onClick={e => { e.stopPropagation(); setConfirmingDelete(true); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center transition-all hover:scale-105"
                  style={{ background: 'rgba(239,68,68,0.09)', color: '#DC2626' }}
                  title="删除提案">
                  <Trash2 className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>

    {/* Image lightbox */}
    <AnimatePresence>
      {lightboxUrl && <ImageLightbox src={lightboxUrl} onClose={() => setLightboxUrl(null)} />}
    </AnimatePresence>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function DesignCopilotPage() {
  const { clearRedDot, persistentClients, setPersistentClients, addCopilotProposal } = useApp();
  const [proposals, setProposals] = useState<Proposal[]>(SEED_PROPOSALS);
  const [listSearch, setListSearch] = useState('');
  const [showWizard, setShowWizard] = useState(false);
  const [editingProposalId, setEditingProposalId] = useState<string | null>(null);

  useEffect(() => { clearRedDot('copilot'); }, []);

  const filtered = proposals.filter(p => {
    if (listSearch.trim()) {
      const q = listSearch.toLowerCase();
      return p.title.includes(q) || p.clientName.includes(q);
    }
    return true;
  });
  const editingProposal = editingProposalId ? proposals.find(p => p.id === editingProposalId) : undefined;

  const updateProposal = (id: string, patch: Partial<Proposal>) =>
    setProposals(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));

  const handleDeleteProposal = (id: string) => {
    setProposals(prev => prev.filter(p => p.id !== id));
    toast.success('提案已删除');
  };

  const handleAddClient = (name: string, phone: string, budget: string, address: string): string => {
    const id = `c_${Date.now()}`;
    setPersistentClients(prev => [{ id, name, company:'', industry:'', phone, intent:'中意向', stage:'待接触', budget, notes:address, lastContactAt:now8() }, ...prev]);
    toast.success(`客户「${name}」已创建`);
    return id;
  };

  const handleDeleteClient = (id: string) => {
    const cnt = proposals.filter(p => p.clientId === id).length;
    if (cnt > 0) {
      toast.error('无法删除该客户', { description: `该客户已绑定 ${cnt} 份提案，请先删除关联提案` });
      return;
    }
    setPersistentClients(prev => prev.filter(c => c.id !== id));
    toast.success('客户已删除');
  };

  const getClientProposalCount = (clientId: string) => proposals.filter(p => p.clientId === clientId).length;

  const handleWizardComplete = (data: WizardState & { clientId: string; clientName: string; confirmedDirectionId: string; confirmedPattern: LockedPattern }) => {
    const effectivePurpose  = data.purpose === '__other__' ? data.purposeCustom : data.purpose;
    const effectiveConcern  = data.concern === '__other__' ? data.concernCustom : data.concern;
    const effectiveStyle    = data.style   === '__other__' ? data.styleCustom   : data.style;
    const effectiveElements = data.elements.includes('__other__')
      ? [...data.elements.filter(e => e !== '__other__'), data.elementsCustom].filter(Boolean)
      : data.elements;
    const effectiveTarget   = data.targetProduct === '__other__' ? data.targetProductCustom : data.targetProduct;
    const confirmedDir = data.generatedDirs.find(d => d.id === data.confirmedDirectionId)!;
    const clientCompany = persistentClients.find(c => c.id === data.clientId)?.company ?? '';

    const newProposal: Proposal = {
      id:`prop_${Date.now()}`, clientId:data.clientId, clientName:data.clientName, clientCompany,
      title:`${effectivePurpose}提案`,
      clientBudget: data.newClientBudget?.trim() || persistentClients.find(c => c.id === data.clientId)?.budget || '',
      purpose:effectivePurpose, concern:effectiveConcern, style:effectiveStyle,
      elements:effectiveElements, targetProducts: effectiveTarget ? [effectiveTarget] : [],
      directions:data.generatedDirs,
      selectedDirectionId:data.confirmedDirectionId,
      lockedPattern:data.confirmedPattern,
      addedAt:now8(), notes:'',
      events:[
        { id:'e1', type:'created',            timestamp:now8(), description:'提案已创建' },
        { id:'e2', type:'direction_selected', timestamp:now8(), description:`已选定方向${confirmedDir.letter}「${confirmedDir.name}」，纹样「${data.confirmedPattern.name}」已锁定（${data.confirmedPattern.sourceLabel}）` },
      ],
    };
    setProposals(prev => [newProposal, ...prev]);
    setShowWizard(false);
    const ctx: CopilotProposal = {
      id:newProposal.id, clientId:newProposal.clientId, title:newProposal.title,
      clientName:newProposal.clientName, clientCompany:'', directionType:confirmedDir.typeLabel,
      summary:effectivePurpose, patterns:[], products: effectiveTarget ? [effectiveTarget] : [],
      budget:confirmedDir.budget, addedAt:newProposal.addedAt, status:'draft',
    };
    addCopilotProposal(ctx);
    toast.success('提案已生成', { description:'可在提案列表中查看并导出PDF' });
  };

  const handleEditUpdate = (id: string, patch: Partial<Proposal>, clientPatch?: { name: string; phone: string; budget: string; address: string }) => {
    updateProposal(id, patch);
    if (clientPatch && patch.clientId) {
      setPersistentClients(prev => prev.map(c =>
        c.id === patch.clientId ? { ...c, name: clientPatch.name, phone: clientPatch.phone, budget: clientPatch.budget, notes: clientPatch.address } : c
      ));
    }
    setEditingProposalId(null);
    setShowWizard(false);
    toast.success('提案已更新');
  };

  const handleStartEdit = (proposalId: string) => {
    setEditingProposalId(proposalId);
    setShowWizard(true);
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#F5F0E8' }}>

      {/* ── Top header bar ── */}
      {showWizard ? (
        <div className="px-6 py-3 flex items-center gap-3 flex-shrink-0"
          style={{ background: 'rgba(245,240,232,0.95)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          <button
            onClick={() => { setShowWizard(false); setEditingProposalId(null); }}
            className="flex items-center gap-1.5 text-sm text-[#6B6558] hover:text-[#1A3D4A] transition-colors">
            <ChevronLeft className="w-4 h-4" /> 返回列表
          </button>
          <span className="text-[rgba(26,61,74,0.22)]">·</span>
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#C4912A]" />
            <span className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>
              {editingProposalId ? '编辑提案' : '新建提案'}
            </span>
          </div>
        </div>
      ) : (
        <div className="flex-shrink-0 px-6 py-4"
          style={{ background: 'rgba(245,240,232,0.95)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          <div className="flex items-start justify-between mb-3">
            <div>
              <div className="flex items-center gap-2.5 mb-0.5">
                <h1 className="text-[#1A3D4A]" style={{ fontSize: 18, fontWeight: 700 }}>设计提案 · 提案工作台</h1>
                <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
                  style={{ background: '#1A3D4A', fontWeight: 600 }}>{filtered.length} 份</span>
              </div>
              <p className="text-xs text-[#9B9590] mt-0.5">将模糊客户需求转化为可成交方案，每一份提案都是一次精准成交</p>
            </div>
            <button
              onClick={() => { setShowWizard(true); setEditingProposalId(null); }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm text-white flex-shrink-0 transition-all"
              style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
              <Plus className="w-4 h-4" /> 新建提案
            </button>
          </div>
          {/* search bar removed per UX review */}
        </div>
      )}

      {/* ── Content area ── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">

          {/* Wizard */}
          {showWizard ? (
            <motion.div key="wizard"
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
              className="h-full overflow-hidden">
              <CreateWizard
                clients={persistentClients}
                onAddClient={handleAddClient}
                onDeleteClient={handleDeleteClient}
                getClientProposalCount={getClientProposalCount}
                onComplete={handleWizardComplete}
                onClose={() => { setShowWizard(false); setEditingProposalId(null); }}
                editingProposal={editingProposal}
                onUpdate={handleEditUpdate}
              />
            </motion.div>

          /* Card grid */
          ) : (
            <motion.div key="grid"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="h-full overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
              {filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center px-12">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(196,145,42,0.08)' }}>
                    <Sparkles className="w-8 h-8 text-[#C4912A]" />
                  </div>
                  <p className="text-[#1A3D4A] mb-2" style={{ fontWeight: 500 }}>
                    {listSearch ? '未找到匹配提案' : '暂无历史提案'}
                  </p>
                  <p className="text-sm text-[#9B9590] max-w-xs mb-5 leading-relaxed">
                    {listSearch
                      ? '尝试更换搜索词，或清空搜索查看全部提案'
                      : '提案不是展示页，而是把模糊需求变成可成交方案的中间决策界面'}
                  </p>
                  {!listSearch && (
                    <button onClick={() => setShowWizard(true)}
                      className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm text-white"
                      style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
                      <Plus className="w-4 h-4" /> 新建第一份提案
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-6">
                  <div className="grid grid-cols-3 gap-4">
                    {filtered.map(p => (
                      <ProposalCard
                        key={p.id}
                        proposal={p}
                        onEdit={() => handleStartEdit(p.id)}
                        onDelete={() => handleDeleteProposal(p.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </div>
  );
}
