import { create } from 'zustand';
import type { AuthResponse } from '../types';

interface AuthState {
  user: AuthResponse | null;
  setUser: (user: AuthResponse) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => {
    localStorage.setItem('accessToken', user.accessToken);
    set({ user });
  },
  logout: () => {
    localStorage.removeItem('accessToken');
    set({ user: null });
  },
}));
