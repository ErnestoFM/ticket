<script setup>
import { onMounted } from 'vue';
import { useEventStore } from '../stores/event';
import EventCard from '../components/events/EventCard.vue';

const eventStore = useEventStore();

onMounted(() => {
  eventStore.fetchEvents();
});
</script>

<template>
  <section class="page">
    <h2>{{ $t('events.title') }}</h2>
    <div v-if="eventStore.loading">{{ $t('common.loading') }}</div>
    <div class="event-grid">
      <EventCard v-for="event in eventStore.events" :key="event.id" :event="event" />
    </div>
  </section>
</template>
