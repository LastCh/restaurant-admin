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
  supplierId?: number;
  notes?: string;
}

export interface CreateSupplyItemRequest {
  ingredientId: number;
  quantity: number;
  unitPrice: number;
}

export const suppliesAPI = {
  // ✅ Получить все поставки
  getAll: async (page = 0, size = 10, sortBy = 'supplyTime', direction: 'asc' | 'desc' = 'desc') => {
    const { data } = await apiClient.get<PageResponse<Supply>>(
      `/supplies?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`
    );
    return data;
  },

  // ✅ Получить поставку по ID
  getById: async (id: number): Promise<Supply> => {
    const { data } = await apiClient.get(`/supplies/${id}`);
    return data;
  },

  // ✅ Создать поставку
  create: async (supply: CreateSupplyRequest): Promise<Supply> => {
    const { data } = await apiClient.post('/supplies', supply);
    return data;
  },

  // ✅ Обновить поставку
  update: async (id: number, supply: Partial<Supply>): Promise<Supply> => {
    const { data } = await apiClient.put(`/supplies/${id}`, supply);
    return data;
  },

  // ✅ Удалить поставку
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/supplies/${id}`);
  },

  // ✅ Получить поставки по статусу
  getByStatus: async (status: SupplyStatus, page = 0, size = 10) => {
    const { data } = await apiClient.get<PageResponse<Supply>>(
      `/supplies/status/${status}?page=${page}&size=${size}`
    );
    return data;
  },

  // ✅ Получить поставки поставщика
  getBySupplier: async (supplierId: number, page = 0, size = 10) => {
    const { data } = await apiClient.get<PageResponse<Supply>>(
      `/supplies/supplier/${supplierId}?page=${page}&size=${size}`
    );
    return data;
  },

  // ✅ Добавить позицию в поставку
  addItem: async (supplyId: number, item: CreateSupplyItemRequest): Promise<SupplyItem> => {
    const { data } = await apiClient.post(`/supplies/${supplyId}/items`, item);
    return data;
  },

  // ✅ Получить позиции поставки
  getItems: async (supplyId: number): Promise<SupplyItem[]> => {
    const { data } = await apiClient.get(`/supplies/${supplyId}/items`);
    return data;
  },

  // ✅ Удалить позицию из поставки
  removeItem: async (supplyId: number, itemId: number): Promise<void> => {
    await apiClient.delete(`/supplies/${supplyId}/items/${itemId}`);
  },

  // ✅ Подтвердить поставку (PENDING → CONFIRMED)
  confirm: async (id: number): Promise<Supply> => {
    const { data } = await apiClient.put(`/supplies/${id}/confirm`);
    return data;
  },
};
