import apiClient from './client';

export type OrderStatus = 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'COMPLETED' | 'CANCELLED';

export type OrderItem = {
  id: number;
  dishId: number;
  dishName: string;
  quantity: number;
  price: number;
};

export type Order = {
  id: number;
  clientId: number;
  clientName: string;
  clientPhone: string;
  tableNumber?: string;
  status: OrderStatus;
  totalPrice: number;
  items: OrderItem[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
};

export type CreateOrderRequest = {
  clientId: number;
  tableId?: number;
  items: { dishId: number; quantity: number }[];
  notes?: string;
};

export type UpdateOrderRequest = {
  status?: OrderStatus;
  notes?: string;
};

export const ordersAPI = {
  // Получить все заказы с пагинацией
  getAll: async (page: number = 0, size: number = 10) => {
    const { data } = await apiClient.get(`/orders?page=${page}&size=${size}`);
    return data;
  },

  // Получить заказ по ID
  getById: async (id: number): Promise<Order> => {
    const { data } = await apiClient.get(`/orders/${id}`);
    return data;
  },

  // Создать новый заказ
  create: async (order: CreateOrderRequest): Promise<Order> => {
    const { data } = await apiClient.post('/orders', order);
    return data;
  },

  // Обновить заказ
  update: async (id: number, order: UpdateOrderRequest): Promise<Order> => {
    const { data } = await apiClient.put(`/orders/${id}`, order);
    return data;
  },

  // Удалить заказ
  delete: async (id: number): Promise<void> => {
    await apiClient.delete(`/orders/${id}`);
  },

  // Получить заказы по статусу
  getByStatus: async (status: OrderStatus, page: number = 0, size: number = 10) => {
    const { data } = await apiClient.get(`/orders?status=${status}&page=${page}&size=${size}`);
    return data;
  },
};
