<script setup>
const props = defineProps({
  selectedSeats: {
    type: Array,
    default: () => [],
  },
  total: {
    type: Number,
    default: 0,
  },
  timeLeft: {
    type: String,
    default: '00:00',
  },
});
</script>

<template>
  <aside class="seat-summary">
    <h4>{{ $t('seatMap.summary') }}</h4>
    <p class="countdown">{{ $t('seatMap.counter') }}: {{ timeLeft }}</p>
    <ul>
      <li v-for="item in selectedSeats" :key="item.reservationId">
        {{ item.seat.label }} · {{ item.seat.seatType?.name?.toUpperCase() }} · ${{ item.price.toFixed(2) }}
      </li>
    </ul>
    <div class="total-row">
      <strong>{{ $t('seatMap.total') }}</strong>
      <span>${{ total.toFixed(2) }}</span>
    </div>
  </aside>
</template>
