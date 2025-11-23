import apiClient from './client';
import type { PageResponse } from '../types/api';

export interface Ingredient {
  id: number;
  name: string;
  unit: string; // kg, g, l, ml, piece
  stockQuantity: number;
  costPerUnit: number;
  minStockLevel: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateIngredientRequest {
  name: string;
  unit: string;
  stockQuantity?: number;
  costPerUnit?: number;
  minStockLevel?: number;
}

export interface UpdateIngredientRequest {
  name?: string;
  unit?: string;
  costPerUnit?: number;
  minStockLevel?: number;
}

export const ingredientsAPI = {
  // ✅ Получить все ингредиенты
  getAll: async (page = 0, size = 10, sortBy = 'createdAt', direction: 'asc' | 'desc' = 'desc') => {
    const { data } = await apiClient.get<PageResponse<Ingredient>>(
      `/ingredients?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`
    );
    return data;
  },

  // ✅ Получить ингредиент по ID
  getById: async (id: number): Promise<Ingredient> => {
    const { data } = await apiClient.get(`/ingredients/${id}`);
    return data;
  },

  // ✅ Создать ингредиент
  create: async (ingredient: CreateIngredientRequest): Promise<Ingredient> => {
    const { data } = await apiClient.post('/ingredients', ingredient);
    return data;
  },

  // ✅ Обновить ингредиент
  update: async (id: number, ingredient: UpdateIngredientRequest): Promise<Ingredient> => {
    const { data } = await apiClient.put(`/ingredients/${id}`, ingredient);
    return data;
  },

  // ✅ Удалить ингредиент
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/ingredients/${id}`);
  },

  // ✅ Получить ингредиенты с низким запасом
  getLowStock: async (): Promise<Ingredient[]> => {
    const { data } = await apiClient.get('/ingredients/low-stock');
    return data;
  },

  // ✅ Обновить запас ингредиента
  updateStock: async (id: number, quantity: number): Promise<void> => {
    await apiClient.post(`/ingredients/${id}/stock?quantity=${quantity}`);
  },
};
