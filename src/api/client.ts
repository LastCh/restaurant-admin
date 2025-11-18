import axios, { AxiosError } from 'axios';
import type { ErrorResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080/api';

export const apiClient = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ErrorResponse>) => {
    // УБРАЛИ перенаправление вообще для тестирования
    // if (error.response?.status === 401 && error.config?.url?.includes('/admin/')) {
    //   localStorage.clear();
    //   window.location.href = '/login';
    // }
    return Promise.reject(error);
  }
);


export default apiClient;
