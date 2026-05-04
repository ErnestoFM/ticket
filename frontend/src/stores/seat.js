import { defineStore } from 'pinia';
import api from '../api/axios';

export const useSeatStore = defineStore('seat', {
  state: () => ({
    seats: [],
    loading: false,
  }),
  actions: {
    async fetchSeats(eventId) {
      this.loading = true;
      try {
        const response = await api.get(`/api/seats/event/${eventId}`);
        this.seats = response.data;
        return response.data;
      } finally {
        this.loading = false;
      }
    },
  },
});
