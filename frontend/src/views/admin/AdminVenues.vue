<script setup>
import { computed, onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../api/axios';
import VenueForm from '../../components/admin/VenueForm.vue';

const { t } = useI18n();

const venues = ref([]);
const loading = ref(false);
const error = ref('');
const editingVenue = ref(null);

const isEditing = computed(() => Boolean(editingVenue.value));

const fetchVenues = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/api/venues');
    venues.value = response.data || [];
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  } finally {
    loading.value = false;
  }
};

const handleSubmit = async (payload) => {
  error.value = '';
  try {
    if (editingVenue.value) {
      await api.put(`/api/venues/${editingVenue.value.id}`, payload);
    } else {
      await api.post('/api/venues', payload);
    }
    editingVenue.value = null;
    await fetchVenues();
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  }
};

const startEdit = (venue) => {
  editingVenue.value = venue;
};

const cancelEdit = () => {
  editingVenue.value = null;
};

const deactivateVenue = async (venue) => {
  try {
    await api.delete(`/api/venues/${venue.id}`);
    await fetchVenues();
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  }
};

onMounted(fetchVenues);
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div>
        <h2>{{ $t('admin.venues') }}</h2>
        <p class="muted">{{ $t('admin.venuesDescription') }}</p>
      </div>
      <button v-if="isEditing" class="ghost" type="button" @click="cancelEdit">{{ $t('common.cancel') }}</button>
    </header>

    <div class="admin-form">
      <h3>{{ isEditing ? $t('admin.editVenue') : $t('admin.createVenue') }}</h3>
      <VenueForm :initial-venue="editingVenue" @submit="handleSubmit" />
    </div>

    <div class="admin-list">
      <header class="section-header">
        <h3>{{ $t('admin.venues') }}</h3>
        <button class="ghost" type="button" @click="fetchVenues">{{ $t('common.refresh') }}</button>
      </header>
      <p v-if="loading">{{ $t('common.loading') }}</p>
      <p v-else-if="error" class="error">{{ error }}</p>
      <p v-else-if="!venues.length" class="empty">{{ $t('admin.noVenues') }}</p>

      <div v-else class="table table-venues">
        <div class="table-row table-header">
          <span>{{ $t('venues.form.name') }}</span>
          <span>{{ $t('venues.form.city') }}</span>
          <span>{{ $t('venues.form.type') }}</span>
          <span>{{ $t('common.actions') }}</span>
        </div>
        <div v-for="venue in venues" :key="venue.id" class="table-row">
          <span>{{ venue.name }}</span>
          <span>{{ venue.city }}</span>
          <span class="badge">{{ venue.type.toUpperCase() }}</span>
          <span class="actions">
            <button class="ghost" type="button" @click="startEdit(venue)">{{ $t('common.edit') }}</button>
            <button class="ghost danger" type="button" @click="deactivateVenue(venue)">{{ $t('common.delete') }}</button>
          </span>
        </div>
      </div>
    </div>
  </section>
</template>
