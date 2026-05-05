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

const resending = ref({});

const resendWhatsapp = async (ticket) => {
  resending.value[ticket.id] = true;
  try {
    await api.post(`/api/tickets/${ticket.id}/resend-whatsapp`);
    alert('Boleto reenviado por WhatsApp exitosamente');
  } catch (err) {
    alert(err.response?.data?.error || 'Error al reenviar el boleto por WhatsApp');
  } finally {
    resending.value[ticket.id] = false;
  }
};

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
        <div class="ticket-actions">
          <a class="primary" :href="pdfUrl(ticket)" target="_blank" rel="noopener">
            {{ $t('tickets.view') }}
          </a>
          <button class="whatsapp-btn" @click="resendWhatsapp(ticket)" :disabled="resending[ticket.id]">
            {{ resending[ticket.id] ? 'Enviando...' : 'Reenviar WhatsApp' }}
          </button>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.ticket-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
}
.whatsapp-btn {
  background-color: #25D366;
  color: white;
  border: none;
  padding: 0.8rem 1.5rem;
  border-radius: var(--radius-sm);
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.3s;
}
.whatsapp-btn:hover {
  opacity: 0.9;
}
.whatsapp-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
