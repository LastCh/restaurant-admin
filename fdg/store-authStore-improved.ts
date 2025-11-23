# НОВЫЙ: store/authStore.ts - УЛУЧШЕННЫЙ

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthResponse } from '../types';

interface User extends Omit<AuthResponse, 'accessToken' | 'refreshToken' | 'expiresIn'> {
  id: number;
}

interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  setUser: (authResponse: AuthResponse) => void;
  logout: () => void;
  restoreSession: () => void;
  setError: (error: string | null) => void;
  setLoading: (loading: boolean) => void;
  
  // Helpers
  isAuthenticated: () => boolean;
  hasRole: (role: string | string[]) => boolean;
  canAccess: (allowedRoles: string[]) => boolean;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      isLoading: false,
      error: null,

      // ✅ Сохраняем пользователя и токены
      setUser: (authResponse: AuthResponse) => {
        const { accessToken, refreshToken, expiresIn, ...userInfo } = authResponse;
        
        localStorage.setItem('accessToken', accessToken);
        localStorage.setItem('refreshToken', refreshToken);
        localStorage.setItem('tokenExpiration', (Date.now() + expiresIn).toString());
        
        set({
          user: userInfo as User,
          error: null,
        });
      },

      // ✅ Выход
      logout: () => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('tokenExpiration');
        localStorage.removeItem('auth'); // Zustand persist ключ
        
        set({
          user: null,
          error: null,
        });
      },

      // ✅ Восстановление сессии из localStorage
      restoreSession: () => {
        try {
          const token = localStorage.getItem('accessToken');
          const refreshToken = localStorage.getItem('refreshToken');
          const tokenExpiration = localStorage.getItem('tokenExpiration');

          // Проверяем валидность токена
          if (!token || !refreshToken) {
            get().logout();
            return;
          }

          // Проверяем истечение токена
          if (tokenExpiration && Date.now() > parseInt(tokenExpiration)) {
            console.warn('Token expired, need refresh');
            // В реальном приложении здесь нужно обновить токен
            get().logout();
            return;
          }

          // Восстанавливаем пользователя из persist
          const stored = localStorage.getItem('auth');
          if (stored) {
            const parsed = JSON.parse(stored);
            if (parsed.state?.user) {
              set({ user: parsed.state.user });
            }
          }
        } catch (error) {
          console.error('Failed to restore session:', error);
          get().logout();
        }
      },

      setError: (error: string | null) => {
        set({ error });
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      // ✅ Проверка аутентификации
      isAuthenticated: () => {
        const { user } = get();
        const token = localStorage.getItem('accessToken');
        return !!user && !!token;
      },

      // ✅ Проверка роли (одна или несколько)
      hasRole: (role: string | string[]) => {
        const { user } = get();
        if (!user) return false;

        if (typeof role === 'string') {
          return user.role === role;
        }

        return role.includes(user.role);
      },

      // ✅ Проверка доступа по ролям
      canAccess: (allowedRoles: string[]) => {
        const { user } = get();
        if (!user) return false;
        return allowedRoles.includes(user.role);
      },
    }),
    {
      name: 'auth', // localStorage key
      partialize: (state) => ({
        user: state.user,
      }),
    }
  )
);
