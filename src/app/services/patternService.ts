import { requestJson, type ApiResponse } from './httpClient';
import type { MyPattern } from '../context/AppContext';

const API_BASE = '/api';

type BackendPage<T> = {
  records?: T[];
  total?: number;
  size?: number;
  current?: number;
  pages?: number;
};

type BackendPatternCard = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  coverFileId?: string | null;
  coverUrl?: string | null;
  sourceType?: string | null;
  sourceLabel?: string | null;
  sourceBizId?: string | null;
  category?: string | null;
  style?: string | null;
  material?: string | null;
  colorTone?: string | null;
  tags?: unknown;
  rightsStatus?: string | null;
  certNo?: string | null;
  certIssuedAt?: string | null;
  copyrightStatus?: string | null;
  copyrightCertNo?: string | null;
  copyrightCertFileId?: string | null;
  copyrightCertifiedAt?: string | null;
  listingStatus?: string | null;
  published?: boolean | null;
  publishedAt?: string | null;
  projectPrice?: number | string | null;
  canDelete?: boolean | null;
  canPublish?: boolean | null;
  canApplyCopyright?: boolean | null;
  createTime?: string | null;
};

type BackendPatternDetail = BackendPatternCard & {
  sourceSnapshot?: Record<string, unknown> | null;
  craftInfo?: Record<string, unknown> | null;
  enableProject?: boolean | null;
  enableAnnual?: boolean | null;
  enableLimited?: boolean | null;
  annualPrice?: number | string | null;
  limitedTiers?: Record<string, unknown> | null;
  region?: string | null;
  allowDerivative?: boolean | null;
  allowCommercial?: boolean | null;
  commissionRate?: number | string | null;
  canConfirmRights?: boolean | null;
  canUnpublish?: boolean | null;
  canSyncCopyrightCert?: boolean | null;
};

export interface PatternPageQueryInput {
  keyword?: string;
  sourceType?: 'zhihui' | 'copilot' | 'upload' | 'licensed';
  rightsStatus?: 'none' | 'processing' | 'done';
  copyrightStatus?: 'none' | 'applied' | 'done';
  published?: boolean;
  category?: string;
  pageNum?: number;
  pageSize?: number;
}

export interface PatternPageResult {
  records: MyPattern[];
  total: number;
  size: number;
  current: number;
  pages: number;
}

export interface CreateUploadPatternInput {
  title: string;
  description?: string;
  coverFileId: string;
  category: string;
  style: string;
  material: string;
  colorTone: string;
  tags?: string[];
  copyrightCertFileId?: string;
  copyrightCertNo?: string;
  copyrightCertifiedAt?: string;
}

export interface CreateAiPatternInput {
  requestId: string;
  title: string;
  description?: string;
  coverFileId: string;
  category?: string;
  style?: string;
  material?: string;
  colorTone?: string;
  tags?: string[];
}

export interface CreateProposalPatternInput {
  proposalId: string;
  directionId?: string;
  title: string;
  description?: string;
  coverFileId: string;
  category?: string;
  style?: string;
  material?: string;
  colorTone?: string;
  tags?: string[];
  sourceSnapshot?: Record<string, unknown>;
}

export interface ConfirmPatternRightsInput {
  weaveStructure: string;
  technique: string;
  colorLayers: string;
  repeatSize: string;
  materialSpec: string;
  complexity: string;
  patternDesc: string;
  innovationPoints: string;
  adaptProducts: string[];
  heritageSource?: string;
}

export interface ApplyPatternCopyrightInput {
  applyEmail: string;
}

export interface SyncPatternCopyrightCertInput {
  certNo?: string;
  certFileId: string;
  certifiedAt?: string;
}

export interface PublishPatternListingInput {
  enableProject: boolean;
  enableAnnual: boolean;
  enableLimited: boolean;
  projectPrice: number;
  region: string;
  allowDerivative: boolean;
  allowCommercial: boolean;
}

const SOURCE_MAP = {
  ZHIHUI: 'zhihui',
  PROPOSAL: 'copilot',
  UPLOAD: 'upload',
  LICENSED: 'licensed',
} as const;

const RIGHTS_MAP = {
  NONE: 'none',
  PROCESSING: 'processing',
  DONE: 'done',
} as const;

const COPYRIGHT_MAP = {
  NONE: 'none',
  APPLIED: 'applied',
  DONE: 'done',
} as const;

const LISTING_MAP = {
  UNPUBLISHED: 'unpublished',
  PUBLISHED: 'published',
} as const;

function normalizeDateTime(value?: string | null) {
  if (!value) return '';
  return value.replace('T', ' ').slice(0, 16);
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

function normalizeTags(tags: unknown) {
  if (Array.isArray(tags)) {
    return tags
      .filter((tag): tag is string => typeof tag === 'string')
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  if (typeof tags === 'string') {
    return tags
      .split(/[,，]/)
      .map(tag => tag.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeSource(sourceType?: string | null): MyPattern['source'] {
  const key = String(sourceType || '').trim().toUpperCase() as keyof typeof SOURCE_MAP;
  return SOURCE_MAP[key] ?? 'upload';
}

function normalizeRightsStatus(status?: string | null): MyPattern['rightsStatus'] {
  const key = String(status || '').trim().toUpperCase() as keyof typeof RIGHTS_MAP;
  return RIGHTS_MAP[key] ?? 'none';
}

function normalizeCopyrightStatus(status?: string | null): MyPattern['copyrightStatus'] {
  const key = String(status || '').trim().toUpperCase() as keyof typeof COPYRIGHT_MAP;
  return COPYRIGHT_MAP[key] ?? 'none';
}

function normalizeListingStatus(status?: string | null): MyPattern['listingStatus'] {
  const key = String(status || '').trim().toUpperCase() as keyof typeof LISTING_MAP;
  return LISTING_MAP[key];
}

function normalizePrice(value?: number | string | null) {
  if (value == null || value === '') return undefined;
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return String(value);
  return numeric % 1 === 0 ? String(numeric) : numeric.toFixed(2).replace(/\.00$/, '');
}

function normalizeComplexity(value: unknown) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.min(5, Math.max(1, Math.round(value)));
  }
  if (typeof value === 'string') {
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
      return Math.min(5, Math.max(1, Math.round(numeric)));
    }
  }
  return 3;
}

function normalizeCraftInfo(craftInfo?: Record<string, unknown> | null): MyPattern['craftInfo'] {
  if (!craftInfo) return undefined;
  return {
    weaveStructure: String(craftInfo.weaveStructure || ''),
    technique: String(craftInfo.technique || ''),
    colorLayers: String(craftInfo.colorLayers || ''),
    repeatSize: String(craftInfo.repeatSize || ''),
    materialSpec: String(craftInfo.materialSpec || ''),
    complexity: normalizeComplexity(craftInfo.complexity),
    heritageSource: String(craftInfo.heritageSource || ''),
    innovationPoints: String(craftInfo.innovationPoints || ''),
    patternDesc: String(craftInfo.patternDesc || ''),
    adaptProducts: Array.isArray(craftInfo.adaptProducts)
      ? craftInfo.adaptProducts
          .filter((item): item is string => typeof item === 'string')
          .join('、')
      : String(craftInfo.adaptProducts || ''),
  };
}

function resolveSourceLabel(source: MyPattern['source'], sourceLabel?: string | null) {
  if (sourceLabel?.trim()) return sourceLabel.trim();
  if (source === 'zhihui') return '智绘AI';
  if (source === 'copilot') return '设计提案';
  if (source === 'licensed') return '授权获得';
  return '自有上传';
}

function toBackendSourceType(sourceType?: PatternPageQueryInput['sourceType']) {
  if (sourceType === 'zhihui') return 'ZHIHUI';
  if (sourceType === 'copilot') return 'PROPOSAL';
  if (sourceType === 'licensed') return 'LICENSED';
  if (sourceType === 'upload') return 'UPLOAD';
  return undefined;
}

function toBackendRightsStatus(status?: PatternPageQueryInput['rightsStatus']) {
  return status?.toUpperCase();
}

function toBackendCopyrightStatus(status?: PatternPageQueryInput['copyrightStatus']) {
  return status?.toUpperCase();
}

function toLocalDateTime(value?: string) {
  if (!value?.trim()) return undefined;
  const normalized = value.trim().replace(' ', 'T');
  return normalized.length === 16 ? `${normalized}:00` : normalized;
}

function request<T>(path: string, options: RequestInit = {}) {
  return requestJson<T>(`${API_BASE}${path}`, options);
}

function mapPattern(dto: BackendPatternCard | BackendPatternDetail): MyPattern {
  const source = normalizeSource(dto.sourceType);
  const rightsStatus = normalizeRightsStatus(dto.rightsStatus);
  const copyrightStatus = normalizeCopyrightStatus(dto.copyrightStatus);
  const published = Boolean(dto.published);

  return {
    id: String(dto.id),
    title: dto.title?.trim() || '未命名纹样',
    desc: dto.description?.trim() || '',
    tags: normalizeTags(dto.tags),
    imageUrl: normalizeFileUrl(dto.coverUrl, dto.coverFileId),
    savedAt: normalizeDateTime(dto.createTime),
    source,
    sourceLabel: resolveSourceLabel(source, dto.sourceLabel),
    coverFileId: dto.coverFileId || undefined,
    sourceBizId: dto.sourceBizId || undefined,
    category: dto.category || undefined,
    style: dto.style || undefined,
    material: dto.material || undefined,
    colorTone: dto.colorTone || undefined,
    createdAt: normalizeDateTime(dto.createTime),
    rightsStatus,
    certNo: dto.certNo || undefined,
    certIssuedAt: normalizeDateTime(dto.certIssuedAt),
    copyrightStatus,
    copyrightCertNo: dto.copyrightCertNo || undefined,
    copyrightCertFileId: dto.copyrightCertFileId || undefined,
    copyrightDoneAt: normalizeDateTime(dto.copyrightCertifiedAt),
    copyrightCertImageUrl: dto.copyrightCertFileId
      ? normalizeFileUrl(undefined, dto.copyrightCertFileId)
      : undefined,
    published,
    listingStatus: normalizeListingStatus(dto.listingStatus),
    price: normalizePrice(dto.projectPrice),
    publishedAt: normalizeDateTime(dto.publishedAt),
    craftInfo: 'craftInfo' in dto ? normalizeCraftInfo(dto.craftInfo) : undefined,
    canDelete: dto.canDelete ?? (!published && copyrightStatus !== 'applied'),
    canPublish: dto.canPublish ?? (!published && rightsStatus === 'done' && source !== 'licensed'),
    canApplyCopyright: dto.canApplyCopyright ?? (rightsStatus === 'done' && copyrightStatus === 'none' && source !== 'licensed'),
    canConfirmRights: 'canConfirmRights' in dto
      ? (dto.canConfirmRights ?? false)
      : (source !== 'licensed' && rightsStatus !== 'done'),
    canUnpublish: 'canUnpublish' in dto ? (dto.canUnpublish ?? false) : published,
    canSyncCopyrightCert: 'canSyncCopyrightCert' in dto
      ? (dto.canSyncCopyrightCert ?? false)
      : (copyrightStatus === 'applied'),
  };
}

export const patternService = {
  async pagePatterns(query: PatternPageQueryInput = {}): Promise<PatternPageResult> {
    const response = await request<BackendPage<BackendPatternCard>>('/client/patterns/page', {
      method: 'POST',
      body: JSON.stringify({
        ...query,
        sourceType: toBackendSourceType(query.sourceType),
        rightsStatus: toBackendRightsStatus(query.rightsStatus),
        copyrightStatus: toBackendCopyrightStatus(query.copyrightStatus),
        pageNum: query.pageNum ?? 1,
        pageSize: query.pageSize ?? 20,
      }),
    });

    const page = response.data || {};
    return {
      records: (page.records || []).map(mapPattern),
      total: Number(page.total || 0),
      size: Number(page.size || query.pageSize || 20),
      current: Number(page.current || query.pageNum || 1),
      pages: Number(page.pages || 0),
    };
  },

  async getPatternDetail(patternId: string | number) {
    const response = await request<BackendPatternDetail>(`/client/patterns/${patternId}`, {
      method: 'GET',
    });
    return mapPattern(response.data);
  },

  async createFromUpload(input: CreateUploadPatternInput) {
    const response = await request<BackendPatternDetail>('/client/patterns/from-upload', {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        copyrightCertifiedAt: toLocalDateTime(input.copyrightCertifiedAt),
      }),
    });
    return mapPattern(response.data);
  },

  async createFromAi(input: CreateAiPatternInput) {
    const response = await request<BackendPatternDetail>('/client/patterns/from-ai', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapPattern(response.data);
  },

  async createFromProposal(input: CreateProposalPatternInput) {
    const response = await request<BackendPatternDetail>('/client/patterns/from-proposal', {
      method: 'POST',
      body: JSON.stringify(input),
    });
    return mapPattern(response.data);
  },

  async deletePattern(patternId: string | number) {
    await request<void>(`/client/patterns/${patternId}`, {
      method: 'DELETE',
    });
  },

  async confirmRights(patternId: string | number, input: ConfirmPatternRightsInput) {
    await request<void>(`/client/patterns/${patternId}/rights/confirm`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async applyCopyright(patternId: string | number, input: ApplyPatternCopyrightInput) {
    await request<void>(`/client/patterns/${patternId}/copyright/apply`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async cancelCopyright(patternId: string | number) {
    await request<void>(`/client/patterns/${patternId}/copyright/cancel`, {
      method: 'POST',
    });
  },

  async syncCopyrightCertificate(patternId: string | number, input: SyncPatternCopyrightCertInput) {
    await request<void>(`/client/patterns/${patternId}/copyright/certificate`, {
      method: 'POST',
      body: JSON.stringify({
        ...input,
        certifiedAt: toLocalDateTime(input.certifiedAt),
      }),
    });
  },

  async publish(patternId: string | number, input: PublishPatternListingInput) {
    await request<void>(`/client/patterns/${patternId}/listing/publish`, {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async unpublish(patternId: string | number) {
    await request<void>(`/client/patterns/${patternId}/listing/unpublish`, {
      method: 'POST',
    });
  },
};

export type PatternServiceResponse<T> = ApiResponse<T>;
