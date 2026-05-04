<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import SeatMap from '../components/seats/SeatMap.vue';
import SeatLegend from '../components/seats/SeatLegend.vue';
import SeatSelector from '../components/seats/SeatSelector.vue';
import { useEventStore } from '../stores/event';
import { useSeatStore } from '../stores/seat';
import { useCartStore } from '../stores/cart';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();
const seatStore = useSeatStore();
const cartStore = useCartStore();

const eventId = computed(() => route.params.id);
const timeLeft = ref('00:00');
const showExpiredModal = ref(false);
const zoom = ref(1);

let pollingTimer;
let countdownTimer;

const selectedSeatIds = computed(() => cartStore.selectedSeats.map((item) => item.seat.id));

const updateCountdown = () => {
  const nextExpiry = cartStore.soonestExpiry;
  if (!nextExpiry) {
    timeLeft.value = '00:00';
    return;
  }
  const diff = nextExpiry - Date.now();
  if (diff <= 0) {
    cartStore.clearAll();
    showExpiredModal.value = true;
    timeLeft.value = '00:00';
    return;
  }
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  timeLeft.value = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const toggleSeat = async (seat) => {
  if (!eventStore.currentEvent) return;

  const isSelected = selectedSeatIds.value.includes(seat.id) || seat.heldByMe;
  if (isSelected) {
    const reservation = cartStore.selectedSeats.find((item) => item.seat.id === seat.id);
    if (reservation) {
      await cartStore.releaseSeat(reservation.reservationId);
    }
    return;
  }

  if (cartStore.selectedSeats.length >= eventStore.currentEvent.maxTicketsPerUser) {
    return;
  }

  await cartStore.holdSeat(eventStore.currentEvent, seat);
};

const goToCheckout = () => {
  router.push('/checkout');
};

const refreshSeats = async () => {
  await seatStore.fetchSeats(eventId.value);
};

onMounted(async () => {
  await eventStore.fetchEvent(eventId.value);
  await refreshSeats();

  pollingTimer = setInterval(refreshSeats, 10000);
  countdownTimer = setInterval(updateCountdown, 1000);
});

onUnmounted(() => {
  if (pollingTimer) clearInterval(pollingTimer);
  if (countdownTimer) clearInterval(countdownTimer);
});
</script>

<template>
  <section class="page">
    <header class="seat-header">
      <div>
        <h2>{{ $t('seatMap.title') }}</h2>
        <p v-if="eventStore.currentEvent">{{ eventStore.currentEvent.title }}</p>
      </div>
      <div class="zoom-controls">
        <button class="ghost" @click="zoom = Math.max(0.6, zoom - 0.1)">{{ $t('seatMap.zoomOut') }}</button>
        <button class="ghost" @click="zoom = Math.min(1.4, zoom + 0.1)">{{ $t('seatMap.zoomIn') }}</button>
      </div>
    </header>

    <div class="seat-layout">
      <div class="seat-left">
        <SeatMap
          :seats="seatStore.seats"
          :selected-seat-ids="selectedSeatIds"
          :max-selection="eventStore.currentEvent?.maxTicketsPerUser || 1"
          :zoom="zoom"
          @toggle-seat="toggleSeat"
        />
      </div>
      <div class="seat-right">
        <SeatLegend />
        <SeatSelector
          :selected-seats="cartStore.selectedSeats"
          :total="cartStore.totalPrice"
          :time-left="timeLeft"
        />
        <button class="primary" :disabled="!cartStore.hasSelection" @click="goToCheckout">
          {{ $t('checkout.confirm') }}
        </button>
      </div>
    </div>

    <div v-if="showExpiredModal" class="modal">
      <div class="modal-content">
        <p>{{ $t('seatMap.releaseNotice') }}</p>
        <button class="primary" @click="showExpiredModal = false">OK</button>
      </div>
    </div>
  </section>
</template>
