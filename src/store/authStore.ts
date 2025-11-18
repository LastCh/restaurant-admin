import { create } from 'zustand';
import type { AuthResponse } from '../types';

type AuthState = {
  user: AuthResponse | null;
  setUser: (user: AuthResponse) => void;
  logout: () => void;
  restoreSession: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  
  setUser: (user: AuthResponse) => {
    localStorage.setItem('accessToken', user.accessToken);
    localStorage.setItem('refreshToken', user.refreshToken);
    localStorage.setItem('user', JSON.stringify(user));
    set({ user });
  },
  
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    set({ user: null });
  },
  
  restoreSession: () => {
    const user = localStorage.getItem('user');
    if (user) {
      try {
        set({ user: JSON.parse(user) });
      } catch {
        localStorage.removeItem('user');
      }
    }
  },
}));
