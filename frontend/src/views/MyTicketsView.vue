<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../api/axios';

const { t } = useI18n();

const tickets = ref([]);
const loading = ref(false);
const error = ref('');

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const fetchTickets = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/api/tickets/my');
    tickets.value = response.data || [];
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  } finally {
    loading.value = false;
  }
};

const pdfUrl = (ticket) => `${apiBase}/uploads/tickets/${ticket.id}.pdf`;

onMounted(fetchTickets);
</script>

<template>
  <section class="page">
    <header class="page-header">
      <h2>{{ $t('tickets.title') }}</h2>
      <button class="ghost" type="button" @click="fetchTickets">{{ $t('common.refresh') }}</button>
    </header>

    <p v-if="loading">{{ $t('common.loading') }}</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="!tickets.length" class="empty">{{ $t('tickets.empty') }}</p>

    <div v-else class="ticket-grid">
      <article v-for="ticket in tickets" :key="ticket.id" class="ticket-card">
        <h3>{{ ticket.event?.title || $t('tickets.unknownEvent') }}</h3>
        <p>{{ $t('tickets.date') }}: {{ new Date(ticket.event?.date || ticket.createdAt).toLocaleString() }}</p>
        <p>{{ $t('tickets.venue') }}: {{ ticket.event?.venue?.name || '—' }}</p>
        <p>{{ $t('tickets.seat') }}: {{ ticket.seat?.label || '—' }} · {{ ticket.seat?.seatType?.name?.toUpperCase() }}</p>
        <p>{{ $t('tickets.price') }}: ${{ Number(ticket.price || 0).toFixed(2) }}</p>
        <a class="primary" :href="pdfUrl(ticket)" target="_blank" rel="noopener">
          {{ $t('tickets.view') }}
        </a>
      </article>
    </div>
  </section>
</template>
