# ФИКСИРОВАННЫЙ: api/orders.ts

import apiClient from './client';
import type { PageResponse, PaginationParams } from '../types/api';

// OrderStatus совпадает с бэкендом: PENDING, IN_PROGRESS, COMPLETED, CANCELLED
export type OrderStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED';

export interface OrderItem {
  id: number;
  orderId: number;
  dishId: number;
  dishName?: string;
  quantity: number;
  unitPrice: number;
  total?: number;
  createdAt?: string;
}

export interface Order {
  id: number;
  orderTime: string;
  total: number;
  status: OrderStatus;
  clientId?: number;
  clientName?: string;
  clientPhone?: string;
  reservationId?: number;
  notes?: string;
  createdByUserId?: number;
  items?: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderRequest {
  clientId?: number;
  reservationId?: number;
  notes?: string;
}

export interface CreateOrderItemRequest {
  dishId: number;
  quantity: number;
  unitPrice?: number;
}

export const ordersAPI = {
  // ✅ Получить все заказы с пагинацией
  getAll: async (page = 0, size = 10, sortBy = 'createdAt', direction = 'desc') => {
    const { data } = await apiClient.get<PageResponse<Order>>(
      `/orders?page=${page}&size=${size}&sortBy=${sortBy}&direction=${direction}`
    );
    return data;
  },

  // ✅ Получить заказ по ID
  getById: async (id: number): Promise<Order> => {
    const { data } = await apiClient.get(`/orders/${id}`);
    return data;
  },

  // ✅ Создать новый заказ
  create: async (order: CreateOrderRequest): Promise<Order> => {
    const { data } = await apiClient.post('/orders', order);
    return data;
  },

  // ✅ Обновить заказ (только статус и примечания)
  updateStatus: async (id: number, status: OrderStatus): Promise<Order> => {
    const { data } = await apiClient.put(`/orders/${id}/status?status=${status}`);
    return data;
  },

  // ✅ Удалить заказ
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
  },

  // ✅ Получить заказы по статусу
  getByStatus: async (status: OrderStatus, page = 0, size = 10) => {
    const { data } = await apiClient.get<PageResponse<Order>>(
      `/orders/status/${status}?page=${page}&size=${size}`
    );
    return data;
  },

  // ✅ Получить заказы клиента
  getByClientId: async (clientId: number, page = 0, size = 10) => {
    const { data } = await apiClient.get<PageResponse<Order>>(
      `/orders/client/${clientId}?page=${page}&size=${size}`
    );
    return data;
  },

  // ✅ Добавить позицию в заказ
  addItem: async (orderId: number, item: CreateOrderItemRequest): Promise<OrderItem> => {
    const { data } = await apiClient.post(`/orders/${orderId}/items`, item);
    return data;
  },

  // ✅ Получить позиции заказа
  getItems: async (orderId: number): Promise<OrderItem[]> => {
    const { data } = await apiClient.get(`/orders/${orderId}/items`);
    return data;
  },

  // ✅ Удалить позицию из заказа
  removeItem: async (orderId: number, itemId: number): Promise<void> => {
    await apiClient.delete(`/orders/${orderId}/items/${itemId}`);
  },

  // ✅ Завершить заказ (PENDING → COMPLETED, вызывает триггер)
  complete: async (id: number): Promise<Order> => {
    const { data } = await apiClient.put(`/orders/${id}/complete`);
    return data;
  },
};
