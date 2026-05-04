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
    },
    async releaseSeat(reservationId) {
      await api.post('/api/reservations/cancel', { reservationId });
      this.selectedSeats = this.selectedSeats.filter((item) => item.reservationId !== reservationId);
    },
    removeSeat(reservationId) {
      this.selectedSeats = this.selectedSeats.filter((item) => item.reservationId !== reservationId);
    },
    clearAll() {
      this.selectedSeats = [];
    },
  },
});
