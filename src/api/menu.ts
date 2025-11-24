import apiClient from './client';
import type { DishDTO, CreateDishRequest } from '../types';

export type Dish = DishDTO;

export const menuAPI = {
  getAll: async (page = 0, size = 10, sortBy = 'createdAt', direction: 'asc' | 'desc' = 'desc') => {
    const { data } = await apiClient.get(`/dishes?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`);
    return data;
  },

  getById: async (id: number): Promise<Dish> => {
    const { data } = await apiClient.get(`/dishes/${id}`);
    return data;
  },

  create: async (dish: CreateDishRequest): Promise<Dish> => {
    const { data } = await apiClient.post('/dishes', dish);
    return data;
  },

  update: async (id: number, dish: Partial<CreateDishRequest>): Promise<Dish> => {
    const { data } = await apiClient.put(`/dishes/${id}`, dish);
    return data;
  },

  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/dishes/${id}`);
  },

  getByCategory: async (category: string, page = 0, size = 10) => {
    const { data } = await apiClient.get(`/dishes/category/${category}?page=${page}&size=${size}`);
    return data;
  },

  getAvailable: async (page = 0, size = 10) => {
    const { data } = await apiClient.get(`/dishes/available?page=${page}&size=${size}`);
    return data;
  },
};
