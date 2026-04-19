import { requestJson } from './httpClient';

const API_BASE = '/ai/client/ai/proposals';

export type ProposalStatus = 'GENERATING' | 'WAIT_CONFIRM' | 'CONFIRMED' | 'FAILED' | 'CANCELLED';
export type ProposalDirectionStatus = 'GENERATING' | 'WAIT_SELECT' | 'SELECTED' | 'FAILED';
export type ProposalStyleImageStatus = 'PENDING' | 'GENERATING' | 'SUCCESS' | 'FAILED' | 'SELECTED';

export interface CreateProposalPayload {
  customerId?: string;
  clientName?: string;
  clientCompany?: string;
  clientPhone?: string;
  clientBudget?: string;
  purpose: string;
  concern: string;
  style: string;
  elements: string[];
  targetProducts: string[];
}

export interface ProposalCreateResponse {
  proposalId: string;
  customerId?: string;
  status: ProposalStatus;
  directionTotal: number;
  imageTotal: number;
}

export interface ProposalStyleImage {
  styleImageId: string;
  slotNo: number;
  styleName: string;
  prompt: string;
  slotStatus: ProposalStyleImageStatus;
  fileId?: string;
  imageRecordId?: string;
  failureMessage?: string;
  regeneratedCount?: number;
  selected?: boolean;
}

export interface ProposalDirectionDetail {
  directionId: string;
  directionCode: 'safe' | 'cultural' | 'surprise';
  directionLetter: 'A' | 'B' | 'C';
  typeLabel: string;
  directionName: string;
  positioning: string;
  suitableFor: string[];
  craftTechnique: string;
  complexityLabel: string;
  material: string;
  deliveryDays: string;
  estimatedPrice: string;
  directionStatus: ProposalDirectionStatus;
  slotCompleted: number;
  slotTotal: number;
  failureMessage?: string;
  sortNo: number;
  styleImages: ProposalStyleImage[];
}

export interface ProposalDetailResponse {
  proposalId: string;
  proposalTitle: string;
  customerId?: string;
  clientName: string;
  clientCompany?: string;
  clientPhone?: string;
  clientBudget?: string;
  purpose: string;
  concern: string;
  style: string;
  elements: string[];
  targetProducts: string[];
  status: ProposalStatus;
  selectedDirectionCode?: string;
  selectedStyleImageId?: string;
  failureMessage?: string;
  canConfirm: boolean;
  updatedAt?: string;
  progress: {
    directionTotal: number;
    directionCompleted: number;
    imageTotal: number;
    imageCompleted: number;
  };
  directions: ProposalDirectionDetail[];
}

export interface ProposalPendingSummaryResponse {
  processingCount: number;
  waitConfirmCount: number;
  failedCount: number;
}

export interface ProposalPendingItem {
  proposalId: string;
  proposalTitle: string;
  customerId?: string;
  clientName: string;
  status: ProposalStatus;
  imageCompleted: number;
  imageTotal: number;
  coverFileId?: string;
  updatedAt?: string;
}

export interface ProposalPendingListResponse {
  generating: ProposalPendingItem[];
  waitConfirm: ProposalPendingItem[];
  failed: ProposalPendingItem[];
}

export interface ProposalCardResponse {
  proposalId: string;
  proposalTitle: string;
  customerId?: string;
  clientName: string;
  clientCompany?: string;
  clientPhone?: string;
  clientBudget?: string;
  purpose: string;
  concern: string;
  style: string;
  elements: string[];
  targetProducts: string[];
  selectedDirectionCode: 'safe' | 'cultural' | 'surprise';
  directionLetter: 'A' | 'B' | 'C';
  directionTypeLabel: string;
  directionName: string;
  positioning: string;
  suitableFor: string[];
  craftTechnique: string;
  complexityLabel: string;
  material: string;
  deliveryDays: string;
  estimatedPrice: string;
  coverFileId?: string;
  selectedStyleImageId?: string;
  selectedStyleName?: string;
  confirmedAt?: string;
}

function request<T>(path: string, options?: RequestInit) {
  return requestJson<T>(`${API_BASE}${path}`, options).then(response => response.data);
}

export function proposalFileUrl(fileId?: string | null) {
  return fileId ? `/api/client/file/content/${encodeURIComponent(fileId)}` : '';
}

export const proposalService = {
  createProposal(payload: CreateProposalPayload) {
    return request<ProposalCreateResponse>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  getProposalDetail(proposalId: string) {
    return request<ProposalDetailResponse>(`/${encodeURIComponent(proposalId)}`);
  },

  getPendingSummary() {
    return request<ProposalPendingSummaryResponse>('/pending/summary');
  },

  getPendingList() {
    return request<ProposalPendingListResponse>('/pending/list');
  },

  regenerateSlot(proposalId: string, directionCode: string, slotNo: number) {
    return request<ProposalDetailResponse>(
      `/${encodeURIComponent(proposalId)}/directions/${encodeURIComponent(directionCode)}/slots/${slotNo}/regenerate`,
      { method: 'POST' }
    );
  },

  confirmProposal(proposalId: string, payload: { directionCode: string; styleImageId: string }) {
    return request<ProposalCardResponse>(`/${encodeURIComponent(proposalId)}/confirm`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  listConfirmedProposals() {
    return request<ProposalCardResponse[]>('/confirmed/list');
  },
};
