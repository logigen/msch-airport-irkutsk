import { create } from 'zustand';
import api from '../api';

const useAuthStore = create((set) => ({
  user: JSON.parse(localStorage.getItem('user') || 'null'),
  loading: false,
  error: null,

  login: async (email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/login', { email, password });
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, loading: false });
      return data.user;
    } catch (e) {
      set({ error: e.response?.data?.message || 'Неверный email или пароль', loading: false });
      throw e;
    }
  },

  register: async (full_name, email, password) => {
    set({ loading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { full_name, email, password });
      localStorage.setItem('access', data.access);
      localStorage.setItem('refresh', data.refresh);
      localStorage.setItem('user', JSON.stringify(data.user));
      set({ user: data.user, loading: false });
      return data.user;
    } catch (e) {
      set({ error: e.response?.data?.message || 'Ошибка регистрации', loading: false });
      throw e;
    }
  },

  logout: async () => {
    try {
      const refresh = localStorage.getItem('refresh');
      await api.post('/auth/logout', { refresh });
    } catch {} finally {
      localStorage.clear();
      set({ user: null });
    }
  },

  clearError: () => set({ error: null }),
}));

export default useAuthStore;
