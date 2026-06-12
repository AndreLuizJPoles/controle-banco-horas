import { create } from 'zustand';
import api from '../services/api';
import type { User } from '../types';

let authSessionGeneration = 0;

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (
    name: string,
    email: string,
    password: string,
    workStartTime?: string,
    workEndTime?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  fetchMe: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email, password) => {
    const generation = ++authSessionGeneration;
    const { data } = await api.post<{ user: User }>('/auth/login', { email, password });
    if (generation !== authSessionGeneration) return data.user;
    set({ user: data.user, isAuthenticated: true, isLoading: false });
    return data.user;
  },

  register: async (name, email, password, workStartTime = '08:00', workEndTime = '17:00') => {
    await api.post('/auth/register', { name, email, password, workStartTime, workEndTime });
  },

  logout: async () => {
    authSessionGeneration++;
    try {
      await api.post('/auth/logout');
    } finally {
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  fetchMe: async () => {
    const generation = authSessionGeneration;
    try {
      set({ isLoading: true });
      const { data } = await api.get<{ user: User }>('/auth/me');
      if (generation !== authSessionGeneration) return;
      set({ user: data.user, isAuthenticated: true, isLoading: false });
    } catch {
      if (generation !== authSessionGeneration) return;
      set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },

  setUser: (user) => set({ user, isAuthenticated: !!user, isLoading: false }),
}));
