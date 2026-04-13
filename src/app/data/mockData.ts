export interface Task {
  id: string;
  type: 'pending_review' | 'pending_auth' | 'pending_follow' | 'expired' | 'pending_archive';
  title: string;
  project: string;
  client: string;
  deadline: string;
  priority: 'high' | 'medium' | 'low';
  redDot: boolean;
  assignee: string;
}

export interface Project {
  id: string;
  name: string;
  client: string;
  scene: string;
  category: string;
  stage: '需求录入' | '方向生成' | '提案展示' | '跟进中' | '已签单' | '归档';
  updatedAt: string;
  manager: string;
  budget: string;
  coverImage?: string;
}

export interface Material {
  id: string;
  name: string;
  alias: string;
  source: string;
  author: string;
  inheritor: string;
  authStatus: 'commercial' | 'non-commercial' | 'restricted' | 'pending';
  authRange: string[];
  authExpiry: string;
  region: string;
  categories: string[];
  craftLimits: string;
  complexity: number;
  colorCount: number;
  tags: string[];
  imageUrl: string;
  registrationNo: string;
  evidenceNo: string;
  riskLevel: 'low' | 'medium' | 'high';
  historyCases: number;
  description: string;
}

export interface DesignDirection {
  id: string;
  title: string;
  description: string;
  elements: string[];
  styleScore: { traditional: number; modern: number; giftFeel: number; fashionable: number };
  craftWarning?: string;
  imageUrl: string;
  recommended: boolean;
}

export interface Proposal {
  id: string;
  projectName: string;
  client: string;
  contactPerson: string;
  phone: string;
  scene: string;
  budget: string;
  intentLevel: 'high' | 'medium' | 'low';
  status: 'draft' | 'presenting' | 'follow_up' | 'signed' | 'lost';
  schemes: number;
  createdAt: string;
  updatedAt: string;
  manager: string;
  coverImage: string;
  authNote: string;
  deliveryDays: number;
  priceRange: string;
}

export interface RightsRecord {
  id: string;
  projectName: string;
  versionId: string;
  createdAt: string;
  events: RightsEvent[];
  evidenceNo: string;
  evidenceStatus: 'pending' | 'submitted' | 'confirmed' | 'failed';
  authRecords: AuthRecord[];
  reuseAssets: ReuseAsset[];
}

export interface RightsEvent {
  id: string;
  time: string;
  type: 'input' | 'generate' | 'edit' | 'review' | 'proposal' | 'signed' | 'archive';
  operator: string;
  content: string;
  materialIds?: string[];
}

export interface AuthRecord {
  id: string;
  client: string;
  region: string;
  categories: string[];
  period: string;
  price: string;
  status: 'active' | 'expired' | 'revoked';
  type: 'first' | 'renewal' | 'secondary';
}

export interface ReuseAsset {
  id: string;
  name: string;
  type: 'theme_pack' | 'series_pack' | 'collab_pack';
  usageCount: number;
  tags: string[];
}

// ---- DATA ----

export const mockTasks: Task[] = [
  { id: 't1', type: 'pending_review', title: '待审核提案：景区礼品飞天纹样方案', project: '敦煌景区文创合作', client: '敦煌研究院', deadline: '今天 18:00', priority: 'high', redDot: true, assignee: '张设计师' },
  { id: 't2', type: 'pending_auth', title: '授权信息待补充：国宝纹样授权期限缺失', project: '南博文创合作-国宝纹样', client: '南京博物院', deadline: '明天 12:00', priority: 'high', redDot: true, assignee: '李运营' },
  { id: 't3', type: 'pending_follow', title: '客户跟进提醒：苏博文创部 3天未回复', project: '苏博丝巾系列', client: '苏州博物馆', deadline: '今天', priority: 'medium', redDot: true, assignee: '王销售' },
  { id: 't4', type: 'pending_review', title: '待审核：礼赠品牌联名-龙纹效果图', project: '故宫文创联名', client: '故宫博物院', deadline: '后天', priority: 'medium', redDot: true, assignee: '赵设计师' },
  { id: 't5', type: 'pending_archive', title: '版本归档待确认：项目完成归档证据包', project: '西溪湿地生态软装', client: '西溪湿地景区', deadline: '本周五', priority: 'low', redDot: true, assignee: '钱法务' },
  { id: 't6', type: 'expired', title: '已逾期：礼品包装提案未提交', project: '上海礼品展合作', client: '礼多多礼品', deadline: '昨天', priority: 'high', redDot: false, assignee: '王销售' },
];

export const mockProjects: Project[] = [
  { id: 'p1', name: '故宫文创·龙纹丝巾系列', client: '故宫博物院文创部', scene: '博物馆文创', category: '丝巾·服饰', stage: '提案展示', updatedAt: '2小时前', manager: '王销售', budget: '¥ 80,000 - 150,000' },
  { id: 'p2', name: '敦煌研究院景区礼品', client: '敦煌研究院', scene: '景区礼品', category: '礼盒·文具', stage: '方向生成', updatedAt: '5小时前', manager: '张设计师', budget: '¥ 30,000 - 60,000' },
  { id: 'p3', name: '南博国宝纹样文创', client: '南京博物院', scene: '博物馆文创', category: '软装·丝巾', stage: '跟进中', updatedAt: '1天前', manager: '李运营', budget: '¥ 120,000+' },
  { id: 'p4', name: '苏博丝巾系列设计', client: '苏州博物馆文创', scene: '博物馆文创', category: '丝巾', stage: '需求录入', updatedAt: '2天前', manager: '王销售', budget: '¥ 40,000 - 80,000' },
  { id: 'p5', name: '西溪湿地生态软装', client: '西溪湿地景区', scene: '软装·空间', category: '软装·壁挂', stage: '已签单', updatedAt: '3天前', manager: '赵设计师', budget: '¥ 200,000+' },
];

export const mockMaterials: Material[] = [
  {
    id: 'm1', name: '云纹·四合如意', alias: '如意云纹',
    source: '南京云锦研究所', author: '张志诚', inheritor: '国家级非遗传承人·张志诚',
    authStatus: 'commercial', authRange: ['商用', '可改造', '全国', '所有品类'],
    authExpiry: '2027-12-31', region: '全国', categories: ['丝巾', '服饰', '礼盒', '软装'],
    craftLimits: '色数≤12色，纬线浮长≤8mm，适用品类：丝巾/服饰/礼品', complexity: 7, colorCount: 8,
    tags: ['云纹', '传统', '如意', '吉祥', '可商用'], imageUrl: 'https://images.unsplash.com/photo-1718653159704-dbe7e2a99b36?w=400',
    registrationNo: 'YJ-2024-001', evidenceNo: 'EP-2024-0023', riskLevel: 'low',
    historyCases: 23, description: '四合如意云纹是云锦中最具代表性的纹样之一，寓意吉祥如意、四方圆满，适用范围广泛，授权条件完整。',
  },
  {
    id: 'm2', name: '飞天纹·敦煌系列', alias: '敦煌飞天',
    source: '敦煌研究院授权', author: '王惠民', inheritor: '敦煌研究院数字创意部',
    authStatus: 'restricted', authRange: ['商用', '不可改造', '仅限博物馆/景区', '不含服饰'],
    authExpiry: '2026-06-30', region: '全国', categories: ['礼盒', '文具', '海报'],
    craftLimits: '色数≤16色，纹样不可二次变形，仅限博物馆/景区联名场景', complexity: 9, colorCount: 14,
    tags: ['飞天', '敦煌', '仿古', '联名专用', '限制使用'], imageUrl: 'https://images.unsplash.com/photo-1702633958543-8e91aacb805e?w=400',
    registrationNo: 'DH-2023-089', evidenceNo: 'EP-2023-0156', riskLevel: 'medium',
    historyCases: 8, description: '敦煌飞天纹样来源于敦煌研究院数字化授权，使用场景有严格限制，仅允许用于博物馆/景区联名合作，不可二次改造变形。',
  },
  {
    id: 'm3', name: '龙纹·五爪正龙', alias: '正龙纹',
    source: '故宫博物院授权', author: '故宫文创研究院', inheritor: '-',
    authStatus: 'restricted', authRange: ['限客户专用', '故宫文创授权项目专用', '不可转授权'],
    authExpiry: '2026-12-31', region: '全国', categories: ['服饰', '丝巾', '礼盒'],
    craftLimits: '色数≤20色，仅可用于故宫联名合作项目，每项目需单独授权', complexity: 10, colorCount: 18,
    tags: ['龙纹', '故宫', '五爪龙', '专用授权', '高风险'], imageUrl: 'https://images.unsplash.com/photo-1708772874052-104a4bb60079?w=400',
    registrationNo: 'GG-2024-007', evidenceNo: 'EP-2024-0044', riskLevel: 'high',
    historyCases: 5, description: '五爪正龙纹为故宫博物院专属授权纹样，每次使用需故宫文创专项审批，不可转授权，是授权限制最严格的纹样之一。',
  },
  {
    id: 'm4', name: '莲花纹·水墨莲池', alias: '水墨莲',
    source: '独立设计师·陈映荷', author: '陈映荷', inheritor: '-',
    authStatus: 'commercial', authRange: ['商用', '可改造', '全国', '所有品类'],
    authExpiry: '2028-06-30', region: '全国', categories: ['全品类'],
    craftLimits: '色数≤10色，适用全品类，可现代化改造', complexity: 6, colorCount: 6,
    tags: ['莲花', '水墨', '现代', '可改造', '可商用'], imageUrl: 'https://images.unsplash.com/photo-1646181865497-4a1cb7508249?w=400',
    registrationNo: 'DZ-2025-031', evidenceNo: 'EP-2025-0078', riskLevel: 'low',
    historyCases: 15, description: '水墨莲池以中国传统水墨画技法呈现莲花题材，风格兼具传统韵味和现代审美，授权范围广，适合多种品类改造使用。',
  },
  {
    id: 'm5', name: '锦鸡纹·锦绣华章', alias: '锦鸡纹',
    source: '南京云锦研究所', author: '刘大鸣', inheritor: '省级非遗传承人·刘大鸣',
    authStatus: 'pending', authRange: ['授权审核中'],
    authExpiry: '待确认', region: '待确认', categories: ['待审核'],
    craftLimits: '授权信息补全中，暂不可商用', complexity: 8, colorCount: 12,
    tags: ['锦鸡', '华章', '非遗', '待审核'], imageUrl: 'https://images.unsplash.com/photo-1762803841224-3ecaef904981?w=400',
    registrationNo: '待补录', evidenceNo: '-', riskLevel: 'medium',
    historyCases: 0, description: '锦绣华章锦鸡纹传承自刘大鸣大师工作室，纹样精美，目前授权信息仍在完善中，暂不可直接商用。',
  },
  {
    id: 'm6', name: '牡丹纹·富贵连连', alias: '富贵牡丹',
    source: '苏州刺绣研究所', author: '周品珍', inheritor: '省级非遗传承人·周品珍',
    authStatus: 'commercial', authRange: ['商用', '可改造', '华东地区', '礼品/软装'],
    authExpiry: '2027-03-31', region: '华东', categories: ['礼品', '软装', '壁挂'],
    craftLimits: '色数≤14色，地域限华东，可改造但需保留核心纹样', complexity: 7, colorCount: 10,
    tags: ['牡丹', '富贵', '苏绣', '华东授权', '可改造'], imageUrl: 'https://images.unsplash.com/photo-1762529484921-37564418abaf?w=400',
    registrationNo: 'SE-2024-052', evidenceNo: 'EP-2024-0091', riskLevel: 'low',
    historyCases: 11, description: '富贵连连牡丹纹为苏绣传承人周品珍授权，以繁盛牡丹寓意富贵吉祥，适合华东区域礼品和软装品类。',
  },
];

export const mockDesignDirections: DesignDirection[] = [
  {
    id: 'd1', title: '朱砂·印记', description: '以云锦传统朱砂红为主色，融合四合如意云纹，呈现端庄典雅的古典气质，适合博物馆文创礼品场景。',
    elements: ['四合如意云纹', '朱砂红底色', '金线勾勒'],
    styleScore: { traditional: 85, modern: 30, giftFeel: 90, fashionable: 35 },
    imageUrl: 'https://images.unsplash.com/photo-1718653159704-dbe7e2a99b36?w=600',
    recommended: true,
  },
  {
    id: 'd2', title: '水墨·流云', description: '以水墨写意手法重构传统云纹，主色调为墨色与金色，现代与传统交融，适合品牌联名和时尚场景。',
    elements: ['水墨莲花纹', '云纹变体', '留白构图'],
    styleScore: { traditional: 55, modern: 75, giftFeel: 60, fashionable: 80 },
    craftWarning: '水墨渐变需特殊工艺处理，建议增加工艺师确认',
    imageUrl: 'https://images.unsplash.com/photo-1708772874052-104a4bb60079?w=600',
    recommended: false,
  },
  {
    id: 'd3', title: '锦绣·华彩', description: '以多彩云锦工艺呈现富贵牡丹与如意纹样组合，色彩饱满，适合高端礼赠和软装场景。',
    elements: ['富贵牡丹纹', '四合如意云纹', '多彩配色'],
    styleScore: { traditional: 80, modern: 45, giftFeel: 95, fashionable: 50 },
    imageUrl: 'https://images.unsplash.com/photo-1702633958543-8e91aacb805e?w=600',
    recommended: true,
  },
];

export const mockProposals: Proposal[] = [
  {
    id: 'pr1', projectName: '故宫文创·龙纹丝巾系列', client: '故宫博物院文创部', contactPerson: '李文创主任',
    phone: '138****8888', scene: '博物馆文创', budget: '¥ 80,000 - 150,000', intentLevel: 'high',
    status: 'presenting', schemes: 3, createdAt: '2026-03-28', updatedAt: '2小时前',
    manager: '王销售', coverImage: 'https://images.unsplash.com/photo-1646181865497-4a1cb7508249?w=600',
    authNote: '龙纹·五爪正龙：故宫专属授权，本项目已获授权确认', deliveryDays: 45, priceRange: '¥85,000起',
  },
  {
    id: 'pr2', projectName: '敦煌研究院景区礼品', client: '敦煌研究院', contactPerson: '张院长助理',
    phone: '139****6666', scene: '景区礼品', budget: '¥ 30,000 - 60,000', intentLevel: 'medium',
    status: 'follow_up', schemes: 2, createdAt: '2026-03-25', updatedAt: '1天前',
    manager: '张设计师', coverImage: 'https://images.unsplash.com/photo-1762529484921-37564418abaf?w=600',
    authNote: '飞天纹样已完成景区专项授权校验，可用范围：礼盒/文具', deliveryDays: 30, priceRange: '¥32,000起',
  },
  {
    id: 'pr3', projectName: '西溪湿地生态软装', client: '西溪湿地景区', contactPerson: '孙设计总监',
    phone: '137****5555', scene: '软装·空间', budget: '¥ 200,000+', intentLevel: 'high',
    status: 'signed', schemes: 4, createdAt: '2026-03-10', updatedAt: '3天前',
    manager: '赵设计师', coverImage: 'https://images.unsplash.com/photo-1762803841224-3ecaef904981?w=600',
    authNote: '四合如意云纹 + 富贵牡丹纹，授权已签署，归档中', deliveryDays: 60, priceRange: '¥210,000',
  },
  {
    id: 'pr4', projectName: '苏博丝巾系列设计', client: '苏州博物馆文创', contactPerson: '赵馆长',
    phone: '136****4444', scene: '博物馆文创', budget: '¥ 40,000 - 80,000', intentLevel: 'low',
    status: 'draft', schemes: 1, createdAt: '2026-04-01', updatedAt: '2天前',
    manager: '王销售', coverImage: 'https://images.unsplash.com/photo-1762529484921-37564418abaf?w=600',
    authNote: '纹样授权待确认', deliveryDays: 35, priceRange: '¥42,000起',
  },
];

export const mockRightsRecords: RightsRecord[] = [
  {
    id: 'r1',
    projectName: '故宫文创·龙纹丝巾系列',
    versionId: 'VER-2026-00087',
    createdAt: '2026-03-28',
    evidenceNo: 'EP-2026-0087',
    evidenceStatus: 'confirmed',
    events: [
      { id: 'e1', time: '2026-03-28 09:15', type: 'input', operator: '王销售', content: '需求录入：故宫文创丝巾项目，客户确认预算¥120,000', materialIds: [] },
      { id: 'e2', time: '2026-03-28 09:32', type: 'generate', operator: '张设计师', content: '生成3个设计方向，素材：龙纹·五爪正龙，四合如意云纹', materialIds: ['m1', 'm3'] },
      { id: 'e3', time: '2026-03-28 14:20', type: 'edit', operator: '张设计师', content: '调整方向1传统度参数至85，重新生成效果图' },
      { id: 'e4', time: '2026-03-29 10:00', type: 'review', operator: '李运营', content: '法务审核通过，龙纹授权校验通过，授权说明已附' },
      { id: 'e5', time: '2026-03-29 15:30', type: 'proposal', operator: '王销售', content: '现场提案，客户出席：李文创主任，展示3个方向' },
      { id: 'e6', time: '2026-04-01 11:00', type: 'signed', operator: '王销售', content: '客户确认方向1，签署授权合同，订单金额¥120,000' },
    ],
    authRecords: [
      { id: 'a1', client: '故宫博物院文创部', region: '全国', categories: ['丝巾', '服饰'], period: '2026-04-01 至 2028-03-31', price: '¥15,000/年', status: 'active', type: 'first' },
    ],
    reuseAssets: [
      { id: 'ra1', name: '故宫·龙纹传统系列包', type: 'theme_pack', usageCount: 1, tags: ['龙纹', '故宫', '高端'] },
    ],
  },
  {
    id: 'r2',
    projectName: '西溪湿地生态软装',
    versionId: 'VER-2026-00062',
    createdAt: '2026-03-10',
    evidenceNo: 'EP-2026-0062',
    evidenceStatus: 'submitted',
    events: [
      { id: 'e1', time: '2026-03-10 10:00', type: 'input', operator: '赵设计师', content: '需求录入：西溪湿地生态软装，场景：空间软装，预算¥200,000+' },
      { id: 'e2', time: '2026-03-10 10:45', type: 'generate', operator: '赵设计师', content: '生成4个方向，素材：富贵牡丹纹，四合如意云纹' },
      { id: 'e3', time: '2026-03-15 09:30', type: 'review', operator: '钱法务', content: '牡丹纹华东区域授权校验通过' },
      { id: 'e4', time: '2026-03-20 14:00', type: 'proposal', operator: '赵设计师', content: '现场提案，客户出席4人，演示全部4个方向' },
      { id: 'e5', time: '2026-03-28 16:00', type: 'signed', operator: '赵设计师', content: '项目成交，合同签署，金额¥210,000' },
    ],
    authRecords: [
      { id: 'a1', client: '西溪湿地景区', region: '华东', categories: ['软装', '壁挂'], period: '2026-04-01 至 2029-03-31', price: '¥20,000/年', status: 'active', type: 'first' },
    ],
    reuseAssets: [
      { id: 'ra1', name: '生态·自然系列包', type: 'series_pack', usageCount: 3, tags: ['牡丹', '自然', '软装'] },
      { id: 'ra2', name: '云纹·经典系列包', type: 'theme_pack', usageCount: 8, tags: ['云纹', '传统', '通用'] },
    ],
  },
];

export const statsData = {
  totalProjects: 28,
  activeProjects: 12,
  totalMaterials: 186,
  availableMaterials: 143,
  proposalSuccessRate: 68,
  avgProposalTime: 24,
  totalSignedValue: 1680000,
  monthlyGrowth: 23,
};
