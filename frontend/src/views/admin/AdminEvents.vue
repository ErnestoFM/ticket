<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../api/axios';
import EventForm from '../../components/events/EventForm.vue';

const { t } = useI18n();

const events = ref([]);
const venues = ref([]);
const loading = ref(false);
const error = ref('');
const editingEvent = ref(null);

const isEditing = computed(() => Boolean(editingEvent.value));

const fetchEvents = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/api/events');
    events.value = response.data.data || [];
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  } finally {
    loading.value = false;
  }
};

const fetchVenues = async () => {
  try {
    const response = await api.get('/api/venues');
    venues.value = response.data || [];
  } catch (_) {
    venues.value = [];
  }
};

const handleSubmit = async (payload) => {
  error.value = '';
  try {
    if (editingEvent.value) {
      await api.put(`/api/events/${editingEvent.value.id}`, payload);
    } else {
      await api.post('/api/events', payload);
    }
    editingEvent.value = null;
    await fetchEvents();
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  }
};

const startEdit = (event) => {
  editingEvent.value = event;
};

const cancelEdit = () => {
  editingEvent.value = null;
};

const cancelEvent = async (event) => {
  try {
    await api.patch(`/api/events/${event.id}/cancel`);
    await fetchEvents();
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  }
};

const statusLabel = (status) => t(`events.statusLabels.${status}`, status);

onMounted(async () => {
  await Promise.all([fetchEvents(), fetchVenues()]);
});
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div>
        <h2>{{ $t('admin.events') }}</h2>
        <p class="muted">{{ $t('admin.eventsDescription') }}</p>
      </div>
      <button v-if="isEditing" class="ghost" type="button" @click="cancelEdit">{{ $t('common.cancel') }}</button>
    </header>

    <div class="admin-form">
      <h3>{{ isEditing ? $t('admin.editEvent') : $t('admin.createEvent') }}</h3>
      <EventForm :venues="venues" :initial-event="editingEvent" @submit="handleSubmit" />
    </div>

    <div class="admin-list">
      <header class="section-header">
        <h3>{{ $t('events.title') }}</h3>
        <button class="ghost" type="button" @click="fetchEvents">{{ $t('common.refresh') }}</button>
      </header>
      <p v-if="loading">{{ $t('common.loading') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-else-if="!events.length" class="empty">{{ $t('admin.noEvents') }}</p>

      <div v-else class="table table-events">
        <div class="table-row table-header">
          <span>{{ $t('events.title') }}</span>
          <span>{{ $t('events.date') }}</span>
          <span>{{ $t('events.status') }}</span>
          <span>{{ $t('common.actions') }}</span>
        </div>
        <div v-for="event in events" :key="event.id" class="table-row">
          <span>{{ event.title }}</span>
          <span>{{ new Date(event.date).toLocaleString() }}</span>
          <span class="badge">{{ statusLabel(event.status) }}</span>
          <span class="actions">
            <button class="ghost" type="button" @click="startEdit(event)">{{ $t('common.edit') }}</button>
            <button
              class="ghost danger"
              type="button"
              :disabled="event.status === 'cancelado'"
              @click="cancelEvent(event)"
            >
              {{ $t('admin.cancelEvent') }}
            </button>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
