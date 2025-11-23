import apiClient from './client';
import type { PageResponse, TableDTO, CreateTableRequest } from '../types/api';

export const tablesAPI = {
  getAll: async (page = 0, size = 100) => {
    const { data } = await apiClient.get<PageResponse<TableDTO>>(
      `/tables?page=${page}&size=${size}`
    );
    return data;
  },

  getById: async (id: number): Promise<TableDTO> => {
    const { data } = await apiClient.get(`/tables/${id}`);
    return data;
  },

  getAvailable: async () => {
    const { data } = await apiClient.get<TableDTO[]>(`/tables/available`);
    return data;
  },

  create: async (table: CreateTableRequest): Promise<TableDTO> => {
    const { data } = await apiClient.post('/tables', table);
    return data;
  },

  update: async (id: number, table: Partial<CreateTableRequest>): Promise<TableDTO> => {
    const { data } = await apiClient.put(`/tables/${id}`, table);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/tables/${id}`);
  },
};

