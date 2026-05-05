<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../api/axios';

const { t } = useI18n();

const users = ref([]);
const loading = ref(false);
const error = ref('');
const page = ref(1);
const limit = 20;
const pagination = ref({ total: 0, pages: 1 });

const expandedUser = ref(null);
const ticketsByUser = ref({});
const ticketsLoading = ref(false);

const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const fetchUsers = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/api/admin/users', {
      params: { page: page.value, limit },
    });
    users.value = response.data.data || [];
    pagination.value = response.data.pagination || { total: 0, pages: 1 };
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  } finally {
    loading.value = false;
  }
};

const toggleStatus = async (user) => {
  try {
    await api.patch(`/api/admin/users/${user.id}/status`, { isActive: !user.isActive });
    user.isActive = !user.isActive;
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  }
};

const toggleTickets = async (user) => {
  if (expandedUser.value === user.id) {
    expandedUser.value = null;
    return;
  }

  expandedUser.value = user.id;
  if (ticketsByUser.value[user.id]) return;

  ticketsLoading.value = true;
  try {
    const response = await api.get(`/api/admin/users/${user.id}/tickets`);
    ticketsByUser.value[user.id] = response.data || [];
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  } finally {
    ticketsLoading.value = false;
  }
};

const pdfUrl = (ticket) => `${apiBase}/uploads/tickets/${ticket.id}.pdf`;

const nextPage = async () => {
  if (page.value < pagination.value.pages) {
    page.value += 1;
    await fetchUsers();
  }
};

const prevPage = async () => {
  if (page.value > 1) {
    page.value -= 1;
    await fetchUsers();
  }
};

onMounted(fetchUsers);
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div>
        <h2>{{ $t('admin.users') }}</h2>
        <p class="muted">{{ $t('admin.usersDescription') }}</p>
      </div>
      <button class="ghost" type="button" @click="fetchUsers">{{ $t('common.refresh') }}</button>
    </header>

    <p v-if="loading">{{ $t('common.loading') }}</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="!users.length" class="empty">{{ $t('admin.noUsers') }}</p>

    <div v-else class="table table-users">
      <div class="table-row table-header">
        <span>{{ $t('auth.curp') }}</span>
        <span>{{ $t('admin.phone') }}</span>
        <span>{{ $t('admin.role') }}</span>
        <span>{{ $t('admin.status') }}</span>
        <span>{{ $t('common.actions') }}</span>
      </div>
      <div v-for="user in users" :key="user.id" class="table-row">
        <span>{{ user.curp }}</span>
        <span>{{ user.phone }}</span>
        <span>{{ user.role }}</span>
        <span class="badge" :class="user.isActive ? 'status-active' : 'status-inactive'">
          {{ user.isActive ? $t('admin.active') : $t('admin.inactive') }}
        </span>
        <span class="actions">
          <button class="ghost" type="button" @click="toggleStatus(user)">
            {{ user.isActive ? $t('admin.deactivate') : $t('admin.activate') }}
          </button>
          <button class="ghost" type="button" @click="toggleTickets(user)">
            {{ expandedUser === user.id ? $t('admin.hideTickets') : $t('admin.viewTickets') }}
          </button>
        </span>
      </div>
      <div v-if="expandedUser" class="table-row expanded">
        <div class="tickets-panel">
          <p v-if="ticketsLoading">{{ $t('common.loading') }}</p>
          <p v-else-if="!ticketsByUser[expandedUser]?.length" class="empty">{{ $t('admin.noTickets') }}</p>
          <ul v-else>
            <li v-for="ticket in ticketsByUser[expandedUser]" :key="ticket.id">
              {{ ticket.event?.title }} · {{ ticket.seat?.label }} · ${{ Number(ticket.price || 0).toFixed(2) }}
              <a :href="pdfUrl(ticket)" target="_blank" rel="noopener">{{ $t('tickets.view') }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <div class="pagination">
      <button class="ghost" type="button" :disabled="page <= 1" @click="prevPage">{{ $t('common.back') }}</button>
      <span>{{ page }} / {{ pagination.pages }}</span>
      <button class="ghost" type="button" :disabled="page >= pagination.pages" @click="nextPage">{{ $t('common.next') }}</button>
    </div>
  </section>
</template>
