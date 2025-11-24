import apiClient from './client';
import type { PageResponse } from '../types/api';

export type SupplyStatus = 'PENDING' | 'CONFIRMED' | 'CANCELLED';

export interface SupplyItem {
  id: number;
  supplyId: number;
  ingredientId: number;
  ingredientName?: string;
  quantity: number;
  unitPrice: number;
  createdAt?: string;
}

export interface Supply {
  id: number;
  supplyTime: string;
  supplierId?: number;
  supplierName?: string;
  status: SupplyStatus;
  totalCost: number;
  notes?: string;
  receivedByUserId?: number;
  items?: SupplyItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplyRequest {
  supplierId: number;
  notes?: string;
  items: CreateSupplyItemRequest[];
}

export interface CreateSupplyItemRequest {
  ingredientId: number;
  quantity: number;
  unitPrice: number;
}

export const suppliesAPI = {
  getAll: async (page = 0, size = 10, sortBy = 'supplyTime', direction: 'asc' | 'desc' = 'desc') => {
    const { data } = await apiClient.get<PageResponse<Supply>>(
      `/supplies?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`
    );
    return data;
  },

  getById: async (id: number): Promise<Supply> => {
    const { data } = await apiClient.get(`/supplies/${id}`);
    return data;
  },

  create: async (supply: CreateSupplyRequest): Promise<Supply> => {
    const { data } = await apiClient.post('/supplies', supply);
    return data;
  },

  update: async (id: number, supply: Partial<Pick<Supply, 'supplierId' | 'notes'>>): Promise<Supply> => {
    const { data } = await apiClient.put(`/supplies/${id}`, supply);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/supplies/${id}`);
  },

  addItem: async (supplyId: number, item: CreateSupplyItemRequest): Promise<SupplyItem> => {
    const { data } = await apiClient.post(`/supplies/${supplyId}/items`, item);
    return data;
  },

  removeItem: async (supplyId: number, itemId: number): Promise<void> => {
    await apiClient.delete(`/supplies/${supplyId}/items/${itemId}`);
  },

  confirm: async (id: number): Promise<Supply> => {
    const { data } = await apiClient.put(`/supplies/${id}/confirm`);
    return data;
  },
};
