<script setup>
import { computed } from 'vue';

const props = defineProps({
  seats: {
    type: Array,
    default: () => [],
  },
  selectedSeatIds: {
    type: Array,
    default: () => [],
  },
  maxSelection: {
    type: Number,
    default: 1,
  },
  zoom: {
    type: Number,
    default: 1,
  },
});

const emit = defineEmits(['toggle-seat']);

const maxCols = computed(() => {
  if (!props.seats.length) return 0;
  return Math.max(...props.seats.map((seat) => seat.col));
});

const seatStyle = (seat) => {
  const isSelected = props.selectedSeatIds.includes(seat.id) || seat.heldByMe;

  if (!seat.isActive || seat.status === 'inactive') {
    return { backgroundColor: '#212121' };
  }
  if (isSelected) {
    return { backgroundColor: '#2E7D32' };
  }
  if (seat.status === 'sold') {
    return { backgroundColor: '#B71C1C' };
  }
  if (seat.status === 'held') {
    return { backgroundColor: '#FF6D00' };
  }
  return { backgroundColor: seat.seatType?.color || '#9E9E9E' };
};

const onSeatClick = (seat) => {
  const isSelected = props.selectedSeatIds.includes(seat.id) || seat.heldByMe;
  if (seat.status === 'available' || isSelected) {
    emit('toggle-seat', seat);
  }
};
</script>

<template>
  <div class="seat-map-wrapper">
    <div
      class="seat-map"
      :style="{ gridTemplateColumns: `repeat(${maxCols}, 1fr)`, transform: `scale(${zoom})` }"
    >
      <button
        v-for="seat in seats"
        :key="seat.id"
        class="seat"
        :class="seat.status"
        :style="seatStyle(seat)"
        @click="onSeatClick(seat)"
      >
        {{ seat.label }}
      </button>
    </div>
  </div>
</template>
