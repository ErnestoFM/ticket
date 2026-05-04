<script setup>
const props = defineProps({
  report: {
    type: Object,
    default: () => ({
      salesByEvent: [],
      occupancyByEvent: [],
      revenueByPaymentMethod: [],
    }),
  },
});
</script>

<template>
  <div class="reports-grid">
    <section>
      <h3>{{ $t('admin.totalSales') }}</h3>
      <ul>
        <li v-for="sale in report.salesByEvent" :key="sale.eventId">
          {{ sale.title }} · {{ sale.tickets }} boletos · ${{ sale.revenue.toFixed(2) }}
        </li>
      </ul>
    </section>
    <section>
      <h3>{{ $t('admin.occupancy') }}</h3>
      <ul>
        <li v-for="item in report.occupancyByEvent" :key="item.eventId">
          {{ item.title }} · {{ item.occupancy }}% ({{ item.soldSeats }}/{{ item.totalSeats }})
        </li>
      </ul>
    </section>
    <section>
      <h3>{{ $t('admin.paymentMethods') }}</h3>
      <ul>
        <li v-for="item in report.revenueByPaymentMethod" :key="item.paymentMethod">
          {{ item.paymentMethod.toUpperCase() }} · {{ item.tickets }} · ${{ item.revenue.toFixed(2) }}
        </li>
      </ul>
    </section>
  </div>
</template>
