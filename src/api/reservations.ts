import apiClient from './client';
import type { ReservationDTO, CreateReservationRequest } from '../types';

export type Reservation = ReservationDTO;

export const reservationsAPI = {
  getAll: async (page = 0, size = 10, sortBy = 'reservationTime', direction: 'asc' | 'desc' = 'asc') => {
    const { data } = await apiClient.get(
      `/reservations?page=${page}&size=${size}&sortBy=${encodeURIComponent(sortBy)}&direction=${encodeURIComponent(direction)}`
    );
    return data;
  },

  getById: async (id: number): Promise<Reservation> => {
    const { data } = await apiClient.get(`/reservations/${id}`);
    return data;
  },

  create: async (reservation: CreateReservationRequest): Promise<Reservation> => {
    const { data } = await apiClient.post('/reservations', reservation);
    return data;
  },

  update: async (id: number, reservation: Partial<CreateReservationRequest>): Promise<Reservation> => {
    const { data } = await apiClient.put(`/reservations/${id}`, reservation);
    return data;
  },

  delete: async (id: number): Promise<void> => {
  return apiClient.delete(`/reservations/${id}`);
  },

  cancel: async (id: number): Promise<void> => {
    await apiClient.put(`/reservations/${id}/cancel`);
  },
};
