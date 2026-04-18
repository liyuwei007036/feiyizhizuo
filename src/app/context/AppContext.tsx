import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { readAuthSession, subscribeAuthSession } from '../services/authSession';
import { patternService } from '../services/patternService';

export type Language = 'zh' | 'en';
export type UserRole = 'designer' | 'admin';
export type Action = 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export' | 'manage';
export type ModuleKey = 'zhihui' | 'copilot' | 'proposals' | 'materials' | 'market' | 'admin';

// ── Permission Matrix ──────────────────────────────────────────────────────────
export const ROLE_PERMISSIONS: Record<UserRole, Partial<Record<ModuleKey, Action[]>>> = {
  designer: {
    zhihui:    ['view', 'create', 'edit'],
    copilot:   ['view', 'create'],
    proposals: ['view', 'create', 'edit'],
    materials: ['view', 'create', 'edit'],
    market:    ['view', 'create', 'edit'],
  },
  admin: {
    zhihui:    ['view', 'create', 'edit', 'delete', 'manage'],
    copilot:   ['view', 'create', 'edit', 'manage'],
    proposals: ['view', 'create', 'edit', 'delete', 'approve', 'manage'],
    materials: ['view', 'create', 'edit', 'delete', 'manage'],
    market:    ['view', 'create', 'edit', 'delete', 'approve', 'manage'],
    admin:     ['view', 'create', 'edit', 'delete', 'manage'],
  },
};

// ── Module metadata ────────────────────────────────────────────────────────────
export const MODULE_META: Record<ModuleKey, { zh: string; en: string; allowedRoles: UserRole[] }> = {
  zhihui:    { zh: '智绘',     en: 'ZhiHui',          allowedRoles: ['designer', 'admin'] },
  copilot:   { zh: '设计提案', en: 'Design Proposal',  allowedRoles: ['designer', 'admin'] },
  proposals: { zh: '提案中心', en: 'Proposals',        allowedRoles: ['designer', 'admin'] },
  materials: { zh: '我的纹样', en: 'My Patterns',      allowedRoles: ['designer', 'admin'] },
  market:    { zh: '纹样市集', en: 'Pattern Market',   allowedRoles: ['designer', 'admin'] },
  admin:     { zh: '系统设置', en: 'Settings',         allowedRoles: ['admin'] },
};

export const ROLE_LABELS: Record<UserRole, { zh: string; en: string; color: string; badge: string }> = {
  designer: { zh: '设计师', en: 'Designer', color: 'bg-[#1A3D4A]', badge: 'bg-[#1A3D4A]/10 text-[#1A3D4A]' },
  admin:    { zh: '管理员', en: 'Admin',    color: 'bg-[#8B2020]', badge: 'bg-red-100 text-red-700' },
};

export interface Notification {
  id: string;
  type: 'task' | 'message' | 'alert' | 'system';
  title: string;
  content: string;
  read: boolean;
  time: string;
  link?: string;
}

// ── Craft characteristics (品类专属工艺特征) ─────────────────────────────────
// Universal fields covering: 云锦, 宋锦, 蜀锦, 苏绣, 木雕, 陶瓷, etc.
export interface CraftInfo {
  weaveStructure: string;   // 织造/制作结构 (纬三重缎纹/浮雕/拉坯成型...)
  technique: string;        // 工艺技法 (妆花挖梭/缂丝/雕版/手捏...)
  colorLayers: string;      // 色彩层次/套色数 (12套色/3-5层次...)
  repeatSize: string;       // 纹样循环单元尺寸 (28×28 cm)
  materialSpec: string;     // 材质规格详述 (桑蚕丝 2/20/22D, 金银线...)
  complexity: number;       // 工艺复杂度 1-5
  heritageSource: string;   // 传承来源/工坊 (南京云锦传承基地·柯桂荣工坊)
  innovationPoints: string; // 创新亮点
  patternDesc: string;      // 图案描述
  adaptProducts: string;    // 适配方向
}

// ── My Pattern (我的纹样) ──────────────────────────────────────────────────────
export interface MyPattern {
  id: string;
  title: string;
  desc: string;
  tags: string[];
  imageUrl: string;
  savedAt: string;
  source: 'zhihui' | 'copilot' | 'upload' | 'licensed';
  sourceLabel: string;
  coverFileId?: string;
  sourceBizId?: string;

  // Classification fields (通用分类字段)
  category?: string;    // 品类: 云锦/宋锦/蜀锦/苏绣/木雕/陶瓷...
  style?: string;       // 风格类别
  material?: string;    // 材质/介质
  colorTone?: string;   // 色彩基调
  createdAt?: string;   // 创作时间

  // Rights confirmation (确权)
  rightsStatus: 'none' | 'processing' | 'done';
  certNo?: string;       // 证书编号 (EC-YYYY-XXXX)
  certIssuedAt?: string; // 确权日期

  // Copyright certification (版权认证)
  copyrightStatus: 'none' | 'applied' | 'done';
  copyrightCertNo?: string;
  copyrightCertFileId?: string;
  copyrightDoneAt?: string;
  copyrightCertImageUrl?: string; // 用户上传的国家版权局证书图片（自有证书）
  hasCopyrightCert?: boolean;     // 上传时是否已持有版权证书

  // Marketplace publication (纹样市集发布)
  published: boolean;
  listingStatus?: 'unpublished' | 'published';
  price?: string;       // 发布定价 (元/授权)
  publishedAt?: string;

  // Craft info (filled during rights confirmation)
  craftInfo?: CraftInfo;
  canDelete?: boolean;
  canPublish?: boolean;
  canApplyCopyright?: boolean;
  canConfirmRights?: boolean;
  canUnpublish?: boolean;
  canSyncCopyrightCert?: boolean;
}

// Backward-compatible alias for ZhiHuiPage
export type SavedLibraryPattern = MyPattern;

export interface CopilotClient {
  id: string;
  name: string;
  company: string;
  stage: string;
  lastContactAt: string;
  intent: string;
  industry: string;
  phone: string;
  budget: string;
  notes: string;
}

export interface CopilotProposal {
  id: string;
  clientId: string;
  title: string;
  clientName: string;
  clientCompany: string;
  directionType: string;
  summary: string;
  patterns: string[];
  products: string[];
  budget: string;
  addedAt: string;
  status: 'draft' | 'presenting' | 'follow_up' | 'signed';
  patternImageUrl?: string;
  patternTitle?: string;
}

// ── Authorization & Transaction (授权交易系统) ──────────────────────────────────

/** 卖家资料认证状态 */
export type SellerStatus = 'none' | 'pending' | 'verified';

/** 卖家类型 */
export type SellerType = 'individual' | 'business' | 'enterprise';

/** 授权模板类型 */
export type LicenseTemplate = 'project' | 'annual' | 'limited';

/** 协议签署状态 */
export type AgreementStatus = 'unsigned' | 'signed';

/** 收款账户状态 */
export type PaymentAccountStatus = 'unbound' | 'pending' | 'verified';

/** 结算状态 */
export type SettlementStatus = 'pending' | 'processing' | 'completed' | 'frozen';

/** 卖家资料 */
export interface SellerProfile {
  userId: string;
  status: SellerStatus;
  sellerType?: SellerType;
  realName?: string;           // 真实姓名或企业名称
  idNumber?: string;           // 证件号码或统一社会信用代码
  contactPhone?: string;
  contactAddress?: string;
  businessLicense?: string;    // 营业执照(企业)
  appliedAt?: string;
  verifiedAt?: string;
}

/** 平台协议签署记录 */
export interface SellerAgreement {
  userId: string;
  serviceAgreement: AgreementStatus;      // 平台服务协议
  transactionRules: AgreementStatus;      // 纹样授权交易规则
  feeRules: AgreementStatus;              // 平台收费与分账规则
  taxRules: AgreementStatus;              // 税务与发票说明
  violationRules: AgreementStatus;        // 侵权与违约处理规则
  signedAt?: string;
  commissionRate: number;                 // 平台佣金比例 (默认10%)
}

/** 收款账户 */
export interface PaymentAccount {
  userId: string;
  status: PaymentAccountStatus;
  accountType: 'bank' | 'alipay';         // 对公账户或支付宝
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  boundAt?: string;
  verifiedAt?: string;
}

/** 授权配置 */
export interface LicenseConfig {
  patternId: string;
  enableProject: boolean;       // 是否开放单项目授权
  enableAnnual: boolean;        // 是否开放年度授权
  enableLimited: boolean;       // 是否开放限量授权
  projectPrice?: number;        // 单项目基准价
  annualPrice?: number;         // 年度授权价格(自动=项目价×2.5)
  limitedTiers?: {              // 限量授权阶梯价格
    qty100: number;
    qty500: number;
    qty1000: number;
  };
  allowDerivative: boolean;     // 是否允许改编
  allowCommercial: boolean;     // 是否允许商用
  region: string;               // 授权地域
  productCategories: string[];  // 适用品类
}

/** 结算记录 */
export interface Settlement {
  id: string;
  orderId: string;
  orderNo: string;
  sellerId: string;
  sellerName: string;
  patternTitle: string;
  buyerAmount: number;          // 买家实付
  commissionRate: number;       // 平台佣金比例
  commission: number;           // 平台佣金金额
  channelFee: number;           // 支付通道费
  sellerIncome: number;         // 卖家净收入
  status: SettlementStatus;
  createdAt: string;
  settledAt?: string;
  frozenReason?: string;
}

/** 买家获得的授权资产 (带授权边界) */
export interface AuthorizedPattern extends MyPattern {
  authorizedFrom: 'license';    // 来源标记
  originalOwnerId: string;      // 原所有者
  originalOwnerName: string;
  licenseTemplate: LicenseTemplate;
  licenseRegion: string;        // 授权地域
  licensePeriod: string;        // 授权期限
  licenseQuantity?: number;     // 数量限制
  allowDerivative: boolean;     // 是否允许改编
  canRepublish: false;          // 不可再次发布
  canResell: false;             // 不可再次授权
  licensedAt: string;           // 授权生效时间
  expiresAt?: string;           // 到期时间
}

// ── Initial clients data ──────────────────────────────────────────────────────
const INITIAL_CLIENTS: CopilotClient[] = [
  {
    id: 'c1', name: '李文创主任', company: '故宫博物院文创部',
    stage: '提案中', lastContactAt: '2026-04-07 09:30', intent: '高意向', industry: '博物馆',
    phone: '13811110001', budget: '80000 – 150000',
    notes: '对文化辨识度要求高，偏好云锦工艺，希望有可讲述的故事线。',
  },
  {
    id: 'c2', name: '张院长助理', company: '敦煌研究院',
    stage: '跟进中', lastContactAt: '2026-04-06 16:30', intent: '中意向', industry: '景区',
    phone: '13922220002', budget: '40000 – 80000',
    notes: '对飞天纹样有强烈偏好，担心授权问题。',
  },
  {
    id: 'c3', name: '赵馆长', company: '苏州博物馆文创',
    stage: '待接触', lastContactAt: '2026-04-04 10:00', intent: '低意向', industry: '博物馆',
    phone: '13633330003', budget: '待确认',
    notes: '通过展会认识，对非遗文创感兴趣但没有明确项目需求。',
  },
];

const INITIAL_PROPOSALS: CopilotProposal[] = [
  {
    id: 'seed_1', clientId: 'c1', title: '故宫文创 · 云锦·典雅礼赠',
    clientName: '李文创主任', clientCompany: '故宫博物院文创部',
    directionType: '稳妥成交型',
    summary: '以四合如意云纹为主体，金色线描勾勒，米白底色，兼顾传统美感与商务稳重。',
    patterns: ['四合如意云纹', '金线云纹底纹'], products: ['高端礼盒', '真丝丝巾', '书签套装'],
    budget: '45000 – 80000', addedAt: '2026-04-06 14:22', status: 'presenting',
    patternImageUrl: 'https://images.unsplash.com/photo-1773394175834-2c407177ddcf?w=400',
    patternTitle: '祥云·典雅版',
  },
  {
    id: 'seed_2', clientId: 'c2', title: '敦煌研究院 · 锦绣·华彩记忆',
    clientName: '张院长助理', clientCompany: '敦煌研究院',
    directionType: '文化表达型',
    summary: '以南京地域文化符号为核心，结合云锦非遗工艺故事，突出可讲述性与文化深度。',
    patterns: ['飞天纹样变体', '敦煌团花纹'], products: ['文化礼盒', '艺术丝巾', '非遗说明册'],
    budget: '60000 – 120000', addedAt: '2026-04-05 10:15', status: 'draft',
    patternImageUrl: 'https://images.unsplash.com/photo-1674326607048-43e0bc88309e?w=400',
    patternTitle: '流云·现代感',
  },
];

// 智绘页的收藏态需要和用户真实操作保持一致，这里不再注入演示纹样。
const INITIAL_MY_PATTERNS: MyPattern[] = [];

interface AppContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  userRole: UserRole;
  setUserRole: (role: UserRole) => void;
  notifications: Notification[];
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  unreadCount: number;
  redDots: Record<string, number>;
  clearRedDot: (module: string) => void;
  setRedDot: (module: string, count: number) => void;
  t: (zh: string, en: string) => string;
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  watermarkText: string;
  hasPermission: (module: ModuleKey, action: Action) => boolean;
  canAccess: (module: ModuleKey) => boolean;
  userAvatar: string | null;
  setUserAvatar: (url: string | null) => void;
  userPhone: string;
  setUserPhone: (phone: string) => void;
  userName: string;
  setUserName: (name: string) => void;
  // 我的纹样
  myPatterns: MyPattern[];
  myPatternsLoading: boolean;
  reloadMyPatterns: () => Promise<MyPattern[]>;
  addMyPattern: (pattern: MyPattern) => void;
  updateMyPattern: (id: string, patch: Partial<MyPattern>) => void;
  removeMyPattern: (id: string) => void;
  // Backward compat aliases
  savedLibraryPatterns: MyPattern[];
  addLibraryPattern: (pattern: MyPattern) => void;
  removeLibraryPattern: (id: string) => void;
  // Copilot
  persistentClients: CopilotClient[];
  setPersistentClients: React.Dispatch<React.SetStateAction<CopilotClient[]>>;
  copilotProposals: CopilotProposal[];
  addCopilotProposal: (proposal: CopilotProposal) => void;
  // Authorization & Transaction (授权交易系统)
  sellerProfile: SellerProfile | null;
  updateSellerProfile: (profile: SellerProfile) => void;
  sellerAgreement: SellerAgreement | null;
  updateSellerAgreement: (agreement: SellerAgreement) => void;
  paymentAccount: PaymentAccount | null;
  updatePaymentAccount: (account: PaymentAccount) => void;
  licenseConfigs: Map<string, LicenseConfig>;
  updateLicenseConfig: (patternId: string, config: LicenseConfig) => void;
  settlements: Settlement[];
  addSettlement: (settlement: Settlement) => void;
  isSellerReady: boolean;  // 卖家是否完成入驻(认证+签约+绑定收款)
}

const AppContext = createContext<AppContextType | null>(null);

const initialNotifications: Notification[] = [
  { id: 'n1', type: 'task',    title: '纹样待确权提醒',      content: '「折枝牡丹·简化版」尚未完成确权，确权后可发布至纹样市集', read: false, time: '10分钟前' },
  { id: 'n2', type: 'task',    title: '版权认证申请已受理',   content: '「四合如意云纹·金版」版权认证申请已提交，预计7-15个工作日出结果', read: false, time: '32分钟前' },
  { id: 'n3', type: 'alert',   title: '确权处理进行中',       content: '「云水纹·茶器专用款」正在进行加密确权处理，请稍候', read: false, time: '1小时前' },
  { id: 'n4', type: 'message', title: '提案客户跟进提醒',     content: '客户「苏州博物馆文创部」已3天未回复提案，建议使用设计副驾生成跟进话术', read: false, time: '2小时前' },
  { id: 'n5', type: 'task',    title: '设计提案待处理',       content: '【景区礼品-飞天纹样方案】需要您审核，请尽快处理以推进成交', read: false, time: '3小时前' },
  { id: 'n6', type: 'system',  title: '确权证书生成成功',     content: '「飞天纹样变体·华彩」已完成加密确权，证书编号 EC-2026-0121，可前往我的纹样查看', read: true, time: '1天前' },
  { id: 'n7', type: 'system',  title: '系统日志更新',         content: '昨日新增操作日志 1,284 条，智绘模块使用率提升 38%', read: true, time: '1天前' },
];

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguage] = useState<Language>('zh');
  const [userRole, setUserRole] = useState<UserRole>('designer');
  const [notifications, setNotifications] = useState<Notification[]>(initialNotifications);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userAvatar, setUserAvatar] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState('13800000001');
  const [userName, setUserName] = useState('张三');
  const [myPatterns, setMyPatterns] = useState<MyPattern[]>(INITIAL_MY_PATTERNS);
  const [myPatternsLoading, setMyPatternsLoading] = useState(false);
  const [persistentClients, setPersistentClients] = useState<CopilotClient[]>(INITIAL_CLIENTS);
  const [copilotProposals, setCopilotProposals] = useState<CopilotProposal[]>(INITIAL_PROPOSALS);
  const [redDots, setRedDotsState] = useState<Record<string, number>>({
    zhihui: 2, copilot: 0, proposals: 3, materials: 2, admin: 1,
  });

  // Authorization & Transaction states
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [sellerAgreement, setSellerAgreement] = useState<SellerAgreement | null>(null);
  const [paymentAccount, setPaymentAccount] = useState<PaymentAccount | null>(null);
  const [licenseConfigs, setLicenseConfigs] = useState<Map<string, LicenseConfig>>(new Map());
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const markNotificationRead = useCallback((id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  }, []);

  const clearRedDot = useCallback((module: string) => {
    setRedDotsState(prev => ({ ...prev, [module]: 0 }));
  }, []);

  const setRedDot = useCallback((module: string, count: number) => {
    setRedDotsState(prev => ({ ...prev, [module]: count }));
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed(prev => !prev);
  }, []);

  const t = useCallback((zh: string, en: string) => language === 'zh' ? zh : en, [language]);

  const watermarkText = userRole === 'admin'
    ? '鋆寰｜非遗智作·管理员·内部专用'
    : `鋆寰｜非遗智作·${userName}`;

  const hasPermission = useCallback((module: ModuleKey, action: Action): boolean => {
    const perms = ROLE_PERMISSIONS[userRole][module];
    return Array.isArray(perms) && perms.includes(action);
  }, [userRole]);

  const canAccess = useCallback((module: ModuleKey): boolean => {
    return hasPermission(module, 'view');
  }, [hasPermission]);

  const reloadMyPatterns = useCallback(async () => {
    const session = readAuthSession();
    if (!session.accessToken && !session.refreshToken) {
      setMyPatterns([]);
      return [];
    }

    setMyPatternsLoading(true);
    try {
      const page = await patternService.pagePatterns({ pageNum: 1, pageSize: 200 });
      setMyPatterns(page.records);
      return page.records;
    } finally {
      setMyPatternsLoading(false);
    }
  }, []);

  const addMyPattern = useCallback((pattern: MyPattern) => {
    setMyPatterns(prev => {
      if (prev.some(p => p.id === pattern.id)) return prev;
      return [pattern, ...prev];
    });
    setRedDotsState(prev => ({ ...prev, materials: (prev.materials ?? 0) + 1 }));
  }, []);

  const updateMyPattern = useCallback((id: string, patch: Partial<MyPattern>) => {
    setMyPatterns(prev => prev.map(p => p.id === id ? { ...p, ...patch } : p));
  }, []);

  const removeMyPattern = useCallback((id: string) => {
    setMyPatterns(prev => prev.filter(p => p.id !== id));
  }, []);

  useEffect(() => {
    const snapshot = readAuthSession();
    if (snapshot.accessToken || snapshot.refreshToken) {
      void reloadMyPatterns().catch(() => {});
    }

    return subscribeAuthSession(nextSnapshot => {
      if (nextSnapshot.accessToken || nextSnapshot.refreshToken) {
        void reloadMyPatterns().catch(() => {});
        return;
      }
      setMyPatterns([]);
      setMyPatternsLoading(false);
    });
  }, [reloadMyPatterns]);

  const addCopilotProposal = useCallback((proposal: CopilotProposal) => {
    setCopilotProposals(prev => {
      if (prev.some(p => p.id === proposal.id)) return prev;
      return [proposal, ...prev];
    });
    setRedDotsState(prev => ({ ...prev, proposals: (prev.proposals ?? 0) + 1 }));
  }, []);

  // Authorization & Transaction callbacks
  const updateSellerProfile = useCallback((profile: SellerProfile) => {
    setSellerProfile(profile);
  }, []);

  const updateSellerAgreement = useCallback((agreement: SellerAgreement) => {
    setSellerAgreement(agreement);
  }, []);

  const updatePaymentAccount = useCallback((account: PaymentAccount) => {
    setPaymentAccount(account);
  }, []);

  const updateLicenseConfig = useCallback((patternId: string, config: LicenseConfig) => {
    setLicenseConfigs(prev => new Map(prev).set(patternId, config));
  }, []);

  const addSettlement = useCallback((settlement: Settlement) => {
    setSettlements(prev => [settlement, ...prev]);
  }, []);

  // 计算卖家是否完成入驻
  const isSellerReady = !!(
    sellerProfile?.status === 'verified' &&
    sellerAgreement?.serviceAgreement === 'signed' &&
    sellerAgreement?.transactionRules === 'signed' &&
    sellerAgreement?.feeRules === 'signed' &&
    paymentAccount?.status === 'verified'
  );

  return (
    <AppContext.Provider value={{
      language, setLanguage,
      userRole, setUserRole,
      notifications, markNotificationRead, markAllRead, unreadCount,
      redDots, clearRedDot, setRedDot,
      t,
      sidebarCollapsed, toggleSidebar,
      watermarkText,
      hasPermission, canAccess,
      userAvatar, setUserAvatar,
      userPhone, setUserPhone,
      userName, setUserName,
      myPatterns, myPatternsLoading, reloadMyPatterns, addMyPattern, updateMyPattern, removeMyPattern,
      savedLibraryPatterns: myPatterns,
      addLibraryPattern: addMyPattern,
      removeLibraryPattern: removeMyPattern,
      persistentClients, setPersistentClients,
      copilotProposals, addCopilotProposal,
      // Authorization & Transaction
      sellerProfile, updateSellerProfile,
      sellerAgreement, updateSellerAgreement,
      paymentAccount, updatePaymentAccount,
      licenseConfigs, updateLicenseConfig,
      settlements, addSettlement,
      isSellerReady,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
