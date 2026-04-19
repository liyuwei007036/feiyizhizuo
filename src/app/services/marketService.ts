import { requestJson } from './httpClient';

const API_BASE = '/api';

type BackendPage<T> = {
  records?: T[];
  total?: number;
  size?: number;
  current?: number;
  pages?: number;
};

type BackendLicenseOption = {
  type?: string | null;
  label?: string | null;
  price?: number | string | null;
};

type BackendPatternCard = {
  id: number | string;
  ownerId?: number | string | null;
  ownerName?: string | null;
  title?: string | null;
  description?: string | null;
  coverFileId?: string | null;
  coverUrl?: string | null;
  category?: string | null;
  style?: string | null;
  material?: string | null;
  colorTone?: string | null;
  technique?: string | null;
  rightsStatus?: string | null;
  copyrightStatus?: string | null;
  certNo?: string | null;
  publishStatus?: string | null;
  publishedAt?: string | null;
  allowDerivative?: boolean | null;
  allowCommercial?: boolean | null;
  licenseOptions?: BackendLicenseOption[] | null;
};

type BackendPatternDetail = BackendPatternCard & {
  patternDesc?: string | null;
  innovationPoints?: string | null;
  adaptProducts?: string | null;
};

type BackendOrder = {
  id: number | string;
  orderNo?: string | null;
  patternId?: number | string | null;
  patternTitle?: string | null;
  patternCoverFileId?: string | null;
  patternImageUrl?: string | null;
  sellerId?: number | string | null;
  sellerName?: string | null;
  buyerId?: number | string | null;
  buyerName?: string | null;
  licenseTemplate?: string | null;
  templateLabel?: string | null;
  purpose?: string | null;
  entity?: string | null;
  productCategory?: string | null;
  channel?: string | null;
  region?: string | null;
  allowDerivative?: boolean | null;
  projectName?: string | null;
  quantityLimit?: number | null;
  price?: number | string | null;
  orderStatus?: string | null;
  rejectReason?: string | null;
  appliedAt?: string | null;
  approvedAt?: string | null;
  payDeadline?: string | null;
  paidAt?: string | null;
  direction?: string | null;
};

export interface MarketDashboard {
  marketOnSaleCount: number;
  myOnSaleCount: number;
  pendingPayCount: number;
  pendingReviewCount: number;
  sellerGrossAmount: number;
  sellerCommissionAmount: number;
  sellerNetAmount: number;
}

export interface MarketPatternPageInput {
  scope?: 'ALL' | 'MINE';
  keyword?: string;
  category?: string;
  style?: string;
  rightsStatus?: 'none' | 'done';
  publishStatus?: 'on_sale' | 'locked' | 'off_shelf';
  pageNum?: number;
  pageSize?: number;
}

export interface MarketPatternPageResult<TPattern> {
  records: TPattern[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface MarketOrderPageInput {
  role: 'BUYER' | 'SELLER';
  statuses?: string[];
  pageNum?: number;
  pageSize?: number;
}

export interface CreateMarketOrderInput {
  patternId: string;
  template: 'project' | 'annual' | 'limited';
  entity: string;
  purpose: string;
  productCategory: string;
  channel: string;
  region: string;
  allowDerivative: boolean;
  projectName?: string;
  quantityLimit?: number;
}

type FrontLicenseOption = {
  type: 'project' | 'annual' | 'limited';
  label: string;
  price: number;
};

type FrontPattern = {
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
  publishStatus: 'on_sale' | 'locked' | 'off_shelf';
  licenses: FrontLicenseOption[];
  publishedAt: string;
  certNo?: string;
  isAllowDerivative: boolean;
  isAllowCommercial: boolean;
};

type FrontOrder = {
  id: string;
  orderNo: string;
  patternId: string;
  patternTitle: string;
  patternImage: string;
  sellerId: string;
  sellerName: string;
  buyerName: string;
  template: 'project' | 'annual' | 'limited';
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
  status: 'submitted' | 'approved_pending_pay' | 'rejected' | 'expired' | 'completed';
  appliedAt: string;
  approvedAt?: string;
  payDeadline?: number;
  paidAt?: string;
  rejectReason?: string;
  direction: 'buy' | 'sell';
};

function request<T>(path: string, options: RequestInit = {}) {
  return requestJson<T>(`${API_BASE}${path}`, options);
}

function toNumber(value?: number | string | null) {
  if (value == null || value === '') return 0;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : 0;
}

function normalizeDateTime(value?: string | null) {
  if (!value) return '';
  return value.replace('T', ' ').slice(0, 16);
}

function normalizeDateOnly(value?: string | null) {
  const normalized = normalizeDateTime(value);
  return normalized ? normalized.slice(0, 10) : '';
}

function normalizeTimestamp(value?: string | null) {
  if (!value) return undefined;
  const normalized = value.trim().replace(' ', 'T');
  if (/[zZ]$|[+-]\d{2}:\d{2}$/.test(normalized)) {
    const timestamp = Date.parse(normalized);
    return Number.isFinite(timestamp) ? timestamp : undefined;
  }
  const withSeconds = normalized.length === 16 ? `${normalized}:00` : normalized;
  const timestamp = Date.parse(`${withSeconds}+08:00`);
  return Number.isFinite(timestamp) ? timestamp : undefined;
}

function normalizeFileUrl(url?: string | null, fileId?: string | null) {
  if (url) {
    if (url.startsWith('/api/')) return url;
    if (url.startsWith('/client/')) return `/api${url}`;
    return url;
  }
  if (!fileId) return '';
  return `/api/client/file/content/${encodeURIComponent(fileId)}`;
}

function normalizeOwnerId(ownerId?: number | string | null, currentUserId?: string | null) {
  const normalized = ownerId == null ? '' : String(ownerId);
  if (normalized && currentUserId && normalized === currentUserId) {
    return 'me';
  }
  return normalized;
}

function normalizeTemplate(value?: string | null): FrontLicenseOption['type'] {
  const key = String(value || '').trim().toUpperCase();
  if (key === 'ANNUAL') return 'annual';
  if (key === 'LIMITED') return 'limited';
  return 'project';
}

function normalizePublishStatus(value?: string | null): FrontPattern['publishStatus'] {
  const key = String(value || '').trim().toUpperCase();
  if (key === 'LOCKED') return 'locked';
  if (key === 'OFF_SHELF') return 'off_shelf';
  return 'on_sale';
}

function normalizeRightsStatus(value?: string | null): FrontPattern['rightsStatus'] {
  return String(value || '').trim().toUpperCase() === 'DONE' ? 'done' : 'none';
}

function normalizeCopyrightStatus(value?: string | null): FrontPattern['copyrightStatus'] {
  const key = String(value || '').trim().toUpperCase();
  if (key === 'DONE') return 'done';
  if (key === 'APPLIED') return 'applied';
  return 'none';
}

function normalizeOrderStatus(value?: string | null): FrontOrder['status'] {
  const key = String(value || '').trim().toUpperCase();
  if (key === 'APPROVED_PENDING_PAY') return 'approved_pending_pay';
  if (key === 'REJECTED') return 'rejected';
  if (key === 'EXPIRED') return 'expired';
  if (key === 'COMPLETED') return 'completed';
  return 'submitted';
}

function normalizeDirection(value?: string | null): FrontOrder['direction'] {
  return String(value || '').trim().toUpperCase() === 'SELL' ? 'sell' : 'buy';
}

function mapLicenseOptions(options?: BackendLicenseOption[] | null): FrontLicenseOption[] {
  if (!Array.isArray(options) || options.length === 0) {
    return [{ type: 'project', label: '单项目授权', price: 0 }];
  }
  return options.map(item => ({
    type: normalizeTemplate(item.type),
    label: item.label?.trim() || '单项目授权',
    price: toNumber(item.price),
  }));
}

function mapPattern(dto: BackendPatternCard | BackendPatternDetail, currentUserId?: string | null): FrontPattern {
  return {
    id: String(dto.id),
    ownerId: normalizeOwnerId(dto.ownerId, currentUserId),
    ownerName: dto.ownerName?.trim() || '未命名用户',
    title: dto.title?.trim() || '未命名纹样',
    imageUrl: normalizeFileUrl(dto.coverUrl, dto.coverFileId),
    category: dto.category?.trim() || '',
    style: dto.style?.trim() || '',
    material: dto.material?.trim() || '',
    colorTone: dto.colorTone?.trim() || '',
    technique: dto.technique?.trim() || '',
    desc: ('patternDesc' in dto ? dto.patternDesc : dto.description)?.trim() || dto.description?.trim() || '',
    innovationPoints: ('innovationPoints' in dto ? dto.innovationPoints : '')?.trim() || '',
    adaptProducts: ('adaptProducts' in dto ? dto.adaptProducts : '')?.trim() || '',
    rightsStatus: normalizeRightsStatus(dto.rightsStatus),
    copyrightStatus: normalizeCopyrightStatus(dto.copyrightStatus),
    publishStatus: normalizePublishStatus(dto.publishStatus),
    licenses: mapLicenseOptions(dto.licenseOptions),
    publishedAt: normalizeDateOnly(dto.publishedAt),
    certNo: dto.certNo?.trim() || undefined,
    isAllowDerivative: Boolean(dto.allowDerivative),
    isAllowCommercial: Boolean(dto.allowCommercial),
  };
}

function mapOrder(dto: BackendOrder, currentUserId?: string | null): FrontOrder {
  return {
    id: String(dto.id),
    orderNo: dto.orderNo?.trim() || '',
    patternId: dto.patternId == null ? '' : String(dto.patternId),
    patternTitle: dto.patternTitle?.trim() || '未命名纹样',
    patternImage: normalizeFileUrl(dto.patternImageUrl, dto.patternCoverFileId),
    sellerId: normalizeOwnerId(dto.sellerId, currentUserId),
    sellerName: dto.sellerName?.trim() || '未命名卖方',
    buyerName: dto.buyerName?.trim() || '',
    template: normalizeTemplate(dto.licenseTemplate),
    templateLabel: dto.templateLabel?.trim() || '单项目授权',
    purpose: dto.purpose?.trim() || '',
    entity: dto.entity?.trim() || '',
    productCategory: dto.productCategory?.trim() || '',
    channel: dto.channel?.trim() || '',
    region: dto.region?.trim() || '',
    allowDerivative: Boolean(dto.allowDerivative),
    projectName: dto.projectName?.trim() || undefined,
    quantityLimit: dto.quantityLimit ?? undefined,
    price: toNumber(dto.price),
    status: normalizeOrderStatus(dto.orderStatus),
    appliedAt: normalizeDateTime(dto.appliedAt),
    approvedAt: normalizeDateTime(dto.approvedAt) || undefined,
    payDeadline: normalizeTimestamp(dto.payDeadline),
    paidAt: normalizeDateTime(dto.paidAt) || undefined,
    rejectReason: dto.rejectReason?.trim() || undefined,
    direction: normalizeDirection(dto.direction),
  };
}

function toBackendRightsStatus(value?: MarketPatternPageInput['rightsStatus']) {
  if (!value) return undefined;
  return value.toUpperCase();
}

function toBackendPublishStatus(value?: MarketPatternPageInput['publishStatus']) {
  if (!value) return undefined;
  return value.toUpperCase();
}

function toBackendStatuses(statuses?: string[]) {
  return statuses?.map(status => status.toUpperCase());
}

function toBackendTemplate(value: CreateMarketOrderInput['template']) {
  return value.toUpperCase();
}

export const marketService = {
  async getDashboard() {
    const response = await request<MarketDashboard>('/client/market/dashboard');
    const data = response.data ?? {} as Partial<MarketDashboard>;
    return {
      marketOnSaleCount: toNumber(data.marketOnSaleCount),
      myOnSaleCount: toNumber(data.myOnSaleCount),
      pendingPayCount: toNumber(data.pendingPayCount),
      pendingReviewCount: toNumber(data.pendingReviewCount),
      sellerGrossAmount: toNumber(data.sellerGrossAmount),
      sellerCommissionAmount: toNumber(data.sellerCommissionAmount),
      sellerNetAmount: toNumber(data.sellerNetAmount),
    };
  },

  async pagePatterns<TPattern = FrontPattern>(input: MarketPatternPageInput, currentUserId?: string | null): Promise<MarketPatternPageResult<TPattern>> {
    const response = await request<BackendPage<BackendPatternCard>>('/client/market/patterns/page', {
      method: 'POST',
      body: JSON.stringify({
        scope: input.scope ?? 'ALL',
        keyword: input.keyword?.trim() || undefined,
        category: input.category?.trim() || undefined,
        style: input.style?.trim() || undefined,
        rightsStatus: toBackendRightsStatus(input.rightsStatus),
        publishStatus: toBackendPublishStatus(input.publishStatus),
        pageNum: input.pageNum ?? 1,
        pageSize: input.pageSize ?? 12,
      }),
    });
    const page = response.data || {};
    const records = (page.records ?? []).map(item => mapPattern(item, currentUserId)) as TPattern[];
    return {
      records,
      total: toNumber(page.total),
      size: toNumber(page.size) || (input.pageSize ?? 12),
      current: toNumber(page.current) || (input.pageNum ?? 1),
      pages: toNumber(page.pages),
    };
  },

  async getPatternDetail<TPattern = FrontPattern>(patternId: string, currentUserId?: string | null): Promise<TPattern> {
    const response = await request<BackendPatternDetail>(`/client/market/patterns/${encodeURIComponent(patternId)}`);
    return mapPattern(response.data, currentUserId) as TPattern;
  },

  async createOrder(input: CreateMarketOrderInput) {
    await request<void>('/client/market/orders', {
      method: 'POST',
      body: JSON.stringify({
        patternId: input.patternId,
        template: toBackendTemplate(input.template),
        entity: input.entity,
        purpose: input.purpose,
        productCategory: input.productCategory,
        channel: input.channel,
        region: input.region,
        allowDerivative: input.allowDerivative,
        projectName: input.projectName || undefined,
        quantityLimit: input.quantityLimit,
      }),
    });
  },

  async pageOrders<TOrder = FrontOrder>(input: MarketOrderPageInput, currentUserId?: string | null): Promise<MarketPatternPageResult<TOrder>> {
    const response = await request<BackendPage<BackendOrder>>('/client/market/orders/page', {
      method: 'POST',
      body: JSON.stringify({
        role: input.role,
        statuses: toBackendStatuses(input.statuses),
        pageNum: input.pageNum ?? 1,
        pageSize: input.pageSize ?? 10,
      }),
    });
    const page = response.data || {};
    const records = (page.records ?? []).map(item => mapOrder(item, currentUserId)) as TOrder[];
    return {
      records,
      total: toNumber(page.total),
      size: toNumber(page.size) || (input.pageSize ?? 10),
      current: toNumber(page.current) || (input.pageNum ?? 1),
      pages: toNumber(page.pages),
    };
  },

  async approveOrder(orderId: string) {
    await request<void>(`/client/market/orders/${encodeURIComponent(orderId)}/approve`, { method: 'POST' });
  },

  async rejectOrder(orderId: string, reason: string) {
    await request<void>(`/client/market/orders/${encodeURIComponent(orderId)}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async payOrder(orderId: string, payChannel: 'WECHAT' | 'ALIPAY') {
    await request<void>(`/client/market/orders/${encodeURIComponent(orderId)}/pay`, {
      method: 'POST',
      body: JSON.stringify({ payChannel }),
    });
  },

  async cancelOrder(orderId: string) {
    await request<void>(`/client/market/orders/${encodeURIComponent(orderId)}/cancel`, { method: 'POST' });
  },
};
