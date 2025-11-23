import apiClient from './client';
import type { PageResponse, ClientDTO, CreateClientRequest } from '../types/api';

export const clientsAPI = {
  getAll: async (page = 0, size = 10, sortBy = 'createdAt', direction: 'asc' | 'desc' = 'desc') => {
    const { data } = await apiClient.get<PageResponse<ClientDTO>>(
      `/clients?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`
    );
    return data;
  },

  getById: async (id: number): Promise<ClientDTO> => {
    const { data } = await apiClient.get(`/clients/${id}`);
    return data;
  },

  create: async (client: CreateClientRequest): Promise<ClientDTO> => {
    const { data } = await apiClient.post('/clients', client);
    return data;
  },

  update: async (id: number, client: Partial<CreateClientRequest>): Promise<ClientDTO> => {
    const { data } = await apiClient.put(`/clients/${id}`, client);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/clients/${id}`);
  },
};

