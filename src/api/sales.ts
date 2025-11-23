import apiClient from './client';
import type { PageResponse } from '../types/api';

export type PaymentMethod = 'CASH' | 'CARD' | 'ONLINE' | 'OTHER';

export interface Sale {
  id: number;
  saleTime: string;
  total: number;
  paymentMethod?: PaymentMethod;
  orderId: number;
  receiptNumber?: string;
  processedByUserId?: number;
  createdAt: string;
}

export interface CreateSaleRequest {
  total: number;
  paymentMethod?: PaymentMethod;
  orderId: number;
  receiptNumber?: string;
}

export const salesAPI = {
  // ✅ Получить все продажи
  getAll: async (page = 0, size = 10, sortBy = 'saleTime', direction: 'asc' | 'desc' = 'desc') => {
    const { data } = await apiClient.get<PageResponse<Sale>>(
      `/sales?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`
    );
    return data;
  },

  // ✅ Получить продажу по ID
  getById: async (id: number): Promise<Sale> => {
    const { data } = await apiClient.get(`/sales/${id}`);
    return data;
  },

  // ✅ Создать продажу
  create: async (sale: CreateSaleRequest): Promise<Sale> => {
    const { data } = await apiClient.post('/sales', sale);
    return data;
  },

  // ✅ Удалить продажу
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/sales/${id}`);
  },

  // ✅ Получить продажу по номеру заказа
  getByOrderId: async (orderId: number): Promise<Sale> => {
    const { data } = await apiClient.get(`/sales/order/${orderId}`);
    return data;
  },

  // ✅ Получить продажи за период
  getBetweenDates: async (start: string, end: string, page = 0, size = 10) => {
    const { data } = await apiClient.get<PageResponse<Sale>>(
      `/sales/between?start=${start}&end=${end}&page=${page}&size=${size}`
    );
    return data;
  },
};
