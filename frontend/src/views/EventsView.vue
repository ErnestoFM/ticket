<script setup>
import { computed, onMounted, ref, watch } from 'vue';
import { useEventStore } from '../stores/event';
import { useRoute } from 'vue-router';
import EventCard from '../components/events/EventCard.vue';

const eventStore = useEventStore();
const route = useRoute();

const searchQuery = ref('');
const filterType = ref('');

onMounted(() => {
  eventStore.fetchEvents();
  if (route.query.type) {
    filterType.value = route.query.type;
  }
});

watch(() => route.query.type, (newType) => {
  if (newType) {
    filterType.value = newType;
  } else {
    filterType.value = '';
  }
});

const filteredEvents = computed(() => {
  return eventStore.events.filter(event => {
    const matchesSearch = event.title.toLowerCase().includes(searchQuery.value.toLowerCase()) || 
                          (event.description && event.description.toLowerCase().includes(searchQuery.value.toLowerCase()));
    const matchesType = filterType.value ? event.type === filterType.value : true;
    return matchesSearch && matchesType;
  });
});
</script>

<template>
  <section class="page">
    <div class="events-header-container">
      <h2>{{ $t('events.title') }}</h2>
      <div class="filters">
        <input v-model="searchQuery" type="text" placeholder="Buscar eventos..." class="search-input" />
        <select v-model="filterType" class="type-select">
          <option value="">Todos los tipos</option>
          <option value="teatro">Teatro</option>
          <option value="cine">Cine</option>
          <option value="museo">Museo</option>
        </select>
      </div>
    </div>
    
    <div v-if="eventStore.loading" class="loading">{{ $t('common.loading') }}</div>
    
    <div class="event-grid" v-if="!eventStore.loading && filteredEvents.length > 0">
      <EventCard v-for="event in filteredEvents" :key="event.id" :event="event" />
    </div>
    
    <div v-else-if="!eventStore.loading && filteredEvents.length === 0" class="no-results">
      <p>No se encontraron eventos con esos filtros.</p>
    </div>
  </section>
</template>

<style scoped>
.events-header-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;
  margin-bottom: 24px;
}
.filters {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}
.search-input {
  min-width: 250px;
}
.type-select {
  min-width: 150px;
}
.no-results {
  text-align: center;
  padding: 60px 20px;
  background: var(--surface-glass);
  border-radius: var(--radius-md);
  border: 1px solid var(--border);
  color: var(--muted);
  width: 100%;
}
.loading {
  text-align: center;
  padding: 40px;
}
@media (max-width: 600px) {
  .events-header-container {
    flex-direction: column;
    align-items: stretch;
  }
  .filters {
    flex-direction: column;
  }
}
</style>
