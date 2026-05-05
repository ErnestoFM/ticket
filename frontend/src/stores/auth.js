import { defineStore } from 'pinia';
import api from '../api/axios';

export const useAuthStore = defineStore('auth', {
  state: () => ({
    user: null,
    loading: false,
    error: null,
    initialized: false,
  }),
  getters: {
    isAuthenticated: (state) => Boolean(state.user),
  },
  actions: {
    async fetchMe() {
      if (this.initialized) return;
      this.loading = true;
      try {
        const response = await api.get('/api/auth/me');
        this.user = response.data.user;
      } catch (_) {
        this.user = null;
      } finally {
        this.loading = false;
        this.initialized = true;
      }
    },
    async login({ curp, password }) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post('/api/auth/login', { curp, password });
        this.user = response.data.user;
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Login failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async register(payload) {
      this.loading = true;
      this.error = null;
      try {
        const response = await api.post('/api/auth/register', payload);
        return response.data;
      } catch (err) {
        this.error = err.response?.data?.error || 'Registration failed';
        throw err;
      } finally {
        this.loading = false;
      }
    },
    async logout() {
      await api.post('/api/auth/logout');
      this.user = null;
      this.initialized = true;
    },
  },
});
