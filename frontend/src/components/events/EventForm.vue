<script setup>
import { computed, reactive, watch } from 'vue';

const props = defineProps({
  venues: {
    type: Array,
    default: () => [],
  },
  initialEvent: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['submit']);

const defaultForm = () => ({
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

const form = reactive(defaultForm());

const isEditing = computed(() => Boolean(props.initialEvent?.id));

const toDateTimeLocal = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 16);
};

const applyInitialEvent = (event) => {
  Object.assign(form, defaultForm());
  if (!event) return;
  form.venueId = event.venueId || event.venue?.id || '';
  form.title = event.title || '';
  form.type = event.type || 'teatro';
  form.date = toDateTimeLocal(event.date);
  form.duration = event.duration ?? 120;
  form.basePrice = event.basePrice ?? 0;
  form.maxTicketsPerUser = event.maxTicketsPerUser ?? 4;
  form.posterUrl = event.posterUrl || '';
  form.bannerUrl = event.bannerUrl || '';
  form.description = event.description || '';
};

watch(() => props.initialEvent, (value) => {
  applyInitialEvent(value);
}, { immediate: true });

const submit = () => {
  emit('submit', { ...form });
};
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <label>
      {{ $t('events.form.venue') }}
      <select v-model="form.venueId" required>
        <option value="" disabled>{{ $t('events.form.venuePlaceholder') }}</option>
        <option v-for="venue in venues" :key="venue.id" :value="venue.id">
          {{ venue.name }} · {{ venue.city }}
        </option>
      </select>
    </label>
    <label>
      {{ $t('events.form.title') }}
      <input v-model="form.title" type="text" required />
    </label>
    <label>
      {{ $t('events.form.type') }}
      <select v-model="form.type">
        <option value="teatro">{{ $t('events.types.teatro') }}</option>
        <option value="cine">{{ $t('events.types.cine') }}</option>
        <option value="museo">{{ $t('events.types.museo') }}</option>
      </select>
    </label>
    <label>
      {{ $t('events.form.date') }}
      <input v-model="form.date" type="datetime-local" required />
    </label>
    <label>
      {{ $t('events.form.duration') }}
      <input v-model.number="form.duration" type="number" min="1" required />
    </label>
    <label>
      {{ $t('events.form.basePrice') }}
      <input v-model.number="form.basePrice" type="number" min="0" step="0.01" required />
    </label>
    <label>
      {{ $t('events.form.maxTickets') }}
      <input v-model.number="form.maxTicketsPerUser" type="number" min="1" max="10" />
    </label>
    <label>
      {{ $t('events.form.posterUrl') }}
      <input v-model="form.posterUrl" type="url" />
    </label>
    <label>
      {{ $t('events.form.bannerUrl') }}
      <input v-model="form.bannerUrl" type="url" />
    </label>
    <label>
      {{ $t('events.form.description') }}
      <textarea v-model="form.description" rows="3"></textarea>
    </label>
    <button class="primary" type="submit">
      {{ isEditing ? $t('events.form.submitUpdate') : $t('events.form.submitCreate') }}
    </button>
  </form>
</template>
