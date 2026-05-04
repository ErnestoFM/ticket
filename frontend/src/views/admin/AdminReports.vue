<script setup>
import { onMounted, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import api from '../../api/axios';
import ReportsDashboard from '../../components/admin/ReportsDashboard.vue';

const { t } = useI18n();

const report = ref({
  salesByEvent: [],
  occupancyByEvent: [],
  revenueByPaymentMethod: [],
});
const loading = ref(false);
const error = ref('');

const fetchReport = async () => {
  loading.value = true;
  error.value = '';
  try {
    const response = await api.get('/api/admin/reports');
    report.value = response.data;
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  } finally {
    loading.value = false;
  }
};

const downloadCsv = async () => {
  try {
    const response = await api.get('/api/admin/reports/export', {
      responseType: 'blob',
    });
    const blob = new Blob([response.data], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'ticketmaster_report.csv';
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    error.value = err.response?.data?.error || t('common.error');
  }
};

onMounted(fetchReport);
</script>

<template>
  <section class="page">
    <header class="page-header">
      <div>
        <h2>{{ $t('admin.reports') }}</h2>
        <p class="muted">{{ $t('admin.reportsDescription') }}</p>
      </div>
      <div class="actions">
        <button class="ghost" type="button" @click="fetchReport">{{ $t('common.refresh') }}</button>
        <button class="primary" type="button" @click="downloadCsv">{{ $t('admin.exportCsv') }}</button>
      </div>
    </header>

    <p v-if="loading">{{ $t('common.loading') }}</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <ReportsDashboard v-else :report="report" />
  </section>
</template>
