import apiClient from './client';

export type DashboardStats = {
  todayOrders: number;
  todayRevenue: number;
  activeReservations: number;
  totalClients: number;
  lowStockItems: number;
  pendingOrders: number;
};

export const statisticsAPI = {
  getDashboard: async (): Promise<DashboardStats> => {
    const { data } = await apiClient.get<DashboardStats>(
      '/admin/statistics/dashboard'
    );
    return data;
  },
};
