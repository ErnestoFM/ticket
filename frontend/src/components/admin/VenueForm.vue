<script setup>
import { computed, reactive, watch } from 'vue';

const props = defineProps({
  initialVenue: {
    type: Object,
    default: null,
  },
});

const emit = defineEmits(['submit']);

const defaultForm = () => ({
  name: '',
  address: '',
  city: '',
  state: '',
  type: 'teatro',
  totalRows: 10,
  totalCols: 10,
  logoUrl: '',
  zoneConfig: [
    { rowStart: 0, rowEnd: 2, seatType: 'general' },
  ],
});

const form = reactive(defaultForm());

const isEditing = computed(() => Boolean(props.initialVenue?.id));

const applyInitialVenue = (venue) => {
  Object.assign(form, defaultForm());
  if (!venue) return;
  form.name = venue.name || '';
  form.address = venue.address || '';
  form.city = venue.city || '';
  form.state = venue.state || '';
  form.type = venue.type || 'teatro';
  form.totalRows = venue.totalRows ?? 10;
  form.totalCols = venue.totalCols ?? 10;
  form.logoUrl = venue.logoUrl || '';
};

watch(() => props.initialVenue, (value) => {
  applyInitialVenue(value);
}, { immediate: true });

const addZone = () => {
  form.zoneConfig.push({ rowStart: 0, rowEnd: 0, seatType: 'general' });
};

const removeZone = (index) => {
  form.zoneConfig.splice(index, 1);
};

const submit = () => {
  emit('submit', { ...form, zoneConfig: [...form.zoneConfig] });
};
</script>

<template>
  <form class="form" @submit.prevent="submit">
    <label>
      {{ $t('venues.form.name') }}
      <input v-model="form.name" required />
    </label>
    <label>
      {{ $t('venues.form.address') }}
      <input v-model="form.address" required />
    </label>
    <label>
      {{ $t('venues.form.city') }}
      <input v-model="form.city" required />
    </label>
    <label>
      {{ $t('venues.form.state') }}
      <input v-model="form.state" required />
    </label>
    <label>
      {{ $t('venues.form.type') }}
      <select v-model="form.type">
        <option value="teatro">{{ $t('events.types.teatro') }}</option>
        <option value="cine">{{ $t('events.types.cine') }}</option>
        <option value="museo">{{ $t('events.types.museo') }}</option>
      </select>
    </label>
    <label>
      {{ $t('venues.form.totalRows') }}
      <input v-model.number="form.totalRows" type="number" min="1" max="100" />
    </label>
    <label>
      {{ $t('venues.form.totalCols') }}
      <input v-model.number="form.totalCols" type="number" min="1" max="100" />
    </label>
    <label>
      {{ $t('venues.form.logoUrl') }}
      <input v-model="form.logoUrl" type="url" />
    </label>

    <div class="zone-config">
      <h4>{{ $t('venues.form.zoneConfig') }}</h4>
      <div v-for="(zone, index) in form.zoneConfig" :key="index" class="zone-row">
        <input v-model.number="zone.rowStart" type="number" min="0" :placeholder="$t('venues.form.rowStart')" />
        <input v-model.number="zone.rowEnd" type="number" min="0" :placeholder="$t('venues.form.rowEnd')" />
        <select v-model="zone.seatType">
          <option value="general">{{ $t('venues.seatTypes.general') }}</option>
          <option value="preferente">{{ $t('venues.seatTypes.preferente') }}</option>
          <option value="vip">{{ $t('venues.seatTypes.vip') }}</option>
          <option value="palco">{{ $t('venues.seatTypes.palco') }}</option>
        </select>
        <button type="button" class="ghost" @click="removeZone(index)">{{ $t('venues.form.removeZone') }}</button>
      </div>
      <button type="button" class="ghost" @click="addZone">{{ $t('venues.form.addZone') }}</button>
    </div>

    <button class="primary" type="submit">
      {{ isEditing ? $t('venues.form.submitUpdate') : $t('venues.form.submitCreate') }}
    </button>
  </form>
</template>
