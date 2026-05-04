import { defineStore } from 'pinia';
import api from '../api/axios';

export const useEventStore = defineStore('event', {
  state: () => ({
    events: [],
    currentEvent: null,
    loading: false,
  }),
  actions: {
    async fetchEvents(params = {}) {
      this.loading = true;
      try {
        const response = await api.get('/api/events', { params });
        this.events = response.data.data || [];
        return response.data;
      } finally {
        this.loading = false;
      }
    },
    async fetchEvent(id) {
      this.loading = true;
      try {
        const response = await api.get(`/api/events/${id}`);
        this.currentEvent = response.data;
        return response.data;
      } finally {
        this.loading = false;
      }
    },
  },
});
