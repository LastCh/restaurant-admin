import apiClient from './client';
import type { PageResponse } from '../types/api';

export interface Supplier {
  id: number;
  name: string;
  inn?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSupplierRequest {
  name: string;
  inn?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
}

export interface UpdateSupplierRequest {
  name?: string;
  inn?: string;
  phone?: string;
  email?: string;
  address?: string;
  contactPerson?: string;
}

export const suppliersAPI = {
  // ✅ Получить всех поставщиков
  getAll: async (page = 0, size = 10, sortBy = 'name', direction: 'asc' | 'desc' = 'asc') => {
    const { data } = await apiClient.get<PageResponse<Supplier>>(
      `/suppliers?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`
    );
    return data;
  },

  // ✅ Получить поставщика по ID
  getById: async (id: number): Promise<Supplier> => {
    const { data } = await apiClient.get(`/suppliers/${id}`);
    return data;
  },

  // ✅ Создать поставщика
  create: async (supplier: CreateSupplierRequest): Promise<Supplier> => {
    const { data } = await apiClient.post('/suppliers', supplier);
    return data;
  },

  // ✅ Обновить поставщика
  update: async (id: number, supplier: UpdateSupplierRequest): Promise<Supplier> => {
    const { data } = await apiClient.put(`/suppliers/${id}`, supplier);
    return data;
  },

  // ✅ Удалить поставщика
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/suppliers/${id}`);
  },
};
