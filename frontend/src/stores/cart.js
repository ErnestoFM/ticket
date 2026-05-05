import { defineStore } from 'pinia';
import api from '../api/axios';

export const useCartStore = defineStore('cart', {
  state: () => ({
    selectedSeats: [],
    lastError: null,
  }),
  getters: {
    totalPrice: (state) => state.selectedSeats.reduce((sum, item) => sum + item.price, 0),
    hasSelection: (state) => state.selectedSeats.length > 0,
    soonestExpiry: (state) => {
      if (!state.selectedSeats.length) return null;
      return state.selectedSeats.reduce((min, item) => {
        const exp = new Date(item.expiresAt).getTime();
        return min === null || exp < min ? exp : min;
      }, null);
    },
  },
  actions: {
    async holdSeat(event, seat) {
      this.lastError = null;
      try {
        const response = await api.post('/api/reservations/hold', {
          eventId: event.id,
          seatId: seat.id,
        });

        const multiplier = seat.seatType?.multiplier ? parseFloat(seat.seatType.multiplier) : 1.0;
        const price = parseFloat(event.basePrice) * multiplier;

        this.selectedSeats.push({
          seat,
          reservationId: response.data.reservationId,
          expiresAt: response.data.expiresAt,
          eventId: event.id,
          price,
        });

        return response.data;
      } catch (err) {
        this.lastError = err.response?.data?.error || null;
        throw err;
      }
    },
    async releaseSeat(reservationId) {
      try {
        await api.post('/api/reservations/cancel', { reservationId });
        this.selectedSeats = this.selectedSeats.filter((item) => item.reservationId !== reservationId);
      } catch (err) {
        this.lastError = err.response?.data?.error || null;
        throw err;
      }
    },
    removeSeat(reservationId) {
      this.selectedSeats = this.selectedSeats.filter((item) => item.reservationId !== reservationId);
      this.lastError = null;
    },
    clearAll() {
      this.selectedSeats = [];
      this.lastError = null;
    },
  },
});
