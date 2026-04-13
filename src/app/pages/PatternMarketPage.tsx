import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useApp } from '../context/AppContext';
import {
  Search, X, ZoomIn, Clock, FileText, User, ChevronDown,
  ShieldCheck, Award, Check, Lock, Sparkles, Brain, FolderUp,
  CheckCircle2, XCircle, Timer, Building, Plus, Info, Eye,
  ChevronRight, Edit3, Store, Tag, Globe, AlertTriangle,
  Hourglass, Copy, Package, MapPin, Layers, Coins, RotateCcw,
  Fingerprint, QrCode, Stamp, BarChart3, Percent, TrendingUp,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

type PublishStatus = 'on_sale' | 'locked' | 'off_shelf';
type LicenseTemplate = 'project' | 'annual' | 'limited';
type OrderStatus = 'submitted' | 'approved_pending_pay' | 'rejected' | 'expired' | 'paid' | 'completed';
type MarketTab = 'all' | 'mine' | 'applied' | 'pending';

interface LicenseOption { type: LicenseTemplate; label: string; price: number; }

interface MarketPattern {
  id: string;
  ownerId: string;
  ownerName: string;
  title: string;
  imageUrl: string;
  category: string;
  style: string;
  material: string;
  colorTone: string;
  technique: string;
  desc: string;
  innovationPoints: string;
  adaptProducts: string;
  rightsStatus: 'none' | 'done';
  copyrightStatus: 'none' | 'applied' | 'done';
  publishStatus: PublishStatus;
  licenses: LicenseOption[];
  publishedAt: string;
  certNo?: string;
  isAllowDerivative: boolean;
  isAllowCommercial: boolean;
}

interface LicenseOrder {
  id: string;
  orderNo: string;
  patternId: string;
  patternTitle: string;
  patternImage: string;
  sellerId: string;
  sellerName: string;
  buyerName: string;
  template: LicenseTemplate;
  templateLabel: string;
  purpose: string;
  entity: string;
  productCategory: string;
  channel: string;
  region: string;
  allowDerivative: boolean;
  projectName?: string;
  quantityLimit?: number;
  price: number;
  status: OrderStatus;
  appliedAt: string;
  approvedAt?: string;
  payDeadline?: number;
  paidAt?: string;
  rejectReason?: string;
  direction: 'buy' | 'sell';
}

const MY_USER_ID = 'me';
const MY_USER_NAME = '张设计师';

// ── Mock Data ─────────────────────────────────────────────────────────────────

const APPROVED_DEADLINE = Date.now() + 90 * 60 * 1000;

const SEED_PATTERNS: MarketPattern[] = [
  {
    id: 'mp1', ownerId: MY_USER_ID, ownerName: MY_USER_NAME,
    title: '金云纹团花锦',
    imageUrl: 'https://images.unsplash.com/photo-1773394175834-2c407177ddcf?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    category: '云锦', style: '古典典藏', material: '桑蚕丝', colorTone: '金色·米白',
    technique: '妆花挖梭工艺',
    desc: '以四合如意云纹为主体，金线双勾轮廓，米白底色铺陈，整体呈现典雅礼赠格调。',
    innovationPoints: '传统云纹骨架与现代构成比例融合，适配品牌VI系统。',
    adaptProducts: '高端礼盒包装、真丝丝巾、商务笔记本封面',
    rightsStatus: 'done', copyrightStatus: 'done',
    publishStatus: 'on_sale', certNo: 'EC-2026-1021',
    licenses: [
      { type: 'project', label: '单项目授权', price: 1200 },
      { type: 'annual', label: '年度授权', price: 3000 },
      { type: 'limited', label: '限量授权', price: 2160 },
    ],
    publishedAt: '2026-03-20', isAllowDerivative: true, isAllowCommercial: true,
  },
  {
    id: 'mp2', ownerId: MY_USER_ID, ownerName: MY_USER_NAME,
    title: '飞天仙鹤宋锦',
    imageUrl: 'https://images.unsplash.com/photo-1702633958543-8e91aacb805e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    category: '宋锦', style: '文化叙事', material: '蚕丝·棉', colorTone: '藏青·金',
    technique: '宋锦彩纬显花',
    desc: '飞天造型与仙鹤纹融合，以藏青为底，金色彩纬显花，画面灵动大气。',
    innovationPoints: '将飞天壁画语言转化为可量产织造纹样，兼顾文化深度与商业适用性。',
    adaptProducts: '文博礼品、高端家纺、文化演出服装',
    rightsStatus: 'done', copyrightStatus: 'applied',
    publishStatus: 'locked', certNo: 'EC-2026-1045',
    licenses: [
      { type: 'project', label: '单项目授权', price: 900 },
      { type: 'annual', label: '年度授权', price: 2250 },
    ],
    publishedAt: '2026-03-28', isAllowDerivative: false, isAllowCommercial: true,
  },
  {
    id: 'mp3', ownerId: MY_USER_ID, ownerName: MY_USER_NAME,
    title: '莲花水纹缂丝',
    imageUrl: 'https://images.unsplash.com/photo-1736506159866-1d0c2f14e650?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    category: '缂丝', style: '简雅现代', material: '桑蚕丝', colorTone: '粉白·翠绿',
    technique: '缂丝戗色',
    desc: '以水面莲花为意象，粉白翠绿交叠，缂丝戗色工艺呈现出层次丰富的色彩渐变效果。',
    innovationPoints: '极简构图融合传统缂丝富层感，适配现代软装与空间设计。',
    adaptProducts: '家居软装、高端茶具礼盒、艺术品限定版',
    rightsStatus: 'done', copyrightStatus: 'none',
    publishStatus: 'off_shelf', certNo: 'EC-2026-1067',
    licenses: [
      { type: 'annual', label: '年度授权', price: 3200 },
    ],
    publishedAt: '2026-02-14', isAllowDerivative: true, isAllowCommercial: true,
  },
  {
    id: 'mp4', ownerId: 'u2', ownerName: '张锦绣坊',
    title: '青花缠枝莲纹',
    imageUrl: 'https://images.unsplash.com/photo-1775009985649-425ae59dbfed?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    category: '陶瓷', style: '古典典藏', material: '高岭土', colorTone: '青瓷蓝·素白',
    technique: '青花彩绘',
    desc: '以传统缠枝莲纹为主体，青花发色纯正，线条流畅，藏有元明官窑风范。',
    innovationPoints: '传统青花纹样矢量化重绘，可直接用于数码打印与印花工艺。',
    adaptProducts: '陶瓷器皿、文创周边、品牌授权印花',
    rightsStatus: 'done', copyrightStatus: 'done',
    publishStatus: 'on_sale', certNo: 'EC-2026-0872',
    licenses: [
      { type: 'project', label: '单项目授权', price: 480 },
      { type: 'annual', label: '年度授权', price: 1200 },
    ],
    publishedAt: '2026-02-28', isAllowDerivative: false, isAllowCommercial: true,
  },
  {
    id: 'mp5', ownerId: 'u3', ownerName: '蜀锦研究院',
    title: '蜀锦凤凰朝阳',
    imageUrl: 'https://images.unsplash.com/photo-1723779233339-17335cd7c562?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    category: '蜀锦', style: '文化叙事', material: '蚕丝·棉', colorTone: '朱砂红·宝石蓝',
    technique: '重纬斜纹提花',
    desc: '凤凰展翅与朝阳图腾融合，朱砂红与宝石蓝对比强烈，展现蜀锦独有的热烈气韵。',
    innovationPoints: '古代纹样现代色彩校准，色牢度优化，适配高端服装品牌联名。',
    adaptProducts: '旗袍、汉服、品牌联名文创',
    rightsStatus: 'done', copyrightStatus: 'applied',
    publishStatus: 'on_sale', certNo: 'EC-2026-0934',
    licenses: [
      { type: 'project', label: '单项目授权', price: 880 },
      { type: 'annual', label: '年度授权', price: 2200 },
      { type: 'limited', label: '限量授权', price: 1056 },
    ],
    publishedAt: '2026-03-05', isAllowDerivative: true, isAllowCommercial: true,
  },
  {
    id: 'mp6', ownerId: 'u4', ownerName: '苏绣传承工坊',
    title: '苏绣牡丹团花',
    imageUrl: 'https://images.unsplash.com/photo-1643735306118-35224d790082?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    category: '刺绣', style: '古典典藏', material: '蚕丝·棉', colorTone: '金色·米白',
    technique: '苏绣乱针绣',
    desc: '牡丹团纹以苏绣乱针绣手法呈现，花瓣层次分明，色彩饱满，花期永驻。',
    innovationPoints: '乱针绣效果数字化扫描，保留毛发感肌理，可用于高精度数码印花。',
    adaptProducts: '高端礼盒、婚庆用品、文化展览周边',
    rightsStatus: 'done', copyrightStatus: 'none',
    publishStatus: 'on_sale',
    licenses: [
      { type: 'project', label: '单项目授权', price: 700 },
      { type: 'annual', label: '年度授权', price: 1750 },
    ],
    publishedAt: '2026-03-12', isAllowDerivative: false, isAllowCommercial: true,
  },
  {
    id: 'mp7', ownerId: 'u5', ownerName: '京漆工坊',
    title: '雕漆龙纹宝相花',
    imageUrl: 'https://images.unsplash.com/photo-1772124713992-1e9a31d59194?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    category: '漆器', style: '商务厚重', material: '生漆·木', colorTone: '墨绿·烟灰',
    technique: '雕漆工艺',
    desc: '龙纹与宝相花交织，以雕漆工艺赋予纹样浮雕立体感，黑底金图大气端庄。',
    innovationPoints: '浮雕层次数字建模，可同时输出平面印刷与3D雕刻两种生产文件。',
    adaptProducts: '国礼礼盒、高端摆件、企业定制礼品',
    rightsStatus: 'done', copyrightStatus: 'done',
    publishStatus: 'on_sale', certNo: 'EC-2025-0671',
    licenses: [
      { type: 'project', label: '单项目授权', price: 2400 },
      { type: 'annual', label: '年度授权', price: 6000 },
      { type: 'limited', label: '限量授权', price: 2880 },
    ],
    publishedAt: '2026-01-18', isAllowDerivative: false, isAllowCommercial: true,
  },
  {
    id: 'mp8', ownerId: 'u6', ownerName: '非遗剪纸馆',
    title: '剪纸双喜福字纹',
    imageUrl: 'https://images.unsplash.com/photo-1762113396386-5b1ea64ba7b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400',
    category: '剪纸', style: '文化叙事', material: '宣纸', colorTone: '朱砂红·宝石蓝',
    technique: '手工刻绘',
    desc: '双喜与福字相融，剪纸纹样结构精密，线条张力足，喜庆又具设计感。',
    innovationPoints: '剪纸镂空结构精准提取，可直接转换为激光雕刻路径文件。',
    adaptProducts: '节庆礼盒、婚礼用品、文创贺卡',
    rightsStatus: 'none', copyrightStatus: 'none',
    publishStatus: 'on_sale',
    licenses: [
      { type: 'project', label: '单项目授权', price: 680 },
      { type: 'limited', label: '限量授权', price: 980 },
    ],
    publishedAt: '2026-04-01', isAllowDerivative: true, isAllowCommercial: true,
  },
];

const SEED_ORDERS: LicenseOrder[] = [
  {
    id: 'ord1', orderNo: 'LIC-2026-041001',
    patternId: 'mp4', patternTitle: '青花缠枝莲纹', patternImage: SEED_PATTERNS[3].imageUrl,
    sellerId: 'u2', sellerName: '张锦绣坊', buyerName: MY_USER_NAME,
    template: 'annual', templateLabel: '年度授权',
    purpose: '用于我们品牌官网及线下文创零售店的印花产品系列开发',
    entity: '南京鋆寰文创有限公司', productCategory: '文创周边·印花产品',
    channel: '线上官网·线下零售', region: '中国大陆',
    allowDerivative: false, price: 980,
    status: 'approved_pending_pay', direction: 'buy',
    appliedAt: '2026-04-09 15:22', approvedAt: '2026-04-09 16:00',
    payDeadline: APPROVED_DEADLINE,
  },
  {
    id: 'ord2', orderNo: 'LIC-2026-041002',
    patternId: 'mp5', patternTitle: '蜀锦凤凰朝阳', patternImage: SEED_PATTERNS[4].imageUrl,
    sellerId: 'u3', sellerName: '蜀锦研究院', buyerName: MY_USER_NAME,
    template: 'limited', templateLabel: '限量授权',
    purpose: '品牌联名限量丝巾系列，礼盒包装+产品图案',
    entity: '南京鋆寰文创有限公司', productCategory: '真丝丝巾·礼盒包装',
    channel: '限定渠道专卖', region: '中国大陆',
    allowDerivative: true, quantityLimit: 500, price: 1400,
    status: 'submitted', direction: 'buy',
    appliedAt: '2026-04-10 09:15',
  },
  {
    id: 'ord3', orderNo: 'LIC-2026-031018',
    patternId: 'mp8', patternTitle: '剪纸双喜福字纹', patternImage: SEED_PATTERNS[7].imageUrl,
    sellerId: 'u6', sellerName: '非遗剪纸馆', buyerName: MY_USER_NAME,
    template: 'project', templateLabel: '单项目授权',
    purpose: '故宫文创节庆礼盒外包装图案授权使用',
    entity: '南京鋆寰文创有限公司', productCategory: '节庆礼盒包装',
    channel: '线下礼品渠道', region: '中国大陆',
    allowDerivative: false, projectName: '故宫·春节礼盒2026', price: 680,
    status: 'completed', direction: 'buy',
    appliedAt: '2026-03-18 11:30', approvedAt: '2026-03-19 10:00',
    paidAt: '2026-03-19 10:45',
  },
  // Incoming to me (sell direction)
  {
    id: 'ord4', orderNo: 'LIC-2026-041101',
    patternId: 'mp1', patternTitle: '金云纹团花锦', patternImage: SEED_PATTERNS[0].imageUrl,
    sellerId: MY_USER_ID, sellerName: MY_USER_NAME, buyerName: '故宫博物院文创部',
    template: 'annual', templateLabel: '年度授权',
    purpose: '用于故宫官方文创产品系列，包括丝巾、书签、高端礼盒等商品开发',
    entity: '故宫博物院文创部', productCategory: '文博文创·礼品',
    channel: '故宫线下门店·官方电商', region: '中国大陆',
    allowDerivative: false, price: 2800,
    status: 'submitted', direction: 'sell',
    appliedAt: '2026-04-10 08:40',
  },
  {
    id: 'ord5', orderNo: 'LIC-2026-041102',
    patternId: 'mp2', patternTitle: '飞天仙鹤宋锦', patternImage: SEED_PATTERNS[1].imageUrl,
    sellerId: MY_USER_ID, sellerName: MY_USER_NAME, buyerName: '敦煌研究院文创',
    template: 'project', templateLabel: '单项目授权',
    purpose: '敦煌主题艺术展配套文创产品，包括展览纪念品及限定文具套装',
    entity: '敦煌研究院文创中心', productCategory: '展览纪念品·文具套装',
    channel: '展览现场·线上旗舰店', region: '中国大陆',
    allowDerivative: false, projectName: '敦煌·时光计划2026', price: 900,
    status: 'submitted', direction: 'sell',
    appliedAt: '2026-04-09 17:05',
  },
  {
    id: 'ord6', orderNo: 'LIC-2026-030901',
    patternId: 'mp1', patternTitle: '金云纹团花锦', patternImage: SEED_PATTERNS[0].imageUrl,
    sellerId: MY_USER_ID, sellerName: MY_USER_NAME, buyerName: '苏州博物馆文创',
    template: 'limited', templateLabel: '限量授权',
    purpose: '苏博开馆60周年纪念限量版文创套装',
    entity: '苏州博物馆文创部', productCategory: '纪念版文创套装',
    channel: '苏博专属渠道', region: '华东地区',
    allowDerivative: false, quantityLimit: 300, price: 1800,
    status: 'completed', direction: 'sell',
    appliedAt: '2026-03-08 14:20', approvedAt: '2026-03-09 10:00',
    paidAt: '2026-03-09 11:30',
  },
];

// ── Constants ─────────────────────────────────────────────────────────────────

const CATEGORIES = ['云锦', '宋锦', '蜀锦', '缂丝', '刺绣', '木雕', '陶瓷', '漆器', '剪纸', '刻绘'];
const STYLES = ['古典典藏', '简雅现代', '文化叙事', '商务厚重', '自由探索'];

const PUBLISH_STATUS_CFG: Record<PublishStatus, { label: string; color: string; bg: string }> = {
  on_sale: { label: '已发布', color: '#16A34A', bg: 'rgba(22,163,74,0.10)' },
  locked:  { label: '交易锁定', color: '#C4912A', bg: 'rgba(196,145,42,0.12)' },
  off_shelf: { label: '已下架', color: '#9B9590', bg: 'rgba(155,149,144,0.12)' },
};

const ORDER_STATUS_CFG: Record<OrderStatus, { label: string; color: string; bg: string }> = {
  submitted:            { label: '待卖方审批', color: '#1A3D4A', bg: 'rgba(26,61,74,0.09)' },
  approved_pending_pay: { label: '待付款',     color: '#C4912A', bg: 'rgba(196,145,42,0.12)' },
  rejected:             { label: '已拒绝',     color: '#DC2626', bg: 'rgba(220,38,38,0.08)' },
  expired:              { label: '已失效',     color: '#9B9590', bg: 'rgba(155,149,144,0.12)' },
  paid:                 { label: '已入库',     color: '#16A34A', bg: 'rgba(22,163,74,0.10)' },
  completed:            { label: '已入库',     color: '#16A34A', bg: 'rgba(22,163,74,0.10)' },
};

const REJECT_REASONS = ['使用范围不合适', '使用用途不匹配', '当前暂不授权', '价格未达预期', '其他原因'];

const SOURCE_ICON: Record<string, React.ReactNode> = {
  zhihui:  <Sparkles className="w-2.5 h-2.5" />,
  copilot: <Brain className="w-2.5 h-2.5" />,
  upload:  <FolderUp className="w-2.5 h-2.5" />,
};

// ── License Rule Constants (aligned with InspirationLibraryPage publish rules) ─

const LICENSE_USAGE_INFO: Record<LicenseTemplate, { usage: string; boundary: string }> = {
  project: {
    usage: '单次联名 · 单次礼盒 · 单次活动视觉',
    boundary: '1主体 · 1项目 · 1品类 · 中国大陆 · 12个月 · 非独占',
  },
  annual: {
    usage: '品牌年度上新 · 产品线持续传播 · 反复使用同一纹样',
    boundary: '1主体 · 1品牌/产品线 · 1品类 · 中国大陆 · 12个月 · 非独占',
  },
  limited: {
    usage: '限量礼盒 · 节庆款 · 馆藏衍生商品试水',
    boundary: '1主体 · 约定数量上限 · 12个月 · 非独占',
  },
};

const LIMITED_TIERS = [
  { label: '100 件以内', coeff: 0.6 },
  { label: '500 件以内', coeff: 0.9 },
  { label: '1,000 件以内', coeff: 1.2 },
  { label: '3,000 件以内', coeff: 1.8 },
  { label: '10,000 件以内', coeff: 3.0 },
];

// ── Utility ───────────────────────────────────────────────────────────────────

function formatCountdown(ms: number) {
  const total = Math.max(0, ms);
  const h = Math.floor(total / 3600000);
  const m = Math.floor((total % 3600000) / 60000);
  const s = Math.floor((total % 60000) / 1000);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

// ── Countdown Hook ────────────────────────────────────────────────────────────

function useCountdown(deadline?: number) {
  const [remaining, setRemaining] = useState(() => deadline ? Math.max(0, deadline - Date.now()) : 0);
  useEffect(() => {
    if (!deadline) return;
    const iv = setInterval(() => {
      const rem = Math.max(0, deadline - Date.now());
      setRemaining(rem);
      if (rem === 0) clearInterval(iv);
    }, 1000);
    return () => clearInterval(iv);
  }, [deadline]);
  return { remaining, isExpired: remaining === 0, formatted: formatCountdown(remaining) };
}

// ── StatusBadge ───────────────────────────────────────────────────────────────

function StatusBadge({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px]"
      style={{ color, background: bg, fontWeight: 600, border: `1px solid ${color}22` }}>
      {label}
    </span>
  );
}

// ── Image Lightbox ────────────────────────────────────────────────────────────

function ImageLightbox({ src, onClose }: { src: string; onClose: () => void }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-8"
      style={{ background: 'rgba(0,0,0,0.88)', backdropFilter: 'blur(6px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.88 }} animate={{ scale: 1 }} exit={{ scale: 0.88 }}
        className="relative max-w-3xl w-full" onClick={e => e.stopPropagation()}>
        <img src={src} alt="" className="w-full rounded-2xl shadow-2xl" style={{ maxHeight: '82vh', objectFit: 'contain' }} />
        <button onClick={onClose} className="absolute -top-3 -right-3 w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-xl">
          <X className="w-4 h-4 text-[#1A3D4A]" />
        </button>
        {/* Watermark overlay */}
        <div className="absolute inset-0 rounded-2xl pointer-events-none overflow-hidden flex items-center justify-center" style={{ opacity: 0.15 }}>
          <span className="text-white text-2xl rotate-[-30deg] select-none" style={{ fontWeight: 700, letterSpacing: '0.1em' }}>锦绣智织 · 预览水印</span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── CertViewModal ─────────────────────────────────────────────────────────────

// 生成版权登记号（基于certNo/id的确定性模拟编号）
function genCopyrightRegNo(pattern: MarketPattern): string {
  const seed = pattern.certNo ? pattern.certNo.replace(/\D/g, '') : pattern.id.replace(/\D/g, '0');
  const num = parseInt(seed.slice(-6) || '100001', 10);
  return `国作登字-2026-F-${String(num + 10000000).slice(-8)}`;
}

function CertViewModal({ pattern, certType, onClose }: {
  pattern: MarketPattern;
  certType: 'rights' | 'copyright';
  onClose: () => void;
}) {
  if (certType === 'copyright') {
    // ── 国家版权局官方作品著作权登记证书（严格按照样本样式还原）──────────
    const regNo = genCopyrightRegNo(pattern);
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
                <g id="cert-cf">
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
              <use href="#cert-cf" transform="translate(36,36)"/>
              <use href="#cert-cf" transform={`translate(${W-36},36)`}/>
              <use href="#cert-cf" transform={`translate(36,${H-36})`}/>
              <use href="#cert-cf" transform={`translate(${W-36},${H-36})`}/>

              {/* 四道同心线框花边 */}
              <rect x="5" y="5" width={W-10} height={H-10} fill="none" stroke={certGold} strokeWidth="2"/>
              <rect x="12" y="12" width={W-24} height={H-24} fill="none" stroke={certGold} strokeWidth="0.8"/>
              <rect x="24" y="24" width={W-48} height={H-48} fill="none" stroke={certGold} strokeWidth="0.8"/>
              <rect x="34" y="34" width={W-68} height={H-68} fill="none" stroke={certGold} strokeWidth="1.2"/>
            </svg>

            {/* ── 文字内容 ── */}
            <div style={{
              position: 'relative', zIndex: 1,
              padding: '52px 62px 38px',
              height: H, boxSizing: 'border-box',
              display: 'flex', flexDirection: 'column',
              fontFamily: sFont, color: '#000',
            }}>
              {/* 标题 */}
              <div style={{ textAlign: 'center', marginBottom: 18 }}>
                <h1 style={{
                  margin: 0, fontSize: 30, fontWeight: 700,
                  letterSpacing: '0.55em', fontFamily: sFont,
                }}>作品登记证书</h1>
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
                 { label: '作品类别', value: `美术作品（${pattern.category}）` }],
                [{ label: '作　　　者', value: pattern.ownerName },
                 { label: '著　作　权　人', value: pattern.ownerName }],
                [{ label: '创作完成日期', value: pattern.publishedAt },
                 { label: '首次发表/出版/制作日期', value: pattern.publishedAt }],
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
                }}>{pattern.ownerName}</span>
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
                  <span style={{ borderBottom: '1px solid #333', paddingBottom: 1 }}>
                    {pattern.publishedAt}
                  </span>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <svg width="70" height="70" viewBox="0 0 70 70">
                    <circle cx="35" cy="35" r="32" fill="none" stroke="#CC0000" strokeWidth="2"/>
                    <circle cx="35" cy="35" r="26" fill="none" stroke="#CC0000" strokeWidth="0.8" strokeDasharray="2,2"/>
                    <text x="35" y="21" textAnchor="middle" fontSize="6.5" fill="#CC0000" fontWeight="bold" letterSpacing="1" fontFamily={sFont}>中国版权保护中心</text>
                    <text x="35" y="53" textAnchor="middle" fontSize="6" fill="#CC0000" letterSpacing="0.5" fontFamily={sFont}>作品登记专用章</text>
                    <polygon
                      points="35,27 37.3,34.1 44.8,34.1 38.7,38.5 41.1,45.6 35,41.2 28.9,45.6 31.3,38.5 25.2,34.1 32.7,34.1"
                      fill="#CC0000"/>
                  </svg>
                  <div style={{ fontSize: 12.5, color: '#333', marginTop: 2 }}>登记机构签章</div>
                </div>
              </div>

              {/* 页脚 */}
              <div style={{ textAlign: 'center', paddingTop: 10, borderTop: `1px solid ${certGold}77` }}>
                <p style={{
                  margin: 0, fontSize: 14, fontWeight: 700,
                  letterSpacing: '0.12em', fontFamily: sFont,
                }}>中华人民共和国国家版权局统一监制</p>
              </div>
            </div>
          </motion.div>
        </div>
      </motion.div>
    );
  }

  // ── 纹样确权证书（与「我的纹库」CertificateModal 完全一致的平台确权证书样式） ──
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        className="relative w-full max-w-md" onClick={e => e.stopPropagation()}>
        <button onClick={onClose}
          className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-lg z-10">
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
            {/* Thumbnail + cert no */}
            <div className="flex gap-4 items-start">
              <img src={pattern.imageUrl} alt={pattern.title}
                className="w-20 h-20 object-cover rounded-xl flex-shrink-0"
                style={{ border: '1.5px solid rgba(196,145,42,0.3)' }} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-1">
                  <QrCode className="w-3 h-3 text-[#C4912A]" />
                  <span className="text-[10px] text-[#9B9590]">证书编号</span>
                </div>
                <p className="text-sm text-[#1A3D4A] font-mono" style={{ fontWeight: 700 }}>
                  {pattern.certNo ?? `EC-${pattern.id.toUpperCase()}`}
                </p>
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
              { label: '品　　类', value: pattern.category },
              { label: '风格类别', value: pattern.style },
              { label: '设　计　师', value: pattern.ownerName },
              { label: '发布时间', value: pattern.publishedAt },
              { label: '确权时间', value: pattern.publishedAt },
            ].map(row => (
              <div key={row.label} className="flex items-center justify-between py-1.5"
                style={{ borderBottom: '1px solid rgba(26,61,74,0.06)' }}>
                <span className="text-[11px] text-[#9B9590]">{row.label}</span>
                <span className="text-[11px] text-[#1A3D4A] text-right max-w-[200px] truncate" style={{ fontWeight: 500 }}>{row.value}</span>
              </div>
            ))}

            {/* Encryption info */}
            <div className="rounded-xl p-3 space-y-1.5"
              style={{ background: 'rgba(26,61,74,0.04)', border: '1px solid rgba(26,61,74,0.08)' }}>
              <div className="flex items-center gap-1.5">
                <Lock className="w-3 h-3 text-[#C4912A]" />
                <span className="text-[10px] text-[#C4912A]" style={{ fontWeight: 600 }}>加密技术说明</span>
              </div>
              <p className="text-[10px] text-[#6B6558] leading-relaxed">
                确权采用机密加密技术，对话记录·图案·工艺特征·创新描述合并加密存证，
                哈希值安全托管于鋆寰科技非遗智作平台。
              </p>
            </div>

            {/* Watermark info */}
            <div className="rounded-xl p-3 space-y-1.5"
              style={{ background: 'rgba(196,145,42,0.05)', border: '1px solid rgba(196,145,42,0.15)' }}>
              <div className="flex items-center gap-1.5">
                <Stamp className="w-3 h-3 text-[#C4912A]" />
                <span className="text-[10px] text-[#C4912A]" style={{ fontWeight: 600 }}>水印保护说明</span>
              </div>
              <p className="text-[10px] text-[#6B6558] leading-relaxed">
                <span className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>可见水印：</span>{pattern.ownerName}｜
                <span className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>不可见水印：</span>
                {pattern.certNo ?? pattern.id}·鋆寰科技
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-3 text-center"
            style={{ borderTop: '1px dashed rgba(196,145,42,0.3)', background: 'rgba(196,145,42,0.03)' }}>
            <p className="text-[10px] text-[#9B9590]">签发机构：南京鋆寰科技有限公司</p>
            <p className="text-[9px] text-[#C4A88A] mt-0.5">加密存证仅作法律参考，如需更强法律效力请自行官方版权认证。</p>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── MarketPatternCard ─────────────────────────────────────────────────────────

function MarketPatternCard({
  pattern, onView, onApply, onToggleShelf,
}: {
  pattern: MarketPattern;
  onView: () => void;
  onApply?: () => void;
  onToggleShelf?: () => void;
}) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showCert, setShowCert] = useState<'rights' | 'copyright' | null>(null);
  const isOwner = pattern.ownerId === MY_USER_ID;
  const primaryLicense = pattern.licenses[0];
  const psCfg = PUBLISH_STATUS_CFG[pattern.publishStatus];

  return (
    <>
      <motion.div whileHover={{ y: -2, boxShadow: '0 6px 24px rgba(26,61,74,0.11)' }}
        className="rounded-xl overflow-hidden transition-all flex flex-col"
        style={{ background: 'white', border: '1px solid rgba(26,61,74,0.09)', boxShadow: '0 1px 6px rgba(26,61,74,0.06)' }}>

        {/* Image */}
        <div className="relative overflow-hidden group flex-shrink-0" style={{ height: 130 }}>
          <img src={pattern.imageUrl} alt={pattern.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
          {/* Gradient overlay */}
          <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,37,53,0.75) 0%, rgba(13,37,53,0.05) 60%, transparent 100%)' }} />
          {/* Watermark preview overlay */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.12 }}>
            <span className="text-white text-xs rotate-[-30deg] select-none" style={{ fontWeight: 600 }}>锦绣智织水印</span>
          </div>
          {/* Category + status top badges */}
          <div className="absolute top-2 left-2 flex items-center gap-1">
            <span className="text-[10px] px-1.5 py-0.5 rounded-md text-white"
              style={{ background: 'rgba(26,61,74,0.75)', backdropFilter: 'blur(4px)', fontWeight: 600 }}>{pattern.category}</span>
            {isOwner && pattern.publishStatus !== 'on_sale' && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-md"
                style={{ background: psCfg.bg, color: psCfg.color, border: `1px solid ${psCfg.color}33`, fontWeight: 600, backdropFilter: 'blur(4px)' }}>
                {psCfg.label}
              </span>
            )}
          </div>
          {/* Zoom button */}
          <button onClick={e => { e.stopPropagation(); setLightbox(pattern.imageUrl); }}
            className="absolute bottom-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
            style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }} title="放大查看">
            <ZoomIn className="w-3 h-3 text-[#1A3D4A]" />
          </button>
          {/* Owner bottom */}
          <p className="absolute bottom-2 left-2.5 right-10 text-white text-xs truncate" style={{ fontWeight: 700, textShadow: '0 1px 3px rgba(0,0,0,0.5)' }}>
            {pattern.title}
          </p>
        </div>

        {/* Body */}
        <div className="px-3 pt-2 pb-2.5 flex flex-col gap-1.5 flex-1">
          {/* Owner + rights row */}
          <div className="flex items-center justify-between gap-1">
            <div className="flex items-center gap-1 min-w-0">
              <User className="w-2.5 h-2.5 text-[#9B9590] flex-shrink-0" />
              <span className="text-[11px] text-[#6B6558] truncate">{pattern.ownerName}</span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {pattern.rightsStatus === 'done' && (
                <button onClick={e => { e.stopPropagation(); setShowCert('rights'); }}
                  className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full transition-all hover:scale-105"
                  style={{ background: 'rgba(22,163,74,0.09)', color: '#16A34A', fontWeight: 600, border: '1px solid rgba(22,163,74,0.15)' }}>
                  <ShieldCheck className="w-2.5 h-2.5" />确权证书
                </button>
              )}
              {pattern.copyrightStatus === 'done' && (
                <button onClick={e => { e.stopPropagation(); setShowCert('copyright'); }}
                  className="inline-flex items-center gap-0.5 text-[9px] px-1.5 py-0.5 rounded-full transition-all hover:scale-105"
                  style={{ background: 'rgba(196,145,42,0.09)', color: '#C4912A', fontWeight: 600, border: '1px solid rgba(196,145,42,0.2)' }}>
                  <Award className="w-2.5 h-2.5" />版权证书
                </button>
              )}
            </div>
          </div>

          {/* Tags row */}
          <div className="flex flex-wrap gap-1">
            {[pattern.technique, pattern.material, pattern.colorTone].slice(0, 3).map((tag, i) => (
              <span key={i} className="text-[9px] px-1.5 py-0.5 rounded-md text-[#6B6558]"
                style={{ background: 'rgba(26,61,74,0.05)', border: '1px solid rgba(26,61,74,0.07)' }}>{tag}</span>
            ))}
          </div>

          {/* Price + license */}
          <div className="flex items-center justify-between pt-1" style={{ borderTop: '1px solid rgba(26,61,74,0.06)' }}>
            <div>
              <span className="text-sm text-[#C4912A]" style={{ fontWeight: 700 }}>¥{primaryLicense.price.toLocaleString()}</span>
              <span className="text-[10px] text-[#9B9590] ml-1">/ {primaryLicense.label}</span>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={onView}
                className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] transition-all hover:scale-105"
                style={{ background: 'rgba(26,61,74,0.06)', color: '#1A3D4A', border: '1px solid rgba(26,61,74,0.09)' }}>
                <Eye className="w-2.5 h-2.5" /> 详情
              </button>
              {!isOwner && pattern.publishStatus === 'on_sale' && onApply && (
                <button onClick={onApply}
                  className="flex items-center gap-0.5 px-2 py-1 rounded-lg text-[10px] text-white transition-all hover:scale-105"
                  style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
                  <CheckCircle2 className="w-2.5 h-2.5" /> 申请授权
                </button>
              )}
              {!isOwner && pattern.publishStatus !== 'on_sale' && (
                <span className="text-[9px] text-[#9B9590] px-2 py-1 rounded-lg" style={{ background: 'rgba(155,149,144,0.08)' }}>暂不可申请</span>
              )}

            </div>
          </div>
        </div>
      </motion.div>
      <AnimatePresence>{lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}</AnimatePresence>
      <AnimatePresence>{showCert && <CertViewModal pattern={pattern} certType={showCert} onClose={() => setShowCert(null)} />}</AnimatePresence>
    </>
  );
}

// ── PatternDetailPanel ────────────────────────────────────────────────────────

function PatternDetailPanel({
  pattern, onClose, onApply,
}: { pattern: MarketPattern; onClose: () => void; onApply: () => void; }) {
  const [lightbox, setLightbox] = useState<string | null>(null);
  const [showCert, setShowCert] = useState<'rights' | 'copyright' | null>(null);
  const isOwner = pattern.ownerId === MY_USER_ID;
  const psCfg = PUBLISH_STATUS_CFG[pattern.publishStatus];

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-4">
      <p className="text-[10px] text-[#9B9590] uppercase tracking-widest mb-2">{title}</p>
      {children}
    </div>
  );

  const Field = ({ label, value }: { label: string; value?: string | React.ReactNode }) => value ? (
    <div className="flex gap-2 py-1.5" style={{ borderBottom: '1px solid rgba(26,61,74,0.05)' }}>
      <span className="text-[11px] text-[#9B9590] w-24 flex-shrink-0">{label}</span>
      <span className="text-[11px] text-[#1A3D4A] flex-1" style={{ fontWeight: 500 }}>{value}</span>
    </div>
  ) : null;

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60]" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(2px)' }}
        onClick={onClose} />

      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 280 }}
        className="fixed top-0 right-0 bottom-0 z-[61] flex flex-col"
        style={{ width: 480, background: '#FDFAF5', borderLeft: '1.5px solid rgba(26,61,74,0.1)', boxShadow: '-4px 0 32px rgba(26,61,74,0.12)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-3.5 flex items-center justify-between flex-shrink-0"
          style={{ background: 'rgba(245,240,232,0.95)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={onClose} className="text-[#6B6558] hover:text-[#1A3D4A] transition-colors flex-shrink-0">
              <X className="w-4 h-4" />
            </button>
            <span className="text-sm text-[#1A3D4A] truncate" style={{ fontWeight: 600 }}>{pattern.title}</span>
            <StatusBadge {...psCfg} />
          </div>
          {!isOwner && pattern.publishStatus === 'on_sale' && (
            <button onClick={onApply}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-white flex-shrink-0 transition-all"
              style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
              <CheckCircle2 className="w-3 h-3" /> 申请授权
            </button>
          )}
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4" style={{ scrollbarWidth: 'thin' }}>
          {/* Image */}
          <div className="relative rounded-xl overflow-hidden mb-4 group" style={{ height: 200 }}>
            <img src={pattern.imageUrl} alt={pattern.title} className="w-full h-full object-cover" />
            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,37,53,0.6) 0%, transparent 60%)' }} />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.15 }}>
              <span className="text-white text-lg rotate-[-30deg] select-none" style={{ fontWeight: 700 }}>锦绣智织水印</span>
            </div>
            <button onClick={() => setLightbox(pattern.imageUrl)}
              className="absolute top-2 right-2 w-8 h-8 rounded-xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"
              style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(4px)' }}>
              <ZoomIn className="w-3.5 h-3.5 text-[#1A3D4A]" />
            </button>
          </div>

          {/* Basic Info */}
          <Section title="基本信息">
            <Field label="纹样名称" value={pattern.title} />
            <Field label="所有者" value={pattern.ownerName} />
            <Field label="品类" value={pattern.category} />
            <Field label="风格类别" value={pattern.style} />
            <Field label="材质" value={pattern.material} />
            <Field label="主色系" value={pattern.colorTone} />
            <Field label="发布时间" value={pattern.publishedAt} />
          </Section>

          {/* Design & Craft */}
          <Section title="设计与工艺">
            <Field label="工艺技法" value={pattern.technique} />
            <Field label="图案描述" value={pattern.desc} />
            <Field label="创新亮点" value={pattern.innovationPoints} />
            <Field label="适配方向" value={pattern.adaptProducts} />
          </Section>

          {/* Rights */}
          <Section title="权利信息">
            <div className="flex flex-wrap gap-2 py-1 mb-1">
              {pattern.rightsStatus === 'done' && (
                <button onClick={() => setShowCert('rights')}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all hover:scale-105"
                  style={{ background: 'rgba(22,163,74,0.09)', color: '#16A34A', border: '1px solid rgba(22,163,74,0.15)', fontWeight: 600 }}>
                  <ShieldCheck className="w-3 h-3" />确权证书
                </button>
              )}
              {pattern.copyrightStatus === 'done' && (
                <button onClick={() => setShowCert('copyright')}
                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg transition-all hover:scale-105"
                  style={{ background: 'rgba(196,145,42,0.09)', color: '#C4912A', border: '1px solid rgba(196,145,42,0.2)', fontWeight: 600 }}>
                  <Award className="w-3 h-3" />版权证书
                </button>
              )}
              {pattern.copyrightStatus === 'applied' && (
                <span className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded-lg"
                  style={{ background: 'rgba(26,61,74,0.07)', color: '#1A3D4A', fontWeight: 500 }}>版权认证中</span>
              )}
            </div>
            <Field label="允许改编" value={pattern.isAllowDerivative ? '✓ 允许改编' : '✗ 不允许改编'} />
            <Field label="允许商用" value={pattern.isAllowCommercial ? '✓ 允许商业使用' : '✗ 仅限非商业使用'} />
          </Section>

          {/* Trade Info */}
          <Section title="授权方案 · 定价">
            {/* 定价说明 */}
            <div className="mb-3 px-3 py-2.5 rounded-xl" style={{ background: 'rgba(196,145,42,0.06)', border: '1px solid rgba(196,145,42,0.2)' }}>
              <p className="text-[10px] text-[#A8741A] mb-0.5" style={{ fontWeight: 600 }}>💡 定价规则</p>
              <p className="text-[10px] text-[#6B6558] leading-relaxed">
                以「单项目授权」为基准价。年度授权 = 基准价 × 2.5；限量授权按件数阶梯系数自动计算。平台收取 10% 服务费，卖家 T+7 到账。
              </p>
            </div>
            <div className="space-y-2">
              {pattern.licenses.map(lic => {
                const sellerGet = Math.round(lic.price * 0.9);
                const platformFee = lic.price - sellerGet;
                const projectBase = pattern.licenses.find(l => l.type === 'project')?.price ?? 0;
                const info = LICENSE_USAGE_INFO[lic.type];
                return (
                  <div key={lic.type} className="rounded-xl overflow-hidden"
                    style={{ border: `1.5px solid ${lic.type === 'annual' ? 'rgba(196,145,42,0.25)' : lic.type === 'limited' ? 'rgba(124,58,237,0.18)' : 'rgba(26,61,74,0.12)'}` }}>
                    {/* Header row */}
                    <div className="px-3 pt-2.5 pb-2"
                      style={{ background: lic.type === 'annual' ? 'rgba(196,145,42,0.05)' : lic.type === 'limited' ? 'rgba(124,58,237,0.04)' : 'rgba(26,61,74,0.03)' }}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <p className="text-[11px] text-[#1A3D4A]" style={{ fontWeight: 700 }}>{lic.label}</p>
                          {lic.type === 'annual' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(196,145,42,0.15)', color: '#A8741A', fontWeight: 600 }}>推荐</span>
                          )}
                          {lic.type === 'annual' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(196,145,42,0.1)', color: '#C4912A', fontWeight: 600 }}>基准价 ×2.5</span>
                          )}
                          {lic.type === 'limited' && (
                            <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED', fontWeight: 600 }}>阶梯定价</span>
                          )}
                        </div>
                        <div className="text-right flex-shrink-0 ml-3">
                          <span className="text-sm text-[#C4912A]" style={{ fontWeight: 700 }}>¥{lic.price.toLocaleString()}</span>
                          <p className="text-[9px] text-[#9B9590]">/ 次授权</p>
                        </div>
                      </div>
                      {/* 适用场景 */}
                      <p className="text-[10px] mt-1.5">
                        <span className="text-[#9B9590]">适用：</span>
                        <span className="text-[#6B6558]">{info.usage}</span>
                      </p>
                      {/* 授权边界 */}
                      <p className="text-[9px] text-[#9B9590] mt-0.5">{info.boundary}</p>
                    </div>
                    {/* Limited tier table */}
                    {lic.type === 'limited' && projectBase > 0 && (
                      <div className="px-3 py-2 space-y-1" style={{ background: 'rgba(124,58,237,0.02)', borderTop: '1px solid rgba(124,58,237,0.1)' }}>
                        <p className="text-[9px] text-[#9B9590] mb-1.5" style={{ fontWeight: 600 }}>阶梯定价参考（基准价 × 系数）</p>
                        {LIMITED_TIERS.map((tier, i) => (
                          <div key={i} className="flex items-center justify-between py-1 px-2 rounded-lg"
                            style={{ background: i % 2 === 0 ? 'rgba(124,58,237,0.04)' : 'white', border: '1px solid rgba(124,58,237,0.07)' }}>
                            <span className="text-[9px] text-[#6B6558]">{tier.label}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-[9px] text-[#9B9590]">×{tier.coeff}</span>
                              <span className="text-[10px] text-[#7C3AED]" style={{ fontWeight: 700 }}>
                                ¥{Math.round(projectBase * tier.coeff).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    {/* Split preview */}
                    <div className="flex px-3 py-2 gap-3" style={{ borderTop: '1px solid rgba(26,61,74,0.05)', background: 'white' }}>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#16A34A' }} />
                        <span className="text-[9px] text-[#6B6558]">卖家 ¥{sellerGet.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full" style={{ background: '#C4912A' }} />
                        <span className="text-[9px] text-[#6B6558]">平台 ¥{platformFee.toLocaleString()} (10%)</span>
                      </div>
                      <div className="ml-auto flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5 text-[#9B9590]" />
                        <span className="text-[9px] text-[#9B9590]">T+7结算</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Market transparency note */}
            <div className="mt-2 flex items-start gap-1.5 p-2.5 rounded-xl" style={{ background: 'rgba(196,145,42,0.06)', border: '1px solid rgba(196,145,42,0.15)' }}>
              <Info className="w-2.5 h-2.5 text-[#C4912A] mt-0.5 flex-shrink-0" />
              <p className="text-[10px] text-[#6B6558] leading-relaxed">
                授权获得的纹样仅限在授权范围内使用，不得再次上架市集或转授权给第三方；如有违反，平台有权采取下架、冻结、终止授权等措施，并会同纹样权利人依法追究其法律责任。
              </p>
            </div>
          </Section>
        </div>
      </motion.div>

      <AnimatePresence>{lightbox && <ImageLightbox src={lightbox} onClose={() => setLightbox(null)} />}</AnimatePresence>
      <AnimatePresence>{showCert && <CertViewModal pattern={pattern} certType={showCert} onClose={() => setShowCert(null)} />}</AnimatePresence>
    </>
  );
}

// ── LicenseInputField (module-level to avoid remount-on-rerender) ─────────────

// Defined at module level (NOT inside the drawer) to prevent React from
// treating it as a new component on every render, which would unmount/remount
// the <input> and lose focus after each keystroke.
function LicenseInputField({ label, value, onChange, placeholder, required, error, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; required?: boolean; error?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[11px] text-[#6B6558] mb-1 flex items-center gap-1">
        {label}{required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 rounded-xl text-xs outline-none transition-all"
        style={{
          background: 'white', border: `1.5px solid ${error ? '#DC2626' : 'rgba(26,61,74,0.12)'}`,
          color: '#1A3D4A'
        }} />
      {error && <p className="text-[10px] text-red-500 mt-0.5 flex items-center gap-1"><AlertTriangle className="w-2.5 h-2.5" />{error}</p>}
    </div>
  );
}

// ── LicenseApplyDrawer ────────────────────────────────────────────────────────

function LicenseApplyDrawer({
  pattern, onClose, onSubmit,
}: { pattern: MarketPattern; onClose: () => void; onSubmit: (data: Partial<LicenseOrder>) => void; }) {
  const [template, setTemplate] = useState<LicenseTemplate>(pattern.licenses[0].type);
  const [entity, setEntity] = useState('');
  const [purpose, setPurpose] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [channel, setChannel] = useState('');
  const [region, setRegion] = useState('');
  const [allowDerivative, setAllowDerivative] = useState(false);
  const [projectName, setProjectName] = useState('');
  const [quantityLimit, setQuantityLimit] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedLicense = pattern.licenses.find(l => l.type === template) ?? pattern.licenses[0];

  const validate = () => {
    const e: Record<string, string> = {};
    if (!entity.trim()) e.entity = '请填写使用主体';
    if (!purpose.trim()) e.purpose = '请填写使用用途';
    if (!productCategory.trim()) e.productCategory = '请填写产品品类';
    if (!channel.trim()) e.channel = '请填写销售渠道';
    if (!region.trim()) e.region = '请填写地域范围';
    if (template === 'project' && !projectName.trim()) e.projectName = '请填写项目名称';
    if (template === 'limited' && !quantityLimit.trim()) e.quantityLimit = '请填写数量上限';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const canSubmit = entity && purpose && productCategory && channel && region &&
    (template !== 'project' || projectName) &&
    (template !== 'limited' || quantityLimit);

  const handleSubmit = () => {
    if (!validate()) return;
    onSubmit({
      template, templateLabel: selectedLicense.label,
      entity, purpose, productCategory, channel, region,
      allowDerivative, projectName, quantityLimit: quantityLimit ? parseInt(quantityLimit) : undefined,
      price: selectedLicense.price,
    });
  };

  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70]" style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}
        onClick={onClose} />

      <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 32, stiffness: 280 }}
        className="fixed top-0 right-0 bottom-0 z-[71] flex flex-col"
        style={{ width: 440, background: '#FDFAF5', borderLeft: '1.5px solid rgba(26,61,74,0.1)', boxShadow: '-4px 0 32px rgba(26,61,74,0.14)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-3.5 flex-shrink-0"
          style={{ background: 'rgba(245,240,232,0.95)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          <div className="flex items-center justify-between mb-0.5">
            <h2 className="text-sm text-[#1A3D4A]" style={{ fontWeight: 700 }}>申请授权</h2>
            <button onClick={onClose} className="text-[#9B9590] hover:text-[#1A3D4A] transition-colors"><X className="w-4 h-4" /></button>
          </div>
          <p className="text-[11px] text-[#9B9590]">· {pattern.ownerName} · {pattern.title}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4" style={{ scrollbarWidth: 'thin' }}>

          {/* 定价规则说明 */}
          <div className="px-3.5 py-3 rounded-xl" style={{ background: 'rgba(196,145,42,0.06)', border: '1px solid rgba(196,145,42,0.2)' }}>
            <p className="text-[10px] text-[#A8741A] mb-0.5" style={{ fontWeight: 600 }}>💡 定价规则</p>
            <p className="text-[10px] text-[#6B6558] leading-relaxed">
              以「单项目授权」为基准价。年度授权 = 基准价 × 2.5；限量授权按件数阶梯系数自动计算。
            </p>
          </div>

          {/* License template selector */}
          <div>
            <p className="text-[11px] text-[#6B6558] mb-2 flex items-center gap-1">授权模板<span className="text-red-500">*</span></p>
            <div className="grid gap-2">
              {pattern.licenses.map(lic => {
                const info = LICENSE_USAGE_INFO[lic.type];
                return (
                  <button key={lic.type} onClick={() => setTemplate(lic.type)}
                    className="flex items-start justify-between p-3 rounded-xl text-left transition-all"
                    style={{
                      background: template === lic.type
                        ? (lic.type === 'annual' ? 'rgba(196,145,42,0.05)' : lic.type === 'limited' ? 'rgba(124,58,237,0.04)' : 'rgba(26,61,74,0.06)')
                        : 'white',
                      border: `1.5px solid ${template === lic.type
                        ? (lic.type === 'annual' ? '#C4912A' : lic.type === 'limited' ? '#7C3AED' : '#1A3D4A')
                        : 'rgba(26,61,74,0.1)'}`,
                    }}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="text-[11px] text-[#1A3D4A]" style={{ fontWeight: 600 }}>{lic.label}</p>
                        {lic.type === 'annual' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(196,145,42,0.12)', color: '#C4912A', fontWeight: 600 }}>基准价 ×2.5</span>
                        )}
                        {lic.type === 'limited' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(124,58,237,0.1)', color: '#7C3AED', fontWeight: 600 }}>阶梯定价</span>
                        )}
                      </div>
                      <p className="text-[10px] text-[#6B6558] mt-1">
                        <span className="text-[#9B9590]">适用：</span>{info.usage}
                      </p>
                      <p className="text-[9px] text-[#9B9590] mt-0.5">{info.boundary}</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                      <div className="text-right">
                        <span className="text-sm text-[#C4912A]" style={{ fontWeight: 700 }}>¥{lic.price.toLocaleString()}</span>
                        <p className="text-[9px] text-[#9B9590]">/ 次</p>
                      </div>
                      {template === lic.type && <Check className="w-4 h-4 text-[#1A3D4A] flex-shrink-0" />}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form fields */}
          <LicenseInputField label="使用主体名称" value={entity} onChange={setEntity}
            placeholder="企业/机构/个人主体全称" required error={errors.entity} />
          <LicenseInputField label="使用用途说明" value={purpose} onChange={setPurpose}
            placeholder="详细描述授权使用场景，供卖方判断" required error={errors.purpose} />
          <LicenseInputField label="产品品类" value={productCategory} onChange={setProductCategory}
            placeholder="如：真丝丝巾、包装礼盒、T恤印花" required error={errors.productCategory} />
          <LicenseInputField label="销售渠道" value={channel} onChange={setChannel}
            placeholder="如：线下门店、官方电商、展览现场" required error={errors.channel} />
          <LicenseInputField label="地域范围" value={region} onChange={setRegion}
            placeholder="如：中国大陆、华东地区" required error={errors.region} />
          {template === 'project' && (
            <LicenseInputField label="项目名称" value={projectName} onChange={setProjectName}
              placeholder="请填写具体项目名称" required error={errors.projectName} />
          )}
          {template === 'limited' && (
            <LicenseInputField label="数量上限（件）" value={quantityLimit} onChange={setQuantityLimit}
              placeholder="如：100 / 500 / 1000" required type="number" error={errors.quantityLimit} />
          )}

          {/* Derivative option */}
          <div className="flex items-center justify-between p-3 rounded-xl"
            style={{ background: 'rgba(26,61,74,0.03)', border: '1px solid rgba(26,61,74,0.07)' }}>
            <div>
              <p className="text-[11px] text-[#1A3D4A]" style={{ fontWeight: 500 }}>是否需要改编权</p>
              <p className="text-[10px] text-[#9B9590]">在原纹样基础上进行二次设计</p>
            </div>
            <button onClick={() => setAllowDerivative(v => !v)}
              className="flex-shrink-0 rounded-full transition-all"
              style={{ width: 36, height: 20, display: 'flex', alignItems: 'center', padding: '2px', background: allowDerivative ? '#1A3D4A' : 'rgba(26,61,74,0.18)', justifyContent: allowDerivative ? 'flex-end' : 'flex-start' }}>
              <span style={{ width: 16, height: 16, borderRadius: '50%', background: 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)', display: 'block' }} />
            </button>
          </div>

          {/* Order summary */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(196,145,42,0.2)' }}>
            <div className="px-3.5 py-2.5" style={{ background: 'rgba(196,145,42,0.08)', borderBottom: '1px solid rgba(196,145,42,0.12)' }}>
              <p className="text-[10px] text-[#C4912A]" style={{ fontWeight: 700, letterSpacing: '0.08em' }}>订单摘要 · 价格与分账</p>
            </div>
            <div className="p-3.5 space-y-1.5" style={{ background: 'rgba(254,252,245,0.9)' }}>
              <div className="flex justify-between text-[11px]"><span className="text-[#9B9590]">纹样</span><span className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>{pattern.title}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-[#9B9590]">卖方</span><span className="text-[#1A3D4A]">{pattern.ownerName}</span></div>
              <div className="flex justify-between text-[11px]"><span className="text-[#9B9590]">授权模板</span><span className="text-[#1A3D4A]">{selectedLicense.label}</span></div>
              <div className="flex justify-between items-center pt-1.5" style={{ borderTop: '1px solid rgba(196,145,42,0.15)' }}>
                <span className="text-[#9B9590] text-[11px]">您支付金额</span>
                <span className="text-[#C4912A]" style={{ fontWeight: 700, fontSize: 16 }}>¥{selectedLicense.price.toLocaleString()}</span>
              </div>
            </div>
            {/* Revenue share transparency */}
            <div className="px-3.5 py-2.5 space-y-1" style={{ background: 'rgba(26,61,74,0.03)', borderTop: '1px solid rgba(26,61,74,0.06)' }}>
              <p className="text-[10px] text-[#9B9590]" style={{ fontWeight: 600 }}>费用去向（透明分账）</p>
              {[
                { label: '卖家收益（90%）', value: `¥${Math.round(selectedLicense.price * 0.9).toLocaleString()}`, color: '#16A34A' },
                { label: '平台服务费（10%）', value: `¥${Math.round(selectedLicense.price * 0.1).toLocaleString()}`, color: '#C4912A' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center">
                  <span className="text-[10px] text-[#9B9590]">{row.label}</span>
                  <span className="text-[10px] font-mono" style={{ color: row.color, fontWeight: 600 }}>{row.value}</span>
                </div>
              ))}
              <p className="text-[9px] text-[#C4A88A] pt-1">· 卖方同意后2小时内需完成付款，超时自动取消</p>
              <p className="text-[9px] text-[#C4A88A]">· 付款成功后纹样将自动进入您的「我的纹库」</p>
              <p className="text-[9px] text-[#C4A88A]">· 卖家T+7工作日到账（平台结算周期）</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-4 flex gap-2.5 flex-shrink-0" style={{ borderTop: '1px solid rgba(26,61,74,0.07)' }}>
          <button onClick={onClose} className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6558] transition-all"
            style={{ border: '1px solid rgba(26,61,74,0.12)', background: 'white' }}>取消</button>
          <button onClick={handleSubmit} disabled={!canSubmit}
            className="flex-1 py-2.5 rounded-xl text-sm text-white transition-all"
            style={{ background: canSubmit ? 'linear-gradient(135deg, #1A3D4A, #2A5568)' : 'rgba(26,61,74,0.25)', cursor: canSubmit ? 'pointer' : 'not-allowed' }}>
            提交申请
          </button>
        </div>
      </motion.div>
    </>
  );
}

// ── LicenseReviewModal ────────────────────────────────────────────────────────

function LicenseReviewModal({
  order, onClose, onApprove, onReject,
}: { order: LicenseOrder; onClose: () => void; onApprove: (id: string) => void; onReject: (id: string, reason: string) => void; }) {
  const [action, setAction] = useState<'view' | 'reject'>('view');
  const [rejectReason, setRejectReason] = useState('');
  const [customReason, setCustomReason] = useState('');

  const finalReason = rejectReason === '其他原因' ? customReason : rejectReason;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[70] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
      onClick={onClose}>
      <motion.div initial={{ scale: 0.92, y: 12 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 12 }}
        className="w-full max-w-md rounded-2xl overflow-hidden"
        style={{ background: 'white', border: '1.5px solid rgba(26,61,74,0.1)', boxShadow: '0 24px 64px rgba(26,61,74,0.2)' }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #0D2535, #1A3D4A)' }}>
          <div>
            <p className="text-sm text-white" style={{ fontWeight: 700 }}>授权申请审批</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(196,145,42,0.75)' }}>单号：{order.orderNo}</p>
          </div>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors"><X className="w-4 h-4" /></button>
        </div>

        {/* Pattern preview */}
        <div className="p-4 flex gap-3" style={{ borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          <img src={order.patternImage} alt={order.patternTitle} className="w-16 h-16 rounded-xl object-cover flex-shrink-0" style={{ border: '1.5px solid rgba(26,61,74,0.1)' }} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-[#1A3D4A] truncate" style={{ fontWeight: 700 }}>{order.patternTitle}</p>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded-md" style={{ background: 'rgba(26,61,74,0.07)', color: '#1A3D4A' }}>{order.templateLabel}</span>
              <span className="text-sm text-[#C4912A]" style={{ fontWeight: 700 }}>¥{order.price.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Application details */}
        <div className="px-4 py-3 space-y-2" style={{ borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          {[
            { label: '申请方', value: order.buyerName },
            { label: '使用主体', value: order.entity },
            { label: '用途说明', value: order.purpose },
            { label: '产品品类', value: order.productCategory },
            { label: '销售渠道', value: order.channel },
            { label: '地域范围', value: order.region },
            order.projectName ? { label: '项目名称', value: order.projectName } : null,
            order.quantityLimit ? { label: '数量上限', value: `${order.quantityLimit} 件` } : null,
            { label: '申请时间', value: order.appliedAt },
          ].filter(Boolean).map((item, i) => (
            <div key={i} className="flex gap-2">
              <span className="text-[10px] text-[#9B9590] w-20 flex-shrink-0">{item!.label}</span>
              <span className="text-[11px] text-[#1A3D4A] flex-1" style={{ fontWeight: 500 }}>{item!.value}</span>
            </div>
          ))}
        </div>

        {/* Reject reason selector */}
        <AnimatePresence>
          {action === 'reject' && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden" style={{ borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
              <div className="px-4 py-3 space-y-2">
                <p className="text-[11px] text-[#1A3D4A]" style={{ fontWeight: 600 }}>选择拒绝原因</p>
                <div className="flex flex-wrap gap-1.5">
                  {REJECT_REASONS.map(r => (
                    <button key={r} onClick={() => setRejectReason(r)}
                      className="text-[10px] px-2 py-1 rounded-lg transition-all"
                      style={{
                        background: rejectReason === r ? '#1A3D4A' : 'rgba(26,61,74,0.06)',
                        color: rejectReason === r ? 'white' : '#6B6558',
                        border: rejectReason === r ? '1.5px solid #1A3D4A' : '1.5px solid rgba(26,61,74,0.1)',
                      }}>{r}</button>
                  ))}
                </div>
                {rejectReason === '其他原因' && (
                  <input value={customReason} onChange={e => setCustomReason(e.target.value)}
                    placeholder="请填写具体原因"
                    className="w-full px-3 py-2 rounded-xl text-xs outline-none"
                    style={{ background: 'rgba(26,61,74,0.04)', border: '1.5px solid rgba(26,61,74,0.12)', color: '#1A3D4A' }} />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Actions */}
        <div className="px-4 py-4 flex gap-2.5">
          {action === 'view' ? (
            <>
              <button onClick={() => setAction('reject')}
                className="flex-1 py-2.5 rounded-xl text-sm transition-all"
                style={{ border: '1px solid rgba(220,38,38,0.25)', color: '#DC2626', background: 'rgba(220,38,38,0.04)' }}>
                拒绝
              </button>
              <button onClick={() => onApprove(order.id)}
                className="flex-1 py-2.5 rounded-xl text-sm text-white transition-all"
                style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
                同意授权
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setAction('view')}
                className="flex-1 py-2.5 rounded-xl text-sm text-[#6B6558] transition-all"
                style={{ border: '1px solid rgba(26,61,74,0.12)', background: 'white' }}>
                返回
              </button>
              <button onClick={() => finalReason && onReject(order.id, finalReason)} disabled={!finalReason}
                className="flex-1 py-2.5 rounded-xl text-sm text-white transition-all"
                style={{ background: finalReason ? '#DC2626' : 'rgba(220,38,38,0.3)', cursor: finalReason ? 'pointer' : 'not-allowed' }}>
                确认拒绝
              </button>
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── QR Code Mock ─────────────────────────────────────────────────────────────

function QRCodeMock({ size = 144, color = '#000000', seed = 1 }: { size?: number; color?: string; seed?: number }) {
  const N = 21;
  const cell = size / N;

  const isDark = (r: number, c: number): boolean => {
    // Top-left finder 7×7
    if (r < 7 && c < 7) {
      if (r === 0 || r === 6 || c === 0 || c === 6) return true;
      if (r >= 2 && r <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    // Top-right finder
    if (r < 7 && c >= 14) {
      const cc = c - 14;
      if (r === 0 || r === 6 || cc === 0 || cc === 6) return true;
      if (r >= 2 && r <= 4 && cc >= 2 && cc <= 4) return true;
      return false;
    }
    // Bottom-left finder
    if (r >= 14 && c < 7) {
      const rr = r - 14;
      if (rr === 0 || rr === 6 || c === 0 || c === 6) return true;
      if (rr >= 2 && rr <= 4 && c >= 2 && c <= 4) return true;
      return false;
    }
    // Timing pattern
    if (r === 6 || c === 6) return (r + c) % 2 === 0;
    // Quiet zone separators
    if ((r === 7 && c <= 7) || (r <= 7 && c === 7)) return false;
    if ((r === 7 && c >= 13) || (r <= 7 && c === 13)) return false;
    if ((r === 13 && c <= 7) || (r >= 13 && c === 7)) return false;
    // Data modules – deterministic pseudo-random
    const h = Math.abs(Math.sin(r * 137.5 + c * 53.1 + seed * 23.7)) * 10000;
    return (h - Math.floor(h)) > 0.46;
  };

  const rects: { x: number; y: number }[] = [];
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      if (isDark(r, c)) rects.push({ x: c * cell, y: r * cell });
    }
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      style={{ imageRendering: 'pixelated', display: 'block' }}>
      <rect width={size} height={size} fill="white" />
      {rects.map(({ x, y }, i) => (
        <rect key={i} x={x} y={y} width={cell} height={cell} fill={color} />
      ))}
    </svg>
  );
}

// ── Payment Modal ─────────────────────────────────────────────────────────────

function PaymentModal({ order, onSuccess, onClose }: {
  order: LicenseOrder;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [method, setMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [phase, setPhase] = useState<'qr' | 'processing' | 'success'>('qr');
  const [qrExpiry, setQrExpiry] = useState(300); // 5 minutes

  useEffect(() => {
    if (phase !== 'qr') return;
    setQrExpiry(300);
    const iv = setInterval(() => setQrExpiry(s => {
      if (s <= 1) { clearInterval(iv); return 0; }
      return s - 1;
    }), 1000);
    return () => clearInterval(iv);
  }, [method, phase]);

  const fmtExpiry = (s: number) =>
    `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

  const handleSimulatePay = async () => {
    setPhase('processing');
    await new Promise(r => setTimeout(r, 1800));
    setPhase('success');
    await new Promise(r => setTimeout(r, 1200));
    onSuccess();
  };

  const wechatGreen = '#07C160';
  const alipayBlue  = '#1677FF';
  const accentColor = method === 'wechat' ? wechatGreen : alipayBlue;
  const qrSeed      = method === 'wechat' ? 7 : 13;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-6"
      style={{ background: 'rgba(0,0,0,0.55)', backdropFilter: 'blur(6px)' }}
      onClick={phase === 'qr' ? onClose : undefined}>
      <motion.div initial={{ scale: 0.92, y: 16 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 16 }}
        className="w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'white', boxShadow: '0 32px 80px rgba(0,0,0,0.3)', border: '1.5px solid rgba(26,61,74,0.1)' }}
        onClick={e => e.stopPropagation()}>

        {/* ── Header ── */}
        <div className="px-5 py-4 flex items-center justify-between"
          style={{ background: 'linear-gradient(135deg, #0D2535, #1A3D4A)' }}>
          <div>
            <p className="text-sm text-white" style={{ fontWeight: 700 }}>确认支付</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'rgba(196,145,42,0.75)' }}>
              单号：{order.orderNo}
            </p>
          </div>
          {phase === 'qr' && (
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ── Amount bar ── */}
        <div className="px-5 py-3 flex items-center justify-between"
          style={{ background: 'rgba(245,240,232,0.8)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
          <div className="flex items-center gap-2 min-w-0">
            <img src={order.patternImage} alt="" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-[11px] text-[#1A3D4A] truncate" style={{ fontWeight: 600 }}>{order.patternTitle}</p>
              <p className="text-[10px] text-[#9B9590]">{order.templateLabel}</p>
            </div>
          </div>
          <span className="text-lg text-[#C4912A] flex-shrink-0 ml-3" style={{ fontWeight: 700 }}>
            ¥{order.price.toLocaleString()}
          </span>
        </div>

        {/* ── Body ── */}
        <div className="p-5">
          {phase === 'qr' && (
            <motion.div key="qr" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              {/* Payment method tabs */}
              <div className="flex gap-2 mb-4">
                {([
                  { key: 'wechat', label: '微信支付', color: wechatGreen },
                  { key: 'alipay', label: '支付宝',   color: alipayBlue  },
                ] as const).map(m => (
                  <button key={m.key} onClick={() => setMethod(m.key)}
                    className="flex-1 py-2 rounded-xl text-xs transition-all"
                    style={{
                      background: method === m.key ? m.color : 'rgba(26,61,74,0.04)',
                      color: method === m.key ? 'white' : '#6B6558',
                      fontWeight: method === m.key ? 700 : 400,
                      border: `1.5px solid ${method === m.key ? m.color : 'rgba(26,61,74,0.1)'}`,
                    }}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* QR area */}
              <div className="flex flex-col items-center">
                <div className="relative p-3 rounded-2xl mb-3"
                  style={{ background: 'white', border: `2px solid ${accentColor}22`, boxShadow: `0 4px 20px ${accentColor}18` }}>
                  {qrExpiry > 0 ? (
                    <QRCodeMock size={164} color={accentColor} seed={qrSeed} />
                  ) : (
                    /* QR expired overlay */
                    <div className="w-[164px] h-[164px] flex flex-col items-center justify-center gap-2"
                      style={{ background: 'rgba(255,255,255,0.9)' }}>
                      <RotateCcw className="w-8 h-8 text-[#9B9590]" />
                      <p className="text-xs text-[#6B6558]">二维码已过期</p>
                      <button onClick={() => setQrExpiry(300)}
                        className="text-[11px] px-3 py-1 rounded-lg text-white"
                        style={{ background: accentColor }}>刷新</button>
                    </div>
                  )}
                  {/* corner logo badge */}
                  <div className="absolute bottom-5 right-5 w-8 h-8 rounded-lg flex items-center justify-center"
                    style={{ background: accentColor }}>
                    <span className="text-white text-[10px]" style={{ fontWeight: 700 }}>
                      {method === 'wechat' ? '微' : '宝'}
                    </span>
                  </div>
                </div>

                <p className="text-xs text-[#6B6558] mb-1">
                  请使用{method === 'wechat' ? '微信' : '支付宝'}扫一扫完成支付
                </p>
                {qrExpiry > 0 && (
                  <p className="text-[10px] text-[#9B9590]">
                    二维码有效期：<span className="font-mono text-[#C4912A]">{fmtExpiry(qrExpiry)}</span>
                  </p>
                )}
              </div>

              {/* Simulate button – clearly labeled as test */}
              <div className="mt-4 space-y-2">
                <button onClick={handleSimulatePay}
                  className="w-full py-3 rounded-2xl text-sm text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
                  style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentColor}CC)`, fontWeight: 600, boxShadow: `0 4px 16px ${accentColor}40` }}>
                  模拟支付成功（演示环境）
                </button>
                <p className="text-[9px] text-center text-[#C4A88A]">
                  演示模式 · 实际产品将调起{method === 'wechat' ? '微信' : '支付宝'}完成真实支付
                </p>
              </div>
            </motion.div>
          )}

          {phase === 'processing' && (
            <motion.div key="proc" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="flex flex-col items-center py-8 gap-4">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: `linear-gradient(135deg, ${accentColor}18, ${accentColor}08)`, border: `2px solid ${accentColor}30` }}>
                <Coins className="w-8 h-8 animate-spin" style={{ color: accentColor }} />
              </div>
              <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 600 }}>支付处理中…</p>
              <p className="text-xs text-[#9B9590]">请勿关闭此窗口</p>
            </motion.div>
          )}

          {phase === 'success' && (
            <motion.div key="ok" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-8 gap-3">
              <div className="w-16 h-16 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(22,163,74,0.1)', border: '2px solid rgba(22,163,74,0.25)' }}>
                <CheckCircle2 className="w-8 h-8 text-green-600" />
              </div>
              <p className="text-sm text-[#1A3D4A]" style={{ fontWeight: 700 }}>支付成功！</p>
              <p className="text-xs text-[#9B9590] text-center leading-relaxed">
                「{order.patternTitle}」已自动入库<br />正在跳转至历史记录…
              </p>
            </motion.div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ── PaymentCard ───────────────────────────────────────────────────────────────

function PaymentCard({ order, onPay, onCancel }: { order: LicenseOrder; onPay: (id: string) => void; onCancel: (id: string) => void; }) {
  const { remaining, isExpired, formatted } = useCountdown(order.payDeadline);
  const urgentColor = remaining < 30 * 60 * 1000 && !isExpired;

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className="rounded-xl overflow-hidden"
      style={{ background: 'white', border: `1.5px solid ${urgentColor ? 'rgba(196,145,42,0.5)' : 'rgba(26,61,74,0.09)'}`, boxShadow: urgentColor ? '0 0 0 3px rgba(196,145,42,0.08)' : 'none' }}>
      {urgentColor && (
        <div className="px-3 py-1.5 text-[10px] flex items-center gap-1.5"
          style={{ background: 'rgba(196,145,42,0.1)', color: '#A8741A', fontWeight: 600 }}>
          <Hourglass className="w-2.5 h-2.5" /> 付款时间即将到期，请尽快完成支付
        </div>
      )}
      <div className="p-3.5 flex gap-3">
        <img src={order.patternImage} alt={order.patternTitle} className="w-14 h-14 rounded-xl object-cover flex-shrink-0" style={{ border: '1.5px solid rgba(26,61,74,0.1)' }} />
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="text-sm text-[#1A3D4A] truncate" style={{ fontWeight: 700 }}>{order.patternTitle}</p>
              <p className="text-[10px] text-[#9B9590] mt-0.5">{order.sellerName} · {order.templateLabel}</p>
            </div>
            <StatusBadge {...ORDER_STATUS_CFG[order.status]} />
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-3">
              <span className="text-sm text-[#C4912A]" style={{ fontWeight: 700 }}>¥{order.price.toLocaleString()}</span>
              {!isExpired && (
                <div className="flex items-center gap-1">
                  <Timer className="w-3 h-3 text-[#C4912A]" />
                  <span className="text-[11px] font-mono" style={{ color: urgentColor ? '#C4912A' : '#6B6558', fontWeight: 600 }}>{formatted}</span>
                </div>
              )}
              {isExpired && <span className="text-[11px] text-red-500">已超时，订单失效</span>}
            </div>
            {!isExpired && (
              <div className="flex items-center gap-1.5">
                <button onClick={() => onCancel(order.id)}
                  className="text-[11px] px-2 py-1 rounded-lg transition-all text-[#9B9590]"
                  style={{ border: '1px solid rgba(26,61,74,0.1)' }}>取消</button>
                <button onClick={() => onPay(order.id)}
                  className="text-[11px] px-3 py-1 rounded-lg text-white transition-all"
                  style={{ background: 'linear-gradient(135deg, #C4912A, #A87920)' }}>立即付款</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ── AllPatternsTab ────────────────────────────────────────────────────────────

function AllPatternsTab({ patterns, onView, onApply }: {
  patterns: MarketPattern[];
  onView: (p: MarketPattern) => void;
  onApply: (p: MarketPattern) => void;
}) {
  const [search, setSearch] = useState('');
  const [catFilter, setCatFilter] = useState('');
  const [styleFilter, setStyleFilter] = useState('');
  const [rightsFilter, setRightsFilter] = useState('');

  const filtered = patterns.filter(p => {
    if (p.ownerId === MY_USER_ID) return false;  // 自己发布的在「我发布的」页签查看
    if (p.publishStatus === 'off_shelf') return false;
    if (search && !p.title.includes(search) && !p.ownerName.includes(search) && !p.category.includes(search)) return false;
    if (catFilter && p.category !== catFilter) return false;
    if (styleFilter && p.style !== styleFilter) return false;
    if (rightsFilter === 'done' && p.rightsStatus !== 'done') return false;
    if (rightsFilter === 'none' && p.rightsStatus !== 'none') return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col">
      {/* Filter bar */}
      <div className="px-5 py-3 flex items-center gap-2.5 flex-shrink-0"
        style={{ background: 'rgba(245,240,232,0.7)', borderBottom: '1px solid rgba(26,61,74,0.06)' }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl flex-1 min-w-[180px]"
          style={{ background: 'white', border: '1px solid rgba(26,61,74,0.1)' }}>
          <Search className="w-3.5 h-3.5 text-[#9B9590] flex-shrink-0" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="搜索纹样名称、所有者、品类…"
            className="flex-1 text-xs bg-transparent outline-none text-[#1A3D4A] placeholder:text-[#9B9590]" />
          {search && <button onClick={() => setSearch('')}><X className="w-3 h-3 text-[#9B9590]" /></button>}
        </div>
        {[
          { value: catFilter, setter: setCatFilter, options: CATEGORIES, placeholder: '全部品类' },
          { value: styleFilter, setter: setStyleFilter, options: STYLES, placeholder: '全部风格' },
          { value: rightsFilter, setter: setRightsFilter, options: [{ v: 'done', l: '已授权' }, { v: 'none', l: '未授权' }] as any, placeholder: '授权状态' },
        ].map(({ value, setter, options, placeholder }, i) => (
          <div key={i} className="relative">
            <select value={value} onChange={e => setter(e.target.value)}
              className="text-xs rounded-xl px-3 py-2 pr-7 outline-none appearance-none text-[#1A3D4A]"
              style={{ background: 'white', border: '1px solid rgba(26,61,74,0.1)', minWidth: 88 }}>
              <option value="">{placeholder}</option>
              {options.map((o: any) => typeof o === 'string'
                ? <option key={o} value={o}>{o}</option>
                : <option key={o.v} value={o.v}>{o.l}</option>
              )}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-[#9B9590] pointer-events-none" />
          </div>
        ))}
        <span className="text-[11px] text-[#9B9590] flex-shrink-0">{filtered.length} 件</span>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <Store className="w-10 h-10 text-[#C4912A] mb-3" style={{ opacity: 0.5 }} />
            <p className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>暂无匹配纹样</p>
            <p className="text-sm text-[#9B9590] mt-1">尝试更换筛选条件</p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {filtered.map(p => (
              <MarketPatternCard key={p.id} pattern={p} onView={() => onView(p)} onApply={() => onApply(p)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MyPublishedTab ────────────────────────────────────────────────────────────

function MyPublishedTab({ patterns, onView, onToggleShelf }: {
  patterns: MarketPattern[];
  onView: (p: MarketPattern) => void;
  onToggleShelf: (id: string) => void;
}) {
  const mine = patterns.filter(p => p.ownerId === MY_USER_ID);
  return (
    <div className="h-full overflow-y-auto p-5" style={{ scrollbarWidth: 'thin' }}>
      {mine.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <Package className="w-10 h-10 text-[#C4912A] mb-3" style={{ opacity: 0.5 }} />
          <p className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>还没有发布纹样</p>
          <p className="text-sm text-[#9B9590] mt-1">在「我的纹库」中发布纹样后将在此展示</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-4">
          {mine.map(p => (
            <MarketPatternCard key={p.id} pattern={p} onView={() => onView(p)} onToggleShelf={() => onToggleShelf(p.id)} />
          ))}
        </div>
      )}
    </div>
  );
}

// ── MyApplicationsTab helpers (module-level to avoid remount-on-rerender) ─────

/** Generic read-only order row used for "审批中" and "历史" sections */
function AppOrderRow({ order }: { order: LicenseOrder }) {
  const cfg = ORDER_STATUS_CFG[order.status];
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl"
      style={{ background: 'white', border: '1px solid rgba(26,61,74,0.08)' }}>
      <img src={order.patternImage} alt={order.patternTitle} className="w-12 h-12 rounded-lg object-cover flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[#1A3D4A] truncate" style={{ fontWeight: 600 }}>{order.patternTitle}</p>
        <p className="text-[10px] text-[#9B9590] mt-0.5">{order.sellerName} · {order.templateLabel} · 单号 {order.orderNo}</p>
      </div>
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        <span className="text-sm text-[#C4912A]" style={{ fontWeight: 700 }}>¥{order.price.toLocaleString()}</span>
        <StatusBadge {...cfg} />
      </div>
    </div>
  );
}

/** Certificate-style card shown in the "已入库" section */
function ArchivedLicenseCard({ order }: { order: LicenseOrder }) {
  return (
    <div className="rounded-xl overflow-hidden"
      style={{ border: '1.5px solid rgba(22,163,74,0.22)', background: 'white' }}>
      {/* Green header bar */}
      <div className="px-3.5 py-2 flex items-center justify-between"
        style={{ background: 'rgba(22,163,74,0.07)', borderBottom: '1px solid rgba(22,163,74,0.12)' }}>
        <div className="flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5" style={{ color: '#16A34A' }} />
          <span className="text-[11px]" style={{ color: '#16A34A', fontWeight: 700 }}>已入库 · 授权生效</span>
        </div>
        <span className="text-[10px] text-[#9B9590]">{order.paidAt ?? order.appliedAt}</span>
      </div>
      {/* Content */}
      <div className="p-3 flex items-center gap-3">
        <img src={order.patternImage} alt={order.patternTitle}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
          style={{ border: '1px solid rgba(26,61,74,0.08)' }} />
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[#1A3D4A] truncate" style={{ fontWeight: 700 }}>{order.patternTitle}</p>
          <p className="text-[10px] text-[#6B6558] mt-0.5">{order.sellerName} · {order.templateLabel}</p>
          <p className="text-[10px] text-[#9B9590] mt-0.5 truncate">授权主体：{order.entity}</p>
          <p className="text-[10px] text-[#9B9590] truncate">单号 {order.orderNo}</p>
        </div>
        <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
          <span className="text-sm" style={{ color: '#16A34A', fontWeight: 700 }}>¥{order.price.toLocaleString()}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(22,163,74,0.1)', color: '#16A34A', fontWeight: 600 }}>已入库</span>
        </div>
      </div>
    </div>
  );
}

// ── MyApplicationsTab ─────────────────────────────────────────────────────────

function MyApplicationsTab({ orders, onPay, onCancel }: {
  orders: LicenseOrder[];
  onPay: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  const myOrders = orders.filter(o => o.direction === 'buy');

  // 待付款：卖方已审批，等待买方付款
  const pendingPay = myOrders.filter(o => o.status === 'approved_pending_pay');
  // 审批中：已提交，等待卖方审批
  const reviewing = myOrders.filter(o => o.status === 'submitted');
  // 已入库：付款即完成，无需再等卖方确认（completed / paid 均视为已入库）
  const archived = myOrders.filter(o => o.status === 'completed' || o.status === 'paid');
  // 历史（已关闭）：拒绝 / 失效
  const closed = myOrders.filter(o => o.status === 'rejected' || o.status === 'expired');

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth: 'thin' }}>

      {/* ① 待付款 */}
      {pendingPay.length > 0 && (
        <div>
          <p className="text-[11px] text-[#C4912A] mb-2.5 flex items-center gap-1.5" style={{ fontWeight: 600 }}>
            <Hourglass className="w-3.5 h-3.5" /> 待付款（{pendingPay.length}）· 请在倒计时结束前完成支付
          </p>
          <div className="space-y-2.5">
            {pendingPay.map(o => <PaymentCard key={o.id} order={o} onPay={onPay} onCancel={onCancel} />)}
          </div>
        </div>
      )}

      {/* ② 审批中 */}
      {reviewing.length > 0 && (
        <div>
          <p className="text-[11px] text-[#1A3D4A] mb-2.5 flex items-center gap-1.5" style={{ fontWeight: 600 }}>
            <Clock className="w-3.5 h-3.5" /> 待卖方审批（{reviewing.length}）
          </p>
          <div className="space-y-2">
            {reviewing.map(o => <AppOrderRow key={o.id} order={o} />)}
          </div>
        </div>
      )}

      {/* ③ 已入库 —— 付款即生效，无需卖方二次确认 */}
      {archived.length > 0 && (
        <div>
          <p className="text-[11px] mb-2.5 flex items-center gap-1.5" style={{ color: '#16A34A', fontWeight: 600 }}>
            <CheckCircle2 className="w-3.5 h-3.5" /> 已入库（{archived.length}）· 授权已生效，纹样已存入「我的纹库」
          </p>
          <div className="space-y-2.5">
            {archived.map(o => <ArchivedLicenseCard key={o.id} order={o} />)}
          </div>
        </div>
      )}

      {/* ④ 历史（拒绝 / 失效） */}
      {closed.length > 0 && (
        <div>
          <p className="text-[11px] text-[#9B9590] mb-2.5" style={{ fontWeight: 600 }}>历史记录（{closed.length}）</p>
          <div className="space-y-2">
            {closed.map(o => <AppOrderRow key={o.id} order={o} />)}
          </div>
        </div>
      )}

      {myOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <FileText className="w-10 h-10 text-[#C4912A] mb-3" style={{ opacity: 0.5 }} />
          <p className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>还没有授权申请</p>
          <p className="text-sm text-[#9B9590] mt-1">在「可授权纹样」中找到心仪纹样后，点击「申请授权」发起申请</p>
        </div>
      )}
    </div>
  );
}

// ── PendingMyActionTab ────────────────────────────────────────────────────────

function PendingMyActionTab({ orders, onReview }: {
  orders: LicenseOrder[];
  onReview: (order: LicenseOrder) => void;
}) {
  const sellOrders = orders.filter(o => o.direction === 'sell');
  const pending = sellOrders.filter(o => o.status === 'submitted');
  const history = sellOrders.filter(o => o.status !== 'submitted');

  // Revenue stats
  const completedOrders = sellOrders.filter(o => o.status === 'completed');
  const totalGross = completedOrders.reduce((s, o) => s + o.price, 0);
  const totalNet = Math.round(totalGross * 0.9);
  const totalCommission = totalGross - totalNet;

  const RowItem = ({ order, isPending }: { order: LicenseOrder; isPending: boolean }) => {
    const cfg = ORDER_STATUS_CFG[order.status];
    return (
      <tr className="border-b" style={{ borderColor: 'rgba(26,61,74,0.06)' }}>
        <td className="py-3 px-3">
          <div className="flex items-center gap-2">
            <img src={order.patternImage} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
            <span className="text-xs text-[#1A3D4A] truncate max-w-[120px]" style={{ fontWeight: 600 }}>{order.patternTitle}</span>
          </div>
        </td>
        <td className="py-3 px-3">
          <p className="text-xs text-[#1A3D4A]">{order.buyerName}</p>
          <p className="text-[10px] text-[#9B9590] mt-0.5">{order.entity}</p>
        </td>
        <td className="py-3 px-3"><span className="text-[10px] text-[#6B6558]">{order.templateLabel}</span></td>
        <td className="py-3 px-3"><p className="text-[10px] text-[#6B6558] max-w-[120px] line-clamp-2">{order.purpose}</p></td>
        <td className="py-3 px-3 text-right"><span className="text-sm text-[#C4912A]" style={{ fontWeight: 700 }}>¥{order.price.toLocaleString()}</span></td>
        <td className="py-3 px-3"><span className="text-[10px] text-[#9B9590]">{order.appliedAt.slice(0, 10)}</span></td>
        <td className="py-3 px-3">
          {isPending ? (
            <button onClick={() => onReview(order)}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs text-white transition-all hover:scale-105"
              style={{ background: 'linear-gradient(135deg, #1A3D4A, #2A5568)' }}>
              处理 <ChevronRight className="w-3 h-3" />
            </button>
          ) : (
            <StatusBadge {...cfg} />
          )}
        </td>
      </tr>
    );
  };

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5" style={{ scrollbarWidth: 'thin' }}>

      {/* Revenue Summary Card */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(196,145,42,0.25)' }}>
        <div className="px-4 py-3 flex items-center gap-2"
          style={{ background: 'linear-gradient(135deg, rgba(26,61,74,0.08), rgba(196,145,42,0.04))', borderBottom: '1px solid rgba(196,145,42,0.12)' }}>
          <BarChart3 className="w-4 h-4 text-[#C4912A]" />
          <span className="text-[11px] text-[#1A3D4A]" style={{ fontWeight: 700 }}>我的收益概览 · 分账透明</span>
          <span className="ml-auto text-[9px] text-[#9B9590]">平台佣金固定10% · T+7结算</span>
        </div>
        <div className="grid grid-cols-3 divide-x" style={{ background: 'white', borderColor: 'rgba(26,61,74,0.07)' }}>
          {[
            { label: '成交总额', value: `¥${totalGross.toLocaleString()}`, sub: '买家实付', color: '#1A3D4A' },
            { label: '平台服务费', value: `¥${totalCommission.toLocaleString()}`, sub: '10%佣金', color: '#C4912A' },
            { label: '我的净收入', value: `¥${totalNet.toLocaleString()}`, sub: '90% · T+7到账', color: '#16A34A' },
          ].map((item, i) => (
            <div key={i} className="px-3 py-2.5 text-center" style={{ borderColor: 'rgba(26,61,74,0.07)' }}>
              <p className="text-[10px] text-[#9B9590] mb-0.5">{item.label}</p>
              <p style={{ fontWeight: 700, fontSize: 15, color: item.color }}>{item.value}</p>
              <p className="text-[9px] text-[#C4A88A] mt-0.5">{item.sub}</p>
            </div>
          ))}
        </div>
        {completedOrders.length > 0 && (
          <div className="px-4 py-2 text-[10px] text-[#9B9590]" style={{ background: 'rgba(26,61,74,0.02)', borderTop: '1px solid rgba(26,61,74,0.05)' }}>
            已完成 {completedOrders.length} 笔交易 · 资金结算至绑定收款账户（T+7工作日）
          </div>
        )}
      </div>

      {pending.length > 0 && (
        <div>
          <p className="text-[11px] text-[#1A3D4A] mb-2.5 flex items-center gap-1.5" style={{ fontWeight: 600 }}>
            <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center">{pending.length}</span>
            待审批（{pending.length}）
          </p>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(26,61,74,0.09)' }}>
            <table className="w-full" style={{ background: 'white' }}>
              <thead>
                <tr style={{ background: 'rgba(245,240,232,0.8)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
                  {['申请纹样', '申请方', '授权模板', '使用用途', '报价', '申请时间', '操作'].map(h => (
                    <th key={h} className="py-2.5 px-3 text-left text-[10px] text-[#9B9590]" style={{ fontWeight: 600, letterSpacing: '0.05em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {pending.map(o => <RowItem key={o.id} order={o} isPending={true} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {history.length > 0 && (
        <div>
          <p className="text-[11px] text-[#9B9590] mb-2.5" style={{ fontWeight: 600 }}>历史记录（{history.length}）</p>
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(26,61,74,0.08)' }}>
            <table className="w-full" style={{ background: 'white' }}>
              <thead>
                <tr style={{ background: 'rgba(245,240,232,0.6)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
                  {['申请纹样', '申请方', '授权模板', '使用用途', '报价', '申请时间', '状态'].map(h => (
                    <th key={h} className="py-2.5 px-3 text-left text-[10px] text-[#9B9590]" style={{ fontWeight: 600 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {history.map(o => <RowItem key={o.id} order={o} isPending={false} />)}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {sellOrders.length === 0 && (
        <div className="flex flex-col items-center justify-center h-64 text-center">
          <CheckCircle2 className="w-10 h-10 text-[#C4912A] mb-3" style={{ opacity: 0.5 }} />
          <p className="text-[#1A3D4A]" style={{ fontWeight: 500 }}>暂无待处理申请</p>
          <p className="text-sm text-[#9B9590] mt-1">当有人申请您的纹样授权时，审批任务将显示在此</p>
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export function PatternMarketPage() {
  const { clearRedDot } = useApp();
  const [patterns, setPatterns] = useState<MarketPattern[]>(SEED_PATTERNS);
  const [orders, setOrders] = useState<LicenseOrder[]>(SEED_ORDERS);
  const [activeTab, setActiveTab] = useState<MarketTab>('all');
  const [detailPattern, setDetailPattern] = useState<MarketPattern | null>(null);
  const [applyTarget, setApplyTarget] = useState<MarketPattern | null>(null);
  const [reviewOrder, setReviewOrder] = useState<LicenseOrder | null>(null);
  const [payingOrder, setPayingOrder] = useState<LicenseOrder | null>(null);

  useEffect(() => { clearRedDot('market' as any); }, []);

  const pendingPayCount = orders.filter(o => o.direction === 'buy' && o.status === 'approved_pending_pay').length;
  const pendingReviewCount = orders.filter(o => o.direction === 'sell' && o.status === 'submitted').length;

  const TABS: { key: MarketTab; label: string; badge?: number }[] = [
    { key: 'all',     label: '可授权纹样' },
    { key: 'pending', label: '待我处理', badge: pendingReviewCount > 0 ? pendingReviewCount : undefined },
    { key: 'applied', label: '我申请的', badge: pendingPayCount > 0 ? pendingPayCount : undefined },
    { key: 'mine',    label: '我发布的', badge: patterns.filter(p => p.ownerId === MY_USER_ID && p.publishStatus === 'on_sale').length },
  ];

  const handleApplySubmit = (data: Partial<LicenseOrder>) => {
    if (!applyTarget) return;
    const newOrder: LicenseOrder = {
      id: `ord_${Date.now()}`,
      orderNo: `LIC-2026-${Date.now().toString().slice(-6)}`,
      patternId: applyTarget.id,
      patternTitle: applyTarget.title,
      patternImage: applyTarget.imageUrl,
      sellerId: applyTarget.ownerId,
      sellerName: applyTarget.ownerName,
      buyerName: MY_USER_NAME,
      template: data.template!,
      templateLabel: data.templateLabel!,
      purpose: data.purpose!,
      entity: data.entity!,
      productCategory: data.productCategory!,
      channel: data.channel!,
      region: data.region!,
      allowDerivative: data.allowDerivative ?? false,
      projectName: data.projectName,
      quantityLimit: data.quantityLimit,
      price: data.price!,
      status: 'submitted',
      direction: 'buy',
      appliedAt: new Date().toLocaleString('zh-CN').replace(/\//g, '-'),
    };
    setOrders(prev => [newOrder, ...prev]);
    setApplyTarget(null);
    setActiveTab('applied');
    toast.success('授权申请已提交', { description: `已向「${applyTarget.ownerName}」发起申请，等待对方审批` });
  };

  const handleApprove = (orderId: string) => {
    const deadline = Date.now() + 2 * 60 * 60 * 1000;
    setOrders(prev => prev.map(o => o.id === orderId
      ? { ...o, status: 'approved_pending_pay' as OrderStatus, approvedAt: new Date().toLocaleString('zh-CN').replace(/\//g, '-'), payDeadline: deadline }
      : o));
    setReviewOrder(null);
    toast.success('已同意授权', { description: '买方将在2小时内完成付款，超时自动取消' });
  };

  const handleReject = (orderId: string, reason: string) => {
    setOrders(prev => prev.map(o => o.id === orderId
      ? { ...o, status: 'rejected' as OrderStatus, rejectReason: reason }
      : o));
    setReviewOrder(null);
    toast.info('已拒绝授权申请', { description: `拒绝原因：${reason}` });
  };

  const handlePay = (orderId: string) => {
    // 打开支付弹窗
    const order = orders.find(o => o.id === orderId);
    if (order) setPayingOrder(order);
  };

  const handlePaySuccess = () => {
    if (!payingOrder) return;
    const orderId = payingOrder.id;
    const title   = payingOrder.patternTitle;
    setOrders(prev => prev.map(o =>
      o.id === orderId
        ? { ...o, status: 'completed' as OrderStatus, paidAt: new Date().toLocaleString('zh-CN').replace(/\//g, '-') }
        : o
    ));
    setPayingOrder(null);
    toast.success('付款成功！纹样已自动入库', { description: `「${title}」已进入您的「我的纹库」，来源：授权获得` });
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'expired' as OrderStatus } : o));
    toast.info('已取消订单');
  };

  const handleToggleShelf = (patternId: string) => {
    const pattern = patterns.find(p => p.id === patternId);
    if (!pattern) return;
    const next: PublishStatus = pattern.publishStatus === 'on_sale' ? 'off_shelf' : 'on_sale';
    setPatterns(prev => prev.map(p => p.id === patternId ? { ...p, publishStatus: next } : p));
    toast.success(next === 'on_sale' ? '已重新上架' : '已下架', { description: next === 'off_shelf' ? '纹样已从市集移除，可随时重新上架' : '纹样已重新在市集展示' });
  };

  return (
    <div className="flex flex-col h-full" style={{ background: '#F5F0E8' }}>

      {/* ── Header ── */}
      <div className="flex-shrink-0 px-6 py-4"
        style={{ background: 'rgba(245,240,232,0.95)', borderBottom: '1px solid rgba(26,61,74,0.07)' }}>
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2.5 mb-0.5">
              <h1 className="text-[#1A3D4A]" style={{ fontSize: 18, fontWeight: 700 }}>纹样市集 · 授权交易广场</h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full text-white"
                style={{ background: '#1A3D4A', fontWeight: 600 }}>{patterns.filter(p => p.publishStatus === 'on_sale').length} 件在售</span>
            </div>
            <p className="text-xs text-[#9B9590] mt-0.5">汇聚非遗智造纹样，一站式浏览·申请授权·交易成交·自动入库 </p>
          </div>
          {/* Quick task badges */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {pendingPayCount > 0 && (
              <button onClick={() => setActiveTab('applied')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
                style={{ background: 'rgba(196,145,42,0.12)', border: '1px solid rgba(196,145,42,0.35)', color: '#A8741A', fontWeight: 600 }}>
                <Hourglass className="w-3 h-3" /> 待付款
                <span className="w-4 h-4 rounded-full bg-[#C4912A] text-white flex items-center justify-center text-[9px]">{pendingPayCount}</span>
              </button>
            )}
            {pendingReviewCount > 0 && (
              <button onClick={() => setActiveTab('pending')}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all"
                style={{ background: 'rgba(139,32,32,0.08)', border: '1px solid rgba(139,32,32,0.2)', color: '#8B2020', fontWeight: 600 }}>
                <AlertTriangle className="w-3 h-3" /> 待处理
                <span className="w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center text-[9px]">{pendingReviewCount}</span>
              </button>
            )}
          </div>
        </div>
        {/* Tab bar */}
        <div className="flex gap-1">
          {TABS.map(tab => (
            <button key={tab.key} onClick={() => setActiveTab(tab.key)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs transition-all relative"
              style={{
                background: activeTab === tab.key ? '#1A3D4A' : 'rgba(26,61,74,0.06)',
                color: activeTab === tab.key ? 'white' : '#6B6558',
                fontWeight: activeTab === tab.key ? 600 : 400,
              }}>
              {tab.label}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px]"
                  style={{ background: activeTab === tab.key ? 'rgba(255,255,255,0.25)' : '#DC2626', color: activeTab === tab.key ? 'white' : 'white', fontWeight: 700 }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ── Content ── */}
      <div className="flex-1 overflow-hidden">
        <AnimatePresence mode="wait">
          {activeTab === 'all' && (
            <motion.div key="all" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <AllPatternsTab patterns={patterns} onView={setDetailPattern} onApply={setApplyTarget} />
            </motion.div>
          )}
          {activeTab === 'mine' && (
            <motion.div key="mine" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <MyPublishedTab patterns={patterns} onView={setDetailPattern} onToggleShelf={handleToggleShelf} />
            </motion.div>
          )}
          {activeTab === 'applied' && (
            <motion.div key="applied" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <MyApplicationsTab orders={orders} onPay={handlePay} onCancel={handleCancelOrder} />
            </motion.div>
          )}
          {activeTab === 'pending' && (
            <motion.div key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="h-full">
              <PendingMyActionTab orders={orders} onReview={setReviewOrder} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── Overlays ── */}
      <AnimatePresence>
        {detailPattern && (
          <PatternDetailPanel
            key="detail"
            pattern={detailPattern}
            onClose={() => setDetailPattern(null)}
            onApply={() => { setApplyTarget(detailPattern); setDetailPattern(null); }}
          />
        )}
        {applyTarget && (
          <LicenseApplyDrawer
            key="apply"
            pattern={applyTarget}
            onClose={() => setApplyTarget(null)}
            onSubmit={handleApplySubmit}
          />
        )}
        {reviewOrder && (
          <LicenseReviewModal
            key="review"
            order={reviewOrder}
            onClose={() => setReviewOrder(null)}
            onApprove={handleApprove}
            onReject={handleReject}
          />
        )}
        {payingOrder && (
          <PaymentModal
            key="payment"
            order={payingOrder}
            onSuccess={handlePaySuccess}
            onClose={() => setPayingOrder(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
