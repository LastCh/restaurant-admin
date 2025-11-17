import apiClient from './client';
import type { LoginRequest, AuthResponse } from '../types';

export const authAPI = {
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>(
      '/auth/signin',
      credentials
    );
    return data;
  },

  logout: async (): Promise<void> => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  },
};
