<script setup>
import { computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useEventStore } from '../stores/event';

const route = useRoute();
const router = useRouter();
const eventStore = useEventStore();

const eventId = computed(() => route.params.id);

onMounted(() => {
  eventStore.fetchEvent(eventId.value);
});

const goToSeats = () => {
  router.push(`/events/${eventId.value}/seats`);
};
</script>

<template>
  <section v-if="eventStore.currentEvent" class="page">
    <h2>{{ eventStore.currentEvent.title }}</h2>
    <p>{{ new Date(eventStore.currentEvent.date).toLocaleString() }}</p>
    <p>{{ eventStore.currentEvent.venue?.name }} · {{ eventStore.currentEvent.venue?.city }}</p>
    <p>{{ eventStore.currentEvent.description }}</p>
    <button class="primary" @click="goToSeats">{{ $t('events.selectSeats') }}</button>
  </section>
</template>
