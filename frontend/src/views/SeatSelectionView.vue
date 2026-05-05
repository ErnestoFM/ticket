<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
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

const { t } = useI18n();
const eventId = computed(() => route.params.id);
const timeLeft = ref('00:00');
const showExpiredModal = ref(false);
const showLimitModal = ref(false);
const zoom = ref(1);

let pollingTimer;
let countdownTimer;

const selectedSeatIds = computed(() => cartStore.selectedSeats.map((item) => item.seat.id));

const selectionError = computed(() => cartStore.lastError);

const releaseAllSelections = async () => {
  const reservations = [...cartStore.selectedSeats];
  await Promise.allSettled(reservations.map((item) => cartStore.releaseSeat(item.reservationId)));
  cartStore.clearAll();
};

const updateCountdown = () => {
  const nextExpiry = cartStore.soonestExpiry;
  if (!nextExpiry) {
    timeLeft.value = '00:00';
    return;
  }
  const diff = nextExpiry - Date.now();
  if (diff <= 0) {
    releaseAllSelections();
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
      try {
        await cartStore.releaseSeat(reservation.reservationId);
      } catch (_) {
        cartStore.lastError = cartStore.lastError || t('seatMap.holdError');
      }
    }
    return;
  }

  if (cartStore.selectedSeats.length >= eventStore.currentEvent.maxTicketsPerUser) {
    showLimitModal.value = true;
    return;
  }

  try {
    await cartStore.holdSeat(eventStore.currentEvent, seat);
  } catch (_) {
    cartStore.lastError = cartStore.lastError || t('seatMap.holdError');
  }
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
        <p v-if="selectionError" class="error">{{ selectionError }}</p>
        <button class="primary" :disabled="!cartStore.hasSelection" @click="goToCheckout">
          {{ $t('checkout.confirm') }}
        </button>
      </div>
    </div>

    <div v-if="showExpiredModal" class="modal">
      <div class="modal-content glass-card">
        <p>{{ $t('seatMap.releaseNotice') }}</p>
        <button class="primary" @click="showExpiredModal = false">{{ $t('common.close') }}</button>
      </div>
    </div>

    <div v-if="showLimitModal" class="modal">
      <div class="modal-content glass-card">
        <h3 style="margin-bottom: 16px; color: var(--danger);">Límite Alcanzado</h3>
        <p style="margin-bottom: 24px;">Has alcanzado el límite máximo de {{ eventStore.currentEvent?.maxTicketsPerUser }} boletos por persona para este evento.</p>
        <button class="primary" @click="showLimitModal = false">{{ $t('common.close') }}</button>
      </div>
    </div>
  </section>
</template>
