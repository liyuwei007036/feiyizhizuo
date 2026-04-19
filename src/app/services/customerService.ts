import { requestJson } from './httpClient';

const API_BASE = '/ai/client/ai/customers';

export interface CustomerItem {
  customerId: string;
  name: string;
  company?: string;
  phone?: string;
  budget?: string;
  notes?: string;
  industry?: string;
  stage?: string;
  intent?: string;
  lastContactAt?: string;
  proposalCount?: number;
}

export interface SaveCustomerPayload {
  name: string;
  company?: string;
  phone?: string;
  budget?: string;
  notes?: string;
  industry?: string;
  stage?: string;
  intent?: string;
}

function request<T>(path: string, options?: RequestInit) {
  return requestJson<T>(`${API_BASE}${path}`, options).then(response => response.data);
}

export const customerService = {
  listCustomers(keyword?: string) {
    const query = keyword?.trim() ? `?keyword=${encodeURIComponent(keyword.trim())}` : '';
    return request<CustomerItem[]>(query);
  },

  getCustomer(customerId: string) {
    return request<CustomerItem>(`/${encodeURIComponent(customerId)}`);
  },

  createCustomer(payload: SaveCustomerPayload) {
    return request<CustomerItem>('', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  updateCustomer(customerId: string, payload: SaveCustomerPayload) {
    return request<CustomerItem>(`/${encodeURIComponent(customerId)}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  },

  deleteCustomer(customerId: string) {
    return request<void>(`/${encodeURIComponent(customerId)}`, {
      method: 'DELETE',
    });
  },
};
