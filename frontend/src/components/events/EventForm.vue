<script setup>
import { reactive } from 'vue';

const props = defineProps({
  venues: {
    type: Array,
    default: () => [],
  },
});

const emit = defineEmits(['submit']);

const form = reactive({
  venueId: '',
  title: '',
  type: 'teatro',
  date: '',
  duration: 120,
  basePrice: 0,
  maxTicketsPerUser: 4,
  posterUrl: '',
  bannerUrl: '',
  description: '',
});

const submit = () => {
  emit('submit', { ...form });
};
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <label>
      {{ $t('events.createEvent') }}
      <select v-model="form.venueId" required>
        <option value="" disabled>Selecciona recinto</option>
        <option v-for="venue in venues" :key="venue.id" :value="venue.id">
          {{ venue.name }} - {{ venue.city }}
        </option>
      </select>
    </label>
    <label>
      Título
      <input v-model="form.title" type="text" required />
    </label>
    <label>
      Tipo
      <select v-model="form.type">
        <option value="teatro">Teatro</option>
        <option value="cine">Cine</option>
        <option value="museo">Museo</option>
      </select>
    </label>
    <label>
      Fecha
      <input v-model="form.date" type="datetime-local" required />
    </label>
    <label>
      Duración (min)
      <input v-model.number="form.duration" type="number" min="1" required />
    </label>
    <label>
      Precio base
      <input v-model.number="form.basePrice" type="number" min="0" step="0.01" required />
    </label>
    <label>
      Máximo por usuario
      <input v-model.number="form.maxTicketsPerUser" type="number" min="1" max="10" />
    </label>
    <label>
      Poster URL
      <input v-model="form.posterUrl" type="url" />
    </label>
    <label>
      Banner URL
      <input v-model="form.bannerUrl" type="url" />
    </label>
    <label>
      Descripción
      <textarea v-model="form.description" rows="3"></textarea>
    </label>
    <button class="primary" type="submit">Guardar</button>
  </form>
</template>
